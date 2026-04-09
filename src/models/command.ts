export interface ExecutedCommand {
  id: string;
  sessionId: string;
  sessionName: string;         // display name for the session
  timestamp: string;           // ISO 8601
  tool: string;                // e.g. "ansible-playbook"
  action: string;              // e.g. "run", "check", "diff"
  command: string[];           // full argv list
  exitCode: number | null;
  durationMs: number | null;
  outputFile: string | null;   // path to saved output log
}
