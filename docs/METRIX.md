# Metrix setup

Configure the Android client App ID and API key as `METRIX_APP_ID` and `METRIX_API_KEY` in the release build environment. Configure the web client with `VITE_METRIX_APP_ID` and `VITE_METRIX_API_KEY` when building the demo. The release workflows accept GitHub Actions secrets of the same names. Use client credentials for the corresponding Metrix application.

Create these custom events by name in each relevant Metrix dashboard before testing:

- Navigation and play: `screen_viewed`, `game_started`, `game_paused`, `game_resumed`, `game_completed`.
- Puzzles: `level_started`, `level_resumed`, `level_exited`, `level_restarted`, `level_completed`, `tutorial_step`, `hint_used`, `powerup_used`.
- Economy: `currency_earned`, `currency_spent`, `item_purchased`, `purchase_blocked`, `reward_claimed`.
- Payment: `iap_started`, `iap_result`; create `iap_revenue` as a revenue event in IRR.
- Ads: `ad_requested`, `ad_result`. Demo: `demo_completed`, `download_clicked`.

Use SDK sessions for retention. The first playable puzzle fires `game_started` once per launch and again after at least 30 minutes in the background. Use `edition` and `channel` to separate populations. Puzzle durations measure foreground solving time, including time while a freeze booster is active. Confirmed exit leaves the attempt resumable. Closing the app can leave an attempt without an exit event.

For a dashboard smoke test, open a configured build, start a puzzle, leave and resume it, use a hint and finish it. Check that the attempt number stays the same through resume, advances on restart and produces one completion. Verify the currency and quantity of a sandbox store purchase against the receipt. Revenue uses the marketplace SKU price displayed for the purchase; ambiguous or unavailable price labels produce a purchase result without a fabricated amount.
