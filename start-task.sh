#!/usr/bin/env bash
#
# start-task.sh — Start a new task branch from an up-to-date master.
#
# Usage:
#   ./start-task.sh <new-branch-name>
#
# Example:
#   ./start-task.sh feature/add-tasks-api
#
set -euo pipefail

# --- 1. Check that a branch name was provided -------------------------------
if [ "$#" -ne 1 ]; then
  echo "Error: exactly one argument is required."
  echo "Usage: $0 <new-branch-name>"
  echo "Example: $0 feature/add-tasks-api"
  exit 1
fi

BRANCH_NAME="$1"

# --- 2. Check that we are inside a git repository ---------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository."
  exit 1
fi

# --- 3. Abort if there are uncommitted changes ------------------------------
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: you have uncommitted changes."
  echo "Commit or stash them first:"
  echo "  git add . && git commit -m '...'"
  echo "  # or"
  echo "  git stash"
  exit 1
fi

# --- 4. Switch to master and pull latest ------------------------------------
echo "==> Switching to master..."
git checkout master

echo "==> Pulling latest master..."
git pull

# --- 5. Prune stale remote-tracking references ------------------------------
echo "==> Pruning stale remote references..."
git fetch --prune

# --- 6. Delete local branches already merged into origin/master -------------
echo "==> Previewing local branches merged into origin/master..."
git branch --merged origin/master | grep -v -E '^\*|master|main' || true

echo "==> Deleting local branches merged into origin/master..."
git branch --merged origin/master \
  | grep -v -E '^\*|master|main' \
  | xargs -r git branch -d || true
# --- 7. Create and switch to the new branch ---------------------------------
echo "==> Creating and switching to branch: $BRANCH_NAME"
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "Error: local branch '$BRANCH_NAME' already exists."
  echo "Choose a different name or delete it first:"
  echo "  git branch -d $BRANCH_NAME"
  exit 1
fi

git checkout -b "$BRANCH_NAME"

# --- 8. Push the new branch and set upstream tracking -----------------------
echo "==> Pushing branch to origin and setting upstream..."
git push -u origin "$BRANCH_NAME"

echo ""
echo "Done. You are now on branch: $BRANCH_NAME"
echo "Next steps:"
echo "  1. Make your changes, commit, and push."
echo "  2. Open a Pull Request on GitHub."
echo "  3. Wait for CI to pass, then Squash and merge."
echo "  4. The branch will be auto-deleted on GitHub after merge."
