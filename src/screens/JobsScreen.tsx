import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { readFile } from 'node:fs/promises';
import { ToolScreenFrame } from '../components/ToolScreenFrame.js';
import { PanelFrame } from '../components/PanelFrame.js';
import { useThemePalette } from '../components/theme.js';
import { readJobs, deleteJob } from '../core/jobs.js';
import type { ExecutedCommand } from '../models/command.js';

interface JobsScreenProps {
  onBack: () => void;
}

type Phase = 'list' | 'detail';

// Adapt visible rows to terminal height — subtract shell chrome
const terminalRows = process.stdout.rows ?? 40;
const VISIBLE_JOBS     = Math.min(16, Math.max(6, terminalRows - 26));
const VISIBLE_LOG      = Math.min(20, Math.max(6, terminalRows - 32));

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    if (d.toDateString() === now.toDateString()) return `today ${hh}:${mm}`;
    const yesterday = new Date(now.getTime() - 86400000);
    if (d.toDateString() === yesterday.toDateString()) return `yest. ${hh}:${mm}`;
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${mo}/${dd} ${hh}:${mm}`;
  } catch {
    return iso.slice(0, 16);
  }
}

function formatFullTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mo = months[d.getMonth()] ?? '';
    const dd = d.getDate();
    const yyyy = d.getFullYear();
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');
    return `${mo} ${dd}, ${yyyy}  ${hh}:${mm}:${ss}`;
  } catch {
    return iso;
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '–';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m${(s % 60).toString().padStart(2, '0')}s`;
}

function shortTool(tool: string): string {
  return tool.replace('ansible-', '');
}

// ── Target extraction ─────────────────────────────────────────────────────────
// Returns the most meaningful "file / path / target" from the command argv.
// Each tool has a distinct command shape; we handle the common cases explicitly.

const VAULT_VERBS   = new Set(['encrypt','decrypt','view','edit','create','rekey','encrypt_string']);
const GALAXY_SUBS   = new Set(['collection','role']);
const GALAXY_VERBS  = new Set(['install','list','info','init','remove','publish','build','verify','search','import','pull','delete']);

function extractTarget(tool: string, command: string[]): string | null {
  const args = command.slice(1); // drop binary

  // Positional args — not starting with '-'
  const pos = args.filter((a) => !a.startsWith('-'));

  if (tool.includes('playbook')) {
    // ansible-playbook <playbook.yml> [-i inv …]
    return pos[0] ?? null;
  }

  if (tool.includes('vault')) {
    // ansible-vault <verb> <file> [--flags …]
    // encrypt_string operates on a plaintext value, not a file — skip
    if (command[1] === 'encrypt_string') return null;
    return pos.find((p) => !VAULT_VERBS.has(p)) ?? null;
  }

  if (tool.includes('inventory')) {
    // ansible-inventory -i <inv> [--list|--graph …]
    const iIdx = args.findIndex((a) => a === '-i' || a === '--inventory');
    if (iIdx >= 0) return args[iIdx + 1] ?? null;
    return pos[0] ?? null;
  }

  if (tool.includes('lint')) {
    // ansible-lint [path/role/.]
    return pos[0] ?? null;
  }

  if (tool.includes('galaxy')) {
    // ansible-galaxy collection install <target>
    // ansible-galaxy role install <target>
    // ansible-galaxy collection install -r requirements.yml
    const rIdx = args.findIndex((a) => a === '-r' || a === '--requirements-file');
    if (rIdx >= 0) return args[rIdx + 1] ?? null;
    return pos.find((p) => !GALAXY_SUBS.has(p) && !GALAXY_VERBS.has(p)) ?? null;
  }

  if (tool.includes('doc')) {
    // ansible-doc <module>
    return pos[0] ?? null;
  }

  if (tool.includes('builder')) {
    // ansible-builder build -t <tag>; no meaningful file positional
    return null;
  }

  if (tool.includes('config')) {
    // ansible-config dump/list/view — subcommand already shown in ACTION
    return null;
  }

  if (tool.includes('test')) {
    // ansible-test sanity/units/integration — no file target
    return null;
  }

  // generic fallback — first positional
  return pos[0] ?? null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  exitCode: number | null;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ exitCode }) => {
  const theme = useThemePalette();
  if (exitCode === null) {
    return <Text backgroundColor={theme.warning} color="#000000" bold>{' ● '}</Text>;
  }
  if (exitCode === 0) {
    return <Text backgroundColor={theme.success} color="#000000" bold>{' ✓ '}</Text>;
  }
  return <Text backgroundColor={theme.error} color="#ffffff" bold>{' ✗ '}</Text>;
};

interface ChipProps {
  color: string;
  children: React.ReactNode;
  bold?: boolean;
}

const Chip: React.FC<ChipProps> = ({ color, children, bold }) => (
  <Box>
    <Text dimColor>┤ </Text>
    <Text color={color} bold={bold}>{children}</Text>
    <Text dimColor> ├</Text>
  </Box>
);

// ── List row ──────────────────────────────────────────────────────────────────

interface JobRowProps {
  job: ExecutedCommand;
  isSelected: boolean;
}

const JobRow: React.FC<JobRowProps> = ({ job, isSelected }) => {
  const theme = useThemePalette();
  const target = extractTarget(job.tool, job.command);

  return (
    <Box gap={1} overflow="hidden">
      {/* Cursor */}
      <Text color={isSelected ? theme.primary : theme.dimBorder} bold={isSelected}>
        {isSelected ? '▶' : '·'}
      </Text>

      {/* Status badge */}
      <Box width={3} flexShrink={0}>
        <StatusBadge exitCode={job.exitCode} />
      </Box>

      {/* Tool — width 11 fits "inventory" (9) comfortably */}
      <Box width={11} flexShrink={0}>
        <Text
          color={isSelected ? theme.primary : undefined}
          bold={isSelected}
          wrap="truncate"
        >
          {shortTool(job.tool)}
        </Text>
      </Box>

      {/* Action — width 9 fits "install" (7), "encrypt" (7) */}
      <Box width={9} flexShrink={0}>
        <Text
          color={isSelected ? theme.secondary : theme.muted}
          wrap="truncate"
        >
          {job.action}
        </Text>
      </Box>

      {/* Duration */}
      <Box width={7} flexShrink={0}>
        <Text dimColor wrap="truncate">{formatDuration(job.durationMs)}</Text>
      </Box>

      {/* Timestamp — shrinks at narrow widths */}
      <Box width={13} flexShrink={1}>
        <Text dimColor wrap="truncate">{formatTimestamp(job.timestamp)}</Text>
      </Box>

      {/* Session — fixed width, shrinks at narrow widths */}
      <Box width={18} flexShrink={1} overflow="hidden">
        <Text
          color={isSelected ? theme.accent2 : undefined}
          dimColor={!isSelected}
          wrap="truncate"
        >
          {job.sessionName}
        </Text>
      </Box>

      {/* File / path / target — last column, grows to fill remaining space */}
      <Box flexGrow={1} flexShrink={1} overflow="hidden">
        {target ? (
          <Text
            color={isSelected ? theme.warning : undefined}
            dimColor={!isSelected}
            wrap="truncate"
          >
            {target}
          </Text>
        ) : (
          <Text dimColor>─</Text>
        )}
      </Box>
    </Box>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

export const JobsScreen: React.FC<JobsScreenProps> = ({ onBack }) => {
  const theme = useThemePalette();
  // ToolScreenFrame provides PanelWidthContext to its children, but JobsScreen is
  // ToolScreenFrame's parent in the React tree — context would be null here.
  // Compute content width directly using the same formula as ToolScreenFrame.
  const contentWidth = Math.max(28, (process.stdout.columns ?? 120) - 38);
  const [phase, setPhase] = useState<Phase>('list');
  const [jobs, setJobs] = useState<ExecutedCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [logScrollOffset, setLogScrollOffset] = useState(0);
  const [loadingLog, setLoadingLog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadJobs = useCallback(async () => {
    const data = await readJobs({ limit: 200 });
    setJobs(data);
  }, []);

  useEffect(() => { void loadJobs(); }, [loadJobs]);

  // Keep selected row inside the scroll window
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + VISIBLE_JOBS) {
      setScrollOffset(selectedIndex - VISIBLE_JOBS + 1);
    }
  }, [selectedIndex, scrollOffset]);

  const openDetail = useCallback(async (job: ExecutedCommand) => {
    setLoadingLog(true);
    setLogScrollOffset(0);
    setPhase('detail');
    if (job.outputFile) {
      try {
        const raw = await readFile(job.outputFile, 'utf-8');
        // Skip the 5-line metadata header written by executor
        const all = raw.split('\n');
        const bodyStart = all.findIndex((l) => l === '') + 1;
        setLogLines(bodyStart > 0 ? all.slice(bodyStart) : all);
      } catch {
        setLogLines(['(log file not found)']);
      }
    } else {
      setLogLines(['(no output file recorded)']);
    }
    setLoadingLog(false);
  }, []);

  const handleDelete = useCallback(async () => {
    const job = jobs[selectedIndex];
    if (!job || deleting) return;
    setDeleting(true);
    await deleteJob(job.id, job.sessionId);
    await loadJobs();
    setSelectedIndex((i) => Math.max(0, Math.min(i, jobs.length - 2)));
    setDeleting(false);
  }, [jobs, selectedIndex, deleting, loadJobs]);

  useInput((_input, key) => {
    if (phase === 'list') {
      if (key.upArrow)   setSelectedIndex((i) => Math.max(0, i - 1));
      else if (key.downArrow) setSelectedIndex((i) => Math.min(jobs.length - 1, i + 1));
      else if (key.pageUp)   setSelectedIndex((i) => Math.max(0, i - 5));
      else if (key.pageDown) setSelectedIndex((i) => Math.min(jobs.length - 1, i + 5));
      else if (key.return && jobs.length > 0) {
        const job = jobs[selectedIndex];
        if (job) void openDetail(job);
      } else if (_input === 'd' && jobs.length > 0) {
        void handleDelete();
      } else if (key.escape) {
        onBack();
      }
    } else {
      const maxOff = Math.max(0, logLines.length - VISIBLE_LOG);
      if (key.upArrow)        setLogScrollOffset((o) => Math.max(0, o - 1));
      else if (key.downArrow) setLogScrollOffset((o) => Math.min(maxOff, o + 1));
      else if (key.pageUp)    setLogScrollOffset((o) => Math.max(0, o - 10));
      else if (key.pageDown)  setLogScrollOffset((o) => Math.min(maxOff, o + 10));
      else if (key.escape)    { setPhase('list'); setLogLines([]); }
    }
  });

  // ── LIST PHASE ─────────────────────────────────────────────────────────────

  if (phase === 'list') {
    const visibleJobs = jobs.slice(scrollOffset, scrollOffset + VISIBLE_JOBS);
    const hasAbove = scrollOffset > 0;
    const hasBelow = scrollOffset + VISIBLE_JOBS < jobs.length;
    const posLabel = jobs.length > 0
      ? `${selectedIndex + 1} / ${jobs.length}`
      : undefined;

    return (
      <ToolScreenFrame
        title="Jobs"
        subtitle={jobs.length > 0 ? `${jobs.length} recorded` : 'no jobs yet'}
        hints={['↑↓ PgUp/Dn navigate', 'Enter view', 'd delete', 'Esc back']}
        status={posLabel}
      >
        {jobs.length === 0 ? (
          <Box marginTop={2} flexDirection="column" gap={1}>
            <Text dimColor>No jobs recorded yet.</Text>
            <Text dimColor>Run any command with an active session to start tracking.</Text>
          </Box>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {/* Column header — widths must mirror JobRow exactly */}
            <Box gap={1}>
              <Text dimColor>{' '}</Text>
              <Box width={3}  flexShrink={0}><Text dimColor>ST</Text></Box>
              <Box width={11} flexShrink={0}><Text dimColor>TOOL</Text></Box>
              <Box width={9}  flexShrink={0}><Text dimColor>ACTION</Text></Box>
              <Box width={7}  flexShrink={0}><Text dimColor>DUR</Text></Box>
              <Box width={13} flexShrink={1}><Text dimColor>WHEN</Text></Box>
              <Box width={18} flexShrink={1}><Text dimColor>SESSION</Text></Box>
              <Box flexGrow={1}><Text dimColor>FILE</Text></Box>
            </Box>
            {/* Header separator */}
            <Box marginBottom={0}>
              <Text dimColor>
                {'─'.repeat(contentWidth)}
              </Text>
            </Box>

            {/* Scroll indicator — above */}
            {hasAbove && (
              <Text color={theme.primary}>
                {`  ▲ ${scrollOffset} more above`}
              </Text>
            )}

            {/* Job rows */}
            {visibleJobs.map((job, visibleIdx) => (
              <JobRow
                key={job.id}
                job={job}
                isSelected={scrollOffset + visibleIdx === selectedIndex}
              />
            ))}

            {/* Scroll indicator — below */}
            {hasBelow && (
              <Text color={theme.primary}>
                {`  ▼ ${jobs.length - scrollOffset - VISIBLE_JOBS} more below`}
              </Text>
            )}

            {/* Delete feedback */}
            {deleting && (
              <Box marginTop={1}>
                <Text dimColor>deleting…</Text>
              </Box>
            )}
          </Box>
        )}
      </ToolScreenFrame>
    );
  }

  // ── DETAIL PHASE ───────────────────────────────────────────────────────────

  const job = jobs[selectedIndex];
  if (!job) return null;

  const ok = job.exitCode === 0;
  const isPending = job.exitCode === null;
  const statusColor = isPending ? theme.warning : ok ? theme.success : theme.error;
  const statusLabel = isPending ? 'pending' : ok ? `exit 0` : `exit ${job.exitCode}`;

  const totalLogLines = logLines.length;
  const maxLogOff = Math.max(0, totalLogLines - VISIBLE_LOG);
  const visibleLogLines = logLines.slice(logScrollOffset, logScrollOffset + VISIBLE_LOG);
  const hasLogAbove = logScrollOffset > 0;
  const hasLogBelow = logScrollOffset + VISIBLE_LOG < totalLogLines;

  const outputPanelTitle = totalLogLines > 0
    ? `Output · ${totalLogLines} lines · ${logScrollOffset + 1}–${Math.min(logScrollOffset + VISIBLE_LOG, totalLogLines)}`
    : 'Output';

  const outputAccent = isPending ? 'cyan' : ok ? 'green' : 'red';

  return (
    <ToolScreenFrame
      title="Job Detail"
      subtitle={`${shortTool(job.tool)} · ${job.action}`}
      hints={['↑↓ scroll output', 'PgUp/PgDn', 'Esc back']}
    >
      <Box flexDirection="column" gap={1}>

        {/* ── Metadata chips row 1: status + tool + duration ── */}
        <Box gap={2} flexWrap="wrap">
          <Box gap={0}>
            <Text dimColor>┤ </Text>
            <StatusBadge exitCode={job.exitCode} />
            <Text color={statusColor} bold>{` ${statusLabel}`}</Text>
            <Text dimColor> ├</Text>
          </Box>
          <Chip color={theme.primary} bold>{job.tool}</Chip>
          <Chip color={theme.warning}>{formatDuration(job.durationMs)}</Chip>
        </Box>

        {/* ── Metadata row 2: session + timestamp ── */}
        <Box gap={2}>
          <Chip color={theme.accent2}>{job.sessionName}</Chip>
          <Box gap={1}>
            <Text dimColor>◷</Text>
            <Text dimColor>{formatFullTimestamp(job.timestamp)}</Text>
          </Box>
        </Box>

        {/* ── Command line ── */}
        <Box gap={1} overflow="hidden">
          <Text color={theme.muted} bold>$</Text>
          <Box flexGrow={1} overflow="hidden">
            <Text color={theme.secondary} wrap="truncate">
              {job.command.join(' ')}
            </Text>
          </Box>
        </Box>

        {/* ── Log output panel ── */}
        <PanelFrame title={outputPanelTitle} accent={outputAccent}>
          {loadingLog ? (
            <Text dimColor>loading…</Text>
          ) : (
            <Box flexDirection="column">
              {hasLogAbove && (
                <Text color={theme.primary}>{`  ▲ ${logScrollOffset} lines above`}</Text>
              )}
              <Box flexDirection="column" height={VISIBLE_LOG} overflow="hidden">
                {visibleLogLines.map((line, i) => (
                  <Text key={logScrollOffset + i} wrap="truncate">
                    {line.length > 0 ? line : ' '}
                  </Text>
                ))}
              </Box>
              {hasLogBelow && (
                <Text color={theme.primary}>
                  {`  ▼ ${totalLogLines - logScrollOffset - VISIBLE_LOG} lines below`}
                </Text>
              )}
              {totalLogLines === 0 && (
                <Text dimColor>  no output</Text>
              )}
              {/* Scroll position bar */}
              {totalLogLines > VISIBLE_LOG && (
                <Box marginTop={0} justifyContent="flex-end">
                  <Text dimColor>
                    {Math.round((logScrollOffset / maxLogOff) * 100)}%
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </PanelFrame>

      </Box>
    </ToolScreenFrame>
  );
};
