import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { JobsScreen } from '../../src/screens/JobsScreen.js';

// Prevent stdin.ref errors in test environment
vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return { ...actual, useInput: vi.fn() };
});

// Mock jobs module — data defined inside factory to avoid hoisting issues
vi.mock('../../src/core/jobs.js', () => {
  return {
    readJobs: vi.fn().mockResolvedValue([
      {
        id: 'job-1',
        sessionId: 'session-abc',
        sessionName: 'my-project',
        timestamp: '2026-04-06T21:34:22.000Z',
        tool: 'ansible-playbook',
        action: 'run',
        command: ['ansible-playbook', 'site.yml'],
        exitCode: 0,
        durationMs: 135000,
        outputFile: null,
      },
      {
        id: 'job-2',
        sessionId: 'session-abc',
        sessionName: 'my-project',
        timestamp: '2026-04-06T21:30:00.000Z',
        tool: 'ansible-lint',
        action: 'check',
        command: ['ansible-lint', '.'],
        exitCode: 2,
        durationMs: 3000,
        outputFile: null,
      },
    ]),
    deleteJob: vi.fn().mockResolvedValue(undefined),
  };
});

describe('JobsScreen', () => {
  it('renders the jobs screen title', () => {
    const { lastFrame } = render(
      React.createElement(JobsScreen, { onBack: vi.fn() })
    );
    expect(lastFrame()).toContain('Jobs');
  });

  it('shows tool and action from job list after load', async () => {
    const { lastFrame } = render(
      React.createElement(JobsScreen, { onBack: vi.fn() })
    );
    await new Promise((r) => setTimeout(r, 10));
    const frame = lastFrame();
    expect(frame).toContain('playbook');
    expect(frame).toContain('run');
  });

  it('shows success indicator for exit code 0', async () => {
    const { lastFrame } = render(
      React.createElement(JobsScreen, { onBack: vi.fn() })
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(lastFrame()).toContain('✓');
  });

  it('shows failure indicator for non-zero exit code', async () => {
    const { lastFrame } = render(
      React.createElement(JobsScreen, { onBack: vi.fn() })
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(lastFrame()).toContain('✗');
  });

  it('shows keyboard hints', () => {
    const { lastFrame } = render(
      React.createElement(JobsScreen, { onBack: vi.fn() })
    );
    const frame = lastFrame();
    expect(frame).toContain('navigate');
    expect(frame).toContain('view');
    expect(frame).toContain('delete');
    expect(frame).toContain('back');
  });
});

describe('JobsScreen empty state', () => {
  it('shows empty subtitle when no jobs exist', async () => {
    const { readJobs } = await import('../../src/core/jobs.js');
    vi.mocked(readJobs).mockResolvedValue([]);

    const { lastFrame } = render(
      React.createElement(JobsScreen, { onBack: vi.fn() })
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(lastFrame()).toContain('no jobs yet');
  });
});
