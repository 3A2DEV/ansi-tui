import React from 'react';
import { Box, Text } from 'ink';
import { useThemePalette } from './theme.js';
import type { ThemeName } from './theme.js';

const KEYBINDINGS = [
  ['q', 'Quit'],
  ['s', 'Sessions'],
  ['t', 'Theme'],
] as const;

const SCREEN_LABELS: Record<string, string> = {
  home: 'dashboard',
  sessions: 'sessions',
};

const getScreenLabel = (activeScreen: string): string =>
  SCREEN_LABELS[activeScreen] ?? activeScreen;

interface FooterProps {
  readonly themeName: ThemeName;
  readonly activeScreen: string;
}

export const Footer: React.FC<FooterProps> = ({ themeName, activeScreen }) => {
  const theme = useThemePalette();

  return (
    <Box borderStyle="round" borderColor={theme.dimBorder} paddingX={1} justifyContent="space-between" width="100%">
      <Box gap={3}>
        {KEYBINDINGS.map(([key, label]) => (
          <Box key={key}>
            <Text backgroundColor={theme.highlight} color={theme.highlightText} bold>{` ${key} `}</Text>
            <Text dimColor>{` ${label}`}</Text>
          </Box>
        ))}
      </Box>
      <Box gap={2}>
        <Text dimColor>{`theme ${themeName}`}</Text>
        <Text dimColor>{'[ '}</Text>
        <Text color={theme.primary} bold>{getScreenLabel(activeScreen)}</Text>
        <Text dimColor>{' ]'}</Text>
      </Box>
    </Box>
  );
};
