// ============================================================
// utils/translate.js
// Translation service with cache, timeout handling, and fallback
// ============================================================

import axios from 'axios';
import { createHash } from 'crypto';

// In-memory cache for translations
const translationCache = new Map();
const CACHE_MAX_SIZE = 1000;

/**
 * Check if text contains Urdu/Arabic script
 */
function hasUrduScript(text) {
  const URDU_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return URDU_RE.test(String(text || ''));
}

/**
 * Get cache key for text
 */
function getCacheKey(text) {
  return createHash('md5').update(text.toLowerCase().trim()).digest('hex');
}

/**
 * Translate text to Urdu with timeout and fallback
 */
export async function translateToUrdu(text, timeout = 3000) {
  if (!text || text.trim() === '') {
    return '';
  }

  const trimmedText = text.trim();
  const cacheKey = getCacheKey(trimmedText);

  // Check cache first
  if (translationCache.has(cacheKey)) {
    console.log(`📦 Using cached translation for: "${trimmedText}"`);
    return translationCache.get(cacheKey);
  }

  // If text already contains Urdu script, return as-is
  if (hasUrduScript(trimmedText)) {
    console.log(`✅ Text already contains Urdu script: "${trimmedText}"`);
    translationCache.set(cacheKey, trimmedText);
    return trimmedText;
  }

  // Try multiple translation sources
  const translators = [
    translateWithGoogle,
    translateWithMyMemory,
    translateWithLibreTranslate
  ];

  for (const translator of translators) {
    try {
      const translation = await translator(trimmedText, timeout);
      if (translation && translation !== trimmedText) {
        // Cache the result
        if (translationCache.size >= CACHE_MAX_SIZE) {
          const firstKey = translationCache.keys().next().value;
          translationCache.delete(firstKey);
        }
        translationCache.set(cacheKey, translation);
        console.log(`✅ Translated: "${trimmedText}" → "${translation}"`);
        return translation;
      }
    } catch (error) {
      console.warn(`Translation source failed:`, error.message);
      continue;
    }
  }

  // Fallback: Return original text
  console.log(`⚠️ All translation sources failed, using original: "${trimmedText}"`);
  translationCache.set(cacheKey, trimmedText);
  return trimmedText;
}

/**
 * Google Translate API
 */
async function translateWithGoogle(text, timeout) {
  const response = await axios.post(
    'https://translate.googleapis.com/translate_a/single',
    null,
    {
      params: {
        client: 'gtx',
        sl: 'en',
        tl: 'ur',
        dt: 't',
        q: text,
      },
      timeout: timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }
  );

  if (response.data && response.data[0]) {
    return response.data[0]
      .map(item => item[0])
      .join('');
  }
  return null;
}

/**
 * MyMemory Translation API (free fallback)
 */
async function translateWithMyMemory(text, timeout) {
  const response = await axios.get(
    'https://api.mymemory.translated.net/get',
    {
      params: {
        q: text,
        langpair: 'en|ur',
        de: 'donation_management',
      },
      timeout: timeout,
    }
  );

  if (response.data && response.data.responseData) {
    const translation = response.data.responseData.translatedText;
    if (translation && translation !== text) {
      return translation;
    }
  }
  return null;
}

/**
 * LibreTranslate (free open-source fallback)
 */
async function translateWithLibreTranslate(text, timeout) {
  try {
    const response = await axios.post(
      'https://libretranslate.com/translate',
      {
        q: text,
        source: 'en',
        target: 'ur',
        format: 'text',
      },
      {
        timeout: timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.translatedText) {
      return response.data.translatedText;
    }
  } catch (error) {
    // LibreTranslate often fails, just return null
    return null;
  }
  return null;
}

/**
 * Translate with retry logic
 */
export async function translateWithRetry(text, maxRetries = 2) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await translateToUrdu(text, 3000);
      if (result && result !== text) {
        return result;
      }
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    } catch (error) {
      lastError = error;
      console.warn(`Translation attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // All retries failed, return original
  console.warn(`All translation attempts failed for: "${text}"`);
  return text;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache() {
  translationCache.clear();
  console.log('🧹 Translation cache cleared');
}

/**
 * Get cache stats
 */
export function getTranslationCacheStats() {
  return {
    size: translationCache.size,
    maxSize: CACHE_MAX_SIZE,
    keys: Array.from(translationCache.keys()),
  };
}

export default translateToUrdu;