import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getProxyEnv } from '../../src/core/proxy.js';

describe('getProxyEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns empty object when no proxy is set', () => {
    delete process.env['http_proxy'];
    delete process.env['https_proxy'];
    delete process.env['no_proxy'];
    delete process.env['HTTP_PROXY'];
    delete process.env['HTTPS_PROXY'];
    delete process.env['NO_PROXY'];

    const result = getProxyEnv({});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('reads proxy from process.env', () => {
    process.env['http_proxy'] = 'http://proxy.corp:8080';
    process.env['https_proxy'] = 'https://proxy.corp:8443';

    const result = getProxyEnv({});
    expect(result['http_proxy']).toBe('http://proxy.corp:8080');
    expect(result['https_proxy']).toBe('https://proxy.corp:8443');
  });

  it('session envVars override process.env', () => {
    process.env['http_proxy'] = 'http://system-proxy:8080';

    const result = getProxyEnv({ http_proxy: 'http://session-proxy:9090' });
    expect(result['http_proxy']).toBe('http://session-proxy:9090');
  });

  it('handles no_proxy correctly', () => {
    process.env['no_proxy'] = 'localhost,127.0.0.1,.corp';

    const result = getProxyEnv({});
    expect(result['no_proxy']).toBe('localhost,127.0.0.1,.corp');
  });

  it('handles mixed session and system env', () => {
    process.env['http_proxy'] = 'http://sys:8080';
    process.env['HTTPS_PROXY'] = 'https://sys:8443';

    const result = getProxyEnv({ no_proxy: 'localhost' });
    expect(result['http_proxy']).toBe('http://sys:8080');
    expect(result['HTTPS_PROXY']).toBe('https://sys:8443');
    expect(result['no_proxy']).toBe('localhost');
  });

  it('never includes non-proxy keys', () => {
    process.env['PATH'] = '/usr/bin';
    process.env['HOME'] = '/home/user';

    const result = getProxyEnv({});
    expect(result['PATH']).toBeUndefined();
    expect(result['HOME']).toBeUndefined();
  });
});
