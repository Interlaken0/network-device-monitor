# ADR-008: GitHub Flow over GitFlow for Branching

## Status
Accepted

## Context
The project needed a branching strategy that supports a small team / solo developer workflow while still enabling review and incremental delivery.

Requirements included:
- Simple, low-overhead branching
- Effective use of feature branches and PRs
- Fast merging to main for continuous progress
- Minimal release branch complexity for the apprenticeship timeline
- Clear alignment with GitHub-hosted repository practices

The team reviewed Git workflows after several sprints of branch and PR usage. The current repository already uses branch names like `feature/sprint-3-week-2`, and the project documentation references GitHub Flow as the preferred workflow.

## Decision
Selected **GitHub Flow** as the project branching strategy.

## Consequences

### Positive
- **Simple workflow** — Feature branches merge into `main` via pull requests, avoiding the overhead of long-lived release branches.
- **Fits the team size** — Lightweight process works well for a small team or individual contributor.
- **Supports frequent integration** — Encourages regular merging and reduces merge drift.
- **Aligns with GitHub tools** — Matches GitHub PR review, issue linking, and CI expectations.
- **Documentation already exists** — `docs/git-workflow.md` and architecture references confirm this choice.

### Negative
- **Less formal release management** — No dedicated `develop` or release branches means release coordination must be handled in PRs and tags.
- **Requires good PR discipline** — Developers must keep PRs small, reviewed, and merged frequently to avoid instability on `main`.
- **Not ideal for complex release gating** — If the project later needs multiple concurrent production releases, GitHub Flow may require process adaptation.

## Alternatives Considered

| Workflow | Why Rejected |
|----------|--------------|
| **GitFlow** | Too heavyweight for the current single-developer / small-team scope; requires long-lived `develop` and release branches, which adds overhead without clear benefit. |
| **Feature Branching (informal)** | Lacks formal PR rules and consistency; less visible process control than GitHub Flow. |
| **Trunk-Based Development** | Very fast, but too minimal for this project because it reduces the safety of review-based feature branches. |

## Related Decisions
- ADR-004: Zustand State Management (React renderer workflow relies on branch-based feature delivery)
- ADR-005: Chart Library Selection (Sprint 3 feature work delivered under feature branches)
- `docs/git-workflow.md` — Implementation guidance for GitHub Flow

## Implementation Notes

GitHub Flow in this repository includes:
- `main` as the primary branch
- feature branches for work, e.g. `feature/sprint-3-week-2`
- pull requests for review and merging
- straightforward merge-to-main after review
- no long-lived `develop` or release branches

Documentation and references:
- `docs/git-workflow.md` — branch naming, PR process, and sprint workflow
- `docs/architecture-decisions.md` — summary table includes ADR-008 acceptance
- `docs/technical-deep-dive.md` — Git workflow section with details

## References
- `docs/git-workflow.md` — current GitHub Flow convention
- `docs/architecture-decisions.md` — ADR summary entry for GitHub Flow
- Branch history examples: `feature/sprint-3-week-2`, `main`

---

**Decision Date:** 13th May 2026  
**Decided By:** Development Team  
**Last Updated:** 13th May 2026  
**Verified:** Repository branch names and workflow documentation indicate GitHub Flow as the current standard.