// Countdown timer synced to server deadline — re-renders every second
import { Colors } from "@/constants/theme";
import { msUntil } from "@/lib/hsk-exam";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  deadlineIso: string;
  onExpire: () => void;
}

function formatMs(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function HskExamTimer({ deadlineIso, onExpire }: Props) {
  const [remaining, setRemaining] = useState(() => msUntil(deadlineIso));
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    expiredRef.current = false;
    setRemaining(msUntil(deadlineIso));

    const id = setInterval(() => {
      const ms = msUntil(deadlineIso);
      setRemaining(ms);
      if (ms === 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(id);
        onExpireRef.current();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [deadlineIso]);

  const isWarning = remaining < 60_000; // last minute

  return (
    <View style={[styles.container, isWarning && styles.warning]}>
      <Text style={[styles.label, isWarning && styles.warningText]}>Time</Text>
      <Text style={[styles.time, isWarning && styles.warningText]}>{formatMs(remaining)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  warning: {
    backgroundColor: "#fee2e2",
  },
  label: {
    fontSize: 10,
    color: Colors.subduedTextColor,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontVariant: ["tabular-nums"],
  },
  warningText: {
    color: Colors.primaryAccentColor,
  },
});
