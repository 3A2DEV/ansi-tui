import React from 'react';
import { Box, Text, useInput } from 'ink';
import { PanelFrame } from './PanelFrame.js';
import { useThemePalette } from './theme.js';

interface CommandPreviewProps {
  command: string[];
  onRun: () => void;
  onCopy: () => void;
  onBack: () => void;
  isActive?: boolean;
}

export const CommandPreview: React.FC<CommandPreviewProps> = ({
  command,
  onRun,
  onCopy,
  onBack,
  isActive = true,
}) => {
  const theme = useThemePalette();

  useInput((input, key) => {
    if (!isActive) return;
    if (key.return) {
      onRun();
    }
    if (input === 'c') {
      onCopy();
    }
    if (key.escape) {
      onBack();
    }
  });

  const displayCommand = command.map((part, i) => {
    if (i === 0) return <Text key={i} bold color={theme.primary}>{part}</Text>;
    if (part.startsWith('-')) return <Text key={i} color={theme.warning}> {part}</Text>;
    return <Text key={i} color={theme.secondary}> {part}</Text>;
  });

  return (
    <PanelFrame title="Command Preview" accent="yellow">
      <Box flexDirection="column">
        <Box flexWrap="wrap">
          {displayCommand}
        </Box>
        <Box marginTop={1} gap={2}>
          <Box>
            <Text backgroundColor={theme.success} color={theme.highlightText} bold>{' ↵ '}</Text>
            <Text dimColor> run</Text>
          </Box>
          <Box>
            <Text backgroundColor={theme.warning} color={theme.highlightText} bold>{' c '}</Text>
            <Text dimColor> copy</Text>
          </Box>
          <Box>
            <Text backgroundColor={theme.error} color={theme.highlightText} bold>{' Esc '}</Text>
            <Text dimColor> back</Text>
          </Box>
        </Box>
      </Box>
    </PanelFrame>
  );
};
