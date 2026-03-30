// Structured results screen with score breakdown and review mode toggle
import { Colors } from "@/constants/theme";
import { ExamScores, QuestionBankRow, SectionAnswers, WritingRubric } from "@/lib/hsk-exam";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import HskWritingFeedback from "./HskWritingFeedback";

interface Props {
  scores: ExamScores;
  hskLevel: number;
  questions: QuestionBankRow[];
  answers: SectionAnswers;
  answerKey: Record<string, string>;
  writingRubric: WritingRubric | null;
  writingFallback: boolean;
  writingLoading: boolean;
  onClose: () => void;
}

const SECTION_ORDER = ["listening", "reading", "writing"] as const;
const SECTION_LABELS: Record<string, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
};

export default function HskExamResults({
  scores,
  hskLevel,
  questions,
  answers,
  answerKey,
  writingRubric,
  writingFallback,
  writingLoading,
  onClose,
}: Props) {
  const sectionScores = [
    { key: "listening", score: scores.listening },
    { key: "reading", score: scores.reading },
    { key: "writing", score: scores.writing },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.levelBadge}>HSK {hskLevel}</Text>
        <Text style={[styles.verdict, scores.passed ? styles.pass : styles.fail]}>
          {scores.passed ? "Passed" : "Not Passed"}
        </Text>
        <Text style={styles.totalScore}>{scores.total}</Text>
        <Text style={styles.totalLabel}>out of 100</Text>
      </View>

      {/* Section breakdown */}
      <View style={styles.sectionGrid}>
        {sectionScores.map((s) => (
          <View key={s.key} style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>{SECTION_LABELS[s.key]}</Text>
            <Text style={[styles.sectionScore, s.score >= 60 && styles.pass]}>{s.score}</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${s.score}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Writing feedback */}
      <HskWritingFeedback
        rubric={writingRubric}
        isFallback={writingFallback}
        loading={writingLoading}
      />

      {/* Review section */}
      {questions.length > 0 && (
        <ReviewSection questions={questions} answers={answers} answerKey={answerKey} />
      )}

      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- Review mode: shows submitted answers ---
function ReviewSection({
  questions,
  answers,
  answerKey,
}: {
  questions: QuestionBankRow[];
  answers: SectionAnswers;
  answerKey: Record<string, string>;
}) {
  return (
    <View style={styles.reviewContainer}>
      <Text style={styles.reviewHeading}>Review Your Answers</Text>
      {SECTION_ORDER.map((section) => {
        const sectionQs = questions.filter((q) => q.section === section);
        if (sectionQs.length === 0) return null;
        return (
          <View key={section}>
            <Text style={styles.reviewSectionTitle}>{SECTION_LABELS[section]}</Text>
            {sectionQs.map((q, i) => {
              const data = q.question_data as {
                text?: string;
                prompt?: string;
                answer?: string;
                correct_answer?: string;
              };
              const submitted = answers[q.id];
              const correct = answerKey[q.id] ?? data.correct_answer ?? data.answer;
              const isCorrect = submitted !== undefined && correct !== undefined && String(submitted) === String(correct);
              return (
                <View key={q.id} style={styles.reviewCard}>
                  <Text style={styles.reviewQNum}>Q{i + 1}</Text>
                  <Text style={styles.reviewQText} numberOfLines={2}>
                    {data.text ?? data.prompt ?? "—"}
                  </Text>
                  <View style={styles.reviewAnswerRow}>
                    <Text style={styles.reviewAnswerLabel}>Your answer: </Text>
                    <Text style={[styles.reviewAnswer, isCorrect ? styles.correct : styles.wrong]}>
                      {submitted !== undefined ? String(submitted) : "No answer"}
                    </Text>
                  </View>
                  {!isCorrect && correct && (
                    <Text style={styles.correctAnswer}>Correct: {correct}</Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  header: { alignItems: "center", marginBottom: 24 },
  levelBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryAccentColor,
    backgroundColor: "#fff5f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    overflow: "hidden",
  },
  verdict: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  pass: { color: "#16a34a" },
  fail: { color: Colors.primaryAccentColor },
  totalScore: { fontSize: 56, fontWeight: "700", color: "#111827", lineHeight: 64 },
  totalLabel: { fontSize: 14, color: Colors.subduedTextColor },
  sectionGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
  sectionCard: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 10, padding: 12 },
  sectionLabel: { fontSize: 11, color: Colors.subduedTextColor, marginBottom: 4, textTransform: "uppercase" },
  sectionScore: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 6 },
  barBg: { height: 4, backgroundColor: "#e5e7eb", borderRadius: 2 },
  barFill: { height: 4, backgroundColor: Colors.primaryAccentColor, borderRadius: 2 },
  reviewContainer: { marginTop: 24 },
  reviewHeading: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  reviewSectionTitle: { fontSize: 13, fontWeight: "600", color: Colors.subduedTextColor, marginBottom: 8, textTransform: "uppercase" },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  reviewQNum: { fontSize: 11, color: Colors.subduedTextColor, marginBottom: 2 },
  reviewQText: { fontSize: 14, color: "#374151", marginBottom: 6 },
  reviewAnswerRow: { flexDirection: "row", alignItems: "center" },
  reviewAnswerLabel: { fontSize: 13, color: Colors.subduedTextColor },
  reviewAnswer: { fontSize: 13, fontWeight: "600" },
  correct: { color: "#16a34a" },
  wrong: { color: Colors.primaryAccentColor },
  correctAnswer: { fontSize: 12, color: "#16a34a", marginTop: 4 },
  closeBtn: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  closeBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
