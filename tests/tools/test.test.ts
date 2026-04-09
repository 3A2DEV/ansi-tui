import { describe, it, expect } from 'vitest';
import { TestTool } from '../../src/tools/test.js';

describe('TestTool', () => {
  const tool = new TestTool();

  describe('getActions()', () => {
    it('returns sanity, units, integration', () => {
      expect(tool.getActions()).toEqual(['units', 'integration', 'sanity']);
    });
  });

  describe('getParamSchema()', () => {
    it('includes collectionPath for all actions', () => {
      for (const action of tool.getActions()) {
        expect(tool.getParamSchema(action).some((field) => field.key === 'collectionPath')).toBe(true);
      }
    });

    it('includes testFilter and listTests for sanity', () => {
      const schema = tool.getParamSchema('sanity');
      expect(schema.some((field) => field.key === 'testFilter')).toBe(true);
      expect(schema.some((field) => field.key === 'listTests')).toBe(true);
    });

    it('does NOT include docker for sanity', () => {
      const schema = tool.getParamSchema('sanity');
      expect(schema.some((field) => field.key === 'docker')).toBe(false);
    });

    it('includes docker and podman for units', () => {
      const schema = tool.getParamSchema('units');
      expect(schema.some((field) => field.key === 'docker')).toBe(true);
      expect(schema.some((field) => field.key === 'podman')).toBe(true);
    });

    it('includes docker and podman for integration', () => {
      const schema = tool.getParamSchema('integration');
      expect(schema.some((field) => field.key === 'docker')).toBe(true);
      expect(schema.some((field) => field.key === 'podman')).toBe(true);
    });

    it('does NOT include testFilter for units', () => {
      const schema = tool.getParamSchema('units');
      expect(schema.some((field) => field.key === 'testFilter')).toBe(false);
    });
  });

  describe('buildCommand()', () => {
    it('builds basic sanity command without collectionPath in argv', () => {
      const command = tool.buildCommand({ action: 'sanity', collectionPath: '/path/to/col' });
      expect(command).toEqual(['ansible-test', 'sanity']);
      expect(command).not.toContain('/path/to/col');
    });

    it('builds sanity command with --test filter', () => {
      const command = tool.buildCommand({ action: 'sanity', collectionPath: '/path', testFilter: 'pylint' });
      expect(command).toContain('--test');
      expect(command).toContain('pylint');
    });

    it('builds sanity command with --list-tests', () => {
      const command = tool.buildCommand({ action: 'sanity', collectionPath: '/path', listTests: true });
      expect(command).toContain('--list-tests');
    });

    it('builds units command with --docker', () => {
      const command = tool.buildCommand({ action: 'units', collectionPath: '/path', docker: true });
      expect(command).toContain('--docker');
    });

    it('builds units command with --python 3.12', () => {
      const command = tool.buildCommand({ action: 'units', collectionPath: '/path', python: '3.12' });
      expect(command).toContain('--python');
      expect(command).toContain('3.12');
    });

    it('builds integration command with --target remote_host', () => {
      const command = tool.buildCommand({ action: 'integration', collectionPath: '/path', remote: 'remote_host' });
      expect(command).toContain('--target');
      expect(command).toContain('remote_host');
    });

    it('does NOT add --python when python is default', () => {
      const command = tool.buildCommand({ action: 'units', collectionPath: '/path', python: 'default' });
      expect(command).not.toContain('--python');
    });

    it('does NOT add verbosity when verbosity is default', () => {
      const command = tool.buildCommand({ action: 'units', collectionPath: '/path', verbosity: 'default' });
      expect(command).not.toContain('default');
    });
  });

  describe('validate()', () => {
    it('returns error when collectionPath is empty', () => {
      const errors = tool.validate({ action: 'sanity', collectionPath: '' });
      expect(errors).toHaveLength(1);
      expect(errors[0]?.field).toBe('collectionPath');
    });

    it('returns no errors when collectionPath is set and action is valid', () => {
      const errors = tool.validate({ action: 'sanity', collectionPath: '/path/to/collection' });
      expect(errors).toHaveLength(0);
    });

    it('returns error when both docker and podman are true', () => {
      const errors = tool.validate({ action: 'units', collectionPath: '/x', docker: true, podman: true });
      expect(errors.some((error) => error.field === 'podman')).toBe(true);
    });
  });
});
