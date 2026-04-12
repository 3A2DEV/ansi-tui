import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';
import { BECOME_PARAMS, SSH_PARAMS, VAULT_ASK_PARAMS } from './params.js';

const CONSOLE_ACTIONS = ['start'] as const;

export class ConsoleTool extends BaseTool {
  readonly name = 'ansible-console';

  getActions(): string[] {
    return [...CONSOLE_ACTIONS];
  }

  getParamSchema(_action: string): ParamSchema[] {
    return [
      {
        key: 'pattern',
        label: 'Host pattern',
        type: 'text',
        placeholder: 'all',
        description: 'Host pattern to target',
      },
      {
        key: 'inventory',
        label: 'Inventory',
        type: 'text',
        isPath: true,
        pathType: 'any',
        placeholder: 'hosts.ini or inventory/',
        description: 'Inventory file, directory, or comma-separated hosts',
      },
      {
        key: 'limit',
        label: 'Limit hosts',
        type: 'text',
        placeholder: 'webservers',
        description: 'Limit execution to specific hosts',
      },
      {
        key: 'become',
        label: 'Become (sudo)',
        type: 'checkbox',
        defaultValue: false,
        description: 'Enable privilege escalation',
      },
      {
        key: 'becomeUser',
        label: 'Become user',
        type: 'text',
        placeholder: 'root',
      },
      ...BECOME_PARAMS,
      {
        key: 'modulePath',
        label: 'Module path',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: './library',
        description: 'Path to additional modules',
      },
      {
        key: 'vaultPasswordFile',
        label: 'Vault password file',
        type: 'file',
        pathType: 'file',
        placeholder: '.vault-pass',
      },
      {
        key: 'vaultId',
        label: 'Vault ID',
        type: 'text',
        placeholder: 'dev@prompt',
        description: 'Vault identity to use',
      },
      ...VAULT_ASK_PARAMS,
      {
        key: 'forks',
        label: 'Forks',
        type: 'text',
        placeholder: '5',
        description: 'Number of parallel processes',
      },
      {
        key: 'extraVars',
        label: 'Extra variables',
        type: 'text',
        placeholder: 'env=dev',
        description: 'Additional variables for console tasks',
      },
      {
        key: 'verbosity',
        label: 'Verbosity',
        type: 'select',
        options: ['default', '-v', '-vv', '-vvv', '-vvvv'],
        defaultValue: 'default',
      },
      {
        key: 'connection',
        label: 'Connection type',
        type: 'select',
        options: ['ssh', 'smart', 'paramiko', 'local', 'docker'],
        defaultValue: 'ssh',
        description: 'Connection type to use',
      },
      {
        key: 'privateKey',
        label: 'Private key',
        type: 'file',
        placeholder: '~/.ssh/id_rsa',
        description: 'Private key for remote connections',
      },
      ...SSH_PARAMS,
      {
        key: 'playbookDir',
        label: 'Playbook dir',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: '.',
        description: 'Base directory for playbook-relative paths',
      },
      {
        key: 'taskTimeout',
        label: 'Task timeout',
        type: 'text',
        placeholder: '30',
        description: 'Task timeout in seconds',
      },
      {
        key: 'step',
        label: 'Step',
        type: 'checkbox',
        defaultValue: false,
        description: 'Confirm each task before running',
      },
      {
        key: 'check',
        label: 'Check mode',
        type: 'checkbox',
        defaultValue: false,
        description: 'Run in check mode',
      },
      {
        key: 'diff',
        label: 'Diff mode',
        type: 'checkbox',
        defaultValue: false,
        description: 'Show diffs for changed files',
      },
      {
        key: 'flushCache',
        label: 'Flush cache',
        type: 'checkbox',
        defaultValue: false,
        description: 'Clear fact cache before running',
      },
      {
        key: 'listHosts',
        label: 'List hosts',
        type: 'checkbox',
        defaultValue: false,
        description: 'List matching hosts without executing',
      },
    ];
  }

  validate(_params: ToolParams): ValidationError[] {
    return [];
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-console'];

    if (params['pattern']) {
      cmd.push(params['pattern'] as string);
    }

    if (params['inventory']) {
      cmd.push('-i', params['inventory'] as string);
    }
    if (params['limit']) {
      cmd.push('--limit', params['limit'] as string);
    }
    if (params['become']) {
      cmd.push('--become');
    }
    if (params['becomeUser']) {
      cmd.push('--become-user', params['becomeUser'] as string);
    }
    if (params['becomeMethod']) {
      cmd.push('--become-method', params['becomeMethod'] as string);
    }
    if (params['askPass']) {
      cmd.push('-k');
    }
    if (params['askBecomePass']) {
      cmd.push('-K');
    }
    if (params['becomePasswordFile']) {
      cmd.push('--become-password-file', params['becomePasswordFile'] as string);
    }
    if (params['modulePath']) {
      cmd.push('-M', params['modulePath'] as string);
    }
    if (params['vaultPasswordFile']) {
      cmd.push('--vault-password-file', params['vaultPasswordFile'] as string);
    }
    if (params['vaultId']) {
      cmd.push('--vault-id', params['vaultId'] as string);
    }
    if (params['askVaultPass']) {
      cmd.push('-J');
    }
    if (params['forks']) {
      cmd.push('-f', params['forks'] as string);
    }
    if (params['extraVars']) {
      cmd.push('-e', params['extraVars'] as string);
    }
    if (params['verbosity'] && params['verbosity'] !== 'default') {
      cmd.push(params['verbosity'] as string);
    }
    if (params['remoteUser']) {
      cmd.push('-u', params['remoteUser'] as string);
    }
    if (params['connection']) {
      cmd.push('-c', params['connection'] as string);
    }
    if (params['timeout']) {
      cmd.push('-T', params['timeout'] as string);
    }
    if (params['privateKey']) {
      cmd.push('--private-key', params['privateKey'] as string);
    }
    if (params['sshCommonArgs']) {
      cmd.push('--ssh-common-args', params['sshCommonArgs'] as string);
    }
    if (params['sshExtraArgs']) {
      cmd.push('--ssh-extra-args', params['sshExtraArgs'] as string);
    }
    if (params['sftpExtraArgs']) {
      cmd.push('--sftp-extra-args', params['sftpExtraArgs'] as string);
    }
    if (params['scpExtraArgs']) {
      cmd.push('--scp-extra-args', params['scpExtraArgs'] as string);
    }
    if (params['playbookDir']) {
      cmd.push('--playbook-dir', params['playbookDir'] as string);
    }
    if (params['taskTimeout']) {
      cmd.push('--task-timeout', params['taskTimeout'] as string);
    }
    if (params['step']) {
      cmd.push('--step');
    }
    if (params['check']) {
      cmd.push('-C');
    }
    if (params['diff']) {
      cmd.push('-D');
    }
    if (params['flushCache']) {
      cmd.push('--flush-cache');
    }
    if (params['listHosts']) {
      cmd.push('--list-hosts');
    }

    return cmd;
  }
}
