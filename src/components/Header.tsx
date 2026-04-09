import React from 'react';
import { Box, Text } from 'ink';
import { basename } from 'node:path';
import { SessionBadge } from './SessionBadge.js';
import { useThemePalette } from './theme.js';
import type { AnsibleEnvironment } from '../models/tool.js';
import type { ThemeName } from './theme.js';

interface HeaderProps {
  activeSessionName: string | null;
  activeScreen: string;
  ansibleEnv: AnsibleEnvironment;
  themeName: ThemeName;
}

interface NavTab {
  readonly label: string;
  readonly key: 'home' | 'tools' | 'sessions';
}

const NAV_TABS: readonly NavTab[] = [
  { key: 'home', label: 'Home' },
  { key: 'tools', label: 'Workspace' },
  { key: 'sessions', label: 'Sessions' },
];

const getActiveTab = (activeScreen: string): NavTab['key'] => {
  if (activeScreen === 'home') return 'home';
  if (activeScreen === 'sessions') return 'sessions';
  return 'tools';
};

const APP_VERSION = '0.1.0';

const getScreenLabel = (activeScreen: string): string => {
  if (activeScreen === 'home') return 'dashboard';
  if (activeScreen === 'sessions') return 'session manager';
  return activeScreen;
};

export const Header: React.FC<HeaderProps> = ({ activeSessionName, activeScreen, ansibleEnv, themeName: _themeName }) => {
  const theme = useThemePalette();
  const activeTab = getActiveTab(activeScreen);
  const configLabel = ansibleEnv.configFile ? basename(ansibleEnv.configFile) : 'none';

  return (
    <Box flexDirection="column" flexGrow={1} height={8} justifyContent="space-between">
      <Box justifyContent="space-between" overflow="hidden">
        <Box gap={0} flexShrink={0}>
          {NAV_TABS.map((tab, idx) => {
            const isActive = tab.key === activeTab;

            return (
              <React.Fragment key={tab.key}>
                {idx > 0 && <Text color={theme.dimBorder}> ▸ </Text>}
                <Text
                  color={isActive ? theme.primary : undefined}
                  bold={isActive}
                  underline={isActive}
                  dimColor={!isActive}
                >
                  {tab.label}
                </Text>
              </React.Fragment>
            );
          })}
        </Box>

        <Box gap={2} flexShrink={1} overflow="hidden">
          <Text dimColor wrap="truncate">{getScreenLabel(activeScreen)}</Text>
          <Text color={theme.muted} dimColor>{'v' + APP_VERSION}</Text>
        </Box>
      </Box>

      <Box marginTop={1} justifyContent="space-between" overflow="hidden">
        {/* Left: session + ansible — fixed priority, never clip these */}
        <Box gap={1} flexShrink={0}>
          {activeSessionName
            ? <SessionBadge name={activeSessionName.length > 18 ? activeSessionName.slice(0, 17) + '…' : activeSessionName} />
            : <Text dimColor>no session</Text>}
          <Box flexShrink={0}>
            <Text dimColor>ansible </Text>
            {ansibleEnv.ansibleCore
              ? <><Text dimColor>┤ </Text><Text color={theme.primary} bold>{ansibleEnv.ansibleCore}</Text><Text dimColor> ├</Text></>
              : <Text dimColor>┤ – ├</Text>}
          </Box>
        </Box>

        {/* Right: env chips — can shrink and clip at narrow widths */}
        <Box gap={1} flexShrink={1} overflow="hidden">
          <Box flexShrink={0}>
            <Text dimColor>py </Text>
            {ansibleEnv.pythonVersion
              ? <><Text dimColor>┤ </Text><Text color={theme.warning} bold>{ansibleEnv.pythonVersion}</Text><Text dimColor> ├</Text></>
              : <Text dimColor>┤ – ├</Text>}
          </Box>
          <Box flexShrink={0}>
            <Text dimColor>j2 </Text>
            {ansibleEnv.jinjaVersion
              ? <><Text dimColor>┤ </Text><Text color={theme.secondary} bold>{ansibleEnv.jinjaVersion}</Text><Text dimColor> ├</Text></>
              : <Text dimColor>┤ – ├</Text>}
          </Box>
          <Box flexShrink={0}>
            <Text dimColor>yaml </Text>
            {ansibleEnv.pyyamlVersion
              ? <><Text dimColor>┤ </Text><Text color={theme.success} bold>{ansibleEnv.pyyamlVersion}</Text><Text dimColor> ├</Text></>
              : <Text dimColor>┤ – ├</Text>}
          </Box>
          <Box flexShrink={0}>
            <Text dimColor>cfg </Text>
            {ansibleEnv.configFile
              ? <><Text dimColor>┤ </Text><Text color={theme.accent2} bold>{configLabel}</Text><Text dimColor> ├</Text></>
              : <Text dimColor>┤ – ├</Text>}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
