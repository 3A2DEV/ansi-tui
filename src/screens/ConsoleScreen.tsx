import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { ConsoleTool } from '../tools/console.js';
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

interface ConsoleScreenProps { session: Session | null; onBack: () => void; onInputModeChange?: (mode: InputMode) => void; }
type Phase = 'action' | 'form' | 'preview' | 'execute';

const consoleTool = new ConsoleTool();

export const ConsoleScreen: React.FC<ConsoleScreenProps> = ({ session, onBack, onInputModeChange }) => {
  const [phase, setPhase] = useState<Phase>('action');
  const [selectedAction, setSelectedAction] = useState('');
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [focusFieldIndex, setFocusFieldIndex] = useState(0);
  const { pickerOpen, pickerField, pickerCurrentValue, openPicker, closePicker } = usePathPicker();
  const { lines, isRunning, exitCode, durationMs, run: execute, reset } = useExecutor();

  const actions = consoleTool.getActions();
  const paramSchema = useMemo(() => selectedAction ? consoleTool.getParamSchema(selectedAction) : [], [selectedAction]);
  const toolParams = useMemo((): ToolParams => ({ action: selectedAction, ...params }), [selectedAction, params]);
  const command = useMemo(() => consoleTool.buildCommand(toolParams), [toolParams]);
  const currentFieldLabel = paramSchema[focusFieldIndex]?.label ?? 'none';
  const pickerFieldSchema = pickerField ? paramSchema.find((field) => field.key === pickerField) : undefined;
  const pickerAllowsDir = pickerFieldSchema?.pathType === 'directory' || pickerFieldSchema?.pathType === 'any';
  const pickerTitle = pickerFieldSchema?.pathType === 'directory' ? 'Select Directory' : pickerFieldSchema?.pathType === 'any' ? 'Select Path' : 'Select File';

  useEffect(() => { onInputModeChange?.(phase === 'form' ? 'form' : 'navigate'); }, [phase, onInputModeChange]);

  useInput((_input, key) => {
    if (pickerOpen) return;
    if (key.escape) {
      if (phase === 'action') onBack();
      else if (phase === 'form') setPhase('action');
      else if (phase === 'preview') setPhase('form');
      else if (phase === 'execute' && !isRunning) { reset(); setPhase('action'); setParams({}); }
    }
  });

  const handleRun = useCallback(async () => {
    setPhase('execute');
    await execute({ command, env: session?.envVars ?? {}, cwd: session?.workingDir ?? process.cwd(), onOutput: () => {}, onError: () => {}, sessionId: session?.id, sessionName: session?.name, action: selectedAction });
  }, [command, session, execute]);

  const updateParam = useCallback((key: string, value: unknown) => { setParams(prev => ({ ...prev, [key]: value })); }, []);

  if (phase === 'action') return (<ToolScreenFrame title="Console" subtitle="Select the console action" hints={['Enter choose', 'Esc back']}><Box marginTop={1}><SelectInput items={actions.map(a => ({ label: a, value: a }))} onSelect={item => { setSelectedAction(item.value); setParams({}); setFocusFieldIndex(0); setPhase('form'); }} /></Box></ToolScreenFrame>);

  if (phase === 'form') return (
    <ToolScreenFrame title="Console" subtitle={selectedAction} hints={['Tab next field', 'PgUp/PgDn jump', 'Enter preview', 'Esc back']} status={`field ${Math.min(focusFieldIndex + 1, paramSchema.length)}/${paramSchema.length}: ${currentFieldLabel}`}>
      <Box flexDirection="column" marginTop={1}>
        {pickerOpen && pickerField ? (
          <FilePicker startPath={derivePickerStartPath(pickerCurrentValue || session?.workingDir || '')} allowDir={pickerAllowsDir} title={pickerTitle} onSelect={(path) => { updateParam(pickerField, path); closePicker(); }} onCancel={closePicker} />
        ) : (
          <FormViewport schema={paramSchema} values={params} focusIndex={focusFieldIndex} onChange={updateParam} isActive={phase === 'form' && !pickerOpen} onOpenPicker={openPicker} />
        )}
      </Box>
      <FieldNavigator count={paramSchema.length} setFocusIndex={setFocusFieldIndex} onEnter={() => setPhase('preview')} isActive={phase === 'form' && !pickerOpen} />
    </ToolScreenFrame>
  );

  if (phase === 'preview') return (<ToolScreenFrame title="Console" subtitle={`${selectedAction} preview`} hints={['Enter run', 'c copy', 'Esc back']}><CommandPreview command={command} onRun={handleRun} onCopy={() => {}} onBack={() => setPhase('form')} isActive={phase === 'preview'} /></ToolScreenFrame>);

  return (<ToolScreenFrame title="Console" subtitle={`${selectedAction} output`} hints={['↑↓ scroll', 'Space pause', 's save', 'Esc back']}><LiveOutput lines={lines} isRunning={isRunning} exitCode={exitCode} durationMs={durationMs} onSave={() => {}} isActive={phase === 'execute'} /></ToolScreenFrame>);
};
