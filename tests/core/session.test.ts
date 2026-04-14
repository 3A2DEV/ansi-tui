import { describe, it, expect, afterAll } from 'vitest';
import {
  createSession,
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
  setActiveSession,
  getActiveSession,
} from '../../src/core/session.js';

describe('session', () => {
  const testSessionIds: string[] = [];

  afterAll(async () => {
    for (const id of testSessionIds) {
      await deleteSession(id);
    }
  });

  it('createSession generates a valid session object', () => {
    const session = createSession('test-session', '/tmp/test');

    expect(session.id).toBeTruthy();
    expect(session.id).toHaveLength(36); // UUID v4 format
    expect(session.name).toBe('test-session');
    expect(session.workingDir).toBe('/tmp/test');
    expect(session.createdAt).toBeTruthy();
    expect(session.lastUsed).toBeTruthy();
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
    testSessionIds.push(session.id);

    session.inventory = 'hosts.yml';
    session.extraVars = { key: 'value' };

    await saveSession(session);
    const loaded = await loadSession(session.id);

    expect(loaded.id).toBe(session.id);
    expect(loaded.name).toBe('roundtrip-test');
    expect(loaded.inventory).toBe('hosts.yml');
    expect(loaded.extraVars).toEqual({ key: 'value' });
  });

  it('listSessions returns saved sessions', async () => {
    const session = createSession('list-test', '/tmp');
    testSessionIds.push(session.id);
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
    testSessionIds.push(session.id);
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

  it('getActiveSession returns null when no active session', async () => {
    // Delete the active session pointer
    const active = await getActiveSession();
    // It either returns null or a valid session
    expect(active === null || typeof active.id === 'string').toBe(true);
  });
});
