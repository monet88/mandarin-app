/**
 * HskReviewQueue.tsx
 * Flashcard session UI driven by the local SM-2 review queue.
 * Shows one card at a time; user rates after reveal; advances on submit.
 * Calls onComplete when queue is empty.
 */

import { HskWordCard } from "@/components/hsk/HskWordCard";
import { ThemedText } from "@/components/themed-text";
import { HskWord } from "@/constants/hsk-data";
import { Colors } from "@/constants/theme";
import { ReviewQuality, WordReviewState } from "@/lib/hsk-review";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  /** Due review states for this session */
  dueStates: WordReviewState[];
  /** Full word list to look up card content by word_id */
  words: HskWord[];
  onRate: (word_id: string, quality: ReviewQuality) => void;
  onComplete: () => void;
  onExit: () => void;
}

export function HskReviewQueue({
  dueStates,
  words,
  onRate,
  onComplete,
  onExit,
}: Props) {
  const wordMap = React.useMemo(
    () => Object.fromEntries(words.map((w) => [w.word_id, w])),
    [words],
  );

  // Session is driven by dueStates from parent — first item is always current
  const currentState = dueStates[0];
  const remaining = dueStates.length;

  if (remaining === 0) {
    return (
      <View style={styles.doneContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
        <ThemedText style={styles.doneTitle}>Session complete!</ThemedText>
        <ThemedText style={styles.doneSubtitle}>
          No more words due right now.
        </ThemedText>
        <Pressable style={styles.doneButton} onPress={onComplete}>
          <ThemedText style={styles.doneButtonText}>Back to Level</ThemedText>
        </Pressable>
      </View>
    );
  }

  const currentWord = wordMap[currentState.word_id];

  // Auto-skip orphan words (word_id in queue but missing from word bundle).
  // Must use useEffect — calling onRate during render violates React rules and
  // can cause double-fire loops while the async queue update propagates.
  const skippingRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!currentState || currentWord) {
      skippingRef.current = null;
      return;
    }
    if (skippingRef.current !== currentState.word_id) {
      skippingRef.current = currentState.word_id;
      onRate(currentState.word_id, 2);
    }
  }, [currentState, currentWord, onRate]);

  if (!currentWord) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Progress header */}
      <View style={styles.header}>
        <Pressable onPress={onExit} style={styles.exitButton}>
          <Ionicons name="close" size={22} color={Colors.subduedTextColor} />
        </Pressable>
        <ThemedText style={styles.progressText}>
          {remaining} left in queue
        </ThemedText>
        <View style={styles.exitButton} />
      </View>

      {/* Progress track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              // Fill grows as queue shrinks — assume session started with at least 1
              width: `${Math.max(5, 100 - (remaining / Math.max(remaining, 1)) * 100)}%`,
            },
          ]}
        />
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <HskWordCard
          word={currentWord}
          onRate={(quality) => onRate(currentState.word_id, quality)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  exitButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.subduedTextColor,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 2,
  },
  cardContainer: {
    paddingHorizontal: 16,
  },
  doneContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  doneSubtitle: {
    fontSize: 15,
    color: Colors.subduedTextColor,
    textAlign: "center",
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  doneButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
