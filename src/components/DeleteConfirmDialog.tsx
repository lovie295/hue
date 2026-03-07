import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export default function DeleteConfirmDialog({ visible, onCancel, onConfirm }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>この瞬間を削除しますか？</Text>
          <Text style={styles.caption}>元に戻せません。</Text>
          <View style={styles.row}>
            <Pressable onPress={onCancel} style={styles.btn}>
              <Text>キャンセル</Text>
            </Pressable>
            <Pressable onPress={() => void onConfirm()} style={[styles.btn, styles.delete]}>
              <Text style={{ color: "#FFF" }}>削除</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", alignItems: "center", justifyContent: "center" },
  card: { width: 280, backgroundColor: "#FFF", borderRadius: 14, padding: 14, gap: 8 },
  title: { fontSize: 15, fontWeight: "600" },
  caption: { fontSize: 12, color: "#666" },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 },
  btn: { paddingHorizontal: 10, paddingVertical: 8 },
  delete: { backgroundColor: "#C03333", borderRadius: 8 },
});

