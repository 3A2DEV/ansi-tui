import { useState, useEffect } from 'react';

export const useAnimation = (frames: string[], intervalMs: number): string => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % frames.length), intervalMs);
    return () => clearInterval(t);
  }, [frames.length, intervalMs]);
  return frames[index] ?? frames[0] ?? '';
};
