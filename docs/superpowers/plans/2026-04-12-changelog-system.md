# Changelog System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate towncrier as the fragment-based changelog system so every PR ships a small YAML fragment and maintainers assemble them into `CHANGELOG.md` at release time via `npm run changelog`.

**Architecture:** towncrier reads fragment files from `changelogs/fragments/{PR}.{type}.md`, assembles them into `CHANGELOG.md` using Keep-a-Changelog categories, and deletes the consumed files. Configuration lives in `towncrier.toml`. Two npm scripts wrap towncrier: `changelog:draft` (preview, no writes) and `changelog` (write + delete).

**Tech Stack:** [towncrier](https://towncrier.readthedocs.io/) (Python CLI), Node.js npm scripts, Markdown fragment files.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `towncrier.toml` | towncrier config: fragment dir, CHANGELOG path, Keep-a-Changelog types, format |
| Create | `changelogs/fragments/.gitkeep` | Keeps the empty directory tracked by git |
| Modify | `package.json` | Add `changelog` and `changelog:draft` scripts |
| Modify | `.github/pull_request_template.md` | Add changelog fragment reminder checkbox |
| Modify | `CONTRIBUTING.md` | Add *Changelog Fragments* section |

---

### Task 1: Create towncrier.toml

**Files:**
- Create: `towncrier.toml`

- [ ] **Step 1: Verify towncrier is installed**

```bash
towncrier --version
```

Expected: prints something like `towncrier, version 24.x.x`

If not installed:
```bash
pip install towncrier
```

- [ ] **Step 2: Create `towncrier.toml`**

Create the file at the repo root with this exact content:

```toml
[tool.towncrier]
filename = "CHANGELOG.md"
directory = "changelogs/fragments"
title_format = "## {version} ({project_date})"
issue_format = "#{issue}"
underlines = ["", "", ""]

[[tool.towncrier.type]]
directory = "added"
name = "Added"
showcontent = true

[[tool.towncrier.type]]
directory = "changed"
name = "Changed"
showcontent = true

[[tool.towncrier.type]]
directory = "deprecated"
name = "Deprecated"
showcontent = true

[[tool.towncrier.type]]
directory = "removed"
name = "Removed"
showcontent = true

[[tool.towncrier.type]]
directory = "fixed"
name = "Fixed"
showcontent = true

[[tool.towncrier.type]]
directory = "security"
name = "Security"
showcontent = true
```

- [ ] **Step 3: Commit**

```bash
git add towncrier.toml
git commit -m "chore: add towncrier configuration"
```

---

### Task 2: Create fragment directory

**Files:**
- Create: `changelogs/fragments/.gitkeep`

- [ ] **Step 1: Create the directory and `.gitkeep`**

```bash
mkdir -p changelogs/fragments
touch changelogs/fragments/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add changelogs/fragments/.gitkeep
git commit -m "chore: add changelogs/fragments directory"
```

---

### Task 3: Add npm scripts and smoke test

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts to `package.json`**

In the `"scripts"` block, add these two entries after `"verify"`:

```json
"changelog:draft": "towncrier build --draft --version $(node -p \"require('./package.json').version\")",
"changelog": "towncrier build --version $(node -p \"require('./package.json').version\") --date $(date +%Y-%m-%d)"
```

The full `scripts` block should look like:

```json
"scripts": {
  "build": "tsup",
  "dev": "tsup --watch",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:core": "vitest run tests/core",
  "test:tools": "vitest run tests/tools",
  "test:components": "vitest run tests/components",
  "test:screens": "vitest run tests/screens",
  "test:hooks": "vitest run tests/hooks",
  "test:package": "vitest run tests/package",
  "test:watch": "vitest",
  "lint": "eslint src --ext .ts,.tsx",
  "pack:check": "npm pack --dry-run",
  "verify": "npm run typecheck && npm run lint && npm test && npm run build",
  "prepack": "npm run build",
  "changelog:draft": "towncrier build --draft --version $(node -p \"require('./package.json').version\")",
  "changelog": "towncrier build --version $(node -p \"require('./package.json').version\") --date $(date +%Y-%m-%d)"
}
```

- [ ] **Step 2: Create a sample fragment for smoke testing**

```bash
echo "Fixed sidebar crash when no session is active on startup." > changelogs/fragments/0.fixed.md
```

- [ ] **Step 3: Run `changelog:draft` and verify output**

```bash
npm run changelog:draft
```

Expected output (printed to stdout, no file modified):

```
Loading template...
Finding news fragments...
Rendering news fragment...
Draft only -- nothing has been written.
What is seen below is what would be written.

## 0.1.0 (2026-04-12)

### Fixed

- Fixed sidebar crash when no session is active on startup. (#0)
```

If the output matches this shape, the config is correct.

- [ ] **Step 4: Delete the sample fragment**

```bash
rm changelogs/fragments/0.fixed.md
```

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: add changelog and changelog:draft npm scripts"
```

---

### Task 4: Update PR template

**Files:**
- Modify: `.github/pull_request_template.md`

- [ ] **Step 1: Read the current template**

Open `.github/pull_request_template.md`. Current content:

```markdown
##### SUMMARY
<!--- Describe the change below, including rationale and design decisions -->


<!--- HINT: Include "Fixes #nnn" if you are fixing an existing issue -->


##### ISSUE TYPE
<!--- Pick one or more below and delete the rest. -->
- Bugfix Pull Request
- Docs Pull Request
- Feature Pull Request
- New Tools Request
- Refactoring Pull Request
- Test Pull Request

##### COMPONENT NAME
<!--- Write the NAME/PATH/STRUCTURE of the tool component below. -->

##### ADDITIONAL INFORMATION
<!--- Include additional information to help people understand the change here -->
<!--- A step-by-step reproduction of the problem is helpful if there is no related issue -->

<!--- Paste verbatim command output below, e.g. before and after your change -->
```paste below

```
```

- [ ] **Step 2: Add the changelog fragment section**

Replace the entire file content with:

```markdown
##### SUMMARY
<!--- Describe the change below, including rationale and design decisions -->


<!--- HINT: Include "Fixes #nnn" if you are fixing an existing issue -->


##### ISSUE TYPE
<!--- Pick one or more below and delete the rest. -->
- Bugfix Pull Request
- Docs Pull Request
- Feature Pull Request
- New Tools Request
- Refactoring Pull Request
- Test Pull Request

##### COMPONENT NAME
<!--- Write the NAME/PATH/STRUCTURE of the tool component below. -->

##### CHANGELOG FRAGMENT
<!--- Add a changelog fragment file to changelogs/fragments/{PR_number}.{type}.md -->
<!--- Valid types: added, changed, deprecated, removed, fixed, security -->
<!--- Example filename: 42.fixed.md — Example content: Fixed sidebar crash on startup. -->
- [ ] Added `changelogs/fragments/{PR_number}.{type}.md`

##### ADDITIONAL INFORMATION
<!--- Include additional information to help people understand the change here -->
<!--- A step-by-step reproduction of the problem is helpful if there is no related issue -->

<!--- Paste verbatim command output below, e.g. before and after your change -->
```paste below

```
```

- [ ] **Step 3: Commit**

```bash
git add .github/pull_request_template.md
git commit -m "chore: add changelog fragment reminder to PR template"
```

---

### Task 5: Update CONTRIBUTING.md

**Files:**
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Add the Changelog Fragments section**

In `CONTRIBUTING.md`, locate the `## Pull Requests` section near the bottom. Insert the following new section **immediately before** it:

```markdown
## Changelog Fragments

Every pull request that changes behavior, fixes a bug, adds a feature, or removes something should include a changelog fragment.

Fragments live in `changelogs/fragments/` and are assembled into `CHANGELOG.md` at release time using [towncrier](https://towncrier.readthedocs.io/).

### Fragment naming

Fragment files follow this convention:

    changelogs/fragments/{PR_number}.{type}.md

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

One sentence. User-facing. Present tense or past tense is fine. No trailing full stop required.

Good examples:
- `Fixed sidebar crash when no session is active on startup.`
- `Added Ctrl+F path browser support to all text fields with isPath enabled.`
- `Removed the deprecated LogViewerScreen navigation entry.`

### Fork workflow

If you are contributing from a fork, you won't know your PR number until after you push. Use `0.{type}.md` as a placeholder and rename it after the PR is opened, or leave it for a maintainer to rename before merge.

### When to skip

Fragments can be omitted for changes that have no user-facing effect — for example, CI configuration updates, internal tooling changes, or pure test additions. This is at maintainer discretion.

```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add changelog fragment workflow to CONTRIBUTING.md"
```

---

## Verification

After all tasks are complete, run a full end-to-end check:

```bash
# 1. Confirm towncrier config is valid
towncrier --version

# 2. Create a real test fragment
echo "Added towncrier-based changelog fragment system." > changelogs/fragments/0.added.md

# 3. Preview the draft
npm run changelog:draft
# Expected: shows "## 0.1.0 (today)" with "### Added" section

# 4. Clean up test fragment
rm changelogs/fragments/0.added.md

# 5. Confirm no uncommitted changes remain
git status
# Expected: clean working tree
```
