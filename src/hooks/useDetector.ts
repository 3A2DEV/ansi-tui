import { useState, useEffect, useCallback } from 'react';
import { detectTools as detect, detectAnsibleCfg, detectAnsibleEnvironment } from '../core/detector.js';
import type { ToolInfo, AnsibleToolName, AnsibleEnvironment } from '../models/tool.js';

const EMPTY_ENV: AnsibleEnvironment = {
  ansibleCore: null,
  configFile: null,
  pythonVersion: null,
  jinjaVersion: null,
  pyyamlVersion: null,
  executablePath: null,
  collectionPath: null,
};

export function useDetector(): {
  tools: Map<AnsibleToolName, ToolInfo>;
  ansibleCfg: string | null;
  ansibleEnv: AnsibleEnvironment;
  isLoading: boolean;
  refresh: () => void;
} {
  const [tools, setTools] = useState<Map<AnsibleToolName, ToolInfo>>(new Map());
  const [ansibleCfg, setAnsibleCfg] = useState<string | null>(null);
  const [ansibleEnv, setAnsibleEnv] = useState<AnsibleEnvironment>(EMPTY_ENV);
  const [isLoading, setIsLoading] = useState(true);

  const runDetection = useCallback(async () => {
    setIsLoading(true);
    try {
      const [detectedTools, cfgPath, env] = await Promise.all([
        detect(),
        detectAnsibleCfg(process.cwd()),
        detectAnsibleEnvironment(),
      ]);
      setTools(detectedTools);
      setAnsibleCfg(cfgPath);
      setAnsibleEnv(env);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void runDetection();
  }, [runDetection]);

  return { tools, ansibleCfg, ansibleEnv, isLoading, refresh: runDetection };
}
