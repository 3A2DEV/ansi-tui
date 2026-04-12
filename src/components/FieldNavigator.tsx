import React from 'react';
import { useInput } from 'ink';

interface FieldNavigatorProps {
  readonly count: number;
  readonly setFocusIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly onEnter: () => void;
  readonly isActive?: boolean;
}

export const FieldNavigator: React.FC<FieldNavigatorProps> = ({
  count,
  setFocusIndex,
  onEnter,
  isActive = true,
}) => {
  useInput((_input, key) => {
    if (!isActive || count <= 0) {
      return;
    }

    const pageStep = Math.max(1, Math.min(5, count - 1));

    if (key.tab || key.downArrow) {
      setFocusIndex((prev) => (prev + 1) % count);
    }

    if (key.shift && key.tab) {
      setFocusIndex((prev) => (prev - 1 + count) % count);
    }

    if (`pageDown` in key && key.pageDown) {
      setFocusIndex((prev) => Math.min(count - 1, prev + pageStep));
    }

    if (`pageUp` in key && key.pageUp) {
      setFocusIndex((prev) => Math.max(0, prev - pageStep));
    }

    if (key.upArrow) {
      setFocusIndex((prev) => (prev - 1 + count) % count);
    }

    if (key.return) {
      onEnter();
    }
  });

  return null;
};
