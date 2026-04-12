# Contributing to ansi-tui

Thanks for contributing to `ansi-tui`.

This project is a terminal UI for Ansible engineers built with React, Ink, strict TypeScript, `execa`, and Vitest. The codebase is intentionally structured around small, predictable layers and a shared workflow shell. Contributions should preserve that consistency.

## Development Setup

```bash
git clone <repo-url>
cd ansi-tui
npm install
```

Run the app in watch mode:

```bash
npm run dev
```

Run the built app:

```bash
npm run build
npm start
```

## Common Commands

```bash
npm run build          # Bundle src/ to dist/ via tsup
npm run dev            # Watch mode
npm start              # Run built app
npm run lint           # ESLint on src/
npm run typecheck      # Type-check only
npx tsc --noEmit       # Type-check only
npm test               # Full vitest suite
npm run test:core      # Core module tests
npm run test:tools     # Tool tests
npm run test:components # Shared component tests
npm run test:screens   # Screen tests
npm run test:hooks     # Hook tests
npm run test:watch     # Watch mode
npm run pack:check     # Inspect publish tarball contents
npm run verify         # Typecheck + lint + tests + build
```

Run a single test file:

```bash
npx vitest run tests/core/jobs.test.ts
npx vitest run tests/tools/playbook.test.ts
npx vitest run tests/components/Sidebar.test.tsx
npx vitest run tests/screens/JobsScreen.test.tsx
```

Run a single test by name:

```bash
npx vitest run -t "builds basic run command"
npx vitest run tests/tools/playbook.test.ts -t "adds inventory flag"
```

Before finishing a code change, run:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Current suite expectation:

- `297/297` tests passing

Package verification before release:

```bash
npm run verify
npm run pack:check
```

## Release Notes

Current release path is manual.

Before publishing:

```bash
npm run verify
npm run pack:check
```

Then publish with npm using the package metadata in `package.json`.

## Project Structure

```text
src/
├── models/       # interfaces and shared types only
├── core/         # pure logic: detector, executor, jobs, proxy, session
├── tools/        # BaseTool subclasses, zero UI imports
├── hooks/        # React hooks wrapping core modules
├── components/   # reusable ink UI building blocks
├── screens/      # screen-level workflows and management views
├── App.tsx       # root routing, shell layout, global hotkeys
└── index.tsx     # entry point
tests/
├── core/
├── tools/
├── components/
├── screens/
└── hooks/
```

Important shared files:

- `src/components/theme.tsx`
- `src/components/PanelFrame.tsx`
- `src/components/ToolScreenFrame.tsx`
- `src/components/FormViewport.tsx`
- `src/components/FieldNavigator.tsx`
- `src/components/LiveOutput.tsx`
- `src/components/Sidebar.tsx`
- `src/core/jobs.ts`
- `src/hooks/useExecutor.ts`

## Architecture Rules

These rules are important. Most regressions in this project come from breaking one of them.

- `models/` contains types only, no logic
- `core/` stays pure: no UI or React imports
- `tools/` stays pure: no UI imports
- `screens/` compose hooks and components; they do not build commands directly
- `ParamSchema` drives tool forms; do not hardcode form fields in screens unless there is a real need
- Validation returns `ValidationError[]`; do not throw for normal validation failures
- Executor uses `reject: false`; non-zero exit codes are part of normal flow
- Use async file I/O
- Use `env-paths('ansi-tui')` for persisted paths; do not hardcode storage locations

## TypeScript And Import Rules

- strict TypeScript is required
- do not use `any`
- do not use `@ts-ignore`
- prefer interfaces for object shapes
- use `type` for unions and aliases
- use `import type` for type-only imports
- relative imports must use `.js` extensions
- Node builtins should use `node:` imports
- prefix intentionally unused params with `_`

Example:

```ts
import { join } from 'node:path';
import type { Session } from './session.js';
```

## UI And Ink Rules

`ansi-tui` is not a loose collection of screens. It is a shared shell with a consistent interaction model.

Current shell structure:

- top framed shell with static gradient banner and runtime metadata
- grouped left sidebar rail
- framed main body
- compact footer command strip

Do not reintroduce older layouts that overflow, duplicate content lower in the terminal, or bypass the shared shell components.

Prefer the shared components over one-off UI:

- `PanelFrame`
- `ToolScreenFrame`
- `FormField`
- `FormViewport`
- `FieldNavigator`
- `CommandPreview`
- `LiveOutput`
- `SessionBadge`
- `ToolStatusBadge`
- `BrailleSpinner`

When adding theme-aware UI:

- use `useThemePalette()`
- do not hardcode colors in shared shell components
- preserve contrast for `highlightText`
- prefer semantic palette fields over ad hoc values

## Input Handling Rules

Ink `useInput` is global. Treat that as a core constraint.

The current app model is:

- `App.tsx` tracks `inputMode: 'navigate' | 'form'`
- global shortcuts only fire when `inputMode === 'navigate'`
- sidebar input is disabled outside the home screen
- tool screens gate local handlers by phase or `isActive`

When touching keyboard handling:

- never let global shortcuts fire while typing in fields
- never let sidebar navigation fire while a tool form is active
- gate handlers with `isActive`, `disabled`, or current phase
- do not let `FieldNavigator` capture `leftArrow` or `rightArrow`
- always pass `focus={isFocused}` to `ink-text-input` `TextInput`

## Tool Screen Pattern

Every tool screen follows the same 4-phase flow:

```text
ACTION SELECT -> PARAMETER FORM -> COMMAND PREVIEW -> EXECUTE
     ^ Esc           ^ Esc              ^ Esc
```

Contributor expectations:

- render fields from `tool.getParamSchema(action)`
- pre-fill from the active session where appropriate
- validate before execution
- show the final argv in `CommandPreview`
- execute through `useExecutor()`
- render output through `LiveOutput`
- record runs as jobs automatically through the executor hook

## Jobs, Logs, And Persistence

The project uses a jobs-based execution record.

- `src/core/jobs.ts` is the source of truth for recorded runs
- `useExecutor()` appends completed runs via `appendJob()`
- `useHistory()` is only a compatibility wrapper around `readJobs()`
- `JobsScreen.tsx` is the supported UI for execution history
- do not reintroduce a separate `LogViewerScreen` path

Persisted data uses `env-paths('ansi-tui')` and is expected to look like this:

```text
<env-paths data dir>/
├── sessions/       # {uuid}.json per session
├── active_session  # active session id
├── history/        # {sessionId}.jsonl job history per session
└── logs/           # {timestamp}-{tool}.log execution output
```

## Output And Layout Gotchas

Keep these behavior constraints in mind when changing screens or output rendering:

- preserve blank lines in command output
- `ansible-lint` should stay in layout-safe wrapped/plain-text rendering
- docs output should remain scroll-friendly rather than forced auto-scroll
- long forms must stay bounded by `FormViewport`
- long output must stay bounded inside `LiveOutput`
- nested tool-screen panels should inherit width from shared layout instead of guessing from raw terminal width

## Testing

Add or update tests whenever logic changes.

Coverage currently exists in:

- `tests/core/`
- `tests/tools/`
- `tests/components/`
- `tests/screens/`
- `tests/hooks/`

Pull request CI:

- `.github/workflows/npm-tests.yml` runs suite-specific npm test commands
- the PR test matrix currently covers Node `20`, `22`, and `24`

Components using `useInput` must mock Ink:

```ts
vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink');
  return { ...actual, useInput: vi.fn() };
});
```

If you change shared labels, icons, screen text, or navigation wording, expect component and screen assertions to need updates.

## Adding A New Tool

1. Add `src/tools/<name>.ts` extending `BaseTool`
2. Implement `getActions()`, `getParamSchema()`, `buildCommand()`, and `validate()`
3. Add the tool name to `ANSIBLE_TOOLS` in `src/models/tool.ts`
4. Add `src/screens/<Name>Screen.tsx`
5. Wrap all phases with `ToolScreenFrame`
6. Use `FormViewport` in the form phase
7. Use shared `FieldNavigator`
8. Execute through `useExecutor()`
9. Add route handling in `src/App.tsx`
10. Add a navigation entry in `src/components/Sidebar.tsx`
11. Add tests in `tests/tools/<name>.test.ts`

## Documentation Updates

If your change affects behavior, update the relevant docs in the same PR.

Common files to keep aligned:

- `README.md` for user-facing functionality
- `CHANGELOG.md` for release notes
- `AGENTS.md` and `CLAUDE.md` for contributor/agent guidance when architectural rules or UI conventions change

## Changelog Fragments

Every pull request that changes behavior, fixes a bug, adds a feature, or removes something should include a changelog fragment.

Fragments live in `changelogs/fragments/` and are assembled into `CHANGELOG.md` at release time using [towncrier](https://towncrier.readthedocs.io/).

### Fragment naming

Fragment files follow this convention:

```
changelogs/fragments/{PR_number}.{type}.md
```

**Valid types:**

| Type | Use for |
|---|---|
| `added` | New features or capabilities |
| `changed` | Behavior changes to existing features |
| `deprecated` | Features that will be removed in a future release |
| `removed` | Features or options that have been removed |
| `fixed` | Bug fixes |
| `security` | Security-related fixes |

### Fragment content

One sentence. User-facing. Present or past tense is fine.

Good examples:

- `Fixed sidebar crash when no session is active on startup.`
- `Added Ctrl+F path browser support to all text fields with isPath enabled.`
- `Removed the deprecated LogViewerScreen navigation entry.`

### Fork workflow

If you are contributing from a fork, you won't know your PR number until after you push. Use `0.{type}.md` as a placeholder and rename it after the PR is opened, or leave it for a maintainer to rename before merge.

### When to skip

Fragments can be omitted for changes with no user-facing effect — for example, CI configuration updates, internal tooling changes, or pure test additions. This is at maintainer discretion.

### Release assembly

Maintainers assemble fragments at release time:

```bash
# Preview without writing
npm run changelog:draft

# Write to CHANGELOG.md and delete fragments
npm run changelog
```

---

## Pull Requests

Keep pull requests focused and easy to review.

Before opening a PR:

- keep the scope to one feature area or problem when possible
- include tests for new logic or changed behavior
- update documentation when behavior changes
- run type-check, lint, tests, and build
- call out any known limitations or follow-up work in the PR description

If your change is primarily visual, include a concise description of:

- what changed in the shell, screen, or component
- how it behaves on smaller terminals
- what keyboard/input behavior was affected
