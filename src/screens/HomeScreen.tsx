import React from 'react';
import { Box, Text } from 'ink';
import { PanelFrame } from '../components/PanelFrame.js';
import { BrailleSpinner } from '../components/BrailleSpinner.js';
import { useThemePalette } from '../components/theme.js';
import type { ThemePalette } from '../components/theme.js';
import type { Session } from '../models/session.js';
import type { ToolInfo, AnsibleEnvironment, AnsibleToolName } from '../models/tool.js';
import { ANSIBLE_TOOLS } from '../models/tool.js';

interface HomeScreenProps {
  activeSession: Session | null;
  tools: Map<AnsibleToolName, ToolInfo>;
  ansibleEnv: AnsibleEnvironment;
  isLoading?: boolean;
  onSelectTool: (screen: string) => void;
}

// ── 4.6: Tool-name → icon (keyed by AnsibleToolName) ─────────────────────
const TOOL_MATRIX_ICONS: Record<string, string> = {
  'ansible':           '⚙',
  'ansible-playbook':  '▶',
  'ansible-galaxy':    '◈',
  'ansible-vault':     '◆',
  'ansible-doc':       '≡',
  'ansible-inventory': '⊞',
  'ansible-config':    '⚙',
  'ansible-lint':      '⚑',
  'ansible-test':      '◉',
  'ansible-builder':   '⬡',
  'ansible-creator':   '⊕',
  'ansible-console':   '◐',
  'ansible-pull':      '↓',
  'ansible-community': '▣',
};

const TOOL_LABELS: Record<string, string> = {
  ansible:             'Core',
  'ansible-playbook':  'Playbook',
  'ansible-galaxy':    'Galaxy',
  'ansible-vault':     'Vault',
  'ansible-inventory': 'Inventory',
  'ansible-doc':       'Docs',
  'ansible-config':    'Config',
  'ansible-lint':      'Lint',
  'ansible-test':      'Test',
  'ansible-builder':   'Builder',
  'ansible-creator':   'Creator',
  'ansible-console':   'Console',
  'ansible-pull':      'Pull',
  'ansible-community': 'Community',
};

const chunk = <T,>(items: readonly T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

// ── 4.5: 4-level gradient health bar ─────────────────────────────────────
const renderGradientHealthBar = (
  theme: ThemePalette,
  installed: number,
  total: number,
  width: number,
) => {
  const safeTotal = Math.max(total, 1);
  const installedCells = Math.max(0, Math.min(width, Math.round(width * (installed / safeTotal))));
  const missingCells   = Math.max(0, width - installedCells);

  // Distribute 4 fill levels across installed cells
  const l0end = Math.round(installedCells * 0.25);
  const l1end = Math.round(installedCells * 0.50);
  const l2end = Math.round(installedCells * 0.75);

  const l0 = l0end;
  const l1 = l1end - l0end;
  const l2 = l2end - l1end;
  const l3 = Math.max(0, installedCells - l2end);

  return (
    <Text>
      <Text dimColor>▐</Text>
      <Text color={theme.success} dimColor>{'░'.repeat(l0)}</Text>
      <Text color={theme.success}>{'▒'.repeat(l1)}</Text>
      <Text color={theme.success} bold>{'▓'.repeat(l2)}</Text>
      <Text color={theme.success} bold>{'█'.repeat(l3)}</Text>
      {missingCells > 0 && <Text color={theme.error}>{'░'.repeat(missingCells)}</Text>}
      <Text dimColor>▌</Text>
    </Text>
  );
};

// ── 4.4: Version chip component ───────────────────────────────────────────
interface VersionChipProps {
  label: string;
  value: string | null;
  color: string;
}

interface SessionDetailRowProps {
  icon: string;
  label: string;
  value: string;
  iconColor: string;
  valueColor?: string;
  boldValue?: boolean;
}

const VersionChip: React.FC<VersionChipProps> = ({ label, value, color }) => (
  <Box justifyContent="space-between">
    <Text dimColor>{label}</Text>
    {value ? (
      <Box>
        <Text dimColor>{'┤ '}</Text>
        <Text color={color} bold>{value}</Text>
        <Text dimColor>{' ├'}</Text>
      </Box>
    ) : (
      <Text dimColor>{'┤ n/a ├'}</Text>
    )}
  </Box>
);

const SessionDetailRow: React.FC<SessionDetailRowProps> = ({
  icon,
  label,
  value,
  iconColor,
  valueColor,
  boldValue = false,
}) => (
  <Box>
    <Text color={iconColor}>{icon}</Text>
    <Text dimColor>{` ${label}: `}</Text>
    <Text color={valueColor} bold={boldValue}>{value}</Text>
  </Box>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeSession,
  tools,
  ansibleEnv,
  isLoading,
  onSelectTool: _onSelectTool,
}) => {
  const theme = useThemePalette();
  const terminalRows    = process.stdout.rows    ?? 24;
  const terminalColumns = process.stdout.columns ?? 120;
  const isCompact       = terminalRows < 30;
  const availableWidth  = Math.max(64, terminalColumns - 34);
  const sessionWidth    = availableWidth;

  const completionPercent_raw = Math.round(
    (Array.from(tools.values()).filter(i => i.available).length / Math.max(ANSIBLE_TOOLS.length, 1)) * 100
  );

  const toolEntries = ANSIBLE_TOOLS.map((name) => ({
    name,
    label: TOOL_LABELS[name] ?? name,
    icon:  TOOL_MATRIX_ICONS[name] ?? '·',
    info:  tools.get(name),
  }));

  const installedCount    = toolEntries.filter(({ info }) => info?.available).length;
  const missingCount      = toolEntries.filter(({ info }) => !info?.available).length;
  const totalCount        = toolEntries.length;
  const completionPercent = completionPercent_raw;
  const toolColumns       = chunk(
    toolEntries,
    terminalColumns < 130 ? toolEntries.length : Math.ceil(toolEntries.length / 2),
  );
  const healthBarWidth = Math.max(28, Math.min(72, sessionWidth - 10));

  if (isLoading) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <PanelFrame title="Booting Workspace" accent="cyan">
          <Box flexDirection="column">
            <Text color={theme.primary}>
              <BrailleSpinner color={theme.primary} />{' '}Inspecting installed ansible tooling
            </Text>
            <Text dimColor>Building the dashboard shell and collecting runtime metadata...</Text>
          </Box>
        </PanelFrame>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingY={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text color={theme.primary} bold>Dashboard</Text>
        <Text dimColor>workspace overview</Text>
      </Box>

      <Box flexDirection="column">

        {/* ── Session panel ────────────────────────────────────── */}
        <PanelFrame title="Session" accent="cyan" width={sessionWidth}>
          {activeSession ? (
            <Box flexDirection="column">
              <SessionDetailRow
                icon="◉"
                label="name"
                value={activeSession.name}
                iconColor={theme.primary}
                valueColor={theme.panelTitle}
                boldValue
              />
              <SessionDetailRow
                icon="⌂"
                label="path"
                value={activeSession.workingDir}
                iconColor={theme.accent2}
                valueColor={theme.muted}
              />
              <SessionDetailRow
                icon="⊞"
                label="inventory"
                value={activeSession.inventory ?? 'not set'}
                iconColor={theme.warning}
                valueColor={theme.muted}
              />
              <SessionDetailRow
                icon="◆"
                label="vault"
                value={activeSession.vaultId ?? 'not set'}
                iconColor={theme.secondary}
                valueColor={theme.muted}
              />
              <SessionDetailRow
                icon="#"
                label="tags"
                value={activeSession.tags.length > 0 ? activeSession.tags.join(', ') : 'none'}
                iconColor={theme.success}
                valueColor={theme.muted}
              />
              <SessionDetailRow
                icon="✎"
                label="notes"
                value={activeSession.notes || 'none'}
                iconColor={theme.primary}
                valueColor={theme.muted}
              />
            </Box>
          ) : (
            <Box flexDirection="column">
              <Text dimColor>No active session selected.</Text>
              <Text dimColor>Press [s] to create or switch workspaces.</Text>
            </Box>
          )}
        </PanelFrame>

        {/* ── Runtime panel — version chips (4.4) ──────────────── */}
        <PanelFrame title="Runtime" accent="yellow" width={sessionWidth}>
          <Box flexDirection="column">
            <VersionChip label="ansible core" value={ansibleEnv.ansibleCore}  color={theme.primary}   />
            <VersionChip label="python"       value={ansibleEnv.pythonVersion} color={theme.warning}   />
            <VersionChip label="jinja"        value={ansibleEnv.jinjaVersion}  color={theme.secondary} />
            <VersionChip label="pyyaml"       value={ansibleEnv.pyyamlVersion} color={theme.success}   />
            <Box justifyContent="space-between">
              <Text dimColor>config</Text>
              <Text dimColor>{ansibleEnv.configFile ?? 'none'}</Text>
            </Box>
            <Box justifyContent="space-between">
              <Text dimColor>collections</Text>
              <Text dimColor>{ansibleEnv.collectionPath ?? 'n/a'}</Text>
            </Box>
          </Box>
        </PanelFrame>

        {/* ── Health & Tool Matrix panel (4.5 + 4.6) ───────────── */}
        <PanelFrame title="Health & Tool Matrix" accent="magenta" width={sessionWidth}>
          <Box flexDirection="column">
            <Box justifyContent="space-between">
              <Text dimColor>tool coverage</Text>
              <Text>
                <Text color={theme.secondary} bold>{completionPercent}%</Text>
                <Text dimColor> ready</Text>
              </Text>
            </Box>

            {/* 7.5: Static gradient health bar */}
            <Box marginTop={1}>
              {renderGradientHealthBar(theme, installedCount, totalCount, healthBarWidth)}
            </Box>

            <Box marginTop={1} justifyContent="space-between">
              <Text dimColor>{installedCount}/{totalCount} tools available</Text>
              <Text dimColor>{missingCount === 0 ? 'fully ready' : 'partial environment'}</Text>
            </Box>

            {/* 4.6: Tool matrix with icons */}
            <Box marginTop={1}>
              <Text dimColor>matrix</Text>
            </Box>
            <Box>
              {toolColumns.map((column, columnIndex) => (
                <Box
                  key={columnIndex}
                  flexDirection="column"
                  width={terminalColumns < 130 ? undefined : 30}
                  marginRight={columnIndex === 0 && terminalColumns >= 130 ? 2 : 0}
                >
                  {column.map(({ name, label, icon, info }) => {
                    const available = info?.available ?? false;
                    return (
                      <Box key={name} justifyContent="space-between">
                        <Text>
                          <Text color={available ? theme.primary : theme.muted}>{icon}</Text>
                          {' '}
                          <Text bold={available} color={available ? undefined : theme.muted}>
                            {label.padEnd(11)}
                          </Text>
                        </Text>
                        <Text dimColor>
                          {available ? (info?.version ?? 'installed') : '─'}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </PanelFrame>

        {/* ── Workspace Notes panel ─────────────────────────────── */}
        {!isCompact && (
          <PanelFrame title="Workspace Notes" accent="green" width={sessionWidth}>
            <Box flexDirection="column">
              <Text dimColor>Use the rail on the left to move between workspace tools and manage views.</Text>
              <Text dimColor>Tool screens inherit session defaults for inventory, vault, and working directory.</Text>
              <Text dimColor>Press t to cycle themes, s for sessions, q to quit.</Text>
            </Box>
          </PanelFrame>
        )}

      </Box>
    </Box>
  );
};
