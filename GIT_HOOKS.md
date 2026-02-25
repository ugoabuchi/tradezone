# Git Hooks for This Repository

This repository installs a local hooks directory and a `post-commit` hook
that will automatically push commits to the remote branch.

How it works
- The hooks directory is `.githooks` and is enabled via Git config:
  `git config core.hooksPath .githooks`.
- The `post-commit` hook will run `git push` after every commit.

Skip auto-push
- If you want to prevent a particular commit from being pushed, include
  the token `[no-push]` in the commit message. Example:

```bash
git commit -m "WIP changes [no-push]"
```

Reverting this setup
- To disable using the repository hooks directory, run:

```bash
git config --unset core.hooksPath
```

To remove the hook file:

```bash
rm -rf .githooks
```

Security note
- Hooks run locally and are not version-controlled by default; `.githooks`
  is included in the repo to make onboarding easier, but you can opt to
  unset `core.hooksPath` if you prefer not to run hooks from the repo.
