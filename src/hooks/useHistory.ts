import { useState, useEffect, useCallback } from 'react';
import type { ExecutedCommand } from '../models/command.js';
import { readJobs } from '../core/jobs.js';

export function useHistory(sessionId: string): {
  history: ExecutedCommand[];
  reload: () => Promise<void>;
} {
  const [history, setHistory] = useState<ExecutedCommand[]>([]);

  const reload = useCallback(async () => {
    if (!sessionId) {
      setHistory([]);
      return;
    }
    const entries = await readJobs({ sessionId });
    setHistory(entries);
  }, [sessionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { history, reload };
}
