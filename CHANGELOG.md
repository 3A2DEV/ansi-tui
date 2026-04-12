# Changelog

All notable changes to this project are documented here.

## 0.1.0 (Unreleased)

### Added

- Added a full-terminal workstation-style shell with a theme-aware header, grouped sidebar, framed dashboard, and compact footer.
- Added themes for `Cyan`, `Blue`, `White`, `Gray`, `Yellow`, `Violet`, `Red`, and `Neon`.
- Added workspace sessions for creating, selecting, editing, and deleting saved working contexts.
- Added per-session persistence for working directory, inventory, vault settings, extra vars, environment variables, tags, notes, and `ansible.cfg`.
- Added shared four-phase workflows for supported tool screens with action selection, parameter forms, command preview, and execution.
- Added support for `ansible-playbook`, `ansible-galaxy`, `ansible-vault`, `ansible-inventory`, `ansible-doc`, `ansible-config`, `ansible-lint`, `ansible-builder`, `ansible-creator`, `ansible-test`, `ansible-console`, and `ansible-pull` workflows.
- Added a `Jobs` screen with newest-first execution history, status badges, detail views, and deletion support.
- Added persistent per-session job history and execution log files.
- Added `LiveOutput` execution views with scrolling, pause and resume controls, elapsed time, wrapping, and ANSI-aware styling.
- Added `FormViewport` and `FieldNavigator` for bounded long-form rendering and shared keyboard navigation.
- Added `Ctrl+F` path picker support for path-capable form fields.
- Added proxy-aware execution using system and session proxy settings.
- Added automatic runtime and tool detection for the broader Ansible toolchain.
- Added offline installation support through `npm pack` and `install.sh --local`.
- Added suite-specific npm test commands for `core`, `tools`, `components`, `screens`, and `hooks`.
- Added pull request test coverage across Node `20`, `22`, and `24`.

### Changed

- Changed execution history storage from the older fragmented model to a jobs-based execution record.
- Changed the navigation rail to a grouped icon-driven sidebar with accordion sub-navigation for tool actions.
- Changed the dashboard layout to stacked panels that fit small terminals more reliably.
- Changed tool screens to use a shared `ToolScreenFrame` layout with consistent hints and status presentation.
- Changed session management to a stacked workspace screen with keyboard-driven list actions and create, edit, and delete flows.
- Changed the footer to a compact command strip that emphasizes the active screen context.
- Changed runtime and tool health reporting to use version chips, an availability matrix, and a static gradient health bar.
- Changed dashboard session details to use icon-led rows for workspace context values.
- Changed management navigation to keep only `Jobs` and `Sessions`.
- Changed form handling so path-capable fields can open a file or directory browser without leaving the shared workflow.
- Changed `ansible-test` to require a collection root, run from that directory, and expose richer sanity options.
- Changed command coverage across the tool surface to align more closely with the current local CLI.

### Fixed

- Fixed input handling so global shortcuts do not fire while users are typing in forms.
- Fixed sidebar navigation conflicts while non-home screens are active.
- Fixed text-field editing so left and right cursor movement works correctly in `ink-text-input`.
- Fixed long-form rendering and shell overflow by clipping content instead of letting the terminal grow.
- Fixed command output rendering to preserve blank lines.
- Fixed docs output behavior to support top-first reading and scrolling.
- Fixed OSC 8 hyperlink rendering by stripping hyperlinks before output is shown or logged.
- Fixed ANSI-heavy lint output rendering by using a layout-safe wrapped plain-text view.
- Fixed nested tool-screen panel sizing by relying on inherited frame width.
- Fixed jobs and logs cleanup so deleting a recorded job also removes its associated managed log file when present.
- Fixed sidebar sub-navigation so `Esc` returns home with the relevant accordion still open.
- Fixed active-session cleanup when the current session is deleted.
- Fixed `SessionsScreen` list-mode `Esc` behavior so it returns to the main navigation flow.
- Fixed `SessionsScreen` overlap by stacking cards vertically and tightening saved-session row spacing.
- Fixed path picker defaults so browsing starts from the current field value, then the active session working directory, then `process.cwd()`.
- Fixed form browsing by gating form navigation while the picker is open.
- Fixed `ansible-test` execution so it validates and runs from the collection root.
- Fixed `ansible-test` output rendering so unit, integration, and sanity output preserve their styling more faithfully.
- Fixed `ansible-pull` command building so repository URLs are passed as raw argv values.
- Fixed inventory command building to ignore unknown `outputFormat` values outside the runtime allowlist.
- Fixed jobs history file path construction by sanitizing `sessionId` before writing under `history/`.
- Fixed job deletion so only log files inside the managed `logs/` directory are eligible for removal.
- Fixed `ansible-config list` so it no longer exposes unsupported `--only-changed`.
- Fixed `ansible-pull` so it no longer exposes unsupported local-CLI become flags.
- Fixed `ansible-builder build` so it no longer exposes unsupported local-CLI `--pull`.
- Fixed `ansible-creator` so it no longer exposes the unsupported `init role` action.
- Fixed `ansible-test env` so it no longer inherits unsupported `--python`.
