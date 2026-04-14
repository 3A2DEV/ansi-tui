import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import stripAnsi from 'strip-ansi';
import { PanelFrame } from './PanelFrame.js';
import { BrailleSpinner } from './BrailleSpinner.js';

const ARROW_UP = '\u25B2';
const ARROW_DOWN = '\u25BC';
const ESC = '\u001B';

interface AnsiStyle {
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  dimColor?: boolean;
}

interface AnsiSegment {
  text: string;
  style: AnsiStyle;
}

const ANSI_PATTERN = new RegExp(`${ESC}\\[([0-9;]*)m`, 'g');
const ANSI_SEGMENT_CACHE_LIMIT = 1000;
const ANSI_SEGMENT_CACHE = new Map<string, AnsiSegment[]>();

const ANSI_COLORS: Record<number, string> = {
  30: 'black',
  31: 'red',
  32: 'green',
  33: 'yellow',
  34: 'blue',
  35: 'magenta',
  36: 'cyan',
  37: 'white',
  90: 'gray',
  91: 'redBright',
  92: 'greenBright',
  93: 'yellowBright',
  94: 'blueBright',
  95: 'magentaBright',
  96: 'cyanBright',
  97: 'whiteBright',
};

const ANSI_BACKGROUNDS: Record<number, string> = {
  40: 'black',
  41: 'red',
  42: 'green',
  43: 'yellow',
  44: 'blue',
  45: 'magenta',
  46: 'cyan',
  47: 'white',
  100: 'gray',
  101: 'redBright',
  102: 'greenBright',
  103: 'yellowBright',
  104: 'blueBright',
  105: 'magentaBright',
  106: 'cyanBright',
  107: 'whiteBright',
};

const resetAnsiStyle = (): AnsiStyle => ({});

const parseExtendedColor = (parts: string[], index: number): { color?: string; consumed: number } => {
  if (parts[index + 1] === '5' && parts[index + 2] !== undefined) {
    return { color: Number(parts[index + 2]).toString(), consumed: 2 };
  }
  if (
    parts[index + 1] === '2' &&
    parts[index + 2] !== undefined &&
    parts[index + 3] !== undefined &&
    parts[index + 4] !== undefined
  ) {
    return {
      color: `rgb(${parts[index + 2]},${parts[index + 3]},${parts[index + 4]})`,
      consumed: 4,
    };
  }
  return { consumed: 0 };
};

const applyAnsiCodes = (style: AnsiStyle, codes: string): AnsiStyle => {
  const next = { ...style };
  const parts = codes.length > 0 ? codes.split(';') : ['0'];

  for (let i = 0; i < parts.length; i += 1) {
    const code = Number(parts[i] ?? '0');

    if (code === 0) {
      Object.assign(next, resetAnsiStyle());
      continue;
    }
    if (code === 1) {
      next.bold = true;
      continue;
    }
    if (code === 2) {
      next.dimColor = true;
      continue;
    }
    if (code === 3) {
      next.italic = true;
      continue;
    }
    if (code === 4) {
      next.underline = true;
      continue;
    }
    if (code === 22) {
      delete next.bold;
      delete next.dimColor;
      continue;
    }
    if (code === 23) {
      delete next.italic;
      continue;
    }
    if (code === 24) {
      delete next.underline;
      continue;
    }
    if (code === 39) {
      delete next.color;
      continue;
    }
    if (code === 49) {
      delete next.backgroundColor;
      continue;
    }
    if (code === 38 || code === 48) {
      const extended = parseExtendedColor(parts, i);
      if (extended.color) {
        if (code === 38) next.color = extended.color;
        else next.backgroundColor = extended.color;
      }
      i += extended.consumed;
      continue;
    }
    if (ANSI_COLORS[code]) {
      next.color = ANSI_COLORS[code];
      continue;
    }
    if (ANSI_BACKGROUNDS[code]) {
      next.backgroundColor = ANSI_BACKGROUNDS[code];
    }
  }

  return next;
};

const parseAnsiLine = (line: string): AnsiSegment[] => {
  const segments: AnsiSegment[] = [];
  let style = resetAnsiStyle();
  let lastIndex = 0;

  line.replace(ANSI_PATTERN, (match, codes: string, offset: number) => {
    if (offset > lastIndex) {
      segments.push({ text: line.slice(lastIndex, offset), style: { ...style } });
    }
    style = applyAnsiCodes(style, codes);
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex), style: { ...style } });
  }

  return segments;
};

const getAnsiSegments = (line: string): AnsiSegment[] => {
  const cached = ANSI_SEGMENT_CACHE.get(line);
  if (cached) {
    return cached;
  }

  const parsed = parseAnsiLine(line);
  ANSI_SEGMENT_CACHE.set(line, parsed);

  if (ANSI_SEGMENT_CACHE.size > ANSI_SEGMENT_CACHE_LIMIT) {
    const oldestKey = ANSI_SEGMENT_CACHE.keys().next().value;
    if (typeof oldestKey === 'string') {
      ANSI_SEGMENT_CACHE.delete(oldestKey);
    }
  }

  return parsed;
};

const renderAnsiLine = (line: string): React.ReactNode => {
  const segments = getAnsiSegments(line);

  if (segments.length === 0) {
    return ' ';
  }

  return segments.map((segment, index) => (
    <Text
      key={index}
      color={segment.style.color}
      backgroundColor={segment.style.backgroundColor}
      bold={segment.style.bold}
      italic={segment.style.italic}
      underline={segment.style.underline}
      dimColor={segment.style.dimColor}
    >
      {segment.text.length > 0 ? segment.text : ' '}
    </Text>
  ));
};

const formatElapsed = (secs: number): string => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

interface RunningStatusProps {
  readonly isRunning: boolean;
  readonly lineCount: number;
}

const RunningStatus: React.FC<RunningStatusProps> = React.memo(({ isRunning, lineCount }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setElapsed(0);
      return;
    }

    setElapsed(0);
    const t = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(t);
  }, [isRunning]);

  if (!isRunning) {
    return null;
  }

  return (
    <Box gap={1}>
      <BrailleSpinner color="cyan" />
      <Text dimColor>running</Text>
      <Text dimColor>·</Text>
      <Text dimColor>{formatElapsed(elapsed)}</Text>
      <Text dimColor>·</Text>
      <Text dimColor>{lineCount} lines</Text>
      <Text dimColor>·</Text>
      <Text dimColor>space to pause</Text>
    </Box>
  );
});

interface LiveOutputProps {
  lines: string[];
  isRunning: boolean;
  exitCode: number | null;
  durationMs: number | null;
  onSave: () => void;
  maxHeight?: number;
  isActive?: boolean;
  autoScroll?: boolean;
  wrapMode?: 'truncate' | 'wrap';
  plainText?: boolean;
}

export const LiveOutput: React.FC<LiveOutputProps> = ({
  lines,
  isRunning,
  exitCode,
  durationMs,
  onSave,
  maxHeight = 20,
  isActive = true,
  autoScroll = true,
  wrapMode = 'truncate',
  plainText = false,
}) => {
  const terminalRows = process.stdout.rows ?? 40;
  const [paused, setPaused] = React.useState(false);
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const userScrolled = useRef(false);
  const effectiveMaxHeight = Math.max(maxHeight, terminalRows - 20);

  const maxOffset = Math.max(0, lines.length - effectiveMaxHeight);

  const scrollToBottom = useCallback(() => {
    setScrollOffset(maxOffset);
    userScrolled.current = false;
  }, [maxOffset]);

  const scrollUp = useCallback(() => {
    userScrolled.current = true;
    setPaused(true);
    setScrollOffset((prev) => Math.max(0, prev - 5));
  }, []);

  const scrollDown = useCallback(() => {
    setScrollOffset((prev) => {
      const next = prev + 5;
      if (next >= maxOffset) {
        userScrolled.current = false;
        setPaused(false);
        return maxOffset;
      }
      return next;
    });
  }, [maxOffset]);

  useInput((input, key) => {
    if (!isActive) return;
    if (input === ' ') {
      setPaused((prev) => !prev);
    }
    if (input === 's') {
      onSave();
    }
    if (key.upArrow) {
      scrollUp();
    }
    if (key.downArrow) {
      scrollDown();
    }
    if (key.return) {
      scrollToBottom();
      setPaused(false);
    }
  });

  useEffect(() => {
    if (autoScroll && !paused && !userScrolled.current) {
      setScrollOffset(Math.max(0, lines.length - effectiveMaxHeight));
    }
  }, [lines.length, paused, effectiveMaxHeight, autoScroll]);

  const showScrollIndicator = paused || userScrolled.current || !autoScroll;
  const visibleLines = useMemo(
    () => lines.slice(scrollOffset, scrollOffset + effectiveMaxHeight),
    [lines, scrollOffset, effectiveMaxHeight],
  );
  const renderedVisibleLines = useMemo(
    () => visibleLines.map((line, index) => {
      if (plainText) {
        const cleaned = stripAnsi(line);
        return { key: scrollOffset + index, content: cleaned.length > 0 ? cleaned : ' ' };
      }

      return { key: scrollOffset + index, content: renderAnsiLine(line) };
    }),
    [visibleLines, plainText, scrollOffset],
  );
  const hasMoreAbove = showScrollIndicator && scrollOffset > 0;
  const hasMoreBelow = showScrollIndicator && scrollOffset + effectiveMaxHeight < lines.length;

  return (
    <PanelFrame title="Live Output" accent={exitCode === null ? 'cyan' : exitCode === 0 ? 'green' : 'red'}>
      <Box flexDirection="column">
        {/* ── 7.4: Running status bar ─────────────────────────── */}
        <Box justifyContent="space-between">
          {isRunning ? (
            <RunningStatus isRunning={isRunning} lineCount={lines.length} />
          ) : (
            <Text dimColor>
              {paused ? '[PAUSED] ' : ''}
              {`${lines.length} lines`}
              {hasMoreAbove ? ` (+${scrollOffset} above)` : ''}
              {hasMoreBelow ? ` (+${lines.length - scrollOffset - effectiveMaxHeight} below)` : ''}
            </Text>
          )}
        </Box>

        <Box flexDirection="column" height={effectiveMaxHeight} overflow="hidden">
          {isRunning && lines.length === 0 && (
            <Text dimColor>waiting for output...</Text>
          )}
          {hasMoreAbove && (
            <Text dimColor>{`  ${ARROW_UP} ${scrollOffset} more lines above`}</Text>
          )}
          {renderedVisibleLines.map((line) => (
            <Text key={line.key} wrap={wrapMode === 'wrap' ? undefined : 'truncate'}>
              {line.content}
            </Text>
          ))}
          {lines.length === 0 && !isRunning && (
            <Text dimColor>  No output</Text>
          )}
          {hasMoreBelow && (
            <Text dimColor>{`  ${ARROW_DOWN} ${lines.length - scrollOffset - effectiveMaxHeight} more lines below`}</Text>
          )}
        </Box>

        {exitCode !== null && (
          <Box marginTop={1} justifyContent="space-between">
            <Text color={exitCode === 0 ? 'green' : 'red'} bold>
              Exit code: {exitCode}
            </Text>
            {durationMs !== null && (
              <Text dimColor>
                {durationMs}ms
              </Text>
            )}
          </Box>
        )}

        <Box marginTop={1} gap={2}>
          <Text dimColor>
            <Text bold>Space</Text> {paused ? 'resume' : 'pause'}
          </Text>
          <Text dimColor>
            <Text bold>{`${ARROW_UP}${ARROW_DOWN}`}</Text> scroll
          </Text>
          <Text dimColor>
            <Text bold>Enter</Text> bottom
          </Text>
          <Text dimColor>
            <Text bold>s</Text> save
          </Text>
        </Box>
      </Box>
    </PanelFrame>
  );
};
