import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { FilePicker } from '../../src/components/FilePicker.js';
import { readdir, stat } from 'node:fs/promises';

// Mock fs/promises — loadDir is async; tests check initial render before it resolves
vi.mock('node:fs/promises', () => ({
  readdir: vi.fn().mockResolvedValue([]),
  stat: vi.fn(),
}));

// Mock useInput to prevent stdin.ref errors in test environment
vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return { ...actual, useInput: vi.fn() };
});

describe('FilePicker', () => {
  beforeEach(() => {
    vi.mocked(readdir).mockResolvedValue([]);
    vi.mocked(stat).mockReset();
  });

  const pressKey = async (key: Partial<Record<string, boolean>>, input = '') => {
    const { useInput } = await import('ink');
    const handler = vi.mocked(useInput).mock.lastCall?.[0] as ((input: string, key: object) => void) | undefined;
    handler?.(input, {
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
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  const waitForAsyncLoad = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  it('renders panel title and current path', () => {
    const { lastFrame } = render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        onSelect: vi.fn(),
        onCancel: vi.fn(),
      })
    );
    const output = lastFrame();
    expect(output).toContain('Select File');
    expect(output).toContain('/tmp');
  });

  it('shows empty directory message before entries load', () => {
    const { lastFrame } = render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        onSelect: vi.fn(),
        onCancel: vi.fn(),
      })
    );
    const output = lastFrame();
    expect(output).toContain('empty directory');
  });

  it('shows keyboard hints for select, parent, and cancel', () => {
    const { lastFrame } = render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        onSelect: vi.fn(),
        onCancel: vi.fn(),
      })
    );
    const output = lastFrame();
    expect(output).toContain('select');
    expect(output).toContain('parent');
    expect(output).toContain('cancel');
  });

  it('accepts extensions filter prop without error', () => {
    const { lastFrame } = render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        extensions: ['.yml', '.yaml'],
        onSelect: vi.fn(),
        onCancel: vi.fn(),
      })
    );
    const output = lastFrame();
    expect(output).toContain('Select File');
  });

  it('calls onSelect when Enter pressed on a file', async () => {
    vi.mocked(readdir).mockResolvedValue(['site.yml']);
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => false } as Awaited<ReturnType<typeof stat>>);
    const onSelect = vi.fn();

    render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        onSelect,
        onCancel: vi.fn(),
      })
    );

    await waitForAsyncLoad();
    await pressKey({ return: true });

    expect(onSelect).toHaveBeenCalledWith('/tmp/site.yml');
  });

  it('navigates into directory on Enter when allowDir=false', async () => {
    vi.mocked(readdir)
      .mockResolvedValueOnce(['roles'])
      .mockResolvedValueOnce([]);
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => true } as Awaited<ReturnType<typeof stat>>);

    const { lastFrame } = render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        onSelect: vi.fn(),
        onCancel: vi.fn(),
      })
    );

    await waitForAsyncLoad();
    await pressKey({ return: true });

    expect(lastFrame()).toContain('/tmp/roles');
  });

  it('calls onSelect with directory path on Enter when allowDir=true', async () => {
    vi.mocked(readdir).mockResolvedValue(['roles']);
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => true } as Awaited<ReturnType<typeof stat>>);
    const onSelect = vi.fn();

    render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        allowDir: true,
        onSelect,
        onCancel: vi.fn(),
      })
    );

    await waitForAsyncLoad();
    await pressKey({ return: true });

    expect(onSelect).toHaveBeenCalledWith('/tmp/roles');
  });

  it('navigates into directory on rightArrow when allowDir=true', async () => {
    vi.mocked(readdir)
      .mockResolvedValueOnce(['roles'])
      .mockResolvedValueOnce([]);
    vi.mocked(stat).mockResolvedValue({ isDirectory: () => true } as Awaited<ReturnType<typeof stat>>);

    const { lastFrame } = render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        allowDir: true,
        onSelect: vi.fn(),
        onCancel: vi.fn(),
      })
    );

    await waitForAsyncLoad();
    await pressKey({ rightArrow: true });

    expect(lastFrame()).toContain('/tmp/roles');
  });

  it('calls onCancel on Esc', async () => {
    const onCancel = vi.fn();

    render(
      React.createElement(FilePicker, {
        startPath: '/tmp',
        onSelect: vi.fn(),
        onCancel,
      })
    );

    await pressKey({ escape: true });

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
