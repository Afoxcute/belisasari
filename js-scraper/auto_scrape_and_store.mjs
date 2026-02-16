import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Headers } from 'node-fetch';
import fs from 'fs';
import { extractComments, VideoScraper } from "./scraper.mjs";

// Polyfill global fetch and Headers
global.fetch = fetch;
global.Headers = Headers;

dotenv.config();

// Prefer SERVICE_ROLE_KEY so writes work (RLS on tiktoks only allows SELECT for anon)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_SECRET ||
  process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase config. Set SUPABASE_URL and one of: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_SECRET, or SUPABASE_KEY');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Tip: Set SUPABASE_SERVICE_ROLE_KEY in .env so the scraper can write to tiktoks (RLS blocks anon key from INSERT).');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configure logging
const logger = {
  info: (...args) => console.log(new Date().toISOString(), "INFO:", ...args),
  error: (...args) =>
    console.error(new Date().toISOString(), "ERROR:", ...args),
};

const processedUrls = new Set();

// Helper function to sanitize strings
const sanitize = (str) => (str ? str.replace(/\u0000/g, "") : "");

// Helper function to format views
function formatViews(views) {
  if (!views) return 0;
  
  const unitMultiplier = {
    k: 1_000,
    m: 1_000_000,
    b: 1_000_000_000,
  };

  const unit = views.slice(-1).toLowerCase();
  if (unit in unitMultiplier) {
    return Math.floor(parseFloat(views.slice(0, -1)) * unitMultiplier[unit]);
  }
  return Math.floor(parseFloat(views)) || 0;
}

// Helper function to extract TikTok ID from URL
function getTiktokId(url) {
  if (!url) return null;
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

// Function to store TikTok data immediately
async function storeTikTokDataImmediately(tiktokData) {
  try {
    const tiktokId = getTiktokId(tiktokData.video_url);
    if (!tiktokId) {
      console.log('Skipping: Invalid TikTok URL');
      return null;
    }

    const tiktokRecord = {
      id: tiktokId,
      username: sanitize(tiktokData.author || ''),
      url: sanitize(tiktokData.video_url),
      thumbnail: sanitize(tiktokData.thumbnail_url || ''),
      created_at: tiktokData.posted_timestamp ? new Date(tiktokData.posted_timestamp * 1000).toISOString() : new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      views: formatViews(tiktokData.views?.toString() || "0"),
      comments: tiktokData.comments?.count || 0,
    };

    // Insert or update TikTok record immediately
    const { data: tiktokResult, error: tiktokError } = await supabase
      .from('tiktoks')
      .upsert(tiktokRecord, { onConflict: 'id' })
      .select();

    if (tiktokError) {
      if (tiktokError.code === '42501') {
        console.error('TikTok storage blocked by RLS. Set SUPABASE_SERVICE_ROLE_KEY in .env (Supabase Dashboard → Settings → API).');
      }
      console.error('Error storing TikTok:', tiktokError.message || tiktokError);
      return null;
    }

    console.log(`✅ Stored TikTok: ${tiktokId} (${tiktokRecord.username})`);
    return tiktokResult[0];
  } catch (error) {
    console.error('Error processing TikTok data:', error);
    return null;
  }
}

// Function to store token mentions immediately
async function storeTokenMentionsImmediately(tiktokId, comments) {
  if (!comments || !comments.tickers) return;

  try {
    // Get all tokens from database
    const { data: tokens, error: tokensError } = await supabase
      .from('tokens')
      .select('id, symbol')
      .order('id', { ascending: true });

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return;
    }

    // Create a map of symbol to token IDs
    const symbolToTokens = new Map();
    tokens.forEach((token) => {
      if (!symbolToTokens.has(token.symbol)) {
        symbolToTokens.set(token.symbol, []);
      }
      symbolToTokens.get(token.symbol).push(token.id);
    });

    const mentionAt = new Date().toISOString();
    const mentionsData = [];

    // Process each mentioned token
    for (const [symbol, count] of Object.entries(comments.tickers)) {
      const tokenIds = symbolToTokens.get(symbol);
      if (!tokenIds) {
        console.log(`Token not found for symbol: ${symbol}`);
        continue;
      }

      // Add mention entry for each token ID associated with the symbol
      for (const tokenId of tokenIds) {
        mentionsData.push({
          tiktok_id: tiktokId,
          count: count,
          token_id: tokenId,
          mention_at: mentionAt,
        });
      }
    }

    if (mentionsData.length > 0) {
      const { error: mentionsError } = await supabase
        .from('mentions')
        .insert(mentionsData);

      if (mentionsError) {
        console.error('Error inserting mentions:', mentionsError);
      } else {
        console.log(`🔗 Stored ${mentionsData.length} mentions for TikTok ${tiktokId}`);
      }
    }
  } catch (error) {
    console.error('Error storing token mentions:', error);
  }
}

async function initBrowser() {
  try {
    const browser = await puppeteer.launch({
      // Remove hardcoded Linux path - let Puppeteer auto-detect on Windows
      // executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    return browser;
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw error;
  }
}

const verifyPageLoaded = async (page, url, timeout = 60000) => {
  try {
    logger.info(`Loading ${url}...`);
    await page.goto(url, { waitUntil: "networkidle0", timeout });
    console.log('waiting for body')
    await page.waitForSelector("body");
    console.log('waiting for timeout')
    await new Promise((resolve) => setTimeout(resolve, 5000));
    logger.info(`Successfully loaded ${url}`);
    return true;
  } catch (e) {
    logger.error(`Error loading page: ${e}`);
    return false;
  }
};

const extractVideoData = async (element) => {
  try {
    const videoData = await VideoScraper.extractVideoData(element);
    console.log(videoData);
    return videoData;
  } catch (e) {
    return null;
  }
};

const processSearchTerm = async (page, keyword, maxResults = 50) => {
  const searchUrl = `https://www.tiktok.com/search?q=${keyword}`;
  const results = [];
  const scrollPauseTime = 2000;
  const maxRetries = 10; // Maximum number of retries
  let retryCount = 0;

  try {
    console.log(`\nProcessing search term: ${keyword}`);
    console.log(`Navigating to: ${searchUrl}`);

    if (await verifyPageLoaded(page, searchUrl)) {
      console.log("\nWaiting for video feed...");

      while (results.length < maxResults && retryCount < maxRetries) {
        // Try multiple selectors for video elements
        let videoElements = await page.$('div[class*="DivItemContainerForSearch"]');
        
        // If no elements found, try alternative selectors
        if (!videoElements.length) {
          videoElements = await page.$('div[class*="DivItemContainerV2"]');
        }
        
        // Try more generic selectors
        if (!videoElements.length) {
          videoElements = await page.$('[data-e2e="search-video-item"]');
        }
        
        // Try even more generic selectors
        if (!videoElements.length) {
          videoElements = await page.$('div[class*="ItemContainer"]');
        }

        if (!videoElements.length) {
          retryCount++;
          console.log(`No video elements found. Waiting... (Attempt ${retryCount}/${maxRetries})`);
          
          if (retryCount >= maxRetries) {
            console.log("\n❌ Maximum retries reached. Moving to next keyword.");
            break;
          }
          
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        console.log(`Count of Video elements: ${videoElements.length}`);

        for (const element of videoElements) {
          if (results.length >= maxResults) break;

          const videoData = await extractVideoData(element);
          if (
            videoData &&
            videoData?.video_url &&
            !processedUrls.has(videoData.video_url)
          ) {
            console.log(
              `Found video ${results.length + 1}/${maxResults}: ${videoData.video_url}`
            );

            const postId = videoData.video_url.split("/").pop();
            videoData.comments = await extractComments(postId);
            console.log(`Found ${videoData.comments.count} comments`);

            processedUrls.add(videoData.video_url);
            results.push(videoData);
          }
        }

        if (results.length >= maxResults) {
          console.log(`\n✅ Reached target number of videos for '${keyword}'`);
          break;
        }

        // Scroll down to load more content
        const previousHeight = await page.evaluate(
          "document.documentElement.scrollHeight"
        );
        await page.evaluate(
          "window.scrollTo(0, document.documentElement.scrollHeight)"
        );
        await new Promise((resolve) => setTimeout(resolve, scrollPauseTime));

        const newHeight = await page.evaluate(
          "document.documentElement.scrollHeight"
        );

        if (newHeight === previousHeight) {
          console.log("\n⚠️ No new content loaded. Moving to next keyword.");
          break;
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error processing search term ${keyword}:`, error);
    return results;
  }
};

const processHashtagTerm = async (page, keyword, maxResults = 50) => {
  const hashtagUrl = `https://www.tiktok.com/tag/${keyword}`;
  const results = [];
  const scrollPauseTime = 2000;

  try {
    console.log(`\nProcessing hashtag term: ${keyword}`);
    console.log(`Navigating to: ${hashtagUrl}`);

    if (await verifyPageLoaded(page, hashtagUrl)) {
      console.log("\nWaiting for video feed...");

      // Timeout check
if (Date.now() - startTime > SCRAPING_TIMEOUT) {
  console.log("\n⏰ Scraping timeout reached. Stopping...");
  break;
}

while (results.length < maxResults) {
        const videoElements = await page.$$('div[class*="DivItemContainerV2"]');

        if (!videoElements.length) {
          console.log("No video elements found. Waiting...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        for (const element of videoElements) {
          if (results.length >= maxResults) break;

          const videoData = await extractVideoData(element);
          if (videoData?.video_url && !processedUrls.has(videoData.video_url)) {
            console.log(
              `Found video ${results.length}/${maxResults}: ${videoData.video_url}`
            );

            const postId = videoData.video_url.split("/").pop();
            videoData.comments = await extractComments(postId);
            console.log(`Found ${videoData.comments.count} comments`);

            processedUrls.add(videoData.video_url);
            results.push(videoData);
          }
        }

        if (results.length >= maxResults) {
          console.log(`\nReached target number of videos for '#${keyword}'`);
          break;
        }

        const previousHeight = await page.evaluate(
          "document.documentElement.scrollHeight"
        );
        await page.evaluate(
          "window.scrollTo(0, document.documentElement.scrollHeight)"
        );
        await new Promise((resolve) => setTimeout(resolve, scrollPauseTime));

        const newHeight = await page.evaluate(
          "document.documentElement.scrollHeight"
        );
        if (newHeight === previousHeight) {
          console.log(`\nReached end of feed for '#${keyword}'`);
          break;
        }
      }
    }

    return results;
  } catch (e) {
    console.error(`\nError processing hashtag term '${keyword}': ${e}`);
    return results;
  }
};

const saveCombinedResults = (results) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `combined_results_${timestamp}.json`;
    fs.writeFileSync(
      filename,
      JSON.stringify(
        {
          extraction_time: new Date().toISOString(),
          total_searches: results.length,
          results: results,
        },
        null,
        2
      )
    );
    return filename;
  } catch (e) {
    console.error("Error saving results:", e);
    return null;
  }
};

const main = async () => {
  const { MEME_KEYWORDS, MEME_KEYWORDS_COUNT } = await import("./meme-keywords.mjs");
  const limit = process.env.MEME_KEYWORDS_LIMIT ? parseInt(process.env.MEME_KEYWORDS_LIMIT, 10) : undefined;
  const searchTerms = limit ? MEME_KEYWORDS.slice(0, limit) : MEME_KEYWORDS;
  const hashtagTerms = limit ? MEME_KEYWORDS.slice(0, limit) : MEME_KEYWORDS;
  console.log(`\n📋 Using ${searchTerms.length} meme keywords for search and hashtag scraping${limit ? ` (limit ${limit})` : ""}.\n`);

  const selectedProfile = "Profile 3";
  logger.info(`Using Chrome profile: ${selectedProfile}`);

  try {
    logger.info("Starting Chrome with profile...");
    const browser = await initBrowser();

    if (!browser) {
      logger.error("Failed to create Chrome browser");
      return;
    }

    const page = await browser.newPage();
    logger.info("Chrome started successfully");

    const allResults = [];
    let totalStored = 0;
    let totalErrors = 0;
    let totalMentions = 0;

    console.log("\n🚀 Starting automated scraping and storage...\n");

    // Process search terms
    for (const search of searchTerms) {
      console.log(`\n🔍 Processing search term: ${search}`);
      const results = await processSearchTerm(page, search, 100);
      
      if (results.length) {
        allResults.push({
          search,
          total_videos: results.length,
          videos: results,
        });
        
        console.log(`\n💾 Storing ${results.length} videos for '${search}' in Supabase...`);
        
        // Store each video immediately
        for (const video of results) {
          try {
            const storedTikTok = await storeTikTokDataImmediately(video);
            if (storedTikTok) {
              totalStored++;
              if (video.comments && video.comments.tickers) {
                await storeTokenMentionsImmediately(storedTikTok.id, video.comments);
                totalMentions++;
              }
            } else {
              totalErrors++;
            }
          } catch (error) {
            totalErrors++;
            console.error('Error processing video:', error);
          }
        }
        
        console.log(`✅ Processed '${search}': ${results.length} videos (${totalStored} stored, ${totalErrors} failures so far)`);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("\n🎯 All search terms processed and stored!");

    // Process hashtag terms
    for (const hashtag of hashtagTerms) {
      console.log(`\n🔍 Processing hashtag: ${hashtag}`);
      const results = await processHashtagTerm(page, hashtag, 200);
      
      if (results.length) {
        allResults.push({
          search: "#" + hashtag,
          total_videos: results.length,
          videos: results,
        });
        
        console.log(`\n💾 Storing ${results.length} videos for '#${hashtag}' in Supabase...`);
        
        // Store each video immediately
        for (const video of results) {
          try {
            const storedTikTok = await storeTikTokDataImmediately(video);
            if (storedTikTok) {
              totalStored++;
              if (video.comments && video.comments.tickers) {
                await storeTokenMentionsImmediately(storedTikTok.id, video.comments);
                totalMentions++;
              }
            } else {
              totalErrors++;
            }
          } catch (error) {
            totalErrors++;
            console.error('Error processing video:', error);
          }
        }
        
        console.log(`✅ Processed '#${hashtag}': ${results.length} videos (${totalStored} stored, ${totalErrors} failures so far)`);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Save combined results to file for backup
    if (allResults.length) {
      const savedPath = saveCombinedResults(allResults);
      if (savedPath) {
        console.log(`\n📁 Backup results saved to: ${savedPath}`);
      }
    }

    console.log("\n🎉 SCRAPING AND STORAGE COMPLETE!");
    console.log(`📊 Total videos stored in Supabase: ${totalStored}`);
    console.log(`❌ Storage failures: ${totalErrors}`);
    console.log(`🔗 Total mentions processed: ${totalMentions}`);
    console.log(`📁 Total search results: ${allResults.length}`);
    if (totalStored === 0 && totalErrors > 0) {
      console.log("\n⚠️ No videos were stored. Add SUPABASE_SERVICE_ROLE_KEY to .env (Supabase → Settings → API) so the scraper can write to the tiktoks table (RLS blocks the anon key).");
    }
    
    console.log("\nPress Enter to close browser...");
    await new Promise((resolve) => process.stdin.once("data", resolve));
  } catch (e) {
    logger.error(`Unexpected error: ${e}`);
  } finally {
    try {
      if (browser) {
        await browser.close();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};

main();
