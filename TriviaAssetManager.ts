import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';

/**
 * Centralized asset management to prevent duplicate asset loading
 * and provide efficient caching across components
 */
export class TriviaAssetManager {
  private static instance: TriviaAssetManager;
  private assetCache = new Map<string, ui.ImageSource>();
  private loadingPromises = new Map<string, Promise<ui.ImageSource>>();
  
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

  // Question image mapping
  static readonly QUESTION_IMAGES: { [key: string]: string } = {
    "question_1": "1288240819609445",
    "question_2": "4044904872392022",
    "question_3": "1079109144384248",
    "question_4": "1938735963635235",
    "question_5": "2003463393758622",
    "question_6": "1752745952035062",
    "question_7": "1475346350459077",
    "question_8": "1326047915821520",
    "question_9": "3683839291925288",
    "question_10": "1196531019167806",
    "question_11": "706209595799642",
    "question_12": "1410039643419415",
    "question_13": "780941904872970",
    "question_14": "1118817693525283",
    "question_15": "733906099468866",
    "question_16": "1807349089859596",
    "question_17": "794724089702968",
    "question_18": "764689873142192",
    "question_19": "1142213797826617",
    "question_20": "1825083965112873",
    "question_21": "1518489952663744",
    "question_22": "3567219543420158",
    "question_23": "2242739949472621",
    "question_24": "757964650190705",
    "question_25": "1063919718873051",
    "question_26": "1861463731067102",
    "question_27": "1120356200069522",
    "question_28": "761075996785743",
    "question_29": "799049209398883",
    "question_30": "1268024794620567",
    "question_31": "1156729086299686",
    "question_32": "724986150558004",
    "question_33": "2242739949472621",
    "question_34": "764254719694219",
    "question_35": "1696089904438279",
    "question_36": "1438253267399666",
    "question_37": "3139059593060314",
    "question_38": "1516371323068225",
    "question_39": "637378339431139",
    "question_40": "774931355028832",
    "question_41": "2031929627613049",
    "question_42": "2031929627613049",
    "question_43": "1319399849969407",
    "question_44": "1121153766023567",
    "question_45": "25519518710969579",
    "question_46": "758425783750920",
    "question_47": "783521360835887",
    "question_48": "1872767513454306",
    "question_49": "1422789575447123"
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
   * Get or create a cached image source
   */
  async getImageSource(textureId: string): Promise<ui.ImageSource> {
    // Check if already cached
    if (this.assetCache.has(textureId)) {
      return this.assetCache.get(textureId)!;
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
      this.assetCache.set(textureId, imageSource);
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
    return this.assetCache.get(textureId) || null;
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
      console.log(`❌ Failed to load asset ${textureId}:`, error);
      throw error;
    }
  }

  /**
   * Preload multiple assets at once
   */
  async preloadAssets(textureIds: string[]): Promise<void> {
    const promises = textureIds.map(id => this.getImageSource(id));
    await Promise.all(promises);
  }

  /**
   * Preload all common UI assets
   */
  async preloadCommonAssets(): Promise<void> {
    const commonAssets = Object.values(TriviaAssetManager.TEXTURE_IDS);
    await this.preloadAssets(commonAssets);
  }

  /**
   * Get question image texture ID
   */
  getQuestionImageId(questionId: string): string | null {
    return TriviaAssetManager.QUESTION_IMAGES[questionId] || null;
  }

  /**
   * Clear cache (useful for memory management)
   */
  clearCache(): void {
    this.assetCache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache size for debugging
   */
  getCacheSize(): number {
    return this.assetCache.size;
  }
}
