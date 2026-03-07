import React, { useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ColorPalette from "../../components/ColorPalette";
import ImpactSlider from "../../components/ImpactSlider";
import MoodBlob from "../../components/MoodBlob";
import OptionalAddOnSheet from "../../components/OptionalAddOnSheet";
import ShapePicker from "../../components/ShapePicker";
import { getShapePickerKeys } from "../../db/repositories/shapeSettingsRepository";
import { useLogs } from "../../hooks/useLogs";
import { PALETTE_24 } from "../../theme/palette";
import { DEFAULT_PICKER_SHAPE_KEYS } from "../../theme/shapes";
import { MoodShape } from "../../types/mood";

export default function CreateScreen() {
  const router = useRouter();
  const { entry } = useLocalSearchParams<{ entry?: string }>();
  const { logs, create, addOn } = useLogs();
  const [selectedShape, setSelectedShape] = useState<MoodShape>("circle");
  const [pickerShapeKeys, setPickerShapeKeys] = useState<MoodShape[]>(DEFAULT_PICKER_SHAPE_KEYS);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [impact, setImpact] = useState(0.45);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [thanksMessage, setThanksMessage] = useState("お疲れ様");
  const [scrollKey, setScrollKey] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const THANKS_MESSAGES = [
    "その感情\nいただきました",
    "この一瞬\nちゃんと受け取りました",
    "いまのきもち\nきれいに残せたよ",
    "今日のあなたの色\n確かに記録しました",
  ];

  const formatPopupMessage = (message: string) => {
    if (message.includes("\n")) return message;
    const firstComma = message.indexOf("、");
    if (firstComma === -1 || firstComma === message.length - 1) return message;
    return `${message.slice(0, firstComma + 1)}\n${message.slice(firstComma + 1)}`;
  };

  const recentColors = useMemo(
    () => Array.from(new Set(logs.map((l) => l.color_hex))).slice(0, 5),
    [logs]
  );

  useFocusEffect(
    React.useCallback(() => {
      // Ensure we always return to the top when this screen regains focus.
      setScrollKey((prev) => prev + 1);
      const t1 = setTimeout(() => scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false }), 0);
      const t2 = setTimeout(() => scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false }), 80);
      let active = true;
      (async () => {
        const keys = await getShapePickerKeys();
        if (!active) return;
        setPickerShapeKeys(keys);
        if (!keys.includes(selectedShape)) {
          setSelectedShape(keys[0] ?? "circle");
        }
        scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      })();
      return () => {
        active = false;
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, [selectedShape])
  );

  const onSaveCore = async () => {
    if (!selectedColor) {
      Alert.alert("色を選択してください");
      return;
    }
    setSaving(true);
    try {
      const created = await create({ color_hex: selectedColor, impact, shape: selectedShape });
      setSavedId(created.id);
      setSheetVisible(true);
    } catch {
      Alert.alert("保存できませんでした。再試行してください。");
    } finally {
      setSaving(false);
    }
  };

  const finishAndGoHome = () => {
    setSheetVisible(false);
    const random = THANKS_MESSAGES[Math.floor(Math.random() * THANKS_MESSAGES.length)];
    setThanksMessage(random);
    setShowThanks(true);
    setTimeout(() => {
      setShowThanks(false);
      router.replace("/");
    }, 5000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        key={`create-scroll-${String(entry ?? "base")}-${scrollKey}`}
        ref={scrollRef}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        scrollIndicatorInsets={{ top: 0, left: 0, bottom: 0, right: 0 }}
        contentOffset={{ x: 0, y: 0 }}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>ムードを残す</Text>
          <Pressable style={styles.noteIconBtn} onPress={() => router.push("/shapes")}>
            <Feather name="file-text" size={16} color="#5E6670" />
          </Pressable>
        </View>
        <View style={styles.preview}>
          <MoodBlob
            color={selectedColor ?? "#E9E9E9"}
            impact={selectedColor ? impact : 0.35}
            shape={selectedShape}
          />
          {!selectedColor ? <Text style={styles.hint}>あなたのきもち</Text> : null}
        </View>
        <ShapePicker
          selectedShape={selectedShape}
          onSelect={setSelectedShape}
          shapeKeys={pickerShapeKeys}
          onPressEdit={() => router.push("/shape-settings")}
        />
        <ColorPalette
          colors={PALETTE_24}
          recentColors={recentColors}
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
        />
        <View style={styles.impactSection}>
          <ImpactSlider value={impact} onChange={setImpact} accentColor={selectedColor ?? "#5F6B7A"} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.secondary} onPress={() => router.back()}>
          <Text>戻る</Text>
        </Pressable>
        <Pressable style={[styles.primary, saving && styles.disabled]} onPress={() => void onSaveCore()} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? "保存中..." : "保存する"}</Text>
        </Pressable>
      </View>

      <OptionalAddOnSheet
        visible={sheetVisible}
        onSkip={() => {
          finishAndGoHome();
        }}
        onSubmit={async (value) => {
          if (!savedId) return;
          await addOn(savedId, value);
          finishAndGoHome();
        }}
      />

      <Modal transparent visible={showThanks} animationType="fade">
        <View style={styles.popupBackdrop}>
          <View style={styles.popupCard}>
            <Text style={styles.popupText}>
              {formatPopupMessage(thanksMessage)}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F5" },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 20, fontWeight: "600", color: "#202020" },
  noteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E3E6EA",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    height: 130,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  hint: { color: "#888" },
  impactSection: { marginTop: 14 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  secondary: { paddingVertical: 10, paddingHorizontal: 14 },
  primary: { backgroundColor: "#222", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  primaryText: { color: "#FFF", fontWeight: "600" },
  disabled: { opacity: 0.5 },
  popupBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  popupCard: {
    width: 290,
    minHeight: 120,
    borderRadius: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E8EBEF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  popupText: { fontSize: 17, color: "#2A3340", fontWeight: "600", textAlign: "center", lineHeight: 25 },
});
