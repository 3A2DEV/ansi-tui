import React from 'react';
import { Box, Text } from 'ink';
import { PanelFrame, PanelWidthContext } from './PanelFrame.js';
import type { PanelAccent } from './PanelFrame.js';

interface ToolScreenFrameProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly accent?: PanelAccent;
  readonly hints?: readonly string[];
  readonly status?: string;
  readonly width?: number;
  readonly children: React.ReactNode;
}

export const ToolScreenFrame: React.FC<ToolScreenFrameProps> = ({
  title,
  subtitle,
  accent = 'cyan',
  hints,
  status,
  width,
  children,
}) => {
  const computedWidth = width ?? Math.max(48, (process.stdout.columns ?? 120) - 34);
  // Child panels must fit inside the parent frame's left/right borders and padding.
  const innerPanelWidth = Math.max(32, computedWidth - 4);

  return (
    <PanelFrame title={title} accent={accent} width={computedWidth}>
      <PanelWidthContext.Provider value={innerPanelWidth}>
        <Box flexDirection="column" flexGrow={1}>
          {subtitle && (
            <Box marginBottom={1}>
              <Text dimColor>{subtitle}</Text>
            </Box>
          )}
          {children}
          {hints && hints.length > 0 && (
            <Box marginTop={1} justifyContent="space-between">
              <Text dimColor>{hints.join('   ')}</Text>
              {status ? <Text dimColor>{status}</Text> : <Text dimColor />}
            </Box>
          )}
        </Box>
      </PanelWidthContext.Provider>
    </PanelFrame>
  );
};
