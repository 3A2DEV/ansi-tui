import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { SessionsScreen } from '../../src/screens/SessionsScreen.js';
import type { Session } from '../../src/models/session.js';

vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return { ...actual, useInput: vi.fn() };
});

vi.mock('ink-text-input', () => ({
  default: vi.fn(() => null),
}));

const sessionFixture = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  name: 'prod-eu-west',
  createdAt: '2026-04-07T12:00:00.000Z',
  lastUsed: '2026-04-07T12:00:00.000Z',
  workingDir: '/tmp/project',
  inventory: 'hosts.yml',
  vaultPasswordFile: null,
  vaultId: 'prod',
  extraVars: {},
  envVars: {},
  ansibleCfg: null,
  tags: ['deploy'],
  notes: 'primary session',
  ...overrides,
});

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

describe('SessionsScreen', () => {
  it('renders saved sessions in list mode', () => {
    const session = sessionFixture();
    const { lastFrame } = render(
      React.createElement(SessionsScreen, {
        sessions: [session],
        activeSession: session,
        onSelect: vi.fn(),
        onCreate: vi.fn(),
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
        onBack: vi.fn(),
      })
    );

    const output = lastFrame() ?? '';
    expect(output).toContain('Saved Sessions');
    expect(output).toContain('prod-eu-west');
    expect(output).toContain('Create new session');
  });

  it('enters edit mode for the selected session on e', async () => {
    const { useInput } = await import('ink');
    const session = sessionFixture();
    const { lastFrame } = render(
      React.createElement(SessionsScreen, {
        sessions: [session],
        activeSession: session,
        onSelect: vi.fn(),
        onCreate: vi.fn(),
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
        onBack: vi.fn(),
      })
    );

    fireKey(vi.mocked(useInput), 'e');

    expect(lastFrame()).toContain('Edit workspace');
  });

  it('opens delete confirmation and removes the selected session on Enter', async () => {
    const { useInput } = await import('ink');
    const session = sessionFixture();
    const onRemove = vi.fn().mockResolvedValue(undefined);
    const { lastFrame } = render(
      React.createElement(SessionsScreen, {
        sessions: [session],
        activeSession: session,
        onSelect: vi.fn(),
        onCreate: vi.fn(),
        onUpdate: vi.fn(),
        onRemove,
        onBack: vi.fn(),
      })
    );

    fireKey(vi.mocked(useInput), 'd');
    expect(lastFrame()).toContain('Confirm Delete');

    fireKey(vi.mocked(useInput), '', { return: true });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onRemove).toHaveBeenCalledWith('session-1');
  });

  it('returns to main navigation on Esc from list mode', async () => {
    const { useInput } = await import('ink');
    const session = sessionFixture();
    const onBack = vi.fn();

    render(
      React.createElement(SessionsScreen, {
        sessions: [session],
        activeSession: session,
        onSelect: vi.fn(),
        onCreate: vi.fn(),
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
        onBack,
      })
    );

    fireKey(vi.mocked(useInput), '', { escape: true });

    expect(onBack).toHaveBeenCalledOnce();
  });
});
