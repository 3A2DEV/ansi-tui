import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useThemePalette } from './theme.js';

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  isFocused: boolean;
  secret?: boolean;
  isPath?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  description,
  isFocused,
  secret,
  isPath,
}) => {
  const theme = useThemePalette();
  const displayValue = secret && value.length > 0 ? '*'.repeat(value.length) : value;
  const hasHiddenDescription = !!(description && !isFocused);

  return (
    <Box
      flexDirection="column"
      width="100%"
      marginBottom={1}
      borderStyle="single"
      borderColor={isFocused ? theme.primary : theme.dimBorder}
      paddingX={1}
    >
      <Box width="100%">
        <Box width={2}>
          <Text bold color={isFocused ? theme.primary : theme.muted}>{isFocused ? '▸' : ' '}</Text>
        </Box>
        <Box flexGrow={1}>
          <Text bold color={isFocused ? theme.primary : theme.muted}>{label}</Text>
        </Box>
        {isFocused && (
          <Text dimColor> [editing]</Text>
        )}
        {isFocused && isPath && (
          <Text dimColor>  Ctrl+F browse</Text>
        )}
        {hasHiddenDescription && (
          <Text dimColor> ▾</Text>
        )}
      </Box>

      <Box marginTop={1} width="100%" overflow="hidden">
        {isFocused ? (
          <TextInput
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            focus={isFocused}
          />
        ) : (
          <Text dimColor>{displayValue || placeholder || '(empty)'}</Text>
        )}
      </Box>

      {description && isFocused && (
        <Box marginTop={1} width="100%">
          <Text dimColor italic>
            {description}
          </Text>
        </Box>
      )}
    </Box>
  );
};
