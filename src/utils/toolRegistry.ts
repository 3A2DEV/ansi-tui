import type { AnsibleToolName } from '../models/tool.js';
import { BuilderTool } from '../tools/builder.js';
import { ConfigTool } from '../tools/config.js';
import { ConsoleTool } from '../tools/console.js';
import { CreatorTool } from '../tools/creator.js';
import { DocTool } from '../tools/doc.js';
import { GalaxyTool } from '../tools/galaxy.js';
import { InventoryTool } from '../tools/inventory.js';
import { LintTool } from '../tools/lint.js';
import { PlaybookTool } from '../tools/playbook.js';
import { TestTool } from '../tools/test.js';
import { VaultTool } from '../tools/vault.js';

export interface WrappedToolDefinition {
  readonly id: string;
  readonly name: string;
  readonly screen: string;
  readonly toolName: AnsibleToolName;
  readonly icon: string;
  readonly actions: readonly string[];
}

const TOOL_DEFINITIONS: readonly WrappedToolDefinition[] = [
  {
    id: 'playbook',
    name: 'Playbook',
    screen: 'playbook',
    toolName: 'ansible-playbook',
    icon: '▶',
    actions: new PlaybookTool().getActions(),
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    screen: 'galaxy',
    toolName: 'ansible-galaxy',
    icon: '◈',
    actions: new GalaxyTool().getActions(),
  },
  {
    id: 'vault',
    name: 'Vault',
    screen: 'vault',
    toolName: 'ansible-vault',
    icon: '◆',
    actions: new VaultTool().getActions(),
  },
  {
    id: 'inventory',
    name: 'Inventory',
    screen: 'inventory',
    toolName: 'ansible-inventory',
    icon: '⊞',
    actions: new InventoryTool().getActions(),
  },
  {
    id: 'docs',
    name: 'Docs',
    screen: 'docs',
    toolName: 'ansible-doc',
    icon: '≡',
    actions: new DocTool().getActions(),
  },
  {
    id: 'config',
    name: 'Config',
    screen: 'config',
    toolName: 'ansible-config',
    icon: '⚙',
    actions: new ConfigTool().getActions(),
  },
  {
    id: 'test',
    name: 'Test',
    screen: 'test',
    toolName: 'ansible-test',
    icon: '◉',
    actions: new TestTool().getActions(),
  },
  {
    id: 'builder',
    name: 'Builder',
    screen: 'builder',
    toolName: 'ansible-builder',
    icon: '⬡',
    actions: new BuilderTool().getActions(),
  },
  {
    id: 'lint',
    name: 'Lint',
    screen: 'lint',
    toolName: 'ansible-lint',
    icon: '⚑',
    actions: new LintTool().getActions(),
  },
  {
    id: 'creator',
    name: 'Creator',
    screen: 'creator',
    toolName: 'ansible-creator',
    icon: '⊕',
    actions: new CreatorTool().getActions(),
  },
  {
    id: 'console',
    name: 'Console',
    screen: 'console',
    toolName: 'ansible-console',
    icon: '⌘',
    actions: new ConsoleTool().getActions(),
  },
] as const;

export const WRAPPED_TOOL_DEFINITIONS: readonly WrappedToolDefinition[] = TOOL_DEFINITIONS;
