import { useState, useCallback } from 'react';
import { randomUUID } from 'node:crypto';
import type { RunOptions } from '../core/executor.js';
import { run } from '../core/executor.js';
import { appendJob } from '../core/jobs.js';

export interface ExecutorRunOptions extends RunOptions {
  sessionId?: string;
  sessionName?: string;
  action?: string;
}

export function useExecutor(): {
  lines: string[];
  isRunning: boolean;
  exitCode: number | null;
  durationMs: number | null;
  outputFile: string | null;
  run: (options: ExecutorRunOptions) => Promise<void>;
  reset: () => void;
} {
  const [lines, setLines] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [outputFile, setOutputFile] = useState<string | null>(null);

  const execute = useCallback(async (options: ExecutorRunOptions) => {
    setIsRunning(true);
    setLines([]);
    setExitCode(null);
    setDurationMs(null);
    setOutputFile(null);

    const result = await run({
      ...options,
      onOutput: (line: string) => {
        options.onOutput(line);
        setLines((prev) => [...prev, line]);
      },
      onError: (line: string) => {
        options.onError(line);
        setLines((prev) => [...prev, line]);
      },
    });

    setExitCode(result.exitCode);
    setDurationMs(result.durationMs);
    setOutputFile(result.outputFile);
    setIsRunning(false);

    if (options.sessionId) {
      try {
        await appendJob({
          id: randomUUID(),
          sessionId: options.sessionId,
          sessionName: options.sessionName ?? 'unknown',
          timestamp: new Date().toISOString(),
          tool: options.command[0] ?? 'unknown',
          action: options.action ?? 'run',
          command: options.command,
          exitCode: result.exitCode,
          durationMs: result.durationMs,
          outputFile: result.outputFile,
        });
      } catch {
        // job recording is non-fatal — execution already completed
      }
    }
  }, []);

  const reset = useCallback(() => {
    setLines([]);
    setExitCode(null);
    setDurationMs(null);
    setOutputFile(null);
  }, []);

  return { lines, isRunning, exitCode, durationMs, outputFile, run: execute, reset };
}
