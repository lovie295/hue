import { MoodShape } from "../types/mood";

export type ShapeOption = { key: MoodShape; label: string; glyph: string };

export const ALL_SHAPE_OPTIONS: ShapeOption[] = [
  { key: "circle", label: "まる", glyph: "●" },
  { key: "square", label: "しかく", glyph: "■" },
  { key: "diamond", label: "ダイヤ", glyph: "◆" },
  { key: "lightning", label: "かみなり", glyph: "zap" },
  { key: "rain", label: "あめ", glyph: "cloud-rain" },
  { key: "heart", label: "ハート", glyph: "♥︎" },
  { key: "triangle", label: "さんかく", glyph: "▲" },
  { key: "doodle", label: "せん", glyph: "edit-3" },
  { key: "organic", label: "にじみ", glyph: "◍" },
];

export const DEFAULT_PICKER_SHAPE_KEYS: MoodShape[] = ["circle", "square", "diamond"];

const SHAPE_OPTION_BY_KEY: Record<string, ShapeOption> = Object.fromEntries(
  ALL_SHAPE_OPTIONS.map((shape) => [shape.key, shape])
);

export const toShapeOptions = (keys: MoodShape[]): ShapeOption[] =>
  keys.map((key) => SHAPE_OPTION_BY_KEY[key]).filter(Boolean);

// Backward-compatible export for stale bundles during fast refresh.
export const SHAPE_OPTIONS: ShapeOption[] = toShapeOptions(DEFAULT_PICKER_SHAPE_KEYS);
