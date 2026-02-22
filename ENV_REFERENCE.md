# Environment variables reference

## Where to set env

| Component        | Where to set |
|-----------------|--------------|
| **Frontend**    | `frontend/.env.local` or `frontend/.env` (Next.js loads these; `.env.local` overrides `.env` and is usually gitignored). |
| **ElizaOS**     | Project root `.env` or `elizaos-agents/.env` (depending on how you run the agents). |
| **js-scraper**  | Project root `.env` or `js-scraper/.env` (depending on how you run the scraper). |

**Tip:** If you run everything from the repo root (e.g. `node start-belisasari-server.js`), a single **root `.env`** can feed all components. Otherwise set vars in each component’s folder (e.g. `frontend/.env.local` for the Next app).

---

## Twitter (X API)

You need **4 values** from the [Twitter Developer Portal](https://developer.twitter.com/) (Project → App → Keys and tokens):

| Variable | Description | Used by |
|----------|-------------|--------|
| **App key (API Key)** | Consumer Key | |
| `TWITTER_API_KEY` | Same as above | Frontend API, js-scraper |
| `CONSUMER_KEY` | Same as above | ElizaOS |
| `NEXT_PUBLIC_TWITTER_CONSUMER_KEY` | Same (optional) | Frontend API fallback |
| **App secret (API Secret)** | Consumer Secret | |
| `TWITTER_API_SECRET` | Same as above | Frontend API, js-scraper |
| `CONSUMER_SECRET` | Same as above | ElizaOS |
| `NEXT_PUBLIC_TWITTER_CONSUMER_SECRET` | Same (optional) | Frontend API fallback |
| **Access Token** | User context token | |
| `TWITTER_ACCESS_TOKEN` | Same as above | Frontend API, js-scraper |
| `ZORO_ACCESS_TOKEN` | Same as above | ElizaOS |
| `NEXT_PUBLIC_TWITTER_ACCESS_TOKEN` | Same (optional) | Frontend API fallback |
| **Access Token Secret** | User context secret | |
| `TWITTER_ACCESS_TOKEN_SECRET` | Same as above | Frontend API, js-scraper |
| `ZORO_ACCESS_TOKEN_SECRET` | Same as above | ElizaOS |
| `NEXT_PUBLIC_TWITTER_ACCESS_TOKEN_SECRET` | Same (optional) | Frontend API fallback |

**Minimal set for all components (use one naming scheme):**

```env
# Twitter – use ONE set of names (e.g. TWITTER_* everywhere, or CONSUMER_* + ZORO_* for ElizaOS)
TWITTER_API_KEY=your_app_key
TWITTER_API_SECRET=your_app_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

If you only run **ElizaOS** and use its names:

```env
CONSUMER_KEY=your_app_key
CONSUMER_SECRET=your_app_secret
ZORO_ACCESS_TOKEN=your_access_token
ZORO_ACCESS_TOKEN_SECRET=your_access_token_secret
```

Frontend API and js-scraper also accept `CONSUMER_KEY` / `ZORO_*` as fallbacks, so the same values work with either naming.

---

## OpenAI

| Variable | Description | Used by |
|----------|-------------|--------|
| `OPENAI_API_KEY` | API key from [platform.openai.com](https://platform.openai.com/api-keys) (starts with `sk-`) | Frontend `/api/openai/chat`, ElizaOS iris-trading-agent, js-scraper (sentiment + tweet generation) |

**Where to set:** Same as above: `frontend/.env.local` for the Next app, root `.env` or each component’s `.env` when running Node scripts.

```env
OPENAI_API_KEY=sk-your_key_here
```

---

## Quick copy-paste (frontend only)

For **frontend** (dashboard, portfolio, NFTs, AI chat, Twitter post API), put this in **`frontend/.env.local`** (create the file if it doesn’t exist):

```env
# Twitter (Post / Share to Twitter)
TWITTER_API_KEY=your_app_key
TWITTER_API_SECRET=your_app_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# OpenAI (AI t, portfolio/NFT insights)
OPENAI_API_KEY=sk-your_openai_key
```

Replace the placeholders with your real keys. Do not commit `.env.local` if it contains secrets (it’s usually in `.gitignore`).
