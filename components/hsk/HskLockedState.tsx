/**
 * HskLockedState.tsx
 * Inline locked/gated state shown within HSK level detail when a premium action
 * is blocked. Surfaces the reason and a CTA to upgrade — never shown at discovery.
 */

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  reason: string;
  onUpgrade: () => void;
}

export function HskLockedState({ reason, onUpgrade }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="lock-closed" size={32} color={Colors.subduedTextColor} />
      </View>
      <ThemedText style={styles.reason}>{reason}</ThemedText>
      <Pressable style={styles.ctaButton} onPress={onUpgrade}>
        <Ionicons name="star" size={16} color="#fff" />
        <ThemedText style={styles.ctaText}>Upgrade to Premium</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 12,
  },
  iconRow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  reason: {
    fontSize: 15,
    color: Colors.subduedTextColor,
    textAlign: "center",
    lineHeight: 22,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryAccentColor,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
