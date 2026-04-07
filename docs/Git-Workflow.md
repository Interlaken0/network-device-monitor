# Git Workflow & Conventions

**Project:** AMF Network Device Monitor  
**Strategy:** GitHub Flow  
**Language:** British English (all commits, comments, documentation)  

---

## Branching Strategy

We use **GitHub Flow** - simple, effective for single developer with review points.

```
main (protected) ◄────── production-ready
  │
  ├── feature/device-crud ─── PR ──► squash merge
  │
  ├── feature/ping-engine ─── PR ──► squash merge
  │
  └── hotfix/security-patch ─ PR ──► merge commit (if needed)
```

### Branch Naming Convention

```
type/description-in-kebab-case

Types:
  feature/     New functionality (e.g., feature/device-crud)
  bugfix/      Bug fixes (e.g., bugfix/ping-timeout)
  hotfix/      Critical production fixes (e.g., hotfix/security-patch)
  docs/        Documentation only (e.g., docs/api-reference)
  refactor/    Code restructuring (e.g., refactor/database-layer)
  test/        Test additions (e.g., test/ping-service)
  chore/       Maintenance (e.g., chore/update-dependencies)
```

### Protected Branch Rules (main)

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (tests, lint)
- ✅ Require branches to be up to date before merging
- ✅ Require linear history (no merge commits for features)
- ✅ Include administrators

---

## Commit Message Convention

### Format

```
type(scope): Subject in British English (imperative mood, max 50 chars)

Body explaining what changed and why (max 72 chars per line).
Can span multiple lines for complex changes.

Refs: #123
```

### Types

| Type | Use When | Example |
|------|----------|---------|
| **feat** | New feature | `feat(ping): add concurrent monitoring` |
| **fix** | Bug fix | `fix(database): handle connection timeout` |
| **docs** | Documentation | `docs(readme): update installation steps` |
| **style** | Code style (formatting) | `style(components): standardise indentation` |
| **refactor** | Code restructuring | `refactor(store): migrate to Zustand` |
| **perf** | Performance improvement | `perf(charts): implement data decimation` |
| **test** | Tests only | `test(ping): add timeout scenario` |
| **chore** | Maintenance | `chore(deps): update electron` |
| **security** | Security fix | `security(ipc): validate all channels` |

### Scopes

```
main          Main process code
renderer      Renderer process code
preload       Preload scripts
database      Database layer
ipc           IPC handlers
components    React components
ping          Ping service
dashboard     Dashboard UI
alerts        Alert system
security      Security-related
docs          Documentation
test          Test infrastructure
tooling       Build/config
```

### British English Compliance

All commits must use **British English** spelling:

| British | American | Example |
|---------|----------|---------|
| colour | color | `feat(dashboard): add colour coding` |
| behaviour | behavior | `fix(ping): correct error behaviour` |
| centre | center | `style(css): centre the status card` |
| organise | organize | `refactor(utils): organise helper functions` |
| dialogues | dialogs | `feat(ui): improve confirmation dialogues` |
| grey | gray | `style(theme): use grey for warnings` |
| cancelled | canceled | `fix(alerts): show cancelled status` |

### Commit Examples

**Good Commits:**
```
feat(dashboard): implement latency trend charts

Added Recharts line chart component displaying historical
latency data. Includes 5min, 1hr, 24hr time range selection.
Implements data decimation for performance.

Refs: #45
KSBs: S2, S16
```

```
fix(database): correct cascade delete behaviour

Previously, deleting a device left orphaned ping_logs in the
database. Added ON DELETE CASCADE to foreign key constraint
ensuring referential integrity.

Closes: #67
KSBs: K10, S1
```

```
docs(api): document IPC channel protocols

Added comprehensive JSDoc documentation for all IPC channels
including request/response schemas and error handling patterns.

Refs: #12
KSBs: S15, K4
```

```
security(ipc): implement channel whitelisting

Added VALID_CHANNELS array to preload.js preventing
arbitrary IPC channel access from renderer process.
Includes error logging for blocked attempts.

Refs: #89
KSBs: S17, K8
```

**Bad Commits (Avoid):**
```
updated some stuff                    ← No type, vague
fix bug                               ← No scope, no detail
feat: add feature                     ← American spelling (colour/color)
WIP: dashboard changes                ← WIP in history
```

---

## Pull Request Process

### PR Template

Every PR must use this template:

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Performance improvement
- [ ] Security fix

## KSB Evidence
Select all that apply:
- [ ] S1: Logical code (describe: _______________)
- [ ] S2: User interfaces (describe: _______________)
- [ ] S3: Link code to data (describe: _______________)
- [ ] S4: Unit testing (describe: _______________)
- [ ] S5: Testing types (describe: _______________)
- [ ] S6: Test scenarios (describe: _______________)
- [ ] S7: Debugging (describe: _______________)
- [ ] S8: Software designs (describe: _______________)
- [ ] S9: Analysis artefacts (describe: _______________)
- [ ] S10: Build & deploy (describe: _______________)
- [ ] S11: Development approach (describe: _______________)
- [ ] S12: Specifications (describe: _______________)
- [ ] S13: Testing frameworks (describe: _______________)
- [ ] S14: Version control (describe: _______________)
- [ ] S15: Communication (describe: _______________)
- [ ] S16: Algorithms (describe: _______________)
- [ ] S17: Security (describe: _______________)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] Test coverage maintained/improved (attach screenshot)

## Security Checklist
- [ ] Security Checklist reviewed (docs/Security-Checklist.md)
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] IPC channels validated
- [ ] No sensitive data in logs

## Code Quality
- [ ] British English used throughout
- [ ] Self-review completed
- [ ] No console.log statements (use logger)
- [ ] JSDoc comments added for public APIs
- [ ] ESLint passes with no warnings

## Screenshots (if UI changes)
Before/After screenshots or GIFs.

## Related Issues
Closes #123
Refs #456
```

### PR Review Criteria

**Developer Checklist (before requesting review):**
- [ ] Branch up to date with `main`
- [ ] All tests passing (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Security checklist reviewed
- [ ] British English verified
- [ ] PR template completed

**Reviewer Checklist (Line Manager):**
- [ ] Code follows project conventions
- [ ] KSB evidence clearly documented
- [ ] Tests adequate for change
- [ ] Security implications considered
- [ ] British English compliance

### Merge Strategy

| Branch Type | Merge Strategy | Why |
|-------------|----------------|-----|
| `feature/*` | **Squash and merge** | Clean linear history |
| `bugfix/*` | **Squash and merge** | Clean linear history |
| `hotfix/*` | **Merge commit** | Preserve context if urgent |
| `docs/*` | **Squash and merge** | Clean history |

---

## Git Hooks (Husky)

### Configuration

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-push": "npm run test:unit"
    }
  },
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.md": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### Commitlint Config

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'security']
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72],
    'references-empty': [1, 'never'] // Warning if no refs
  }
};
```

---

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR - Breaking changes
MINOR - New features (backward compatible)
PATCH - Bug fixes (backward compatible)
```

### Version Bumping

```bash
# Patch release (bug fixes)
npm version patch
# 1.0.0 → 1.0.1

# Minor release (features)
npm version minor
# 1.0.0 → 1.1.0

# Major release (breaking)
npm version major
# 1.0.0 → 2.0.0
```

### Tagging

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Sprint 2 release - Device CRUD complete"

# Push tag
git push origin v1.0.0

# List tags
git tag -l
```

### Release Checklist

- [ ] Version bumped in `package.json`
- [ ] Tag created with `v` prefix (e.g., `v1.0.0`)
- [ ] Release notes drafted
- [ ] Security checklist completed
- [ ] Tests passing on tag
- [ ] Build successful
- [ ] Installer packaged

---

## Daily Workflow

### Starting Work

```bash
# 1. Update main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/device-crud

# 3. Push branch to remote
git push -u origin feature/device-crud
```

### During Development

```bash
# Regular commits
git add .
git commit -m "feat(database): add device schema

Create devices table with validation constraints.
Includes prepared statement caching.

Refs: #12
KSBs: K10, S1"

# Push frequently
git push
```

### Completing Work

```bash
# 1. Update branch with main
git checkout main
git pull origin main
git checkout feature/device-crud
git rebase main

# 2. Final push
git push

# 3. Create PR via GitHub/GitLab UI
# Use PR template

# 4. After review approval, merge via UI (squash)

# 5. Delete branch
git checkout main
git branch -d feature/device-crud
git push origin --delete feature/device-crud
```

---

## Common Git Commands

### Useful Aliases

```bash
# Add to ~/.gitconfig
[alias]
  s = status
  co = checkout
  cob = checkout -b
  cm = commit -m
  amend = commit --amend --no-edit
  pushf = push --force-with-lease
  undo = reset HEAD~1 --mixed
  stash-all = stash save -u
  lg = log --graph --oneline --decorate --all
```

### Recovering from Mistakes

```bash
# Undo last commit (keep changes)
git reset HEAD~1 --mixed

# Undo last commit (discard changes)
git reset HEAD~1 --hard

# Undo last commit (after push) - creates revert commit
git revert HEAD

# Recover deleted branch
git reflog
git checkout -b recovered-branch HEAD@{5}

# Unstage files
git reset HEAD <file>

# Discard file changes
git checkout -- <file>
```

---

## Sprint Git Workflow

### Sprint Start

1. Review backlog with Product Owner
2. Create branches for each story
3. Update PR template with sprint goals

### Daily Standup (Git Activity)

- Review yesterday's commits
- Check branch status
- Identify merge blockers

### Sprint End

1. Ensure all stories merged to `main`
2. Create release tag
3. Run full test suite on tag
4. Package application
5. Update sprint documentation

---

## KSB Evidence Mapping

| Git Practice | KSB | Evidence |
|--------------|-----|----------|
| Commit conventions | S14 | Commit history |
| Branch strategy | S14 | Branch graph |
| PR templates | S14 | PR history |
| Code review | B4 | PR comments |
| Version tagging | S10 | Tags list |
| British English | S15 | Commit messages |
| Git hooks | S10 | husky config |

---

## Git Log Example (Target)

```
* 8a3f2d1 (HEAD -> main, tag: v1.2.0) feat(release): Sprint 3 complete
* 9b4e7c2 fix(dashboard): correct latency display
* 7c2d1a4 feat(charts): add 24hr time range
* 6a1b9f3 docs(user-stories): update acceptance criteria
* 5f0a8e2 refactor(ping): optimise monitoring loop
* 4e9c7d1 test(ping): add concurrency tests
* 3d8b6c0 fix(security): validate IPC channels
* 2c7a5b9 (tag: v1.1.0) feat(release): Sprint 2 complete
* 1b6a4f8 feat(device): implement edit functionality
* ...
```

**Characteristics:**
- Clear type/scope prefixes
- British English throughout
- Linear history (no merge commits)
- Tags at sprint boundaries
- References to issues

---

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Owner:** Developer
