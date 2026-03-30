/**
 * HskWordCard.tsx
 * Flashcard-style component for a single HSK word.
 * Front shows Hanzi + Pinyin; tap reveals English + POS.
 * Rating buttons (forgot/hard/good/easy) appear after reveal.
 */

import { ThemedText } from "@/components/themed-text";
import { HskWord } from "@/constants/hsk-data";
import { Colors } from "@/constants/theme";
import { ReviewQuality } from "@/lib/hsk-review";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  word: HskWord;
  onRate: (quality: ReviewQuality) => void;
}

const RATINGS: { label: string; quality: ReviewQuality; color: string }[] = [
  { label: "Forgot", quality: 0, color: "#ef4444" },
  { label: "Hard", quality: 1, color: "#f97316" },
  { label: "Good", quality: 2, color: "#22c55e" },
  { label: "Easy", quality: 3, color: "#3b82f6" },
];

const POS_LABELS: Record<string, string> = {
  n: "noun", v: "verb", adj: "adjective", adv: "adverb",
  prep: "preposition", conj: "conjunction", part: "particle",
  pron: "pronoun", num: "numeral", m: "measure word",
  aux: "auxiliary", expr: "expression", interj: "interjection",
};

export function HskWordCard({ word, onRate }: Props) {
  const [revealed, setRevealed] = useState(false);

  const handleRate = (quality: ReviewQuality) => {
    setRevealed(false); // reset for next card
    onRate(quality);
  };

  return (
    <View style={styles.card}>
      {/* Front: always visible */}
      <View style={styles.front}>
        <ThemedText style={styles.hanzi}>{word.hanzi}</ThemedText>
        <ThemedText style={styles.pinyin}>{word.pinyin}</ThemedText>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Back: revealed on tap */}
      {revealed ? (
        <View style={styles.back}>
          <ThemedText style={styles.english}>{word.english}</ThemedText>
          <ThemedText style={styles.pos}>
            {POS_LABELS[word.pos] ?? word.pos}
          </ThemedText>

          <View style={styles.ratingRow}>
            {RATINGS.map((r) => (
              <Pressable
                key={r.quality}
                style={[styles.ratingButton, { borderColor: r.color }]}
                onPress={() => handleRate(r.quality)}
              >
                <ThemedText style={[styles.ratingLabel, { color: r.color }]}>
                  {r.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Pressable style={styles.revealButton} onPress={() => setRevealed(true)}>
          <Ionicons name="eye-outline" size={20} color={Colors.subduedTextColor} />
          <ThemedText style={styles.revealText}>Tap to reveal</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 260,
    justifyContent: "space-between",
  },
  front: {
    alignItems: "center",
    gap: 8,
  },
  hanzi: {
    fontSize: 52,
    fontWeight: "700",
    letterSpacing: 4,
  },
  pinyin: {
    fontSize: 20,
    color: Colors.primaryAccentColor,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderColor,
    marginVertical: 16,
  },
  back: {
    alignItems: "center",
    gap: 6,
  },
  english: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  pos: {
    fontSize: 13,
    color: Colors.subduedTextColor,
    fontStyle: "italic",
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  ratingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  revealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  revealText: {
    fontSize: 15,
    color: Colors.subduedTextColor,
  },
});
