import { Message } from '../services/azureOpenAI';

interface CacheEntry {
  prompt: string;
  response: string;
  timestamp: number;
  hitCount: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  cacheSize: number;
}

const CACHE_KEY = 'chatbot_response_cache';
const CACHE_STATS_KEY = 'chatbot_cache_stats';
const MAX_CACHE_ENTRIES = 1000;
const CACHE_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SIMILARITY_THRESHOLD = 0.85; // 85% similarity required for cache hit

/**
 * Normalize text for comparison (lowercase, trim, remove extra spaces/punctuation)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  // Quick check for exact match after normalization
  if (s1 === s2) return 1.0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  // If strings are very different in length, they're likely different
  const lengthRatio = Math.min(len1, len2) / Math.max(len1, len2);
  if (lengthRatio < 0.5) return lengthRatio * 0.5; // Penalize large length differences
  
  // Levenshtein distance calculation
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  
  // Convert distance to similarity (0 to 1)
  return maxLength === 0 ? 1.0 : 1 - (distance / maxLength);
}

/**
 * Generate a cache key from conversation context
 * Uses last N messages to create context-aware key
 */
function generateCacheKey(messages: Message[]): string {
  // Use last 3 messages for context (excluding current user message)
  const contextMessages = messages.slice(-4, -1);
  const currentMessage = messages[messages.length - 1];
  
  const contextString = contextMessages
    .map(m => `${m.role}:${m.content.substring(0, 100)}`)
    .join('|');
  
  return `${contextString}|${currentMessage.content}`;
}

/**
 * Find similar cached entry using fuzzy matching
 */
function findSimilarCacheEntry(messages: Message[], cache: Record<string, CacheEntry>): { key: string; entry: CacheEntry; similarity: number } | null {
  const contextMessages = messages.slice(-4, -1);
  const currentMessage = messages[messages.length - 1];
  const currentPrompt = currentMessage.content;
  
  const contextString = contextMessages
    .map(m => `${m.role}:${m.content.substring(0, 100)}`)
    .join('|');
  
  let bestMatch: { key: string; entry: CacheEntry; similarity: number } | null = null;
  
  for (const [key, entry] of Object.entries(cache)) {
    // Check if context matches (must be same conversation context)
    const keyContext = key.substring(0, key.lastIndexOf('|'));
    if (keyContext !== contextString) continue;
    
    // Calculate similarity between current prompt and cached prompt
    const similarity = calculateSimilarity(currentPrompt, entry.prompt);
    
    if (similarity >= SIMILARITY_THRESHOLD) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { key, entry, similarity };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Get cached response for given conversation context
 * Uses fuzzy matching to find similar questions
 */
export function getCachedResponse(messages: Message[]): string | null {
  try {
    const cacheKey = generateCacheKey(messages);
    const cache = getCache();
    const now = Date.now();
    
    // First try exact match
    let entry = cache[cacheKey];
    let matchType: 'exact' | 'fuzzy' = 'exact';
    let similarity = 1.0;
    
    // If no exact match, try fuzzy matching
    if (!entry) {
      const similarMatch = findSimilarCacheEntry(messages, cache);
      if (similarMatch) {
        entry = similarMatch.entry;
        matchType = 'fuzzy';
        similarity = similarMatch.similarity;
        console.log(`🔍 Fuzzy match found: ${(similarity * 100).toFixed(1)}% similar`);
      }
    }
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry is expired
    if (now - entry.timestamp > CACHE_EXPIRY_MS) {
      delete cache[cacheKey];
      saveCache(cache);
      return null;
    }
    
    // Update hit count
    entry.hitCount++;
    entry.timestamp = now; // Refresh timestamp on hit
    saveCache(cache);
    
    // Update stats
    updateStats({ hit: true });
    
    if (matchType === 'exact') {
      console.log(`🎯 Cache HIT (exact) - hits: ${entry.hitCount}`);
    } else {
      console.log(`🎯 Cache HIT (fuzzy ${(similarity * 100).toFixed(1)}%) - hits: ${entry.hitCount}`);
    }
    
    return entry.response;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Save response to cache
 */
export function setCachedResponse(messages: Message[], response: string): void {
  try {
    const cacheKey = generateCacheKey(messages);
    const cache = getCache();
    
    // Add new entry
    cache[cacheKey] = {
      prompt: messages[messages.length - 1].content,
      response,
      timestamp: Date.now(),
      hitCount: 0,
    };
    
    // Enforce max cache size by removing oldest entries
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHE_ENTRIES) {
      // Sort by timestamp (oldest first) and remove excess
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
      toRemove.forEach(([key]) => delete cache[key]);
      
      console.log(`🧹 Cache cleaned: removed ${toRemove.length} old entries`);
    }
    
    saveCache(cache);
    console.log(`💾 Cached response for prompt`);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Clear all cached responses
 */
export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_STATS_KEY);
    console.log('🗑️ Cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  try {
    const cache = getCache();
    const statsData = localStorage.getItem(CACHE_STATS_KEY);
    const stats = statsData ? JSON.parse(statsData) : { totalHits: 0 };
    
    const cacheSize = new Blob([JSON.stringify(cache)]).size;
    
    return {
      totalEntries: Object.keys(cache).length,
      totalHits: stats.totalHits || 0,
      cacheSize,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalEntries: 0, totalHits: 0, cacheSize: 0 };
  }
}

/**
 * Get all cache entries (for debugging/export)
 */
export function getAllCacheEntries(): Record<string, CacheEntry> {
  return getCache();
}

/**
 * Remove expired entries from cache
 */
export function cleanExpiredCache(): number {
  try {
    const cache = getCache();
    const now = Date.now();
    let removed = 0;
    
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > CACHE_EXPIRY_MS) {
        delete cache[key];
        removed++;
      }
    });
    
    if (removed > 0) {
      saveCache(cache);
      console.log(`🧹 Cleaned ${removed} expired cache entries`);
    }
    
    return removed;
  } catch (error) {
    console.error('Error cleaning expired cache:', error);
    return 0;
  }
}

// Helper functions
function getCache(): Record<string, CacheEntry> {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error parsing cache:', error);
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving cache:', error);
    
    // If storage is full, try to clear old entries
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('⚠️ Storage quota exceeded, clearing oldest entries...');
      const entries = Object.entries(cache);
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      // Remove oldest 30% of entries
      const toRemove = Math.ceil(entries.length * 0.3);
      entries.slice(0, toRemove).forEach(([key]) => delete cache[key]);
      
      // Try saving again
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        console.log(`✅ Freed space by removing ${toRemove} entries`);
      } catch (retryError) {
        console.error('Failed to save cache even after cleanup:', retryError);
      }
    }
  }
}

function updateStats(options: { hit: boolean }): void {
  try {
    const statsData = localStorage.getItem(CACHE_STATS_KEY);
    const stats = statsData ? JSON.parse(statsData) : { totalHits: 0 };
    
    if (options.hit) {
      stats.totalHits = (stats.totalHits || 0) + 1;
    }
    
    localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating cache stats:', error);
  }
}
