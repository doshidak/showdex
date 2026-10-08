import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { env } from '../webpack.config.js';

// the source archive AMO wants whenever you ship minified code, which with a 4.4 MB terser'd
// main.js is always.
//
// it's just `git archive HEAD`, i.e. the tracked tree & nothing else. .gitignore already keeps
// node_modules/dist/build out, so there's no hand-written file list here to rot. .env,
// pnpm-lock.yaml & patches/ ride along because they're tracked, which is the whole point: a
// reviewer needs all three or they won't land on our bytes.

if (!env.PACKAGE_VERSION) {
  console.error('Please run this script through pnpm.');
  process.exit(1);
}

const root = path.join(import.meta.dirname, '..');

const git = (...args) => execFileSync('git', args, {
  cwd: root,
  encoding: 'utf8',
}).trim();

// `git archive --mtime` landed in git 2.40, & without it every entry gets the committer time
// instead, which is fine until someone rebases & the archive silently stops matching. Debian 12
// ships 2.39 & Ubuntu 22.04 ships 2.34, so say which version is missing instead of letting git's
// own "unknown option" surface three frames deep
const [, major = 0, minor = 0] = /(\d+)\.(\d+)/.exec(git('--version')) || [];

if (Number(major) < 2 || (Number(major) === 2 && Number(minor) < 40)) {
  console.error(`git ${major}.${minor} is too old; \`git archive --mtime\` needs git >= 2.40.`);
  process.exit(1);
}

// an archive that doesn't match a commit is worthless: whoever opens it rebuilds something we
// never shipped. refuse rather than hand over a mystery tree.
const dirty = git('status', '--porcelain');

if (dirty) {
  console.error('Working tree is dirty, not packaging that.');
  console.error('Commit or stash these first:');
  console.error(dirty);
  process.exit(1);
}

const commit = git('rev-parse', 'HEAD');

// same shape as BUILD_NAME in webpack.config.js minus the target suffix, so the .source.zip sorts
// next to its .xpi & the shared -b<BUILD_DATE> says which one it goes with
const name = [
  env.PACKAGE_NAME,
  `-v${env.PACKAGE_VERSION}`,
  !!env.PACKAGE_VERSION_SUFFIX && `-${env.PACKAGE_VERSION_SUFFIX}`,
  !!env.BUILD_DATE && `-b${env.BUILD_DATE}`,
].filter(Boolean).join('');

const outDir = path.join(root, 'dist');
const outFile = path.join(outDir, `${name}.source.zip`);

mkdirSync(outDir, { recursive: true });
rmSync(outFile, { force: true });

// git archive sorts paths itself & stamps every entry with a single mtime, so this is reproducible
// the moment we stop letting it default to `now`. same hex ms epoch the .xpi entries use.
const buildTimestamp = parseInt(env.BUILD_DATE, 16) || Date.now();
const mtime = new Date(buildTimestamp).toISOString();

console.log('Packaging source for', name);
console.log('commit:', commit);
console.log('mtime:', mtime);

execFileSync('git', [
  'archive',
  '--format=zip',
  `--prefix=${name}/`,
  `--mtime=${mtime}`,
  `--output=${outFile}`,
  'HEAD',
], { cwd: root, stdio: 'inherit' });

const sha256 = createHash('sha256').update(readFileSync(outFile)).digest('hex');

// write the commit down next to the archive so anyone diffing it against GitHub knows which tree
// they're looking at without taking the filename's word for it
writeFileSync(path.join(outDir, `${name}.source.txt`), [
  `name:       ${name}.source.zip`,
  `commit:     ${commit}`,
  `version:    ${env.PACKAGE_VERSION}`,
  `BUILD_DATE: ${env.BUILD_DATE}`,
  `mtime:      ${mtime}`,
  `sha256:     ${sha256}`,
  '',
].join('\n'));

console.log('sha256:', sha256);
console.log('Wrote', path.relative(root, outFile));
