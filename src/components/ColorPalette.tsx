import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ColorItem = { name: string; hex: string; group?: string };

type Props = {
  colors: readonly ColorItem[];
  recentColors: string[];
  selectedColor?: string | null;
  onSelect: (hex: string) => void;
};

export default function ColorPalette({ colors, recentColors, selectedColor, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>最近使った色</Text>
      <View style={styles.row}>
        {recentColors.length === 0 ? (
          <Text style={styles.placeholder}>まだありません</Text>
        ) : (
          recentColors.map((hex) => (
            <ColorChip key={`recent-${hex}`} hex={hex} selected={selectedColor === hex} onPress={onSelect} />
          ))
        )}
      </View>

      <Text style={styles.label}>パレット</Text>
      <View style={styles.grid}>
        {colors.map((c) => (
          <ColorChip key={c.hex} hex={c.hex} selected={selectedColor === c.hex} onPress={onSelect} />
        ))}
      </View>
    </View>
  );
}

function ColorChip({
  hex,
  selected,
  onPress,
}: {
  hex: string;
  selected: boolean;
  onPress: (hex: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(hex)}
      style={[styles.chip, { backgroundColor: hex }, selected && styles.selected]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  label: { fontSize: 13, color: "#3B3B3B" },
  row: { flexDirection: "row", gap: 10, minHeight: 36, alignItems: "center" },
  placeholder: { color: "#888", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { width: 30, height: 30, borderRadius: 99, borderWidth: 1, borderColor: "#E1E1E1" },
  selected: { borderWidth: 2, borderColor: "#222", transform: [{ scale: 1.08 }] },
});

