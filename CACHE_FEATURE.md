# Response Caching Feature

## Overview
The chatbot now includes intelligent client-side response caching that stores AI responses in `localStorage` for instant replay and reduced API costs.

## How It Works

### Cache Key Generation
- Uses conversation context (last 3 messages + current prompt) to create a unique cache key
- Context-aware: Same question in different conversation contexts = different cache entries
- Handles follow-up questions intelligently

### Cache Behavior
- **Cache Hit**: Instant response display (no API call, zero tokens used)
- **Cache Miss**: Normal API streaming, then stores response for future use
- **Expiry**: 7 days (auto-cleaned on app start)
- **Capacity**: Max 100 entries (oldest auto-removed when exceeded)
- **Storage Quota**: Auto-cleans 30% of oldest entries if storage is full

### Cache Statistics
- **Total Entries**: Number of cached prompt→response pairs
- **Total Hits**: How many times cached responses were reused
- **Storage Size**: Bytes used in localStorage

## Usage

### For Users
1. **Access Cache Manager**: Click the database icon in the header
2. **View Stats**: See cache entries, hits, and storage usage
3. **Clear Cache**: Remove all cached responses via the UI

### Console Logs
Monitor cache activity in browser DevTools console:
- `🎯 Cache HIT for prompt (hits: N)` - Cached response used
- `💾 Cached response for prompt` - New response saved
- `🧹 Cache cleaned: removed N old entries` - Auto-cleanup triggered
- `✅ Freed space by removing N entries` - Storage quota recovery

## Benefits

### Cost Savings
- **Zero tokens** for repeated questions
- Typical use case: FAQ-style queries, code example requests, repeated explanations
- Example: Asking "What is React?" multiple times = 1 API call instead of N calls

### Performance
- **Instant responses** for cache hits
- No network latency
- Offline-capable for cached queries

### User Experience
- Consistent answers for identical questions
- Fast iteration on similar prompts
- Transparent caching (visual feedback via console logs)

## Technical Details

### Files Added
- `src/utils/cache.ts` - Core caching logic
- `src/components/CacheManager.tsx` - UI for cache management

### Files Modified
- `src/App.tsx` - Integrated cache check/save in message handler

### API
```typescript
// Check cache before API call
getCachedResponse(messages: Message[]): string | null

// Save response after API call
setCachedResponse(messages: Message[], response: string): void

// Clear all cache
clearCache(): void

// Get statistics
getCacheStats(): { totalEntries, totalHits, cacheSize }

// Clean expired entries (auto-run on mount)
cleanExpiredCache(): number
```

### Configuration
Edit `src/utils/cache.ts` to adjust:
- `MAX_CACHE_ENTRIES = 100` - Maximum cached responses
- `CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000` - 7 days expiry

## Testing

### Test Cache Hit
1. Ask: "What is TypeScript?"
2. Wait for full response
3. Ask: "What is TypeScript?" again
4. ✅ Should be instant (check console for `🎯 Cache HIT`)

### Test Cache Miss
1. Ask: "What is TypeScript?"
2. Ask: "What is JavaScript?" (different question)
3. ✅ Should stream from API (check console for `💾 Cached response`)

### Test Context Awareness
1. Ask: "What is it?" (vague)
2. Ask: "What is React?" 
3. Ask: "What is it?" again
4. ✅ Different context = different cache entries

### Test Storage Cleanup
1. Open DevTools > Application > Local Storage
2. Check `chatbot_response_cache` size
3. Generate 100+ different queries
4. ✅ Should auto-clean oldest entries

## Limitations
- Browser `localStorage` limit: ~5-10MB (browser-dependent)
- Cache is per-browser/device (not synced across devices)
- Cleared when user clears browser data
- Context-sensitive: slight prompt variations = cache miss

## Future Enhancements
- [ ] Export/import cache data
- [ ] Configurable expiry per entry
- [ ] Cache compression (e.g., LZ-string)
- [ ] IndexedDB migration for larger storage
- [ ] Smart cache invalidation
- [ ] Cache analytics dashboard
