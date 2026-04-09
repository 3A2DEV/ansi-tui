import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PanelFrame } from './PanelFrame.js';
import { useThemePalette } from './theme.js';

interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FilePickerProps {
  startPath: string;
  extensions?: string[];
  onSelect: (path: string) => void;
  onCancel: () => void;
  allowDir?: boolean;
  title?: string;
}

const DIR_ICON  = '⊞';  // directory — grid/collection
const FILE_ICON = '≡';  // file — document lines

export const FilePicker: React.FC<FilePickerProps> = ({
  startPath,
  extensions,
  onSelect,
  onCancel,
  allowDir = false,
  title,
}) => {
  const theme = useThemePalette();
  const [currentPath, setCurrentPath] = useState(resolve(startPath));
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);

  const loadDir = useCallback(async (dirPath: string) => {
    try {
      const names = await readdir(dirPath);
      const fileEntries: FileEntry[] = [];

      for (const name of names) {
        if (name.startsWith('.')) continue;
        const fullPath = join(dirPath, name);
        try {
          const s = await stat(fullPath);
          const isDir = s.isDirectory();

          if (!isDir && extensions && extensions.length > 0) {
            const hasMatch = extensions.some((ext) => name.endsWith(ext));
            if (!hasMatch) continue;
          }

          fileEntries.push({ name, isDirectory: isDir, path: fullPath });
        } catch {
          // skip inaccessible entries
        }
      }

      fileEntries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      setEntries(fileEntries);
      setFocusIndex(0);
    } catch {
      setEntries([]);
    }
  }, [extensions]);

  useEffect(() => {
    void loadDir(currentPath);
  }, [currentPath, loadDir]);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onCancel();
    }
    if (key.upArrow) {
      setFocusIndex((prev) => (prev > 0 ? prev - 1 : entries.length - 1));
    }
    if (key.downArrow) {
      setFocusIndex((prev) => (prev < entries.length - 1 ? prev + 1 : 0));
    }
    if (key.return) {
      const entry = entries[focusIndex];
      if (!entry) return;
      if (entry.isDirectory) {
        if (allowDir) {
          onSelect(entry.path);
        } else {
          setCurrentPath(entry.path);
        }
      } else {
        onSelect(entry.path);
      }
    }
    if ((key.rightArrow || input === 'l') && allowDir) {
      const entry = entries[focusIndex];
      if (entry?.isDirectory) {
        setCurrentPath(entry.path);
      }
    }
    if (key.leftArrow || input === 'b') {
      const parent = resolve(currentPath, '..');
      if (parent !== currentPath) {
        setCurrentPath(parent);
      }
    }
  });

  return (
    <PanelFrame title={title ?? 'Select File'} accent="cyan" width={70}>
      <Box flexDirection="column">

        {/* ── Current path breadcrumb ───────────────────────── */}
        <Box marginBottom={1}>
          <Text dimColor>{currentPath}</Text>
        </Box>

        {/* ── File/dir listing ─────────────────────────────── */}
        <Box flexDirection="column" height={15} overflow="hidden">
          {entries.map((entry, i) => {
            const isFocused = i === focusIndex;
            const icon      = entry.isDirectory ? DIR_ICON : FILE_ICON;
            const iconColor = entry.isDirectory ? theme.accent2 : theme.muted;

            return (
              <Box key={entry.path}>
                <Text color={theme.primary} bold>{isFocused ? '▸ ' : '  '}</Text>
                <Text color={iconColor}>{icon}</Text>
                <Text>{' '}</Text>
                <Text
                  color={isFocused ? theme.primary : (entry.isDirectory ? theme.accent2 : undefined)}
                  bold={isFocused}
                >
                  {entry.name}
                </Text>
              </Box>
            );
          })}
          {entries.length === 0 && (
            <Box paddingX={1}>
              <Text dimColor>(empty directory)</Text>
            </Box>
          )}
        </Box>

        {/* ── Keybinding hints ─────────────────────────────── */}
        <Box marginTop={1} gap={2}>
          <Box>
            <Text backgroundColor={theme.success} color={theme.highlightText} bold>{' ↵ '}</Text>
            <Text dimColor> select</Text>
          </Box>
          {allowDir && (
            <Box>
              <Text backgroundColor={theme.accent2} color={theme.highlightText} bold>{' →/l '}</Text>
              <Text dimColor> enter dir</Text>
            </Box>
          )}
          <Box>
            <Text backgroundColor={theme.secondary} color={theme.highlightText} bold>{' ←/b '}</Text>
            <Text dimColor> parent</Text>
          </Box>
          <Box>
            <Text backgroundColor={theme.error} color={theme.highlightText} bold>{' Esc '}</Text>
            <Text dimColor> cancel</Text>
          </Box>
        </Box>
      </Box>
    </PanelFrame>
  );
};
