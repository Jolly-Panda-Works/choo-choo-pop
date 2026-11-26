// Sends a signed APK to Myket as a new release and asks Myket to review it, through the
// publishing API: https://myket.ir/docs/technical/services/publish-release/
//
//   node scripts/myket-release.mjs <apk> --version 1.2.0 --code 1002000 --changelog notes.json
//
// Env:
//   MYKET_ACCESS_TOKEN    the X-Access-Token of the developer panel
//   MYKET_AUTO_PUBLISH    "false" (default): you press publish in the panel once it's approved;
//                         "true": published as soon as Myket approves it
//
// Steps: skip if Myket already has this versionCode (in review or approved) -> drop an unfinished
// bundle left by a failed run -> create the bundle with the notes -> upload the APK -> send it for review.
// The changelog: { fa, en } from scripts/store-notes.mjs (checked before the build).
import { existsSync, openAsBlob, readFileSync } from "node:fs";

// MYKET_API_URL is only for testing against a mock.
const PACKAGE = "com.jollypanda.choochoopop";
const API = process.env.MYKET_API_URL || `https://developer.myket.ir/api/partners/applications/${PACKAGE}/release-bundle`;
const args = process.argv.slice(2);
const apk = args[0]?.startsWith("--") ? undefined : args[0];
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const version = opt("version");
const code = Number(opt("code"));
const changelogFile = opt("changelog");
const token = (process.env.MYKET_ACCESS_TOKEN ?? "").trim();
const autoPublish = (process.env.MYKET_AUTO_PUBLISH ?? "false").trim().toLowerCase() === "true";

const fail = (message) => {
  console.log(`::error::${message}`);
  process.exit(1);
};
if (!token) fail("MYKET_ACCESS_TOKEN is not set.");
if (!apk || !existsSync(apk)) fail(`APK not found: ${apk}`);
if (!version || !Number.isFinite(code) || code <= 0) fail("Pass --version and --code.");
if (!changelogFile || !existsSync(changelogFile)) fail("Pass --changelog (the notes checked by scripts/store-notes.mjs).");
const notes = JSON.parse(readFileSync(changelogFile, "utf8"));
if (!String(notes.fa ?? "").trim() || !String(notes.en ?? "").trim()) fail("The release notes are empty.");

/** One API call; retries a few times when Myket says "too many requests". `ok`: any 2xx. */
async function call(method, path = "", body) {
  for (let attempt = 1; ; attempt++) {
    const headers = { "X-Access-Token": token };
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(API + path, { method, headers, body: payload });
    const text = await res.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { message: text.slice(0, 300) };
    }
    if (res.status === 429 && attempt < 5) {
      console.log(`Myket says too many requests; waiting ${attempt * 20} s…`);
      await new Promise((r) => setTimeout(r, attempt * 20_000));
      continue;
    }
    return { status: res.status, ok: res.status >= 200 && res.status < 300, json, text };
  }
}
// Myket's error format isn't documented: show its whole answer.
const why = (r) => `HTTP ${r.status}: ${r.text.slice(0, 1000) || "(empty answer)"}`;

// The docs don't name the versionCode field of a bundle, so it's looked for anywhere in the bundle.
const hasCode = (release) => new RegExp(`\\b${code}\\b`).test(JSON.stringify(release));

// 1. Look at the bundles Myket has.
const list = await call("GET", "?offset=1&limit=20");
if (!list.ok) fail(`Couldn't read the releases: ${why(list)}`);
const releases = list.json.releases ?? [];

// Already on Myket (a re-run, or the version wasn't bumped): nothing to do.
const sent = releases.find((r) => ["WaitingForApproval", "Approved"].includes(r.status) && hasCode(r));
if (sent) {
  console.log(`::notice::Myket already has versionCode ${code} (${sent.status}); not sending ${version} again.`);
  process.exit(0);
}

// An unfinished bundle, left by a failed run, would mix with this one.
if (releases.some((r) => r.status === "JustCreated")) {
  fail("Myket has an existing draft; leaving it in place.");
}

// 2. New bundle, with the notes.
const created = await call("PUT", "", {
  title: version,
  stagedRolloutPercent: 100,
  translationInfos: [
    { language: "fa", description: notes.fa },
    { language: "en", description: notes.en },
  ],
});
if (!created.ok) fail(`Couldn't create the release: ${why(created)}`);
console.log("Release created.");

// 3. The APK. Myket's form field has no name.
const form = new FormData();
form.append("", await openAsBlob(apk, { type: "application/vnd.android.package-archive" }), apk.split(/[\\/]/).pop());
const uploaded = await call("PUT", "/upload", form);
if (!uploaded.ok) fail(`Couldn't upload the APK: ${why(uploaded)}`);
console.log(`APK uploaded: version ${version} (${code}).`);

// 4. Ask Myket to review it.
const committed = await call("POST", "/commit", {
  isManualPublish: !autoPublish,
  message: `Choo Choo Pop ${version} (versionCode ${code}), sent automatically by GitHub Actions.`,
});
if (!committed.ok) {
  const bundles = await call("GET", "?offset=1&limit=20");
  console.log(`Bundles on Myket: ${bundles.text.slice(0, 2000)}`);
  fail(`Couldn't send the release for review: ${why(committed)}`);
}
console.log(`::notice::Choo Choo Pop ${version} is with Myket for review${autoPublish ? "; it's published as soon as it's approved" : "; publish it in the panel once approved"}.`);
