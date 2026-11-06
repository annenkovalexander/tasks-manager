#!/usr/bin/env bash
#
# commit-push.sh — Run e2e tests, stage all changes, commit with a message, and push.
#
# Usage:
#   ./commit-push.sh "<commit message>"
#
# Example:
#   ./commit-push.sh "feat: add tasks API"
#
set -euo pipefail


# --- 1. Check that a commit message was provided ----------------------------
if [ "$#" -ne 1 ]; then
  echo "Error: exactly one argument is required."
  echo "Usage: $0 \"<commit message>\""
  echo "Example: $0 \"feat: add tasks API\""
  exit 1
fi


COMMIT_MESSAGE="$1"


# --- 2. Check that we are inside a git repository ---------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository."
  exit 1
fi


# --- 3. Check that there is something to commit -----------------------------
if [ -z "$(git status --porcelain)" ]; then
  echo "Nothing to commit — working tree is clean."
  exit 0
fi


# --- 4. Run e2e tests --------------------------------------------------------
echo "==> Running e2e tests..."
DATABASE_URL=postgres://tasksuser:tasksPass123@localhost:5432/tasksmanager npm run test:e2e

echo "==> E2E tests passed."


# --- 5. Stage all changes ----------------------------------------------------
echo "==> Staging all changes..."
git add .


# --- 6. Commit with the provided message ------------------------------------
echo "==> Committing: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"


# --- 7. Push to origin -------------------------------------------------------
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"


if git rev-parse --verify --quiet "origin/$CURRENT_BRANCH" >/dev/null 2>&1; then
  echo "==> Pushing to origin/$CURRENT_BRANCH..."
  git push
else
  echo "==> First push: setting upstream for $CURRENT_BRANCH..."
  git push -u origin "$CURRENT_BRANCH"
fi


echo ""
echo "Done. Tested, committed and pushed to origin/$CURRENT_BRANCH."