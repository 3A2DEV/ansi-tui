import { useState, useEffect, useCallback } from 'react';
import type { Session } from '../models/session.js';
import {
  listSessions,
  loadSession,
  saveSession,
  deleteSession,
  getActiveSession,
  setActiveSession,
  createSession,
} from '../core/session.js';

export function useSession(): {
  activeSession: Session | null;
  sessions: Session[];
  setActive: (id: string) => Promise<void>;
  create: (name: string, workingDir: string) => Promise<Session>;
  update: (session: Session) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
} {
  const [activeSession, setActiveSessionState] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const reload = useCallback(async () => {
    const [allSessions, active] = await Promise.all([
      listSessions(),
      getActiveSession(),
    ]);
    setSessions(allSessions);
    setActiveSessionState(active);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setActive = useCallback(
    async (id: string) => {
      await setActiveSession(id);
      const session = await loadSession(id);
      setActiveSessionState(session);
    },
    []
  );

  const create = useCallback(
    async (name: string, workingDir: string) => {
      const session = createSession(name, workingDir);
      await saveSession(session);
      await setActiveSession(session.id);
      await reload();
      return session;
    },
    [reload]
  );

  const update = useCallback(
    async (session: Session) => {
      await saveSession(session);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSession(id);
      await reload();
    },
    [reload]
  );

  return { activeSession, sessions, setActive, create, update, remove, reload };
}
