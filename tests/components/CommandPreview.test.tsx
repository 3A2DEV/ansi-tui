import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { CommandPreview } from '../../src/components/CommandPreview.js';

// Mock useInput to prevent stdin.ref errors in test environment
vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return {
    ...actual,
    useInput: vi.fn(),
  };
});

describe('CommandPreview', () => {
  it('renders the command preview box', () => {
    const { lastFrame } = render(
      React.createElement(CommandPreview, {
        command: ['ansible-playbook', 'site.yml'],
        onRun: vi.fn(),
        onCopy: vi.fn(),
        onBack: vi.fn(),
      })
    );

    const output = lastFrame();
    expect(output).toContain('Command Preview');
    expect(output).toContain('ansible-playbook');
    expect(output).toContain('site.yml');
  });

  it('shows keybinding hints', () => {
    const { lastFrame } = render(
      React.createElement(CommandPreview, {
        command: ['ansible-playbook', 'site.yml'],
        onRun: vi.fn(),
        onCopy: vi.fn(),
        onBack: vi.fn(),
      })
    );

    const output = lastFrame();
    expect(output).toContain('run');
    expect(output).toContain('copy');
    expect(output).toContain('back');
  });

  it('renders empty command array', () => {
    const { lastFrame } = render(
      React.createElement(CommandPreview, {
        command: [],
        onRun: vi.fn(),
        onCopy: vi.fn(),
        onBack: vi.fn(),
      })
    );

    const output = lastFrame();
    expect(output).toContain('Command Preview');
  });

  it('renders multi-part command with flags', () => {
    const { lastFrame } = render(
      React.createElement(CommandPreview, {
        command: ['ansible-playbook', 'site.yml', '-i', 'hosts', '--check'],
        onRun: vi.fn(),
        onCopy: vi.fn(),
        onBack: vi.fn(),
      })
    );

    const output = lastFrame();
    expect(output).toContain('ansible-playbook');
    expect(output).toContain('site.yml');
    expect(output).toContain('-i');
    expect(output).toContain('hosts');
    expect(output).toContain('--check');
  });
});
