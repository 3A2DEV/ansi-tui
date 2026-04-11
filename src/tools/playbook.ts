import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';
import { BECOME_PARAMS, SSH_PARAMS, VAULT_ASK_PARAMS } from './params.js';

const PLAYBOOK_ACTIONS = ['run', 'check', 'diff', 'syntax-check', 'list-hosts', 'list-tasks', 'list-tags'] as const;

export class PlaybookTool extends BaseTool {
  readonly name = 'ansible-playbook';

  getActions(): string[] {
    return [...PLAYBOOK_ACTIONS];
  }

  getParamSchema(action: string): ParamSchema[] {
    const common: ParamSchema[] = [
      {
        key: 'playbook',
        label: 'Playbook file',
        type: 'file',
        required: true,
        description: 'Path to the playbook YAML file',
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
        placeholder: 'webservers,dbservers',
        description: 'Limit execution to specific hosts or groups',
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'text',
        placeholder: 'deploy,config',
        description: 'Only run tasks tagged with these tags',
      },
      {
        key: 'skipTags',
        label: 'Skip tags',
        type: 'text',
        placeholder: 'slow,debug',
        description: 'Skip tasks tagged with these tags',
      },
      {
        key: 'extraVars',
        label: 'Extra variables',
        type: 'text',
        placeholder: 'key1=val1 key2=val2',
        description: 'Extra variables for the playbook',
      },
      {
        key: 'verbosity',
        label: 'Verbosity',
        type: 'select',
        options: ['default', '-v', '-vv', '-vvv', '-vvvv'],
        defaultValue: 'default',
        description: 'Output verbosity level',
      },
      {
        key: 'forks',
        label: 'Forks',
        type: 'text',
        placeholder: '5',
        description: 'Number of parallel processes',
      },
      {
        key: 'connection',
        label: 'Connection type',
        type: 'select',
        options: ['smart', 'ssh', 'paramiko', 'local', 'docker'],
        defaultValue: 'smart',
        description: 'Connection type to use',
      },
      {
        key: 'privateKey',
        label: 'Private key',
        type: 'file',
        pathType: 'file',
        placeholder: '~/.ssh/id_rsa',
        description: 'SSH private key file',
      },
      {
        key: 'modulePath',
        label: 'Module path',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: './library',
        description: 'Additional module search path',
      },
      {
        key: 'become',
        label: 'Become (sudo)',
        type: 'checkbox',
        defaultValue: false,
        description: 'Run operations with become (privilege escalation)',
      },
      {
        key: 'becomeUser',
        label: 'Become user',
        type: 'text',
        placeholder: 'root',
        description: 'Run operations as this user',
      },
      ...BECOME_PARAMS,
      {
        key: 'vaultPasswordFile',
        label: 'Vault password file',
        type: 'file',
        placeholder: '.vault-pass',
        description: 'Path to vault password file',
      },
      {
        key: 'vaultId',
        label: 'Vault ID',
        type: 'text',
        placeholder: 'dev@prompt',
        description: 'Vault identity to use',
      },
      ...VAULT_ASK_PARAMS,
      ...SSH_PARAMS,
      {
        key: 'forceHandlers',
        label: 'Force handlers',
        type: 'checkbox',
        defaultValue: false,
        description: 'Run handlers even if a task fails',
      },
      {
        key: 'flushCache',
        label: 'Flush cache',
        type: 'checkbox',
        defaultValue: false,
        description: 'Clear fact cache before running',
      },
      {
        key: 'startAtTask',
        label: 'Start at task',
        type: 'text',
        placeholder: 'Deploy app',
        description: 'Start execution at the named task',
      },
      {
        key: 'step',
        label: 'Step',
        type: 'checkbox',
        defaultValue: false,
        description: 'Confirm each task before running',
      },
    ];

    if (action === 'check' || action === 'diff') {
      return [
        ...common,
        {
          key: action === 'check' ? 'checkMode' : 'diffMode',
          label: action === 'check' ? 'Check mode' : 'Show diff',
          type: 'checkbox',
          defaultValue: true,
          description: `Enable ${action} mode`,
        },
      ];
    }

    return common;
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!params['playbook']) {
      errors.push({ field: 'playbook', message: 'Playbook file is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-playbook'];
    const playbook = params['playbook'] as string;
    if (!playbook) return cmd;

    cmd.push(playbook);

    if (params['inventory']) {
      cmd.push('-i', params['inventory'] as string);
    }
    if (params['limit']) {
      cmd.push('--limit', params['limit'] as string);
    }
    if (params['tags']) {
      cmd.push('--tags', params['tags'] as string);
    }
    if (params['skipTags']) {
      cmd.push('--skip-tags', params['skipTags'] as string);
    }
    if (params['extraVars']) {
      cmd.push('--extra-vars', params['extraVars'] as string);
    }
    if (params['verbosity'] && params['verbosity'] !== 'default') {
      cmd.push(params['verbosity'] as string);
    }
    if (params['forks']) {
      cmd.push('--forks', params['forks'] as string);
    }
    if (params['connection']) {
      cmd.push('-c', params['connection'] as string);
    }
    if (params['privateKey']) {
      cmd.push('--private-key', params['privateKey'] as string);
    }
    if (params['modulePath']) {
      cmd.push('-M', params['modulePath'] as string);
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
    if (params['remoteUser']) {
      cmd.push('-u', params['remoteUser'] as string);
    }
    if (params['timeout']) {
      cmd.push('-T', params['timeout'] as string);
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
    if (params['vaultPasswordFile']) {
      cmd.push('--vault-password-file', params['vaultPasswordFile'] as string);
    }
    if (params['vaultId']) {
      cmd.push('--vault-id', params['vaultId'] as string);
    }
    if (params['askVaultPass']) {
      cmd.push('-J');
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
    if (params['forceHandlers']) {
      cmd.push('--force-handlers');
    }
    if (params['flushCache']) {
      cmd.push('--flush-cache');
    }
    if (params['startAtTask']) {
      cmd.push('--start-at-task', params['startAtTask'] as string);
    }
    if (params['step']) {
      cmd.push('--step');
    }

    if (params.action === 'check') {
      cmd.push('--check');
    }
    if (params.action === 'diff') {
      cmd.push('--diff');
    }
    if (params.action === 'syntax-check') {
      cmd.push('--syntax-check');
    }
    if (params.action === 'list-hosts') {
      cmd.push('--list-hosts');
    }
    if (params.action === 'list-tasks') {
      cmd.push('--list-tasks');
    }
    if (params.action === 'list-tags') {
      cmd.push('--list-tags');
    }

    return cmd;
  }
}
