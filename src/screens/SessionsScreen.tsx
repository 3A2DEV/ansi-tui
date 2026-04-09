import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { PanelFrame } from '../components/PanelFrame.js';
import { SessionBadge } from '../components/SessionBadge.js';
import { ToolScreenFrame } from '../components/ToolScreenFrame.js';
import { useThemePalette } from '../components/theme.js';
import type { Session } from '../models/session.js';
import type { InputMode } from '../App.js';

interface SessionsScreenProps {
  sessions: Session[];
  activeSession: Session | null;
  onSelect: (id: string) => void;
  onCreate: (name: string, workingDir: string) => Promise<Session>;
  onUpdate: (session: Session) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onBack: () => void;
  onInputModeChange?: (mode: InputMode) => void;
}

type Mode = 'list' | 'create-name' | 'create-dir' | 'edit-name' | 'edit-dir' | 'confirm-delete';

type SessionListItem =
  | { kind: 'session'; id: string }
  | { kind: 'create'; id: '__create__' }
  | { kind: 'back'; id: '__back__' };

export const SessionsScreen: React.FC<SessionsScreenProps> = ({
  sessions,
  activeSession,
  onSelect,
  onCreate,
  onUpdate,
  onRemove,
  onBack,
  onInputModeChange,
}) => {
  const theme = useThemePalette();
  const terminalColumns = process.stdout.columns ?? 120;
  const frameWidth = Math.max(48, terminalColumns - 34);
  // ToolScreenFrame adds a bordered panel shell around content, so child cards
  // must fit inside the inner content width rather than raw terminal width.
  const availableWidth = Math.max(44, frameWidth - 4);
  const [mode, setMode] = useState<Mode>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draftSessionId, setDraftSessionId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDir, setNewDir] = useState(process.cwd());

  const items: SessionListItem[] = [
    ...sessions.map((session) => ({ kind: 'session', id: session.id } as const)),
    { kind: 'create', id: '__create__' },
    { kind: 'back', id: '__back__' },
  ];

  const selectedItem = items[selectedIndex] ?? items[0] ?? { kind: 'create', id: '__create__' as const };
  const selectedSession = selectedItem.kind === 'session'
    ? sessions.find((session) => session.id === selectedItem.id) ?? null
    : null;

  useEffect(() => {
    onInputModeChange?.(mode === 'list' ? 'navigate' : 'form');
  }, [mode, onInputModeChange]);

  useEffect(() => {
    setSelectedIndex((prev) => Math.max(0, Math.min(prev, items.length - 1)));
  }, [items.length]);

  useInput((_input, key) => {
    if (mode === 'list') {
      if (key.escape) {
        onBack();
        return;
      }
      if (key.upArrow) {
        setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
        return;
      }
      if (key.return) {
        if (selectedItem.kind === 'session') {
          onSelect(selectedItem.id);
        } else if (selectedItem.kind === 'create') {
          setNewName('');
          setNewDir(process.cwd());
          setMode('create-name');
        } else {
          onBack();
        }
        return;
      }
      return;
    }

    if (key.escape) {
      setMode('list');
    }
  });

  const handleCreate = useCallback(async () => {
    if (newName.trim()) {
      await onCreate(newName.trim(), newDir.trim());
      setNewName('');
      setNewDir(process.cwd());
      setMode('list');
    }
  }, [newName, newDir, onCreate]);

  const startEdit = useCallback((session: Session) => {
    setDraftSessionId(session.id);
    setNewName(session.name);
    setNewDir(session.workingDir);
    setMode('edit-name');
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!draftSessionId || !newName.trim()) return;
    const existingSession = sessions.find((session) => session.id === draftSessionId);
    if (!existingSession) return;

    await onUpdate({
      ...existingSession,
      name: newName.trim(),
      workingDir: newDir.trim(),
    });

    setDraftSessionId(null);
    setMode('list');
  }, [draftSessionId, newDir, newName, onUpdate, sessions]);

  const handleDelete = useCallback(async () => {
    if (!draftSessionId) return;
    await onRemove(draftSessionId);
    setDraftSessionId(null);
    setMode('list');
  }, [draftSessionId, onRemove]);

  useInput((input, key) => {
    if (mode !== 'list') return;

    if (input === 'n' && !key.ctrl) {
      setNewName('');
      setNewDir(process.cwd());
      setMode('create-name');
      return;
    }

    if (input === 'e' && !key.ctrl && selectedSession) {
      startEdit(selectedSession);
      return;
    }

    if (input === 'd' && !key.ctrl && selectedSession) {
      setDraftSessionId(selectedSession.id);
      setMode('confirm-delete');
    }
  });

  if (mode === 'create-name') {
    return (
      <ToolScreenFrame title="Sessions" subtitle="Create workspace" hints={['Enter next', 'Esc back']} status="step 1/2: name" width={frameWidth}>
        <PanelFrame title="Session Name" accent="cyan" width={availableWidth}>
          <Box flexDirection="column">
            <Text dimColor>Choose a short label for this workspace.</Text>
            <Box marginTop={1} borderStyle="single" borderColor="magenta" paddingX={1}>
              <TextInput
                value={newName}
                onChange={setNewName}
                placeholder="e.g. prod-eu-west"
                focus
              />
            </Box>
          </Box>
        </PanelFrame>
        <SessionKeyHandler onEnter={() => setMode('create-dir')} />
      </ToolScreenFrame>
    );
  }

  if (mode === 'create-dir') {
    return (
      <ToolScreenFrame title="Sessions" subtitle={`Create workspace: ${newName}`} hints={['Enter create', 'Esc back']} status="step 2/2: directory" width={frameWidth}>
        <PanelFrame title="Working Directory" accent="yellow" width={availableWidth}>
          <Box flexDirection="column">
            <Text dimColor>Set the root directory that should prefill this session.</Text>
            <Box marginTop={1} borderStyle="single" borderColor="magenta" paddingX={1}>
              <TextInput
                value={newDir}
                onChange={setNewDir}
                placeholder="/path/to/project"
                focus
              />
            </Box>
          </Box>
        </PanelFrame>
        <SessionKeyHandler onEnter={handleCreate} />
      </ToolScreenFrame>
    );
  }

  if (mode === 'edit-name') {
    return (
      <ToolScreenFrame title="Sessions" subtitle="Edit workspace" hints={['Enter next', 'Esc cancel']} status="step 1/2: name" width={frameWidth}>
        <PanelFrame title="Session Name" accent="cyan" width={availableWidth}>
          <Box flexDirection="column">
            <Text dimColor>Update the workspace label.</Text>
            <Box marginTop={1} borderStyle="single" borderColor="magenta" paddingX={1}>
              <TextInput
                value={newName}
                onChange={setNewName}
                placeholder="e.g. prod-eu-west"
                focus
              />
            </Box>
          </Box>
        </PanelFrame>
        <SessionKeyHandler onEnter={() => setMode('edit-dir')} />
      </ToolScreenFrame>
    );
  }

  if (mode === 'edit-dir') {
    return (
      <ToolScreenFrame title="Sessions" subtitle={`Edit workspace: ${newName}`} hints={['Enter save', 'Esc cancel']} status="step 2/2: directory" width={frameWidth}>
        <PanelFrame title="Working Directory" accent="yellow" width={availableWidth}>
          <Box flexDirection="column">
            <Text dimColor>Update the root directory for this workspace.</Text>
            <Box marginTop={1} borderStyle="single" borderColor="magenta" paddingX={1}>
              <TextInput
                value={newDir}
                onChange={setNewDir}
                placeholder="/path/to/project"
                focus
              />
            </Box>
          </Box>
        </PanelFrame>
        <SessionKeyHandler onEnter={handleUpdate} />
      </ToolScreenFrame>
    );
  }

  if (mode === 'confirm-delete') {
    return (
      <ToolScreenFrame title="Sessions" subtitle="Delete workspace" hints={['Enter delete', 'Esc cancel']} status="confirm removal" width={frameWidth}>
        <PanelFrame title="Confirm Delete" accent="red" width={availableWidth}>
          <Box flexDirection="column">
            <Text color={theme.error} bold>Delete this saved workspace?</Text>
            <Text dimColor>{selectedSession?.name ?? sessions.find((session) => session.id === draftSessionId)?.name ?? 'Unknown session'}</Text>
            <Text dimColor>{selectedSession?.workingDir ?? sessions.find((session) => session.id === draftSessionId)?.workingDir ?? 'Unknown directory'}</Text>
            <Box marginTop={1}>
              <Text dimColor>If this is the active workspace, the active session pointer will be cleared.</Text>
            </Box>
          </Box>
        </PanelFrame>
        <SessionKeyHandler onEnter={handleDelete} />
      </ToolScreenFrame>
    );
  }

  return (
    <ToolScreenFrame title="Sessions" subtitle="Manage saved workspaces" hints={['↑↓ move', 'Enter open', 'n new', 'e edit', 'd delete', 'Esc back']} status={`${sessions.length} saved`} width={frameWidth}>
      <Box flexDirection="column" width={availableWidth}>
        <PanelFrame title="Active Workspace" accent="magenta" width={availableWidth}>
          {activeSession ? (
            <Box flexDirection="column">
              <SessionBadge name={activeSession.name} />
              <Text dimColor>{`⌂ ${activeSession.workingDir}`}</Text>
              <Text dimColor>{`⊞ inventory: ${activeSession.inventory ?? 'not set'}`}</Text>
              <Text dimColor>{`◆ vault: ${activeSession.vaultId ?? 'not set'}`}</Text>
            </Box>
          ) : (
            <Text dimColor>No active workspace selected.</Text>
          )}
        </PanelFrame>

        <PanelFrame title="Saved Sessions" accent="yellow" width={availableWidth}>
          <Box flexDirection="column">
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;

              if (item.kind === 'session') {
                const session = sessions.find((entry) => entry.id === item.id);
                if (!session) return null;

                return (
                  <Box key={item.id} flexDirection="column" paddingX={1} marginBottom={1}>
                    <Text color={isSelected ? theme.primary : undefined} bold={isSelected}>
                      {isSelected ? '▶' : '·'}{' '}
                      <Text color={session.id === activeSession?.id ? theme.secondary : undefined}>
                        {session.id === activeSession?.id ? '◉ ' : '○ '}
                      </Text>
                      {session.name}
                    </Text>
                    <Text dimColor wrap="truncate">{`   ⌂ ${session.workingDir}`}</Text>
                  </Box>
                );
              }

              if (item.kind === 'create') {
                return (
                  <Box key={item.id} paddingX={1} marginBottom={1}>
                    <Text color={isSelected ? theme.primary : undefined} bold={isSelected}>
                      {isSelected ? '▶' : '·'} ＋ Create new session
                    </Text>
                  </Box>
                );
              }

              return (
                <Box key={item.id} paddingX={1}>
                  <Text color={isSelected ? theme.primary : undefined} bold={isSelected}>
                    {isSelected ? '▶' : '·'} ← Back
                  </Text>
                </Box>
              );
            })}
          </Box>
          {sessions.length === 0 && (
            <Box marginTop={1}>
              <Text dimColor>No sessions yet. Create one to get started.</Text>
            </Box>
          )}
        </PanelFrame>

        <PanelFrame title="Workspace Notes" accent="cyan" width={availableWidth}>
          <Box flexDirection="column">
            <Text dimColor>{'◈ Sessions capture working directory, inventory, vault and env defaults.'}</Text>
            <Text dimColor>{'↺ Use them to switch contexts without refilling every screen.'}</Text>
            <Text dimColor>{'✎ Edit with [e] and remove with [d] from the saved list.'}</Text>
          </Box>
        </PanelFrame>
      </Box>
    </ToolScreenFrame>
  );
};

interface SessionKeyHandlerProps {
  onEnter: () => void;
}

const SessionKeyHandler: React.FC<SessionKeyHandlerProps> = ({ onEnter }) => {
  useInput((_input, key) => {
    if (key.return) {
      onEnter();
    }
  });

  return null;
};
