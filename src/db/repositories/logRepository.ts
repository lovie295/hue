import { AddOnInput, CoreInput, MoodLog } from "../../types/mood";
import { getDb } from "../client";
import { migrate } from "../migrations";

const toMoodLog = (row: any): MoodLog => ({
  id: String(row.id),
  color_hex: String(row.color_hex),
  impact: Number(row.impact),
  shape: (row.shape ? String(row.shape) : "circle") as MoodLog["shape"],
  timestamp: String(row.timestamp),
  location: row.location ?? undefined,
  photo_url: row.photo_url ?? undefined,
  spotify_url: row.spotify_url ?? undefined,
  note: row.note ?? undefined,
});

export const listLogs = async (): Promise<MoodLog[]> => {
  await migrate();
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT id, color_hex, impact, shape, timestamp, location, photo_url, spotify_url, note
     FROM logs
     ORDER BY timestamp DESC`
  );
  return rows.map(toMoodLog);
};

export const getLogById = async (id: string): Promise<MoodLog | null> => {
  await migrate();
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT id, color_hex, impact, shape, timestamp, location, photo_url, spotify_url, note
     FROM logs
     WHERE id = ?`,
    [id]
  );
  return row ? toMoodLog(row) : null;
};

export const createLogCore = async (input: CoreInput): Promise<{ id: string }> => {
  await migrate();
  const db = await getDb();
  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO logs (id, color_hex, impact, shape, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.color_hex, input.impact, input.shape, timestamp]
  );
  return { id };
};

export const updateLogAddOn = async (id: string, addOn: AddOnInput): Promise<void> => {
  await migrate();
  const db = await getDb();
  await db.runAsync(
    `UPDATE logs
     SET location = ?, photo_url = ?, spotify_url = ?, note = ?
     WHERE id = ?`,
    [addOn.location ?? null, addOn.photo_url ?? null, addOn.spotify_url ?? null, addOn.note ?? null, id]
  );
};

export const updateLogColor = async (id: string, colorHex: string): Promise<void> => {
  await migrate();
  const db = await getDb();
  await db.runAsync(
    `UPDATE logs
     SET color_hex = ?
     WHERE id = ?`,
    [colorHex, id]
  );
};

export const deleteLog = async (id: string): Promise<void> => {
  await migrate();
  const db = await getDb();
  await db.runAsync(`DELETE FROM logs WHERE id = ?`, [id]);
};
