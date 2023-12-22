module.exports = {
  types: [
    { value: 'feat', name: 'New feature' },
    { value: 'fix', name: 'Bug fix' },
    { value: 'wip', name: 'Work in progress' },
    { value: 'style', name: 'Code styling changes' },
    { value: 'refac', name: 'Non-feat, non-fix code changes' },
    { value: 'perf', name: 'Performance improvements' },
    { value: 'chore', name: 'Project build/package changes' },
    { value: 'docs', name: 'Documentation-only changes' },
    { value: 'test', name: 'Unit testing changes' },
    { value: 'undo', name: 'Reverting a commit' },
    { value: 'misc', name: 'Other miscellaneous changes' },
  ],

  scopes: [
    { name: 'assets' },
    { name: 'bg' }, // background script (src/background.ts)
    { name: 'comps' },
    { name: 'consts' },
    { name: 'content' }, // content script (src/content.ts)
    { name: 'env' },
    { name: 'interfaces' },
    { name: 'main' }, // main script (src/main.ts)
    { name: 'manifest' },
    { name: 'redux' },
    { name: 'scripts' },
    { name: 'styles' },
    { name: 'types' },
    { name: 'utils' },

    { name: 'calcdex' },
    { name: 'hellodex' },
    { name: 'honkdex' },
    { name: 'teamdex' },
  ],

  messages: {
    type: 'Commit type:',
    scope: 'Optional scope:',
    customScope: 'Custom scope:',
    subject: 'Short message (imperative):',
    body: 'Optional longer message (use pipe "|" for "\\n"):',
    breaking: 'Optional list of breaking changes:',
    footer: 'Optional list of closed issues (e.g., #31, #34):',
    confirmCommit: 'Yee?', // #cringe
  },

  allowBreakingChanges: [],
  allowCustomScopes: true,
  allowTicketNumber: false,
  skipQuestions: ['breaking', 'footer'],
  subjectLimit: 50,
};
