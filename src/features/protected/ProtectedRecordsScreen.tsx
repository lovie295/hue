import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogs } from "../../hooks/useLogs";

const PROTECTED_PASSWORD = "hue000";
const PASSWORD_RIDDLE = "なぞとき: 24色の気持ちをはじめて守る、最初の合言葉は？";
const PASSWORD_HINTS = ["英小文字3文字 + 数字3文字", "最初の設定で表示されていた合言葉"];

export default function ProtectedRecordsScreen() {
  const router = useRouter();
  const { logs } = useLogs();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);

  const rows = useMemo(
    () =>
      logs.map((log) => ({
        id: log.id,
        shape: log.shape,
        color: log.color_hex,
        impact: log.impact.toFixed(2),
        createdAt: new Date(log.timestamp).toLocaleString(),
      })),
    [logs]
  );

  const unlock = () => {
    if (password === PROTECTED_PASSWORD) {
      setUnlocked(true);
      setError("");
      return;
    }
    setError("パスワードが違います");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ひみつのとびら</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>閉じる</Text>
        </Pressable>
      </View>

      {!unlocked ? (
        <View style={styles.lockBox}>
          <View style={styles.riddleCard}>
            <Text style={styles.riddleLabel}>合言葉</Text>
            <Text style={styles.riddleText}>{PASSWORD_RIDDLE}</Text>
            <Pressable onPress={() => setShowHints((v) => !v)} style={styles.hintToggleBtn}>
              <Text style={styles.hintToggleText}>{showHints ? "ヒントを閉じる" : "ヒントを見る"}</Text>
            </Pressable>
            {showHints ? (
              <View style={styles.hintList}>
                {PASSWORD_HINTS.map((hint, idx) => (
                  <Text key={`${hint}-${idx}`} style={styles.hintItem}>
                    ・{hint}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="言葉"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={unlock} style={styles.unlockBtn}>
            <Text style={styles.unlockText}>開く</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {rows.length === 0 ? <Text style={styles.empty}>記録がありません</Text> : null}
          {rows.map((row) => (
            <Pressable key={row.id} style={styles.row} onPress={() => router.push(`/detail/${row.id}`)}>
              <View style={[styles.color, { backgroundColor: row.color }]} />
              <View style={styles.meta}>
                <Text style={styles.metaText}>図形: {row.shape}</Text>
                <Text style={styles.metaText}>インパクト: {row.impact}</Text>
                <Text style={styles.metaSub}>作成日時: {row.createdAt}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 17, fontWeight: "600", color: "#1F2A33" },
  closeBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8DEE5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
  },
  closeText: { fontSize: 12, color: "#4A5561" },
  lockBox: { marginTop: 28, paddingHorizontal: 16, gap: 10 },
  lockTitle: { fontSize: 15, color: "#2A3440" },
  input: {
    borderWidth: 1,
    borderColor: "#D8DDE3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: "#B34747", fontSize: 12 },
  riddleCard: {
    borderWidth: 1,
    borderColor: "#E5E9EF",
    backgroundColor: "#FAFBFD",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  riddleLabel: { fontSize: 12, color: "#7D8895" },
  riddleText: { fontSize: 13, color: "#2A3440", lineHeight: 19 },
  hintToggleBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#D8DEE5",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },
  hintToggleText: { fontSize: 12, color: "#4A5561" },
  hintList: { gap: 4 },
  hintItem: { color: "#8A95A2", fontSize: 12, lineHeight: 18 },
  unlockBtn: {
    backgroundColor: "#21262B",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  unlockText: { color: "#FFF", fontWeight: "600" },
  list: { padding: 16, gap: 10 },
  empty: { color: "#8A95A2", alignSelf: "center", marginTop: 30 },
  row: {
    borderWidth: 1,
    borderColor: "#E5E9EF",
    borderRadius: 12,
    backgroundColor: "#FAFBFD",
    padding: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  color: { width: 20, height: 20, borderRadius: 999 },
  meta: { gap: 2 },
  metaText: { color: "#2B3641", fontSize: 13 },
  metaSub: { color: "#74808D", fontSize: 12 },
  chevron: { marginLeft: "auto", color: "#9AA5B1", fontSize: 20, lineHeight: 20 },
});
