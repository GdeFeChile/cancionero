# SDD Skill Registry
# Generated: 2026-06-08
# Scope: project (Cancionero GdeFe)

## Registry

| Name | Trigger | Path | Scope |
|------|---------|------|-------|
| branch-pr | Create Gentle AI pull requests with issue-first checks | ~/.config/opencode/skills/branch-pr/SKILL.md | user |
| chained-pr | PRs over 400 lines, stacked PRs, review slices | ~/.claude/skills/chained-pr/SKILL.md | user |
| cognitive-doc-design | Writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs | ~/.config/opencode/skills/cognitive-doc-design/SKILL.md | user |
| comment-writer | PR feedback, issue replies, reviews, Slack messages, or GitHub comments | ~/.config/opencode/skills/comment-writer/SKILL.md | user |
| customize-opencode | Editing/creating opencode's own configuration | ~/.config/opencode/skills/customize-opencode/SKILL.md | user |
| gepeto | Building 1-click launchers and apps using Pinokio | ~/.agents/skills/gepeto/SKILL.md | user |
| go-testing | Go tests, go test coverage, Bubbletea teatest, golden files | ~/.config/opencode/skills/go-testing/SKILL.md | user |
| issue-creation | Creating GitHub issues, bug reports, or feature requests | ~/.config/opencode/skills/issue-creation/SKILL.md | user |
| judgment-day | Judgment day, dual review, adversarial review, juzgar | ~/.config/opencode/skills/judgment-day/SKILL.md | user |
| pinokio | Discovering, launching, and using apps and tools | ~/.agents/skills/pinokio/SKILL.md | user |
| skill-creator | Creating new skills, agent instructions, documenting AI usage patterns | ~/.claude/skills/skill-creator/SKILL.md | user |
| skill-improver | Improving skills, auditing skills, refactoring skills, skill quality | ~/.config/opencode/skills/skill-improver/SKILL.md | user |
| work-unit-commits | Planning commits as reviewable work units | ~/.config/opencode/skills/work-unit-commits/SKILL.md | user |

## Convention Files

| File | Path | Scope |
|------|------|-------|
| AGENTS.md | ~/.config/opencode/AGENTS.md | user |
| AGENTS.md | /Users/salva/.config/opencode/AGENTS.md | user |

## Skipped Skills

The following were excluded per registry rules:
- `_shared/` (support package, not invokable)
- `sdd-*` skills (core SDD phases, managed by orchestrator)
- `skill-registry/` (registry management, not an invokable skill)
