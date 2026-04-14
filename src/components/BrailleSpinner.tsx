import React from 'react';
import { Text } from 'ink';
import { useAnimation } from '../hooks/useAnimation.js';

const BRAILLE_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface BrailleSpinnerProps {
  color?: string;
}

export const BrailleSpinner: React.FC<BrailleSpinnerProps> = React.memo(({ color }) => {
  const frame = useAnimation(BRAILLE_FRAMES, 80);
  return <Text color={color}>{frame}</Text>;
});
