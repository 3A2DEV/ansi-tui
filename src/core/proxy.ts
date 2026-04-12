const PROXY_KEYS = [
  'http_proxy',
  'https_proxy',
  'no_proxy',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
] as const;

export function getProxyEnv(
  sessionEnvVars: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key of PROXY_KEYS) {
    const fromSession = sessionEnvVars[key];
    if (fromSession !== undefined) {
      result[key] = fromSession;
      continue;
    }

    const fromProcess = process.env[key];
    if (fromProcess !== undefined) {
      result[key] = fromProcess;
    }
  }

  return result;
}
