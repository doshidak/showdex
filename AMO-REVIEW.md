# Building this for AMO review

`main.js` is a 4.4 MB webpack bundle, so [AMO wants the source][policy] plus steps that rebuild the
exact `.xpi` that was submitted. Here they are.

Pin `BUILD_DATE` and the build is byte-for-byte reproducible on any machine. There is one catch for
anything released up to and including v1.4.2, and it has its own section below, because it is the
reason a rebuild of v1.4.2 will not match unless you also pin `TZ`.

CI runs these same commands, see [`.github/workflows/build-firefox.yml`](./.github/workflows/build-firefox.yml).

## What you need

* **Linux.** That's what CI uses and what these commands are tested on. macOS needs
  `shasum -a 256` instead of `sha256sum` and a newer `git` than Apple ships, so it isn't a
  supported path here.
* **Node `^24.0.0`**, per `engines` in [`package.json`](./package.json).
* **pnpm `10.33.0`**, pinned and checksummed by `packageManager` in the same file. Corepack ships
  with Node and reads that version straight out of `package.json`, so there's nothing to install
  globally.
* **git >= 2.40**, only for `pnpm package:source`, which uses `git archive --mtime`. That flag
  landed in 2.40, so Debian 12 (2.39) and Ubuntu 22.04 (2.34) are too old for it. The build itself
  doesn't need git at all.
* **`unzip`**, only for `pnpm verify:reproducible`.
* Network access to the npm registry. Nothing else.

## Build it

```bash
corepack enable
pnpm install --frozen-lockfile

BUILD_DATE=1A09EE25A87 pnpm build:firefox:fast
```

`BUILD_DATE` is the `b...` chunk out of the filename of whatever `.xpi` you were sent; the next
section explains it. `1A09EE25A87` above is v1.4.2's.

The `.xpi` lands in `dist/`, next to an unzipped `dist/firefox/` copy of the same files.

Use `:fast`. Same build as `build:firefox`, minus a 128 MB bundle-size visualizer HTML that gets
written to `dist/` for our own curiosity. It is not in the `.xpi` and it is not reproducible, so
there's no reason to generate it here.

## Where BUILD_DATE comes from

It's a hex millisecond epoch, and it is the only input that varies between builds. You don't have
to guess it:

```
showdex-v1.4.2-b1A09EE25A87.firefox.xpi
                ^^^^^^^^^^^
                BUILD_DATE=1A09EE25A87   (1789372029575 ms, or 2026-09-14T07:47:09.575Z)
```

It feeds the output filename, every ZIP entry's mtime, and the `built` stamp inside the i18n
bundles. Pin it and all three line up. You can check that last one against the artifact you're
holding without building anything:

```bash
unzip -p showdex-v1.4.2-b1A09EE25A87.firefox.xpi i18n.en.json \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["common"]["--meta"]["built"])'
# 2026-09-14T07:47:09.575Z, which is exactly 0x1A09EE25A87
```

## The timezone catch, and reproducing v1.4.2

ZIP stores entry mtimes as DOS date/time, a format from 1980 with **no timezone field in it**. yazl,
which `zip-webpack-plugin` uses, fills those fields from `Date`'s local getters. So one fixed
`BUILD_DATE` serializes to different bytes depending on what timezone the build machine is set to.
Contents identical, hash different.

v1.4.2 was built in US Pacific, so that's what you have to pin to reproduce it:

```bash
git checkout v1.4.2
BUILD_DATE=1A09EE25A87 TZ=America/Los_Angeles pnpm build:firefox:fast
sha256sum dist/showdex-v1.4.2-b1A09EE25A87.firefox.xpi
# 3dff6ad8e0588baaafd379f536c22cf6eb9754c8f4c5738e34c7432c759f4077
```

That's the published `showdex-v1.4.2-b1A09EE25A87.firefox.xpi`, 3,979,151 bytes, byte for byte.
Drop the `TZ=` and the hash changes while all 61 entries keep identical sizes and CRCs.

Every release up to v1.4.2 has this property, which makes a byte-exact source review a coin flip on
where the reviewer happens to live. `webpack.config.js` now sets `process.env.TZ = 'UTC'`, so from
the next release onward `BUILD_DATE` is the only input and the `TZ=` above is no longer needed.

## Checking a build

```bash
sha256sum dist/*.firefox.xpi
```

For v1.4.2, compare against the hash in the section above. From the next tagged release onward, CI
also publishes a `SHA256SUMS.txt` next to the `.xpi` and the source archive on the
[GitHub release][releases]; no release carries one yet, so don't go looking for it on v1.4.2.

To check that a build is genuinely pinned and not just stable on one machine:

```bash
pnpm verify:reproducible
```

That builds twice under two deliberately distant timezones and diffs the results. It's also what CI
runs, so this can't regress quietly.

## Things that look off but aren't

* **`.env` is committed.** No secrets in it, just build switches and two hardcoded UUID namespaces
  that keep people's saved data readable across versions. The build reads it through `dotenv`, so it
  has to be there for the hash to come out right.
* **`patches/` has two patched dependencies**, applied by pnpm via `pnpm.patchedDependencies`:
  `@smogon/calc@0.11.0` and `react-select@5.10.2`. Both are plaintext diffs in the tree.
* **`postinstall` runs `scripts/patch-ghooks.sh`.** All it does is add a `.js` extension to the git
  hook files `ghooks` writes, because Node won't load them otherwise. It touches nothing outside
  `.git/`, and does nothing at all when there's no `.git/`, which is the case when building from the
  source archive.
* **Source maps are in `web_accessible_resources`** on purpose, so they resolve when you inspect the
  extension on `play.pokemonshowdown.com`. `devtool` is `source-map`, never `eval-source-map`, and
  `main.js.map` and `content.js.map` ship next to the bundles, so every warning below can be
  resolved back to the library it came from.
* **`dangerouslySetInnerHTML` is never called anywhere in our source.** `grep` finds exactly two
  hits, `src/components/form/Dropdown/SelectInput.tsx:13` and
  `src/components/ui/Button/BaseButton/DraggableBaseButton.tsx:14`, and both are
  `Omit<..., 'dangerouslySetInnerHTML'>` type exclusions that remove the prop. They compile to
  nothing.

## What addons-linter says

0 errors, 13 warnings, as of **addons-linter 10.13.0**:

```bash
npx addons-linter@10.13.0 dist/*.firefox.xpi
```

Twelve of the thirteen are in library code webpack inlined. Every offset below was resolved through
the shipped source maps, so you can check any of them:

| Code | Count | Resolves to |
|---|---|---|
| `DANGEROUS_EVAL` | 5 | webpack's own `__webpack_require__.g` runtime, `webpack/runtime/global:4`, twice (once in `content.js`, once in `main.js`). Then `lodash-es/_root.js:7` (via `simplebar` to `simplebar-core`), `function-bind/implementation.js:74`, and `get-intrinsic/index.js:91`, where `'%eval%': eval` is a property in an intrinsics table and never called. All five are the `Function("return this")()` global-object idiom or a table entry, not evaluation of anything dynamic. |
| `UNSAFE_VAR_ASSIGNMENT` | 7 | `prismjs/prism.js:595` and `prismjs/components/prism-markdown.js:348`, `react-dom-client.production.js:13074` and `:13288`, `react-inlinesvg/dist/index.mjs:281` and `:291`. All six are library-controlled markup. The seventh, in `content.js`, resolves to `src/content.ts:166` and is not an `innerHTML` write at all: it's `eslint-plugin-no-unsanitized` erroring internally on our minified IIFE, and it says so in the message ("Unexpected callable. Please report a minimal code snippet to the developers"). The original is a `logger.error(...)` call. |

The thirteenth is ours: `MISSING_DATA_COLLECTION_PERMISSIONS`, against `manifest.json`. Declaring
`browser_specific_settings.gecko.data_collection_permissions` costs more than it saves right now:
the key needs Firefox 140 (142 on Android) and `strict_min_version` is `78.0`, so adding it trades
this one warning for two `KEY_FIREFOX_UNSUPPORTED_BY_MIN_VERSION` warnings instead. We'd rather keep
supporting Firefox 78 than raise the floor to 140 for a disclosure, so this is deliberate. For the
record, Showdex collects nothing: there is no `POST`, `PUT`, or `PATCH` anywhere in `src/`, and the
local debug trail is written to IndexedDB and never leaves the browser.

v1.4.2 as published additionally trips `APPLICATIONS_DEPRECATED`, for using the pre-Firefox-48
`applications` key. That one is fixed.

## Source archive

Built by:

```bash
BUILD_DATE=1A09EE25A87 pnpm package:source
```

Pass the same `BUILD_DATE` as the `.xpi` so the two filenames carry the same id. It's
`git archive HEAD` of the tracked tree, so it's the public repo at a named commit with nothing added
and nothing taken out. Commit, `BUILD_DATE` and sha256 go into a `.source.txt` sidecar, and it
refuses to run on a dirty tree, because an archive that doesn't match a commit is useless to review.
It needs a real checkout, so it can't be run from the archive it produces. CI attaches it to tagged
releases from the next one onward.

Whole repo is public anyway: <https://github.com/doshidak/showdex>, AGPL-3.0.

[policy]: https://extensionworkshop.com/documentation/publish/source-code-submission/
[releases]: https://github.com/doshidak/showdex/releases
