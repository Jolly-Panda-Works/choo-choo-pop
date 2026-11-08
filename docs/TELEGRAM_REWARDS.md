# Verified Telegram hints

Bot: `PandaRadarBot`. Channel: `@UsefGameLab`.

YouTube and Instagram have been removed from the reward popup. YouTube API policy prohibits rewarding subscriptions: https://developers.google.com/youtube/terms/developer-policies

## Activation

1. Ensure PandaRadarBot is an administrator in @UsefGameLab.
2. In BotFather use `/setdomain` for PandaRadarBot and enter `choochoopop.jollypanda.ir`.
3. Store the bot token as the Cloudflare Worker secret `TELEGRAM_BOT_TOKEN` on `choochoopop-demo`. Do not paste it into chat or commit it. Use `wrangler secret put TELEGRAM_BOT_TOKEN --config wrangler.demo.json` or the Cloudflare dashboard.

The status endpoint reports `ready:false` until the secret exists. The bot's existing webhook is not modified and no bot messages are sent.

## Flow

Telegram Login is validated on the backend using its HMAC signature, five-minute auth timestamp and browser-bound state cookie. getChatMember verifies the authenticated Telegram user's membership. Failure never grants hints.

A Durable Object serializes one award per Telegram account. It stores a hashed account key, random browser session and grant ID, not names or access tokens. An HttpOnly signed receipt bound to the browser session reports the reward to the original game tab. The client records redeemed grant IDs to avoid replay on refresh. Local demo saves are not a fully server-authoritative anti-cheat system.

## Art

`public/choo-choo-pop-assets/art/ui/social-telegram-v1.png` (256px transparent PNG).

Prompt: One transparent game UI icon, Telegram paper airplane logo, recognizable white paper plane on glossy sky blue round badge, Choo Choo Pop casual cartoon train puzzle art, plump dimensional beveled edge, tiny warm gold rim, soft hand painted highlights upper left, clean polished mobile game sprite, centered square tight framing, no text, no other objects.

## Validation

`node scripts/test-demo-rewards.mjs` and `node scripts/test-telegram.mjs`. Live activation also requires the token and BotFather domain setup.

## Approximate three-post reaction mission

After Telegram authentication and membership verification, the server reads the latest three public posts from https://t.me/s/UsefGameLab. Their IDs and total reaction counts are frozen for a 10-minute mission. New posts do not replace the current mission's posts. After expiration, an explicit restart selects the latest three again.

The player opens all three post links, reacts, and presses Check reactions. Membership is rechecked. A reward is granted only if all three totals exceed their respective baselines before expiry; no increase, partial completion, missing counts or fetch failures grant nothing. The same account can earn the Telegram reward once.

This checks aggregate counts, not reactor identity: another person's reaction can satisfy the mission, and concurrent missions may share an increase. Public preview caches may delay visible changes. Unknown or abbreviated counts fail closed. No webhook or bot program changes are required.

Validation: `node scripts/test-reactions.mjs` and `node scripts/test-telegram.mjs`. Live aggregate parsing was checked against channel posts; end-to-end Telegram login requires a real player.

## Automatic return flow (current default)

The Telegram button opens the channel directly and prepares a signed 10-minute browser-bound baseline. Returning to a visible game tab triggers POST /api/social/telegram/auto-check; checks repeat every 12 seconds while the popup is open. All three counter increases grant two hints automatically. The Verify link and login requirement have been removed from this default flow.

This anonymous mode cannot verify membership or reactor identity. Its one-time limit is per browser session cookie (and local redeemed-grant save), not per Telegram account. The older authenticated routes remain available but are not used by the default popup. Forged or expired baselines and missing/unchanged counters never grant rewards.
