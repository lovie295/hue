import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getShapePickerKeys,
  setShapePickerKeys,
} from "../../db/repositories/shapeSettingsRepository";
import { ALL_SHAPE_OPTIONS } from "../../theme/shapes";
import { MoodShape } from "../../types/mood";

const MAX_SELECTED = 3;

export default function ShapeSettingsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<MoodShape[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const keys = await getShapePickerKeys();
      if (active) setSelected(keys);
    })();
    return () => {
      active = false;
    };
  }, []);

  const onToggle = (shape: MoodShape) => {
    setSelected((prev) => {
      if (prev.includes(shape)) {
        if (prev.length <= 1) return prev;
        return prev.filter((s) => s !== shape);
      }
      if (prev.length >= MAX_SELECTED) {
        Alert.alert("3つまで選べます");
        return prev;
      }
      return [...prev, shape];
    });
  };

  const onSave = async () => {
    if (selected.length !== MAX_SELECTED) {
      Alert.alert("図形は3つ選んでください");
      return;
    }
    await setShapePickerKeys(selected);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>かたちを編集</Text>
        <Text style={styles.caption}>{selected.length}/3 選択中</Text>
      </View>
      <View style={styles.grid}>
        {ALL_SHAPE_OPTIONS.map((shape) => {
          const checked = selected.includes(shape.key);
          return (
            <Pressable
              key={shape.key}
              style={[styles.item, checked && styles.itemChecked]}
              onPress={() => onToggle(shape.key)}
            >
              <View style={styles.glyphWrap}>
                {shape.key === "doodle" ? (
                  <View style={styles.doodleGlyphWrap}>
                    <View style={[styles.doodleGlyphLine, styles.doodleGlyphLineTop]} />
                    <View style={[styles.doodleGlyphLine, styles.doodleGlyphLineBottom]} />
                  </View>
                ) : isFeatherGlyph(shape.glyph) ? (
                  <Feather name={shape.glyph as any} size={30} color="#30333A" />
                ) : (
                  <Text style={styles.glyph}>{shape.glyph}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={() => void onSave()}>
          <Text style={styles.saveText}>保存</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", padding: 18 },
  header: { gap: 6, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#1D232B" },
  caption: { fontSize: 13, color: "#6F7782" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  item: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E8EC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDFDFD",
  },
  itemChecked: {
    borderWidth: 2,
    borderColor: "#1E2430",
    backgroundColor: "#F7FAFF",
  },
  glyphWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: {
    fontSize: 34,
    lineHeight: 36,
    color: "#30333A",
    textAlign: "center",
    transform: [{ translateY: -2 }],
  },
  doodleGlyphWrap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  doodleGlyphLine: {
    position: "absolute",
    width: 30,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#30333A",
    transform: [{ rotate: "-28deg" }],
  },
  doodleGlyphLineTop: { top: 11 },
  doodleGlyphLineBottom: { top: 24 },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    gap: 12,
    paddingTop: 20,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7DCE2",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "#4C5663", fontWeight: "600" },
  saveBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#1E2430",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFF", fontWeight: "700" },
});

function isFeatherGlyph(glyph: string) {
  return glyph === "zap" || glyph === "cloud-rain" || glyph === "edit-3";
}
