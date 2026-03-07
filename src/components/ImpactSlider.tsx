import React, { useMemo, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { clampImpact } from "../lib/impact";

type Props = {
  value: number;
  onChange: (next: number) => void;
  accentColor?: string;
};

const STEP = 0.05;
const TICK_COUNT = 11;

export default function ImpactSlider({ value, onChange, accentColor = "#5F6B7A" }: Props) {
  const normalized = clampImpact(value);
  const [trackWidth, setTrackWidth] = useState(0);
  const rgb = hexToRgb(accentColor);
  const progressOpacity = 0.22 + normalized * 0.68;
  const thumbOpacity = 0.35 + normalized * 0.65;
  const progressColor = rgb
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${progressOpacity.toFixed(3)})`
    : "#D5DBE4";
  const thumbBorderColor = rgb
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${thumbOpacity.toFixed(3)})`
    : "#596574";

  const valueFromX = (x: number) => {
    if (trackWidth <= 0) return normalized;
    return clampImpact(x / trackWidth);
  };

  const trackPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const next = valueFromX(event.nativeEvent.locationX);
          onChange(next);
        },
        onPanResponderMove: (event) => {
          const next = valueFromX(event.nativeEvent.locationX);
          onChange(next);
        },
      }),
    [onChange, trackWidth, normalized]
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>インパクト</Text>
      <View style={styles.trackWrap}>
        <View
          style={styles.track}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          {...trackPanResponder.panHandlers}
        >
          <View
            style={[
              styles.progress,
              { backgroundColor: progressColor },
              trackWidth > 0 ? { width: trackWidth * normalized } : null,
            ]}
          />
          <View style={styles.ticks}>
            {Array.from({ length: TICK_COUNT }).map((_, i) => (
              <View key={`tick-${i}`} style={[styles.tick, i % 5 === 0 && styles.tickMajor]} />
            ))}
          </View>
          <View
            style={[
              styles.thumbWrap,
              trackWidth > 0 ? { left: Math.max(0, Math.min(trackWidth, trackWidth * normalized)) - 14 } : null,
            ]}
          >
            <View style={[styles.thumb, { borderColor: thumbBorderColor }]} />
          </View>
        </View>
        <Text style={styles.value}>{normalized.toFixed(2)}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.btn} onPress={() => onChange(clampImpact(normalized - STEP))}>
          <Text style={styles.btnText}>弱く</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => onChange(clampImpact(normalized + STEP))}>
          <Text style={styles.btnText}>強く</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, color: "#3B3B3B" },
  trackWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  track: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F2F3F5",
    borderWidth: 1,
    borderColor: "#E1E5EA",
    justifyContent: "center",
    overflow: "visible",
  },
  progress: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 17,
    backgroundColor: "#D5DBE4",
  },
  ticks: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
    pointerEvents: "none",
  },
  tick: {
    width: 1,
    height: 8,
    backgroundColor: "#9AA4B2",
    opacity: 0.55,
  },
  tickMajor: {
    height: 12,
    opacity: 0.8,
  },
  thumbWrap: {
    position: "absolute",
    top: 3,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#596574",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  value: { width: 40, fontSize: 12, color: "#555", textAlign: "right" },
  controls: { flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 4 },
  btn: {
    minWidth: 132,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 15, color: "#333", fontWeight: "500" },
});

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace("#", "");
  if (normalized.length !== 6) return null;
  const int = Number.parseInt(normalized, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}
