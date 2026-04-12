import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { ParamSchema } from '../tools/base.js';
import { FormField } from './FormField.js';

interface FormViewportProps {
  readonly schema: ParamSchema[];
  readonly values: Record<string, unknown>;
  readonly focusIndex: number;
  readonly onChange: (key: string, value: string) => void;
  readonly isActive?: boolean;
  readonly onOpenPicker?: (fieldKey: string, currentValue: string) => void;
}

export const FormViewport: React.FC<FormViewportProps> = ({
  schema,
  values,
  focusIndex,
  onChange,
  isActive = true,
  onOpenPicker,
}) => {
  const rows = process.stdout.rows ?? 24;
  const visibleCount = Math.max(3, Math.min(5, rows - 20));
  const maxStart = Math.max(0, schema.length - visibleCount);
  const startIndex = Math.max(0, Math.min(Math.max(0, focusIndex - 2), maxStart));
  const endIndex = Math.min(schema.length, startIndex + visibleCount);
  const visibleFields = schema.slice(startIndex, endIndex);
  const progressBarWidth = 16;
  const progress = schema.length > 1 ? focusIndex / (schema.length - 1) : 1;
  const filled = Math.max(1, Math.round(progressBarWidth * progress));
  const empty = progressBarWidth - filled;

  useInput((input, key) => {
    if (!isActive) return;
    if (key.ctrl && input === 'f') {
      const field = schema[focusIndex];
      if (!field) return;
      const isPathField = field.type === 'file' || field.isPath === true;
      if (isPathField) {
        onOpenPicker?.(field.key, String(values[field.key] ?? ''));
      }
    }
  });

  return (
    <Box flexDirection="column">
      {schema.length > visibleCount && (
        <Box marginBottom={1} justifyContent="space-between">
          <Text dimColor>
            fields {startIndex + 1}-{endIndex} of {schema.length}
          </Text>
          <Text>
            <Text color="magenta">{'█'.repeat(filled)}</Text>
            <Text dimColor>{'░'.repeat(empty)}</Text>
          </Text>
        </Box>
      )}

      {visibleFields.map((field, offset) => {
        const actualIndex = startIndex + offset;

        return (
          <FormField
            key={field.key}
            label={field.label}
            value={String(values[field.key] ?? field.defaultValue ?? '')}
            onChange={(value) => onChange(field.key, value)}
            placeholder={field.placeholder}
            description={field.description}
            isFocused={focusIndex === actualIndex}
            secret={field.type === 'password'}
            isPath={field.type === 'file' || field.isPath === true}
          />
        );
      })}
      </Box>
  );
};
