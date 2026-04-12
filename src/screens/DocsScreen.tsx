import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { DocTool } from '../tools/doc.js';
import { CommandPreview } from '../components/CommandPreview.js';
import { FieldNavigator } from '../components/FieldNavigator.js';
import { FormViewport } from '../components/FormViewport.js';
import { LiveOutput } from '../components/LiveOutput.js';
import { ToolScreenFrame } from '../components/ToolScreenFrame.js';
import { useExecutor } from '../hooks/useExecutor.js';
import type { Session } from '../models/session.js';
import type { ToolParams } from '../tools/base.js';
import type { InputMode } from '../App.js';

interface DocsScreenProps { session: Session | null; initialAction?: string; onBack: () => void; onInputModeChange?: (mode: InputMode) => void; }
type Phase = 'action' | 'form' | 'preview' | 'execute';

const docTool = new DocTool();

export const DocsScreen: React.FC<DocsScreenProps> = ({ session, initialAction, onBack, onInputModeChange }) => {
  const enteredFromSubNav = initialAction !== undefined;
  const [phase, setPhase] = useState<Phase>(initialAction ? 'form' : 'action');
  const [selectedAction, setSelectedAction] = useState(initialAction ?? '');
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [focusFieldIndex, setFocusFieldIndex] = useState(0);
  const { lines, isRunning, exitCode, durationMs, run: execute, reset } = useExecutor();

  const actions = docTool.getActions();
  const paramSchema = useMemo(() => selectedAction ? docTool.getParamSchema(selectedAction) : [], [selectedAction]);
  const toolParams = useMemo((): ToolParams => ({ action: selectedAction, ...params }), [selectedAction, params]);
  const command = useMemo(() => docTool.buildCommand(toolParams), [toolParams]);
  const errors = useMemo(() => docTool.validate(toolParams), [toolParams]);
  const currentFieldLabel = paramSchema[focusFieldIndex]?.label ?? 'none';

  useEffect(() => { onInputModeChange?.(phase === 'form' ? 'form' : 'navigate'); }, [phase, onInputModeChange]);

  useInput((_input, key) => {
    if (key.escape) {
      if (phase === 'action') onBack();
      else if (phase === 'form') { if (enteredFromSubNav) onBack(); else setPhase('action'); }
      else if (phase === 'preview') setPhase('form');
      else if (phase === 'execute' && !isRunning) { reset(); setParams({}); if (enteredFromSubNav) onBack(); else setPhase('action'); }
    }
  });

  const handleRun = useCallback(async () => {
    if (errors.length > 0) return;
    setPhase('execute');
    await execute({ command, env: session?.envVars ?? {}, cwd: session?.workingDir ?? process.cwd(), onOutput: () => {}, onError: () => {}, sessionId: session?.id, sessionName: session?.name, action: selectedAction });
  }, [command, session, execute, errors]);

  const updateParam = useCallback((key: string, value: unknown) => { setParams(prev => ({ ...prev, [key]: value })); }, []);

  if (phase === 'action') return (<ToolScreenFrame title="Docs" subtitle="Select the documentation action" hints={['Enter choose', 'Esc back']}><Box marginTop={1}><SelectInput items={actions.map(a => ({ label: a, value: a }))} onSelect={item => { setSelectedAction(item.value); setParams({}); setFocusFieldIndex(0); setPhase('form'); }} /></Box></ToolScreenFrame>);

  if (phase === 'form') return (
    <ToolScreenFrame title="Docs" subtitle={selectedAction} hints={['Tab next field', 'PgUp/PgDn jump', 'Enter preview', 'Esc back']} status={`field ${Math.min(focusFieldIndex + 1, paramSchema.length)}/${paramSchema.length}: ${currentFieldLabel}`}>
      <Box flexDirection="column" marginTop={1}>
        <FormViewport schema={paramSchema} values={params} focusIndex={focusFieldIndex} onChange={updateParam} />
      </Box>
      {errors.length > 0 && <Box marginTop={1} flexDirection="column">{errors.map(e => <Text key={e.field} color="red">✗ {e.message}</Text>)}</Box>}
      <FieldNavigator count={paramSchema.length} setFocusIndex={setFocusFieldIndex} onEnter={() => setPhase('preview')} isActive={phase === 'form'} />
    </ToolScreenFrame>
  );

  if (phase === 'preview') return (<ToolScreenFrame title="Docs" subtitle={`${selectedAction} preview`} hints={['Enter run', 'c copy', 'Esc back']}><CommandPreview command={command} onRun={handleRun} onCopy={() => {}} onBack={() => setPhase('form')} isActive={phase === 'preview'} /></ToolScreenFrame>);

  return (<ToolScreenFrame title="Docs" subtitle={`${selectedAction} output`} hints={['↑↓ scroll', 'Space pause', 's save', 'Esc back']}><LiveOutput lines={lines} isRunning={isRunning} exitCode={exitCode} durationMs={durationMs} onSave={() => {}} isActive={phase === 'execute'} autoScroll={false} wrapMode="wrap" /></ToolScreenFrame>);
};
