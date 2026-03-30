/**
 * HskLevelCard.tsx
 * Tap-able card for one HSK level on the landing screen.
 * Shows level name, word count, progress bar (if any), and coming-soon badge.
 */

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { HskManifestLevel, Hsk79Summary } from "@/constants/hsk-data";
import { HskProgressRow } from "@/lib/hsk-session";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

// ── Available level card ──────────────────────────────────────────────────

interface AvailableProps {
  level: HskManifestLevel;
  progress: HskProgressRow | undefined;
  onPress: () => void;
}

export function HskLevelCard({ level, progress, onPress }: AvailableProps) {
  const learned = progress?.words_learned ?? 0;
  const pct = Math.min(1, learned / level.word_count);
  const pctLabel = Math.round(pct * 100);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.levelBadge}>
          <ThemedText style={styles.levelNumber}>{level.level}</ThemedText>
        </View>
      </View>
      <View style={styles.body}>
        <ThemedText style={styles.levelName}>{level.level_name}</ThemedText>
        <ThemedText style={styles.wordCount}>
          {level.word_count} words
        </ThemedText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pctLabel}%` }]} />
        </View>
        <ThemedText style={styles.progressLabel}>
          {learned}/{level.word_count} learned
        </ThemedText>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={Colors.subduedTextColor}
      />
    </Pressable>
  );
}

// ── Coming Soon card ──────────────────────────────────────────────────────

interface ComingSoonProps {
  summary: Hsk79Summary;
}

export function HskComingSoonCard({ summary }: ComingSoonProps) {
  return (
    <View style={[styles.card, styles.cardDisabled]}>
      <View style={styles.left}>
        <View style={[styles.levelBadge, styles.levelBadgeDisabled]}>
          <ThemedText style={[styles.levelNumber, styles.levelNumberDisabled]}>
            7-9
          </ThemedText>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <ThemedText style={[styles.levelName, styles.textDisabled]}>
            {summary.level_name}
          </ThemedText>
          <View style={styles.soonBadge}>
            <ThemedText style={styles.soonText}>Coming Soon</ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.wordCount, styles.textDisabled]}>
          ~{summary.word_count_estimate.toLocaleString()} words
        </ThemedText>
        <ThemedText style={styles.comingSoonDesc} numberOfLines={2}>
          {summary.description}
        </ThemedText>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  left: {
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryAccentColor,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadgeDisabled: {
    backgroundColor: Colors.subduedTextColor,
  },
  levelNumber: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  levelNumberDisabled: {
    fontSize: 13,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelName: {
    fontSize: 17,
    fontWeight: "700",
  },
  textDisabled: {
    color: Colors.subduedTextColor,
  },
  wordCount: {
    fontSize: 13,
    color: Colors.subduedTextColor,
  },
  progressTrack: {
    height: 5,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.subduedTextColor,
  },
  soonBadge: {
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.subduedTextColor,
  },
  comingSoonDesc: {
    fontSize: 12,
    color: Colors.subduedTextColor,
    lineHeight: 17,
    marginTop: 2,
  },
});
