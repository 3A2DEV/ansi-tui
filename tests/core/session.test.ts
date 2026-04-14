import { rm } from 'node:fs/promises';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { testDataDir } = vi.hoisted(() => {
  const path = require('node:path') as typeof import('node:path');
  const os = require('node:os') as typeof import('node:os');
  return {
    testDataDir: path.join(os.tmpdir(), `ansi-tui-session-test-${process.pid}`),
  };
});

vi.mock('env-paths', () => ({
  default: () => ({ data: testDataDir }),
}));

const {
  createSession,
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
  setActiveSession,
  getActiveSession,
} = await import('../../src/core/session.js');

describe('session', () => {
  beforeEach(async () => {
    await rm(testDataDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(testDataDir, { recursive: true, force: true });
  });

  it('createSession generates a valid session object', () => {
    const session = createSession('test-session', '/tmp/test');

    expect(session.id).toBeTruthy();
    expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4 format
    expect(session.name).toBe('test-session');
    expect(session.workingDir).toBe('/tmp/test');
    expect(typeof session.createdAt).toBe('string');
    expect(typeof session.lastUsed).toBe('string');
    expect(Number.isNaN(Date.parse(session.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(session.lastUsed))).toBe(false);
    expect(session.createdAt).toBe(session.lastUsed);
    expect(session.inventory).toBeNull();
    expect(session.vaultPasswordFile).toBeNull();
    expect(session.vaultId).toBeNull();
    expect(session.extraVars).toEqual({});
    expect(session.envVars).toEqual({});
    expect(session.ansibleCfg).toBeNull();
    expect(session.tags).toEqual([]);
    expect(session.notes).toBe('');
  });

  it('saveSession and loadSession roundtrip', async () => {
    const session = createSession('roundtrip-test', '/tmp');

    session.inventory = 'hosts.yml';
    session.extraVars = { key: 'value' };

    await saveSession(session);
    const loaded = await loadSession(session.id);

    expect(loaded.id).toBe(session.id);
    expect(loaded.name).toBe('roundtrip-test');
    expect(loaded.inventory).toBe('hosts.yml');
    expect(loaded.extraVars).toEqual({ key: 'value' });
  });

  it('loadSession handles non-existent session IDs', async () => {
    try {
      const loaded = await loadSession('missing-session-id');
      expect(loaded).toBeNull();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('listSessions returns saved sessions', async () => {
    const session = createSession('list-test', '/tmp');
    await saveSession(session);

    const sessions = await listSessions();
    const found = sessions.find((s) => s.id === session.id);
    expect(found).toBeTruthy();
    expect(found?.name).toBe('list-test');
  });

  it('deleteSession removes session file', async () => {
    const session = createSession('delete-test', '/tmp');
    await saveSession(session);

    await deleteSession(session.id);

    const sessions = await listSessions();
    const found = sessions.find((s) => s.id === session.id);
    expect(found).toBeUndefined();
  });

  it('setActiveSession and getActiveSession roundtrip', async () => {
    const session = createSession('active-test', '/tmp');
    await saveSession(session);

    await setActiveSession(session.id);
    const active = await getActiveSession();

    expect(active).toBeTruthy();
    expect(active?.id).toBe(session.id);
    expect(active?.name).toBe('active-test');
  });

  it('deleteSession clears the active session pointer for the deleted session', async () => {
    const session = createSession('active-delete-test', '/tmp');
    await saveSession(session);

    await setActiveSession(session.id);
    await deleteSession(session.id);

    const active = await getActiveSession();
    expect(active).toBeNull();
  });

  it('setActiveSession with non-existent session ID results in no active session', async () => {
    await setActiveSession('00000000-0000-4000-8000-000000000000');

    const active = await getActiveSession();
    expect(active).toBeNull();
  });

  it('getActiveSession returns null when no active session', async () => {
    const active = await getActiveSession();
    expect(active).toBeNull();
  });
});
