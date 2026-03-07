import { DEFAULT_PICKER_SHAPE_KEYS } from "../../theme/shapes";
import { MoodShape } from "../../types/mood";
import { getDb } from "../client";
import { migrate } from "../migrations";

const KEY = "shape_picker_keys_v1";
const ALLOWED = new Set<MoodShape>([
  "circle",
  "square",
  "diamond",
  "lightning",
  "rain",
  "heart",
  "triangle",
  "doodle",
  "organic",
]);

const normalize = (keys: MoodShape[]): MoodShape[] => {
  const unique: MoodShape[] = [];
  for (const key of keys) {
    if (!ALLOWED.has(key)) continue;
    if (!unique.includes(key)) unique.push(key);
    if (unique.length >= 3) break;
  }
  while (unique.length < 3) {
    const fallback = DEFAULT_PICKER_SHAPE_KEYS[unique.length];
    if (!unique.includes(fallback)) unique.push(fallback);
  }
  return unique;
};

export const getShapePickerKeys = async (): Promise<MoodShape[]> => {
  await migrate();
  const db = await getDb();
  const row = await db.getFirstAsync(`SELECT value FROM app_meta WHERE key = ?`, [KEY]);
  const raw = row ? (row as any).value : null;
  if (!raw) return DEFAULT_PICKER_SHAPE_KEYS;
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return DEFAULT_PICKER_SHAPE_KEYS;
    return normalize(parsed as MoodShape[]);
  } catch {
    return DEFAULT_PICKER_SHAPE_KEYS;
  }
};

export const setShapePickerKeys = async (keys: MoodShape[]): Promise<MoodShape[]> => {
  const normalized = normalize(keys);
  await migrate();
  const db = await getDb();
  await db.runAsync(`INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`, [
    KEY,
    JSON.stringify(normalized),
  ]);
  return normalized;
};
