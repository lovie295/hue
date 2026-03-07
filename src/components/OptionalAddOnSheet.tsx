import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AddOnInput } from "../types/mood";

type Props = {
  visible: boolean;
  onSubmit: (value: AddOnInput) => Promise<void>;
  onSkip: () => void;
};

type PlaceSuggestion = {
  description: string;
  place_id: string;
};

type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
};

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const SPOTIFY_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: "hueapprun",
  path: "spotify-auth",
});

WebBrowser.maybeCompleteAuthSession();

export default function OptionalAddOnSheet({ visible, onSubmit, onSkip }: Props) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [spotifyToken, setSpotifyToken] = useState("");
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState<{ photo: boolean; music: boolean; note: boolean; location: boolean }>({
    photo: false,
    music: false,
    note: false,
    location: false,
  });
  const requestSeq = useRef(0);
  const spotifyRequestSeq = useRef(0);

  const submit = async () => {
    await onSubmit({
      photo_url: photoUrl || undefined,
      spotify_url: spotifyUrl || undefined,
      note: note || undefined,
      location: location || undefined,
    });
    setPhotoUrl("");
    setSpotifyUrl("");
    setSpotifyQuery("");
    setSpotifyResults([]);
    setSpotifyLoading(false);
    setSpotifyToken("");
    setSpotifyConnected(false);
    setNote("");
    setLocation("");
    setSuggestions([]);
    setLocationLoading(false);
    setOpen({ photo: false, music: false, note: false, location: false });
  };

  const toggle = (key: "photo" | "music" | "note" | "location") => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("写真へのアクセスが必要です");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const data = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setPhotoUrl(data);
      setOpen((prev) => ({ ...prev, photo: true }));
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("カメラへのアクセスが必要です");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const data = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setPhotoUrl(data);
      setOpen((prev) => ({ ...prev, photo: true }));
    }
  };

  const openPhotoPicker = () => {
    Alert.alert("写真を追加", "選択してください", [
      { text: "カメラで撮影", onPress: () => void pickFromCamera() },
      { text: "アルバムから選ぶ", onPress: () => void pickFromLibrary() },
      { text: "キャンセル", style: "cancel" },
    ]);
  };

  const connectSpotify = async () => {
    if (!SPOTIFY_CLIENT_ID) {
      Alert.alert("Spotify設定が必要です", "EXPO_PUBLIC_SPOTIFY_CLIENT_ID を設定してください");
      return;
    }

    const authUrl =
      `https://accounts.spotify.com/authorize?client_id=${encodeURIComponent(SPOTIFY_CLIENT_ID)}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent("user-read-email")}`;

    try {
      const res = await WebBrowser.openAuthSessionAsync(authUrl, SPOTIFY_REDIRECT_URI);
      if (res.type !== "success" || !res.url) return;
      const token = extractAccessToken(res.url);
      if (!token) {
        Alert.alert("Spotify連携に失敗しました", "トークンを取得できませんでした");
        return;
      }
      setSpotifyToken(token);
      setSpotifyConnected(true);
    } catch {
      Alert.alert("Spotify連携に失敗しました");
    }
  };

  const resolveCurrentLocation = async () => {
    setOpen((prev) => ({ ...prev, location: true }));
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("位置情報へのアクセスが必要です");
      return;
    }
    try {
      setLocationLoading(true);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const addresses = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const first = addresses[0];
      const label = [first?.region, first?.city, first?.district, first?.name]
        .filter(Boolean)
        .join(" ");
      setLocation(label || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      setSuggestions([]);
    } catch {
      Alert.alert("現在地の取得に失敗しました");
    } finally {
      setLocationLoading(false);
    }
  };

  const openLocationPicker = () => {
    Alert.alert("場所を追加", "現在地を登録しますか？", [
      { text: "現在地を登録", onPress: () => void resolveCurrentLocation() },
      { text: "検索して選ぶ", onPress: () => setOpen((prev) => ({ ...prev, location: true })) },
      { text: "キャンセル", style: "cancel" },
    ]);
  };

  useEffect(() => {
    if (!open.location) return;
    if (!GOOGLE_PLACES_API_KEY || location.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    const timer = setTimeout(async () => {
      try {
        const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          location
        )}&language=ja&types=geocode&key=${GOOGLE_PLACES_API_KEY}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        if (requestSeq.current !== seq) return;
        if (!Array.isArray(data?.predictions)) {
          setSuggestions([]);
          return;
        }
        const next = data.predictions
          .slice(0, 5)
          .map((p: any) => ({ description: String(p.description), place_id: String(p.place_id) }));
        setSuggestions(next);
      } catch {
        setSuggestions([]);
      }
    }, 340);

    return () => clearTimeout(timer);
  }, [location, open.location]);

  useEffect(() => {
    if (!open.music) return;
    if (!spotifyToken || spotifyQuery.trim().length < 2) {
      setSpotifyResults([]);
      return;
    }
    const seq = spotifyRequestSeq.current + 1;
    spotifyRequestSeq.current = seq;
    const timer = setTimeout(async () => {
      try {
        setSpotifyLoading(true);
        const endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          spotifyQuery
        )}&type=track&limit=6&market=JP`;
        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
          },
        });
        const data = await res.json();
        if (spotifyRequestSeq.current !== seq) return;
        const items = Array.isArray(data?.tracks?.items) ? data.tracks.items : [];
        const next: SpotifyTrack[] = items.map((t: any) => ({
          id: String(t.id),
          title: String(t.name),
          artist: Array.isArray(t.artists) ? t.artists.map((a: any) => a.name).join(", ") : "",
          url: String(t?.external_urls?.spotify ?? ""),
        }));
        setSpotifyResults(next.filter((t) => t.url));
      } catch {
        setSpotifyResults([]);
      } finally {
        setSpotifyLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [spotifyQuery, spotifyToken, open.music]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>任意情報を追加</Text>
          <View style={styles.iconRow}>
            <IconCircle
              icon="camera"
              active={open.photo || !!photoUrl}
              onPress={() => {
                toggle("photo");
                openPhotoPicker();
              }}
            />
            <IconCircle icon="music" active={open.music || !!spotifyUrl} onPress={() => toggle("music")} />
            <IconCircle icon="edit-3" active={open.note || !!note} onPress={() => toggle("note")} />
            <IconCircle icon="map-pin" active={open.location || !!location} onPress={openLocationPicker} />
          </View>

          {open.photo ? (
            <View style={styles.inputBlock}>
              <TextInput
                placeholder="写真データ（自動入力）"
                value={photoUrl ? "写真を保存済み" : ""}
                editable={false}
                style={styles.input}
              />
              <View style={styles.photoActions}>
                <Pressable style={styles.smallBtn} onPress={() => void pickFromCamera()}>
                  <Text style={styles.smallBtnText}>撮影</Text>
                </Pressable>
                <Pressable style={styles.smallBtn} onPress={() => void pickFromLibrary()}>
                  <Text style={styles.smallBtnText}>アルバム</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {open.music ? (
            <View style={styles.inputBlock}>
              {!spotifyConnected ? (
                <Pressable style={styles.connectBtn} onPress={() => void connectSpotify()}>
                  <Text style={styles.connectBtnText}>Spotifyと連携する</Text>
                </Pressable>
              ) : null}
              {spotifyConnected ? (
                <>
                  <TextInput
                    placeholder="曲名・アーティストで検索"
                    value={spotifyQuery}
                    onChangeText={setSpotifyQuery}
                    style={styles.input}
                  />
                  {spotifyLoading ? <Text style={styles.metaText}>検索中...</Text> : null}
                  {spotifyResults.length > 0 ? (
                    <View style={styles.suggestionList}>
                      {spotifyResults.map((track) => (
                        <Pressable
                          key={track.id}
                          onPress={() => {
                            setSpotifyUrl(track.url);
                            setSpotifyQuery(`${track.title} - ${track.artist}`);
                            setSpotifyResults([]);
                          }}
                          style={styles.suggestionItem}
                        >
                          <Text style={styles.suggestionText}>{track.title}</Text>
                          <Text style={styles.metaText}>{track.artist}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : null}
              {spotifyUrl ? <Text style={styles.metaText}>選択済み: {spotifyQuery || "Spotifyトラック"}</Text> : null}
              <TextInput placeholder="Spotify URL（手入力も可）" value={spotifyUrl} onChangeText={setSpotifyUrl} style={styles.input} />
              {!SPOTIFY_CLIENT_ID ? (
                <Text style={styles.metaText}>連携には EXPO_PUBLIC_SPOTIFY_CLIENT_ID の設定が必要です</Text>
              ) : null}
            </View>
          ) : null}

          {open.note ? (
            <View style={styles.inputBlock}>
              <TextInput placeholder="一言" value={note} onChangeText={setNote} style={styles.input} />
            </View>
          ) : null}

          {open.location ? (
            <View style={styles.inputBlock}>
              <TextInput placeholder="場所" value={location} onChangeText={setLocation} style={styles.input} />
              {locationLoading ? <Text style={styles.metaText}>現在地を取得中...</Text> : null}
              {suggestions.length > 0 ? (
                <View style={styles.suggestionList}>
                  {suggestions.map((s) => (
                    <Pressable
                      key={s.place_id}
                      onPress={() => {
                        setLocation(s.description);
                        setSuggestions([]);
                      }}
                      style={styles.suggestionItem}
                    >
                      <Text style={styles.suggestionText}>{s.description}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {!GOOGLE_PLACES_API_KEY ? (
                <Text style={styles.metaText}>候補表示には Google Maps API キー設定が必要です</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.row}>
            <Pressable style={styles.ghost} onPress={onSkip}>
              <Text>いまは追加しない</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={submit}>
              <Text style={{ color: "#FFF" }}>完了</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function IconCircle({
  icon,
  active,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.iconBtn, active && styles.iconBtnActive]}>
      <Feather name={icon} size={21} color={active ? "#3B3B3B" : "#6D6D6D"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.15)", justifyContent: "flex-end" },
  card: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 16, fontWeight: "600" },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  iconBtn: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnActive: {
    borderColor: "#9DA8B5",
    backgroundColor: "#F2F6FA",
  },
  inputBlock: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  photoActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: "#DADDE2",
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "#FFF",
  },
  smallBtnText: { fontSize: 12, color: "#3C3C3C" },
  connectBtn: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D7DE",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  connectBtnText: { color: "#2F3640", fontSize: 13, fontWeight: "600" },
  metaText: { fontSize: 11, color: "#7A8088" },
  suggestionList: {
    borderWidth: 1,
    borderColor: "#E1E5EA",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  suggestionItem: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEF1F4",
  },
  suggestionText: { fontSize: 13, color: "#2F3640" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  ghost: { paddingHorizontal: 10, paddingVertical: 10 },
  primary: { backgroundColor: "#222", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
});

function extractAccessToken(url: string): string {
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return "";
  const hash = url.slice(hashIndex + 1);
  const params = new URLSearchParams(hash);
  return params.get("access_token") ?? "";
}
