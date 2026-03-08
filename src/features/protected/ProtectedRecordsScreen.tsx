import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLogs } from "../../hooks/useLogs";

const PROTECTED_PASSWORD = "hue";
const PASSWORD_RIDDLE = "あいうえお => 二酸化炭素";
const PASSWORD_HINTS = ["H to O"];
const MONTH_NAMES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const EMPTY_COLOR = "#E8ECF1";

export default function ProtectedRecordsScreen() {
  const router = useRouter();
  const { logs } = useLogs();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [viewMode, setViewMode] = useState<"dashboard" | "list">("dashboard");
  const [showMonthMoodInfo, setShowMonthMoodInfo] = useState(false);

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

  const dashboard = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthLabel = `${year}/${MONTH_NAMES[month]}`;
    const monthStart = new Date(year, month, 1).getTime();
    const nextMonthStart = new Date(year, month + 1, 1).getTime();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const thisMonthLogs = logs.filter((log) => {
      const ts = new Date(log.timestamp).getTime();
      return ts >= monthStart && ts < nextMonthStart;
    });

    const thisMonthColorCount = countColors(thisMonthLogs);
    const thisMonthTop = pickTopColor(thisMonthColorCount);
    const thisMonthTopColor = thisMonthTop?.color ?? EMPTY_COLOR;
    const thisMonthTopCount = thisMonthTop?.count ?? 0;
    const thisMonthActiveDays = new Set(
      thisMonthLogs.map((log) => {
        const d = new Date(log.timestamp);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    ).size;

    const past6 = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(year, month - (5 - i), 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const monthLogs = logs.filter((log) => {
        const ts = new Date(log.timestamp).getTime();
        return ts >= start && ts < end;
      });
      const top = pickTopColor(countColors(monthLogs));
      return {
        label: MONTH_NAMES[d.getMonth()],
        color: top?.color ?? EMPTY_COLOR,
      };
    });

    const totalCount = logs.length;
    const streakDays = totalCount
      ? Math.max(
          1,
          Math.floor(
            (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
              new Date(
                new Date(logs[logs.length - 1].timestamp).getFullYear(),
                new Date(logs[logs.length - 1].timestamp).getMonth(),
                new Date(logs[logs.length - 1].timestamp).getDate()
              ).getTime()) /
              86400000
          ) + 1
        )
      : 0;

    const highImpactLogs = logs.filter((log) => log.impact >= 0.7);
    const highImpactTop = pickTopColor(countColors(highImpactLogs));
    const mostImpactColor = highImpactTop?.color ?? EMPTY_COLOR;

    const hourBucket = [0, 0, 0, 0, 0]; // 深夜, 朝, 昼, 夕方, 夜
    logs.forEach((log) => {
      const h = new Date(log.timestamp).getHours();
      if (h < 5) hourBucket[0] += 1;
      else if (h < 11) hourBucket[1] += 1;
      else if (h < 16) hourBucket[2] += 1;
      else if (h < 19) hourBucket[3] += 1;
      else hourBucket[4] += 1;
    });
    const bucketLabels = ["深夜", "朝", "昼", "夕方", "夜"];
    const topBucketIndex = hourBucket.indexOf(Math.max(...hourBucket));
    const activeTime = logs.length ? bucketLabels[topBucketIndex] : "-";

    const strongest = logs.length
      ? logs.reduce((prev, cur) => (cur.impact > prev.impact ? cur : prev), logs[0])
      : null;

    return {
      monthLabel,
      daysInMonth,
      thisMonthLogs,
      thisMonthCount: thisMonthLogs.length,
      thisMonthActiveDays,
      thisMonthTopColor,
      thisMonthTopCount,
      past6,
      streakDays,
      mostImpactColor,
      activeTime,
      totalCount,
      strongest,
    };
  }, [logs]);

  const unlock = () => {
    if (password === PROTECTED_PASSWORD) {
      setUnlocked(true);
      setError("");
      setViewMode("dashboard");
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
      ) : viewMode === "dashboard" ? (
        <ScrollView contentContainerStyle={styles.dashboardContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>振り返り</Text>
            <Text style={styles.sectionMonth}>{dashboard.monthLabel}</Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>今月のムード</Text>
              <Pressable
                style={styles.infoBtn}
                onPress={() => setShowMonthMoodInfo(true)}
                hitSlop={8}
              >
                <Feather name="info" size={13} color="#6D7A88" />
              </Pressable>
            </View>
            <View style={styles.heroBody}>
              <View style={[styles.heroColor, { backgroundColor: dashboard.thisMonthTopColor }]} />
              <View style={styles.heroMeta}>
                <Text style={styles.heroLine}>今月の記録 {dashboard.thisMonthCount}件</Text>
                <Text style={styles.heroSub}>代表色の使用 {dashboard.thisMonthTopCount}回</Text>
                <Text style={styles.heroSub}>
                  今月の日数 {dashboard.thisMonthActiveDays} / {dashboard.daysInMonth}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>過去6ヶ月</Text>
            <View style={styles.monthDotsRow}>
              {dashboard.past6.map((item) => (
                <View key={item.label} style={styles.monthDotWrap}>
                  <View style={[styles.monthDot, { backgroundColor: item.color }]} />
                  <Text style={styles.monthLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>今月のフィールド</Text>
            <View style={styles.miniField}>
              {dashboard.thisMonthLogs.slice(0, 20).map((log, idx) => (
                <View
                  key={log.id}
                  style={[
                    styles.miniDot,
                    {
                      backgroundColor: log.color_hex,
                      left: (idx * 23) % 250,
                      top: ((idx * 37) % 95) + (idx % 2 ? 8 : 0),
                      width: 14 + log.impact * 22,
                      height: 14 + log.impact * 22,
                      opacity: 0.78,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>継続日数</Text>
              <Text style={styles.kpiValue}>{dashboard.streakDays}日</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>最多インパクト色</Text>
              <View style={styles.kpiColorRow}>
                <View style={[styles.kpiColor, { backgroundColor: dashboard.mostImpactColor }]} />
              </View>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>動く時間帯</Text>
              <Text style={styles.kpiValue}>{dashboard.activeTime}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>通算記録</Text>
              <Text style={styles.kpiValue}>{dashboard.totalCount}件</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>最も強かった瞬間</Text>
            {dashboard.strongest ? (
              <View style={styles.strongRow}>
                <View
                  style={[styles.strongColor, { backgroundColor: dashboard.strongest.color_hex }]}
                />
                <View style={styles.strongMeta}>
                  <Text style={styles.strongMain}>
                    {new Date(dashboard.strongest.timestamp).toLocaleString()} / impact{" "}
                    {dashboard.strongest.impact.toFixed(2)}
                  </Text>
                  <Text style={styles.strongSub}>
                    {dashboard.strongest.note ? dashboard.strongest.note : "メモなし"}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyInline}>記録がありません</Text>
            )}
          </View>

          <Pressable onPress={() => setViewMode("list")} style={styles.listOpenBtn}>
            <Text style={styles.listOpenText}>データ一覧を確認する</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Pressable onPress={() => setViewMode("dashboard")} style={styles.backDashboardBtn}>
            <Text style={styles.backDashboardText}>ダッシュボードに戻る</Text>
          </Pressable>
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

      <Modal transparent visible={showMonthMoodInfo} animationType="fade">
        <Pressable style={styles.infoBackdrop} onPress={() => setShowMonthMoodInfo(false)}>
          <Pressable style={styles.infoCard} onPress={() => {}}>
            <Text style={styles.infoTitle}>今月のムードの決まり方</Text>
            <Text style={styles.infoText}>
              今月に記録した色を数えて、いちばん多く選ばれた色が「今月のムード」です。
            </Text>
            <Text style={styles.infoText}>
              その月のあなたがいちばん多く残した気持ちの色を表示しています。
            </Text>
            <Pressable style={styles.infoCloseBtn} onPress={() => setShowMonthMoodInfo(false)}>
              <Text style={styles.infoCloseText}>閉じる</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  dashboardContent: { padding: 16, gap: 12, paddingBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1D2731" },
  sectionMonth: { fontSize: 14, color: "#607080" },
  heroCard: {
    borderWidth: 1,
    borderColor: "#E5E9EF",
    backgroundColor: "#FAFBFD",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E5E9EF",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 13, color: "#4F5E6C", fontWeight: "600" },
  infoBtn: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8DEE5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  heroBody: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroColor: {
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  heroMeta: { gap: 4 },
  heroLine: { color: "#21303D", fontSize: 16, fontWeight: "700" },
  heroSub: { color: "#6A7684", fontSize: 12 },
  monthDotsRow: { flexDirection: "row", justifyContent: "space-between" },
  monthDotWrap: { alignItems: "center", gap: 6 },
  monthDot: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4E8ED",
  },
  monthLabel: { fontSize: 11, color: "#708090" },
  miniField: {
    minHeight: 130,
    borderRadius: 10,
    backgroundColor: "#F7F9FC",
    overflow: "hidden",
    position: "relative",
  },
  miniDot: { position: "absolute", borderRadius: 999 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#E5E9EF",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  kpiLabel: { color: "#667583", fontSize: 12 },
  kpiValue: { color: "#21303D", fontSize: 18, fontWeight: "700" },
  kpiColorRow: { flexDirection: "row", alignItems: "center" },
  kpiColor: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DEE4EB",
  },
  strongRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  strongColor: {
    width: 26,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DEE4EB",
  },
  strongMeta: { gap: 2, flex: 1 },
  strongMain: { color: "#2B3641", fontSize: 12 },
  strongSub: { color: "#74808D", fontSize: 12 },
  emptyInline: { color: "#8A95A2", fontSize: 12 },
  listOpenBtn: {
    backgroundColor: "#1F2630",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  listOpenText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  backDashboardBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#D8DEE5",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 4,
  },
  backDashboardText: { fontSize: 12, color: "#4A5561" },
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
  infoBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  infoCard: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E4E8ED",
    padding: 14,
    gap: 10,
  },
  infoTitle: { fontSize: 15, fontWeight: "700", color: "#24303D" },
  infoText: { fontSize: 13, color: "#4D5A68", lineHeight: 19 },
  infoCloseBtn: {
    marginTop: 4,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#D8DEE5",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  infoCloseText: { fontSize: 12, color: "#4A5561" },
});

function countColors(logs: { color_hex: string }[]) {
  return logs.reduce<Record<string, number>>((acc, log) => {
    const key = log.color_hex;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function pickTopColor(counts: Record<string, number>) {
  let topColor: string | null = null;
  let topCount = -1;
  Object.entries(counts).forEach(([color, count]) => {
    if (count > topCount) {
      topColor = color;
      topCount = count;
    }
  });
  if (!topColor) return null;
  return { color: topColor, count: topCount };
}
