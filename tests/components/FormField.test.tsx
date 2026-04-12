import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { FormField } from '../../src/components/FormField.js';

vi.mock('ink-text-input', () => ({
  default: vi.fn(({ value }: { value: string }) => React.createElement(Text, null, value ?? '')),
}));

describe('FormField', () => {
  it('renders Ctrl+F browse hint when isFocused=true and isPath=true', () => {
    const { lastFrame } = render(
      React.createElement(FormField, {
        label: 'Collection path',
        value: '/tmp/col',
        onChange: vi.fn(),
        isFocused: true,
        isPath: true,
      })
    );

    expect(lastFrame()).toContain('Ctrl+F browse');
  });

  it('does NOT render the hint when isFocused=false', () => {
    const { lastFrame } = render(
      React.createElement(FormField, {
        label: 'Collection path',
        value: '/tmp/col',
        onChange: vi.fn(),
        isFocused: false,
        isPath: true,
      })
    );

    expect(lastFrame()).not.toContain('Ctrl+F browse');
  });

  it('does NOT render the hint when isPath is not set', () => {
    const { lastFrame } = render(
      React.createElement(FormField, {
        label: 'Collection path',
        value: '/tmp/col',
        onChange: vi.fn(),
        isFocused: true,
      })
    );

    expect(lastFrame()).not.toContain('Ctrl+F browse');
  });
});
