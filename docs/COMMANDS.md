# Project Commands Reference

Complete command reference for AMF Network Monitor development.

---

## NPM Scripts (package.json)

### Development Server
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Electron with Vite dev server and hot reload |
| `npm run build` | Type check and build for production |
| `npm run preview` | Preview production build locally |

### Testing
| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (unit + integration), generates `test-summary.txt` |
| `npm run test:unit` | Run unit tests only (`tests/unit/**/*.test.js`) |
| `npm run test:integration` | Run integration tests only (`tests/integration/**/*.test.js`) |
| `npm run test:coverage` | Run all tests with Istanbul coverage report |

### Electron Packaging
| Command | Description |
|---------|-------------|
| `npm run package` | Package app for current platform (Electron Forge) |
| `npm run make` | Create distributable installers (`.exe`, `.dmg`, `.deb`) |

### Code Quality
| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint on `.js`, `.jsx`, `.ts`, `.tsx` files |
| `npm run lint:fix` | Auto-fix ESLint issues where possible |
| `npm run typecheck` | Run TypeScript compiler without emitting files |

### Release & Changelog
| Command | Description |
|---------|-------------|
| `npm run changelog` | Preview what standard-version would do (dry-run) |
| `npm run release` | Bump version, update CHANGELOG.md, create release commit |

---

## Git Commands

### Branch Management
| Command | Description |
|---------|-------------|
| `git branch` | List all local branches, shows current branch with `*` |
| `git branch -a` | List all branches (local + remote) |
| `git checkout main` | Switch to main branch |
| `git checkout -b feature/name` | Create new branch and switch to it |
| `git checkout scratch` | Switch to scratch/experimental branch |
| `git branch -d feature/name` | Delete a merged branch |
| `git branch -D feature/name` | Force delete a branch (even if unmerged) |

### Daily Workflow
| Command | Description |
|---------|-------------|
| `git status` | Show modified and untracked files |
| `git status -s` | Short status format (one line per file) |
| `git add filename.js` | Stage specific file |
| `git add .` | Stage all changes in current directory |
| `git commit -m "feat: description"` | Commit with conventional commit message |
| `git commit -m "feat: title" -m "body details"` | Commit with multi-line message |
| `git push` | Push current branch to remote |
| `git push -u origin feature/name` | Push new branch and set upstream |
| `git pull` | Fetch and merge changes from remote |

### Inspection
| Command | Description |
|---------|-------------|
| `git log --oneline -10` | Show last 10 commits (one line each) |
| `git log --graph --oneline` | Show commit graph with branch structure |
| `git diff` | Show unstaged changes |
| `git diff --staged` | Show staged changes (ready to commit) |
| `git show commit-hash` | Show details of a specific commit |
| `git blame filename.js` | Show who last modified each line |

### Undo & Recovery
| Command | Description |
|---------|-------------|
| `git restore filename.js` | Discard changes in working directory |
| `git restore --staged filename.js` | Unstage file (keep changes) |
| `git commit --amend` | Edit the last commit message |
| `git reset --soft HEAD~1` | Undo last commit, keep changes staged |
| `git reset --hard HEAD~1` | Undo last commit, discard all changes |
| `git stash` | Save current changes temporarily |
| `git stash pop` | Restore stashed changes |
| `git stash list` | Show all stashed changes |

### Merging
| Command | Description |
|---------|-------------|
| `git merge main` | Merge main branch into current branch |
| `git merge --abort` | Cancel a merge in progress |
| `git rebase main` | Reapply commits on top of main branch |

---

## Electron Development

| Command | Description |
|---------|-------------|
| `npx electron --version` | Check installed Electron version |
| `npx electron-forge import` | Convert existing app to Electron Forge |
| `npx electron-builder` | Alternative packager (if configured) |

---

## Testing & Debugging

| Command | Description |
|---------|-------------|
| `node --version` | Check Node.js version (should be >=18) |
| `npm --version` | Check npm version |
| `npm list` | Show installed dependencies tree |
| `npm outdated` | Show outdated dependencies |
| `npm audit` | Check for security vulnerabilities |
| `npm audit fix` | Fix auto-fixable security issues |

---

## Troubleshooting

| Command | Description |
|---------|-------------|
| `npm cache clean --force` | Clear npm cache when builds fail |
| `rm -rf node_modules && npm install` | Clean reinstall of dependencies |
| `git clean -fd` | Remove untracked files and directories |
| `npx standard-version --dry-run` | Test changelog generation without changes |
| `npx jest --clearCache` | Clear Jest test cache |

---

## Conventional Commit Prefixes

When writing commit messages, use these prefixes:

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style changes (formatting, no logic) |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Build process, dependencies, etc. |

Example: `git commit -m "feat(tests): add automatic test summary generation"`
