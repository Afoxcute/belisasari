# Docker deployment – environment setup

How to set up environment variables for running Belisasari with **Docker** (local `docker-compose` or server deployment).

---

## 1. One `.env` for all services

Docker Compose and the deploy workflow use a **single `.env` file** at the **project root**. Every service (frontend, elizaos-agents, js-scraper) reads the same file.

- **Local Docker:** put `.env` in the repo root (next to `docker-compose.yml`).  
  Do **not** commit it (it’s in `.gitignore`).
- **Server deployment:** put `.env` on the server at the path your compose/scripts use (e.g. `/home/ubuntu/belisasari/.env`). The GitHub deploy workflow mounts it into each container as `/app/.env`.

---

## 2. Create the `.env` file

### Option A – From the template (recommended)

1. Copy the example file (no secrets):

   ```bash
   cp .env.docker.example .env
   ```

2. Open `.env` and replace every `your_..._here` (and optional placeholders) with your real values.  
   Remove or comment out lines you don’t use (e.g. Telegram if you don’t use it).

### Option B – From scratch

1. Create a file named `.env` in the **repo root** (for local Docker) or on the server (for deployment).
2. Add at least the **required** variables from the table below, then any **optional** ones you need.

---

## 3. Variables to set

### Required (all deployments)

| Variable | Example / notes |
|----------|------------------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` or `SUPABASE_ANON_SECRET` | Supabase anon key (one is enough) |
| `OPENAI_API_KEY` | `sk-proj-...` |

### Strongly recommended

| Variable | Example / notes |
|---------|------------------|
| `RPC_URL` or `NEXT_PUBLIC_RPC_URL` | e.g. `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY` (needed for balance, swap, Jupiter) |

### Optional (by feature)

| Variable | Used by | When to set |
|----------|--------|-------------|
| `TWITTER_API_KEY` / `TWITTER_API_SECRET` / `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_TOKEN_SECRET` | Frontend post, ElizaOS, scrapers | If you want “Post to X” or agent tweets |
| `JUPITER_ULTRA_API_KEY` or `JUPITER_API_KEY` | Jupiter order/execute/search, token list | If you use Jupiter APIs |
| `SUPABASE_SERVICE_ROLE_KEY` | Telegram/scrapers that need service role | Only if you use service-role writes |
| `FRONTEND_URL` | ElizaOS (Jupiter list, TikTok hashtags API) | Set to your app URL in production (e.g. `https://your-domain.com`) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`, `TELEGRAM_GROUP_ID` | JS-scraper Telegram | If you run Telegram scraper |
| `TAPESTRY_API_KEY` | Frontend Tapestry/social | If you use Tapestry features |
| `ZERION_API_KEY` | Frontend portfolio | If you use Zerion |
| `NEXT_PUBLIC_APP_URL` | Metadata/canonical URL | e.g. `https://your-domain.com` |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy auth | If you use Privy |
| `SOLANA_PUBLIC_KEY`, `SOLANA_PRIVATE_KEY`, `SOLANA_RPC_URL` | ElizaOS | If agents do trading/signing |

For a full list of names and which service uses them, see **[ENV_REFERENCE.md](./ENV_REFERENCE.md)**.

---

## 4. Local Docker Compose

1. In the repo root, create `.env` as above (e.g. `cp .env.docker.example .env` and edit).
2. Start stack:

   ```bash
   docker-compose up -d
   ```

3. Compose passes `env_file: .env` to frontend, elizaos-agents, and js-scraper.  
   Optional **Postgres** service uses `DB_PASSWORD` from `.env`; if you don’t use it, you can omit `DB_PASSWORD` (or comment out the postgres service).

---

## 5. Server deployment (e.g. GitHub Actions + Ubuntu)

1. **GitHub Actions** needs its own secrets for **deploy only** (Docker Hub, SSH). See **[GITHUB_DEPLOYMENT_SECRETS.md](./GITHUB_DEPLOYMENT_SECRETS.md)** for `DOCKER_USERNAME`, `DOCKER_HUB_ACCESS_TOKEN`, `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`.

2. **On the server**, create the app `.env` once (e.g. `/home/ubuntu/belisasari/.env`) with the same variables as above. The workflow mounts this file into each container as `/app/.env:ro`.

   - SSH into the server.
   - Create the file:

     ```bash
     nano /home/ubuntu/belisasari/.env
     ```

   - Paste the same keys you use locally (SUPABASE_*, OPENAI_*, RPC_*, TWITTER_*, etc.). Save and exit.

3. On each deploy, the workflow runs `docker run ... -v /home/ubuntu/belisasari/.env:/app/.env:ro ...`, so containers always use the current server `.env`. You only need to edit the server `.env` when you add or change a variable.

---

## 6. Security

- **Never commit `.env`** (it’s in `.gitignore`).
- Prefer **one env file per environment** (e.g. one on your machine for local Docker, one on the server for production).
- For production, restrict who can read the server `.env` (e.g. `chmod 600 .env` and correct owner).

---

## 7. Quick checklist

- [ ] `.env` exists in repo root (local) or on server (deploy).
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `SUPABASE_ANON_SECRET`) are set.
- [ ] `OPENAI_API_KEY` is set.
- [ ] `RPC_URL` or `NEXT_PUBLIC_RPC_URL` is set (for balance/swap/Jupiter).
- [ ] For production: `FRONTEND_URL` and `NEXT_PUBLIC_APP_URL` point to your app URL.
- [ ] Optional: Twitter, Jupiter, Telegram, Tapestry, etc. added only if you use those features.

For GitHub deploy pipeline secrets and a longer variable list, see **[GITHUB_DEPLOYMENT_SECRETS.md](./GITHUB_DEPLOYMENT_SECRETS.md)**.
