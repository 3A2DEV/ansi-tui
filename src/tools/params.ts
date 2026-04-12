import type { ParamSchema } from './base.js';

export const BECOME_METHOD_OPTIONS = ['sudo', 'su', 'doas', 'pfexec', 'ksu', 'runas', 'machinectl'] as const;

export const BECOME_PARAMS: ParamSchema[] = [
  {
    key: 'becomeMethod',
    label: 'Become method',
    type: 'select',
    options: [...BECOME_METHOD_OPTIONS],
    defaultValue: 'sudo',
    description: 'Privilege escalation method to use',
  },
  {
    key: 'remoteUser',
    label: 'Remote user',
    type: 'text',
    placeholder: 'ansible',
    description: 'Remote user account for the connection',
  },
  {
    key: 'timeout',
    label: 'Timeout',
    type: 'text',
    placeholder: '10',
    description: 'Connection timeout in seconds',
  },
  {
    key: 'askPass',
    label: 'Ask SSH password',
    type: 'checkbox',
    defaultValue: false,
    description: 'Prompt for the SSH password',
  },
  {
    key: 'askBecomePass',
    label: 'Ask become password',
    type: 'checkbox',
    defaultValue: false,
    description: 'Prompt for the privilege escalation password',
  },
  {
    key: 'becomePasswordFile',
    label: 'Become password file',
    type: 'file',
    placeholder: '.become-pass',
    description: 'Path to a privilege escalation password file',
  },
];

export const VAULT_ASK_PARAMS: ParamSchema[] = [
  {
    key: 'askVaultPass',
    label: 'Ask vault password',
    type: 'checkbox',
    defaultValue: false,
    description: 'Prompt for the vault password',
  },
];

export const SSH_PARAMS: ParamSchema[] = [
  {
    key: 'sshCommonArgs',
    label: 'SSH common args',
    type: 'text',
    placeholder: '-o ProxyCommand=...',
    description: 'Extra arguments passed to all SSH tools',
  },
  {
    key: 'sshExtraArgs',
    label: 'SSH extra args',
    type: 'text',
    placeholder: '-o StrictHostKeyChecking=no',
    description: 'Extra arguments passed to ssh only',
  },
  {
    key: 'sftpExtraArgs',
    label: 'SFTP extra args',
    type: 'text',
    placeholder: '-f',
    description: 'Extra arguments passed to sftp only',
  },
  {
    key: 'scpExtraArgs',
    label: 'SCP extra args',
    type: 'text',
    placeholder: '-l 5000',
    description: 'Extra arguments passed to scp only',
  },
];
