import { useState, useCallback, useEffect, useRef } from 'react';
import { randomUUID } from 'node:crypto';
import type { RunOptions } from '../core/executor.js';
import { run } from '../core/executor.js';
import { appendJob } from '../core/jobs.js';

const OUTPUT_FLUSH_INTERVAL_MS = 48;
const OUTPUT_FLUSH_BATCH_SIZE = 50;

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
  const pendingLinesRef = useRef<string[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const flushPendingLines = useCallback(() => {
    clearFlushTimer();

    if (pendingLinesRef.current.length === 0) {
      return;
    }

    const batch = pendingLinesRef.current;
    pendingLinesRef.current = [];
    setLines((prev) => (prev.length === 0 ? batch : [...prev, ...batch]));
  }, [clearFlushTimer]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current !== null) {
      return;
    }

    flushTimerRef.current = setTimeout(() => {
      flushPendingLines();
    }, OUTPUT_FLUSH_INTERVAL_MS);
  }, [flushPendingLines]);

  const queueLine = useCallback((line: string) => {
    pendingLinesRef.current.push(line);

    if (pendingLinesRef.current.length >= OUTPUT_FLUSH_BATCH_SIZE) {
      flushPendingLines();
      return;
    }

    scheduleFlush();
  }, [flushPendingLines, scheduleFlush]);

  useEffect(() => () => {
    clearFlushTimer();
    pendingLinesRef.current = [];
  }, [clearFlushTimer]);

  const execute = useCallback(async (options: ExecutorRunOptions) => {
    clearFlushTimer();
    pendingLinesRef.current = [];
    setIsRunning(true);
    setLines([]);
    setExitCode(null);
    setDurationMs(null);
    setOutputFile(null);

    const result = await run({
      ...options,
      onOutput: (line: string) => {
        options.onOutput(line);
        queueLine(line);
      },
      onError: (line: string) => {
        options.onError(line);
        queueLine(line);
      },
    });

    flushPendingLines();
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
  }, [clearFlushTimer, flushPendingLines, queueLine]);

  const reset = useCallback(() => {
    clearFlushTimer();
    pendingLinesRef.current = [];
    setLines([]);
    setExitCode(null);
    setDurationMs(null);
    setOutputFile(null);
  }, [clearFlushTimer]);

  return { lines, isRunning, exitCode, durationMs, outputFile, run: execute, reset };
}
