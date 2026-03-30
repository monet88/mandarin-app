/**
 * HskPrepHeader.tsx
 * Header for the HSK Prep landing screen.
 * Shows title, subtitle, and server-backed quota badge for free users.
 */

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { HskSessionData } from "@/lib/hsk-session";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  session: HskSessionData | null;
}

export function HskPrepHeader({ session }: Props) {
  const isPremium = session?.premium.is_premium ?? false;
  const remaining = session?.quota.exams_remaining_today ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name="ribbon" size={28} color={Colors.primaryAccentColor} />
        <ThemedText style={styles.title}>HSK Prep</ThemedText>
      </View>
      <ThemedText style={styles.subtitle}>
        Official vocabulary for HSK 1–6 certification
      </ThemedText>

      {session && !isPremium && remaining !== null && (
        <View style={styles.quotaBadge}>
          <Ionicons name="flash" size={14} color={Colors.primaryAccentColor} />
          <ThemedText style={styles.quotaText}>
            {remaining > 0
              ? `${remaining} free exam${remaining !== 1 ? "s" : ""} left today`
              : "Free exam quota used today"}
          </ThemedText>
        </View>
      )}

      {isPremium && (
        <View style={[styles.quotaBadge, styles.premiumBadge]}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <ThemedText style={[styles.quotaText, styles.premiumText]}>
            Premium
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.subduedTextColor,
    marginBottom: 10,
  },
  quotaBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "rgba(255, 73, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 73, 0, 0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  quotaText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primaryAccentColor,
  },
  premiumText: {
    color: "#B8860B",
  },
});
