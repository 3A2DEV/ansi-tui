export interface Session {
  id: string;                        // uuid v4
  name: string;                      // e.g. "prod-eu-west"
  createdAt: string;                 // ISO 8601
  lastUsed: string;                  // ISO 8601
  workingDir: string;                // absolute path
  inventory: string | null;          // file path, dir, or dynamic script
  vaultPasswordFile: string | null;
  vaultId: string | null;
  extraVars: Record<string, string>;
  envVars: Record<string, string>;   // proxy overrides, tokens, etc.
  ansibleCfg: string | null;         // override ansible.cfg path
  tags: string[];
  notes: string;
}
