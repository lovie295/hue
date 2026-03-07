type LogRow = {
  id: string;
  color_hex: string;
  impact: number;
  shape: string;
  timestamp: string;
  location: string | null;
  photo_url: string | null;
  spotify_url: string | null;
  note: string | null;
};

const store = new Map<string, LogRow>();
const metaStore = new Map<string, string>();

const webDb = {
  async execAsync(sql: string): Promise<void> {
    // No-op on web fallback store.
    if (sql.includes("ALTER TABLE logs ADD COLUMN shape")) {
      for (const [id, value] of store.entries()) {
        store.set(id, { ...value, shape: value.shape ?? "circle" });
      }
    }
  },
  async getAllAsync(sql: string): Promise<any[]> {
    if (sql.includes("PRAGMA table_info(logs)")) {
      return [{ name: "shape" }];
    }
    return Array.from(store.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },
  async getFirstAsync(_sql: string, params: unknown[] = []): Promise<LogRow | null> {
    if (_sql.includes("FROM app_meta")) {
      const key = String(params[0] ?? "");
      const value = metaStore.get(key);
      return value == null ? null : ({ value } as unknown as LogRow);
    }
    const id = String(params[0] ?? "");
    return store.get(id) ?? null;
  },
  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.includes("INSERT INTO logs")) {
      const [id, color_hex, impact, shape, timestamp] = params;
      store.set(String(id), {
        id: String(id),
        color_hex: String(color_hex),
        impact: Number(impact),
        shape: String(shape ?? "circle"),
        timestamp: String(timestamp),
        location: null,
        photo_url: null,
        spotify_url: null,
        note: null,
      });
      return;
    }

    if (sql.includes("UPDATE logs") && sql.includes("SET location")) {
      const [location, photo_url, spotify_url, note, id] = params;
      const prev = store.get(String(id));
      if (!prev) return;
      store.set(String(id), {
        ...prev,
        location: location == null ? null : String(location),
        photo_url: photo_url == null ? null : String(photo_url),
        spotify_url: spotify_url == null ? null : String(spotify_url),
        note: note == null ? null : String(note),
      });
      return;
    }

    if (sql.includes("UPDATE logs") && sql.includes("SET color_hex")) {
      const [color_hex, id] = params;
      const prev = store.get(String(id));
      if (!prev) return;
      store.set(String(id), {
        ...prev,
        color_hex: String(color_hex),
      });
      return;
    }

    if (sql.includes("INSERT OR REPLACE INTO app_meta")) {
      const [key, value] = params;
      metaStore.set(String(key), String(value));
      return;
    }

    if (sql.includes("DELETE FROM logs")) {
      const [id] = params;
      store.delete(String(id));
    }
  },
};

export const getDb = async () => webDb;
