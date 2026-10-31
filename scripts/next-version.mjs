// Computes the next release version for the GitHub Action (.github/workflows/android.yml).
//
//   node scripts/next-version.mjs [--bump auto|patch|minor|major]      -> prints e.g. 1.3.0
//
// Base = the highest of package.json's version and the newest vX.Y.Z git tag.
//  - No tag yet: the first release is package.json's version as it is (nothing to bump from).
//  - Otherwise the base is bumped. `auto` (default) reads the commit messages since the last tag:
//      "BREAKING CHANGE" / "type!:"  -> major
//      "feat..."                     -> minor
//      anything else                 -> patch
//    The bot's own "chore(release)" commits are ignored.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const parse = (v) => String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
export const cmp = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
};

export function detectBump(messages) {
  let bump = 'patch';
  for (const m of messages) {
    if (/^chore\(release\)/m.test(m)) continue;
    if (/BREAKING CHANGE/.test(m) || /^[a-z]+(\([^)]*\))?!:/m.test(m)) return 'major';
    if (/^feat(\([^)]*\))?:/m.test(m)) bump = 'minor';
  }
  return bump;
}

export function bumpVersion(base, kind) {
  const [maj, min, pat] = parse(base);
  if (kind === 'major') return `${maj + 1}.0.0`;
  if (kind === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

const git = (...args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return '';
  }
};

export function nextVersion(kind = 'auto', pkgVersion) {
  const tags = git('tag', '--list', 'v[0-9]*.[0-9]*.[0-9]*').split('\n').filter(Boolean).sort(cmp);
  const lastTag = tags.at(-1);
  if (!lastTag) return { version: pkgVersion, bump: 'none', base: null };
  const base = cmp(pkgVersion, lastTag) > 0 ? pkgVersion : lastTag.replace(/^v/, '');
  let bump = kind;
  if (kind === 'auto') {
    const log = git('log', `${lastTag}..HEAD`, '--format=%B%x00');
    bump = detectBump(log.split('\0').filter((s) => s.trim()));
  }
  return { version: bumpVersion(base, bump), bump, base };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--bump');
  const kind = i > 0 ? process.argv[i + 1] || 'auto' : 'auto';
  if (!['auto', 'patch', 'minor', 'major'].includes(kind)) {
    console.error(`unknown --bump "${kind}" (auto|patch|minor|major)`);
    process.exit(2);
  }
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const r = nextVersion(kind, pkg.version);
  console.error(`base ${r.base ?? '(no tag yet)'} + ${r.bump} -> ${r.version}`);
  console.log(r.version);
}
