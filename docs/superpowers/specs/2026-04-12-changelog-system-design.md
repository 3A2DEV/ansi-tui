# Changelog System Design

**Date:** 2026-04-12
**Status:** Approved
**Tool:** towncrier

---

## Overview

Add a fragment-based changelog system to ansi-tui using [towncrier](https://towncrier.readthedocs.io/). Contributors add a small Markdown fragment file per PR. At release time, a maintainer runs `npm run changelog` to assemble all fragments into `CHANGELOG.md` and remove the consumed files.

No CI enforcement is required. Fragments are a release-time concern, not a PR gate.

---

## Configuration

A `towncrier.toml` file in the repo root configures towncrier to use Keep-a-Changelog categories and write to `CHANGELOG.md`.

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

---

## Fragment Format

Fragment files live in `changelogs/fragments/` and follow this naming convention:

```
changelogs/fragments/{PR_number}.{type}.md
```

**Types:** `added`, `changed`, `deprecated`, `removed`, `fixed`, `security`

**Example** — `changelogs/fragments/42.fixed.md`:
```
Fixed sidebar crash when no session is active on startup.
```

Content is a single Markdown sentence describing the user-facing change.

### Fork Workflow Note

Contributors on forks do not know their PR number before pushing. Acceptable workarounds:
- Use `0.{type}.md` as a placeholder and rename after the PR is opened.
- Name it freely (e.g. `fix-sidebar.fixed.md`) — a maintainer renames it to the PR number before merge.

---

## npm Script Integration

Two scripts are added to `package.json`:

| Script | Command | Effect |
|---|---|---|
| `changelog:draft` | `towncrier build --draft --version $(node -p "require('./package.json').version")` | Preview assembled output, no file changes |
| `changelog` | `towncrier build --version $(node -p "require('./package.json').version") --date $(date +%Y-%m-%d)` | Write to `CHANGELOG.md`, delete fragments |

Version is read automatically from `package.json`. Date is set to today via shell `date`.

### Release Workflow

1. `npm run changelog:draft` — preview what will be written
2. `npm run changelog` — write to `CHANGELOG.md` and delete fragments
3. Commit `CHANGELOG.md`, bump `package.json` version, tag the release

---

## Repository Changes

| File | Change |
|---|---|
| `towncrier.toml` | New — towncrier configuration |
| `changelogs/fragments/.gitkeep` | New — keeps the empty directory tracked |
| `package.json` | Add `changelog` and `changelog:draft` scripts |
| `.github/pull_request_template.md` | Add changelog fragment reminder section |
| `CONTRIBUTING.md` | Add *Changelog Fragments* section with workflow, types, and naming |

---

## Existing CHANGELOG.md

The current `CHANGELOG.md` contains a large manually written `## 0.1.0 (Unreleased)` block. This is kept as-is and becomes the historical record.

When 0.1.0 is released:
- towncrier prepends the assembled fragment block above the existing content
- The maintainer may trim the old manual block at their discretion
- towncrier owns all entries from this point forward

No automated migration of existing content into fragments is needed.

---

## Contributor Documentation

`CONTRIBUTING.md` gets a new *Changelog Fragments* section covering:
- What a fragment is and why it exists
- Naming convention and valid types
- How to write a good fragment (one sentence, user-facing)
- What to do when the PR number is not yet known
- When a fragment can be omitted (e.g. pure CI or internal tooling changes — maintainer discretion)

The PR template gets a checkbox:
```
- [ ] Added a changelog fragment in `changelogs/fragments/`
```
