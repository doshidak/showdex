#!/bin/bash

# checks that one BUILD_DATE gives one .xpi, no matter who builds it.
#
# timezone is the axis that mattered: ZIP entry mtimes are DOS date/time, no timezone field in the
# format, so yazl writes them from Date's local getters. v1.4.2 went out with US Pacific wall clock
# stamped into all 61 entries, which meant nobody outside UTC-7 could reproduce its sha256 & AMO
# pulled us. so now we build twice under two far-apart zones & fail loudly if a single byte moves.
#
# usage:
#   pnpm verify:reproducible                 # grabs a BUILD_DATE off the clock
#   BUILD_DATE=1A09EE25A87 pnpm verify:reproducible
#   TZ_A=UTC TZ_B=Pacific/Kiritimati pnpm verify:reproducible

set -euo pipefail

cd "$(dirname "$0")/.."

# hex ms epoch, same shape webpack.config.js expects (it uppercases & strips non-hex anyway)
BUILD_DATE="${BUILD_DATE:-$(node -e 'process.stdout.write(Date.now().toString(16).toUpperCase())')}"

# UTC-8/-7 against UTC+9, far enough apart that the DOS fields land on a different day, not just
# a different hour
TZ_A="${TZ_A:-America/Los_Angeles}"
TZ_B="${TZ_B:-Asia/Tokyo}"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

sha256() {
  node -e '
    const { createHash } = require("crypto");
    const { readFileSync } = require("fs");
    process.stdout.write(createHash("sha256").update(readFileSync(process.argv[1])).digest("hex"));
  ' "$1"
}

# $1 = label, $2 = TZ
build_once() {
  local label="$1" tz="$2"

  echo "==> building as $label (TZ=$tz, BUILD_DATE=$BUILD_DATE)"

  # :fast skips the visualizer HTML, which isn't in the .xpi & isn't reproducible anyway
  TZ="$tz" BUILD_DATE="$BUILD_DATE" pnpm build:firefox:fast >"$work/$label.log" 2>&1 || {
    echo "build blew up, last 30 lines of $work/$label.log:" >&2
    tail -30 "$work/$label.log" >&2
    exit 1
  }

  local xpi
  xpi="$(ls dist/*.firefox.xpi)"

  cp "$xpi" "$work/$label.xpi"
}

build_once a "$TZ_A"
build_once b "$TZ_B"

sum_a="$(sha256 "$work/a.xpi")"
sum_b="$(sha256 "$work/b.xpi")"

echo
echo "TZ=$TZ_A  $sum_a"
echo "TZ=$TZ_B  $sum_b"
echo

if [ "$sum_a" = "$sum_b" ]; then
  echo "OK. BUILD_DATE=$BUILD_DATE pins the build; timezone no longer leaks into the bytes."
  exit 0
fi

echo "FAIL. Same inputs, different .xpi bytes. Something unpinned snuck back in." >&2
echo >&2

# hang onto the archives, the trap would otherwise bin them exactly when you want to look at them
keep="$(mktemp -d)"
trap - EXIT
cp "$work/a.xpi" "$work/b.xpi" "$keep/"
rm -rf "$work"

# a listing diff catches the usual suspects: entry order, sizes, mtimes. if the listings match, the
# difference is inside a file, so say so instead of making someone guess
if diff <(unzip -l "$keep/a.xpi" | tail -n +2) <(unzip -l "$keep/b.xpi" | tail -n +2) >/dev/null; then
  echo "listings match, so it is inside a file. dig in with:" >&2
  echo "  unzip -q $keep/a.xpi -d $keep/a && unzip -q $keep/b.xpi -d $keep/b" >&2
  echo "  diff <(cd $keep/a && find . -type f | sort | xargs sha256sum) \\" >&2
  echo "       <(cd $keep/b && find . -type f | sort | xargs sha256sum)" >&2
else
  echo "listing diff (name/size/mtime/order):" >&2
  diff <(unzip -l "$keep/a.xpi" | tail -n +2) <(unzip -l "$keep/b.xpi" | tail -n +2) >&2 || true
  echo >&2
  echo "archives kept at $keep" >&2
fi

exit 1
