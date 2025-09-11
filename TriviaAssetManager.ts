import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';

interface CacheEntry {
  imageSource: ui.ImageSource;
  lastAccessed: number;
  accessCount: number;
}

interface CacheStats {
  totalAssets: number;
  memoryUsageEstimate: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  oldestEntry: number;
  newestEntry: number;
}

/**
 * Advanced centralized asset management with LRU caching, preloading strategies,
 * and memory management for optimal performance across components
 */
export class TriviaAssetManager {
  private static instance: TriviaAssetManager;
  private assetCache = new Map<string, CacheEntry>();
  private loadingPromises = new Map<string, Promise<ui.ImageSource>>();
  
  // Cache configuration
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached assets
  private readonly MEMORY_LIMIT_MB = 200; // Estimated memory limit in MB
  private readonly CLEANUP_THRESHOLD = 0.8; // Clean up when 80% of max size reached
  
  // Statistics tracking
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    memoryUsageEstimate: 0
  };
  
  // Priority levels for different asset types
  private readonly ASSET_PRIORITIES = {
    CRITICAL: 100,    // UI icons, backgrounds - never evict
    HIGH: 80,         // Player avatars, current question images
    MEDIUM: 60,       // Answer shapes, modifier icons
    LOW: 40,          // Preloaded future content
    DISPOSABLE: 20    // Debug or temporary assets
  };
  
  // Asset priority mapping
  private assetPriorities = new Map<string, number>();
  
  // Consolidated texture IDs used across the application
  static readonly TEXTURE_IDS = {
    // Background textures
    MAIN_BACKGROUND: '2225071587959777',
    PRE_GAME_BACKGROUND: '9783264971776963', 
    QUESTION_PAGES_BACKGROUND: '1358485312536960',
    
    // Answer submitted screens
    RED_TRIANGLE_SCREEN: '4164501203820285',
    BLUE_SQUARE_SCREEN: '781053527999316',
    YELLOW_CIRCLE_SCREEN: '1276483883806975',
    GREEN_STAR_SCREEN: '1029237235836066',
    
    // Lock icons
    LOCK: '667887239673613',
    LOCK_OPEN: '1667289068007821',
    
    // Timer icons
    TIMER_NORMAL: '2035737657163790',
    TIMER_OFF: '1466620987937637',
    MORE_TIME: '1830264154592827',
    
    // Difficulty icons
    DIFFICULTY_EASY: '794548760190405',
    DIFFICULTY_MEDIUM: '1138269638213533',
    DIFFICULTY_HARD: '712075511858553',
    
    // UI icons
    INFO: '24898127093144614',
    LOGOUT: '1997295517705951',
    ALARM: '1209829437577245',
    CHECK: '2019383778812059',
    CLOSE: '24587675990884692',
    ARROW_FORWARD: '1806442143313699',
    
    // Shape/answer icons
    TRIANGLE: '2085541485520283',
    SQUARE: '1317550153280256',
    CIRCLE: '1247573280476332',
    STAR: '2403112933423824',
    DIAMOND: '1317550153280256', // Same as square
    
    // Modifier backgrounds
    MODIFIER_LEFT: '789207380187265',
    MODIFIER_CENTER: '3148012692041551',
    MODIFIER_RIGHT: '1320579906276560'
  };

  // Answer shape configurations
  static readonly ANSWER_SHAPES = [
    { iconId: '2085541485520283', color: '#DC2626', shape: 'Triangle' },
    { iconId: '1317550153280256', color: '#2563EB', shape: 'Square' },
    { iconId: '1247573280476332', color: '#EAB308', shape: 'Circle' },
    { iconId: '2403112933423824', color: '#16A34A', shape: 'Star' }
  ];

  private constructor() {}

  static getInstance(): TriviaAssetManager {
    if (!TriviaAssetManager.instance) {
      TriviaAssetManager.instance = new TriviaAssetManager();
    }
    return TriviaAssetManager.instance;
  }

  /**
   * Get or create a cached image source with priority-based caching
   */
  async getImageSource(textureId: string, priority: number = this.ASSET_PRIORITIES.MEDIUM): Promise<ui.ImageSource> {
    this.stats.totalRequests++;
    
    // Check if already cached
    if (this.assetCache.has(textureId)) {
      const entry = this.assetCache.get(textureId)!;
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      this.stats.cacheHits++;
      return entry.imageSource;
    }

    // Check if already loading
    if (this.loadingPromises.has(textureId)) {
      return this.loadingPromises.get(textureId)!;
    }

    // Start loading
    const loadPromise = this.loadImage(textureId);
    this.loadingPromises.set(textureId, loadPromise);

    try {
      const imageSource = await loadPromise;
      
      // Store priority for this asset
      this.assetPriorities.set(textureId, priority);
      
      // Create cache entry
      const cacheEntry: CacheEntry = {
        imageSource,
        lastAccessed: Date.now(),
        accessCount: 1
      };
      
      // Check if cache needs cleanup before adding
      await this.ensureCacheCapacity();
      
      this.assetCache.set(textureId, cacheEntry);
      this.updateMemoryEstimate(textureId, true);
      this.loadingPromises.delete(textureId);
      
      return imageSource;
    } catch (error) {
      this.loadingPromises.delete(textureId);
      throw error;
    }
  }

  /**
   * Get cached image source synchronously (returns null if not cached)
   */
  getCachedImageSource(textureId: string): ui.ImageSource | null {
    const entry = this.assetCache.get(textureId);
    if (entry) {
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      this.stats.cacheHits++;
      this.stats.totalRequests++;
      return entry.imageSource;
    }
    this.stats.totalRequests++;
    return null;
  }

  /**
   * Load an image from texture asset
   */
  private async loadImage(textureId: string): Promise<ui.ImageSource> {
    try {
      const imageSource = ui.ImageSource.fromTextureAsset(
        new hz.TextureAsset(BigInt(textureId))
      );
      return imageSource;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ensure cache doesn't exceed capacity limits
   */
  private async ensureCacheCapacity(): Promise<void> {
    const currentSize = this.assetCache.size;
    const memoryUsage = this.stats.memoryUsageEstimate;
    
    // Check if cleanup is needed
    if (currentSize >= this.MAX_CACHE_SIZE * this.CLEANUP_THRESHOLD || 
        memoryUsage >= this.MEMORY_LIMIT_MB * this.CLEANUP_THRESHOLD) {
      
      await this.performLRUCleanup();
    }
  }
  
  /**
   * Perform LRU-based cache cleanup with priority consideration
   */
  private async performLRUCleanup(): Promise<void> {
    // Build entries array manually to avoid downlevelIteration requirement
    const entries: [string, CacheEntry][] = [];
    this.assetCache.forEach((entry, textureId) => {
      entries.push([textureId, entry]);
    });
    
    // Sort by priority (higher = keep), then by last accessed (newer = keep)
    entries.sort(([idA, entryA], [idB, entryB]) => {
      const priorityA = this.assetPriorities.get(idA) || this.ASSET_PRIORITIES.LOW;
      const priorityB = this.assetPriorities.get(idB) || this.ASSET_PRIORITIES.LOW;
      
      // First sort by priority
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // Then by access frequency
      if (entryA.accessCount !== entryB.accessCount) {
        return entryB.accessCount - entryA.accessCount; // More accessed first
      }
      
      // Finally by recency
      return entryB.lastAccessed - entryA.lastAccessed; // More recent first
    });
    
    // Remove lower priority, less frequently used, and older assets
    const targetSize = Math.floor(this.MAX_CACHE_SIZE * 0.7); // Clean to 70% capacity
    const itemsToRemove = Math.max(0, entries.length - targetSize);
    
    for (let i = entries.length - itemsToRemove; i < entries.length; i++) {
      const [textureId] = entries[i];
      // Don't remove CRITICAL priority assets
      const priority = this.assetPriorities.get(textureId) || this.ASSET_PRIORITIES.LOW;
      if (priority < this.ASSET_PRIORITIES.CRITICAL) {
        this.assetCache.delete(textureId);
        this.assetPriorities.delete(textureId);
        this.updateMemoryEstimate(textureId, false);
      }
    }
  }
  
  /**
   * Update memory usage estimate
   */
  private updateMemoryEstimate(textureId: string, added: boolean): void {
    // Rough estimate: average texture is ~2MB
    const estimatedSizePerAsset = 2;
    this.stats.memoryUsageEstimate += added ? estimatedSizePerAsset : -estimatedSizePerAsset;
    this.stats.memoryUsageEstimate = Math.max(0, this.stats.memoryUsageEstimate);
  }

  /**
   * Preload multiple assets at once with priority
   */
  async preloadAssets(textureIds: string[], priority: number = this.ASSET_PRIORITIES.MEDIUM): Promise<void> {
    const promises = textureIds.map(id => this.getImageSource(id, priority));
    await Promise.all(promises);
  }

  /**
   * Preload all common UI assets with appropriate priorities
   */
  async preloadCommonAssets(): Promise<void> {
    // Critical UI assets that should never be evicted
    const criticalAssets = [
      TriviaAssetManager.TEXTURE_IDS.MAIN_BACKGROUND,
      TriviaAssetManager.TEXTURE_IDS.PRE_GAME_BACKGROUND,
      TriviaAssetManager.TEXTURE_IDS.QUESTION_PAGES_BACKGROUND,
      TriviaAssetManager.TEXTURE_IDS.CLOSE,
      TriviaAssetManager.TEXTURE_IDS.LOGOUT
    ];
    
    // High priority assets
    const highPriorityAssets = [
      TriviaAssetManager.TEXTURE_IDS.RED_TRIANGLE_SCREEN,
      TriviaAssetManager.TEXTURE_IDS.BLUE_SQUARE_SCREEN,
      TriviaAssetManager.TEXTURE_IDS.YELLOW_CIRCLE_SCREEN,
      TriviaAssetManager.TEXTURE_IDS.GREEN_STAR_SCREEN,
      TriviaAssetManager.TEXTURE_IDS.TRIANGLE,
      TriviaAssetManager.TEXTURE_IDS.SQUARE,
      TriviaAssetManager.TEXTURE_IDS.CIRCLE,
      TriviaAssetManager.TEXTURE_IDS.STAR
    ];
    
    // Medium priority assets
    const mediumPriorityAssets = [
      TriviaAssetManager.TEXTURE_IDS.LOCK,
      TriviaAssetManager.TEXTURE_IDS.LOCK_OPEN,
      TriviaAssetManager.TEXTURE_IDS.TIMER_NORMAL,
      TriviaAssetManager.TEXTURE_IDS.TIMER_OFF,
      TriviaAssetManager.TEXTURE_IDS.DIFFICULTY_EASY,
      TriviaAssetManager.TEXTURE_IDS.DIFFICULTY_MEDIUM,
      TriviaAssetManager.TEXTURE_IDS.DIFFICULTY_HARD
    ];
    
    await Promise.all([
      this.preloadAssets(criticalAssets, this.ASSET_PRIORITIES.CRITICAL),
      this.preloadAssets(highPriorityAssets, this.ASSET_PRIORITIES.HIGH),
      this.preloadAssets(mediumPriorityAssets, this.ASSET_PRIORITIES.MEDIUM)
    ]);
  }

  /**
   * Preload player avatar with high priority
   */
  async preloadPlayerAvatar(textureId: string): Promise<ui.ImageSource> {
    return this.getImageSource(textureId, this.ASSET_PRIORITIES.HIGH);
  }

  /**
   * Preload question image with high priority
   */
  async preloadQuestionImage(textureId: string): Promise<ui.ImageSource> {
    return this.getImageSource(textureId, this.ASSET_PRIORITIES.HIGH);
  }

  /**
   * Clear cache with selective retention of critical assets
   */
  clearCache(retainCritical: boolean = true): void {
    if (!retainCritical) {
      this.assetCache.clear();
      this.assetPriorities.clear();
    } else {
      // Only clear non-critical assets
      const toDelete: string[] = [];
      this.assetCache.forEach((entry, textureId) => {
        const priority = this.assetPriorities.get(textureId) || this.ASSET_PRIORITIES.LOW;
        if (priority < this.ASSET_PRIORITIES.CRITICAL) {
          toDelete.push(textureId);
        }
      });
      
      for (const textureId of toDelete) {
        this.assetCache.delete(textureId);
        this.assetPriorities.delete(textureId);
      }
    }
    
    this.loadingPromises.clear();
    this.resetStats();
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats(): CacheStats {
    // Build entries array manually to avoid downlevelIteration requirement
    const entries: CacheEntry[] = [];
    this.assetCache.forEach((entry) => {
      entries.push(entry);
    });
    
    const hitRate = this.stats.totalRequests > 0 ? (this.stats.cacheHits / this.stats.totalRequests) * 100 : 0;
    
    let oldestEntry = Number.MAX_SAFE_INTEGER;
    let newestEntry = 0;
    
    for (const entry of entries) {
      oldestEntry = Math.min(oldestEntry, entry.lastAccessed);
      newestEntry = Math.max(newestEntry, entry.lastAccessed);
    }
    
    return {
      totalAssets: this.assetCache.size,
      memoryUsageEstimate: this.stats.memoryUsageEstimate,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      oldestEntry: oldestEntry === Number.MAX_SAFE_INTEGER ? 0 : oldestEntry,
      newestEntry
    };
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.assetCache.size;
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      memoryUsageEstimate: 0
    };
  }

  /**
   * Force cleanup of cache
   */
  async forceCleanup(): Promise<void> {
    await this.performLRUCleanup();
  }

  /**
   * Log cache statistics for debugging
   */
  logCacheStats(): void {
    const stats = this.getCacheStats();
  }

  /**
   * Initialize asset manager with optimal settings
   */
  async initializeForTrivia(): Promise<void> {
    // Preload all common assets
    await this.preloadCommonAssets();
    
    this.logCacheStats();
  }

  /**
   * Prepare for Italian Brainrot Quiz by preloading specific assets
   */
  async prepareForItalianBrainrotQuiz(questionImages: string[]): Promise<void> {
    // Preload first few question images with high priority
    const immediateImages = questionImages.slice(0, 5);
    await this.preloadAssets(immediateImages, this.ASSET_PRIORITIES.HIGH);
    
    // Preload remaining images with medium priority (background loading)
    if (questionImages.length > 5) {
      const remainingImages = questionImages.slice(5);
      this.preloadAssets(remainingImages, this.ASSET_PRIORITIES.MEDIUM).catch(error => {
      });
    }
  }
}
