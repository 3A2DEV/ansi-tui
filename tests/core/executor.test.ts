import { describe, it, expect, afterAll } from 'vitest';
import { run } from '../../src/core/executor.js';
import { unlink } from 'node:fs/promises';

describe('executor', () => {
  const createdFiles: string[] = [];

  afterAll(async () => {
    for (const file of createdFiles) {
      try {
        await unlink(file);
      } catch {
        // ignore cleanup errors
      }
    }
  });

  it('runs a simple command and returns exit code 0', async () => {
    const outputLines: string[] = [];

    const result = await run({
      command: ['echo', 'hello world'],
      env: {},
      cwd: process.cwd(),
      onOutput: (line) => outputLines.push(line),
      onError: () => {},
    });

    expect(result.exitCode).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.outputFile).toBeTruthy();
    createdFiles.push(result.outputFile);
  });

  it('captures output lines', async () => {
    const outputLines: string[] = [];

    const result = await run({
      command: ['echo', 'line1'],
      env: {},
      cwd: process.cwd(),
      onOutput: (line) => outputLines.push(line),
      onError: () => {},
    });

    expect(result.exitCode).toBe(0);
    createdFiles.push(result.outputFile);
  });

  it('handles non-zero exit code', async () => {
    const result = await run({
      command: ['sh', '-c', 'exit 42'],
      env: {},
      cwd: process.cwd(),
      onOutput: () => {},
      onError: () => {},
    });

    expect(result.exitCode).toBe(42);
    createdFiles.push(result.outputFile);
  });

  it('saves log file with command metadata', async () => {
    const result = await run({
      command: ['echo', 'test-log'],
      env: {},
      cwd: '/tmp',
      onOutput: () => {},
      onError: () => {},
    });

    expect(result.outputFile).toContain('.log');
    createdFiles.push(result.outputFile);
  });
});
