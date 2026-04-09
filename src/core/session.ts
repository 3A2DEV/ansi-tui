import { mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import envPaths from 'env-paths';
import { v4 as uuidv4 } from 'uuid';
import type { Session } from '../models/session.js';

const paths = envPaths('ansi-tui');
const sessionsDir = join(paths.data, 'sessions');
const activeSessionFile = join(paths.data, 'active_session');

async function ensureDir(): Promise<void> {
  await mkdir(sessionsDir, { recursive: true });
}

export async function listSessions(): Promise<Session[]> {
  await ensureDir();

  let files: string[];
  try {
    const entries = await readdir(sessionsDir);
    files = entries.filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }

  const sessions = await Promise.all(
    files.map(async (file) => {
      const content = await readFile(join(sessionsDir, file), 'utf-8');
      return JSON.parse(content) as Session;
    })
  );

  return sessions.sort(
    (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
  );
}

export async function loadSession(id: string): Promise<Session> {
  const content = await readFile(join(sessionsDir, `${id}.json`), 'utf-8');
  return JSON.parse(content) as Session;
}

export async function saveSession(session: Session): Promise<void> {
  await ensureDir();
  session.lastUsed = new Date().toISOString();
  await writeFile(
    join(sessionsDir, `${session.id}.json`),
    JSON.stringify(session, null, 2),
    'utf-8'
  );
}

export async function deleteSession(id: string): Promise<void> {
  await ensureDir();

  try {
    await unlink(join(sessionsDir, `${id}.json`));
  } catch {
    // session file doesn't exist
  }

  try {
    const activeId = (await readFile(activeSessionFile, 'utf-8')).trim();
    if (activeId === id) {
      await unlink(activeSessionFile);
    }
  } catch {
    // active pointer missing or unreadable
  }
}

export async function getActiveSession(): Promise<Session | null> {
  try {
    const id = (await readFile(activeSessionFile, 'utf-8')).trim();
    if (!id) return null;
    return await loadSession(id);
  } catch {
    return null;
  }
}

export async function setActiveSession(id: string): Promise<void> {
  await ensureDir();
  await writeFile(activeSessionFile, id, 'utf-8');
}

export function createSession(name: string, workingDir: string): Session {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name,
    createdAt: now,
    lastUsed: now,
    workingDir,
    inventory: null,
    vaultPasswordFile: null,
    vaultId: null,
    extraVars: {},
    envVars: {},
    ansibleCfg: null,
    tags: [],
    notes: '',
  };
}
