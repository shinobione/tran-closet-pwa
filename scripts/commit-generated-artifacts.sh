#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="${TARGET_BRANCH:-main}"
GENERATED_COMMIT_MESSAGE="${GENERATED_COMMIT_MESSAGE:?GENERATED_COMMIT_MESSAGE is required}"
GENERATED_FILES="${GENERATED_FILES:?GENERATED_FILES is required}"
GENERATE_COMMAND="${GENERATE_COMMAND:?GENERATE_COMMAND is required}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-3}"

if [[ "$TARGET_BRANCH" != "main" ]]; then
  echo "Refusing generated write outside main: $TARGET_BRANCH" >&2
  exit 2
fi
if [[ "$MAX_ATTEMPTS" -lt 1 || "$MAX_ATTEMPTS" -gt 5 ]]; then
  echo "MAX_ATTEMPTS must be between 1 and 5" >&2
  exit 2
fi
if [[ "$GENERATED_FILES" == *'.github/workflows/'* || "$GENERATED_FILES" == *'.github/workflows'* ]]; then
  echo "Generated writers must never mutate workflow files." >&2
  exit 2
fi

IFS=' ' read -r -a files <<< "$GENERATED_FILES"
if [[ ${#files[@]} -eq 0 ]]; then
  echo "No generated files configured." >&2
  exit 2
fi

configure_git(){
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
}

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "Generated write attempt $attempt/$MAX_ATTEMPTS against origin/$TARGET_BRANCH"
  git fetch --no-tags origin "$TARGET_BRANCH"
  git reset --hard "origin/$TARGET_BRANCH"

  # Commands are repository-owned workflow constants, never user input.
  bash -lc "$GENERATE_COMMAND"

  git add -A -- "${files[@]}"
  if git diff --cached --quiet; then
    echo "Generated artifacts already current on origin/$TARGET_BRANCH."
    exit 0
  fi

  configure_git
  git commit -m "$GENERATED_COMMIT_MESSAGE"

  # Never force. If engineering or another generated writer moved main after
  # our fetch, the push fails and we regenerate from the new origin/main.
  if git push origin "HEAD:$TARGET_BRANCH"; then
    echo "Generated artifacts committed safely to $TARGET_BRANCH."
    exit 0
  fi

  echo "origin/$TARGET_BRANCH moved during generated write; regenerating from latest main."
done

echo "Generated write could not converge after $MAX_ATTEMPTS attempts; leaving main untouched." >&2
exit 1
