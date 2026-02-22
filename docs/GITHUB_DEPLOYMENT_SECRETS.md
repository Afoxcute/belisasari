# GitHub deployment secrets and env

Use this list to configure **GitHub Settings → Secrets and variables → Actions** and your **server `.env`** for Belisasari deployment.

---

## 1. GitHub Actions secrets (required for deploy)

Add these under **Settings → Secrets and variables → Actions → Secrets**:

| Secret name | Description | Example / where to get it |
|-------------|-------------|---------------------------|
| `DOCKER_USERNAME` | Docker Hub username | Your Docker Hub login |
| `DOCKER_HUB_ACCESS_TOKEN` | Docker Hub password or access token | Docker Hub → Account Settings → Security → Access Tokens |
| `SSH_HOST` | Deploy server hostname or IP | e.g. `ec2-xx-xx-xx-xx.compute.amazonaws.com` or IP |
| `SSH_USERNAME` | SSH user on the server | e.g. `ubuntu` |
| `SSH_PRIVATE_KEY` | Full private key for SSH (PEM) | Contents of your `.pem` file (including `-----BEGIN ... -----`) |

The workflow uses these to push images to Docker Hub and SSH into the server to run `docker-compose`.

---

## 2. Application env (server `.env`)

The deploy workflow expects a **`.env` file on the server** at `/home/ubuntu/belisasari/.env` (or the path your compose uses). It is **not** built from GitHub Secrets today; you create and edit it on the server (e.g. over SSH).

These are the **secret / sensitive** and common env names to put in that file. Use the exact names; values stay on the server and must never be committed.

### Required (core platform)

| Variable | Used by | Notes |
|----------|--------|--------|
| `SUPABASE_URL` | Frontend, ElizaOS, js-scraper | Supabase project URL |
| `SUPABASE_ANON_KEY` or `SUPABASE_ANON_SECRET` | Frontend, ElizaOS, js-scraper, DB integration | Supabase anon key (one name is enough) |
| `OPENAI_API_KEY` | Frontend (chat), ElizaOS, js-scraper | OpenAI API key |

### RPC / Solana (recommended)

| Variable | Used by | Notes |
|----------|--------|--------|
| `RPC_URL` or `NEXT_PUBLIC_RPC_URL` | Frontend APIs, balance/swap/Jupiter | e.g. Helius/QuickNode RPC URL with API key |
| `JUPITER_ULTRA_API_KEY` or `JUPITER_API_KEY` | Jupiter order/execute/search, token list | If using Jupiter Ultra / paid API |

### Twitter (optional – for posting tweets)

| Variable | Used by | Notes |
|----------|--------|--------|
| `TWITTER_API_KEY` or `CONSUMER_KEY` | ElizaOS, frontend post API, js-scraper | App / consumer key |
| `TWITTER_API_SECRET` or `CONSUMER_SECRET` | Same | App / consumer secret |
| `TWITTER_ACCESS_TOKEN` or `ZORO_ACCESS_TOKEN` | Same | User access token |
| `TWITTER_ACCESS_TOKEN_SECRET` or `ZORO_ACCESS_TOKEN_SECRET` | Same | User access token secret |

### Supabase (optional, for scraper / service role)

| Variable | Used by | Notes |
|----------|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Telegram scraper (and any service-role access) | Only if you use service-role; keep very secret |
| `SUPABASE_KEY` | Some scrapers | Alternative name used in some scripts |

### ElizaOS / agents (optional)

| Variable | Used by | Notes |
|----------|--------|--------|
| `FRONTEND_URL` | ElizaOS (Jupiter list, TikTok hashtags API) | e.g. `https://your-domain.com` |
| `SOLANA_PRIVATE_KEY` | ElizaOS (if trading/signing) | Base58 private key |
| `SOLANA_PUBLIC_KEY` | ElizaOS | Wallet address |
| `SOLANA_RPC_URL` | ElizaOS config | RPC URL |
| `HELIUS_API_KEY` / `BIRDEYE_API_KEY` | ElizaOS (optional) | If used by agent config |

### Telegram (optional)

| Variable | Used by | Notes |
|----------|--------|--------|
| `TELEGRAM_BOT_TOKEN` | js-scraper telegram scraper | From @BotFather |
| `TELEGRAM_CHANNEL_ID` | Optional | If posting to a channel |
| `TELEGRAM_GROUP_ID` | Optional | If posting to a group |

### Other optional APIs

| Variable | Used by | Notes |
|----------|--------|--------|
| `TAPESTRY_API_KEY` | Frontend Tapestry/social features | Tapestry API |
| `ZERION_API_KEY` | Frontend portfolio/zerion APIs | Zerion dashboard |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Frontend (Privy) | If using Privy auth |
| `BITQUERY_API_KEY` / `ACCESS_TOKEN` | bitquery / Iris | If using Bitquery |

---

## 3. Public / non-secret env (optional)

Safe to commit or set in GitHub Variables (not Secrets) if you want:

- `NODE_ENV=production`
- `PORT=3000`
- `HOST=0.0.0.0`
- `NEXT_PUBLIC_APP_URL=https://your-domain.com` (for metadata/canonical URL)

---

## 4. Summary checklist for GitHub

**Under Settings → Secrets and variables → Actions → Secrets, add:**

1. `DOCKER_USERNAME`
2. `DOCKER_HUB_ACCESS_TOKEN`
3. `SSH_HOST`
4. `SSH_USERNAME`
5. `SSH_PRIVATE_KEY`

**On the server** (e.g. `~/belisasari/.env`), set at least:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or `SUPABASE_ANON_SECRET`)
- `OPENAI_API_KEY`
- `RPC_URL` (or `NEXT_PUBLIC_RPC_URL`) if you use balance/swap/Jupiter

Then add any of the optional variables above (Twitter, Telegram, Jupiter, Tapestry, etc.) as needed for the features you use.
