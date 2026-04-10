# Project Commands Reference

Complete command reference for AMF Network Monitor development.

---

## NPM Scripts (package.json)

### Development Server
| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run dev` | Start Electron with Vite dev server and hot reload | **Daily development** - Use this when coding to see changes instantly with hot-reload |
| `npm run build` | Type check and build for production | **Before release** - Verify production build works, generates `out/` folder |
| `npm run preview` | Preview production build locally | **Test production** - Check how the app behaves after `npm run build` |

### Testing
| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm test` | Run all tests (unit + integration), generates `test-summary.txt` | **Before committing** - Ensure all tests pass before pushing code |
| `npm run test:unit` | Run unit tests only (`tests/unit/**/*.test.js`) | **Quick check** - Fast feedback during development (no integration tests) |
| `npm run test:integration` | Run integration tests only (`tests/integration/**/*.test.js`) | **Validate workflows** - Test multi-component interactions |
| `npm run test:coverage` | Run all tests with Istanbul coverage report | **Code quality review** - See which lines aren't covered by tests |

### Electron Packaging
| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run package` | Package app for current platform (Electron Forge) | **Create executable** - Generates `.exe` (Windows) or `.app` (macOS) |
| `npm run make` | Create distributable installers (`.exe`, `.dmg`, `.deb`) | **Distribution** - Create installer for end users (Sprint 6) |

### Code Quality
| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run lint` | Run ESLint on `.js`, `.jsx`, `.ts`, `.tsx` files | **Check code style** - Before committing to ensure consistent formatting |
| `npm run lint:fix` | Auto-fix ESLint issues where possible | **Quick fix** - Automatically fix style issues without manual editing |
| `npm run typecheck` | Run TypeScript compiler without emitting files | **Type safety** - Check for type errors (if using TypeScript) |

### Release & Changelog
| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run changelog` | Preview what standard-version would do (dry-run) | **Before releasing** - See what changelog entries would be generated |
| `npm run release` | Bump version, update CHANGELOG.md, create release commit | **End of Sprint** - Cut a new version and update CHANGELOG.md |

---

## Git Commands

### Branch Management
| Command | Description | When to Use |
|---------|-------------|-------------|
| `git branch` | List all local branches, shows current branch with `*` | **Check where you are** - See what branches exist locally |
| `git branch -a` | List all branches (local + remote) | **See all branches** - Including remote branches on GitHub |
| `git checkout main` | Switch to main branch | **Get latest** - Switch back to main to pull updates |
| `git checkout -b feature/name` | Create new branch and switch to it | **Start new work** - Create a feature branch (e.g., `feature/ping-alerts`) |
| `git checkout scratch` | Switch to scratch/experimental branch | **Quick experiment** - Test something without affecting main |
| `git branch -d feature/name` | Delete a merged branch | **Clean up** - After PR is merged, delete the local feature branch |
| `git branch -D feature/name` | Force delete a branch (even if unmerged) | **Abandon work** - Delete branch without merging (careful!) |

### Daily Workflow
| Command | Description | When to Use |
|---------|-------------|-------------|
| `git status` | Show modified and untracked files | **Before committing** - See what you've changed |
| `git status -s` | Short status format (one line per file) | **Quick overview** - Compact view of changes |
| `git add filename.js` | Stage specific file | **Selective commit** - Only commit certain files |
| `git add .` | Stage all changes in current directory | **Commit everything** - Stage all modified files at once |
| `git commit -m "feat: description"` | Commit with conventional commit message | **Regular commit** - Use conventional prefixes (feat:, fix:, docs:) |
| `git commit -m "feat: title" -m "body details"` | Commit with multi-line message | **Detailed commit** - When you need to explain more |
| `git push` | Push current branch to remote | **Share your work** - After committing, push to GitHub |
| `git push -u origin feature/name` | Push new branch and set upstream | **First push** - When pushing a new branch for the first time |
| `git pull` | Fetch and merge changes from remote | **Get updates** - Before starting work, get latest code |

### Inspection
| Command | Description | When to Use |
|---------|-------------|-------------|
| `git log --oneline -10` | Show last 10 commits (one line each) | **Quick history** - See recent commits without details |
| `git log --graph --oneline` | Show commit graph with branch structure | **Visual history** - See branch structure and merges |
| `git diff` | Show unstaged changes | **Review changes** - Before staging, see what you changed |
| `git diff --staged` | Show staged changes (ready to commit) | **Pre-commit check** - Verify what you're about to commit |
| `git show commit-hash` | Show details of a specific commit | **Investigate** - See what changed in a specific commit |
| `git blame filename.js` | Show who last modified each line | **Find author** - See who wrote which line of code |

### Undo & Recovery
| Command | Description | When to Use |
|---------|-------------|-------------|
| `git restore filename.js` | Discard changes in working directory | **Start over** - Discard uncommitted changes to a file |
| `git restore --staged filename.js` | Unstage file (keep changes) | **Oops, wrong file** - Remove from staging but keep changes |
| `git commit --amend` | Edit the last commit message | **Fix typo** - Correct the last commit message |
| `git reset --soft HEAD~1` | Undo last commit, keep changes staged | **Redo commit** - Undo but keep changes ready to recommit |
| `git reset --hard HEAD~1` | Undo last commit, discard all changes | **Nuke it** - ⚠️ Destructive! Removes commit AND changes |
| `git stash` | Save changes temporarily | **Context switch** - Save work to switch branches quickly |
| `git stash pop` | Restore stashed changes | **Resume work** - Get your stashed changes back |
| `git stash list` | Show all stashed changes | **Check stash** - See what's in your stash stack |

### Merging
| Command | Description | When to Use |
|---------|-------------|-------------|
| `git merge main` | Merge main branch into current branch | **Update feature** - Get latest main into your feature branch |
| `git merge --abort` | Cancel a merge in progress | **Merge conflict panic** - Give up on current merge |
| `git rebase main` | Reapply commits on top of main branch | **Clean history** - Keep linear history (alternative to merge) |

---

## Electron Development

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npx electron --version` | Check installed Electron version | **Verify setup** - Confirm Electron is installed correctly |
| `npx electron-forge import` | Convert existing app to Electron Forge | **Migration** - If switching from another packager |
| `npx electron-builder` | Alternative packager (if configured) | **Alternative packaging** - Use instead of Electron Forge |

---

## Testing & Debugging

| Command | Description | When to Use |
|---------|-------------|-------------|
| `node --version` | Check Node.js version (should be >=18) | **Verify environment** - Ensure Node.js 18+ is installed |
| `npm --version` | Check npm version | **Debug issues** - Check npm version when troubleshooting |
| `npm list` | Show installed dependencies tree | **Find versions** - See what versions are installed |
| `npm list package-name` | Check specific package version | **Verify dependency** - Check if a package is installed and what version |
| `npm outdated` | Show outdated dependencies | **Maintenance** - Find packages that need updating |
| `npm audit` | Check for security vulnerabilities | **Security check** - Before releases, check for known vulnerabilities |
| `npm audit fix` | Fix auto-fixable security issues | **Quick security** - Automatically patch vulnerable dependencies |

---

## Troubleshooting

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm cache clean --force` | Clear npm cache when builds fail | **Build stuck** - When `npm install` gives weird errors |
| `rm -rf node_modules && npm install` | Clean reinstall of dependencies | **Nuclear option** - When nothing else works, start fresh |
| `git clean -fd` | Remove untracked files and directories | **Clean slate** - Remove build artifacts and untracked files |
| `npx standard-version --dry-run` | Test changelog generation without changes | **Preview release** - See what standard-version would do |
| `npx jest --clearCache` | Clear Jest test cache | **Test issues** - When tests act weird (cache corruption) |

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
