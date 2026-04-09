import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdir, rm, writeFile, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// vi.hoisted runs before vi.mock — use it to define the temp dir path
// so the factory below can safely reference it.
const { testDataDir } = vi.hoisted(() => {
  const path = require('node:path') as typeof import('node:path');
  const os = require('node:os') as typeof import('node:os');
  return {
    testDataDir: path.join(os.tmpdir(), `ansi-tui-jobs-test-${process.pid}`),
  };
});

vi.mock('env-paths', () => ({
  default: () => ({ data: testDataDir }),
}));

// Import after mock is registered
const { appendJob, readJobs, deleteJob, pruneOldLogs } = await import('../../src/core/jobs.js');
import type { ExecutedCommand } from '../../src/models/command.js';

const makeJob = (overrides: Partial<ExecutedCommand> = {}): ExecutedCommand => ({
  id: `test-${Math.random().toString(36).slice(2)}`,
  sessionId: 'session-abc',
  sessionName: 'test-session',
  timestamp: new Date().toISOString(),
  tool: 'ansible-playbook',
  action: 'run',
  command: ['ansible-playbook', 'site.yml'],
  exitCode: 0,
  durationMs: 1234,
  outputFile: null,
  ...overrides,
});

afterEach(async () => {
  try {
    await rm(testDataDir, { recursive: true, force: true });
  } catch {
    // cleanup best-effort
  }
});

describe('appendJob / readJobs', () => {
  it('records a job and reads it back', async () => {
    const job = makeJob();
    await appendJob(job);

    const results = await readJobs({ sessionId: 'session-abc' });
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe(job.id);
    expect(results[0]!.tool).toBe('ansible-playbook');
    expect(results[0]!.action).toBe('run');
    expect(results[0]!.sessionName).toBe('test-session');
  });

  it('returns newest-first when reading all jobs', async () => {
    const old = makeJob({ timestamp: '2026-01-01T00:00:00.000Z', sessionId: 's1', id: 'old' });
    const newJob = makeJob({ timestamp: '2026-06-01T00:00:00.000Z', sessionId: 's2', id: 'new' });
    await appendJob(old);
    await appendJob(newJob);

    const results = await readJobs();
    expect(results[0]!.id).toBe('new');
    expect(results[1]!.id).toBe('old');
  });

  it('returns empty array when no history exists', async () => {
    const results = await readJobs({ sessionId: 'nonexistent-session' });
    expect(results).toEqual([]);
  });

  it('merges jobs from multiple sessions', async () => {
    await appendJob(makeJob({ sessionId: 'sa', id: 'a' }));
    await appendJob(makeJob({ sessionId: 'sb', id: 'b' }));

    const all = await readJobs();
    const ids = all.map((j) => j.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('respects limit parameter', async () => {
    for (let i = 0; i < 5; i++) {
      await appendJob(makeJob({ id: `job-${i}` }));
    }
    const results = await readJobs({ sessionId: 'session-abc', limit: 3 });
    expect(results).toHaveLength(3);
  });

  it('sanitizes sessionId traversal sequences', async () => {
    const job = makeJob({ id: 'sanitized', sessionId: '../outside' });
    await appendJob(job);

    const results = await readJobs({ sessionId: 'outside' });
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe('sanitized');

    const rootEntries = await readdir(testDataDir);
    expect(rootEntries).not.toContain('outside.jsonl');

    const historyEntries = await readdir(join(testDataDir, 'history'));
    expect(historyEntries).toContain('outside.jsonl');
  });
});

describe('deleteJob', () => {
  it('removes a job by id', async () => {
    const job1 = makeJob({ id: 'keep' });
    const job2 = makeJob({ id: 'remove' });
    await appendJob(job1);
    await appendJob(job2);

    await deleteJob('remove', 'session-abc');

    const results = await readJobs({ sessionId: 'session-abc' });
    expect(results.map((j) => j.id)).not.toContain('remove');
    expect(results.map((j) => j.id)).toContain('keep');
  });

  it('does not throw when session file does not exist', async () => {
    await expect(deleteJob('nonexistent', 'ghost-session')).resolves.not.toThrow();
  });

  it('does not unlink outputFile outside logsDir', async () => {
    await mkdir(testDataDir, { recursive: true });
    const outputFile = join(testDataDir, 'should-not-delete.log');
    await writeFile(outputFile, 'keep me', 'utf-8');
    await appendJob(makeJob({ id: 'tampered', outputFile }));

    await deleteJob('tampered', 'session-abc');

    await expect(readFile(outputFile, 'utf-8')).resolves.toBe('keep me');
  });
});

describe('pruneOldLogs', () => {
  it('removes oldest log files beyond maxCount', async () => {
    const logsDir = join(testDataDir, 'logs');
    await mkdir(logsDir, { recursive: true });

    for (let i = 1; i <= 5; i++) {
      const name = `2026-01-0${i}T00-00-00-000Z-ansible-playbook.log`;
      await writeFile(join(logsDir, name), `log ${i}`);
    }

    await pruneOldLogs(3);

    const remaining = await readdir(logsDir);
    expect(remaining).toHaveLength(3);
    expect(remaining.some((f) => f.includes('-01T'))).toBe(false);
    expect(remaining.some((f) => f.includes('-02T'))).toBe(false);
    expect(remaining.some((f) => f.includes('-05T'))).toBe(true);
  });

  it('does not throw when logs directory does not exist', async () => {
    await expect(pruneOldLogs(10)).resolves.not.toThrow();
  });
});
