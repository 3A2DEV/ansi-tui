import { execa } from 'execa';
import which from 'which';
import type { ToolInfo, AnsibleToolName, AnsibleEnvironment } from '../models/tool.js';
import { ANSIBLE_TOOLS } from '../models/tool.js';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';

function parseVersion(stdout: string): string | null {
  const firstLine = stdout.split('\n')[0];
  const match = firstLine.match(/(\d+\.\d+\.\d+(?:[\w.\-+]*))/);
  return match ? match[1] : null;
}

async function detectTool(name: string): Promise<[string, ToolInfo]> {
  try {
    const binary = await which(name);
    const result = await execa(binary, ['--version'], { reject: false });
    const version = parseVersion(result.stdout || result.stderr || '');
    return [name, { name, binary, version, available: true }];
  } catch {
    return [name, { name, binary: null, version: null, available: false }];
  }
}

export async function detectTools(): Promise<Map<AnsibleToolName, ToolInfo>> {
  const entries = await Promise.all(
    ANSIBLE_TOOLS.map((name) => detectTool(name))
  );
  return new Map(entries as [AnsibleToolName, ToolInfo][]);
}

function parseValue(line: string): string | null {
  const match = line.match(/=\s*(.+)$/);
  return match ? match[1].trim() : null;
}

export async function detectAnsibleEnvironment(): Promise<AnsibleEnvironment> {
  const empty: AnsibleEnvironment = {
    ansibleCore: null,
    configFile: null,
    pythonVersion: null,
    jinjaVersion: null,
    pyyamlVersion: null,
    executablePath: null,
    collectionPath: null,
  };

  try {
    const binary = await which('ansible');
    const result = await execa(binary, ['--version'], { reject: false });
    const output = result.stdout || result.stderr || '';
    const lines = output.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('ansible [')) {
        const match = trimmed.match(/\[core\s+([\d.]+)\]/);
        if (match) empty.ansibleCore = match[1];
      } else if (trimmed.startsWith('config file')) {
        const val = parseValue(trimmed);
        if (val && val !== 'None') empty.configFile = val;
      } else if (trimmed.startsWith('python version')) {
        const val = parseValue(trimmed);
        if (val) {
          const pyMatch = val.match(/([\d.]+)/);
          empty.pythonVersion = pyMatch ? pyMatch[1] : val;
        }
      } else if (trimmed.startsWith('jinja version')) {
        const val = parseValue(trimmed);
        if (val) empty.jinjaVersion = val;
      } else if (trimmed.startsWith('pyyaml version')) {
        const val = parseValue(trimmed);
        if (val) {
          const ymlMatch = val.match(/([\d.]+)/);
          empty.pyyamlVersion = ymlMatch ? ymlMatch[1] : val;
        }
      } else if (trimmed.startsWith('executable location')) {
        const val = parseValue(trimmed);
        if (val) empty.executablePath = val;
      } else if (trimmed.startsWith('ansible collection location')) {
        const val = parseValue(trimmed);
        if (val) empty.collectionPath = val.split(':')[0];
      }
    }
  } catch {
    // ansible not installed
  }

  return empty;
}

export async function detectAnsibleCfg(cwd: string): Promise<string | null> {
  const candidates = [
    resolve(cwd, 'ansible.cfg'),
    join(homedir(), '.ansible.cfg'),
    '/etc/ansible/ansible.cfg',
  ];

  for (const path of candidates) {
    try {
      await readFile(path, 'utf-8');
      return path;
    } catch {
      // file doesn't exist or not readable, try next
    }
  }

  return null;
}

export async function detectVirtualenv(): Promise<string | null> {
  const venv = process.env['VIRTUAL_ENV'];
  if (venv) {
    return venv;
  }

  return null;
}
