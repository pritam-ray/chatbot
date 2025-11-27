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
const MAX_CACHE_ENTRIES = 100;
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
 * Get cached response for given conversation context
 */
export function getCachedResponse(messages: Message[]): string | null {
  try {
    const cacheKey = generateCacheKey(messages);
    const cache = getCache();
    
    const entry = cache[cacheKey];
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry is expired
    const now = Date.now();
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
    
    console.log(`🎯 Cache HIT for prompt (hits: ${entry.hitCount})`);
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
