import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { TestTool } from '../tools/test.js';
import { CommandPreview } from '../components/CommandPreview.js';
import { FieldNavigator } from '../components/FieldNavigator.js';
import { FilePicker } from '../components/FilePicker.js';
import { FormViewport } from '../components/FormViewport.js';
import { LiveOutput } from '../components/LiveOutput.js';
import { ToolScreenFrame } from '../components/ToolScreenFrame.js';
import { useExecutor } from '../hooks/useExecutor.js';
import { usePathPicker } from '../hooks/usePathPicker.js';
import { derivePickerStartPath } from '../utils/pickerHelpers.js';
import type { Session } from '../models/session.js';
import type { ToolParams } from '../tools/base.js';
import type { InputMode } from '../App.js';

interface TestScreenProps { session: Session | null; initialAction?: string; onBack: () => void; onInputModeChange?: (mode: InputMode) => void; }
type Phase = 'action' | 'form' | 'preview' | 'execute';

const testTool = new TestTool();

export const TestScreen: React.FC<TestScreenProps> = ({ session, initialAction, onBack, onInputModeChange }) => {
  const enteredFromSubNav = initialAction !== undefined;
  const [phase, setPhase] = useState<Phase>(initialAction ? 'form' : 'action');
  const [selectedAction, setSelectedAction] = useState(initialAction ?? '');
  const [params, setParams] = useState<Record<string, unknown>>(() => ({
    collectionPath: session?.workingDir ?? '',
  }));
  const [focusFieldIndex, setFocusFieldIndex] = useState(0);
  const { pickerOpen, pickerField, pickerCurrentValue, openPicker, closePicker } = usePathPicker();
  const { lines, isRunning, exitCode, durationMs, run: execute, reset } = useExecutor();

  const actions = testTool.getActions();
  const paramSchema = useMemo(() => selectedAction ? testTool.getParamSchema(selectedAction) : [], [selectedAction]);
  const toolParams = useMemo((): ToolParams => ({ action: selectedAction, ...params }), [selectedAction, params]);
  const command = useMemo(() => testTool.buildCommand(toolParams), [toolParams]);
  const errors = useMemo(() => testTool.validate(toolParams), [toolParams]);
  const currentFieldLabel = paramSchema[focusFieldIndex]?.label ?? 'none';
  const pickerFieldSchema = pickerField ? paramSchema.find((field) => field.key === pickerField) : undefined;
  const pickerAllowsDir = pickerFieldSchema?.pathType === 'directory' || pickerFieldSchema?.pathType === 'any';
  const pickerTitle = pickerFieldSchema?.pathType === 'directory' ? 'Select Directory' : pickerFieldSchema?.pathType === 'any' ? 'Select Path' : 'Select File';

  useEffect(() => { onInputModeChange?.(phase === 'form' ? 'form' : 'navigate'); }, [phase, onInputModeChange]);

  useInput((_input, key) => {
    if (pickerOpen) return;
    if (key.escape) {
      if (phase === 'action') onBack();
      else if (phase === 'form') { if (enteredFromSubNav) onBack(); else setPhase('action'); }
      else if (phase === 'preview') setPhase('form');
      else if (phase === 'execute' && !isRunning) { reset(); setParams({ collectionPath: session?.workingDir ?? '' }); if (enteredFromSubNav) onBack(); else setPhase('action'); }
    }
  });

  const handleRun = useCallback(async () => {
    if (errors.length > 0) return;
    setPhase('execute');
    await execute({ command, env: session?.envVars ?? {}, cwd: (params['collectionPath'] as string) || session?.workingDir || process.cwd(), onOutput: () => {}, onError: () => {}, sessionId: session?.id, sessionName: session?.name, action: selectedAction });
  }, [command, session, execute, errors, params, selectedAction]);

  const updateParam = useCallback((key: string, value: unknown) => { setParams(prev => ({ ...prev, [key]: value })); }, []);

  if (phase === 'action') return (<ToolScreenFrame title="Test" subtitle="Select the test action" hints={['Enter choose', 'Esc back']}><Box marginTop={1}><SelectInput items={actions.map(a => ({ label: a, value: a }))} onSelect={item => { setSelectedAction(item.value); setParams({ collectionPath: session?.workingDir ?? '' }); setFocusFieldIndex(0); setPhase('form'); }} /></Box></ToolScreenFrame>);

  if (phase === 'form') return (
    <ToolScreenFrame title="Test" subtitle={selectedAction} hints={['Tab next field', 'PgUp/PgDn jump', 'Enter preview', 'Esc back']} status={`field ${Math.min(focusFieldIndex + 1, paramSchema.length)}/${paramSchema.length}: ${currentFieldLabel}`}>
      <Box flexDirection="column" marginTop={1}>
        {pickerOpen && pickerField ? (
          <FilePicker
            startPath={derivePickerStartPath(pickerCurrentValue || session?.workingDir || '')}
            allowDir={pickerAllowsDir}
            title={pickerTitle}
            onSelect={(path) => {
              updateParam(pickerField, path);
              closePicker();
            }}
            onCancel={closePicker}
          />
        ) : (
          <FormViewport schema={paramSchema} values={params} focusIndex={focusFieldIndex} onChange={updateParam} isActive={phase === 'form' && !pickerOpen} onOpenPicker={openPicker} />
        )}
      </Box>
      {!pickerOpen && errors.length > 0 && <Box marginTop={1} flexDirection="column">{errors.map(e => <Text key={e.field} color="red">✗ {e.message}</Text>)}</Box>}
      <FieldNavigator count={paramSchema.length} setFocusIndex={setFocusFieldIndex} onEnter={() => setPhase('preview')} isActive={phase === 'form' && !pickerOpen} />
    </ToolScreenFrame>
  );

  if (phase === 'preview') return (<ToolScreenFrame title="Test" subtitle={`${selectedAction} preview`} hints={['Enter run', 'c copy', 'Esc back']}><CommandPreview command={command} onRun={handleRun} onCopy={() => {}} onBack={() => setPhase('form')} isActive={phase === 'preview'} /></ToolScreenFrame>);

  return (<ToolScreenFrame title="Test" subtitle={`${selectedAction} output`} hints={['↑↓ scroll', 'Space pause', 's save', 'Esc back']}><LiveOutput lines={lines} isRunning={isRunning} exitCode={exitCode} durationMs={durationMs} onSave={() => {}} isActive={phase === 'execute'} wrapMode="wrap" plainText={false} /></ToolScreenFrame>);
};
