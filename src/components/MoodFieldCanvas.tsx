import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MoodLog } from "../types/mood";
import { toBlobStyle } from "../lib/impact";
import MoodBlob from "./MoodBlob";

type Props = {
  logs: MoodLog[];
  onTapBlob: (id: string) => void;
};

type Placement = {
  id: string;
  x: number;
  y: number;
};

const WIDTH = 330;
const HEIGHT = 520;

export default function MoodFieldCanvas({ logs, onTapBlob }: Props) {
  const placed = useMemo(() => placeBlobs(logs), [logs]);

  return (
    <View style={styles.canvas}>
      {placed.map((p) => {
        const log = logs.find((l) => l.id === p.id);
        if (!log) return null;
        return (
          <Pressable key={p.id} onPress={() => onTapBlob(p.id)} style={[styles.item, { left: p.x, top: p.y }]}>
            <MoodBlob color={log.color_hex} impact={log.impact} shape={log.shape} />
          </Pressable>
        );
      })}
    </View>
  );
}

function placeBlobs(logs: MoodLog[]): Placement[] {
  const result: Placement[] = [];
  const ordered = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  for (const log of ordered) {
    const size = toBlobStyle(log.impact).diameter;
    let candidate = { x: Math.random() * (WIDTH - size), y: Math.random() * (HEIGHT - size) };
    let tries = 0;

    while (tries < 40) {
      const isColliding = result.some((p) => {
        const other = logs.find((l) => l.id === p.id);
        if (!other) return false;
        const otherSize = toBlobStyle(other.impact).diameter;
        const dx = p.x - candidate.x;
        const dy = p.y - candidate.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (size + otherSize) * 0.35;
      });
      if (!isColliding) break;
      candidate = { x: Math.random() * (WIDTH - size), y: Math.random() * (HEIGHT - size) };
      tries += 1;
    }

    result.push({ id: log.id, ...candidate });
  }

  return result;
}

const styles = StyleSheet.create({
  canvas: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    alignSelf: "center",
  },
  item: {
    position: "absolute",
  },
});
