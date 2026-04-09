import React from 'react';
import { Box, Text } from 'ink';
import type { ToolInfo } from '../models/tool.js';

interface ToolStatusBadgeProps {
  tool: ToolInfo;
}

export const ToolStatusBadge: React.FC<ToolStatusBadgeProps> = ({ tool }) => {
  if (!tool.available) {
    return (
      <Box justifyContent="space-between">
        <Text>
          <Text color="gray">○</Text>
          <Text dimColor> {tool.name}</Text>
        </Text>
        <Text dimColor>not installed</Text>
      </Box>
    );
  }

  return (
    <Box justifyContent="space-between">
      <Text>
        <Text color="green">●</Text>
        <Text> {tool.name}</Text>
      </Text>
      <Text dimColor>{tool.version ?? 'installed'}</Text>
    </Box>
  );
};
