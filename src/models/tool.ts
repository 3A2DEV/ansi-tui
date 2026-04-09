export interface ToolInfo {
  name: string;                      // e.g. "ansible-galaxy"
  binary: string | null;             // resolved absolute path, null if not found
  version: string | null;
  available: boolean;
}

export interface AnsibleEnvironment {
  ansibleCore: string | null;        // e.g. "2.20.4"
  configFile: string | null;         // e.g. "/etc/ansible/ansible.cfg" or null
  pythonVersion: string | null;      // e.g. "3.14.3"
  jinjaVersion: string | null;       // e.g. "3.1.6"
  pyyamlVersion: string | null;      // e.g. "6.0.3"
  executablePath: string | null;     // e.g. "/opt/homebrew/bin/ansible"
  collectionPath: string | null;     // e.g. "~/.ansible/collections"
}

export const ANSIBLE_TOOLS = [
  'ansible',
  'ansible-playbook',
  'ansible-galaxy',
  'ansible-vault',
  'ansible-doc',
  'ansible-inventory',
  'ansible-config',
  'ansible-lint',
  'ansible-test',
  'ansible-builder',
  'ansible-creator',
  'ansible-console',
  'ansible-pull',
  'ansible-community',
] as const;

export type AnsibleToolName = typeof ANSIBLE_TOOLS[number];
