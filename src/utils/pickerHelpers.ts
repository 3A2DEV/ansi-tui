import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';

const expandHome = (value: string): string => {
  if (value === '~') return homedir();
  if (value.startsWith('~/')) return resolve(homedir(), value.slice(2));
  return value;
};

export function derivePickerStartPath(currentValue: string): string {
  const expanded = expandHome(currentValue.trim());
  if (expanded && existsSync(expanded)) {
    return expanded;
  }
  if (expanded) {
    const parent = dirname(expanded);
    if (existsSync(parent)) {
      return parent;
    }
  }
  return process.cwd();
}
