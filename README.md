<div align="center">

![ansi-tui icon](img/favicon-48x48.png)

![Ansible TUI](https://img.shields.io/badge/Terminal%20User%20Interface-red?logo=ansible&label=Ansible)
![License](https://img.shields.io/badge/MIT-blue?logo=Github&label=License)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/3a2dev/ansi-tui/npm-tests.yml?logo=github&label=npm-tests%20CI)

![Dependabot](https://img.shields.io/badge/secure-green?logo=dependabot&label=dependabot)
![Github Code Quality](https://img.shields.io/badge/Code%20Quality-blue?logo=github&label=GitHub)


![Node version](https://img.shields.io/badge/18%2B-green?logo=node.js&label=Node.js&logoColor=white)
![Typescript version](https://img.shields.io/badge/5%2B-blue?logo=Typescript&label=Typescript&logoColor=white)


![NPM Version](https://img.shields.io/npm/v/%403a2dev%2Fansi-tui?logo=npm&label=ansi-tui%20version)
![NPM Last Update](https://img.shields.io/npm/last-update/%403a2dev%2Fansi-tui?logo=npm&label=ansi-tui%20update)

![NPM Downloads](https://img.shields.io/npm/dw/%403a2dev%2Fansi-tui?logo=npm&logoColor=white&label=ansi-tui%20downloads&color=blue)
![NPM Downloads](https://img.shields.io/npm/dm/%403a2dev%2Fansi-tui?label=&color=blue)
![NPM Downloads](https://img.shields.io/npm/dy/%403a2dev%2Fansi-tui?label=&color=blue)

[**Official website**](https://ansibleterminalui.vercel.app/) ― 
[**View on npmjs**](https://www.npmjs.com/package/@3a2dev/ansi-tui)

</div>

![terminal-rec](recs/last-rec.gif)

`ansi-tui` wraps common day-to-day Ansible workflows in a guided Ink-based terminal interface. It keeps the exact command line visible, remembers working context per session, streams execution output live, and records active-session runs as structured jobs with logs.

Interactive screens currently exist for `ansible-playbook`, `ansible-galaxy`, `ansible-vault`, `ansible-inventory`, `ansible-doc`, `ansible-config`, `ansible-lint`, `ansible-builder`, `ansible-creator`, `ansible-test`, and `ansible-console`. Runtime detection also reports broader tool availability, including `ansible-pull` and `ansible-community`, but those tools are not yet first-class interactive screens.

## Highlights

- Full-terminal shell with a static gradient banner, grouped sidebar, dashboard panels, and compact footer command strip
- Sidebar accordion sub-navigation for tool actions, with direct jump into the form phase
- Consistent 4-phase workflow for tool screens: action select -> parameter form -> command preview -> execute
- Session-aware forms that pre-fill inventory, vault, environment, tags, working directory, and other context
- Session management with create, select, edit, delete, and safe active-session cleanup
- Jobs screen with recorded executions, exit status, duration, session name, target extraction, detail view, and deletion
- Live output viewer with scroll, pause/resume, running spinner, elapsed time, and long-output clipping inside the frame
- Runtime dashboard showing ansible-core, Python, Jinja, PyYAML, config file, collection path, and tool availability
- Theme system with `Cyan`, `Blue`, `White`, `Gray`, `Yellow`, `Violet`, `Red`, and `Neon`
- Proxy-aware execution for enterprise environments
- Color-friendly execution defaults plus OSC 8 hyperlink stripping for cleaner terminal rendering
- Offline-friendly install flow via `npm pack` and `install.sh --local`

## Full Functionality

### Shell And Navigation

- Full-screen workstation shell anchored to the top of the terminal
- Grouped sidebar with `WORKSPACE` and `MANAGE` sections
- Accordion sub-navigation for tool actions
- Compact footer with active screen context
- Theme cycling from the keyboard

### Dashboard

- `Session` panel with icon-led rows for name, path, inventory, vault, tags, and notes
- `Runtime` panel with version chips and config/collections paths
- `Health & Tool Matrix` panel with a static gradient coverage bar and availability matrix
- `Workspace Notes` panel with quick operator guidance

### Session Management

- Create sessions with a 2-step flow: name, directory
- Edit sessions with a 2-step flow: name, directory
- Delete sessions with explicit confirmation
- Activate a saved session from the session list
- Keyboard-driven saved-session list with `Enter`, `n`, `e`, `d`, and `Esc`
- Safe clearing of the active-session pointer when the active session is deleted

### Tool Workflow Engine

- Shared 4-phase flow across tool screens
- Direct tool launch from sidebar sub-actions into the form phase
- Command preview before execution
- Live command execution with streaming output

### Live Output And Jobs

- Scrollable output panel
- Pause/resume auto-scroll
- Wrapped or plain-text output modes depending on tool needs
- Automatic job recording for active-session runs
- Automatic per-run log file creation
- Jobs list with status badges, timestamps, duration, session names, and derived targets
- Job detail view with metadata and output log
- Job deletion that also removes the associated log file when present
- Automatic pruning of old log files on startup

### Enterprise And Runtime Behavior

- Proxy-aware environment merging
- Forced color-friendly execution defaults for Ansible output
- OSC 8 hyperlink stripping for safer terminal rendering
- Blank-line preservation in streamed command output
- Runtime/tool detection for ansible-core, Python, Jinja, PyYAML, config path, and broader Ansible tool availability

### Supported Interactive Tool Screens

- `ansible-playbook`
  - actions: `run`, `check`, `diff`, `syntax-check`, `list-hosts`, `list-tasks`, `list-tags`
- `ansible-galaxy`
  - actions: `role install`, `role list`, `role remove`, `role init`, `role search`, `role info`, `role import`, `role delete`, `role setup`, `collection install`, `collection list`, `collection init`, `collection build`, `collection publish`, `collection download`, `collection verify`
- `ansible-vault`
  - actions: `create`, `encrypt`, `decrypt`, `view`, `edit`, `rekey`, `encrypt_string`
- `ansible-inventory`
  - actions: `list`, `host`, `graph`
- `ansible-doc`
  - actions: `lookup`, `list`, `list_files`, `metadata-dump`
- `ansible-config`
  - actions: `list`, `dump`, `view`, `init`, `validate`
- `ansible-lint`
  - actions: `run`, `list-rules`, `list-tags`, `list-profiles`
- `ansible-builder`
  - actions: `build`, `create`, `introspect`
- `ansible-creator`
  - actions: `init collection`, `init playbook`, `init execution_env`, `add resource`, `add plugin`
- `ansible-test`
  - actions: `units`, `integration`, `sanity`, `coverage`, `env`, `shell`, `network-integration`, `windows-integration`
- `ansible-console`
  - actions: `start`

### Management Views

- `Jobs`
- `Sessions`

The runtime/tool matrix also detects broader tooling availability including `ansible`, `ansible-pull`, and `ansible-community`. Those tools are reported in the runtime view, but `ansible-pull` and `ansible-community` are not yet exposed as first-class interactive screens.

## Requirements

- Node.js `18+`
- A modern terminal with color support
- Ansible tooling is optional, but the app is most useful when `ansible-core` and related binaries are installed

## Install

### From npm

```bash
npm install -g @3a2dev/ansi-tui
ansi-tui
```

### Run without installing

```bash
npx @3a2dev/ansi-tui
```

### Via the install script

```bash
./install.sh
```

This installs to `~/.local/bin/ansi-tui` by default.

### Offline or air-gapped install

Build a tarball on a connected machine:

```bash
npm pack
```

Install it on the target machine:

```bash
./install.sh --local ./3a2dev-ansi-tui-0.1.0.tgz
```

Quick local package smoke check:

```bash
npm pack
./install.sh --local ./3a2dev-ansi-tui-0.1.0.tgz
~/.local/bin/ansi-tui --help
```

## Usage

```bash
ansi-tui
```

Package-level CLI helpers:

```bash
ansi-tui --help
ansi-tui --version
```

On launch you get:

- a top shell with session and runtime metadata
- a left navigation rail grouped into `WORKSPACE` and `MANAGE`
- a dashboard with session, runtime, health/tool matrix, and workspace notes panels
- a footer with the active screen context and global shortcuts

## How Tool Screens Work

Every workflow screen follows the same pattern:

1. Select an action.
2. Fill in parameters from the generated schema.
3. Review the exact command before execution.
4. Run it and inspect the live output inside the app.

Execution behavior:

- forms pre-fill from the active session where possible
- validation failures stay in the UI instead of throwing
- non-zero exit codes are treated as normal command results
- runs executed with an active session are written to the jobs history and their output logs are saved automatically
- launching without an interactive TTY prints a usage-oriented error instead of trying to render the TUI

## Keyboard Shortcuts

![key-bind](img/visual-key.png)

## Sessions

Sessions are the app's working-context model. They let you switch cleanly between projects, inventories, and environments without retyping the same flags every time.

Current session screen capabilities:

- stacked panels in this order: `Active Workspace`, `Saved Sessions`, `Workspace Notes`
- activate a session with `Enter`
- create a session with `n`
- edit the selected session with `e`
- delete the selected session with `d`
- return to the main navigation flow with `Esc`

Session data can include:

- working directory
- inventory
- vault password file
- vault ID
- extra vars
- environment variables
- `ansible.cfg`
- tags
- notes

## Jobs And Logs

Executions run with an active session are recorded as jobs with:

- tool name
- selected action
- full command argv
- session id and session name
- timestamp
- exit code
- duration
- output log file path

The Jobs screen provides:

- newest-first job list
- status badges for success and failure
- derived target/file column where possible
- full detail view with command, metadata, and scrollable output
- deletion of the job entry and its associated log file

Old logs are pruned automatically on startup to keep disk growth bounded.

## Data Storage

Persistent data uses `env-paths('ansi-tui')`, so the base directory varies by OS.

Typical examples:

- macOS: `~/Library/Application Support/ansi-tui`
- Linux: `~/.local/share/ansi-tui`

Layout:

```text
<env-paths data dir>/
├── sessions/       # {uuid}.json per session
├── active_session  # active session id
├── history/        # {sessionId}.jsonl job history per session
└── logs/           # {timestamp}-{tool}.log execution output
```

## Development

```bash
npm install
npm run dev
npm run build          # Bundle src/ to dist/
npm start              # Run built app
```
![terminal-install-rec](recs/install-rec.gif)

Useful commands:

```bash
npm run lint           # ESLint on src/
npx tsc --noEmit       # Type-check only
npm test               # Full vitest suite
npm run test:core      # Core module tests
npm run test:tools     # Tool tests
npm run test:components # Shared component tests
npm run test:screens   # Screen tests
npm run test:hooks     # Hook tests
npm run test:watch     # Vitest watch mode
```

Run a single test file:

```bash
npx vitest run tests/core/jobs.test.ts
npx vitest run tests/tools/playbook.test.ts
npx vitest run tests/components/Sidebar.test.tsx
npx vitest run tests/screens/JobsScreen.test.tsx
npx vitest run tests/screens/SessionsScreen.test.tsx
```
![terminal-test-rec](recs/test-rec.gif)

Current suite expectation:

- `297/297` tests passing

## CI

Pull requests run the npm test workflow defined in `.github/workflows/npm-tests.yml`.

- suite-specific test runs for `core`, `tools`, `components`, `screens`, and `hooks`
- Node.js matrix coverage for `20`, `22`, and `24`


Maintainers then run the `Release stable-10` workflow manually and select the branch to release, typically `stable-10`, to publish npm and create the GitHub release.

## License

[MIT](LICENSE)
