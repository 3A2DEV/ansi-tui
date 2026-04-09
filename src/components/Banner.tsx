import React from 'react';
import { Box, Text } from 'ink';
import { useThemePalette } from './theme.js';
import type { ThemePalette } from './theme.js';

const LOGO_LINES = [
  ' █████╗ ███╗   ██╗███████╗██╗   ████████╗██╗   ██╗██╗',
  '██╔══██╗████╗  ██║██╔════╝██║   ╚══██╔══╝██║   ██║██║',
  '███████║██╔██╗ ██║███████╗██║█████╗██║   ██║   ██║██║',
  '██╔══██║██║╚██╗██║╚════██║██║╚════╝██║   ██║   ██║██║',
  '██║  ██║██║ ╚████║███████║██║      ██║   ╚██████╔╝██║',
  '╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝      ╚═╝    ╚═════╝ ╚═╝',
];

// Vertical gradient — top lines brightest, bottom fades to border/dim.
// Maps each logo line index to a ThemePalette color key.
type GradientKey = 'primary' | 'accent2' | 'border' | 'dimBorder';
const GRADIENT_KEYS: readonly GradientKey[] = [
  'primary', 'primary', 'accent2', 'accent2', 'border', 'dimBorder',
];

const lineColor = (theme: ThemePalette, index: number): string =>
  theme[GRADIENT_KEYS[index] ?? 'primary'];

export const Banner: React.FC = () => {
  const theme = useThemePalette();

  return (
    <Box
      flexDirection="column"
      width={64}
      height={8}
      marginRight={2}
      justifyContent="space-between"
    >
      {LOGO_LINES.map((line, index) => {
        return (
          <Text key={index} color={lineColor(theme, index)} bold>
            {line}
          </Text>
        );
      })}

      {/* Subtitle: ◈ Ansible Terminal User Interface */}
      <Box width={64}>
        <Box>
          <Text color={theme.accent2}>{'◈ '}</Text>
          <Text dimColor>Ansible Terminal User Interface</Text>
        </Box>
      </Box>
    </Box>
  );
};
