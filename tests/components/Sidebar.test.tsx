import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Sidebar } from '../../src/components/Sidebar.js';
import type { ToolInfo, AnsibleToolName } from '../../src/models/tool.js';

// Mock useInput to prevent stdin.ref errors in test environment
vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return {
    ...actual,
    useInput: vi.fn(),
  };
});

function createToolMap(available: AnsibleToolName[]): Map<AnsibleToolName, ToolInfo> {
  const allTools: AnsibleToolName[] = [
    'ansible',
    'ansible-playbook',
    'ansible-galaxy',
    'ansible-vault',
    'ansible-doc',
    'ansible-inventory',
    'ansible-config',
    'ansible-lint',
    'ansible-test',
    'ansible-builder',
    'ansible-creator',
    'ansible-console',
    'ansible-pull',
    'ansible-community',
  ];

  const map = new Map<AnsibleToolName, ToolInfo>();
  for (const name of allTools) {
    map.set(name, {
      name,
      binary: available.includes(name) ? `/usr/bin/${name}` : null,
      version: available.includes(name) ? '2.17.0' : null,
      available: available.includes(name),
    });
  }
  return map;
}

describe('Sidebar', () => {
  it('renders sidebar with tool entries', () => {
    const tools = createToolMap(['ansible-playbook', 'ansible-galaxy']);
    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect: vi.fn(),
      })
    );

    const output = lastFrame() ?? '';
    expect(output).toContain('Playbook');
    expect(output).toContain('Galaxy');
    expect(output).toContain('Sessions');
  });

  it('shows ─ status and ○ icon for unavailable tools', () => {
    const tools = createToolMap(['ansible-playbook']);
    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect: vi.fn(),
      })
    );

    const output = lastFrame() ?? '';
    // Unavailable tools show ○ (U+25CB) as their icon and '─' as status
    expect(output).toContain('\u25CB'); // ○ hollow circle for unavailable
    expect(output).toContain('─');      // dash status for missing tools
  });

  it('shows tool-specific icon for available and ○ for unavailable', () => {
    const tools = createToolMap(['ansible-playbook']);
    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect: vi.fn(),
      })
    );

    const output = lastFrame();
    // Playbook is available → shows ▶ icon (U+25B6)
    expect(output).toContain('\u25B6'); // ▶ playbook icon
    // Other workspace tools are unavailable → show ○ (U+25CB)
    expect(output).toContain('\u25CB');
  });

  it('renders with empty tools map', () => {
    const tools = new Map<AnsibleToolName, ToolInfo>();
    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect: vi.fn(),
      })
    );

    const output = lastFrame();
    expect(output).toContain('Playbook');
    expect(output).toContain('Sessions');
  });

  it('renders with all tools available', () => {
    const tools = createToolMap([
      'ansible',
      'ansible-playbook',
      'ansible-galaxy',
      'ansible-vault',
      'ansible-doc',
      'ansible-inventory',
      'ansible-config',
      'ansible-lint',
      'ansible-test',
      'ansible-builder',
      'ansible-creator',
      'ansible-console',
      'ansible-pull',
      'ansible-community',
    ]);

    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect: vi.fn(),
      })
    );

    const output = lastFrame();
    // Should not show "not installed" when all are available
    const lines = output.split('\n').filter((l) => l.includes('not installed'));
    expect(lines).toHaveLength(0);
  });
});

// Helper to fire a key event through the mocked useInput handler.
function pressKey(
  useInputMock: unknown,
  key: Partial<{
    upArrow: boolean; downArrow: boolean; leftArrow: boolean; rightArrow: boolean;
    return: boolean; escape: boolean; ctrl: boolean; shift: boolean;
    tab: boolean; backspace: boolean; delete: boolean; meta: boolean;
  }>
) {
  const handler = (useInputMock as {
    mock: {
      lastCall?: [((input: string, key: object) => void), ...unknown[]];
    };
  }).mock.lastCall?.[0] as
    | ((input: string, key: object) => void)
    | undefined;
  handler?.('', {
    upArrow: false, downArrow: false, leftArrow: false, rightArrow: false,
    return: false, escape: false, ctrl: false, shift: false,
    tab: false, backspace: false, delete: false, meta: false,
    ...key,
  });
}

describe('Sidebar accordion', () => {
  it('shows playbook sub-actions when activeScreen=playbook and activeAction is set', () => {
    const tools = createToolMap(['ansible-playbook']);
    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'playbook',
        activeAction: 'run',
        onSelect: vi.fn(),
      })
    );
    const output = lastFrame() ?? '';
    expect(output).toContain('run');
    expect(output).toContain('check');
    expect(output).toContain('diff');
    expect(output).toContain('syntax-check');
  });

  it('does not show sub-actions for a tool that is not active', () => {
    const tools = createToolMap(['ansible-playbook', 'ansible-vault']);
    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'playbook',
        activeAction: 'run',
        onSelect: vi.fn(),
      })
    );
    const output = lastFrame() ?? '';
    expect(output).not.toContain('encrypt');
    expect(output).not.toContain('decrypt');
  });

  it('expands sub-actions on rightArrow keypress', async () => {
    const { useInput } = await import('ink');
    const useInputMock = vi.mocked(useInput);

    const tools = createToolMap(['ansible-galaxy']);
    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect: vi.fn(),
      })
    );

    pressKey(useInputMock, { downArrow: true });
    pressKey(useInputMock, { rightArrow: true });

    const output = lastFrame() ?? '';
    expect(output).toContain('role install');
    expect(output).toContain('collection install');
  });

  it('collapses sub-actions on Esc', async () => {
    const { useInput } = await import('ink');
    const useInputMock = vi.mocked(useInput);

    const tools = createToolMap(['ansible-playbook']);
    const { lastFrame } = render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect: vi.fn(),
      })
    );

    pressKey(useInputMock, { rightArrow: true });
    expect(lastFrame()).toContain('run');

    pressKey(useInputMock, { escape: true });
    expect(lastFrame()).not.toContain('syntax-check');
  });

  it('calls onSelect with screen and action when Enter pressed on sub-action', async () => {
    const { useInput } = await import('ink');
    const useInputMock = vi.mocked(useInput);

    const tools = createToolMap(['ansible-playbook']);
    const onSelect = vi.fn();
    render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect,
      })
    );

    pressKey(useInputMock, { rightArrow: true });
    pressKey(useInputMock, { return: true });

    expect(onSelect).toHaveBeenCalledWith('playbook', 'run');
  });

  it('navigates sub-actions with downArrow and selects correct action', async () => {
    const { useInput } = await import('ink');
    const useInputMock = vi.mocked(useInput);

    const tools = createToolMap(['ansible-playbook']);
    const onSelect = vi.fn();
    render(
      React.createElement(Sidebar, {
        tools,
        activeScreen: 'home',
        onSelect,
      })
    );

    pressKey(useInputMock, { rightArrow: true });
    pressKey(useInputMock, { downArrow: true });
    pressKey(useInputMock, { downArrow: true });
    pressKey(useInputMock, { return: true });

    expect(onSelect).toHaveBeenCalledWith('playbook', 'diff');
  });
});
