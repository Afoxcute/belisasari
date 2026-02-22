# Belisasari – Environment variables reference

All environment variables used anywhere in the Belisasari source code, by area. Use this for local `.env` / `.env.local` and deployment.

**Docker deployment:** see **[DOCKER_ENV_SETUP.md](./DOCKER_ENV_SETUP.md)** for step-by-step env setup with Docker and the root `.env.docker.example` template.

---

## Root / startup (`start-belisasari-server.js`)

| Variable | Purpose |
|----------|--------|
| `PORT` | Frontend port (default `3000`) |
| `NODE_ENV` | `production` or `development` |
| `HOST` | Bind host (default `0.0.0.0`) |

Startup also loads `frontend/.env.local` when present so all child processes get those vars.

---

## Frontend (Next.js)

### Server-only (API routes, server components)

| Variable | Used in / purpose |
|----------|-------------------|
| `SUPABASE_URL` | Supabase project URL (API routes, profiles, dashboard, TikTok, sync-prices, etc.) |
| `SUPABASE_ANON_SECRET` | Supabase anon key (same routes; some use `SUPABASE_ANON_KEY` in docs) |
| `SUPABASE_ANON_KEY` | Alternative name for anon key (patterns, some backups) |
| `RPC_URL` | Solana RPC (balance, swap, Helius NFTs, Jupiter) |
| `NEXT_PUBLIC_RPC_URL` | Fallback RPC (balance, swap, Helius, Solana balance) |
| `OPENAI_API_KEY` | OpenAI chat API |
| `TWITTER_API_KEY` | Twitter post API (or `CONSUMER_KEY` / `NEXT_PUBLIC_TWITTER_CONSUMER_KEY`) |
| `TWITTER_API_SECRET` | Twitter post (or `CONSUMER_SECRET` / `NEXT_PUBLIC_TWITTER_CONSUMER_SECRET`) |
| `TWITTER_ACCESS_TOKEN` | Twitter post (or `ZORO_ACCESS_TOKEN` / `NEXT_PUBLIC_TWITTER_ACCESS_TOKEN`) |
| `TWITTER_ACCESS_TOKEN_SECRET` | Twitter post (or `ZORO_ACCESS_TOKEN_SECRET` / `NEXT_PUBLIC_TWITTER_ACCESS_TOKEN_SECRET`) |
| `TAPESTRY_API_KEY` | Tapestry/social APIs (suggested, profiles, follow, identities, etc.) |
| `TAPESTRY_URL` | Tapestry base URL (server; see also `NEXT_PUBLIC_TAPESTRY_URL`) |
| `ZERION_API_KEY` | Zerion portfolio, positions, transactions, chart |
| `JUPITER_ULTRA_API_KEY` | Jupiter order, execute, search |
| `JUPITER_API_KEY` | Jupiter token list, search (fallback) |
| `NODE_ENV` | Dev checks (e.g. real-time-feed) |

### Client-visible (`NEXT_PUBLIC_*`)

| Variable | Purpose |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | App URL for metadata (layout; default `https://belisasari.vercel.app`) |
| `NEXT_PUBLIC_RPC_URL` | RPC in browser (swap, balance, etc.) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL for patterns/insights/detections/summary (client-side Supabase) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for same |
| `NEXT_PUBLIC_TAPESTRY_URL` | Tapestry URL in browser |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy auth (PrivyClientProvider) |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL (realtime, ai-chat-test; default `ws://localhost:8080/ws`) |
| `NEXT_PUBLIC_TWITTER_CONSUMER_KEY` | Twitter in browser (post API fallback) |
| `NEXT_PUBLIC_TWITTER_CONSUMER_SECRET` | Same |
| `NEXT_PUBLIC_TWITTER_ACCESS_TOKEN` | Same |
| `NEXT_PUBLIC_TWITTER_ACCESS_TOKEN_SECRET` | Same |

---

## ElizaOS agents (`elizaos-agents/`)

| Variable | Used in / purpose |
|----------|-------------------|
| `FRONTEND_URL` | Iris index, iris-trading-agent (Jupiter list, TikTok hashtags API; default `http://localhost:3000`) |
| `SUPABASE_URL` | Supabase integration, database integration, iris-trading-agent |
| `SUPABASE_ANON_KEY` | Supabase integration, iris-trading-agent |
| `SUPABASE_ANON_SECRET` | Same (alternative to ANON_KEY) |
| `OPENAI_API_KEY` | Iris trading agent |
| `CONSUMER_KEY` | Twitter (or `TWITTER_API_KEY`) |
| `CONSUMER_SECRET` | Twitter (or `TWITTER_API_SECRET`) |
| `ZORO_ACCESS_TOKEN` | Twitter + userTimeline / userMentionTimeline (or `TWITTER_ACCESS_TOKEN`) |
| `ZORO_ACCESS_TOKEN_SECRET` | Twitter (or `TWITTER_ACCESS_TOKEN_SECRET`) |
| `TWITTER_API_KEY` | Twitter integration fallback |
| `TWITTER_API_SECRET` | Same |
| `TWITTER_ACCESS_TOKEN` | Same |
| `TWITTER_ACCESS_TOKEN_SECRET` | Same |
| `SOLANA_PUBLIC_KEY` | Iris trading agent (wallet address) |
| `SOLANA_PRIVATE_KEY` | ai-trading-engine (base58 or JSON array) |
| `SOLANA_RPC_URL` | agent-config, ai-trading-engine (default mainnet RPC) |
| `SOLANA_CLUSTER` | env.example only |
| `HELIUS_API_KEY` | env.example only |
| `BIRDEYE_API_KEY` | env.example only |
| `TELEGRAM_BOT_TOKEN` | telegram-manager-agent |
| `TELEGRAM_CHANNEL_ID` | telegram-manager-agent |
| `TELEGRAM_GROUP_ID` | telegram-manager-agent |
| `BITQUERY_API_KEY` | INTEGRATION_GUIDE / Bitquery usage |
| `ACCESS_TOKEN` | Bitquery bearer token |
| `NODE_ENV` | adk_workflow_orchestrator (environment label) |

---

## JS-scraper (`js-scraper/`)

| Variable | Used in / purpose |
|----------|-------------------|
| `SUPABASE_URL` | All scrapers, storage, tests, outlight, telegram, adk, etc. |
| `SUPABASE_ANON_SECRET` | Many scripts (or `SUPABASE_KEY`) |
| `SUPABASE_KEY` | ai_content_analysis, adk_workflow, twitter_integration, index, windows, linux, tests, etc. |
| `SUPABASE_SERVICE_ROLE_KEY` | telegram_scraper, outlight-scraper, auto_scrape_and_store, index.mjs (when writing) |
| `OPENAI_API_KEY` | ai_content_analysis_agents, twitter_integration, intelligent_twitter_agents |
| `TWITTER_API_KEY` | twitter_integration, intelligent_twitter_agents (or `TWITTER_CONSUMER_KEY`) |
| `TWITTER_API_SECRET` | Same (or `TWITTER_CONSUMER_SECRET`) |
| `TWITTER_ACCESS_TOKEN` | Same (or `ZORO_ACCESS_TOKEN`) |
| `TWITTER_ACCESS_TOKEN_SECRET` | Same (or `ZORO_ACCESS_TOKEN_SECRET`); note: twitter_integration also uses `TWITTER_ACCESS_SECRET` |
| `TWITTER_ACCESS_SECRET` | twitter_integration (typo/alias for access token secret) |
| `TELEGRAM_BOT_TOKEN` | telegram_scraper.mjs |
| `FRONTEND_URL` | adk_workflow_orchestrator (default `http://localhost:3000`) |
| `NODE_ENV` | adk_workflow_orchestrator, intelligent_twitter_agents |
| `MEME_KEYWORDS_LIMIT` | Optional limit (integer) in index.mjs, auto_scrape_and_store, windows/alt, windows/index, linux/index |
| `EXECUTABLE_PATH` | windows/alt.mjs, windows/index.mjs (Puppeteer) |
| `USER_DATA_DIR` | windows/alt.mjs, windows/index.mjs (Puppeteer) |
| `BIRDEYE_API_KEY` | test.mjs (optional) |

---

## Bitquery (`bitquery/`)

| Variable | Used in / purpose |
|----------|-------------------|
| `BITQUERY_API_KEY` | market-data, test-env-loading, test-api-connection, jup-api (scripts) |
| `ACCESS_TOKEN` | Bitquery bearer token (market-data, test scripts) |
| `SUPABASE_URL` | market-data, memecoins-from-jup, prices-from-jup, prices.mjs, memecoins.mjs |
| `SUPABASE_ANON_SECRET` | Same scripts |
| `SUPABASE_SERVICE_ROLE_KEY` | memecoins-from-jup, prices-from-jup |
| `JUPITER_API_KEY` | jup-api.mjs |

---

## Solana starter kit (`solana-starter-kit/`)

| Variable | Used in / purpose |
|----------|-------------------|
| `TAPESTRY_API_KEY` | API routes, socialfi, tapestry lib |
| `TAPESTRY_URL` | socialfi, api.ts |
| `NEXT_PUBLIC_TAPESTRY_URL` | socialfi (client) |
| `RPC_URL` | swap, tokens balance, das-api |
| `NEXT_PUBLIC_RPC_URL` | use-jupiter-swap, use-token-balance |
| `HELIUS_API_KEY` | priority-fee |
| `NEXT_PUBLIC_HELIUS_API_KEY` | fetch-assets |
| `NEXT_PUBLIC_BIRDEYE_API_KEY` | use-get-profile-portfolio |
| `NEXT_PUBLIC_PRIVY_APP_ID` | PrivyClientProvider |
| `NEXT_PUBLIC_DAPP_ADDRESS` | dialect-notifications-component |
| `PAYER_PRIVATE_KEY` | swap service |
| `NODE_ENV` | socialfi (production check) |

---

## Single alphabetical list (all names)

- `ACCESS_TOKEN`
- `BIRDEYE_API_KEY`
- `BITQUERY_API_KEY`
- `CONSUMER_KEY`
- `CONSUMER_SECRET`
- `EXECUTABLE_PATH`
- `FRONTEND_URL`
- `HELIUS_API_KEY`
- `HOST`
- `JUPITER_API_KEY`
- `JUPITER_ULTRA_API_KEY`
- `MEME_KEYWORDS_LIMIT`
- `NODE_ENV`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BIRDEYE_API_KEY`
- `NEXT_PUBLIC_DAPP_ADDRESS`
- `NEXT_PUBLIC_HELIUS_API_KEY`
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_TAPESTRY_URL`
- `NEXT_PUBLIC_TWITTER_ACCESS_TOKEN`
- `NEXT_PUBLIC_TWITTER_ACCESS_TOKEN_SECRET`
- `NEXT_PUBLIC_TWITTER_CONSUMER_KEY`
- `NEXT_PUBLIC_TWITTER_CONSUMER_SECRET`
- `NEXT_PUBLIC_WS_URL`
- `OPENAI_API_KEY`
- `PAYER_PRIVATE_KEY`
- `PORT`
- `RPC_URL`
- `SOLANA_CLUSTER`
- `SOLANA_PRIVATE_KEY`
- `SOLANA_PUBLIC_KEY`
- `SOLANA_RPC_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_ANON_SECRET`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `TAPESTRY_API_KEY`
- `TAPESTRY_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHANNEL_ID`
- `TELEGRAM_GROUP_ID`
- `TWITTER_ACCESS_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `USER_DATA_DIR`
- `ZERION_API_KEY`
- `ZORO_ACCESS_TOKEN`
- `ZORO_ACCESS_TOKEN_SECRET`

---

## Notes

- **Supabase**: Use either `SUPABASE_ANON_KEY` or `SUPABASE_ANON_SECRET` (or both set to same value). Some code uses `SUPABASE_KEY` as alias. Service role only where required (e.g. telegram scraper, bitquery scripts).
- **Twitter**: Use one set: `TWITTER_*` or `CONSUMER_KEY`/`CONSUMER_SECRET` + `ZORO_ACCESS_TOKEN`/`ZORO_ACCESS_TOKEN_SECRET`. `NEXT_PUBLIC_TWITTER_*` only if you need Twitter from the browser (less secure).
- **RPC**: Prefer server-only `RPC_URL`; use `NEXT_PUBLIC_RPC_URL` only if the client must call RPC directly.
- **Frontend**: Put secrets in `.env.local` (or root `.env` when using `yarn belisasari`); the startup script loads `frontend/.env.local` into `process.env` for child processes.
