import React, { useState, useCallback, useEffect } from 'react';
import { Box, useInput } from 'ink';
import { Banner } from './components/Banner.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { Sidebar } from './components/Sidebar.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { SessionsScreen } from './screens/SessionsScreen.js';
import { PlaybookScreen } from './screens/PlaybookScreen.js';
import { GalaxyScreen } from './screens/GalaxyScreen.js';
import { VaultScreen } from './screens/VaultScreen.js';
import { InventoryScreen } from './screens/InventoryScreen.js';
import { DocsScreen } from './screens/DocsScreen.js';
import { ConfigScreen } from './screens/ConfigScreen.js';
import { LintScreen } from './screens/LintScreen.js';
import { BuilderScreen } from './screens/BuilderScreen.js';
import { CreatorScreen } from './screens/CreatorScreen.js';
import { TestScreen } from './screens/TestScreen.js';
import { ConsoleScreen } from './screens/ConsoleScreen.js';
import { JobsScreen } from './screens/JobsScreen.js';
import { pruneOldLogs } from './core/jobs.js';
import { THEME_ORDER, THEMES, ThemeContext } from './components/theme.js';
import { useDetector } from './hooks/useDetector.js';
import { useSession } from './hooks/useSession.js';

type InputMode = 'navigate' | 'form';

export type { InputMode };

export const App: React.FC = () => {
  const terminalRows = process.stdout.rows ?? 40;
  const topShellHeight = 12;
  const footerHeight = 3;
  const bodyGap = 1;
  const mainBodyHeight = Math.max(12, terminalRows - topShellHeight - footerHeight - bodyGap);

  const [activeScreen, setActiveScreen] = useState('home');
  const [inputMode, setInputMode] = useState<InputMode>('navigate');
  const [activeAction, setActiveAction] = useState<string | undefined>(undefined);
  const [themeIndex, setThemeIndex] = useState(0);
  const { tools, ansibleEnv, isLoading: toolsLoading } = useDetector();
  const { activeSession, sessions, setActive, create, update, remove } = useSession();
  const themeName = THEME_ORDER[themeIndex] ?? THEME_ORDER[0];
  const theme = THEMES[themeName];

  useEffect(() => { void pruneOldLogs(200); }, []);

  const handleSelectScreen = useCallback((screen: string, action?: string) => {
    setActiveScreen(screen);
    setActiveAction(action);
    setInputMode('navigate');
  }, []);

  const goHome = useCallback(() => {
    setActiveScreen('home');
    setActiveAction(undefined);
    setInputMode('navigate');
  }, []);

  useInput((input, key) => {
    if (inputMode !== 'navigate') return;
    if (input === 'q' && !key.ctrl) {
      process.exit(0);
    }
    if (input === 's') {
      setActiveScreen('sessions');
    }
    if (input === 't') {
      setThemeIndex((prev) => (prev + 1) % THEME_ORDER.length);
    }
  });

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <HomeScreen
            activeSession={activeSession}
            tools={tools}
            ansibleEnv={ansibleEnv}
            isLoading={toolsLoading}
            onSelectTool={handleSelectScreen}
          />
        );
      case 'sessions':
        return (
          <SessionsScreen
            sessions={sessions}
            activeSession={activeSession}
            onSelect={async (id) => { await setActive(id); handleSelectScreen('home'); }}
            onCreate={async (name, dir) => { const s = await create(name, dir); handleSelectScreen('home'); return s; }}
            onUpdate={update}
            onRemove={async (id) => { await remove(id); }}
            onBack={goHome}
            onInputModeChange={setInputMode}
          />
        );
      case 'playbook':
        return <PlaybookScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'galaxy':
        return <GalaxyScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'vault':
        return <VaultScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'inventory':
        return <InventoryScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'docs':
        return <DocsScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'config':
        return <ConfigScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'lint':
        return <LintScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'builder':
        return <BuilderScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'creator':
        return <CreatorScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'test':
        return <TestScreen session={activeSession} initialAction={activeAction} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'console':
        return <ConsoleScreen session={activeSession} onBack={goHome} onInputModeChange={setInputMode} />;
      case 'jobs':
        return <JobsScreen onBack={goHome} />;
      default:
        return (
          <HomeScreen
            activeSession={activeSession}
            tools={tools}
            ansibleEnv={ansibleEnv}
            isLoading={toolsLoading}
            onSelectTool={handleSelectScreen}
          />
        );
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <Box flexDirection="column" height={terminalRows} paddingX={1} overflow="hidden">
        <Box flexDirection="row" borderStyle="round" borderColor={theme.frame} paddingX={1} paddingY={1} height={topShellHeight} overflow="hidden">
          <Banner />
          <Header
            activeSessionName={activeSession?.name ?? null}
            activeScreen={activeScreen}
            ansibleEnv={ansibleEnv}
            themeName={themeName}
          />
        </Box>

        <Box height={mainBodyHeight} marginTop={1} overflow="hidden">
          <Sidebar
            tools={tools}
            activeScreen={activeScreen}
            activeAction={activeAction}
            onSelect={handleSelectScreen}
            disabled={activeScreen !== 'home'}
          />
          <Box flexGrow={1} flexDirection="column" paddingX={1} overflow="hidden" height={mainBodyHeight}>
            {renderScreen()}
          </Box>
        </Box>

        <Box height={footerHeight} overflow="hidden">
          <Footer themeName={themeName} activeScreen={activeScreen} />
        </Box>
      </Box>
    </ThemeContext.Provider>
  );
};
