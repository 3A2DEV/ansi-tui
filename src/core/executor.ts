import { execa } from 'execa';
import { mkdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import envPaths from 'env-paths';
import { getProxyEnv } from './proxy.js';

const paths = envPaths('ansi-tui');

export interface RunOptions {
  command: string[];
  env: Record<string, string>;
  cwd: string;
  onOutput: (line: string) => void;
  onError: (line: string) => void;
}

export interface RunResult {
  exitCode: number;
  durationMs: number;
  outputFile: string;
}

function getColorEnvDefaults(): Record<string, string> {
  const term = process.env['TERM'];

  return {
    ANSIBLE_FORCE_COLOR: '1',
    ANSIBLE_NOCOLOR: '0',
    CLICOLOR_FORCE: '1',
    FORCE_COLOR: '3',
    PY_COLORS: '1',
    TERM: !term || term === 'dumb' ? 'xterm-256color' : term,
  };
}

const ESC = '\u001B';
const BEL = '\u0007';
const ST = `${ESC}\\\\`;
const OSC8_OPEN_PATTERN = new RegExp(`${ESC}]8;;.*?(?:${BEL}|${ST})`, 'g');
const OSC8_CLOSE_PATTERN = new RegExp(`${ESC}]8;;(?:${BEL}|${ST})`, 'g');

function stripOsc8Sequences(text: string): string {
  return text
    .replace(OSC8_OPEN_PATTERN, '')
    .replace(OSC8_CLOSE_PATTERN, '');
}

export async function run(options: RunOptions): Promise<RunResult> {
  const { command, env: sessionEnv, cwd, onOutput } = options;
  const [binary, ...args] = command;

  const logsDir = join(paths.data, 'logs');
  await mkdir(logsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const toolName = binary.replace(/[^a-zA-Z0-9-]/g, '_');
  const outputFile = join(logsDir, `${timestamp}-${toolName}.log`);

  const proxyEnv = getProxyEnv(sessionEnv);
  const colorEnv = getColorEnvDefaults();
  const mergedEnv: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        ([, v]) => v !== undefined
      ) as [string, string][]
    ),
    ...proxyEnv,
    ...colorEnv,
    ...sessionEnv,
  };

  delete mergedEnv['NO_COLOR'];

  const startTime = Date.now();
  const outputLines: string[] = [];

  const subprocess = execa(binary, args, {
    cwd,
    env: mergedEnv,
    all: true,
    reject: false,
  });

  let leftover = '';

  const processChunk = (chunk: string, callback: (line: string) => void) => {
    const data = (leftover + chunk).replace(/\r\n/g, '\n');
    const parts = data.split('\n');
    leftover = parts.pop() ?? '';
    for (const line of parts) {
      callback(stripOsc8Sequences(line.replace(/\r/g, '')));
    }
  };

  if (subprocess.all) {
    for await (const chunk of subprocess.all) {
      processChunk(chunk.toString(), (line) => {
        outputLines.push(line);
        onOutput(line);
      });
    }
    // Flush any remaining data
    if (leftover.length > 0) {
      const finalLine = stripOsc8Sequences(leftover.replace(/\r/g, ''));
      outputLines.push(finalLine);
      onOutput(finalLine);
    }
  }

  const result = await subprocess;
  const durationMs = Date.now() - startTime;

  const logContent = [
    `# Command: ${command.join(' ')}`,
    `# CWD: ${cwd}`,
    `# Timestamp: ${new Date().toISOString()}`,
    `# Exit Code: ${result.exitCode ?? 'unknown'}`,
    '',
    ...outputLines,
  ].join('\n');

  await appendFile(outputFile, logContent);

  return {
    exitCode: result.exitCode ?? 0,
    durationMs,
    outputFile,
  };
}
