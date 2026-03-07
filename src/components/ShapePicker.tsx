import React, { useMemo } from "react";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MoodShape } from "../types/mood";
import { DEFAULT_PICKER_SHAPE_KEYS, toShapeOptions } from "../theme/shapes";

type Props = {
  selectedShape: MoodShape;
  onSelect: (shape: MoodShape) => void;
  onPressEdit?: () => void;
  shapeKeys?: MoodShape[];
};

export default function ShapePicker({ selectedShape, onSelect, onPressEdit, shapeKeys }: Props) {
  const options = useMemo(
    () => toShapeOptions(shapeKeys ?? DEFAULT_PICKER_SHAPE_KEYS),
    [shapeKeys]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>かたち</Text>
        <Pressable style={styles.editBtn} onPress={onPressEdit}>
          <Feather name="edit-3" size={14} color="#6A6F76" />
        </Pressable>
      </View>
      <View style={styles.row}>
        {options.map((shape) => {
          const selected = shape.key === selectedShape;
          return (
            <Pressable
              key={shape.key}
              onPress={() => onSelect(shape.key)}
              style={[styles.item, selected && styles.selected]}
            >
              {shape.key === "doodle" ? (
                <View style={styles.doodleGlyphWrap}>
                  <View style={[styles.doodleGlyphLine, styles.doodleGlyphLineTop]} />
                  <View style={[styles.doodleGlyphLine, styles.doodleGlyphLineBottom]} />
                </View>
              ) : isFeatherGlyph(shape.glyph) ? (
                <Feather name={shape.glyph as any} size={24} color="#444" />
              ) : (
                <Text style={styles.glyph}>{shape.glyph}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function isFeatherGlyph(glyph: string) {
  return glyph === "zap" || glyph === "cloud-rain" || glyph === "edit-3";
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, color: "#3B3B3B" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  editBtn: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E3E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  row: { flexDirection: "row", gap: 10, justifyContent: "center", alignItems: "center" },
  item: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderColor: "#222",
    borderWidth: 2,
    transform: [{ scale: 1.03 }],
  },
  glyph: { fontSize: 26, color: "#444", lineHeight: 28, textAlign: "center", transform: [{ translateY: -1 }] },
  doodleGlyphWrap: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  doodleGlyphLine: {
    position: "absolute",
    width: 22,
    height: 2.8,
    borderRadius: 999,
    backgroundColor: "#444",
    transform: [{ rotate: "-28deg" }],
  },
  doodleGlyphLineTop: { top: 9 },
  doodleGlyphLineBottom: { top: 18 },
});
