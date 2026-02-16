/**
 * Solana Meme Token Keywords - Complete List
 * Used by TikTok scraper for search and hashtag terms.
 * Sourced from: Top Tier, Trending Narrative, Meta, Combo, and Platform keywords.
 * Red-flag / scam-only terms are excluded (safemoon, guaranteed, 100x, 1000x, etc.).
 */

const RAW_KEYWORDS = [
  // 1. Dog themed
  "bonk", "doge", "shiba", "inu", "samoyedcoin", "samo", "wif", "dogwifhat", "myro", "wen", "bonkinu", "puppy", "hound", "canine", "paws", "woof", "bark",
  // 2. Cat themed
  "cat", "cats", "kitty", "meow", "popcat", "neko", "catcoin", "felix", "garfield", "grumpy", "tabby", "kitten", "purr", "whiskers", "feline",
  // 3. Pepe / Frog
  "pepe", "frog", "kek", "peepo", "apu", "hoppy", "ribbit", "wojak", "bobo", "groyper", "pepecoin", "feels", "rare", "smug", "sad", "happy",
  // 4. Moon / Space / Rocket
  "moon", "rocket", "mars", "space", "astronaut", "lambo", "moonshot", "launch", "orbit", "stellar", "cosmic", "galaxy", "interstellar", "voyage",
  // 5. Food / Snack
  "pizza", "burger", "taco", "sushi", "ramen", "cookie", "cake", "bacon", "cheese", "potato", "nugget", "fries", "donut", "pancake", "waffle",
  // 6. AI / Tech
  "ai", "artificial", "intelligence", "robot", "bot", "cyber", "digital", "neural", "machine", "learning", "gpt", "chatbot", "algorithm", "quantum",
  // 7. Gambling / Casino
  "casino", "gamble", "dice", "jackpot", "slot", "bet", "poker", "roulette", "lottery", "odds", "lucky", "fortune", "vegas", "win", "rich",
  // 8. Solana specific
  "sol", "solana", "blazefast", "fastaf", "speed", "swift", "turbo", "phantom", "backpack", "jupiter", "jup", "jito", "bonkbot",
  // 9. Political / Current events
  "trump", "biden", "election", "vote", "president", "america", "patriot", "maga", "freedom", "usa", "liberty", "constitution", "senator",
  // 10. Rage / Emotion
  "rage", "mad", "angry", "cope", "seethe", "salt", "tears", "cry", "laugh", "lol", "based", "cringe", "gigachad", "sigma", "alpha",
  // 11. Community / Holder
  "community", "holder", "diamond", "hands", "paper", "ape", "degen", "hodl", "wagmi", "ngmi", "fren", "fam", "squad", "gang", "army",
  // 12. Pump / Financial
  "pump", "parabolic", "bullish", "bull", "gains", "profit", "millionaire", "billion", "trillion", "quadrillion", "yacht",
  // 13. Rug / Risk (anti-scam / legit)
  "rug", "pull", "scam", "safe", "safu", "audit", "locked", "renounced", "dev", "developer", "team", "doxxed", "kyc", "verified", "legit",
  // 14. Animals
  "monkey", "gorilla", "chimp", "banana", "kong", "harambe", "toad", "gecko", "lizard", "snake", "turtle", "dolphin", "whale", "shark", "fish", "penguin", "panda", "bear", "hamster", "rat", "mouse", "elephant", "tiger", "lion", "bird",
  // 15. Viral memes
  "chad", "beta", "virgin", "npc", "brain", "expanding", "distracted", "boyfriend", "stonks", "panik", "kalm", "chungus", "wholesome", "dank",
  // 16. Gen Z / Slang
  "bruh", "sus", "cap", "nocap", "ratio", "mid", "fire", "bussin", "slaps", "hits", "different", "valid", "vibes", "energy", "slay",
  // 17. Number memes
  "420", "69", "42", "1337", "404", "666", "777", "888", "999", "billion", "trillion", "infinity",
  // 18. Pump.fun / Launch
  "fun", "pumpfun", "pumpportal", "bonding", "curve", "fair", "presale", "stealth", "graduated", "raydium",
  // 19. Bot / Tools
  "sniper", "buy", "sell", "trade", "swap", "scanner", "tracker", "alert", "signal", "volume", "wallet",
  // 20. Holidays / Seasons
  "christmas", "santa", "xmas", "halloween", "spooky", "easter", "bunny", "valentine", "love", "heart", "summer", "winter", "spring", "thanksgiving", "newyear", "party", "celebrate",
  // 21. Sports
  "sport", "sports", "football", "soccer", "basketball", "race", "nascar", "f1", "racing", "champion", "winner", "gold", "medal", "olympics", "world", "cup", "super", "bowl",
  // 22. Anti-establishment
  "decentralized", "defi", "dex", "cex", "bank", "anti", "revolution", "rebel", "anarchy", "chaos", "free",
  // 23. Meta / Self-aware
  "rugpull", "ponzi", "pyramid", "exit", "liquidity", "dump", "bag", "fud", "shill", "narrative",
  // 24. Combo / Name patterns - adjectives & suffixes
  "crazy", "silly", "stupid", "dumb", "smart", "fast", "slow", "big", "small", "fat", "tiny", "mega", "ultra",
  "coin", "token", "cash", "bucks", "finance", "dao",
  "mini", "micro", "baby", "mama", "papa", "king", "queen", "lord", "captain", "sir", "lady", "princess", "prince",
  // 25. Generic crypto / meme (original scraper terms)
  "memecoin", "crypto", "meme", "bags", "trading", "signals", "cryptosignals",
];

// Deduplicate and filter (lowercase, no empty)
const ALL = [...new Set(RAW_KEYWORDS.map((k) => String(k).toLowerCase().trim()).filter(Boolean))];

/** All meme keywords for TikTok search and hashtag scraping (single words / safe for URL). */
export const MEME_KEYWORDS = ALL;

/** Same list as searchTerms (alias). */
export const searchTerms = MEME_KEYWORDS;

/** Same list as hashtagTerms (alias). */
export const hashtagTerms = MEME_KEYWORDS;

/** Count for logging. */
export const MEME_KEYWORDS_COUNT = ALL.length;

export default MEME_KEYWORDS;
