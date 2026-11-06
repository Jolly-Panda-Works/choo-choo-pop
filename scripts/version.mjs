import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
export function nextVersion(tags, base, bump = 'patch') {
  const versions = tags.map(t => /^(?:bazaar-|myket-|stores-)?v(\d+)\.(\d+)\.(\d+)$/.exec(t)).filter(Boolean).map(m => m.slice(1).map(Number));
  const parse = v => { if (!/^\d+\.\d+\.\d+$/.test(v)) throw Error('Invalid version'); return v.split('.').map(Number); };
  const compare = (a,b) => a[0]-b[0] || a[1]-b[1] || a[2]-b[2];
  let latest = versions.sort(compare).at(-1);
  const configured = parse(base);
  if (!latest || compare(configured, latest) > 0) return configured.join('.');
  if (!['patch','minor','major'].includes(bump)) throw Error('Invalid bump');
  latest = [...latest];
  const index = {major:0,minor:1,patch:2}[bump]; latest[index]++;
  for (let i=index+1;i<3;i++) latest[i]=0;
  return latest.join('.');
}
export function versionCode(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error('Invalid version');
  const [a,b,c] = version.split('.').map(Number);
  const code = a*1000000+b*1000+c;
  if (b>999 || c>999 || code<1 || code>2100000000) throw Error('Version outside Android range');
  return code;
}
if (process.argv[1]?.endsWith('version.mjs')) {
  const tags = execFileSync('git',['tag','--list'],{encoding:'utf8'}).trim().split('\n');
  const version = nextVersion(tags, JSON.parse(readFileSync('package.json')).version, process.env.BUMP || 'patch');
  versionCode(version); console.log(version);
}
