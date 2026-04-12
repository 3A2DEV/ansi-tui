import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { FormViewport } from '../../src/components/FormViewport.js';

vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return { ...actual, useInput: vi.fn() };
});

vi.mock('../../src/components/FormField.js', () => ({
  FormField: () => null,
}));

describe('FormViewport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const triggerCtrlF = async () => {
    const { useInput } = await import('ink');
    const handler = vi.mocked(useInput).mock.lastCall?.[0] as ((input: string, key: object) => void) | undefined;
    handler?.('f', {
      upArrow: false,
      downArrow: false,
      leftArrow: false,
      rightArrow: false,
      return: false,
      escape: false,
      ctrl: true,
      shift: false,
      tab: false,
      backspace: false,
      delete: false,
      meta: false,
    });
  };

  it('calls onOpenPicker when Ctrl+F is pressed on a file-type field', async () => {
    const onOpenPicker = vi.fn();
    render(
      React.createElement(FormViewport, {
        schema: [{ key: 'playbook', label: 'Playbook', type: 'file' }],
        values: { playbook: 'site.yml' },
        focusIndex: 0,
        onChange: vi.fn(),
        onOpenPicker,
      })
    );

    await triggerCtrlF();
    expect(onOpenPicker).toHaveBeenCalledWith('playbook', 'site.yml');
  });

  it('calls onOpenPicker when Ctrl+F is pressed on a text field with isPath=true', async () => {
    const onOpenPicker = vi.fn();
    render(
      React.createElement(FormViewport, {
        schema: [{ key: 'collectionPath', label: 'Collection path', type: 'text', isPath: true, pathType: 'directory' }],
        values: { collectionPath: '/tmp/col' },
        focusIndex: 0,
        onChange: vi.fn(),
        onOpenPicker,
      })
    );

    await triggerCtrlF();
    expect(onOpenPicker).toHaveBeenCalledWith('collectionPath', '/tmp/col');
  });

  it('does NOT call onOpenPicker when Ctrl+F is pressed on a text field without isPath', async () => {
    const onOpenPicker = vi.fn();
    render(
      React.createElement(FormViewport, {
        schema: [{ key: 'tags', label: 'Tags', type: 'text' }],
        values: { tags: 'deploy' },
        focusIndex: 0,
        onChange: vi.fn(),
        onOpenPicker,
      })
    );

    await triggerCtrlF();
    expect(onOpenPicker).not.toHaveBeenCalled();
  });

  it('does NOT call onOpenPicker when isActive=false', async () => {
    const onOpenPicker = vi.fn();
    render(
      React.createElement(FormViewport, {
        schema: [{ key: 'playbook', label: 'Playbook', type: 'file' }],
        values: { playbook: 'site.yml' },
        focusIndex: 0,
        onChange: vi.fn(),
        onOpenPicker,
        isActive: false,
      })
    );

    await triggerCtrlF();
    expect(onOpenPicker).not.toHaveBeenCalled();
  });
});
