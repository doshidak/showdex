#!/bin/bash

files=(
  "./.git/hooks/commit-msg"
  "./.git/hooks/post-commit"
  "./.git/hooks/pre-commit"
  "./.git/hooks/prepare-commit-msg"
)

for file in "${files[@]}"; do
  if [ -w "$file" ]; then
    mv -v "$file" "$file.js"
  fi
done
