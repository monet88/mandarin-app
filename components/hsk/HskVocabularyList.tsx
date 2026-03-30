/**
 * HskVocabularyList.tsx
 * Scrollable, searchable list of HSK words for a level.
 * Shows learned/mastered badge per word from local progress state.
 */

import { ThemedText } from "@/components/themed-text";
import { HskWord } from "@/constants/hsk-data";
import { Colors } from "@/constants/theme";
import { WordReviewState } from "@/lib/hsk-review";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

interface Props {
  words: HskWord[];
  /** word_id → review state (from local progress) */
  progressMap: Record<string, WordReviewState>;
  onWordPress: (word: HskWord) => void;
}

function WordRow({
  word,
  state,
  onPress,
}: {
  word: HskWord;
  state: WordReviewState | undefined;
  onPress: () => void;
}) {
  const learned = (state?.repetitions ?? 0) > 0;
  const mastered = (state?.interval ?? 0) >= 21;

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <ThemedText style={styles.hanzi}>{word.hanzi}</ThemedText>
        <ThemedText style={styles.pinyin}>{word.pinyin}</ThemedText>
      </View>
      <View style={styles.rowRight}>
        <ThemedText style={styles.english} numberOfLines={1}>
          {word.english}
        </ThemedText>
        {mastered ? (
          <View style={[styles.badge, styles.badgeMastered]}>
            <ThemedText style={styles.badgeText}>Mastered</ThemedText>
          </View>
        ) : learned ? (
          <View style={[styles.badge, styles.badgeLearned]}>
            <ThemedText style={styles.badgeText}>Learned</ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function HskVocabularyList({ words, progressMap, onWordPress }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return words;
    return words.filter(
      (w) =>
        w.hanzi.includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.english.toLowerCase().includes(q),
    );
  }, [words, query]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search hanzi, pinyin, or English…"
        placeholderTextColor={Colors.subduedTextColor}
        value={query}
        onChangeText={setQuery}
        clearButtonMode="while-editing"
        autoCorrect={false}
        autoCapitalize="none"
      />
      <FlatList
        data={filtered}
        keyExtractor={(w) => w.word_id}
        renderItem={({ item }) => (
          <WordRow
            word={item}
            state={progressMap[item.word_id]}
            onPress={() => onWordPress(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    fontSize: 15,
    color: "#111",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowLeft: {
    width: 90,
  },
  hanzi: {
    fontSize: 20,
    fontWeight: "700",
  },
  pinyin: {
    fontSize: 12,
    color: Colors.primaryAccentColor,
    marginTop: 2,
  },
  rowRight: {
    flex: 1,
    gap: 4,
  },
  english: {
    fontSize: 15,
    color: "#374151",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLearned: {
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  badgeMastered: {
    backgroundColor: "rgba(59,130,246,0.12)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.subduedTextColor,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderColor,
  },
});
