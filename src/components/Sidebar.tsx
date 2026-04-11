import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ToolInfo, AnsibleToolName } from '../models/tool.js';
import { WRAPPED_TOOL_DEFINITIONS } from '../utils/toolRegistry.js';
import { useThemePalette } from './theme.js';

interface SidebarEntry {
  readonly id: string;
  readonly name: string;
  readonly screen: string;
  readonly toolName: AnsibleToolName | null;
  readonly icon: string;
  readonly actions?: readonly string[];
}

interface SidebarGroup {
  readonly title: string;
  readonly entries: readonly SidebarEntry[];
}

const WORKSPACE_ENTRIES: readonly SidebarEntry[] = [
  ...WRAPPED_TOOL_DEFINITIONS,
];

const MANAGEMENT_ENTRIES: readonly SidebarEntry[] = [
  { id: 'jobs',        name: 'Jobs',        screen: 'jobs',        toolName: null, icon: '⊡' },
  { id: 'sessions',    name: 'Sessions',    screen: 'sessions',    toolName: null, icon: '◐' },
];

const SIDEBAR_GROUPS: readonly SidebarGroup[] = [
  { title: 'WORKSPACE', entries: WORKSPACE_ENTRIES },
  { title: 'MANAGE',    entries: MANAGEMENT_ENTRIES },
];

const SIDEBAR_WIDTH = 30;
// borders (2) + paddingX (2) = 4 chars of chrome on each line
const INNER_WIDTH = SIDEBAR_WIDTH - 4;

// Dots fill for group separator, using the theme's panelFill character
const buildGroupFill = (titleLength: number, fillChar: string): string => {
  // '◆ ' (2) + title + ' ' (1) already consumed
  const used = 3 + titleLength;
  return fillChar.repeat(Math.max(2, INNER_WIDTH - used));
};

// Status column: version string for available, '─' for missing
const formatStatus = (available: boolean, version: string | null): string => {
  if (!available) return '─';
  if (!version) return 'ok';
  // Truncate long version strings to avoid overflow (e.g. "2.17.0.post0")
  return version.length > 9 ? version.slice(0, 8) + '…' : version;
};

// ── Virtual list item types ───────────────────────────────────────────────────
type VirtualItem =
  | { kind: 'group-header'; title: string }
  | { kind: 'entry'; entry: SidebarEntry; entryIndex: number }
  | { kind: 'sub-action'; action: string; parentEntry: SidebarEntry }
  | { kind: 'spacer' };

const buildVirtualList = (expandedToolId: string | null): VirtualItem[] => {
  const allEntries = SIDEBAR_GROUPS.flatMap((g) => [...g.entries]);
  const items: VirtualItem[] = [];
  SIDEBAR_GROUPS.forEach((group, gi) => {
    if (gi > 0) items.push({ kind: 'spacer' });
    items.push({ kind: 'group-header', title: group.title });
    group.entries.forEach((entry) => {
      const entryIndex = allEntries.findIndex((e) => e.id === entry.id);
      items.push({ kind: 'entry', entry, entryIndex });
      if (expandedToolId === entry.id && entry.actions) {
        for (const action of entry.actions) {
          items.push({ kind: 'sub-action', action, parentEntry: entry });
        }
      }
    });
  });
  return items;
};

interface SidebarProps {
  tools: Map<AnsibleToolName, ToolInfo>;
  activeScreen: string;
  activeAction?: string;
  onSelect: (screen: string, action?: string) => void;
  disabled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tools,
  activeScreen,
  activeAction,
  onSelect,
  disabled = false,
}) => {
  const theme = useThemePalette();
  const allEntries = SIDEBAR_GROUPS.flatMap((g) => [...g.entries]);
  const [focusIndex, setFocusIndex] = useState(0);

  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [subFocusIndex, setSubFocusIndex] = useState(0);

  const indicator = '▶';

  const isAvailable = useCallback((entry: SidebarEntry): boolean => {
    if (entry.toolName === null) return true;
    return tools.get(entry.toolName)?.available ?? false;
  }, [tools]);

  const selectableIndices = allEntries
    .map((entry, i) => (isAvailable(entry) ? i : -1))
    .filter((i) => i !== -1);

  useEffect(() => {
    const idx = allEntries.findIndex((e) => e.screen === activeScreen);
    if (idx >= 0) setFocusIndex(idx);
  }, [activeScreen, allEntries]);

  const displayExpandedTool: string | null =
    expandedTool ??
    (() => {
      const activeEntry = allEntries.find((e) => e.screen === activeScreen);
      return activeEntry && activeAction !== undefined ? activeEntry.id : null;
    })();

  const VIRTUAL_LIST = buildVirtualList(displayExpandedTool);

  useInput((_input, key) => {
    if (disabled) return;

    if (expandedTool !== null) {
      const actions = allEntries.find((entry) => entry.id === expandedTool)?.actions ?? [];

      if (key.upArrow) {
        setSubFocusIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setSubFocusIndex((prev) => Math.min(actions.length - 1, prev + 1));
        return;
      }
      if (key.escape) {
        setExpandedTool(null);
        return;
      }
      if (key.return) {
        const entry = allEntries[focusIndex];
        if (entry) {
          onSelect(entry.screen, actions[subFocusIndex]);
        }
        return;
      }
      return;
    }

    if (key.upArrow) {
      setFocusIndex((prev) => {
        const pos = selectableIndices.indexOf(prev);
        if (pos <= 0) return selectableIndices[selectableIndices.length - 1] ?? prev;
        return selectableIndices[pos - 1] ?? prev;
      });
    }

    if (key.downArrow) {
      setFocusIndex((prev) => {
        const pos = selectableIndices.indexOf(prev);
        if (pos === -1 || pos >= selectableIndices.length - 1) return selectableIndices[0] ?? prev;
        return selectableIndices[pos + 1] ?? prev;
      });
    }

    if (key.return || key.rightArrow) {
      const entry = allEntries[focusIndex];
      if (entry && entry.actions && isAvailable(entry)) {
        setExpandedTool(entry.id);
        setSubFocusIndex(0);
        return;
      }
      if (key.return && entry && isAvailable(entry)) {
        onSelect(entry.screen);
      }
    }
  });

  // ── 8.2: Scroll window ────────────────────────────────────────────────────
  const terminalRows = process.stdout.rows ?? 40;
  // mainBodyHeight mirrors App.tsx: terminalRows - topShellHeight(12) - footerHeight(3) - bodyGap(1)
  const mainBodyHeight = Math.max(12, terminalRows - 16);
  // sidebar box chrome: 2 (border) + 2 (paddingY); footer strip: 3 lines; scroll indicators: up to 2
  const FOOTER_ROWS = 3;
  const BOX_CHROME  = 4;
  const visibleCount = Math.max(6, mainBodyHeight - BOX_CHROME - FOOTER_ROWS);

  // Find the virtual list position of the currently focused entry
  const focusedVirtualIdx = displayExpandedTool !== null
    ? (() => {
        const action = expandedTool !== null
          ? (allEntries.find((entry) => entry.id === expandedTool)?.actions ?? [])[subFocusIndex]
          : activeAction;
        return VIRTUAL_LIST.findIndex(
          (item) => item.kind === 'sub-action' && item.parentEntry.id === displayExpandedTool && item.action === action
        );
      })()
    : VIRTUAL_LIST.findIndex(
        (item) => item.kind === 'entry' && item.entryIndex === focusIndex
      );

  let windowStart = 0;
  let windowEnd   = VIRTUAL_LIST.length;

  if (VIRTUAL_LIST.length > visibleCount) {
    // Center the window around the focused item, clamped to bounds
    const half = Math.floor(visibleCount / 2);
    windowStart = Math.max(0, focusedVirtualIdx - half);
    windowEnd   = Math.min(VIRTUAL_LIST.length, windowStart + visibleCount);
    // Re-anchor start if end hit the boundary
    if (windowEnd === VIRTUAL_LIST.length) {
      windowStart = Math.max(0, windowEnd - visibleCount);
    }
  }

  const visibleItems   = VIRTUAL_LIST.slice(windowStart, windowEnd);
  const hasMoreAbove   = windowStart > 0;
  const hasMoreBelow   = windowEnd < VIRTUAL_LIST.length;

  // ── 8.3: Stats for status strip ───────────────────────────────────────────
  const totalTools   = allEntries.filter((e) => e.toolName !== null).length;
  const readyTools   = allEntries.filter(
    (e) => e.toolName !== null && isAvailable(e)
  ).length;
  const hrLine       = '─'.repeat(INNER_WIDTH);

  // Rail header fill
  const headerLabel = 'Navigation';
  const headerFill  = '─'.repeat(Math.max(2, SIDEBAR_WIDTH - headerLabel.length - 5));

  const renderEntry = (entry: SidebarEntry, entryIndex: number) => {
    const available = isAvailable(entry);
    const isActive  = activeScreen === entry.screen;
    const isFocused = focusIndex === entryIndex && !disabled;
    const icon      = available ? entry.icon : '○';
    const version   = entry.toolName !== null
      ? (tools.get(entry.toolName)?.version ?? null)
      : null;
    const status    = formatStatus(available, version);

    // ── Active row: full-width background chip ─────────
    if (isActive) {
      return (
        <Box key={entry.id} justifyContent="space-between" paddingX={1}>
          <Text backgroundColor={theme.highlight} color={theme.highlightText} bold>
            {indicator}{' '}{icon}{' '}{entry.name}
          </Text>
          <Text backgroundColor={theme.highlight} color={theme.highlightText}>
            {status}
          </Text>
        </Box>
      );
    }

    // ── Unavailable row: dimmed, no interaction ─────────
    if (!available) {
      return (
        <Box key={entry.id} justifyContent="space-between" paddingX={1}>
          <Text color={theme.muted} dimColor>
            {'  '}{icon}{' '}{entry.name}
          </Text>
          <Text color={theme.muted} dimColor>{status}</Text>
        </Box>
      );
    }

    // ── Focused available row ───────────────────────────
    if (isFocused) {
      return (
        <Box key={entry.id} justifyContent="space-between" paddingX={1}>
          <Text color={theme.primary} bold>
            {indicator}{' '}<Text color={theme.primary}>{icon}</Text>{' '}{entry.name}
          </Text>
          <Text color={theme.primary}>{status}</Text>
        </Box>
      );
    }

    // ── Normal available row ────────────────────────────
    return (
      <Box key={entry.id} justifyContent="space-between" paddingX={1}>
        <Text>
          {'  '}<Text color={theme.primary}>{icon}</Text>{' '}{entry.name}
        </Text>
        <Text color={theme.muted}>{status}</Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" width={SIDEBAR_WIDTH}>

      {/* ── Rail header ──────────────────────────────────────── */}
      <Box width={SIDEBAR_WIDTH}>
        <Text color={theme.dimBorder}>{'╭─ '}</Text>
        <Text color={theme.primary} bold>{headerLabel}</Text>
        <Text color={theme.dimBorder}>{' ' + headerFill}</Text>
        <Text color={theme.dimBorder}>{'╮'}</Text>
      </Box>

      {/* ── Rail body ────────────────────────────────────────── */}
      <Box
        flexDirection="column"
        width={SIDEBAR_WIDTH}
        borderStyle="round"
        borderColor={theme.dimBorder}
        borderTop={false}
        paddingX={1}
        paddingY={1}
      >

        {/* ── 8.2: Scroll indicator — more above ─────────── */}
        {hasMoreAbove && (
          <Box paddingX={1}>
            <Text dimColor>{`▲ ${windowStart} more above`}</Text>
          </Box>
        )}

        {/* ── Scrolled virtual list ────────────────────────── */}
        {visibleItems.map((item, i) => {
          if (item.kind === 'group-header') {
            return (
              <Box key={`gh-${item.title}`} marginBottom={1} marginTop={i === 0 ? 0 : 1}>
                <Text color={theme.accent2} bold>{'◆ '}</Text>
                <Text color={theme.accent2} bold>{item.title}</Text>
                <Text color={theme.dimBorder}>
                  {' ' + buildGroupFill(item.title.length, theme.panelFill)}
                </Text>
              </Box>
            );
          }

          if (item.kind === 'spacer') {
            return <Box key={`spacer-${i}`} height={1} />;
          }

          if (item.kind === 'sub-action') {
            const isSubFocused =
              expandedTool !== null &&
              expandedTool === item.parentEntry.id &&
              (allEntries.find((entry) => entry.id === expandedTool)?.actions ?? [])[subFocusIndex] === item.action;

            const isSubActive =
              activeScreen === item.parentEntry.screen &&
              activeAction === item.action;

            if (isSubActive) {
              return (
                <Box key={`sub-${item.parentEntry.id}-${item.action}`} paddingX={1}>
                  <Text color={theme.warning} bold>
                    {'   ▸ '}{item.action}
                  </Text>
                </Box>
              );
            }

            if (isSubFocused) {
              return (
                <Box key={`sub-${item.parentEntry.id}-${item.action}`} paddingX={1}>
                  <Text color={theme.primary} bold>
                    {'   ▸ '}{item.action}
                  </Text>
                </Box>
              );
            }

            return (
              <Box key={`sub-${item.parentEntry.id}-${item.action}`} paddingX={1}>
                <Text color={theme.muted}>
                  {'   › '}{item.action}
                </Text>
              </Box>
            );
          }

          return renderEntry(item.entry, item.entryIndex);
        })}

        {/* ── 8.2: Scroll indicator — more below ─────────── */}
        {hasMoreBelow && (
          <Box paddingX={1}>
            <Text dimColor>{`▼ ${VIRTUAL_LIST.length - windowEnd} more below`}</Text>
          </Box>
        )}

        {/* ── 8.3: Footer status strip ─────────────────────── */}
        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.dimBorder}>{hrLine}</Text>
          <Box marginTop={1} paddingX={1} justifyContent="space-between">
            <Text color={theme.muted}>{totalTools} tools</Text>
            <Text color={theme.dimBorder}>·</Text>
            <Text color={readyTools === totalTools ? theme.success : theme.warning} bold>
              {readyTools} ready
            </Text>
          </Box>
        </Box>

      </Box>
    </Box>
  );
};
