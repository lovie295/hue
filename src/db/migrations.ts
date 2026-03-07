import { getDb } from "./client";

let migrated = false;
let migratingPromise: Promise<void> | null = null;

export const migrate = async (): Promise<void> => {
  if (migrated) return;
  if (migratingPromise) {
    await migratingPromise;
    return;
  }

  migratingPromise = (async () => {
    const db = await getDb();

    await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY NOT NULL,
      color_hex TEXT NOT NULL,
      impact REAL NOT NULL,
      shape TEXT NOT NULL DEFAULT 'circle',
      timestamp TEXT NOT NULL,
      location TEXT,
      photo_url TEXT,
      spotify_url TEXT,
      note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

    const columns = await db.getAllAsync(`PRAGMA table_info(logs)`);
    const hasShape = columns.some((col: any) => String(col.name) === "shape");
    if (!hasShape) {
      try {
        await db.execAsync(`ALTER TABLE logs ADD COLUMN shape TEXT NOT NULL DEFAULT 'circle';`);
      } catch (error: any) {
        const message = String(error?.message ?? error ?? "");
        if (!message.includes("duplicate column name: shape")) {
          throw error;
        }
      }
    }

    // One-time data normalization for legacy records:
    // convert old shape variations into circle/square by impact.
    const normalized = await db.getFirstAsync(
      `SELECT value FROM app_meta WHERE key = 'shape_binary_migrated_v1'`
    );
    if (!normalized || String((normalized as any).value) !== "1") {
      await db.execAsync(`
        UPDATE logs
        SET shape = CASE
          WHEN impact >= 0.5 THEN 'square'
          ELSE 'circle'
        END;
      `);
      await db.runAsync(
        `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
        ["shape_binary_migrated_v1", "1"]
      );
    }

    migrated = true;
  })();

  try {
    await migratingPromise;
  } finally {
    migratingPromise = null;
  }
};
