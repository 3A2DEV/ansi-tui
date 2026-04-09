import React from 'react';
import { Box, Text } from 'ink';
import { useThemePalette } from './theme.js';

interface SessionBadgeProps {
  name: string;
}

export const SessionBadge: React.FC<SessionBadgeProps> = ({ name }) => {
  const theme = useThemePalette();

  return (
    <Box>
      <Text backgroundColor={theme.highlight} color={theme.highlightText} bold>
        {' '}
        ● {name}
        {' '}
      </Text>
    </Box>
  );
};
