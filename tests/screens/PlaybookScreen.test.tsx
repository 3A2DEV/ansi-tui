import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { PlaybookScreen } from '../../src/screens/PlaybookScreen.js';

vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return { ...actual, useInput: vi.fn() };
});

vi.mock('ink-select-input', () => ({
  default: vi.fn(() => null),
}));

vi.mock('ink-text-input', () => ({
  default: vi.fn(() => null),
}));

function pressEsc(useInputMock: unknown) {
  const handlers = (useInputMock as {
    mock: {
      calls: Array<[((input: string, key: object) => void), ...unknown[]]>;
    };
  }).mock.calls.map((call) => call[0]);

  for (const handler of handlers) {
    handler?.('', {
      upArrow: false,
      downArrow: false,
      leftArrow: false,
      rightArrow: false,
      return: false,
      escape: true,
      ctrl: false,
      shift: false,
      tab: false,
      backspace: false,
      delete: false,
      meta: false,
    });
  }
}

describe('PlaybookScreen', () => {
  it('shows action select phase by default (no initialAction)', () => {
    const { lastFrame } = render(
      React.createElement(PlaybookScreen, {
        session: null,
        onBack: vi.fn(),
      })
    );

    expect(lastFrame()).toContain('Select the playbook action');
  });

  it('skips action select and shows form phase when initialAction is provided', () => {
    const { lastFrame } = render(
      React.createElement(PlaybookScreen, {
        session: null,
        initialAction: 'run',
        onBack: vi.fn(),
      })
    );

    const output = lastFrame() ?? '';
    expect(output).not.toContain('Select the playbook action');
    expect(output).toContain('run');
  });

  it('shows check action in form phase when initialAction is check', () => {
    const { lastFrame } = render(
      React.createElement(PlaybookScreen, {
        session: null,
        initialAction: 'check',
        onBack: vi.fn(),
      })
    );

    const output = lastFrame() ?? '';
    expect(output).toContain('check');
    expect(output).not.toContain('Select the playbook action');
  });

  it('returns home on Esc from sub-navigation form flow', async () => {
    const { useInput } = await import('ink');
    const onBack = vi.fn();

    render(
      React.createElement(PlaybookScreen, {
        session: null,
        initialAction: 'run',
        onBack,
      })
    );

    pressEsc(vi.mocked(useInput));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
