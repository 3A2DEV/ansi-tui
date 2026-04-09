import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { TestScreen } from '../../src/screens/TestScreen.js';
import type { Session } from '../../src/models/session.js';

const runMock = vi.fn(async () => undefined);
const resetMock = vi.fn();
const fieldNavigatorState: { onEnter?: () => void } = {};
const commandPreviewState: { onRun?: () => void } = {};

vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return { ...actual, useInput: vi.fn() };
});

vi.mock('ink-select-input', () => ({
  default: vi.fn(() => null),
}));

vi.mock('ink-text-input', () => ({
  default: vi.fn(({ value }: { value: string }) => value ?? null),
}));

vi.mock('../../src/components/FormViewport.js', () => ({
  FormViewport: ({ values }: { values: Record<string, unknown> }) =>
    React.createElement(Text, null, String(values['collectionPath'] ?? '')),
}));

vi.mock('../../src/components/FieldNavigator.js', () => ({
  FieldNavigator: ({ onEnter }: { onEnter: () => void }) => {
    fieldNavigatorState.onEnter = onEnter;
    return null;
  },
}));

vi.mock('../../src/components/CommandPreview.js', () => ({
  CommandPreview: ({ onRun }: { onRun: () => void }) => {
    commandPreviewState.onRun = onRun;
    return React.createElement(Text, null, 'Command Preview');
  },
}));

vi.mock('../../src/hooks/useExecutor.js', () => ({
  useExecutor: () => ({
    lines: [],
    isRunning: false,
    exitCode: null,
    durationMs: null,
    run: runMock,
    reset: resetMock,
  }),
}));

function fireKey(useInputMock: unknown, input = '', key: Partial<Record<string, boolean>> = {}) {
  const handlers = (useInputMock as {
    mock: { calls: Array<[((input: string, key: object) => void), ...unknown[]]> };
  }).mock.calls.map((call) => call[0]);

  for (const handler of handlers) {
    handler(input, {
      upArrow: false,
      downArrow: false,
      leftArrow: false,
      rightArrow: false,
      return: false,
      escape: false,
      ctrl: false,
      shift: false,
      tab: false,
      backspace: false,
      delete: false,
      meta: false,
      ...key,
    });
  }
}

const sessionFixture = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  name: 'community.general',
  createdAt: '2026-04-08T12:00:00.000Z',
  lastUsed: '2026-04-08T12:00:00.000Z',
  workingDir: '/my/col',
  inventory: null,
  vaultPasswordFile: null,
  vaultId: null,
  extraVars: {},
  envVars: {},
  ansibleCfg: null,
  tags: [],
  notes: '',
  ...overrides,
});

describe('TestScreen', () => {
  beforeEach(() => {
    runMock.mockClear();
    resetMock.mockClear();
    fieldNavigatorState.onEnter = undefined;
    commandPreviewState.onRun = undefined;
  });

  it('shows action select phase by default (no initialAction)', () => {
    const { lastFrame } = render(
      React.createElement(TestScreen, {
        session: null,
        onBack: vi.fn(),
      })
    );

    expect(lastFrame()).toContain('Select the test action');
  });

  it('skips action select and shows form phase when initialAction is provided', () => {
    const { lastFrame } = render(
      React.createElement(TestScreen, {
        session: null,
        initialAction: 'sanity',
        onBack: vi.fn(),
      })
    );

    const output = lastFrame() ?? '';
    expect(output).not.toContain('Select the test action');
    expect(output).toContain('sanity');
  });

  it('pre-fills collectionPath from session workingDir', () => {
    const { lastFrame } = render(
      React.createElement(TestScreen, {
        session: sessionFixture(),
        initialAction: 'sanity',
        onBack: vi.fn(),
      })
    );

    expect(lastFrame()).toContain('/my/col');
  });

  it('pre-fills collectionPath as empty when session is null', () => {
    const { lastFrame } = render(
      React.createElement(TestScreen, {
        session: null,
        initialAction: 'sanity',
        onBack: vi.fn(),
      })
    );

    expect(lastFrame()).toContain('Collection path');
    expect(lastFrame()).not.toContain('/my/col');
  });

  it('does not execute when collectionPath is empty', async () => {
    render(
      React.createElement(TestScreen, {
        session: null,
        initialAction: 'sanity',
        onBack: vi.fn(),
      })
    );

    fieldNavigatorState.onEnter?.();
    commandPreviewState.onRun?.();

    expect(runMock).not.toHaveBeenCalled();
  });

  it('executes using collectionPath as cwd', () => {
    render(
      React.createElement(TestScreen, {
        session: sessionFixture(),
        initialAction: 'sanity',
        onBack: vi.fn(),
      })
    );

    fieldNavigatorState.onEnter?.();
    commandPreviewState.onRun?.();

    expect(runMock).toHaveBeenCalledOnce();
    expect(runMock.mock.calls[0]?.[0]).toMatchObject({
      cwd: '/my/col',
      action: 'sanity',
    });
  });

  it('returns home on Esc from action phase', async () => {
    const { useInput } = await import('ink');
    const onBack = vi.fn();

    render(
      React.createElement(TestScreen, {
        session: null,
        onBack,
      })
    );

    fireKey(vi.mocked(useInput), '', { escape: true });

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('returns home on Esc from sub-navigation form flow (initialAction set)', async () => {
    const { useInput } = await import('ink');
    const onBack = vi.fn();

    render(
      React.createElement(TestScreen, {
        session: sessionFixture(),
        initialAction: 'sanity',
        onBack,
      })
    );

    fireKey(vi.mocked(useInput), '', { escape: true });

    expect(onBack).toHaveBeenCalledOnce();
  });
});
