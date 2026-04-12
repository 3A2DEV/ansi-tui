import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useThemePalette } from './theme.js';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  const theme = useThemePalette();

  useInput((input, key) => {
    if (key.return || input === 'y') {
      onConfirm();
    }
    if (key.escape || input === 'n') {
      onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.error}
      paddingX={2}
      paddingY={1}
      width={60}
    >
      <Text bold color={theme.error}>
        {'⚠ '}{title}
      </Text>
      <Box marginTop={1}>
        <Text dimColor>{message}</Text>
      </Box>
      <Box marginTop={1} gap={3}>
        <Box>
          <Text backgroundColor={theme.success} color={theme.highlightText} bold>{' y/↵ '}</Text>
          <Text dimColor> Confirm</Text>
        </Box>
        <Box>
          <Text color={theme.error} dimColor>n/Esc</Text>
          <Text dimColor> Cancel</Text>
        </Box>
      </Box>
    </Box>
  );
};
