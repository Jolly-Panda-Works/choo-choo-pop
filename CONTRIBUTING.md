# Contributing to Choo Choo Pop

Thanks for helping! Bug reports, level ideas, translations and code are all welcome. You can write in English or Persian.

## Getting started

You need Node.js 22. Android builds also need JDK 21 and the Android SDK.

```bash
npm ci
npm run dev
npm run test:levels
```

To run on Android:

```bash
npm run cap:sync
cd android && ./gradlew assembleDebug
```

## Pull requests

1. Open an issue first for anything big, so we can agree on it before you build it.
2. Branch from `main` and open the pull request against `main`.
3. Run `npm run test:levels` and `npm run build`.
4. Test on a phone-sized portrait screen, in both English and Persian.
5. Keep each pull request to one change.

If you add levels, every level must be solvable and have exactly one solution. `npm run test:levels` checks this.

## Commit messages

Releases are built from `main`, and the commit message sets the next version:

| Message | Version |
|---|---|
| `feat: ...` | minor |
| `feat!: ...` or `BREAKING CHANGE` | major |
| anything else (`fix: ...`, `chore: ...`) | patch |

Changes to Markdown files and `docs/` don't start a build.

## Branches

- `main` has the latest version of the game. It has no store services.
- `Iranian-store` is `main` plus the Cafe Bazaar and Myket services. `main` is merged into it, never the other way around.

## Rules for this project

- **This is a game for children.** Don't add tracking, personal data collection, or pressure tactics such as countdowns on purchases.
- **Never commit secrets:** keystores, API tokens or `.env` files.
- **Art and audio aren't under the MIT License.** See [ASSETS_LICENSE.md](ASSETS_LICENSE.md). Only add assets that you made yourself or have the right to use, and say where they came from in your pull request. By contributing assets you allow the project to use them in the game.
- Code contributions are licensed under the [MIT License](LICENSE).

Everyone here follows the [Code of Conduct](CODE_OF_CONDUCT.md). For security problems, see [SECURITY.md](SECURITY.md) and don't open a public issue.
