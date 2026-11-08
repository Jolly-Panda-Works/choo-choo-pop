# Web demo

- Production: https://choochoopop.jollypanda.ir
- Download app: https://jollypanda.ir/en/games/choo-choo-pop/
- Build: `npm run build:demo` (separate demo save, no billing or ads).
- Validate the ten ascending puzzles: `node scripts/test-demo.mjs`.
- Deploy: `npx wrangler deploy --config wrangler.demo.json` using the authorized Cloudflare account.
- GitHub workflow `.github/workflows/demo.yml` builds and tests branch `web-demo` and stores a downloadable deployment artifact. Cloudflare publication uses the local authorized Wrangler session; no credentials are stored in Git.
- Source remains private. No public mirror is required.
