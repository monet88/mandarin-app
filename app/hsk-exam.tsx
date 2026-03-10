// HSK Mock Exam screen — server-timed, section-by-section, with audio preload and AppState interruption
import HskExamResults from "@/components/hsk/HskExamResults";
import HskExamSection from "@/components/hsk/HskExamSection";
import HskExamTimer from "@/components/hsk/HskExamTimer";
import { Colors } from "@/constants/theme";
import {
  AudioManifest,
  ExamScores,
  ExamSection,
  ExamSession,
  QuestionBankRow,
  SectionAnswers,
  SECTIONS,
  WritingRubric,
  evaluateWriting,
  fetchQuestions,
  questionsForSection,
  startExamSession,
  submitSection,
} from "@/lib/hsk-exam";
import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

type ScreenState = "loading" | "preload" | "exam" | "results" | "error";

const BACKGROUND_INTERRUPT_MS = 15_000;

export default function HskExamScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const hskLevel = Number(level ?? "1");
  const router = useRouter();

  const [screen, setScreen] = useState<ScreenState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<QuestionBankRow[]>([]);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<SectionAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<ExamScores | null>(null);
  const [preloadProgress, setPreloadProgress] = useState(0);

  // Writing evaluation state
  const [writingRubric, setWritingRubric] = useState<WritingRubric | null>(null);
  const [writingFallback, setWritingFallback] = useState(false);
  const [writingLoading, setWritingLoading] = useState(false);

  // AppState interruption tracking
  const backgroundedAt = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const screenRef = useRef<ScreenState>("loading");
  const sessionRef = useRef<ExamSession | null>(null);
  const questionsRef = useRef<QuestionBankRow[]>([]);
  const answersRef = useRef<SectionAnswers>({});
  const sectionIdxRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { sectionIdxRef.current = sectionIdx; }, [sectionIdx]);

  const preloadAudio = useCallback(async (manifests: AudioManifest[]) => {
    let loaded = 0;
    for (const m of manifests) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: m.storage_path }, { shouldPlay: false });
        await sound.unloadAsync(); // just verify it loads; don't hold in memory
      } catch {
        // Non-fatal — continue
      }
      loaded++;
      setPreloadProgress(Math.round((loaded / manifests.length) * 100));
    }
  }, []);

  const initExam = useCallback(async () => {
    try {
      setScreen("loading");
      const sess = await startExamSession(hskLevel);
      setSession(sess);

      const allQs = await fetchQuestions(sess.question_ids);
      setQuestions(allQs);

      // Preload listening audio if manifests exist
      if (sess.audio_manifests.length > 0) {
        setScreen("preload");
        await preloadAudio(sess.audio_manifests);
      }

      setScreen("exam");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start exam";
      setErrorMsg(msg);
      setScreen("error");
    }
  }, [hskLevel, preloadAudio]);

  function handleAppStateChange(nextState: AppStateStatus) {
    const prev = appStateRef.current;
    appStateRef.current = nextState;

    if (prev === "active" && nextState !== "active") {
      backgroundedAt.current = Date.now();
    } else if (nextState === "active" && backgroundedAt.current !== null) {
      const elapsed = Date.now() - backgroundedAt.current;
      backgroundedAt.current = null;
      if (
        elapsed > BACKGROUND_INTERRUPT_MS &&
        sessionRef.current &&
        screenRef.current === "exam"
      ) {
        handleAutoSubmit();
      }
    }
  }

  // Start exam on mount
  useEffect(() => {
    void initExam();
  }, [initExam]);

  // AppState listener for background interruption
  useEffect(() => {
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);

  async function handleAutoSubmit() {
    const sess = sessionRef.current;
    if (!sess) return;
    const currentSection = SECTIONS[sectionIdxRef.current];
    toast("Auto-submitting due to background interruption");
    await doSubmitSection(sess.session_id, currentSection, answersRef.current, true);
  }

  function handleAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  async function handleSectionSubmit() {
    if (!session || submitting) return;
    const section = SECTIONS[sectionIdx];
    setSubmitting(true);
    await doSubmitSection(session.session_id, section, answers, false);
    setSubmitting(false);
  }

  async function doSubmitSection(
    sessionId: string,
    section: ExamSection,
    currentAnswers: SectionAnswers,
    isInterruption: boolean,
  ) {
    try {
      const activeSession = sessionRef.current;
      const sectionAnswers: SectionAnswers = {};
      const sectionQIds = activeSession
        ? questionsForSection(activeSession.question_ids, section)
        : [];
      for (const qid of sectionQIds) {
        if (currentAnswers[qid] !== undefined) sectionAnswers[qid] = currentAnswers[qid];
      }

      const result = await submitSection(sessionId, section, sectionAnswers, isInterruption);

      if (result.status === "submitted" && result.scores) {
        setScores(result.scores);
        await triggerWritingEval(currentAnswers);
        setScreen("results");
      } else {
        // Advance to next section
        const next = sectionIdxRef.current + 1;
        if (next < SECTIONS.length) {
          setSectionIdx(next);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast(msg);
    }
  }

  async function triggerWritingEval(currentAnswers: SectionAnswers) {
    const activeSession = sessionRef.current;
    const activeQuestions = questionsRef.current;
    if (!activeSession) return;

    const writingQIds = questionsForSection(activeSession.question_ids, "writing");
    const writingQ = activeQuestions.find(
      (q) => writingQIds.includes(q.id) && q.section === "writing",
    );
    if (!writingQ) return;

    const writingText = writingQIds
      .map((id) => currentAnswers[id])
      .filter(Boolean)
      .join("\n");
    if (!writingText.trim()) return;

    const promptText = (writingQ.question_data as { text?: string; prompt?: string }).text ??
      (writingQ.question_data as { text?: string; prompt?: string }).prompt ?? "";

    setWritingLoading(true);
    try {
      const { rubric, fallback } = await evaluateWriting(writingText, promptText, hskLevel);
      setWritingRubric(rubric);
      setWritingFallback(fallback);
    } catch {
      setWritingFallback(true);
    } finally {
      setWritingLoading(false);
    }
  }

  function handleTimerExpire() {
    if (session) handleAutoSubmit();
  }

  const currentSection = SECTIONS[sectionIdx] as ExamSection;
  const currentDeadline = session?.section_deadlines[currentSection] ?? session?.expires_at ?? "";
  const currentQIds = session ? questionsForSection(session.question_ids, currentSection) : [];
  const currentQuestions = questions.filter((q) => currentQIds.includes(q.id));

  // --- Render states ---
  if (screen === "loading") {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primaryAccentColor} />
        <Text style={styles.loadingText}>Preparing exam…</Text>
      </SafeAreaView>
    );
  }

  if (screen === "preload") {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.preloadTitle}>Loading Audio</Text>
        <Text style={styles.preloadSub}>Preparing listening section assets…</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${preloadProgress}%` }]} />
        </View>
        <Text style={styles.preloadPct}>{preloadProgress}%</Text>
      </SafeAreaView>
    );
  }

  if (screen === "error") {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Could not start exam</Text>
        <Text style={styles.errorMsg}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={initExam}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screen === "results" && scores) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <HskExamResults
          scores={scores}
          hskLevel={hskLevel}
          questions={questions}
          answers={answers}
          writingRubric={writingRubric}
          writingFallback={writingFallback}
          writingLoading={writingLoading}
          onClose={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.sectionIndicator}>
          {sectionIdx + 1} / {SECTIONS.length} — {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
        </Text>
        {currentDeadline ? (
          <HskExamTimer deadlineIso={currentDeadline} onExpire={handleTimerExpire} />
        ) : null}
      </View>

      <HskExamSection
        section={currentSection}
        questions={currentQuestions}
        answers={answers}
        onAnswer={handleAnswer}
        onSubmit={handleSectionSubmit}
        submitting={submitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  sectionIndicator: { fontSize: 14, fontWeight: "600", color: "#374151" },
  loadingText: { marginTop: 12, color: Colors.subduedTextColor, fontSize: 14 },
  preloadTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 },
  preloadSub: { fontSize: 14, color: Colors.subduedTextColor, marginBottom: 24 },
  progressBarBg: {
    width: "80%",
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: { height: 8, backgroundColor: Colors.primaryAccentColor, borderRadius: 4 },
  preloadPct: { marginTop: 8, fontSize: 13, color: Colors.subduedTextColor },
  errorTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 },
  errorMsg: { fontSize: 14, color: Colors.subduedTextColor, textAlign: "center", marginBottom: 24 },
  retryBtn: {
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backLink: { color: Colors.subduedTextColor, fontSize: 14 },
});
