/**
 * hsk-level.tsx
 * Level detail screen for a single HSK level.
 * Shows vocab count, server-backed progress, and study/exam entry points.
 * Paywall is triggered only at premium actions, not on discovery.
 */

import { HskLockedState } from "@/components/hsk/HskLockedState";
import { Paywall } from "@/components/subscription/Paywall";
import { ThemedText } from "@/components/themed-text";
import { HSK_MANIFEST, HskManifestLevel } from "@/constants/hsk-data";
import { Colors } from "@/constants/theme";
import { useHskSession } from "@/hooks/useHskSession";
import { getProgressForLevel, isExamQuotaExhausted } from "@/lib/hsk-session";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HskLevelScreen() {
  const { level: levelParam } = useLocalSearchParams<{ level: string }>();
  const levelNum = parseInt(levelParam ?? "1", 10);

  const manifest: HskManifestLevel | undefined = HSK_MANIFEST.levels.find(
    (l) => l.level === levelNum,
  );

  const { session, loading, error, stale, refresh } = useHskSession();
  const [paywallVisible, setPaywallVisible] = useState(false);

  if (!manifest) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ThemedText style={styles.errorText}>Level not found.</ThemedText>
      </SafeAreaView>
    );
  }

  const progress = session ? getProgressForLevel(session, levelNum) : undefined;
  const isPremium = session?.premium.is_premium ?? false;
  const quotaExhausted = session ? isExamQuotaExhausted(session) : false;

  // HSK 2-6 vocab study requires premium; HSK 1 is free-discoverable
  const studyLocked = !isPremium && levelNum > 1;
  // Exam is locked if: non-premium AND (level > 1 OR quota exhausted)
  const examLocked = !isPremium && (levelNum > 1 || quotaExhausted);

  const learned = progress?.words_learned ?? 0;
  const mastered = progress?.words_mastered ?? 0;
  const pct = Math.min(100, Math.round((learned / manifest.word_count) * 100));

  const handleStudyPress = () => {
    if (stale || !session) {
      Alert.alert(
        "Session refresh required",
        "We couldn't verify your latest entitlement and quota state. Please retry.",
      );
      void refresh();
      return;
    }
    if (studyLocked) {
      setPaywallVisible(true);
      return;
    }
    router.push({
      pathname: "/hsk-vocab-study",
      params: { level: String(levelNum) },
    });
  };

  const handleExamPress = () => {
    if (stale || !session) {
      Alert.alert(
        "Session refresh required",
        "We couldn't verify your latest entitlement and quota state. Please retry.",
      );
      void refresh();
      return;
    }
    if (examLocked) {
      setPaywallVisible(true);
      return;
    }
    router.push({
      pathname: "/hsk-exam",
      params: { level: String(levelNum) },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primaryAccentColor} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{manifest.level_name}</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <ThemedText style={styles.statValue}>{manifest.word_count}</ThemedText>
            <ThemedText style={styles.statLabel}>Total words</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <ThemedText style={styles.statValue}>{learned}</ThemedText>
            <ThemedText style={styles.statLabel}>Learned</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <ThemedText style={styles.statValue}>{mastered}</ThemedText>
            <ThemedText style={styles.statLabel}>Mastered</ThemedText>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressTitle}>Progress</ThemedText>
            <ThemedText style={styles.progressPct}>{pct}%</ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {loading && !session ? (
          <ActivityIndicator
            color={Colors.primaryAccentColor}
            style={styles.loader}
          />
        ) : !session ? (
          <View style={styles.sessionErrorCard}>
            <ThemedText style={styles.sessionErrorTitle}>
              Session unavailable
            </ThemedText>
            <ThemedText style={styles.sessionErrorText}>
              We could not verify premium and quota state. Retry to continue.
            </ThemedText>
            <Pressable style={styles.secondaryButton} onPress={() => void refresh()}>
              <Ionicons name="refresh-outline" size={20} color={Colors.primaryAccentColor} />
              <ThemedText style={styles.secondaryButtonText}>Retry Session Check</ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            {(stale || error) && (
              <View style={styles.noticeBanner}>
                <Ionicons name="warning" size={16} color={Colors.primaryAccentColor} />
                <ThemedText style={styles.noticeText}>
                  Session is stale. Actions are blocked until refresh succeeds.
                </ThemedText>
              </View>
            )}

            {/* Free quota notice */}
            {!isPremium && levelNum === 1 && quotaExhausted && (
              <View style={styles.noticeBanner}>
                <Ionicons name="information-circle" size={16} color={Colors.primaryAccentColor} />
                <ThemedText style={styles.noticeText}>
                  Free exam quota used today. Resets at midnight UTC.
                </ThemedText>
              </View>
            )}

            {/* Action buttons */}
            {stale ? (
              <Pressable style={styles.secondaryButton} onPress={() => void refresh()}>
                <Ionicons name="refresh-outline" size={20} color={Colors.primaryAccentColor} />
                <ThemedText style={styles.secondaryButtonText}>Refresh Session</ThemedText>
              </Pressable>
            ) : !studyLocked && !examLocked ? (
              <View style={styles.actions}>
                <Pressable style={styles.primaryButton} onPress={handleStudyPress}>
                  <Ionicons name="book-outline" size={20} color="#fff" />
                  <ThemedText style={styles.primaryButtonText}>Study Vocabulary</ThemedText>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={handleExamPress}>
                  <Ionicons name="checkbox-outline" size={20} color={Colors.primaryAccentColor} />
                  <ThemedText style={styles.secondaryButtonText}>Take Mock Exam</ThemedText>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Show available free actions first, then locked state */}
                {!studyLocked && (
                  <Pressable style={styles.primaryButton} onPress={handleStudyPress}>
                    <Ionicons name="book-outline" size={20} color="#fff" />
                    <ThemedText style={styles.primaryButtonText}>Study Vocabulary</ThemedText>
                  </Pressable>
                )}
                <HskLockedState
                  reason={
                    levelNum > 1
                      ? `Full access to HSK ${levelNum} requires Premium.`
                      : "You've used today's free exam. Upgrade for unlimited exams."
                  }
                  onUpgrade={() => setPaywallVisible(true)}
                />
              </>
            )}

            {/* Last studied */}
            {progress?.last_studied_at && (
              <ThemedText style={styles.lastStudied}>
                Last studied:{" "}
                {new Date(progress.last_studied_at).toLocaleDateString()}
              </ThemedText>
            )}
          </>
        )}
      </ScrollView>

      <Paywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderColor,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.primaryAccentColor,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.subduedTextColor,
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  progressPct: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primaryAccentColor,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 4,
  },
  loader: {
    marginTop: 40,
  },
  sessionErrorCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: 16,
    gap: 8,
    backgroundColor: "#fff",
  },
  sessionErrorTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sessionErrorText: {
    fontSize: 13,
    color: Colors.subduedTextColor,
    lineHeight: 18,
    marginBottom: 8,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,73,0,0.07)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryAccentColor,
    lineHeight: 18,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 20,
    paddingVertical: 16,
    shadowColor: Colors.primaryAccentColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.primaryAccentColor,
  },
  secondaryButtonText: {
    color: Colors.primaryAccentColor,
    fontSize: 16,
    fontWeight: "700",
  },
  lastStudied: {
    marginTop: 24,
    fontSize: 12,
    color: Colors.subduedTextColor,
    textAlign: "center",
  },
  errorText: {
    margin: 32,
    color: Colors.subduedTextColor,
  },
});
