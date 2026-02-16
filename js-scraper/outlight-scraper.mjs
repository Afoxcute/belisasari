import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Headers } from 'node-fetch';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Polyfill global fetch and Headers
global.fetch = fetch;
global.Headers = Headers;

dotenv.config();

// Initialize Supabase client. Support same env vars as other scrapers; trim to avoid "Invalid API key" from stray newlines.
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_SECRET ||
  process.env.SUPABASE_KEY ||
  ''
).trim();

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase config. Set SUPABASE_URL and one of: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_SECRET, or SUPABASE_KEY (in .env, no extra spaces/newlines).'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configure logging
const logger = {
  info: (...args) => console.log(new Date().toISOString(), "INFO:", ...args),
  error: (...args) => console.error(new Date().toISOString(), "ERROR:", ...args),
};

class OutlightScraper {
  constructor() {
    this.baseUrl = 'https://www.outlight.fun';
    this.processedChannels = new Set();
    this.processedMessages = new Set();
  }

  async initBrowser() {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      return browser;
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw error;
    }
  }

  async scrapeOutlightHomepage() {
    try {
      console.log('🔍 Scraping Outlight.fun homepage for Telegram channels...');
      
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to the homepage
      await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Extract Telegram channel information from the page
      const channels = await page.evaluate(() => {
        const channelData = [];
        
        // Look for various patterns that might contain Telegram channel information
        const selectors = [
          'a[href*="t.me/"]',
          'a[href*="telegram.me/"]',
          '[data-href*="t.me/"]',
          '[data-href*="telegram.me/"]',
          'a[href*="telegram"]',
          '.telegram-link',
          '.tg-link',
          '[class*="telegram"]',
          '[class*="tg-"]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            const href = element.href || element.getAttribute('data-href') || element.getAttribute('href');
            if (href && (href.includes('t.me/') || href.includes('telegram.me/'))) {
              const channelMatch = href.match(/(?:t\.me\/|telegram\.me\/)([^\/\?]+)/);
              if (channelMatch) {
                const username = channelMatch[1].replace('@', '');
                const displayName = element.textContent?.trim() || element.getAttribute('title') || username;
                
                channelData.push({
                  username: username,
                  display_name: displayName,
                  url: href,
                  source: 'outlight_homepage'
                });
              }
            }
          });
        });
        
        // Also look for text content that might contain Telegram usernames
        const textContent = document.body.textContent || '';
        const telegramMatches = textContent.match(/@[a-zA-Z0-9_]{5,32}/g);
        if (telegramMatches) {
          telegramMatches.forEach(match => {
            const username = match.replace('@', '');
            channelData.push({
              username: username,
              display_name: username,
              url: `https://t.me/${username}`,
              source: 'outlight_text_content'
            });
          });
        }
        
        return channelData;
      });
      
      await browser.close();
      
      // Remove duplicates
      const uniqueChannels = channels.filter((channel, index, self) => 
        index === self.findIndex(c => c.username === channel.username)
      );
      
      console.log(`✅ Found ${uniqueChannels.length} potential Telegram channels from Outlight.fun`);
      return uniqueChannels;
      
    } catch (error) {
      console.error('Error scraping Outlight.fun homepage:', error);
      return [];
    }
  }

  async getFallbackChannels() {
    // Since Outlight.fun might not have direct Telegram links, let's add some common memecoin channels
    const fallbackChannels = [
      {
        username: 'memecoin_hunters',
        display_name: 'Memecoin Hunters',
        url: 'https://t.me/memecoin_hunters',
        source: 'fallback_memecoin'
      },
      {
        username: 'solana_memes',
        display_name: 'Solana Meme Coins',
        url: 'https://t.me/solana_memes',
        source: 'fallback_solana'
      },
      {
        username: 'pumpfun_official',
        display_name: 'Pump.fun Official',
        url: 'https://t.me/pumpfun_official',
        source: 'fallback_pumpfun'
      },
      {
        username: 'bonk_official',
        display_name: 'BONK Official',
        url: 'https://t.me/bonk_official',
        source: 'fallback_bonk'
      },
      {
        username: 'crypto_bags',
        display_name: 'Crypto Bags',
        url: 'https://t.me/crypto_bags',
        source: 'fallback_crypto'
      }
    ];
    
    console.log(`📋 Using ${fallbackChannels.length} fallback channels for testing`);
    return fallbackChannels;
  }

  async scrapeOutlightWithCheerio() {
    try {
      console.log('🔍 Scraping Outlight.fun with Cheerio for additional channel discovery...');
      
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });
      
      const $ = cheerio.load(response.data);
      const channels = [];
      
      // Look for Telegram links in various formats
      $('a[href*="t.me/"], a[href*="telegram.me/"]').each((index, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        const title = $(element).attr('title');
        
        if (href) {
          const channelMatch = href.match(/(?:t\.me\/|telegram\.me\/)([^\/\?]+)/);
          if (channelMatch) {
            const username = channelMatch[1].replace('@', '');
            channels.push({
              username: username,
              display_name: text || title || username,
              url: href,
              source: 'outlight_cheerio'
            });
          }
        }
      });
      
      // Look for @mentions in text content
      const bodyText = $('body').text();
      const mentions = bodyText.match(/@[a-zA-Z0-9_]{5,32}/g);
      if (mentions) {
        mentions.forEach(mention => {
          const username = mention.replace('@', '');
          channels.push({
            username: username,
            display_name: username,
            url: `https://t.me/${username}`,
            source: 'outlight_mentions'
          });
        });
      }
      
      // Remove duplicates
      const uniqueChannels = channels.filter((channel, index, self) => 
        index === self.findIndex(c => c.username === channel.username)
      );
      
      console.log(`✅ Found ${uniqueChannels.length} additional channels with Cheerio`);
      return uniqueChannels;
      
    } catch (error) {
      console.error('Error scraping with Cheerio:', error);
      return [];
    }
  }

  async storeChannel(channelData) {
    try {
      // Check if channel already exists
      const { data: existingChannel, error: fetchError } = await supabase
        .from('telegram_channels')
        .select('*')
        .eq('username', channelData.username)
        .single();

      if (existingChannel) {
        console.log(`📋 Channel @${channelData.username} already exists. Skipping.`);
        return existingChannel;
      }

      // Insert new channel
      const { data, error } = await supabase
        .from('telegram_channels')
        .insert({
          username: channelData.username,
          display_name: channelData.display_name,
          enabled: true,
          last_message_id: 0,
          scrape_media: false,
          scrape_interval_minutes: 15
        })
        .select()
        .single();

      if (error) {
        if (error.code !== '23505') { // Not a duplicate key error
          throw error;
        }
        console.log(`📋 Channel @${channelData.username} already exists.`);
        return null;
      }

      console.log(`✅ Added channel: @${channelData.username} (${channelData.display_name})`);
      return data;
    } catch (error) {
      const msg = error?.message || String(error);
      if (msg.includes('Invalid API key')) {
        console.error(
          `Error storing channel ${channelData.username}: Invalid Supabase API key. Check .env: use SUPABASE_ANON_SECRET or SUPABASE_SERVICE_ROLE_KEY from Supabase Dashboard → Settings → API. Ensure no extra spaces/newlines when pasting.`
        );
      } else {
        console.error(`Error storing channel ${channelData.username}:`, error);
      }
      return null;
    }
  }

  async scrapeTelegramChannel(channelUsername, limit = 100) {
    try {
      console.log(`🔍 Scraping Telegram channel: @${channelUsername}`);
      
      const url = `https://t.me/s/${channelUsername}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const messages = [];

      $('.tgme_widget_message').each((index, element) => {
        if (messages.length >= limit) return;

        const $msg = $(element);
        const messageId = parseInt($msg.attr('data-post')?.split('/')[1] || '0');
        const text = $msg.find('.tgme_widget_message_text').text().trim();
        const dateStr = $msg.find('.tgme_widget_message_date time').attr('datetime');
        const viewsText = $msg.find('.tgme_widget_message_views').text();
        
        // Extract media information
        const hasPhoto = $msg.find('.tgme_widget_message_photo').length > 0;
        const hasVideo = $msg.find('.tgme_widget_message_video').length > 0;
        const photoUrl = $msg.find('.tgme_widget_message_photo_wrap').attr('style')?.match(/url\('([^']+)'\)/)?.[1];

        if (messageId && (text || hasPhoto || hasVideo)) {
          messages.push({
            channel_id: channelUsername,
            channel_title: channelUsername,
            message_id: messageId,
            text: text || '[Media]',
            date: dateStr ? Math.floor(new Date(dateStr).getTime() / 1000) : 0,
            views: viewsText ? this.parseViews(viewsText) : null,
            has_photo: hasPhoto,
            has_video: hasVideo,
            photo_urls: photoUrl ? [photoUrl] : [],
            scraped_at: new Date().toISOString(),
            raw_data: {
              message_id: messageId,
              text: text,
              date: dateStr,
              views: viewsText,
              has_photo: hasPhoto,
              has_video: hasVideo,
              photo_url: photoUrl
            }
          });
        }
      });

      console.log(`✅ Scraped ${messages.length} messages from @${channelUsername}`);
      return messages;
    } catch (error) {
      console.error(`Error scraping channel @${channelUsername}:`, error);
      return [];
    }
  }

  parseViews(viewsText) {
    if (!viewsText) return null;
    
    const views = viewsText.trim();
    if (views.includes('K')) {
      return parseInt(views.replace('K', '')) * 1000;
    } else if (views.includes('M')) {
      return parseInt(views.replace('M', '')) * 1000000;
    } else {
      return parseInt(views) || null;
    }
  }

  async storeMessages(messages) {
    try {
      if (messages.length === 0) return;

      const { data, error } = await supabase
        .from('telegram_messages')
        .upsert(messages, {
          onConflict: 'channel_id,message_id',
          ignoreDuplicates: true
        });

      if (error) throw error;

      console.log(`✅ Stored ${messages.length} messages`);
      
      // Extract and store token mentions from messages
      await this.extractAndStoreTokenMentions(messages);
    } catch (error) {
      console.error('Error storing messages:', error);
    }
  }

  async extractAndStoreTokenMentions(messages) {
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

      const mentionsData = [];
      const mentionAt = new Date().toISOString();

      // Process each message for token mentions
      for (const message of messages) {
        if (!message.text) continue;

        const messageText = message.text.toLowerCase();
        
        // Check for token symbols in the message
        for (const [symbol, tokenIds] of symbolToTokens) {
          const symbolLower = symbol.toLowerCase();
          
          // Simple keyword matching
          if (messageText.includes(symbolLower) || 
              messageText.includes(`#${symbolLower}`) ||
              messageText.includes(`$${symbolLower}`)) {
            
            // Count occurrences
            const count = (messageText.match(new RegExp(symbolLower, 'gi')) || []).length;
            
            // Add mention entry for each token ID associated with the symbol
            for (const tokenId of tokenIds) {
              mentionsData.push({
                tiktok_id: null, // Telegram messages don't have TikTok IDs
                token_id: tokenId,
                count: count,
                mention_at: mentionAt,
                source: 'telegram',
                channel_id: message.channel_id,
                message_id: message.message_id
              });
            }
          }
        }
      }

      if (mentionsData.length > 0) {
        // Store mentions in the mentions table
        const { error: mentionsError } = await supabase
          .from('mentions')
          .insert(mentionsData);

        if (mentionsError) {
          console.error('Error inserting mentions:', mentionsError);
        } else {
          console.log(`🔗 Stored ${mentionsData.length} token mentions from Telegram messages`);
        }
      }
    } catch (error) {
      console.error('Error extracting token mentions:', error);
    }
  }

  async main() {
    try {
      console.log('🚀 Starting Outlight.fun Telegram channel discovery and scraping...');
      
      // Step 1: Scrape Outlight.fun homepage for Telegram channels
      console.log('\n📋 Step 1: Discovering Telegram channels from Outlight.fun...');
      const puppeteerChannels = await this.scrapeOutlightHomepage();
      const cheerioChannels = await this.scrapeOutlightWithCheerio();
      
      // Combine and deduplicate channels
      let allChannels = [...puppeteerChannels, ...cheerioChannels];
      
      // If no channels found from Outlight.fun, use fallback channels for testing
      if (allChannels.length === 0) {
        console.log('⚠️ No channels found on Outlight.fun, using fallback channels for testing...');
        const fallbackChannels = await this.getFallbackChannels();
        allChannels = [...allChannels, ...fallbackChannels];
      }
      
      const uniqueChannels = allChannels.filter((channel, index, self) => 
        index === self.findIndex(c => c.username === channel.username)
      );
      
      console.log(`📊 Total unique channels discovered: ${uniqueChannels.length}`);
      
      // Step 2: Store discovered channels in database
      console.log('\n💾 Step 2: Storing discovered channels in database...');
      const storedChannels = [];
      for (const channel of uniqueChannels) {
        const storedChannel = await this.storeChannel(channel);
        if (storedChannel) {
          storedChannels.push(storedChannel);
        }
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`✅ Successfully stored ${storedChannels.length} channels`);
      
      // Step 3: Scrape messages from discovered channels
      console.log('\n📨 Step 3: Scraping messages from discovered channels...');
      let totalMessages = 0;
      let totalErrors = 0;
      
      for (const channel of storedChannels) {
        try {
          console.log(`\n🔍 Scraping @${channel.username}...`);
          const messages = await this.scrapeTelegramChannel(channel.username, 200);
          
          if (messages.length > 0) {
            await this.storeMessages(messages);
            totalMessages += messages.length;
            console.log(`✅ Scraped ${messages.length} messages from @${channel.username}`);
          } else {
            console.log(`⚠️ No messages found for @${channel.username}`);
          }
          
          // Rate limiting between channels
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          totalErrors++;
          console.error(`❌ Error scraping @${channel.username}:`, error.message);
        }
      }
      
      // Summary
      console.log('\n📊 SCRAPING SUMMARY:');
      console.log(`✅ Channels discovered: ${uniqueChannels.length}`);
      console.log(`✅ Channels stored: ${storedChannels.length}`);
      console.log(`✅ Messages scraped: ${totalMessages}`);
      console.log(`❌ Errors: ${totalErrors}`);
      
      if (totalMessages > 0) {
        console.log('\n🎉 Outlight.fun Telegram data has been successfully scraped and stored!');
        console.log('You can now view this data in your frontend dashboard.');
      }
      
    } catch (error) {
      console.error('❌ Outlight scraper main error:', error);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new OutlightScraper();
  scraper.main().catch(console.error);
}

export { OutlightScraper };
