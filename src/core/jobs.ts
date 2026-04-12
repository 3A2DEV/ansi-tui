import { mkdir, appendFile, readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import envPaths from 'env-paths';
import type { ExecutedCommand } from '../models/command.js';

const paths = envPaths('ansi-tui');
const historyDir = join(paths.data, 'history');
const logsDir = join(paths.data, 'logs');

async function ensureHistoryDir(): Promise<void> {
  await mkdir(historyDir, { recursive: true });
}

function historyFile(sessionId: string): string {
  return join(historyDir, `${basename(sessionId)}.jsonl`);
}

export async function appendJob(job: ExecutedCommand): Promise<void> {
  await ensureHistoryDir();
  await appendFile(historyFile(job.sessionId), JSON.stringify(job) + '\n', 'utf-8');
}

export async function readJobs(opts?: {
  sessionId?: string;
  limit?: number;
}): Promise<ExecutedCommand[]> {
  const limit = opts?.limit ?? 200;

  if (opts?.sessionId) {
    try {
      const content = await readFile(historyFile(opts.sessionId), 'utf-8');
      const entries = content
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as ExecutedCommand);
      return entries.slice(-limit).reverse();
    } catch {
      return [];
    }
  }

  // Read all session files and merge
  try {
    await ensureHistoryDir();
    const files = await readdir(historyDir);
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

    const allEntries: ExecutedCommand[] = [];
    for (const file of jsonlFiles) {
      try {
        const content = await readFile(join(historyDir, file), 'utf-8');
        const entries = content
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as ExecutedCommand);
        allEntries.push(...entries);
      } catch {
        // skip unreadable files
      }
    }

    // Sort newest-first by timestamp
    allEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return allEntries.slice(0, limit);
  } catch {
    return [];
  }
}

export async function deleteJob(jobId: string, sessionId: string): Promise<void> {
  const file = historyFile(sessionId);
  try {
    const content = await readFile(file, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    let outputFile: string | null = null;
    const remaining = lines.filter((line) => {
      try {
        const entry = JSON.parse(line) as ExecutedCommand;
        if (entry.id === jobId) {
          outputFile = entry.outputFile;
          return false;
        }
        return true;
      } catch {
        return true;
      }
    });

    await writeFile(file, remaining.join('\n') + (remaining.length > 0 ? '\n' : ''), 'utf-8');

    // Remove the associated log file if it exists
    const logFile = outputFile as string | null;
    if (logFile && logFile.startsWith(`${logsDir}/`)) {
      try {
        await unlink(logFile);
      } catch {
        // log file already gone — not an error
      }
    }
  } catch {
    // history file doesn't exist — nothing to delete
  }
}

export async function clearJobs(sessionId?: string): Promise<void> {
  if (sessionId) {
    try {
      await unlink(historyFile(sessionId));
    } catch {
      // file doesn't exist
    }
    return;
  }

  try {
    const files = await readdir(historyDir);
    await Promise.all(
      files
        .filter((f) => f.endsWith('.jsonl'))
        .map((f) => unlink(join(historyDir, f)).catch(() => {}))
    );
  } catch {
    // directory doesn't exist
  }
}

export async function pruneOldLogs(maxCount = 200): Promise<void> {
  try {
    const files = await readdir(logsDir);
    const logFiles = files.filter((f) => f.endsWith('.log')).sort();

    if (logFiles.length <= maxCount) return;

    const toDelete = logFiles.slice(0, logFiles.length - maxCount);
    await Promise.all(
      toDelete.map((f) => unlink(join(logsDir, f)).catch(() => {}))
    );
  } catch {
    // logs directory doesn't exist yet — nothing to prune
  }
}
