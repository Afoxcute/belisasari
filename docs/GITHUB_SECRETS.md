# GitHub secrets – env values to store

Add these in **GitHub** → repo → **Settings** → **Secrets and variables** → **Actions** (and/or **Environments** if you use deployment environments). Use the **exact names** below so your workflow or deployment can map them into the app.

---

## Required for platform startup (`yarn belisasari`)

| Secret name | Used by | Notes |
|-------------|---------|--------|
| `SUPABASE_URL` | Frontend, ElizaOS, js-scraper, bitquery | Supabase project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Frontend, ElizaOS, start-belisasari-server check | Anon/public key from Supabase Dashboard → Settings → API |
| `OPENAI_API_KEY` | Frontend (chat), ElizaOS, js-scraper | OpenAI API key; required by start-belisasari-server |

---

## Supabase (optional but recommended)

| Secret name | Used by | Notes |
|-------------|---------|--------|
| `SUPABASE_ANON_SECRET` | Frontend, ElizaOS, js-scraper | Same value as `SUPABASE_ANON_KEY`; some code reads this name |
| `SUPABASE_SERVICE_ROLE_KEY` | js-scraper (Telegram/inserts), bitquery | Service role key (bypasses RLS); **never** expose to client |

---

## Twitter (ElizaOS tweets, frontend share, js-scraper)

Use **one** of these sets (do **not** mix; pick one naming scheme).

**Option A – `TWITTER_*` (recommended, same as frontend):**

| Secret name | Notes |
|-------------|--------|
| `TWITTER_API_KEY` | Twitter app Consumer Key (API Key) |
| `TWITTER_API_SECRET` | Twitter app Consumer Secret (API Secret) |
| `TWITTER_ACCESS_TOKEN` | App access token |
| `TWITTER_ACCESS_TOKEN_SECRET` | App access token secret |

**Option B – legacy names (ElizaOS):**

| Secret name | Notes |
|-------------|--------|
| `CONSUMER_KEY` | Same as TWITTER_API_KEY |
| `CONSUMER_SECRET` | Same as TWITTER_API_SECRET |
| `ZORO_ACCESS_TOKEN` | Same as TWITTER_ACCESS_TOKEN |
| `ZORO_ACCESS_TOKEN_SECRET` | Same as TWITTER_ACCESS_TOKEN_SECRET |

---

## Solana / RPC

| Secret name | Used by | Notes |
|-------------|---------|--------|
| `RPC_URL` | Frontend (balance, swap), server-side | Full URL including key, e.g. `https://mainnet.helius-rpc.com/?api-key=...` |
| `HELIUS_API_KEY` | Optional | If you build RPC_URL from this |
| `SOLANA_PRIVATE_KEY` | ElizaOS (trading) | Base58 private key; **highly sensitive** |
| `SOLANA_PUBLIC_KEY` | ElizaOS | Wallet public key |

---

## Other API keys (optional features)

| Secret name | Used by | Notes |
|-------------|---------|--------|
| `JUPITER_ULTRA_API_KEY` / `JUPITER_API_KEY` | Frontend / bitquery | Jupiter API key (e.g. station.jup.ag) |
| `BIRDEYE_API_KEY` | ElizaOS, optional | Birdeye API |
| `ZERION_API_KEY` | Frontend (portfolio) | Zerion dashboard |
| `TAPESTRY_API_KEY` | Frontend (Tapestry suggested) | Tapestry API |
| `BITQUERY_API_KEY` | ElizaOS (Bitquery) | Bitquery API key |
| `ACCESS_TOKEN` | ElizaOS (Bitquery) | Bitquery access token (if different from API key) |

---

## Telegram (js-scraper)

| Secret name | Notes |
|-------------|--------|
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHANNEL_ID` | Optional |
| `TELEGRAM_GROUP_ID` | Optional |

---

## Non-secret (do **not** put in GitHub Secrets)

- `SUPABASE_URL` – often in Secrets anyway so one place holds config; can be in Variables if you prefer.
- `FRONTEND_URL` – e.g. `http://localhost:3000` or your deployment URL; use Variables or workflow env.
- `NODE_ENV`, `PORT`, `HOST`, `DEBUG`, `LOG_LEVEL` – use workflow/env or Variables.

---

## Minimal set for CI/deploy

For **build + run** of the full stack (e.g. `yarn belisasari`), you need at least:

1. `SUPABASE_URL`
2. `SUPABASE_ANON_KEY` (and optionally `SUPABASE_ANON_SECRET` = same value)
3. `OPENAI_API_KEY`

For **tweets** to work, add the four Twitter secrets (either `TWITTER_*` or `CONSUMER_*` / `ZORO_*`).  
For **Telegram scraper** and **service-role DB writes**, add `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_BOT_TOKEN` as needed.
