# Changelog

All notable changes to this project are documented here.

## 0.1.0 (Unreleased)

### Added

- Full-terminal workstation-style shell built with React + Ink
- Static gradient ASCII `ANSI-TUI` banner and shell header with session and runtime metadata
- Grouped navigation rail with `WORKSPACE` and `MANAGE` sections
- Theme system with `Cyan`, `Blue`, `White`, `Gray`, `Yellow`, `Violet`, `Red`, and `Neon`
- Home dashboard panels for `Session`, `Runtime`, `Health & Tool Matrix`, and `Workspace Notes`
- Session management for creating, selecting, editing, and deleting workspace sessions
- Per-session persistence for working directory, inventory, vault settings, extra vars, environment variables, tags, notes, and `ansible.cfg`
- Shared 4-phase workflow pattern across tool screens: action select -> parameter form -> command preview -> execute
- `FormViewport` and `FieldNavigator` for clipped long forms and shared keyboard navigation
- `LiveOutput` panel with scroll controls, pause/resume, running spinner, elapsed time, and wrapped output support
- `Jobs` screen with newest-first execution history, status badges, session names, target extraction, detail view, and deletion
- Automatic log pruning on app startup to limit retained `.log` files
- Persistent structured execution records stored as per-session JSONL job history
- Automatic execution log files written for each run
- Proxy-aware execution using system and session proxy variables
- Offline install path via `npm pack` and `install.sh --local`
- Sidebar accordion sub-navigation for tool actions with direct entry into form phase
- Session edit flow and delete confirmation flow in `SessionsScreen`
- Shared path picker flow for form fields using `Ctrl+F`
- `usePathPicker` hook and picker start-path helper for reusable form integration
- Suite-specific npm test scripts for `core`, `tools`, `components`, `screens`, and `hooks`
- Pull request npm test workflow covering Node `20`, `22`, and `24`

### Changed

- Replaced the older fragmented history/log-viewer model with a jobs-based execution record
- Replaced the plain navigation rail with icon-driven grouped sidebar navigation and virtual scrolling
- Reworked the shell layout to stay anchored to the top of the terminal with explicit shell, body, and footer sizing
- Reworked the dashboard into stacked panels to avoid overflow and narrow-terminal breakage
- Updated tool screens to use a shared `ToolScreenFrame` shell and consistent hints/status presentation
- Updated session UX to a stacked workspace management screen with keyboard-driven list actions and create/edit/delete flows
- Updated footer behavior to a compact command strip showing active screen context, without the older Home shortcut
- Updated runtime/tool health reporting to show version chips, availability matrix, and a static gradient health bar
- Updated dashboard session details to use icon-led rows for name, path, inventory, vault, tags, and notes
- Updated sidebar management navigation to keep only `Jobs` and `Sessions`
- Updated form infrastructure so path-capable fields can open a file or directory browser without leaving the shared form flow
- Updated `ansible-test` to require a collection root path, use it as execution `cwd`, and expose richer sanity options
- Updated `LiveOutput` to parse ANSI SGR styles instead of showing raw escape sequences for colored tools
- Expanded command coverage across the tool surface to match the current local CLI more closely, including new playbook, galaxy, vault, doc, config, lint, builder, creator, console, pull, and test actions and options

### Fixed

- Scoped Ink input handling so global shortcuts do not fire while typing in forms
- Disabled sidebar navigation while non-home screens are active to prevent conflicting key handlers
- Fixed field editing so left/right cursor movement works inside `ink-text-input`
- Fixed long-form rendering and shell overflow by clipping content instead of letting the terminal grow
- Fixed output rendering to preserve blank lines from Ansible command output
- Fixed docs output behavior to support top-first reading and scrolling
- Fixed layout breakage from OSC 8 hyperlinks by stripping them before rendering and logging
- Fixed ANSI-heavy lint output handling by using layout-safe wrapped rendering
- Fixed nested tool-screen panel width issues by relying on inherited frame width rather than raw terminal guesses
- Fixed jobs/log management so deleting a recorded job also removes its associated log file when present
- Fixed sidebar sub-navigation so `Esc` from sub-navigation-launched tool flows returns home with the relevant accordion still open
- Fixed session deletion so removing the active session clears the active-session pointer safely
- Fixed `SessionsScreen` list-mode `Esc` handling so it returns to the main navigation flow
- Fixed `SessionsScreen` panel overlap by stacking cards vertically and tightening saved-session row spacing
- Fixed file/directory browsing so path pickers default to the current field value, then the active session working directory, then `process.cwd()`
- Fixed form input browsing by connecting the existing `FilePicker` to `FormViewport` and gating form navigation while the picker is open
- Fixed `ansible-test` execution so it validates and runs from the collection root instead of blindly using the session working directory
- Fixed `ansible-test` output rendering so units, integration, and sanity preserve their original color/styling more faithfully
- Fixed `ansible-pull` command building so repository URLs are passed as raw argv values instead of literal quoted strings
- Fixed inventory command building to ignore unknown `outputFormat` values outside the runtime allowlist
- Fixed jobs history file path construction by sanitizing `sessionId` before writing under `history/`
- Fixed job deletion so only log files inside the managed `logs/` directory are eligible for unlinking
- Fixed `ansible-config list` so it no longer exposes unsupported `--only-changed`
- Fixed `ansible-pull` so it no longer exposes unsupported local-CLI become flags
- Fixed `ansible-builder build` so it no longer exposes unsupported local-CLI `--pull`
- Fixed `ansible-creator` navigation and tool actions so invalid local action `init role` is no longer exposed
- Fixed `ansible-test env` so it no longer inherits unsupported `--python`

### Tool Workflows

- `ansible-playbook`
  - actions: `run`, `check`, `diff`, `syntax-check`, `list-hosts`, `list-tasks`, `list-tags`
  - supports inventory, limit, tags, skip-tags, extra vars, verbosity, forks, connection, private key, module path, become controls, vault prompts/files, SSH args, cache flushing, handler forcing, start-at-task, and step mode
- `ansible-galaxy`
  - actions: `role install`, `role list`, `role remove`, `role init`, `role search`, `role info`, `role import`, `role delete`, `role setup`, `collection install`, `collection list`, `collection init`, `collection build`, `collection publish`, `collection download`, `collection verify`
  - supports target names, requirements files, force/upgrade, server URL, API tokens, cert controls, install-time timeout/dependency flags, roles path, collections path, init path, and collection build/publish/download/verify flows
- `ansible-vault`
  - actions: `create`, `encrypt`, `decrypt`, `view`, `edit`, `rekey`, `encrypt_string`
  - supports vault password files, vault IDs, vault prompts, encrypt-vault-id, output files, rekey password rotation, skip-tty-check, and string encryption naming/prompt controls
- `ansible-inventory`
  - actions: `list`, `host`, `graph`
  - supports inventory source, output format, export mode, vars view, host lookup, graph groups, output files, limits, extra vars, vault controls, cache flushing, and playbook-dir
- `ansible-doc`
  - actions: `lookup`, `list`, `list_files`, `metadata-dump`
  - supports plugin lookup, collection filtering, plugin type selection, snippet mode, text/json output, roles path, entry point, module path, and playbook-dir
- `ansible-config`
  - actions: `list`, `dump`, `view`, `init`, `validate`
  - supports alternate config file selection, type/format filtering, dump-only changed filtering, validation, and sample config generation
- `ansible-lint`
  - actions: `run`, `list-rules`, `list-tags`, `list-profiles`
  - supports profiles, custom rules dir, excludes, skip lists, auto-fix, strict mode, tags, warn lists, config/ignore files, project dir, enable-list, SARIF output, offline mode, and multiple output formats
- `ansible-builder`
  - actions: `build`, `create`, `introspect`
  - supports definition files, image tags, container runtime, build context, verbosity, no-cache, build args, prune-images, squash, output filename, and Galaxy signature options
- `ansible-creator`
  - actions: `init collection`, `init playbook`, `init execution_env`, `add resource`, `add plugin`
  - supports namespace, collection name, project name, execution environment name, output directory, project root, resource type, plugin type, plugin name, and overwrite behavior aligned to the local CLI
- `ansible-test`
  - actions: `units`, `integration`, `sanity`, `coverage`, `env`, `shell`, `network-integration`, `windows-integration`
  - supports collection path, test target, Python version, verbosity, container mode selection, Docker image overrides, remote target, requirements file, coverage/change detection controls, sanity test filtering, and `--list-tests`
- `ansible-console`
  - actions: `start`
  - supports host pattern, inventory, host limit, become controls, module path, vault prompts/files, forks, extra vars, verbosity, connection settings, playbook-dir, task-timeout, step/check/diff, cache flushing, and host listing
- `ansible-pull`
  - actions: `pull`
  - supports URL, checkout ref, working directory, playbook, module path, extra vars, tags, skip-tags, limit, full/clean/track-subs, host-key acceptance, module name, force/only-if-changed, sleep, inventory, cache flushing, host listing, vault prompts/files, connection settings, and SSH args

### Runtime Detection

- Detects runtime metadata including ansible-core, Python, Jinja, PyYAML, active config file, and collection path
- Detects tool availability/version across the broader Ansible tool matrix, including `ansible`, `ansible-playbook`, `ansible-galaxy`, `ansible-vault`, `ansible-doc`, `ansible-inventory`, `ansible-config`, `ansible-lint`, `ansible-test`, `ansible-builder`, `ansible-creator`, `ansible-console`, `ansible-pull`, and `ansible-community`

### UI Components

- `PanelFrame` for reusable framed panels
- `ToolScreenFrame` for workflow shell layout
- `FormField` for focused/editing field rendering
- `FormViewport` for bounded long-form rendering and picker activation
- `FilePicker` for file and directory browsing in path-capable fields
- `FieldNavigator` for shared keyboard navigation across forms
- `CommandPreview` for exact command display before execution
- `LiveOutput` for streaming execution output with ANSI-aware styled rendering
- `Sidebar` for grouped navigation with icons and status values
- `SessionBadge` and `ToolStatusBadge` for compact status presentation
- `BrailleSpinner` and `useAnimation` for shared animation behavior
- `usePathPicker` and picker helpers for reusable path-browsing workflows

### Execution And Storage

- Uses `env-paths('ansi-tui')` for portable data storage locations
- Stores sessions under `sessions/` and the active session pointer in `active_session`
- Stores job history under `history/{sessionId}.jsonl`
- Stores execution logs under `logs/{timestamp}-{tool}.log`
- Merges execution environment in this order: system env -> proxy env -> color defaults -> session env
- Forces color-friendly execution defaults for better terminal rendering
- Uses `reject: false` so non-zero exit codes remain part of normal UI flow

### Development And Quality

- Strict TypeScript with ESM imports and `.js` relative import extensions
- Bundled with `tsup`
- Linted with ESLint and `@typescript-eslint`
- Tested with Vitest across core modules, tools, components, screens, and hooks
- Expanded Vitest coverage to include dedicated tests for `config`, `console`, `doc`, `lint`, `builder`, `creator`, and hook-level path-picker behavior
- Added picker-related coverage for `FilePicker`, `FormViewport`, `FormField`, and `usePathPicker`
- Expanded tool coverage tests for `pull`, `config`, `builder`, `creator`, and `test` local-CLI alignment regressions
- Current suite status: `286/286` tests passing
