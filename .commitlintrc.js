export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'test',
        'refactor',
        'security',
        'chore'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'retrospective',
        'adr',
        'network',
        'database',
        'integration',
        'security',
        'guide',
        'tooling',
        'device',
        'ping',
        'ui',
        'main',
        'preload',
        'renderer'
      ]
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'scope-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72]
  },
  ignores: [
    // Allow merge commits
    (commit) => commit.startsWith('Merge '),
    // Allow revert commits
    (commit) => commit.startsWith('Revert ')
  ]
}
