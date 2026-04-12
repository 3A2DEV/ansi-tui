import React from 'react';
import { Box, Text } from 'ink';
import { useThemePalette } from './theme.js';

export type PanelAccent = 'yellow' | 'cyan' | 'magenta' | 'green' | 'red';

interface PanelFrameProps {
  readonly title: string;
  readonly accent: PanelAccent;
  readonly width?: number;
  readonly children: React.ReactNode;
}

export const PanelWidthContext = React.createContext<number | null>(null);

const getEffectiveWidth = (width: number | undefined, inheritedWidth: number | null): number => {
  if (typeof width === 'number') return width;
  if (typeof inheritedWidth === 'number') return inheritedWidth;
  return Math.max(32, (process.stdout.columns ?? 120) - 40);
};

// 4.1 — fill uses theme.panelFill char instead of a fixed '─'
const buildTitleFill = (title: string, width: number, fillChar: string): string => {
  const fillLength = Math.max(4, width - title.length - 5);
  return fillChar.repeat(fillLength);
};

export const PanelFrame: React.FC<PanelFrameProps> = ({
  title,
  accent,
  width,
  children,
}) => {
  const inheritedWidth = React.useContext(PanelWidthContext);
  const effectiveWidth = getEffectiveWidth(width, inheritedWidth);
  const theme = useThemePalette();

  const accentColor =
    accent === 'red'     ? theme.error    :
    accent === 'green'   ? theme.success  :
    accent === 'yellow'  ? theme.warning  :
    accent === 'magenta' ? theme.secondary :
    theme.primary; // cyan / default

  const titleFill = buildTitleFill(title, effectiveWidth, theme.panelFill);

  return (
    <Box flexDirection="column" width={effectiveWidth} marginBottom={1}>
      {/* ── Panel header ──────────────────────────────────────── */}
      <Box width={effectiveWidth}>
        <Text color={theme.dimBorder}>{'╭─ '}</Text>
        <Text color={accentColor}>{title}</Text>
        <Text dimColor>{` ${titleFill}`}</Text>
        <Text color={theme.dimBorder}>{'╮'}</Text>
      </Box>

      {/* ── Panel body — border now takes the accent color (4.2) ── */}
      <Box
        flexDirection="column"
        width={effectiveWidth}
        flexGrow={1}
        borderStyle="round"
        borderColor={accentColor}
        borderTop={false}
        paddingX={1}
        paddingY={0}
      >
        {children}
      </Box>
    </Box>
  );
};
