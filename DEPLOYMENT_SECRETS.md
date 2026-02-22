# GitHub / Deployment Secrets Reference

Use these **secret** environment variable names in your deployment (e.g. **GitHub → Settings → Secrets and variables → Actions**, or your host’s env UI). Values must stay secret; never commit them.

---

## Required (platform won’t start without these)

| Secret name | Used by | Notes |
|-------------|----------|--------|
| `SUPABASE_URL` | Frontend, ElizaOS, js-scraper, bitquery | Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | All services | Supabase anon/public key (JWT). Can also be set as `SUPABASE_ANON_SECRET` (same value). |
| `OPENAI_API_KEY` | Frontend (AI chat), ElizaOS | OpenAI API key, e.g. `sk-proj-...` |

---

## Recommended for full functionality

| Secret name | Used by | Notes |
|-------------|----------|--------|
| `RPC_URL` | Frontend (balance, swap, NFTs), Solana flows | Dedicated RPC URL; e.g. Helius: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY` |
| `JUPITER_ULTRA_API_KEY` or `JUPITER_API_KEY` | Frontend (Jupiter Ultra order/execute, token lists) | From [Jupiter Station](https://station.jup.ag) |
| `TWITTER_API_KEY` | Frontend (post to Twitter), ElizaOS (tweets) | Twitter API v2 app “Consumer Keys” → API Key |
| `TWITTER_API_SECRET` | Frontend, ElizaOS | Twitter API v2 app “Consumer Keys” → API Secret |
| `TWITTER_ACCESS_TOKEN` | Frontend, ElizaOS | Twitter “Access Token” (user context) |
| `TWITTER_ACCESS_TOKEN_SECRET` | Frontend, ElizaOS | Twitter “Access Token Secret” |

*Alternative Twitter names (same values): `CONSUMER_KEY`, `CONSUMER_SECRET`, `ZORO_ACCESS_TOKEN`, `ZORO_ACCESS_TOKEN_SECRET`.*

---

## Optional (per feature)

| Secret name | Used by | Notes |
|-------------|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | js-scraper (writes), bitquery | Supabase service role key (bypasses RLS). Keep highly restricted. |
| `ZERION_API_KEY` | Frontend (Portfolio) | [Zerion](https://dashboard.zerion.io) |
| `TAPESTRY_API_KEY` | Frontend (Tapestry/social features) | Tapestry API key |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Frontend (Privy auth) | From Privy dashboard (can be public; “NEXT_PUBLIC_” is exposed to client) |
| `TELEGRAM_BOT_TOKEN` | js-scraper (Telegram scraper) | Bot token from @BotFather |
| `TELEGRAM_CHANNEL_ID` | js-scraper | Telegram channel ID |
| `TELEGRAM_GROUP_ID` | js-scraper | Telegram group ID |
| `SOLANA_PRIVATE_KEY` | ElizaOS (trading/signing) | Base58 private key (only if agent signs txs) |
| `SOLANA_PUBLIC_KEY` | ElizaOS | Matching public key |
| `HELIUS_API_KEY` | Optional RPC; some flows | If you build RPC_URL from this |
| `BIRDEYE_API_KEY` | ElizaOS (optional) | Birdeye API |
| `BITQUERY_API_KEY` | ElizaOS (optional) | Bitquery |
| `ACCESS_TOKEN` | bitquery | Bitquery access token |
| `OUTLIGHT_API_KEY` | js-scraper (Outlight) | If using Outlight scraper |
| `TIKTOK_API_KEY` | js-scraper (TikTok) | If using TikTok API |

---

## For GitHub Actions (e.g. build + deploy)

Minimal set to **build** the app and run the server:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or `SUPABASE_ANON_SECRET`)
- `OPENAI_API_KEY`

For **full app + ElizaOS + Twitter** in deployment, add:

- `RPC_URL`
- `JUPITER_ULTRA_API_KEY` or `JUPITER_API_KEY`
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`

---

## Non-secret (can be in repo or env as variables)

- `NODE_ENV` (e.g. `production`)
- `PORT` (e.g. `3000`)
- `HOST` (e.g. `0.0.0.0`)
- `FRONTEND_URL` (e.g. `https://your-domain.com`) for ElizaOS
- `NEXT_PUBLIC_*` vars that contain no secrets (e.g. `NEXT_PUBLIC_SUPABASE_URL` = same as `SUPABASE_URL` if you want client-side Supabase)

---

## Quick copy-paste list for GitHub Secrets

Add these as **repository secrets** (or environment secrets) with the **exact names** below. Fill values in GitHub UI; do not paste real values into this file.

```
SUPABASE_URL
SUPABASE_ANON_KEY
OPENAI_API_KEY
RPC_URL
JUPITER_ULTRA_API_KEY
TWITTER_API_KEY
TWITTER_API_SECRET
TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_TOKEN_SECRET
SUPABASE_SERVICE_ROLE_KEY
ZERION_API_KEY
TAPESTRY_API_KEY
NEXT_PUBLIC_PRIVY_APP_ID
TELEGRAM_BOT_TOKEN
TELEGRAM_CHANNEL_ID
TELEGRAM_GROUP_ID
```

Use the table above to decide which of these you need for your deployment target (e.g. Vercel, Ubuntu server, or GitHub Actions runner).
