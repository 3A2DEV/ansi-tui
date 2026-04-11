import { BaseTool } from './base.js';
import type { ToolParams, ValidationError, ParamSchema } from './base.js';
import { BECOME_PARAMS, SSH_PARAMS, VAULT_ASK_PARAMS } from './params.js';

const PULL_ACTIONS = ['pull'] as const;

export class PullTool extends BaseTool {
  readonly name = 'ansible-pull';

  getActions(): string[] {
    return [...PULL_ACTIONS];
  }

  getParamSchema(_action: string): ParamSchema[] {
    return [
      {
        key: 'url',
        label: 'Repository URL',
        type: 'text',
        required: true,
        placeholder: 'https://github.com/org/ansible-playbooks.git',
        description: 'Git repository URL to pull from',
      },
      {
        key: 'checkout',
        label: 'Checkout ref',
        type: 'text',
        placeholder: 'main or v1.0',
        description: 'Branch, tag, or commit to checkout',
      },
      {
        key: 'directory',
        label: 'Working directory',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: '~/.ansible/pull',
        description: 'Directory to clone into',
      },
      {
        key: 'playbook',
        label: 'Playbook',
        type: 'text',
        isPath: true,
        pathType: 'file',
        placeholder: 'local.yml',
        description: 'Playbook to run after pull',
      },
      {
        key: 'modulePath',
        label: 'Module path',
        type: 'text',
        isPath: true,
        pathType: 'directory',
        placeholder: './library',
      },
      {
        key: 'extraVars',
        label: 'Extra variables',
        type: 'text',
        placeholder: 'env=dev',
        description: 'Extra variables for the pulled playbook',
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'text',
        placeholder: 'deploy,config',
        description: 'Only run tagged tasks',
      },
      {
        key: 'skipTags',
        label: 'Skip tags',
        type: 'text',
        placeholder: 'slow',
        description: 'Skip tasks tagged with these values',
      },
      {
        key: 'purge',
        label: 'Purge',
        type: 'checkbox',
        defaultValue: false,
        description: 'Delete the repository after playbook run',
      },
      {
        key: 'verifyCommit',
        label: 'Verify commit',
        type: 'checkbox',
          defaultValue: false,
          description: 'Verify GPG signature of checked out commit',
      },
      {
        key: 'limit',
        label: 'Limit hosts',
        type: 'text',
        placeholder: 'webservers',
        description: 'Limit execution to matching hosts',
      },
      {
        key: 'full',
        label: 'Full clone',
        type: 'checkbox',
        defaultValue: false,
        description: 'Use a full clone instead of a shallow clone',
      },
      {
        key: 'clean',
        label: 'Clean repository',
        type: 'checkbox',
        defaultValue: false,
        description: 'Discard modified files in the working repository',
      },
      {
        key: 'trackSubs',
        label: 'Track submodules',
        type: 'checkbox',
        defaultValue: false,
        description: 'Track the latest changes in submodules',
      },
      {
        key: 'acceptHostKey',
        label: 'Accept host key',
        type: 'checkbox',
        defaultValue: false,
        description: 'Add the repo host key if not already present',
      },
      {
        key: 'moduleName',
        label: 'Repository module',
        type: 'select',
        options: ['git', 'subversion', 'hg', 'bzr'],
        defaultValue: 'git',
        description: 'Repository module used to check out the repo',
      },
      {
        key: 'force',
        label: 'Force',
        type: 'checkbox',
        defaultValue: false,
        description: 'Run even if the repository could not be updated',
      },
      {
        key: 'onlyIfChanged',
        label: 'Only if changed',
        type: 'checkbox',
        defaultValue: false,
        description: 'Only run the playbook when the repo changed',
      },
      {
        key: 'sleep',
        label: 'Sleep',
        type: 'text',
        placeholder: '30',
        description: 'Randomized startup delay in seconds',
      },
      {
        key: 'inventory',
        label: 'Inventory',
        type: 'text',
        isPath: true,
        pathType: 'any',
        placeholder: 'localhost,',
        description: 'Inventory to use',
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
      {
        key: 'vaultId',
        label: 'Vault ID',
        type: 'text',
        placeholder: 'dev@prompt',
        description: 'Vault identity to use',
      },
      {
        key: 'vaultPasswordFile',
        label: 'Vault password file',
        type: 'file',
        placeholder: '.vault-pass',
        description: 'Path to vault password file',
      },
      ...VAULT_ASK_PARAMS,
      ...BECOME_PARAMS.filter((param) => param.key !== 'becomeMethod'),
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
        key: 'verbosity',
        label: 'Verbosity',
        type: 'select',
        options: ['default', '-v', '-vv', '-vvv', '-vvvv'],
        defaultValue: 'default',
      },
    ];
  }

  validate(params: ToolParams): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!params['url']) {
      errors.push({ field: 'url', message: 'Repository URL is required' });
    }
    return errors;
  }

  buildCommand(params: ToolParams): string[] {
    const cmd = ['ansible-pull'];

    if (params['inventory']) {
      cmd.push('-i', params['inventory'] as string);
    }
    if (params['checkout']) {
      cmd.push('-C', params['checkout'] as string);
    }
    if (params['directory']) {
      cmd.push('-d', params['directory'] as string);
    }
    if (params['modulePath']) {
      cmd.push('-M', params['modulePath'] as string);
    }
    if (params['extraVars']) {
      cmd.push('-e', params['extraVars'] as string);
    }
    if (params['tags']) {
      cmd.push('-t', params['tags'] as string);
    }
    if (params['skipTags']) {
      cmd.push('--skip-tags', params['skipTags'] as string);
    }
    if (params['purge']) {
      cmd.push('--purge');
    }
    if (params['verifyCommit']) {
      cmd.push('--verify-commit');
    }
    if (params['limit']) {
      cmd.push('-l', params['limit'] as string);
    }
    if (params['full']) {
      cmd.push('--full');
    }
    if (params['clean']) {
      cmd.push('--clean');
    }
    if (params['trackSubs']) {
      cmd.push('--track-subs');
    }
    if (params['acceptHostKey']) {
      cmd.push('--accept-host-key');
    }
    if (params['moduleName']) {
      cmd.push('-m', params['moduleName'] as string);
    }
    if (params['force']) {
      cmd.push('-f');
    }
    if (params['onlyIfChanged']) {
      cmd.push('-o');
    }
    if (params['sleep']) {
      cmd.push('-s', params['sleep'] as string);
    }
    if (params['flushCache']) {
      cmd.push('--flush-cache');
    }
    if (params['listHosts']) {
      cmd.push('--list-hosts');
    }
    if (params['vaultId']) {
      cmd.push('--vault-id', params['vaultId'] as string);
    }
    if (params['vaultPasswordFile']) {
      cmd.push('--vault-password-file', params['vaultPasswordFile'] as string);
    }
    if (params['askVaultPass']) {
      cmd.push('-J');
    }
    if (params['askBecomePass']) {
      cmd.push('-K');
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
    if (params['askPass']) {
      cmd.push('-k');
    }
    if (params['becomePasswordFile']) {
      cmd.push('--become-password-file', params['becomePasswordFile'] as string);
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
    if (params['verbosity'] && params['verbosity'] !== 'default') {
      cmd.push(params['verbosity'] as string);
    }
    if (params['url']) {
      cmd.push('-U', params['url'] as string);
    }
    if (params['playbook']) {
      cmd.push(params['playbook'] as string);
    }

    return cmd;
  }
}
