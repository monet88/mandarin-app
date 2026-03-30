// Safe rendering of writing rubric — handles fallback gracefully
import { Colors } from "@/constants/theme";
import { WritingRubric } from "@/lib/hsk-exam";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  rubric: WritingRubric | null;
  isFallback?: boolean;
  loading?: boolean;
}

export default function HskWritingFeedback({ rubric, isFallback, loading }: Props) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Evaluating writing…</Text>
      </View>
    );
  }

  if (!rubric || isFallback) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackBanner}>
          <Text style={styles.fallbackText}>
            Writing evaluation is temporarily unavailable. Your submission was recorded.
          </Text>
        </View>
      </View>
    );
  }

  const dimensions: Array<{ label: string; score: number; key: keyof WritingRubric }> = [
    { label: "Content", score: rubric.content_score, key: "content_score" },
    { label: "Grammar", score: rubric.grammar_score, key: "grammar_score" },
    { label: "Vocabulary", score: rubric.vocabulary_score, key: "vocabulary_score" },
    { label: "Structure", score: rubric.structure_score, key: "structure_score" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Writing Feedback</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Score</Text>
        <Text style={[styles.totalScore, rubric.total_score >= 60 && styles.pass]}>
          {rubric.total_score} / 100
        </Text>
      </View>

      <View style={styles.grid}>
        {dimensions.map((d) => (
          <ScorePill key={d.key} label={d.label} score={d.score} max={25} />
        ))}
      </View>

      <Text style={styles.feedbackHeading}>Feedback</Text>
      <Text style={styles.feedbackText}>{rubric.feedback}</Text>

      {rubric.corrections.length > 0 && (
        <>
          <Text style={styles.feedbackHeading}>Corrections</Text>
          {rubric.corrections.map((c, i) => (
            <Text key={i} style={styles.correction}>
              • {c}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

function ScorePill({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillScore}>
        {score}/{max}
      </Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  loadingText: { color: Colors.subduedTextColor, textAlign: "center", padding: 16 },
  fallbackBanner: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  fallbackText: { color: "#92400e", fontSize: 14, lineHeight: 20 },
  heading: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  totalLabel: { fontSize: 14, color: Colors.subduedTextColor },
  totalScore: { fontSize: 22, fontWeight: "700", color: "#111827" },
  pass: { color: "#16a34a" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  pill: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  pillLabel: { fontSize: 12, color: Colors.subduedTextColor, marginBottom: 2 },
  pillScore: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  barBg: { height: 4, backgroundColor: "#e5e7eb", borderRadius: 2 },
  barFill: { height: 4, backgroundColor: Colors.primaryAccentColor, borderRadius: 2 },
  feedbackHeading: { fontSize: 14, fontWeight: "600", color: "#374151", marginTop: 12, marginBottom: 4 },
  feedbackText: { fontSize: 14, color: "#4b5563", lineHeight: 22 },
  correction: { fontSize: 13, color: "#4b5563", lineHeight: 20, marginTop: 2 },
});
