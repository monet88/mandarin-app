/**
 * hsk-prep.tsx
 * HSK Prep tab landing screen. Shows manifest-driven level cards (HSK 1-6)
 * and a Coming Soon entry for HSK 7-9. Session state is server-authoritative.
 */

import { HskComingSoonCard, HskLevelCard } from "@/components/hsk/HskLevelCard";
import { HskPrepHeader } from "@/components/hsk/HskPrepHeader";
import { Paywall } from "@/components/subscription/Paywall";
import { Colors } from "@/constants/theme";
import { getAvailableLevels, HSK_MANIFEST } from "@/constants/hsk-data";
import { getProgressForLevel } from "@/lib/hsk-session";
import { useHskSession } from "@/hooks/useHskSession";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const availableLevels = getAvailableLevels();

export default function HskPrepScreen() {
  const { session, loading, error, refresh } = useHskSession();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleLevelPress = (level: number) => {
    // Navigate to level detail — gating happens inside that screen
    router.push({ pathname: "/hsk-level", params: { level: String(level) } });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <HskPrepHeader session={session} />

      {loading && !session ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primaryAccentColor} />
        </View>
      ) : error && !session ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            Could not load session. Pull down to retry.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primaryAccentColor}
            />
          }
        >
          <Text style={styles.sectionLabel}>AVAILABLE LEVELS</Text>

          {availableLevels.map((lvl) => (
            <HskLevelCard
              key={lvl.level}
              level={lvl}
              progress={
                session ? getProgressForLevel(session, lvl.level) : undefined
              }
              onPress={() => handleLevelPress(lvl.level)}
            />
          ))}

          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
            COMING SOON
          </Text>

          <HskComingSoonCard summary={HSK_MANIFEST.hsk_7_9} />
        </ScrollView>
      )}

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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    color: Colors.subduedTextColor,
    fontSize: 14,
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.subduedTextColor,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: 8,
  },
});
