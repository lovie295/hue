export type MoodShape =
  | "heart"
  | "lightning"
  | "rain"
  | "cloud"
  | "drop"
  | "doodle"
  | "circle"
  | "square"
  | "triangle"
  | "organic"
  | "rounded"
  | "pill"
  | "diamond"
  | "pebble"
  | "star";

export type MoodLog = {
  id: string;
  color_hex: string;
  impact: number; // 0..1
  shape: MoodShape;
  timestamp: string; // ISO8601
  location?: string;
  photo_url?: string;
  spotify_url?: string;
  note?: string;
};

export type CoreInput = {
  color_hex: string;
  impact: number;
  shape: MoodShape;
};

export type AddOnInput = {
  location?: string;
  photo_url?: string;
  spotify_url?: string;
  note?: string;
};
