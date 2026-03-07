import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DeleteConfirmDialog from "../../components/DeleteConfirmDialog";
import MoodBlob from "../../components/MoodBlob";
import { useLogs } from "../../hooks/useLogs";
import { MoodLog } from "../../types/mood";

export default function DetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, remove } = useLogs();
  const [log, setLog] = useState<MoodLog | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    void getById(id).then(setLog);
  }, [id, getById]);

  if (!log) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.caption}>ログが見つかりません</Text>
          <Pressable onPress={() => router.replace("/")} style={styles.backBtn}>
            <Text>ホームへ戻る</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <MoodBlob color={log.color_hex} impact={log.impact} shape={log.shape} />
        </View>
        <InfoRow label="Impact" value={log.impact.toFixed(2)} />
        <InfoRow label="日時" value={new Date(log.timestamp).toLocaleString()} />
        {log.location ? <InfoRow label="場所" value={log.location} /> : null}
        {log.photo_url ? (
          <View style={styles.photoCard}>
            <Text style={styles.key}>写真</Text>
            <Image source={{ uri: log.photo_url }} style={styles.photo} resizeMode="cover" />
          </View>
        ) : null}
        {log.spotify_url ? <InfoRow label="Spotify" value={log.spotify_url} /> : null}
        {log.note ? <InfoRow label="一言" value={log.note} /> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.secondary} onPress={() => router.back()}>
          <Text>閉じる</Text>
        </Pressable>
        <Pressable style={styles.delete} onPress={() => setConfirmVisible(true)}>
          <Text style={{ color: "#FFF" }}>削除</Text>
        </Pressable>
      </View>

      <DeleteConfirmDialog
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={async () => {
          await remove(log.id);
          setConfirmVisible(false);
          router.replace("/");
        }}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.key}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F5" },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  hero: {
    height: 220,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
    backgroundColor: "#FFF",
    padding: 12,
    gap: 4,
  },
  photoCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
    backgroundColor: "#FFF",
    padding: 12,
    gap: 8,
  },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#F0F2F5",
  },
  key: { fontSize: 12, color: "#666" },
  value: { fontSize: 14, color: "#202020" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  caption: { color: "#666" },
  backBtn: { borderWidth: 1, borderColor: "#DDD", borderRadius: 10, padding: 8 },
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
  delete: { backgroundColor: "#C03333", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
});
