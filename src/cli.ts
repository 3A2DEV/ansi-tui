import { readFileSync } from 'node:fs';

export const HELP_FLAGS = new Set(['--help', '-h']);
export const VERSION_FLAGS = new Set(['--version', '-v']);

export type CliMode = 'help' | 'version' | 'non-tty' | 'run';

export const getPackageVersion = (): string => {
  try {
    const packageJsonPath = new URL('../package.json', import.meta.url);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string };
    return packageJson.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
};

export const getHelpText = (): string => {
  return `ansi-tui\n\nUsage:\n  ansi-tui\n  ansi-tui --help\n  ansi-tui --version\n\nOptions:\n  -h, --help     Show this help text\n  -v, --version  Show package version\n\nNotes:\n  ansi-tui requires an interactive TTY to launch the terminal UI.\n`;
};

export const getNonTtyMessage = (): string => {
  return 'ansi-tui requires an interactive TTY. Use --help for usage information.\n';
};

export const resolveCliMode = (args: string[], stdinIsTTY: boolean, stdoutIsTTY: boolean): CliMode => {
  if (args.some((arg) => HELP_FLAGS.has(arg))) {
    return 'help';
  }

  if (args.some((arg) => VERSION_FLAGS.has(arg))) {
    return 'version';
  }

  if (!stdinIsTTY || !stdoutIsTTY) {
    return 'non-tty';
  }

  return 'run';
};
