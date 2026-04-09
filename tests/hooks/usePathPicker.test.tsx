import { describe, it, expect } from 'vitest';
import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { usePathPicker } from '../../src/hooks/usePathPicker.js';

describe('usePathPicker', () => {
  it('initializes with pickerOpen=false', () => {
    let snapshot = '';

    const Probe: React.FC = () => {
      const state = usePathPicker();
      snapshot = `${state.pickerOpen}:${state.pickerField}:${state.pickerCurrentValue}`;
      return React.createElement(Text, null, snapshot);
    };

    render(React.createElement(Probe));

    expect(snapshot).toBe('false:null:');
  });

  it('openPicker sets pickerOpen=true and stores fieldKey and currentValue', async () => {
    let stateRef: ReturnType<typeof usePathPicker> | null = null;

    const Probe: React.FC = () => {
      stateRef = usePathPicker();
      return React.createElement(Text, null, stateRef.pickerField ?? 'none');
    };

    render(React.createElement(Probe));
    stateRef?.openPicker('collectionPath', '/foo');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stateRef?.pickerOpen).toBe(true);
    expect(stateRef?.pickerField).toBe('collectionPath');
    expect(stateRef?.pickerCurrentValue).toBe('/foo');
  });

  it('closePicker resets to initial state', async () => {
    let stateRef: ReturnType<typeof usePathPicker> | null = null;

    const Probe: React.FC = () => {
      stateRef = usePathPicker();
      return React.createElement(Text, null, stateRef.pickerField ?? 'none');
    };

    render(React.createElement(Probe));
    stateRef?.openPicker('collectionPath', '/foo');
    await new Promise((resolve) => setTimeout(resolve, 0));
    stateRef?.closePicker();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stateRef?.pickerOpen).toBe(false);
    expect(stateRef?.pickerField).toBeNull();
    expect(stateRef?.pickerCurrentValue).toBe('');
  });
});
