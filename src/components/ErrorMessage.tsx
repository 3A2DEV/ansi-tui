import React from 'react';
import { Box, Text } from 'ink';
import { PanelFrame } from './PanelFrame.js';

interface ErrorMessageProps {
  title: string;
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ title, message }) => {
  return (
    <PanelFrame title={`✗ ${title}`} accent="red">
      <Box>
        <Text dimColor>{message}</Text>
      </Box>
    </PanelFrame>
  );
};
