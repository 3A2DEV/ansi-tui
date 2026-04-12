# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ansi-tui** is a terminal UI (TUI) for Ansible engineers — a full wizard-based wrapper around ansible-playbook, ansible-galaxy, ansible-vault, ansible-inventory, ansible-doc, ansible-config, ansible-lint, ansible-builder, ansible-creator, ansible-test, ansible-console, ansible-pull, and ansible-community.

Built with React + [ink](https://github.com/vadimdemedes/ink) (terminal renderer), TypeScript (strict mode), execa for subprocess spawning, and vitest for tests.

---

## Commands

```bash
npm run build        # Bundle src/ → dist/ via tsup (ESM, Node 18)
npm run dev          # Watch mode
npm start            # node dist/index.js

npm run lint         # ESLint on src/
npx tsc --noEmit     # Type-check without emitting

npm test             # Full vitest suite
npm run test:watch   # Watch mode

# Single test file
npx vitest run tests/core/proxy.test.ts
# Single test by name
npx vitest run tests/tools/playbook.test.ts -t "adds inventory flag"
```

Always run `npx tsc --noEmit` and `npm run lint` before committing. Run `npm test` after any logic change.

---

## Architecture

Strict layered separation — never import upward or sideways across layers:

```
models/     → TypeScript interfaces only, no logic
core/       → Pure logic, zero UI/React imports
tools/      → BaseTool subclasses, zero UI imports
hooks/      → React hooks wrapping core modules
utils/      → Pure helper functions, zero UI/React imports (e.g. pickerHelpers.ts)
components/ → Reusable ink components, zero business logic
screens/    → Tool-specific screens, compose hooks + components
App.tsx     → Root routing, screen rendering, global hotkeys
index.tsx   → Entry point
```

**Data storage** (via `env-paths('ansi-tui')`):
```
~/.local/share/ansi-tui/
├── sessions/       # {uuid}.json per session
├── active_session  # Active session ID
├── history/        # {sessionId}.jsonl (one ExecutedCommand per line)
└── logs/           # {TIMESTAMP}-{TOOLNAME}.log
```

---

## Core Patterns

### Tool Pattern

All tools extend `BaseTool` (`src/tools/base.ts`):

```typescript
abstract class BaseTool {
  abstract readonly name: string;                            // e.g. "ansible-playbook"
  abstract getActions(): string[];                           // e.g. ["run", "check", "diff"]
  abstract buildCommand(params: ToolParams): string[];      // Returns argv, never throws
  abstract validate(params: ToolParams): ValidationError[]; // Returns errors, never throws
  abstract getParamSchema(action: string): ParamSchema[];   // Drives form rendering
}
```

`ParamSchema` types: `'text' | 'select' | 'checkbox' | 'file' | 'password'`. Screens **never hardcode form fields** — they always render from `getParamSchema()`.
- `buildCommand()` must validate select-field values with a `Set` allowlist before constructing `--flag` strings — UI constraints alone are not sufficient since `buildCommand` is callable independently of the UI
- `isPath?: boolean` — opt-in for `type: 'text'` fields that accept filesystem paths; enables the Ctrl+F file browser
- `pathType?: 'file' | 'directory' | 'any'` — controls whether FilePicker selects files, directories, or both
- If the locally installed CLI differs from older docs or coverage notes, prefer the local `--help` output and align the tool surface to that

### Screen Pattern (4-Phase State Machine)

Every tool screen follows this exact flow:

```
ACTION SELECT → PARAMETER FORM → COMMAND PREVIEW → EXECUTE
     ↑ Esc           ↑ Esc              ↑ Esc
```

- **Form phase:** pre-fill fields from `activeSession` where applicable
- **Preview phase:** call `tool.validate(params)`, disable Run if errors exist
- **Execute phase:** stream output via `<LiveOutput>`, store execution records via `appendJob()`

### Session Pre-filling

Sessions store working context (inventory, vault settings, envVars, workingDir, etc.). Forms always pre-fill from `activeSession`. Session `lastUsed` is auto-updated on save.

### Jobs And Execution

- `src/core/jobs.ts` is the source of truth for recorded executions
- `useExecutor()` records completed runs via `appendJob()`
- `useHistory()` is a thin compatibility wrapper over `readJobs()`
- `JobsScreen.tsx` is the supported execution history UI
- Do not reintroduce a separate `LogViewerScreen`

## Input Handling

- `App.tsx` tracks `inputMode: 'navigate' | 'form'`
- Global shortcuts only fire when `inputMode === 'navigate'`
- Sidebar disabled on all non-home screens
- Always gate `useInput` handlers with `isActive` or screen phase — never let sidebar/global keys fire during form input

## Shell Layout

- Full-terminal shell: top framed shell → left sidebar rail → main body → compact footer
- Left: ASCII `ANSI-TUI` banner; right: route tabs + session/runtime header
- Do not revert to tall banner layout
- Main body uses `overflow="hidden"` — do not remove

## Theme System

Themes: `Cyan`, `Blue`, `White`, `Gray`, `Yellow`, `Violet`, `Red`, `Neon` (defined in `src/components/theme.tsx`)
- Use `useThemePalette()` in theme-aware components — never hardcode colors in shared shell components
- `highlightText` matters for contrast; preserve it
- Theme switching bound to `t` in `App.tsx`

---

### Executor & Proxy

`core/executor.ts` merges env before spawning:
```
system env → getProxyEnv(sessionEnv) → color defaults → sessionEnv (highest priority)
```

`core/proxy.ts` resolves `http_proxy`, `https_proxy`, `no_proxy` (both cases). Session envVars override system env.

---

## Shared UI Components

Prefer these over custom panel styles:
- `PanelFrame` — titled panel
- `ToolScreenFrame` — tool workflow shell (subtitle + hints + status)
- `FormField` — focused/editing state field block
- `FormViewport` — clipped form window with mini progress indicator
- `FieldNavigator` — up/down/tab/page navigation
- `CommandPreview` — framed command display
- `LiveOutput` — output panel with scrolling, spinner, wrap/plain-text modes
- `SessionBadge`, `ToolStatusBadge` — chip/status row components
- `FilePicker` — file/directory browser; props: `startPath`, `extensions?`, `allowDir?`, `title?`, `onSelect(path)`, `onCancel()`

## Dashboard Rules

Keep panels: `Session`, `Runtime`, `Health & Tool Matrix`, `Workspace Notes`
Do not re-add: `Workflow`, `Quick Readout` (removed intentionally)
Dashboard stacks vertically — do not switch to side-by-side without responsive width handling.

Current session panel behavior:
- use icon-led rows for name, path, inventory, vault, tags, and notes
- do not reintroduce the removed animated pulse dot

## Footer Rules

Current commands: `q` Quit, `s` Sessions, `t` Theme
Do not re-add: `Home`, `? Help`, `/ Search` (removed intentionally)

---

## Code Conventions

### TypeScript
- `strict: true` — no `any`, no `@ts-ignore`
- Interfaces for object shapes, `type` for unions
- Unused params: prefix with `_` (e.g. `_key`)

### ESM Imports
```typescript
import { join } from 'node:path'          // node: prefix required
import type { Session } from './session.js' // .js extension required
```

### React/ink Components
- Arrow function with `React.FC<Props>` type
- Props interface named `<ComponentName>Props`
- `useCallback` for event handlers, `useMemo` for derived values
- `useInput` from ink for keyboard handling

### Subprocess Execution
- `execa` always uses array mode (no shell) — never manually quote argument values; quoting is a correctness bug that passes literal `"` chars to the subprocess

### Validation
Never throw in validate — return `ValidationError[]`. Executor uses `{ reject: false }` on execa. File I/O returns `null` on missing, never throws.

---

## Testing Gotchas

Components using `useInput` from ink will fail with `stdin.ref is not a function` without this mock:

```typescript
vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return { ...actual, useInput: vi.fn() };
});
```

Test coverage: `tests/core/`, `tests/tools/`, `tests/components/`, `tests/screens/`.
- `tests/tools/pull.test.ts` exists and covers current `ansible-pull` argv behavior and local-CLI alignment regressions

Current suite expectation:
- `286/286` tests passing

---

## Adding a New Tool

1. `src/tools/<name>.ts` — extend `BaseTool`, implement 4 abstract methods, zero UI imports
2. `src/models/tool.ts` — add string literal to `ANSIBLE_TOOLS`
3. `src/screens/<Name>Screen.tsx` — 4-phase state machine, wrap all phases with `ToolScreenFrame`
4. Form phase: render fields via `FormViewport`, navigation via `FieldNavigator`
5. Execute phase: use `useExecutor()` hook + `appendJob()`
6. `src/App.tsx` — add `case 'toolname':` to `renderScreen` switch
7. `src/components/Sidebar.tsx` — add entry to the workspace navigation list
8. `tests/tools/<name>.test.ts` — test `buildCommand()`, `validate()`, `getParamSchema()`

## Sessions Screen Rules

`SessionsScreen.tsx` uses stacked panels in this order:
- `Active Workspace`
- `Saved Sessions`
- `Workspace Notes`

Behavior to preserve:
- list mode is keyboard-driven and supports `Enter`, `n`, `e`, and `d`
- create flow uses two steps: name, directory
- edit flow uses two steps: name, directory
- delete flow uses explicit confirmation
- `Esc` from list mode returns to the main navigation flow
- non-list modes switch app input mode to `form`

Do not revert to the older side-by-side session card layout.

## Sidebar Rules

`Sidebar.tsx` is grouped into `WORKSPACE` and `MANAGE`.

Management entries are:
- `Jobs`
- `Sessions`

Creator sub-actions currently align to the local CLI:
- `init collection`
- `init playbook`
- `init execution_env`
- `add resource`
- `add plugin`

Do not reintroduce removed navigation entries like `Collections` or `Log Viewer`.

## Practical Warnings

- Never use timer-driven state (`useState` + `setTimeout`/`setInterval` loop) for cosmetic animations in Ink components — every `setState` causes a full terminal repaint, which is visible as screen flashing. Use static values; reserve timers for functional feedback only (e.g. `BrailleSpinner` during live execution).
- `PanelWidthContext` is null in screen components — screens are parents of `ToolScreenFrame`, not children of it. Never call `useContext(PanelWidthContext)` in a screen. Compute content width directly: `Math.max(28, (process.stdout.columns ?? 120) - 38)` (= columns − sidebar 34 − PanelFrame chrome 4).
- `FieldNavigator` must NOT handle `leftArrow`/`rightArrow` — `ink-text-input` uses those for in-field cursor movement. Only `tab`/`upArrow`/`downArrow`/`pageUp`/`pageDown` are safe for field navigation. (`TextInput` explicitly ignores `upArrow`, `downArrow`, `tab`, `shift+tab`, `return` — those are safe to intercept.)
- Always pass `focus={isFocused}` to `ink-text-input`'s `TextInput` — omitting it defaults to `true`, meaning unfocused-but-rendered inputs would still capture keystrokes.
- `ansible-lint` output uses `plainText` + wrapped mode in `LiveOutput` — ANSI-heavy output breaks Ink layout
- Nested panels inside tool screens must inherit width from `ToolScreenFrame` — never guess terminal width
- `ansible --version` parsing feeds header/runtime metadata — keep detector parsing robust
- `FormViewport` clips long forms — do not bypass with fixed heights
- `ansible-test` must run with `cwd` set to the collection root (`ansible_collections/{namespace}/{collection}/`) — not the session workingDir; always use `params['collectionPath']` as `cwd` in `TestScreen`
- `FormViewport` now accepts `isActive?` and `onOpenPicker?` props; screens with path fields must pass `isActive={phase === 'form' && !pickerOpen}` to both `FormViewport` and `FieldNavigator` to avoid key conflicts with `FilePicker`
- `Ctrl+F` is the path browser activation key — Tab is taken (field nav), arrows are taken (cursor/field nav)
- Sessions screen create/edit/delete flows depend on switching `inputMode` correctly and preserving `Esc` back-navigation
- `.gitignore` blocks all `*.md` by default — new doc files need an explicit exception (e.g. `!docs/**/*.md`) or git silently refuses to stage them

---

## Changelog

Fragments: `changelogs/fragments/{PR}.{type}.md` — types: `added`, `changed`, `deprecated`, `removed`, `fixed`, `security`
Assembly: `npm run changelog:draft` (preview) → `npm run changelog` (write + delete fragments)
towncrier install on macOS: `brew install pipx && pipx install towncrier` (`pip install` blocked by PEP 668)
