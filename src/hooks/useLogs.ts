import { useCallback, useEffect, useState } from "react";
import {
  createLogCore,
  deleteLog as removeLogById,
  getLogById,
  listLogs,
  updateLogColor,
  updateLogAddOn,
} from "../db/repositories/logRepository";
import { migrate } from "../db/migrations";
import { AddOnInput, CoreInput, MoodLog } from "../types/mood";

export const useLogs = () => {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      await migrate();
      const items = await listLogs();
      setLogs(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(async (input: CoreInput) => {
    const created = await createLogCore(input);
    await reload();
    return created;
  }, [reload]);

  const addOn = useCallback(async (id: string, input: AddOnInput) => {
    await updateLogAddOn(id, input);
    await reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    await removeLogById(id);
    await reload();
  }, [reload]);

  const recolor = useCallback(async (pairs: Array<{ id: string; color_hex: string }>) => {
    for (const pair of pairs) {
      await updateLogColor(pair.id, pair.color_hex);
    }
    await reload();
  }, [reload]);

  const getById = useCallback(async (id: string) => {
    return getLogById(id);
  }, []);

  return { logs, loading, create, addOn, remove, recolor, reload, getById };
};
