/**
 * @fileoverview Cache Management System
 * Implements a caching layer for API responses to improve performance.
 * 
 * Features:
 * - In-memory caching with TTL
 * - Cache invalidation strategies
 * - Memory usage monitoring
 * 
 * @module cache
 */

/**
 * Cache configuration
 * @private
 */
const config = {
  maxSize: 100, // Maximum number of items in cache
  ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
  cleanupInterval: 60 * 1000 // 1 minute in milliseconds
};

/**
 * Cache implementation with TTL and size limits
 * @class Cache
 */
class Cache {
  constructor() {
    this.cache = new Map();
    this.keyTimestamps = new Map();
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, config.cleanupInterval);
  }

  /**
   * Sets a cache entry
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  set(key, value) {
    // Ensure cache size limit
    if (this.cache.size >= config.maxSize) {
      this.removeOldest();
    }
    
    this.cache.set(key, value);
    this.keyTimestamps.set(key, Date.now());
  }

  /**
   * Gets a cache entry
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    const timestamp = this.keyTimestamps.get(key);
    
    // Check if entry has expired
    if (timestamp && Date.now() - timestamp > config.ttl) {
      this.delete(key);
      return undefined;
    }
    
    return this.cache.get(key);
  }

  /**
   * Deletes a cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.keyTimestamps.delete(key);
  }

  /**
   * Clears all cache entries
   */
  clear() {
    this.cache.clear();
    this.keyTimestamps.clear();
  }

  /**
   * Removes expired entries
   * @private
   */
  cleanup() {
    const now = Date.now();
    for (const [key, timestamp] of this.keyTimestamps.entries()) {
      if (now - timestamp > config.ttl) {
        this.delete(key);
      }
    }
  }

  /**
   * Removes the oldest cache entry
   * @private
   */
  removeOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, timestamp] of this.keyTimestamps.entries()) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * Stops the cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create cache instances for different types of data
export const jobsCache = new Cache();
export const categoriesCache = new Cache();

/**
 * Invalidates all caches
 */
export const invalidateAllCaches = () => {
  jobsCache.clear();
  categoriesCache.clear();
};

/**
 * Gets cache statistics
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => ({
  jobs: {
    size: jobsCache.cache.size,
    keys: Array.from(jobsCache.cache.keys())
  },
  categories: {
    size: categoriesCache.cache.size,
    keys: Array.from(categoriesCache.cache.keys())
  }
});
