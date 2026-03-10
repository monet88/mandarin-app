// Renders questions for one exam section (listening / reading / writing)
import { Colors } from "@/constants/theme";
import { ExamSection, QuestionBankRow, SectionAnswers } from "@/lib/hsk-exam";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";

interface Props {
  section: ExamSection;
  questions: QuestionBankRow[];
  answers: SectionAnswers;
  onAnswer: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export default function HskExamSection({
  section,
  questions,
  answers,
  onAnswer,
  onSubmit,
  submitting,
}: Props) {
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>{SECTION_LABELS[section]}</Text>

      {questions.map((q, idx) => (
        <QuestionCard
          key={q.id}
          index={idx + 1}
          question={q}
          selected={answers[q.id] as string | undefined}
          onAnswer={(ans) => onAnswer(q.id, ans)}
        />
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, (!allAnswered || submitting) && styles.submitBtnDisabled]}
        onPress={onSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? "Submitting…" : `Submit ${SECTION_LABELS[section]}`}
        </Text>
      </TouchableOpacity>

      <Text style={styles.progressNote}>
        {answeredCount} / {questions.length} answered
      </Text>
    </ScrollView>
  );
}

const SECTION_LABELS: Record<ExamSection, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
};

// --- Sub-component: single question card ---
interface CardProps {
  index: number;
  question: QuestionBankRow;
  selected: string | undefined;
  onAnswer: (ans: string) => void;
}

function QuestionCard({ index, question, selected, onAnswer }: CardProps) {
  const data = question.question_data as {
    text?: string;
    prompt?: string;
    options?: string[];
    answer?: string;
  };

  const isWriting = question.section === "writing";
  const isMC = Array.isArray(data.options) && data.options.length > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.questionNum}>Q{index}</Text>
      {(data.text || data.prompt) && (
        <Text style={styles.questionText}>{data.text ?? data.prompt}</Text>
      )}

      {isWriting ? (
        <TextInput
          style={styles.writingInput}
          multiline
          placeholder="Write your answer in Chinese…"
          placeholderTextColor={Colors.subduedTextColor}
          value={(selected as string) ?? ""}
          onChangeText={onAnswer}
          maxLength={500}
        />
      ) : isMC ? (
        <View style={styles.optionsContainer}>
          {(data.options as string[]).map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.option, selected === opt && styles.optionSelected]}
              onPress={() => onAnswer(opt)}
            >
              <Text style={[styles.optionText, selected === opt && styles.optionTextSelected]}>
                {String.fromCharCode(65 + i)}. {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TextInput
          style={styles.shortInput}
          placeholder="Type your answer…"
          placeholderTextColor={Colors.subduedTextColor}
          value={(selected as string) ?? ""}
          onChangeText={onAnswer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  questionNum: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.subduedTextColor,
    marginBottom: 6,
  },
  questionText: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 24,
    marginBottom: 12,
  },
  optionsContainer: { gap: 8 },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: "#f9fafb",
  },
  optionSelected: {
    borderColor: Colors.primaryAccentColor,
    backgroundColor: "#fff5f0",
  },
  optionText: { fontSize: 15, color: "#374151" },
  optionTextSelected: { color: Colors.primaryAccentColor, fontWeight: "600" },
  shortInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: "#111827",
  },
  writingInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: "#111827",
    minHeight: 120,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  progressNote: {
    textAlign: "center",
    color: Colors.subduedTextColor,
    fontSize: 13,
    marginTop: 10,
  },
});
