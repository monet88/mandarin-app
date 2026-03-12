/**
 * hsk-vocab-study.tsx
 * Vocabulary study screen for one HSK level.
 * Two tabs: Browse (searchable list) and Review (SM-2 flashcard queue).
 */

import { HskReviewQueue } from "@/components/hsk/HskReviewQueue";
import { HskVocabularyList } from "@/components/hsk/HskVocabularyList";
import { ThemedText } from "@/components/themed-text";
import { HskLevelBundle, HskWord } from "@/constants/hsk-data";
import { Colors } from "@/constants/theme";
import { useHskReviewQueue } from "@/hooks/useHskReviewQueue";
import { getLevelProgress } from "@/lib/hsk-progress";
import { ReviewQuality, WordReviewState } from "@/lib/hsk-review";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "browse" | "review";

// Metro requires static requires for JSON assets.
const LEVEL_BUNDLE_MAP: Record<number, HskLevelBundle> = {
  1: require("@/assets/data/hsk/hsk_level_1.json") as HskLevelBundle,
  2: require("@/assets/data/hsk/hsk_level_2.json") as HskLevelBundle,
  3: require("@/assets/data/hsk/hsk_level_3.json") as HskLevelBundle,
  4: require("@/assets/data/hsk/hsk_level_4.json") as HskLevelBundle,
  5: require("@/assets/data/hsk/hsk_level_5.json") as HskLevelBundle,
  6: require("@/assets/data/hsk/hsk_level_6.json") as HskLevelBundle,
};

export default function HskVocabStudyScreen() {
  const { level: levelParam } = useLocalSearchParams<{ level: string }>();
  const levelNum = parseInt(levelParam ?? "1", 10);

  const [tab, setTab] = useState<Tab>("browse");
  const [words, setWords] = useState<HskWord[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, WordReviewState>>({});
  const [loadingWords, setLoadingWords] = useState(true);

  const {
    dueStates,
    loading: reviewLoading,
    submitReview,
    seedReviewWord,
  } = useHskReviewQueue(levelNum);

  // Load level bundle from static map (Metro-safe).
  useEffect(() => {
    void (async () => {
      try {
        const bundle = LEVEL_BUNDLE_MAP[levelNum];
        setWords(bundle.words);
      } catch {
        setWords([]);
      } finally {
        setLoadingWords(false);
      }
    })();
  }, [levelNum]);

  // Load local progress map for badge display in list
  useEffect(() => {
    void getLevelProgress(levelNum).then(setProgressMap);
  }, [levelNum]);

  const handleRate = async (word_id: string, quality: ReviewQuality) => {
    const word = words.find((entry) => entry.word_id === word_id);
    if (!word) return;

    await submitReview(word.word_id, word.hanzi, quality, levelNum);
    // Refresh local progress map so badges update
    setProgressMap(await getLevelProgress(levelNum));
  };

  const levelName = `HSK ${levelNum}`;

  const handleBrowseWordPress = async (word: HskWord) => {
    await seedReviewWord(word.word_id, levelNum);
    setTab("review");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primaryAccentColor} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{levelName} Vocabulary</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, tab === "browse" && styles.tabItemActive]}
          onPress={() => setTab("browse")}
        >
          <Ionicons
            name="list-outline"
            size={18}
            color={tab === "browse" ? Colors.primaryAccentColor : Colors.subduedTextColor}
          />
          <ThemedText
            style={[styles.tabLabel, tab === "browse" && styles.tabLabelActive]}
          >
            Browse
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === "review" && styles.tabItemActive]}
          onPress={() => setTab("review")}
        >
          <Ionicons
            name="flash-outline"
            size={18}
            color={tab === "review" ? Colors.primaryAccentColor : Colors.subduedTextColor}
          />
          <ThemedText
            style={[styles.tabLabel, tab === "review" && styles.tabLabelActive]}
          >
            Review
            {dueStates.length > 0 && (
              <ThemedText style={styles.dueBadge}> {dueStates.length}</ThemedText>
            )}
          </ThemedText>
        </Pressable>
      </View>

      {/* Content */}
      {loadingWords || reviewLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primaryAccentColor} />
        </View>
      ) : tab === "browse" ? (
        <HskVocabularyList
          words={words}
          progressMap={progressMap}
          onWordPress={handleBrowseWordPress}
        />
      ) : (
        <HskReviewQueue
          dueStates={dueStates}
          words={words}
          onRate={handleRate}
          onComplete={() => setTab("browse")}
          onExit={() => setTab("browse")}
        />
      )}
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
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: Colors.primaryAccentColor,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.subduedTextColor,
  },
  tabLabelActive: {
    color: Colors.primaryAccentColor,
  },
  dueBadge: {
    color: Colors.primaryAccentColor,
    fontWeight: "800",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
