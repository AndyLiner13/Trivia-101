import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';
import { View, Text, Pressable, Binding, UINode, Image, ImageSource } from 'horizon/ui';
import { PhoneManager } from './PhoneManager';
import { PlayerManager } from './PlayerManager';
import { TriviaAssetManager } from './TriviaAssetManager';

// Interface for tracking phone assignments
interface PhoneAssignment {
  phoneEntity: hz.Entity;
  assignedPlayer: hz.Player | null;
  isInUse: boolean;
}

// Interface for trivia question data from JSON asset
interface TriviaQuestion {
  id: number;
  question: string;
  category?: string;
  difficulty?: string;
  image?: string; // Path to image file
  answers: {
    text: string;
    correct: boolean;
  }[];
}

// Interface for custom quiz questions with images
interface CustomQuizQuestion {
  id: string;
  image_id?: string; // New format uses image_id instead of image
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

// Image mapping for texture IDs
const imageTextureMap: { [key: string]: string } = {
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

// SerializableState-compatible interfaces for network events
type SerializableQuestion = {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  image?: string; // Optional image path
  answers: Array<{ text: string; correct: boolean }>;
};

// Props interface for TriviaGame component
interface TriviaGameProps {
  generalQuestionsAsset?: any;
  geographyQuestionsAsset?: any;
  historyQuestionsAsset?: any;
  scienceQuestionsAsset?: any;
  filmQuestionsAsset?: any;
  musicQuestionsAsset?: any;
  televisionQuestionsAsset?: any;
  ItalianBrainrotQuiz?: any;
  questionTimeLimit: number;
  showCorrectAnswer: boolean;
  autoAdvanceTime: number;
  fontSize: number;
  headerColor: string;
  backgroundColor: string;
}

// Network events for syncing with the world trivia system
const triviaQuestionShowEvent = new hz.NetworkEvent<{
  question: SerializableQuestion;
  questionIndex: number;
  timeLimit: number;
}>('triviaQuestionShow');

const triviaResultsEvent = new hz.NetworkEvent<{
  question: SerializableQuestion;
  correctAnswerIndex: number;
  answerCounts: number[];
  scores: { [key: string]: number };
  showLeaderboard?: boolean;
  leaderboardData?: Array<{name: string, score: number, playerId: string}>;
}>('triviaResults');

const triviaTwoOptionsEvent = new hz.NetworkEvent<{
  question: SerializableQuestion;
  questionIndex: number;
  timeLimit: number;
  totalQuestions: number;
}>('triviaTwoOptions');

const triviaFourOptionsEvent = new hz.NetworkEvent<{
  question: SerializableQuestion;
  questionIndex: number;
  timeLimit: number;
  totalQuestions: number;
}>('triviaFourOptions');

const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{
  playerId: string;
  answerIndex: number;
  responseTime: number;
}>('triviaAnswerSubmitted');

const triviaGameStartEvent = new hz.NetworkEvent<{
  hostId: string;
  config: any;
}>('triviaGameStart');

const triviaNextQuestionEvent = new hz.NetworkEvent<{
  playerId: string;
}>('triviaNextQuestion');

const triviaGameRegisteredEvent = new hz.NetworkEvent<{
  isRunning: boolean;
  hasQuestions: boolean;
}>('triviaGameRegistered');

// Game end event to notify TriviaPhones that the game has ended
const triviaGameEndEvent = new hz.NetworkEvent<{
  hostId: string;
  finalLeaderboard?: Array<{name: string, score: number, playerId: string}>;
}>('triviaGameEnd');

// Game reset event to reset TriviaGame to pre-game state
const triviaGameResetEvent = new hz.NetworkEvent<{
  hostId: string;
}>('triviaGameReset');

  // Network event for leaderboard score updates
  const leaderboardScoreUpdateEvent = new hz.NetworkEvent<{
    playerId: string;
    score: number;
    leaderboardName: string;
  }>('leaderboardScoreUpdate');

  // Network event for awarding points
  const triviaAwardPointsEvent = new hz.NetworkEvent<{
    playerId: string;
    points: number;
  }>('triviaAwardPoints');

// New events for explicit screen routing
// Request-response events for state synchronization
const triviaStateRequestEvent = new hz.NetworkEvent<{
  requesterId: string;
}>('triviaStateRequest');

const triviaStateResponseEvent = new hz.NetworkEvent<{
  requesterId: string;
  gameState: 'waiting' | 'playing' | 'results' | 'leaderboard' | 'ended';
  currentQuestion?: SerializableQuestion;
  questionIndex?: number;
  timeLimit?: number;
  showLeaderboard?: boolean;
  leaderboardData?: Array<{name: string, score: number, playerId: string}>;
}>('triviaStateResponse');

// Host management event
const hostChangedEvent = new hz.NetworkEvent<{
  newHostId: string;
  oldHostId?: string;
}>('hostChanged');

// Settings update event
const triviaSettingsUpdateEvent = new hz.NetworkEvent<{
  hostId: string;
  settings: {
    numberOfQuestions: number;
    category: string;
    difficulty: string;
    timeLimit: number;
    timerType: string;
    difficultyType: string;
    isLocked: boolean;
    modifiers: {
      autoAdvance: boolean;
      powerUps: boolean;
      bonusRounds: boolean;
    };
  };
}>('triviaSettingsUpdate');

// Host view mode events
const hostViewModeEvent = new hz.NetworkEvent<{ hostId: string, viewMode: 'pre-game' | 'game-settings' }>('hostViewMode');

// Timer synchronization events
const triviaTimerUpdateEvent = new hz.NetworkEvent<{
  timeRemaining: number;
  questionIndex: number;
}>('triviaTimerUpdate');

const triviaTimerEndEvent = new hz.NetworkEvent<{
  questionIndex: number;
}>('triviaTimerEnd');

// UI state synchronization events
const triviaUIStateEvent = new hz.NetworkEvent<{
  showConfig: boolean;
  showResults: boolean;
  showWaiting: boolean;
  showLeaderboard: boolean;
  showError: boolean;
  errorMessage?: string;
}>('triviaUIState');

// Player tracking synchronization events
const triviaPlayerUpdateEvent = new hz.NetworkEvent<{
  playersInWorld: string[];
  playersAnswered: string[];
  answerCount: number;
}>('triviaPlayerUpdate');

// Logout event for when players opt out of the game
const triviaPlayerLogoutEvent = new hz.NetworkEvent<{
  playerId: string;
}>('triviaPlayerLogout');

// Rejoin event for when opted-out players want to rejoin the game
const triviaPlayerRejoinEvent = new hz.NetworkEvent<{
  playerId: string;
}>('triviaPlayerRejoin');

// Default trivia questions for continuous gameplay
const defaultTriviaQuestions: TriviaQuestion[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    category: "Geography",
    difficulty: "easy",
    answers: [
      { text: "London", correct: false },
      { text: "Berlin", correct: false },
      { text: "Paris", correct: true },
      { text: "Madrid", correct: false }
    ]
  },
  {
    id: 2,
    question: "Which planet is closest to the Sun?",
    category: "Science",
    difficulty: "easy",
    answers: [
      { text: "Venus", correct: false },
      { text: "Mercury", correct: true },
      { text: "Earth", correct: false },
      { text: "Mars", correct: false }
    ]
  },
  {
    id: 3,
    question: "What is 7 × 8?",
    category: "Math",
    difficulty: "easy",
    answers: [
      { text: "54", correct: false },
      { text: "56", correct: true },
      { text: "64", correct: false },
      { text: "48", correct: false }
    ]
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    category: "Art",
    difficulty: "medium",
    answers: [
      { text: "Van Gogh", correct: false },
      { text: "Picasso", correct: false },
      { text: "Da Vinci", correct: true },
      { text: "Monet", correct: false }
    ]
  },
  {
    id: 5,
    question: "What is the largest ocean on Earth?",
    category: "Geography",
    difficulty: "easy",
    answers: [
      { text: "Atlantic", correct: false },
      { text: "Pacific", correct: true },
      { text: "Indian", correct: false },
      { text: "Arctic", correct: false }
    ]
  },
  {
    id: 6,
    question: "In which year did World War II end?",
    category: "History",
    difficulty: "medium",
    answers: [
      { text: "1944", correct: false },
      { text: "1945", correct: true },
      { text: "1946", correct: false },
      { text: "1943", correct: false }
    ]
  },
  {
    id: 7,
    question: "What is the chemical symbol for gold?",
    category: "Science",
    difficulty: "medium",
    answers: [
      { text: "Go", correct: false },
      { text: "Gd", correct: false },
      { text: "Au", correct: true },
      { text: "Ag", correct: false }
    ]
  },
  {
    id: 8,
    question: "Which country is home to Machu Picchu?",
    category: "Geography",
    difficulty: "medium",
    answers: [
      { text: "Brazil", correct: false },
      { text: "Peru", correct: true },
      { text: "Chile", correct: false },
      { text: "Colombia", correct: false }
    ]
  }
];

/**
 * Trivia Game CustomUI Component
 * 
 * This component creates a Kahoot-style trivia interface that replaces the individual
 * TriviaText components. It displays questions, answers, timer, and handles player interactions
 * in a single cohesive CustomUI panel.
 * 
 * ✅ ENHANCED RANDOMIZATION SYSTEM:
 * - Uses host player's current time/date as seed for question shuffling
 * - Eliminates Math.random() in favor of deterministic seeded randomization  
 * - Ensures completely unique question orders between game sessions
 * - Dramatically reduces chance of seeing repeated questions from large pools (1000+ questions)
 * - Multiple shuffle passes with time-based entropy for maximum variety
 * 
 * Usage:
 * 1. Upload a trivia.json file to your Asset Library
 * 2. Attach this script to a Custom UI gizmo in your world
 * 3. Assign the trivia JSON asset to the triviaAsset property
 * 4. Position the Custom UI gizmo where you want the trivia interface to appear
 */
export class TriviaGame extends ui.UIComponent {
  
  static propsDefinition = {
    // Reference to the trivia questions JSON assets
    generalQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
    geographyQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
    historyQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
    scienceQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
    filmQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
    musicQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
    televisionQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
    ItalianBrainrotQuiz: { type: hz.PropTypes.Asset, default: null },
    
    // Game configuration
    questionTimeLimit: { type: hz.PropTypes.Number, default: 30 },
    showCorrectAnswer: { type: hz.PropTypes.Boolean, default: true },
    autoAdvanceTime: { type: hz.PropTypes.Number, default: 5 },
    
    // Display settings
    fontSize: { type: hz.PropTypes.Number, default: 24 },
    headerColor: { type: hz.PropTypes.String, default: "#6366F1" },
    backgroundColor: { type: hz.PropTypes.String, default: "#F3F4F6" }
  };

  // Bindings for dynamic UI updates
  private questionNumberBinding = new Binding("Q1");
  private timerBinding = new Binding("30");
  private answerCountBinding = new Binding("0");
  private answerCountTracking = new Binding(4); // Track number of answers for layout
  private questionBinding = new Binding("Waiting for question...");
  private questionImageBinding = new Binding<string | null>(null); // Stable binding for question image
  private answerTexts = [
    new Binding(""),
    new Binding(""),
    new Binding(""),
    new Binding("")
  ];
  private showResultsBinding = new Binding(false);
  private showWaitingBinding = new Binding(false);
  private showLeaderboardBinding = new Binding(false);
  private showGameOverBinding = new Binding(false); // New binding for game over screen
  private showErrorBinding = new Binding(false);
  private errorMessageBinding = new Binding("No questions available for the selected category.");
  private correctAnswerBinding = new Binding(-1);
  private answerCountsBinding = new Binding([0, 0, 0, 0]);
  
  // Current answer counts tracking (separate from binding for easier manipulation)
  private currentAnswerCounts: number[] = [0, 0, 0, 0];
  
  // Answer selection and feedback state
  private answerRevealed: boolean = false;
  private answerRevealedBinding = new Binding(false); // Binding for UI reactivity
  
  // Leaderboard data
  private leaderboardDataBinding = new Binding<Array<{name: string, score: number, playerId: string, headshotImageSource?: ImageSource}>>([]);
  
  // Players list binding for reactive UI updates
  private playersListBinding = new Binding<Array<{id: string, name: string}>>([]);
  
  // Simple binding to trigger UI updates when players change
  private playersUpdateTrigger = new Binding<number>(0);
  
  // Counter to track UI update triggers
  private updateTriggerCounter: number = 0;
  
  // Player scores tracking - now using real variables instead of local Map
  private playerScores = new Map<string, number>();

  // Category and difficulty selection bindings
  private selectedCategoryBinding = new Binding("General");
  private selectedDifficultyBinding = new Binding("easy");

  // Local score tracking for the duration of the game
  private localPlayerScores = new Map<string, number>();

  // Persistent leaderboard tracking - total correct answers across all games
  private persistentLeaderboardScores = new Map<string, number>();

  // Methods to interact with the native leaderboard system
  private getPlayerPoints(player: hz.Player): number {
    // Get score from local cache first, fallback to 0
    const playerId = player.id.toString();
    return this.localPlayerScores.get(playerId) || 0;
  }

  private setPlayerPoints(player: hz.Player, points: number): void {
    try {
      // Update local cache for game scoring
      const playerId = player.id.toString();
      this.localPlayerScores.set(playerId, points);
      
      // Note: Persistent leaderboard is now separate and only tracks total correct answers
      // It should not be affected by game points
    } catch (error) {
    }
  }

  private addCorrectAnswerToLeaderboard(player: hz.Player, points: number = 1): void {
    try {
      const playerId = player.id.toString();
      const currentCorrectAnswers = this.persistentLeaderboardScores.get(playerId) || 0;
      this.persistentLeaderboardScores.set(playerId, currentCorrectAnswers + points);
      
      // Update local score for current game leaderboard
      const currentLocalScore = this.localPlayerScores.get(playerId) || 0;
      this.localPlayerScores.set(playerId, currentLocalScore + points);
      
      // Update native leaderboard with total correct answers
      const leaderboardName = "Trivia";
      this.world.leaderboards.setScoreForPlayer(leaderboardName, player, currentCorrectAnswers + points, true);
      
      // Send network event to update leaderboard.ts
      this.sendNetworkBroadcastEvent(leaderboardScoreUpdateEvent, {
        playerId: playerId,
        score: currentCorrectAnswers + points,
        leaderboardName: leaderboardName
      });
      
      // Added ${points} points to leaderboard for player ${playerId}
    } catch (error) {
      console.error('❌ TriviaGame: Error adding points to leaderboard:', error);
    }
  }

  private addToTotalPoints(points: number): void {
    // Note: Native leaderboard doesn't have a concept of "total points" across all players
    // This functionality is removed as it's not supported by the native leaderboard system
  }

  private resetAllPlayerPoints(): void {
    // Clear local cache
    this.localPlayerScores.clear();
    
    // Note: Native leaderboard doesn't provide a way to reset all player scores at once
    // Individual player scores will persist until manually reset or overwritten
  }

  // Game configuration state
  private showConfigBinding = new Binding(true); // Show config screen initially
  private gameConfigBinding = new Binding({
    timeLimit: 30,
    autoAdvance: true,
    numQuestions: 20,
    category: "Italian Brainrot Quiz",
    difficulty: "easy"
  });
  private hostPlayerIdBinding = new Binding<string | null>(null);
  private isLocalPlayerHostBinding = new Binding(false);
  
  // Category name binding for pre-game screen display
  private categoryNameBinding = new Binding("Italian Brainrot Quiz");
  
  // Layout mode binding - determines if question should be centered (true) or at top (false)
  private centerQuestionBinding = new Binding(false);
  
  // Answer button color bindings for results state
  private answerButtonColors = [
    new Binding('#DC2626'), // Default red
    new Binding('#2563EB'), // Default blue  
    new Binding('#EAB308'), // Default yellow
    new Binding('#16A34A')  // Default green
  ];

  // Binding to control timer visibility
  private showTimerBinding = new Binding(true);
  
  // Icon opacity bindings for configuration screen (always rendered, but opacity changes)
  private leftIconOpacity = [
    new Binding(1.0),   // Lock icon (slot 0) - always visible now
    new Binding(1.0),   // Sentiment icon (slot 1) - difficulty type - always visible
    new Binding(1.0)    // Timer icon (slot 2) - timer type - always visible
  ];
  
  private rightIconOpacity = [
    new Binding(0.3),   // Autoplay icon (slot 0) - modifiers.autoAdvance
    new Binding(0.3),   // All Inclusive icon (slot 1) - modifiers.bonusRounds
    new Binding(0.3)    // Bolt icon (slot 2) - modifiers.powerUps
  ];
  
  // Dynamic icon source bindings for lock, timer and difficulty
  private lockIconSourceBinding = new Binding(ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('667887239673613')))); // Default: lock icon
  private timerIconSourceBinding = new Binding(ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2035737657163790')))); // Default: normal timer
  private difficultyIconSourceBinding = new Binding(ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1167500291866690')))); // Default: medium difficulty
  
  // Binding for displaying the number of questions in pre-game UI
  private questionCountBinding = new Binding("48");
  
  // Internal state variables (not bound to UI)
  private hostPlayerId: string | null = null;
  private isLocalPlayerHost: boolean = false;
  private isShowingConfigScreen: boolean = true; // Track config screen state for icon updates
  private gameConfig = {
    timeLimit: 30,
    autoAdvance: true,
    numQuestions: 20,
    category: "Italian Brainrot Quiz",
    difficulty: "easy"
  };

  // Modifier settings from TriviaPhone
  private timerType: string = 'normal';
  private difficultyType: string = 'medium';
  private isLocked: boolean = true;
  private modifiers = {
    autoAdvance: false,
    powerUps: false,
    bonusRounds: false
  };

  // Game data
  private generalQuestions: TriviaQuestion[] = [];
  private geographyQuestions: TriviaQuestion[] = [];
  private historyQuestions: TriviaQuestion[] = [];
  private scienceQuestions: TriviaQuestion[] = [];
  private filmQuestions: TriviaQuestion[] = [];
  private musicQuestions: TriviaQuestion[] = [];
  private televisionQuestions: TriviaQuestion[] = [];
  private customQuizQuestions: TriviaQuestion[] = []; // Custom quiz questions with images
  private triviaQuestions: TriviaQuestion[] = [...defaultTriviaQuestions];
  private currentQuestionIndex: number = 0;
  private currentQuestion: TriviaQuestion | null = null;
  private timeRemaining: number = 30;
  private totalAnswers: number = 0;
  private isRunning: boolean = false;
  private isShowingLeaderboard: boolean = false;
  private isShowingResults: boolean = false;
  private lastCorrectAnswerIndex: number = -1;
  private lastAnswerCounts: number[] = [];

  // Helper method to get the correct time limit based on timerType
  private getTimeLimitForCurrentModifier(): number {
    switch (this.timerType) {
      case 'slow': // No timer modifier - no time limit (return very large number)
        return 999999; 
      case 'normal': // Normal timer - 30 seconds
        return 30;
      case 'fast': // Add time modifier - 90 seconds
        return 90;
      default:
        return 30; // Default to normal timer
    }
  }

  // Helper method to check if timer should be shown in UI
  private shouldShowTimer(): boolean {
    return this.timerType !== 'slow'; // Hide timer for "no timer" modifier
  }

  // Lazy loading cache - track which categories have been loaded
  private loadedCategories: Set<string> = new Set();
  private isLoadingCategory: boolean = false;

  // Public getter for currentQuestionIndex to allow TriviaPhone sync
  public getCurrentQuestionIndex(): number {
    return this.currentQuestionIndex;
  }

  // Public getter for showLeaderboard state to allow TriviaPhone sync
  public getShowLeaderboard(): boolean {
    return this.isShowingLeaderboard;
  }

  // Public getter for results state to allow TriviaPhone sync
  public getShowResults(): boolean {
    return this.isShowingResults;
  }

  // ✅ Helper method to create a seeded random number generator using host's current time
  private createHostSeededRandom(additionalSeed: number = 0): () => number {
    const now = new Date();
    const hostTimestamp = Date.now();
    
    // Generate seed based on host's precise time and additional entropy
    const timeSeed = (
      now.getFullYear() * 10000 +
      (now.getMonth() + 1) * 100 +
      now.getDate() +
      now.getHours() * 3600 +
      now.getMinutes() * 60 +
      now.getSeconds() +
      now.getMilliseconds() +
      additionalSeed
    ) % 2147483647;
    
    // Ensure non-zero seed
    let seed = timeSeed || 1;
    
    return () => {
      // Linear congruential generator (LCG) - Park-Miller implementation
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
  }

  // Player tracking for waiting logic
  private hasLocalPlayerAnswered: boolean = false;

  // Current players list for UI (not a binding to avoid circular reference issues)
  private currentPlayers: Array<{id: string, name: string}> = [];

  // Timer management properties
  private roundTimeoutId: number | null = null;
  private gameLoopTimeoutId: number | null = null;
  private timerInterval: number | null = null;

  // Phone management - delegated to PhoneManager
  private phoneManager: PhoneManager | null = null;

  // Player management - centralized player tracking and opt-out handling
  private playerManager: PlayerManager = new PlayerManager();

  // Track players who joined mid-game during results/leaderboard and need state updates
  private playersJoinedDuringInterlude: Set<string> = new Set();

  // Player headshot cache - maps player ID to ImageSource
  private playerHeadshots = new Map<string, ImageSource | null>();
  
  // Centralized asset manager for improved caching
  private assetManager = TriviaAssetManager.getInstance();
  
  // Italian Brainrot specific state tracking
  private currentItalianBrainrotImageId: string | null = null;
  private isCurrentlyItalianBrainrot: boolean = false;

  async start() {
    
    // Check if this is a preview mode transition by looking for existing state
    const hasExistingState = (this.world as any).triviaGameState !== undefined;
    if (hasExistingState) {
      this.handlePreviewModeTransition();
    }
    
    // Initialize phone management via PhoneManager
    this.initializePhoneManager();
    this.setupPlayerEvents();
    
    // Register this TriviaGame instance with the world for TriviaPhone access
    (this.world as any).triviaGame = this;
    
    // Also store game state in world for cross-script access
    (this.world as any).triviaGameState = {
      isRunning: this.isRunning,
      hasQuestions: this.triviaQuestions.length > 0,
      currentQuestion: this.currentQuestion,
      currentQuestionIndex: this.currentQuestionIndex,
      isShowingLeaderboard: this.isShowingLeaderboard,
      timestamp: Date.now()
    };
    
    // Send a network event to notify any TriviaPhones that a game is available
    this.sendNetworkBroadcastEvent(triviaGameRegisteredEvent, {
      isRunning: this.isRunning,
      hasQuestions: this.triviaQuestions.length > 0
    });
    
    // Also register with global registry as backup (may not work across script contexts)
    if (!(globalThis as any).triviaPhoneInstances) {
      (globalThis as any).triviaPhoneInstances = [];
    }
    (globalThis as any).triviaPhoneInstances.push(this);
    
    // Notify any existing TriviaPhones about our registration
    const globalTriviaPhones = (globalThis as any).triviaPhoneInstances || [];
    globalTriviaPhones.forEach((triviaPhone: any, index: number) => {
      if (triviaPhone && typeof triviaPhone.forceSyncWithTriviaGame === 'function') {
        triviaPhone.forceSyncWithTriviaGame();
      }
    });
    
    // Load trivia questions from asset if provided, otherwise use defaults or JSON file
    await this.loadTriviaQuestions();
    
    // Load custom quiz data
    await this.loadCustomQuizData();
    
    // Set up network event listeners
    this.setupNetworkEvents();
    
    // Initialize icon visibility with default state
    this.updateIconVisibility();
    this.updateLockIcon('host-pregame'); // Initialize with host pre-game state (lock icon)
    this.showTimerBinding.set(this.shouldShowTimer()); // Initialize timer visibility
    
    // Initialize the UI (shows config screen by default)
    this.resetGameState();
    
    // Initialize players list
    const initialPlayers = this.world.getPlayers();
    this.currentPlayers = initialPlayers.map(player => ({
      id: player.id.toString(),
      name: player.name.get()
    }));

    // Initialize PlayerManager with current players
    this.playerManager.updatePlayersInWorld(initialPlayers);
    this.playerManager.setHost(this.hostPlayerId || initialPlayers[0]?.id.toString() || '');

    // Load headshots for existing players
    for (const player of initialPlayers) {
      await this.loadPlayerHeadshot(player, 'INIT');
    }
    
    // Initialize centralized asset manager and preload game assets
    await this.assetManager.initializeForTrivia();
    await this.preloadGameAssets();
    
    // Detect host player for existing players
    this.detectHostPlayer();
    
    // Initialize category display with default category
    this.updateCategoryDisplay(this.gameConfig.category);
    
    // Initialize question count binding with default value
    this.questionCountBinding.set(this.gameConfig.numQuestions.toString());
    
  }

  private async preloadGameAssets(): Promise<void> {
    
    // List of all texture IDs used in the game
    const assetTextureIds = [
      // Lock icons
      '667887239673613',    // lock
      '1667289068007821',   // lock_open_right
      
      // Timer icons
      '2035737657163790',   // timer (normal)
      '1929373007796069',   // timer_off
      '1471075670874559',   // more_time
      
      // Difficulty icons
      '773002615685804',    // sentiment_satisfied (easy)
      '1167500291866690',   // sentiment_neutral (medium)
      '789632350092375',    // skull (hard)
      
      // Other icons
      '1997295517705951',   // logout
      '1209829437577245',   // alarm icon
      '24898127093144614',  // info_i
      '1325134306066406',   // crown (host indicator)
      
      // Shape icons (answer buttons)
      '2085541485520283',   // triangle
      '1317550153280256',   // square
      '1247573280476332',    // circle
      '1317550153280256',   // diamond
      
      // Background textures
      '1142972504392965',   // TriviaGame configuration background
      '1295411818793309',   // TriviaPhone question pages background
      '1295411818793309',   // TriviaPhone pre-game background
      '9783264971776963',   // TriviaPhone main background
      '3145261165647718',    // Left side icon background
      '3148012692041551',   // Center icon background
      '1320579906276560',   // Right side icon background
      
      // Question image textures from imageTextureMap
      ...Object.values(imageTextureMap)
    ];
    
    // Preload all assets using the centralized asset manager
    try {
      // Preload common assets with high priority
      await this.assetManager.preloadCommonAssets();
      
      // Preload question images with medium priority
      const questionImageIds = Object.values(imageTextureMap);
      if (questionImageIds.length > 0) {
        await this.assetManager.preloadAssets(questionImageIds, this.assetManager['ASSET_PRIORITIES'].MEDIUM);
      }
    } catch (error) {
    }
  }

  // Helper method to get cached asset via centralized asset manager
  private getCachedImageSource(textureId: string): ImageSource {
    // Try to get from cache first (synchronous)
    const cached = this.assetManager.getCachedImageSource(textureId);
    if (cached) {
      return cached;
    }
    
    // If not cached, create directly (fallback for immediate use)
    // Note: This should ideally be avoided - prefer preloading assets
    const imageSource = ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(textureId)));
    
    // Async cache it for future use (fire-and-forget)
    this.assetManager.getImageSource(textureId);
    
    return imageSource;
  }

  // Preload next Italian Brainrot question image via asset manager
  private preloadNextItalianBrainrotImage(): void {
    if (!this.isItalianBrainrotQuiz()) return;
    
    const nextQuestionIndex = this.currentQuestionIndex + 1;
    if (nextQuestionIndex >= this.triviaQuestions.length) return;
    
    const nextQuestion = this.triviaQuestions[nextQuestionIndex];
    if (nextQuestion && nextQuestion.image) {
      const imageId = nextQuestion.image;
      
      // Don't reload if already cached
      if (this.assetManager.getCachedImageSource(imageId)) {
        return;
      }
      
      // Preload asynchronously with high priority for next question
      this.assetManager.preloadQuestionImage(imageId);
    }
  }

  // Clean up previous Italian Brainrot question image after leaderboard is shown
  private cleanupPreviousItalianBrainrotImage(): void {
    if (!this.isItalianBrainrotQuiz()) return;
    
    // No longer needed - let asset manager handle cleanup with LRU strategy
    if (this.currentItalianBrainrotImageId) {
      this.currentItalianBrainrotImageId = null;
    }
  }

  // Check if current quiz is Italian Brainrot
  private isItalianBrainrotQuiz(): boolean {
    return this.isCurrentlyItalianBrainrot;
  }

  private async loadTriviaQuestions(): Promise<void> {
    // No longer loading all JSON files upfront - will load on demand when categories are selected
  }

  private parseOpenTriviaFormat(jsonData: any, expectedCategory: string): TriviaQuestion[] {
    const convertedQuestions: TriviaQuestion[] = [];
    

    
    // Check if jsonData has the expected structure
    if (!jsonData || typeof jsonData !== 'object') {
      return [];
    }
    
    if (!jsonData.questions) {
      return [];
    }
    
    // Extract questions from all difficulty levels
    const difficulties = ['easy', 'medium', 'hard'];
    
    for (const difficulty of difficulties) {

      
      if (jsonData.questions[difficulty] && Array.isArray(jsonData.questions[difficulty])) {
        const questionsArray = jsonData.questions[difficulty];

        
        for (let i = 0; i < questionsArray.length; i++) {
          const question = questionsArray[i];
          try {

            
            // Validate required fields
            if (!question.correct_answer || !question.incorrect_answers || !question.question) {
              continue;
            }
            
            // Convert Open Trivia Database format to TriviaQuestion format
            const answers = [
              { text: question.correct_answer, correct: true },
              ...question.incorrect_answers.map((answer: string) => ({ text: answer, correct: false }))
            ];

            // ✅ Shuffle answers using host-seeded randomization
            const answerId = parseInt(question.question?.slice(0, 10).replace(/\D/g, '') || '0') || i;
            const answerRandomizer = this.createHostSeededRandom(answerId);
            
            for (let j = answers.length - 1; j > 0; j--) {
              const k = Math.floor(answerRandomizer() * (j + 1));
              [answers[j], answers[k]] = [answers[k], answers[j]];
            }

            const triviaQuestion: TriviaQuestion = {
              id: Math.floor(this.createHostSeededRandom(i + difficulty.length)() * 1000000), // Generate host-seeded ID since Open Trivia DB doesn't have IDs
              question: question.question,
              category: expectedCategory,
              difficulty: difficulty,
              image: undefined, // Open Trivia Database doesn't have images
              answers: answers
            };

            convertedQuestions.push(triviaQuestion);


          } catch (error) {
            continue;
          }
        }
      } else {
        continue;
      }
    }

    return convertedQuestions;
  }

  private async loadCustomQuizData(): Promise<void> {
    try {
      // Load the Italian Brainrot Quiz from the asset
      if (this.props.ItalianBrainrotQuiz) {
        const assetData = await (this.props.ItalianBrainrotQuiz as any).fetchAsData();
        const quizData = assetData.asJSON() as CustomQuizQuestion[];

        if (Array.isArray(quizData) && quizData.length > 0) {
          // Convert to standard TriviaQuestion format
          this.customQuizQuestions = await this.loadCustomQuiz(quizData);
          // Mark Italian Brainrot Quiz as loaded
          this.loadedCategories.add("italian brainrot quiz");
          
          // Prepare asset manager for Italian Brainrot images
          const imageIds = this.customQuizQuestions
            .filter(q => q.image)
            .map(q => q.image!)
            .filter(id => id); // Remove any null/undefined values
          
          if (imageIds.length > 0) {
            await this.assetManager.prepareForItalianBrainrotQuiz(imageIds);
          }
        } else {
        }
      } else {
      }
    } catch (error) {
      // If custom quiz loading fails, customQuizQuestions will remain empty
    }
  }

  private async loadCustomQuiz(quizData: CustomQuizQuestion[]): Promise<TriviaQuestion[]> {
    const convertedQuestions: TriviaQuestion[] = [];

    for (const customQuestion of quizData) {
      // Convert new Italian Brainrot Quiz format to standard TriviaQuestion format
      const answers = [
        { text: customQuestion.correct_answer, correct: true },
        ...customQuestion.incorrect_answers.map(answer => ({ text: answer, correct: false }))
      ];

      // ✅ Shuffle answers using host-seeded randomization
      const customQuestionRandomizer = this.createHostSeededRandom(parseInt(customQuestion.id) || 0);
      
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(customQuestionRandomizer() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }

      const triviaQuestion: TriviaQuestion = {
        id: parseInt(customQuestion.id),
        question: customQuestion.question,
        category: "italian brainrot quiz", // Override category to ensure matching
        difficulty: "easy", // Default difficulty for Italian Brainrot Quiz
        image: customQuestion.image_id, // Use image_id directly as texture ID
        answers: answers
      };

      convertedQuestions.push(triviaQuestion);
    }

    return convertedQuestions;
  }

  private getTextureIdForImage(imagePath: string): string | null {
    if (!imagePath) return null;

    // If it's a hexadecimal texture ID (contains letters), convert to decimal
    if (/^[0-9A-Fa-f]+$/.test(imagePath) && /[A-Fa-f]/.test(imagePath)) {
      try {
        const decimalId = parseInt(imagePath, 16).toString();
        return decimalId;
      } catch (error) {
        return null;
      }
    }

    // If it's already a numeric texture ID, use it directly
    if (/^\d+$/.test(imagePath)) {
      return imagePath;
    }

    // Otherwise, extract filename from path and look up in texture map
    const filename = imagePath.split('/').pop()?.split('.')[0];
    if (!filename) return null;

    return imageTextureMap[filename] || null;
  }

  private async updateQuestionsForCategory(category: string, difficulty: string): Promise<void> {
    // Prevent multiple simultaneous loads
    if (this.isLoadingCategory) {
      return;
    }

    this.isLoadingCategory = true;

    try {
      let allQuestions: TriviaQuestion[] = [];

      // Check if category has already been loaded
      const categoryKey = category.toLowerCase();
      if (this.loadedCategories.has(categoryKey)) {
        // Use cached questions - but shuffle them first for variety
        if (categoryKey === "general") {
          allQuestions = [...this.generalQuestions];
        } else if (categoryKey === "geography") {
          allQuestions = [...this.geographyQuestions];
        } else if (categoryKey === "history") {
          allQuestions = [...this.historyQuestions];
        } else if (categoryKey === "science") {
          allQuestions = [...this.scienceQuestions];
        } else if (categoryKey === "film") {
          allQuestions = [...this.filmQuestions];
        } else if (categoryKey === "music") {
          allQuestions = [...this.musicQuestions];
        } else if (categoryKey === "television") {
          allQuestions = [...this.televisionQuestions];
        } else if (categoryKey === "italian brainrot quiz" || categoryKey === "italianbrainrot quiz" || categoryKey.includes("italian") && categoryKey.includes("brainrot")) {
          allQuestions = [...this.customQuizQuestions];
        }
        
        // ✅ Pre-shuffle cached questions using host-seeded randomization to ensure different subset each game
        const cacheShuffleRandomizer = this.createHostSeededRandom(category.length * 42);
        
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(cacheShuffleRandomizer() * (i + 1));
          [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }
      } else {
        // Load category on-demand
        if (categoryKey === "general") {
          if (this.props.generalQuestionsAsset) {
            const assetData = await (this.props.generalQuestionsAsset as any).fetchAsData();
            const jsonData = assetData.asJSON();
            this.generalQuestions = this.parseOpenTriviaFormat(jsonData, "General");
            allQuestions = [...this.generalQuestions];
            this.loadedCategories.add(categoryKey);
          } else {
          }
        } else if (categoryKey === "geography") {
          if (this.props.geographyQuestionsAsset) {
            const assetData = await (this.props.geographyQuestionsAsset as any).fetchAsData();
            const jsonData = assetData.asJSON();
            this.geographyQuestions = this.parseOpenTriviaFormat(jsonData, "Geography");
            allQuestions = [...this.geographyQuestions];
            this.loadedCategories.add(categoryKey);
          } else {
          }
        } else if (categoryKey === "history") {
          if (this.props.historyQuestionsAsset) {
            const assetData = await (this.props.historyQuestionsAsset as any).fetchAsData();
            const jsonData = assetData.asJSON();
            this.historyQuestions = this.parseOpenTriviaFormat(jsonData, "History");
            allQuestions = [...this.historyQuestions];
            this.loadedCategories.add(categoryKey);
          } else {
          }
        } else if (categoryKey === "science") {
          if (this.props.scienceQuestionsAsset) {
            const assetData = await (this.props.scienceQuestionsAsset as any).fetchAsData();
            const jsonData = assetData.asJSON();
            this.scienceQuestions = this.parseOpenTriviaFormat(jsonData, "Science");
            allQuestions = [...this.scienceQuestions];
            this.loadedCategories.add(categoryKey);
          } else {
          }
        } else if (categoryKey === "film") {
          if (this.props.filmQuestionsAsset) {
            const assetData = await (this.props.filmQuestionsAsset as any).fetchAsData();
            const jsonData = assetData.asJSON();
            this.filmQuestions = this.parseOpenTriviaFormat(jsonData, "Film");
            allQuestions = [...this.filmQuestions];
            this.loadedCategories.add(categoryKey);
          } else {
          }
        } else if (categoryKey === "music") {
          if (this.props.musicQuestionsAsset) {
            const assetData = await (this.props.musicQuestionsAsset as any).fetchAsData();
            const jsonData = assetData.asJSON();
            this.musicQuestions = this.parseOpenTriviaFormat(jsonData, "Music");
            allQuestions = [...this.musicQuestions];
            this.loadedCategories.add(categoryKey);
          } else {
          }
        } else if (categoryKey === "television") {
          if (this.props.televisionQuestionsAsset) {
            const assetData = await (this.props.televisionQuestionsAsset as any).fetchAsData();
            const jsonData = assetData.asJSON();
            this.televisionQuestions = this.parseOpenTriviaFormat(jsonData, "Television");
            allQuestions = [...this.televisionQuestions];
            this.loadedCategories.add(categoryKey);
          } else {
          }
        } else if (categoryKey === "italian brainrot quiz" || categoryKey === "italianbrainrot quiz" || categoryKey.includes("italian") && categoryKey.includes("brainrot")) {
          // Italian Brainrot Quiz is already loaded in loadCustomQuizData
          allQuestions = [...this.customQuizQuestions];
          this.loadedCategories.add(categoryKey);
        } else {
          allQuestions = [];
        }
      }

      // Filter by difficulty if specified (but NOT for Italian Brainrot Quiz)
      const isItalianBrainrot = categoryKey === "italian brainrot quiz" || categoryKey === "italianbrainrot quiz" || (categoryKey.includes("italian") && categoryKey.includes("brainrot"));
      
      // Set the flag for Italian Brainrot caching system
      this.isCurrentlyItalianBrainrot = isItalianBrainrot;

      if (!isItalianBrainrot && difficulty !== "all" && allQuestions.length > 0) {
        const beforeFilter = allQuestions.length;
        allQuestions = allQuestions.filter(q => q.difficulty?.toLowerCase() === difficulty.toLowerCase());
      } else if (isItalianBrainrot) {
      }

      // Filter questions to only include those with 2 or 4 answer options
      if (allQuestions.length > 0) {
        const beforeAnswerFilter = allQuestions.length;
        allQuestions = allQuestions.filter(q => {
          const answerCount = q.answers?.length || 0;
          return answerCount === 2 || answerCount === 4;
        });
      }

      // NO FALLBACKS - if no questions match the exact criteria, keep empty array
      // This will trigger error handling in handleStartGame

      // ✅ IMPORTANT: Shuffle the entire question pool using host-seeded randomization BEFORE limiting to ensure variety
      if (allQuestions.length > 1) {

        
        // Create seeded randomizer for question pool shuffling
        const poolSeed = (Date.now() + category.length * 1337) % 99991;
        let poolRng = poolSeed;
        
        const poolSeededRandom = () => {
          poolRng = (poolRng * 48271) % 2147483647;
          return poolRng / 2147483647;
        };
        
        // Host-seeded Fisher-Yates shuffle for the full pool
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(poolSeededRandom() * (i + 1));
          [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }
        
        // Additional randomization pass with host time entropy
        const hostTime = new Date();
        const timeEntropy = (hostTime.getHours() * 3600 + hostTime.getMinutes() * 60 + hostTime.getSeconds()) % 1000;
        
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const seededValue = (poolSeededRandom() + timeEntropy / 1000) % 1;
          const j = Math.floor(seededValue * (i + 1));
          [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }
        

      }

      // Limit number of questions AFTER shuffling (but NOT for Italian Brainrot Quiz)
      if (!isItalianBrainrot && this.gameConfig && this.gameConfig.numQuestions && allQuestions.length > this.gameConfig.numQuestions) {
        allQuestions = allQuestions.slice(0, this.gameConfig.numQuestions);
      } else if (isItalianBrainrot) {
      }

      this.triviaQuestions = allQuestions;
      this.currentQuestionIndex = 0;

    } catch (error) {
      console.log(`❌ Error loading questions for category '${category}':`, error);
      this.triviaQuestions = [];
    } finally {
      this.isLoadingCategory = false;
    }
  }

  private setupNetworkEvents(): void {
    // Listen for question start events from the world trivia system
    this.connectNetworkBroadcastEvent(triviaQuestionShowEvent, this.onQuestionStart.bind(this));
    
    // Listen for results events
    this.connectNetworkBroadcastEvent(triviaResultsEvent, this.onQuestionResults.bind(this));
    
    // Listen for answer submissions from other players
    this.connectNetworkBroadcastEvent(triviaAnswerSubmittedEvent, this.onPlayerAnswerSubmitted.bind(this));
    
    // Listen for game start events from host
    this.connectNetworkBroadcastEvent(triviaGameStartEvent, this.onGameStart.bind(this));
    this.connectNetworkBroadcastEvent(triviaNextQuestionEvent, this.onNextQuestionRequest.bind(this));
    
    // Listen for host management events
    this.connectNetworkBroadcastEvent(hostChangedEvent, this.onHostChanged.bind(this));
    
    // Listen for state requests from TriviaPhone
    this.connectNetworkBroadcastEvent(triviaStateRequestEvent, this.onStateRequest.bind(this));
    
    // Listen for game reset requests from TriviaPhone
    this.connectNetworkBroadcastEvent(triviaGameResetEvent, this.onGameReset.bind(this));

    // Listen for award points requests from TriviaPhone
    this.connectNetworkBroadcastEvent(triviaAwardPointsEvent, this.onAwardPoints.bind(this));

    // Listen for settings update events from TriviaPhone
    this.connectNetworkBroadcastEvent(triviaSettingsUpdateEvent, this.onSettingsUpdate.bind(this));

    // Listen for host view mode changes
    this.connectNetworkBroadcastEvent(hostViewModeEvent, this.onHostViewModeChanged.bind(this));

    // Listen for timer synchronization events
    this.connectNetworkBroadcastEvent(triviaTimerUpdateEvent, this.onTimerUpdate.bind(this));
    this.connectNetworkBroadcastEvent(triviaTimerEndEvent, this.onTimerEnd.bind(this));

    // Listen for UI state synchronization events
    this.connectNetworkBroadcastEvent(triviaUIStateEvent, this.onUIStateUpdate.bind(this));

    // Listen for player tracking synchronization events
    this.connectNetworkBroadcastEvent(triviaPlayerUpdateEvent, this.onPlayerUpdate.bind(this));
    
    // Listen for player logout events
    this.connectNetworkBroadcastEvent(triviaPlayerLogoutEvent, this.onPlayerLogout.bind(this));
    
    // Listen for player rejoin events
    this.connectNetworkBroadcastEvent(triviaPlayerRejoinEvent, this.onPlayerRejoin.bind(this));
  }

  private resetGameState(): void {
    // Reset all game state variables
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.timeRemaining = this.getTimeLimitForCurrentModifier();
    this.totalAnswers = 0;
    this.isRunning = false;

    // Clear player tracking using PlayerManager
    this.playerManager.clearAnsweredPlayers();
    this.hasLocalPlayerAnswered = false;

    // Reset UI bindings
    this.questionNumberBinding.set("Q1");
    const timeLimit = (this.props as any).questionTimeLimit || 30;
    this.timerBinding.set(timeLimit.toString());
    this.answerCountBinding.set("0");
    this.questionBinding.set("Loading first question...");
    this.questionImageBinding.set(null); // Clear image binding
    this.centerQuestionBinding.set(false); // Reset to top layout
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    this.showGameOverBinding.set(false); // Hide game over screen on reset
    this.showErrorBinding.set(false); // Hide error screen on reset
    
    // Reset answer reveal state
    this.answerRevealed = false;
    this.answerRevealedBinding.set(false);

    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }

    // Reset answer count tracking
    this.answerCountTracking.set(4);

    // Reset individual answer counts
    this.currentAnswerCounts = [0, 0, 0, 0];
    this.answerCountsBinding.set([...this.currentAnswerCounts]);

    // Reset answer button colors
    const defaultColors = ['#DC2626', '#2563EB', '#EAB308', '#16A34A']; // Red, Blue, Yellow, Green
    for (let i = 0; i < 4; i++) {
      this.answerButtonColors[i].set(defaultColors[i]);
    }

    // Clear any running timers
    this.stopTimer();
    if (this.roundTimeoutId) {
      this.async.clearTimeout(this.roundTimeoutId);
      this.roundTimeoutId = null;
    }
    if (this.gameLoopTimeoutId) {
      this.async.clearTimeout(this.gameLoopTimeoutId);
      this.gameLoopTimeoutId = null;
    }
  }

  private resetGameStateButKeepRunning(): void {
    // Reset all game state variables but preserve isRunning
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.timeRemaining = this.getTimeLimitForCurrentModifier();
    this.totalAnswers = 0;
    // DON'T reset isRunning here

    // Clear player tracking using PlayerManager
    this.playerManager.clearAnsweredPlayers();
    this.hasLocalPlayerAnswered = false;

    // Reset UI bindings
    this.questionNumberBinding.set("Q1");
    const timeLimit = (this.props as any).questionTimeLimit || 30;
    this.timerBinding.set(timeLimit.toString());
    this.answerCountBinding.set("0");
    this.questionBinding.set("Loading first question...");
    this.questionImageBinding.set(null); // Clear image binding
    this.centerQuestionBinding.set(false); // Reset to top layout
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    this.showGameOverBinding.set(false); // Hide game over screen on reset
    this.showErrorBinding.set(false); // Hide error screen on reset
    
    // Reset answer reveal state
    this.answerRevealed = false;
    this.answerRevealedBinding.set(false);

    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }

    // Reset answer count tracking
    this.answerCountTracking.set(4);

    // Reset individual answer counts
    this.currentAnswerCounts = [0, 0, 0, 0];
    this.answerCountsBinding.set([...this.currentAnswerCounts]);

    // Reset answer button colors
    const defaultColors = ['#DC2626', '#2563EB', '#EAB308', '#16A34A']; // Red, Blue, Yellow, Green
    for (let i = 0; i < 4; i++) {
      this.answerButtonColors[i].set(defaultColors[i]);
    }

    // Clear any running timers
    this.stopTimer();
    if (this.roundTimeoutId) {
      this.async.clearTimeout(this.roundTimeoutId);
      this.roundTimeoutId = null;
    }
    if (this.gameLoopTimeoutId) {
      this.async.clearTimeout(this.gameLoopTimeoutId);
      this.gameLoopTimeoutId = null;
    }
  }

  private startContinuousGame(): void {
    if (this.triviaQuestions.length === 0) {
      this.questionBinding.set("No questions available. Please add trivia questions.");
      return;
    }

    // Set running flag FIRST before any other operations
    this.isRunning = true;

    // Reset game state for new game (but preserve isRunning)
    this.resetGameStateButKeepRunning();
    
    // Clear interlude tracking for fresh start
    this.playersJoinedDuringInterlude.clear();

    this.currentQuestionIndex = 0;

    // Ensure questions are properly shuffled before starting
    this.shuffleQuestions();

    this.showNextQuestion();
  }

  private showNextQuestion(): void {
    if (!this.isRunning || this.triviaQuestions.length === 0) {
      return;
    }

    // Get the next question in the shuffled order
    if (this.currentQuestionIndex >= this.triviaQuestions.length) {
      // If we've gone through all questions, end the game
      this.endGame();
      return;
    }

    const question = this.triviaQuestions[this.currentQuestionIndex];
    
    // Create a copy of the question with shuffled answers
    const shuffledQuestion = this.shuffleQuestionAnswers(question);
    this.currentQuestion = shuffledQuestion;
    this.timeRemaining = this.getTimeLimitForCurrentModifier();
    this.totalAnswers = 0;

    // Update UI bindings
    this.questionNumberBinding.set(`Q${this.currentQuestionIndex + 1}`);
    this.questionBinding.set(shuffledQuestion.question);
    // Set the image binding for stable image display
    const imageValue = shuffledQuestion.image;
    this.questionImageBinding.set(imageValue && imageValue.trim() !== "" ? imageValue : null);
    
    // Set layout mode - center question if no image
    this.centerQuestionBinding.set(!imageValue || imageValue.trim() === "");
    
    // Update timer display based on timer modifier
    if (this.shouldShowTimer()) {
      this.timerBinding.set(this.timeRemaining.toString());
    } else {
      this.timerBinding.set(""); // Show no text for no timer modifier
    }
    
    // For Italian Brainrot quiz, track current image and preload next image
    if (this.isItalianBrainrotQuiz()) {
      this.currentItalianBrainrotImageId = imageValue || null;
      this.preloadNextItalianBrainrotImage();
    }
    // Don't reset answer count here - let it persist during results display
    this.showResultsBinding.set(false);
    
    // Reset answer reveal state for new question
    this.answerRevealed = false;
    this.answerRevealedBinding.set(false);

    // Update answer options with shuffled answers - support both 2 and 4 option questions
    if (shuffledQuestion.answers.length === 2) {
      // For 2-answer questions, place answers in positions 2 and 3 (to show as options 3 and 4)
      this.answerTexts[0].set(""); // Clear option 1
      this.answerTexts[1].set(""); // Clear option 2
      this.answerTexts[2].set(shuffledQuestion.answers[0].text); // Set option 3
      this.answerTexts[3].set(shuffledQuestion.answers[1].text); // Set option 4
    } else {
      // For 3+ answer questions, place answers normally
      for (let i = 0; i < 4; i++) {
        if (i < shuffledQuestion.answers.length) {
          this.answerTexts[i].set(shuffledQuestion.answers[i].text);
        } else {
          this.answerTexts[i].set("");
        }
      }
    }
    
    // Update answer count tracking for layout logic
    this.answerCountTracking.set(shuffledQuestion.answers.length);
    
    // Reset answer button colors to defaults - handle variable answer count
    const defaultColors = ['#DC2626', '#2563EB', '#EAB308', '#16A34A']; // Red, Blue, Yellow, Green
    
    if (shuffledQuestion.answers.length === 2) {
      // For 2-answer questions, set colors for positions 2 and 3 (red and blue)
      this.answerButtonColors[0].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[1].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[2].set('#DC2626'); // Red for first answer (position 2)
      this.answerButtonColors[3].set('#2563EB'); // Blue for second answer (position 3)
    } else {
      // For 3+ answer questions, use normal logic
      for (let i = 0; i < 4; i++) {
        if (i < shuffledQuestion.answers.length) {
          this.answerButtonColors[i].set(defaultColors[i]);
        } else {
          this.answerButtonColors[i].set('#6B7280'); // Gray for empty slots
        }
      }
    }

    // Send question to TriviaPhone and other components
    const serializableQuestion: SerializableQuestion = {
      id: shuffledQuestion.id,
      question: shuffledQuestion.question,
      category: shuffledQuestion.category || 'General',
      difficulty: shuffledQuestion.difficulty || 'easy',
      image: shuffledQuestion.image, // Include the image field
      answers: shuffledQuestion.answers.map((answer: { text: string; correct: boolean }) => ({ text: answer.text, correct: answer.correct }))
    };

    // Determine which screen type to show based on answer count
    const answerCount = serializableQuestion.answers.length;
    const questionData = {
      question: serializableQuestion,
      questionIndex: this.currentQuestionIndex,
      timeLimit: this.getTimeLimitForCurrentModifier(),
      totalQuestions: this.triviaQuestions.length
    };

    if (answerCount === 2) {
      // Send event for 2-option screen
      this.sendNetworkBroadcastEvent(triviaTwoOptionsEvent, questionData);
    } else {
      // Send event for 4-option screen (3+ answers)
      this.sendNetworkBroadcastEvent(triviaFourOptionsEvent, questionData);
    }

    // Broadcast UI state update to show question screen
    this.sendNetworkBroadcastEvent(triviaUIStateEvent, {
      showConfig: false,
      showResults: false,
      showWaiting: false,
      showLeaderboard: false,
      showError: false
    });

    // Handle players who joined during results/leaderboard and need explicit state sync
    this.syncPlayersJoinedDuringInterlude(serializableQuestion, answerCount);

    // Reset answer count when starting new question
    this.answerCountBinding.set("0");
    
    // Reset individual answer counts for new question
    this.currentAnswerCounts = [0, 0, 0, 0];
    this.answerCountsBinding.set([...this.currentAnswerCounts]);

    // Start countdown timer
    this.startTimer();

    // Don't auto-schedule next question - wait for host to press "Next Question"
    // this.scheduleNextQuestion();
  }

  private shuffleQuestions(): void {
    if (this.triviaQuestions.length <= 1) return;

    // ✅ Enhanced randomization using host player's time/date as primary seed
    // This ensures completely unique question orders between sessions

    // Generate entropy sources based on host player's current time/date
    const now = new Date();
    const hostTimestamp = Date.now();
    
    // Extract detailed time components for maximum entropy
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate(); // 1-31
    const hour = now.getHours(); // 0-23
    const minute = now.getMinutes(); // 0-59
    const second = now.getSeconds(); // 0-59
    const millisecond = now.getMilliseconds(); // 0-999
    const dayOfWeek = now.getDay(); // 0-6
    const dayOfYear = Math.floor((hostTimestamp - new Date(year, 0, 0).getTime()) / 86400000);
    
    // Additional entropy sources
    const playerCount = this.world?.getPlayers().length || 0;
    const questionPoolSize = this.triviaQuestions.length;
    

    
    // Create multiple independent seeds based on host's time/date
    const seed1 = ((year * 10000 + month * 100 + day) % 99991) + playerCount;
    const seed2 = ((hour * 3600 + minute * 60 + second) % 99991) + millisecond;
    const seed3 = ((dayOfYear * 1000 + dayOfWeek * 100 + questionPoolSize) % 99991);
    const seed4 = (hostTimestamp % 99991) + (millisecond * 7919) % 99991;

    // ✅ Advanced seeded pseudo-random generator using host's time/date
    let rng1 = seed1;
    let rng2 = seed2;
    let rng3 = seed3;
    let rng4 = seed4;
    
    // Track total randomization calls for debugging
    let randomCallCount = 0;

    const hostSeededRandom = () => {
      randomCallCount++;
      
      // Multiple Linear Congruential Generators (LCGs) with different parameters
      // These are deterministic but high-quality pseudo-random generators
      rng1 = (rng1 * 16807) % 2147483647; // Park-Miller RNG
      rng2 = (rng2 * 48271) % 2147483647; // Improved Park-Miller
      rng3 = (rng3 * 69621) % 2147483647; // Custom multiplier
      rng4 = (rng4 * 40692) % 2147483647; // Custom multiplier
      
      // Combine generators using XOR and modular arithmetic for better distribution
      const combined1 = (rng1 ^ rng2) / 2147483647;
      const combined2 = (rng3 ^ rng4) / 2147483647;
      
      // Final combination with time-based micro-adjustments
      const timeMicro = (Date.now() % 1000) / 1000;
      return ((combined1 + combined2 + timeMicro) / 3) % 1;
    };

    // ✅ Perform multiple shuffle passes using host-seeded randomization
    for (let pass = 0; pass < 5; pass++) {
      
      // Fisher-Yates shuffle with host-seeded randomness
      for (let i = this.triviaQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(hostSeededRandom() * (i + 1));
        [this.triviaQuestions[i], this.triviaQuestions[j]] = [this.triviaQuestions[j], this.triviaQuestions[i]];
      }

      // Random segment swapping for additional entropy
      if (this.triviaQuestions.length > 4) {
        const segmentSize = Math.floor(hostSeededRandom() * 3) + 2; // 2-4 elements
        const start1 = Math.floor(hostSeededRandom() * (this.triviaQuestions.length - segmentSize));
        const start2 = Math.floor(hostSeededRandom() * (this.triviaQuestions.length - segmentSize));
        
        if (start1 !== start2 && Math.abs(start1 - start2) >= segmentSize) {
          // Swap segments
          for (let i = 0; i < segmentSize; i++) {
            const temp = this.triviaQuestions[start1 + i];
            this.triviaQuestions[start1 + i] = this.triviaQuestions[start2 + i];
            this.triviaQuestions[start2 + i] = temp;
          }
        }
      }
    }

    // ✅ Additional randomization operations for maximum unpredictability
    if (this.triviaQuestions.length > 6) {
      // Random rotation based on host time
      const rotateAmount = Math.floor(hostSeededRandom() * this.triviaQuestions.length);
      const rotated = [...this.triviaQuestions.slice(rotateAmount), ...this.triviaQuestions.slice(0, rotateAmount)];
      this.triviaQuestions.splice(0, this.triviaQuestions.length, ...rotated);

      // Random reversal of subsections
      const numReversals = Math.floor(hostSeededRandom() * 3) + 1;
      for (let r = 0; r < numReversals; r++) {
        const start = Math.floor(hostSeededRandom() * (this.triviaQuestions.length - 2));
        const end = start + Math.floor(hostSeededRandom() * (this.triviaQuestions.length - start - 1)) + 1;
        
        // Reverse subsection
        for (let i = start; i < start + Math.floor((end - start) / 2); i++) {
          const temp = this.triviaQuestions[i];
          this.triviaQuestions[i] = this.triviaQuestions[end - (i - start)];
          this.triviaQuestions[end - (i - start)] = temp;
        }
      }
    }

    // ✅ Final mega-shuffle using pure host-seeded randomness (no Math.random)
    for (let finalPass = 0; finalPass < 3; finalPass++) {
      for (let i = this.triviaQuestions.length - 1; i > 0; i--) {
        // Use only host-seeded randomness for completely predictable-but-unique results
        const j = Math.floor(hostSeededRandom() * (i + 1));
        [this.triviaQuestions[i], this.triviaQuestions[j]] = [this.triviaQuestions[j], this.triviaQuestions[i]];
      }
    }
    
    // Log shuffle completion and statistics for debugging repeated question issues
    
    // ✅ Log shuffling statistics for debugging repeated question issue
    this.logShufflingStatistics();
  }

  // ✅ Helper method to log shuffling statistics for debugging repeated questions
  private logShufflingStatistics(): void {
    if (this.triviaQuestions.length === 0) return;
    
    const totalQuestions = this.triviaQuestions.length;
    const gameConfig = this.gameConfig || { numQuestions: totalQuestions };
    const questionsToShow = Math.min(gameConfig.numQuestions || totalQuestions, totalQuestions);
    
    // Only log if there might be a variety issue
    if (totalQuestions < 100 || questionsToShow > totalQuestions * 0.8) {
      console.log(`⚠️  Question variety warning: Using ${questionsToShow}/${totalQuestions} questions (${((questionsToShow / totalQuestions) * 100).toFixed(1)}%). Consider more questions in pool for better randomization.`);
    }
  }

  // ✅ Public method to test the host-seeded randomization system (for debugging)
  public testRandomizationSystem(): void {
    if (this.triviaQuestions.length < 10) {
      console.log(`❌ Need at least 10 questions to test randomization. Current count: ${this.triviaQuestions.length}`);
      return;
    }

    console.log(`✅ Testing host-seeded randomization with ${this.triviaQuestions.length} questions:`);
    
    // Test multiple shuffles at different times to show variety
    const originalOrder = this.triviaQuestions.map(q => q.id);
    const testResults: number[][] = [];
    
    for (let test = 0; test < 3; test++) {
      // Small delay to get different time seed
      this.async.setTimeout(() => {
        this.shuffleQuestions();
        const shuffledOrder = this.triviaQuestions.map(q => q.id);
        testResults.push(shuffledOrder.slice(0, 5)); // First 5 questions
        
        console.log(`   Test ${test + 1}: [${shuffledOrder.slice(0, 5).join(', ')}...]`);
        
        if (test === 2) {
          // Calculate uniqueness
          const allFirstQuestions = testResults.map(result => result[0]);
          const uniqueFirstQuestions = new Set(allFirstQuestions);
          console.log(`   ✅ Uniqueness: ${uniqueFirstQuestions.size}/3 different first questions across tests`);
        }
      }, test * 100);
    }
  }

  private shuffleQuestionAnswers(question: TriviaQuestion): TriviaQuestion {
    // Create a copy of the question
    const shuffledQuestion: TriviaQuestion = {
      id: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      image: question.image, // Include the image property
      answers: [...question.answers]
    };

    const answers = shuffledQuestion.answers;

    // Check if this is a true/false question
    const isTrueFalseQuestion = answers.length === 2 && 
      answers.some(a => a.text.toLowerCase().includes('true')) && 
      answers.some(a => a.text.toLowerCase().includes('false'));

    if (isTrueFalseQuestion) {
      // For true/false questions, ensure "True" is always first and "False" is always second
      const trueAnswer = answers.find(a => a.text.toLowerCase().includes('true'));
      const falseAnswer = answers.find(a => a.text.toLowerCase().includes('false'));
      
      if (trueAnswer && falseAnswer) {
        shuffledQuestion.answers = [trueAnswer, falseAnswer];
      }
    } else {
      // ✅ For non-true/false questions, use host-seeded randomization for answer shuffling
      // Create a simple seeded random generator for answer shuffling
      const answerSeed = (question.id * 7919 + Date.now() % 10000) % 99991;
      let answerRng = answerSeed;
      
      const answerSeededRandom = () => {
        answerRng = (answerRng * 16807) % 2147483647;
        return answerRng / 2147483647;
      };

      // First pass: Fisher-Yates shuffle with seeded randomness
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(answerSeededRandom() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }

      // Second pass: Additional randomization with seeded approach
      if (answers.length >= 3) {
        // Randomly swap pairs using seeded randomness
        for (let i = 0; i < Math.min(3, answers.length - 1); i++) {
          const idx1 = Math.floor(answerSeededRandom() * answers.length);
          let idx2 = Math.floor(answerSeededRandom() * answers.length);
          while (idx2 === idx1) {
            idx2 = Math.floor(answerSeededRandom() * answers.length);
          }
          [answers[idx1], answers[idx2]] = [answers[idx2], answers[idx1]];
        }
      }

      // Third pass: Deterministic positioning based on seeded randomness
      // (This ensures consistent but varied correct answer positioning)
      const correctIndex = answers.findIndex(a => a.correct);
      if (correctIndex !== -1 && answerSeededRandom() > 0.5) {
        // Seeded chance to move correct answer to a different position
        const newPosition = Math.floor(answerSeededRandom() * answers.length);
        if (newPosition !== correctIndex) {
          [answers[correctIndex], answers[newPosition]] = [answers[newPosition], answers[correctIndex]];
        }
      }
    }

    return shuffledQuestion;
  }

  private endGame(): void {
    // Reset the game to pre-game configuration screen
    this.isRunning = false;
    this.stopTimer();

    // Hide all game UI elements except game over screen
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    this.showConfigBinding.set(false); // Keep config hidden
    this.updateLockIcon('host-pregame'); // Game ended, back to host pre-game state (lock icon)
    this.showErrorBinding.set(false);
    
    // Clear interlude tracking since game is ending
    this.playersJoinedDuringInterlude.clear();
    
    // Generate final leaderboard data and show game over screen
    this.generateRealLeaderboard().then(finalLeaderboard => {
      this.leaderboardDataBinding.set(finalLeaderboard);
      
      // Show game over screen with podium
      this.showGameOverBinding.set(true);
      
      // Send final leaderboard data to TriviaPhones
      if (this.currentQuestion) {
        const serializableQuestion: SerializableQuestion = {
          id: this.currentQuestion.id,
          question: this.currentQuestion.question,
          category: this.currentQuestion.category || 'General',
          difficulty: this.currentQuestion.difficulty || 'easy',
          image: this.currentQuestion.image,
          answers: this.currentQuestion.answers
        };

        const networkLeaderboardData = finalLeaderboard.map(player => ({
          name: player.name,
          score: player.score,
          playerId: player.playerId
        }));
        
        this.sendNetworkBroadcastEvent(triviaResultsEvent, {
          question: serializableQuestion,
          correctAnswerIndex: this.currentQuestion.answers.findIndex((answer: { correct: boolean }) => answer.correct),
          answerCounts: [],
          scores: {},
          showLeaderboard: true,
          leaderboardData: networkLeaderboardData
        });

        // Send game end event to TriviaPhones
        this.sendNetworkBroadcastEvent(triviaGameEndEvent, {
          hostId: this.hostPlayerId || 'unknown',
          finalLeaderboard: networkLeaderboardData
        });
      }
    });
    
    // Reset question display to config message
    this.questionBinding.set("Configure your trivia game settings and press Start when ready!");

    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }

    // Reset timer display
    this.timerBinding.set("0");
    this.answerCountBinding.set("0");

    // Reset question index for next game
    this.currentQuestionIndex = 0;

    // Clear player tracking using PlayerManager
    this.playerManager.clearAnsweredPlayers();
    
    // For Italian Brainrot quiz, clean up any remaining cached images
    this.cleanupPreviousItalianBrainrotImage();
    this.isCurrentlyItalianBrainrot = false;
  }

  private showFinalLeaderboard(): void {
    // Hide results, show final leaderboard
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(true);
    this.isShowingLeaderboard = true;
    
    // Generate final leaderboard data
    this.generateRealLeaderboard().then(finalLeaderboard => {
      this.leaderboardDataBinding.set(finalLeaderboard);
      
      // Send final leaderboard data
      if (!this.currentQuestion) {
        return;
      }
      
    const serializableQuestion: SerializableQuestion = {
      id: this.currentQuestion.id,
      question: this.currentQuestion.question,
      category: this.currentQuestion.category || 'General',
      difficulty: this.currentQuestion.difficulty || 'easy',
      image: this.currentQuestion.image, // Include the image field
      answers: this.currentQuestion.answers
    };      

      // Prepare final leaderboard data for network event
      const networkLeaderboardData = finalLeaderboard.map(player => ({
        name: player.name,
        score: player.score,
        playerId: player.playerId
      }));
      
      this.sendNetworkBroadcastEvent(triviaResultsEvent, {
        question: serializableQuestion,
        correctAnswerIndex: this.currentQuestion.answers.findIndex((answer: { correct: boolean }) => answer.correct),
        answerCounts: [],
        scores: {},
        showLeaderboard: true,
        leaderboardData: networkLeaderboardData
      });

      // Send additional game end event with final leaderboard to ensure TriviaPhones show Start Game screen
      this.sendNetworkBroadcastEvent(triviaGameEndEvent, {
        hostId: this.hostPlayerId || 'unknown',
        finalLeaderboard: networkLeaderboardData
      });
    });
  }

  private scheduleNextQuestion(): void {
    // Clear any existing game loop timer
    if (this.gameLoopTimeoutId) {
      this.async.clearTimeout(this.gameLoopTimeoutId);
    }

    // Schedule next question after question time + results time
    const totalTime = this.getTimeLimitForCurrentModifier() * 1000 + this.props.autoAdvanceTime * 1000;
    this.gameLoopTimeoutId = this.async.setTimeout(() => {
      this.currentQuestionIndex++;
      this.showNextQuestion();
    }, totalTime);
  }

  private showQuestionResults(): void {
    if (!this.currentQuestion) return;

    // Time's up - show correct answers and leaderboard (same as when all players answer)
    this.showCorrectAnswersAndLeaderboard();
  }

  private onQuestionStart(eventData: { question: SerializableQuestion, questionIndex: number, timeLimit: number }): void {
    
    this.currentQuestion = eventData.question as TriviaQuestion;
    this.currentQuestionIndex = eventData.questionIndex;
    this.timeRemaining = eventData.timeLimit;
    this.totalAnswers = 0;
    
    // Reset player tracking for new question using PlayerManager
    this.playerManager.clearAnsweredPlayers();
    this.hasLocalPlayerAnswered = false;
    this.showWaitingBinding.set(false);
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    
    // Update PlayerManager with current players in world
    const currentPlayers = this.world.getPlayers();
    this.playerManager.updatePlayersInWorld(currentPlayers);
    
    // Broadcast initial player tracking state using PlayerManager
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: this.playerManager.getPlayersInWorld(),
      playersAnswered: [],
      answerCount: 0
    });
    
    // Update UI bindings
    this.questionNumberBinding.set(`Q${eventData.questionIndex + 1}`);
    this.questionBinding.set(eventData.question.question);
    // Set the image binding for stable image display
    this.questionImageBinding.set((eventData.question as any).image || null);
    // Set layout mode - center question if no image
    const imageValue = (eventData.question as any).image;
    this.centerQuestionBinding.set(!imageValue || imageValue.trim() === "");
    // Don't reset answer count here - let it persist during results display
    this.showResultsBinding.set(false);
    
    // Update answer options - support both 2 and 4 option questions
    const answers = eventData.question.answers;
    if (answers.length === 2) {
      // For 2-answer questions, place answers in positions 2 and 3 (to show as options 3 and 4)
      this.answerTexts[0].set(""); // Clear option 1
      this.answerTexts[1].set(""); // Clear option 2
      this.answerTexts[2].set(answers[0].text); // Set option 3
      this.answerTexts[3].set(answers[1].text); // Set option 4
    } else {
      // For 3+ answer questions, place answers normally
      for (let i = 0; i < 4; i++) {
        if (i < answers.length) {
          this.answerTexts[i].set(answers[i].text);
        } else {
          this.answerTexts[i].set("");
        }
      }
    }
    
    // Update answer count tracking for layout logic
    this.answerCountTracking.set(answers.length);
    
    // Reset answer button colors to defaults - handle variable answer count
    const defaultColors = ['#DC2626', '#2563EB', '#EAB308', '#16A34A']; // Red, Blue, Yellow, Green
    
    if (answers.length === 2) {
      // For 2-answer questions, set colors for positions 2 and 3 (red and blue)
      this.answerButtonColors[0].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[1].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[2].set('#DC2626'); // Red for first answer (position 2)
      this.answerButtonColors[3].set('#2563EB'); // Blue for second answer (position 3)
    } else {
      // For 3+ answer questions, use normal logic
      for (let i = 0; i < 4; i++) {
        if (i < answers.length) {
          this.answerButtonColors[i].set(defaultColors[i]);
        } else {
          this.answerButtonColors[i].set('#6B7280'); // Gray for empty slots
        }
      }
    }
    
    // Reset answer count when starting new question
    this.answerCountBinding.set("0");
    
    // Reset individual answer counts
    this.currentAnswerCounts = [0, 0, 0, 0];
    this.answerCountsBinding.set([...this.currentAnswerCounts]);

    // Start countdown timer
    this.startTimer();
  }

  private onQuestionResults(eventData: { question: SerializableQuestion, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }): void {
    
    this.showResultsBinding.set(true);
    this.isShowingResults = true;
    this.showWaitingBinding.set(false); // Hide waiting screen when results come in
    this.correctAnswerBinding.set(eventData.correctAnswerIndex);
    this.answerCountsBinding.set([...this.currentAnswerCounts]); // Use our tracked counts
    
    // Store the results data for state responses
    this.lastCorrectAnswerIndex = eventData.correctAnswerIndex;
    this.lastAnswerCounts = [...this.currentAnswerCounts]; // Use our tracked counts
    
    // Calculate total answers from our tracked counts
    this.totalAnswers = this.currentAnswerCounts.reduce((sum, count) => sum + count, 0);
    this.answerCountBinding.set(this.totalAnswers.toString());
    
    // Stop timer
    this.stopTimer();
    
    // Clear results after a few seconds
    this.async.setTimeout(() => {
      this.showResultsBinding.set(false);
      this.isShowingResults = false;
      // Keep the current question visible - don't change to "Waiting for next question..."
    }, this.props.autoAdvanceTime * 1000);
  }

  private onPlayerAnswerSubmitted(eventData: { playerId: string, answerIndex: number, responseTime: number }): void {
    
    // Track this player as having answered using PlayerManager, including their answer choice
    this.playerManager.addAnsweredPlayer(eventData.playerId, eventData.answerIndex);
    
    // Update individual answer count for the chosen answer
    if (eventData.answerIndex >= 0 && eventData.answerIndex < 4) {
      // TriviaPhone already sends the correct logical answer indices (0,1 for 2-answer questions)
      // No mapping needed - just use the answer index directly
      if (!this.currentAnswerCounts) {
        this.currentAnswerCounts = [0, 0, 0, 0];
      }
      this.currentAnswerCounts[eventData.answerIndex]++;
      this.answerCountsBinding.set([...this.currentAnswerCounts]);
    }
    
    // Update answer count immediately using PlayerManager
    this.answerCountBinding.set(this.playerManager.getAnsweredCount().toString());
    
    // Broadcast player tracking update to all clients
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: this.playerManager.getPlayersInWorld(),
      playersAnswered: this.playerManager.getAnsweredPlayers(),
      answerCount: this.playerManager.getAnsweredCount()
    });
    
    // Check if all active (non-opted-out) players have answered
    if (this.playerManager.getAnsweredCount() >= this.playerManager.getActivePlayerCount() && this.playerManager.getActivePlayerCount() > 0) {
      // Add a small delay to allow any concurrent logout events to be processed first
      this.async.setTimeout(() => {
        // Recheck the counts after the delay to ensure accuracy
        if (this.playerManager.getAnsweredCount() >= this.playerManager.getActivePlayerCount() && 
            this.playerManager.getActivePlayerCount() > 0 && 
            !this.isShowingResults) {
          this.showCorrectAnswersAndLeaderboard();
        }
      }, 100); // 100ms delay to allow logout events to process
    }
  }

  private showCorrectAnswersAndLeaderboard(): void {
    if (!this.currentQuestion) return;
    
    // Prevent multiple concurrent calls to avoid premature round advancement
    if (this.isShowingResults) {
      return;
    }
    
    // Stop timer and hide waiting screen
    this.stopTimer();
    this.showWaitingBinding.set(false);
    
    // Cancel any scheduled auto-advance to prevent counter reset
    if (this.gameLoopTimeoutId) {
      this.async.clearTimeout(this.gameLoopTimeoutId);
      this.gameLoopTimeoutId = null;
    }
    
    // Find the correct answer index
    const correctAnswerIndex = this.currentQuestion.answers.findIndex(answer => answer.correct);
    this.correctAnswerBinding.set(correctAnswerIndex);
    
    // Update answer count to show how many players answered
    this.answerCountBinding.set(this.playerManager.getAnsweredCount().toString());
    
    // Set answer revealed state
    this.answerRevealed = true;
    this.answerRevealedBinding.set(true);
    
    // Update answer button colors for results - handle remapped positions for 2-answer questions
    if (this.currentQuestion.answers.length === 2) {
      // For 2-answer questions, answers are in positions 2 and 3
      // Map the correct answer index from original (0 or 1) to display positions (2 or 3)
      const displayCorrectIndex = correctAnswerIndex + 2; // Map 0->2, 1->3
      
      // Clear colors for unused positions 0 and 1
      this.answerButtonColors[0].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[1].set('#6B7280'); // Gray for empty slot
      
      // Set colors for positions 2 and 3
      this.answerButtonColors[2].set(displayCorrectIndex === 2 ? '#16A34A' : '#DC2626');
      this.answerButtonColors[3].set(displayCorrectIndex === 3 ? '#16A34A' : '#DC2626');
    } else {
      // For 3+ answer questions, use normal logic
      for (let i = 0; i < 4; i++) {
        if (i < this.currentQuestion.answers.length) {
          if (i === correctAnswerIndex) {
            this.answerButtonColors[i].set('#16A34A'); // Green for correct
          } else {
            this.answerButtonColors[i].set('#DC2626'); // Red for incorrect
          }
        } else {
          // Keep default colors for empty answer slots
          this.answerButtonColors[i].set('#6B7280'); // Gray for empty slots
        }
      }
    }
    
    // Convert question to serializable format
    const serializableQuestion: SerializableQuestion = {
      id: this.currentQuestion.id,
      question: this.currentQuestion.question,
      category: this.currentQuestion.category || 'General',
      difficulty: this.currentQuestion.difficulty || 'easy',
      image: this.currentQuestion.image, // Include the image field
      answers: this.currentQuestion.answers
    };
    
    // Call TriviaPhone instances directly via world reference
    const triviaPhones = (this.world as any).triviaPhones;
    
    // Also check global registry as backup
    const globalTriviaPhones = (globalThis as any).triviaPhoneInstances || [];
    
    // Also send network event for TriviaPhone instances that might be listening
    // Use actual answer count in a way that won't reset our display
    // Use the actual tracked answer counts
    const actualAnswerCounts = [...this.currentAnswerCounts];
    
    // Try world registry first
    if (triviaPhones && Array.isArray(triviaPhones)) {
      triviaPhones.forEach((triviaPhone: any, index: number) => {
        if (triviaPhone && typeof triviaPhone.onTriviaResults === 'function') {
          // Check if this phone's player answered using PlayerManager
          const phonePlayerId = triviaPhone.assignedPlayer?.id.toString();
          const playerAnswered = phonePlayerId ? this.playerManager.hasPlayerAnswered(phonePlayerId) : false;
          
          triviaPhone.onTriviaResults({
            question: serializableQuestion,
            correctAnswerIndex: correctAnswerIndex,
            answerCounts: actualAnswerCounts,
            scores: {},
            playerAnswered: playerAnswered
          });
        }
      });
    } else if (globalTriviaPhones.length > 0) {
      // Fallback to global registry
      globalTriviaPhones.forEach((triviaPhone: any, index: number) => {
        if (triviaPhone && typeof triviaPhone.onTriviaResults === 'function') {
          // Check if this phone's player answered using PlayerManager
          const phonePlayerId = triviaPhone.assignedPlayer?.id.toString();
          const playerAnswered = phonePlayerId ? this.playerManager.hasPlayerAnswered(phonePlayerId) : false;
          
          triviaPhone.onTriviaResults({
            question: serializableQuestion,
            correctAnswerIndex: correctAnswerIndex,
            answerCounts: actualAnswerCounts,
            scores: {},
            playerAnswered: playerAnswered
          });
        }
      });
    }
    
    this.sendNetworkBroadcastEvent(triviaResultsEvent, {
      question: serializableQuestion,
      correctAnswerIndex: correctAnswerIndex,
      answerCounts: actualAnswerCounts,
      scores: {}
    });
    
    
    // Show results without vote counts (just correct/incorrect indicators)
    this.showResultsBinding.set(true);
    this.isShowingResults = true;
    
    // Broadcast UI state update to show results
    this.sendNetworkBroadcastEvent(triviaUIStateEvent, {
      showConfig: false,
      showResults: true,
      showWaiting: false,
      showLeaderboard: false,
      showError: false
    });
    
    // After 5 seconds, check if this is the last question
    this.async.setTimeout(() => {
      // Check if game has ended before showing leaderboard
      if (!this.isRunning) {
        // Game has ended, don't show leaderboard
        return;
      }
      
      // Check if this is the last question - if so, end the game instead of showing leaderboard
      // We check if currentQuestionIndex + 1 equals the total length (since we're 0-indexed)
      if (this.currentQuestionIndex + 1 >= this.triviaQuestions.length) {
        this.endGame();
      } else {
        // Check if skip leaderboard modifier is enabled
        if (this.modifiers.powerUps) {
          // Process leaderboard data gracefully but skip showing it
          this.processLeaderboardWithoutDisplay();
        } else {
          // Show leaderboard as normal
          this.showLeaderboard();
        }
      }
    }, 5000);
  }

  private async showLeaderboard(): Promise<void> {
    // Hide results, show leaderboard
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showLeaderboardBinding.set(true);
    this.isShowingLeaderboard = true;
    
    // For Italian Brainrot quiz, clean up previous question image now that leaderboard is shown
    this.cleanupPreviousItalianBrainrotImage();
    
    // Broadcast UI state update to show leaderboard
    this.sendNetworkBroadcastEvent(triviaUIStateEvent, {
      showConfig: false,
      showResults: false,
      showWaiting: false,
      showLeaderboard: true,
      showError: false
    });
    
    // Generate real leaderboard data from actual players
    const realLeaderboard = await this.generateRealLeaderboard();
    this.leaderboardDataBinding.set(realLeaderboard);
    
    // Send leaderboard data through the existing triviaResultsEvent
    if (!this.currentQuestion) {
      return;
    }
    
    const serializableQuestion: SerializableQuestion = {
      id: this.currentQuestion.id,
      question: this.currentQuestion.question,
      category: this.currentQuestion.category || 'General',
      difficulty: this.currentQuestion.difficulty || 'easy',
      image: this.currentQuestion.image, // Include the image field
      answers: this.currentQuestion.answers
    };
    
    // Prepare leaderboard data for network event (without headshot which can't be serialized)
    const networkLeaderboardData = realLeaderboard.map(player => ({
      name: player.name,
      score: player.score,
      playerId: player.playerId
    }));
    
    this.sendNetworkBroadcastEvent(triviaResultsEvent, {
      question: serializableQuestion,
      correctAnswerIndex: this.currentQuestion.answers.findIndex((a: any) => a.correct),
      answerCounts: [],
      scores: {},
      showLeaderboard: true,
      leaderboardData: networkLeaderboardData
    });
    
    // No auto-advance - wait for host to press next button
  }

  private async generateRealLeaderboard(): Promise<Array<{name: string, score: number, playerId: string, headshotImageSource?: ImageSource}>> {
    // Get actual players in the world
    const currentPlayers = this.world.getPlayers();
    const leaderboard: Array<{name: string, score: number, playerId: string, headshotImageSource?: ImageSource}> = [];
    
    // Create leaderboard entries for each real player using local game scores
    for (const player of currentPlayers) {
      const playerId = player.id.toString();
      if (this.playerManager.isPlayerInWorld(playerId)) {
        // Get local game score (current game points)
        const score = this.localPlayerScores.get(playerId) || 0;
        
        // Get player headshot using Social API
        let headshotImageSource: ImageSource | undefined;
        try {
          headshotImageSource = await Social.getAvatarImageSource(player, {
            type: AvatarImageType.HEADSHOT,
            highRes: true
          });
        } catch (error) {
          // Could not get headshot for player
        }
        
        leaderboard.push({
          name: player.name.get(),
          score: score,
          playerId: playerId,
          headshotImageSource: headshotImageSource
        });
      }
    }

    // Sort by score descending
    return leaderboard.sort((a, b) => b.score - a.score);
  }

  private async processLeaderboardWithoutDisplay(): Promise<void> {
    // Process leaderboard data gracefully but don't show leaderboard UI
    // This ensures all the backend processes (scoring, data generation) still occur
    
    // For Italian Brainrot quiz, clean up previous question image
    this.cleanupPreviousItalianBrainrotImage();
    
    // Generate leaderboard data for scoring purposes (even though we won't show it)
    const realLeaderboard = await this.generateRealLeaderboard();
    this.leaderboardDataBinding.set(realLeaderboard);
    
    // Send results event with showLeaderboard: true to trigger TriviaPhone auto-advance logic
    if (!this.currentQuestion) {
      return;
    }
    
    const serializableQuestion: SerializableQuestion = {
      id: this.currentQuestion.id,
      question: this.currentQuestion.question,
      category: this.currentQuestion.category || 'General',
      difficulty: this.currentQuestion.difficulty || 'easy',
      image: this.currentQuestion.image,
      answers: this.currentQuestion.answers
    };
    
    // Prepare leaderboard data for network event
    const networkLeaderboardData = realLeaderboard.map(player => ({
      name: player.name,
      score: player.score,
      playerId: player.playerId
    }));
    
    // Send the results event that will trigger TriviaPhone's skip leaderboard logic
    this.sendNetworkBroadcastEvent(triviaResultsEvent, {
      question: serializableQuestion,
      correctAnswerIndex: this.currentQuestion.answers.findIndex((a: any) => a.correct),
      answerCounts: [],
      scores: {},
      showLeaderboard: true, // This triggers the auto-advance logic in TriviaPhone
      leaderboardData: networkLeaderboardData
    });
    
    // Don't set leaderboard UI bindings or broadcast leaderboard UI state
    // The TriviaPhone will handle skipping the leaderboard display and auto-advancing
  }

  private advanceToNextQuestion(): void {
    
    // Hide leaderboard
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    
    // Clear any previous results state
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showWaitingBinding.set(false);
    
    // Reset players answered tracking for new question using PlayerManager
    this.playerManager.clearAnsweredPlayers();
    
    // Move to next question
    this.currentQuestionIndex++;
    
    // Show the next question (this will send network event to all TriviaPhones)
    this.showNextQuestion();
  }

  private async onSettingsUpdate(eventData: { hostId: string, settings: { numberOfQuestions: number, category: string, difficulty: string, timeLimit: number, timerType: string, difficultyType: string, isLocked: boolean, modifiers: { autoAdvance: boolean, powerUps: boolean, bonusRounds: boolean } } }): Promise<void> {
    
    // Update the game configuration immediately when settings change in TriviaPhone
    this.gameConfig = {
      timeLimit: eventData.settings.timeLimit,
      autoAdvance: eventData.settings.modifiers.autoAdvance,
      numQuestions: eventData.settings.numberOfQuestions,
      category: eventData.settings.category.toLowerCase(),
      difficulty: eventData.settings.difficulty
    };
    
    // Update the question count binding for the pre-game UI
    this.questionCountBinding.set(this.gameConfig.numQuestions.toString());
    
    // Store modifier settings for icon visibility
    this.timerType = eventData.settings.timerType;
    this.difficultyType = eventData.settings.difficultyType;
    this.isLocked = eventData.settings.isLocked;
    this.modifiers = eventData.settings.modifiers;
    
    // Update timer visibility based on timer type
    this.showTimerBinding.set(this.shouldShowTimer());
    
    // Update the binding to reflect changes in the UI
    this.gameConfigBinding.set(this.gameConfig);
    this.updateIconVisibility();
    
    // Update category name display in pre-game screen
    this.updateCategoryDisplay(eventData.settings.category);
    
    // Update lock icon if we're in config screen (lock state may have changed)
    if (this.isShowingConfigScreen) {
      this.updateLockIcon('config');
    }
    
    // Update questions based on new category and difficulty (now async with lazy loading)
    await this.updateQuestionsForCategory(this.gameConfig.category, this.gameConfig.difficulty);
  }

  private updateCategoryDisplay(category: string): void {
    // Convert category internal name to display name for pre-game screen
    let displayName: string;
    switch (category) {
      case 'Italian Brainrot Quiz':
        displayName = 'Italian Brainrot';
        break;
      case 'General':
        displayName = 'General';
        break;
      case 'Geography':
        displayName = 'Geography';
        break;
      case 'History':
        displayName = 'History';
        break;
      case 'Science':
        displayName = 'Science';
        break;
      case 'Film':
        displayName = 'Film';
        break;
      case 'Music':
        displayName = 'Music';
        break;
      case 'Television':
        displayName = 'Television';
        break;
      case 'Video Games':
        displayName = 'Video Games';
        break;
      default:
        displayName = category; // Fallback to original category name
        break;
    }
    
    // Update the category name binding
    this.categoryNameBinding.set(displayName);
  }

  private updateIconVisibility(): void {
    // Update timer icon based on selected timer type
    let timerIconAsset: bigint;
    switch (this.timerType) {
      case 'slow':
        timerIconAsset = BigInt('1929373007796069'); // timer_off
        break;
      case 'normal':
        timerIconAsset = BigInt('2035737657163790'); // timer
        break;
      case 'fast':
        timerIconAsset = BigInt('1471075670874559'); // more_time
        break;
      default:
        timerIconAsset = BigInt('2035737657163790'); // default to normal
    }
    this.timerIconSourceBinding.set(ImageSource.fromTextureAsset(new hz.TextureAsset(timerIconAsset)));
    
    // Update difficulty icon based on selected difficulty type
    let difficultyIconAsset: bigint;
    switch (this.difficultyType) {
      case 'easy':
        difficultyIconAsset = BigInt('773002615685804'); // sentiment_satisfied
        break;
      case 'medium':
        difficultyIconAsset = BigInt('1167500291866690'); // sentiment_neutral
        break;
      case 'hard':
        difficultyIconAsset = BigInt('789632350092375'); // skull
        break;
      default:
        difficultyIconAsset = BigInt('1167500291866690'); // default to medium
    }
    this.difficultyIconSourceBinding.set(ImageSource.fromTextureAsset(new hz.TextureAsset(difficultyIconAsset)));
    
    // Left side icons are always fully visible (lock, difficulty, timer)
    this.leftIconOpacity[0].set(1.0); // Lock icon - always visible
    this.leftIconOpacity[1].set(1.0); // Difficulty icon - always visible  
    this.leftIconOpacity[2].set(1.0); // Timer icon - always visible
    
    // Right side modifiers control opacity (1.0 = enabled, 0.3 = disabled)
    this.rightIconOpacity[0].set(this.modifiers.autoAdvance ? 1.0 : 0.3);    // Autoplay
    this.rightIconOpacity[1].set(this.modifiers.bonusRounds ? 1.0 : 0.3);   // All Inclusive  
    this.rightIconOpacity[2].set(this.modifiers.powerUps ? 1.0 : 0.3);      // Bolt
  }

  private updateLockIcon(screenType: 'config' | 'question' | 'results' | 'leaderboard' | 'host-pregame' | 'participant-ready'): void {
    // Update icon based on screen type and current state
    let iconAsset: bigint;
    
    switch (screenType) {
      case 'config':
        // Game settings page: Show lock icon (locked/unlocked based on state)
        iconAsset = this.isLocked ? BigInt('667887239673613') : BigInt('1667289068007821'); // lock vs lock_open_right
        break;
      case 'question':
      case 'results':
      case 'leaderboard':
        // Question, results, and leaderboard screens: Show logout icon
        iconAsset = BigInt('1997295517705951'); // logout
        break;
      case 'host-pregame':
      case 'participant-ready':
        // Host pre-game and participant ready screens: Show lock icon (based on lock state)
        iconAsset = this.isLocked ? BigInt('667887239673613') : BigInt('1667289068007821'); // lock vs lock_open_right
        break;
      default:
        // Default fallback to lock icon
        iconAsset = this.isLocked ? BigInt('667887239673613') : BigInt('1667289068007821'); // lock vs lock_open_right
        break;
    }
    
    this.lockIconSourceBinding.set(ImageSource.fromTextureAsset(new hz.TextureAsset(iconAsset)));
  }

  private onHostChanged(eventData: { newHostId: string; oldHostId?: string }): void {
    
    // Update host information
    this.hostPlayerId = eventData.newHostId;
    this.hostPlayerIdBinding.set(this.hostPlayerId);
    
    // Update local player host status
    const localPlayer = this.world.getLocalPlayer();
    this.isLocalPlayerHost = localPlayer ? this.hostPlayerId === localPlayer.id.toString() : false;
    this.isLocalPlayerHostBinding.set(this.isLocalPlayerHost);
  }

  private onNextQuestionRequest(data: { playerId: string }): void {
    // Only allow the host to advance to the next question
    if (data.playerId === this.hostPlayerId) {
      this.advanceToNextQuestion();
    }
  }

  private onHostViewModeChanged(eventData: { viewMode: string, isHost: boolean }): void {
    // Only update icons for the host player
    if (eventData.isHost && this.world.getLocalPlayer().id.toString() === this.hostPlayerId) {
      // Update lock icon based on the host's current view mode
      if (eventData.viewMode === 'preGame') {
        // Host pre-game should show lock icon
        this.updateLockIcon('host-pregame');
      } else if (eventData.viewMode === 'gameSettings') {
        // Game settings should show lock/unlock toggle
        this.updateLockIcon('config');
      }
    }
  }

  private forceUIRefresh(): void {
    // Trigger UI update by incrementing the players update trigger
    // This forces the crown icon to update and show for the host
    this.updateTriggerCounter++;
    this.playersUpdateTrigger.set(this.updateTriggerCounter);
  }

  private detectHostPlayer(): void {
    const allPlayers = this.world.getPlayers();
    const localPlayer = this.world.getLocalPlayer();
    
    if (allPlayers.length === 0) {
      return;
    }

    // If no host is set yet, assign the player with the lowest ID as host
    if (!this.hostPlayerId) {
      // Sort players by ID and pick the first one (lowest ID)
      const sortedPlayers = allPlayers.sort((a, b) => {
        const idA = parseInt(a.id.toString());
        const idB = parseInt(b.id.toString());
        return idA - idB;
      });
      
      const newHost = sortedPlayers[0];
      this.hostPlayerId = newHost.id.toString();
      this.hostPlayerIdBinding.set(this.hostPlayerId);
      
      // Update local player host status
      this.isLocalPlayerHost = localPlayer ? this.hostPlayerId === localPlayer.id.toString() : false;
      this.isLocalPlayerHostBinding.set(this.isLocalPlayerHost);
      
      // Broadcast the host change to all clients
      this.sendNetworkBroadcastEvent(hostChangedEvent, {
        newHostId: this.hostPlayerId
      });
      
      // Force UI update to show crown icon for newly detected host
      this.forceUIRefresh();
    } else {
      // Update local player host status based on current host
      this.isLocalPlayerHost = localPlayer ? this.hostPlayerId === localPlayer.id.toString() : false;
      this.isLocalPlayerHostBinding.set(this.isLocalPlayerHost);
    }
  }

  private async handleStartGame(): Promise<void> {
    if (!this.isLocalPlayerHost) {
      return;
    }

    // Reset Italian Brainrot caching system for the new game
    this.cleanupPreviousItalianBrainrotImage();
    this.currentItalianBrainrotImageId = null;
    this.isCurrentlyItalianBrainrot = false;

    // Get selected category and difficulty from gameConfig
    const selectedCategory = this.gameConfig.category;
    const selectedDifficulty = this.gameConfig.difficulty;

    // Update questions based on selection (now async with lazy loading)
    await this.updateQuestionsForCategory(selectedCategory, selectedDifficulty);

    // Check if we have questions for the selected category
    if (this.triviaQuestions.length === 0) {
      this.showErrorScreen(`No questions available for "${selectedCategory}". Please check your category selection and ensure the data source is properly configured.`);
      return;
    }

    // ✅ Ultra-randomize questions using host player's time/date for completely unique order every game
    
    // Primary shuffle using current host time
    this.shuffleQuestions();
    
    // ✅ Additional delayed shuffles with slightly different host time entropy for extra randomization
    this.async.setTimeout(() => {
      this.shuffleQuestions();
    }, 5);
    
    this.async.setTimeout(() => {
      this.shuffleQuestions();
    }, 15);

    // Reset all player points to 0 for new game
    this.resetAllPlayerPoints();

    // Broadcast game start to all players
    this.sendNetworkBroadcastEvent(triviaGameStartEvent, {
      hostId: this.hostPlayerId!,
      config: this.gameConfig
    });

    // Hide config screen and start game locally
    this.showConfigBinding.set(false);
    this.updateLockIcon('question'); // Update icon for question screen
    this.showErrorBinding.set(false); // Hide any error screen

    // Apply current configuration
    this.timeRemaining = this.gameConfig.timeLimit;
    this.timerBinding.set(this.gameConfig.timeLimit.toString());

    // Start the trivia game
    this.startContinuousGame();
  }

  private async onGameStart(data: { hostId: string, config: any, questions?: any[] }): Promise<void> {
    // Store the host ID from the game start event
    this.hostPlayerId = data.hostId;
    this.hostPlayerIdBinding.set(this.hostPlayerId);
    
    // Update local player host status
    const localPlayer = this.world.getLocalPlayer();
    this.isLocalPlayerHost = localPlayer ? this.hostPlayerId === localPlayer.id.toString() : false;
    this.isLocalPlayerHostBinding.set(this.isLocalPlayerHost);
    
    // Update configuration
    this.gameConfig = data.config;
    this.gameConfigBinding.set(this.gameConfig);
    
    // Update the question count binding for the pre-game UI
    this.questionCountBinding.set(this.gameConfig.numQuestions.toString());

    // Use questions from TriviaPhone if provided, otherwise update questions based on the new configuration
    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      // Filter questions to only include those with 2 or 4 answer options
      this.triviaQuestions = data.questions.filter(q => {
        const answerCount = q.answers?.length || 0;
        return answerCount === 2 || answerCount === 4;
      });
    } else {
      // Update questions based on the new configuration (now async with lazy loading)
      await this.updateQuestionsForCategory(this.gameConfig.category, this.gameConfig.difficulty);
    }

    // Check if we have questions available - NO FALLBACKS
    if (this.triviaQuestions.length === 0) {
      this.showErrorScreen(`No questions available for "${this.gameConfig.category}". Please check your category selection and ensure the data source is properly configured.`);
      return; // Don't start the game
    }

    // Reset all player points for new game (non-host players)
    if (!this.isLocalPlayerHost) {
      this.resetAllPlayerPoints();
    }

    // Hide config screen
    this.showConfigBinding.set(false);
    this.updateLockIcon('question'); // Update icon for question screen

    // Apply configuration
    this.timeRemaining = this.gameConfig.timeLimit;
    this.timerBinding.set(this.gameConfig.timeLimit.toString());
    
    // Update the props to reflect the new time limit
    (this.props as any).questionTimeLimit = this.gameConfig.timeLimit;

    // Start the game if not already running
    if (!this.isRunning) {
      this.startContinuousGame();
    }
  }

  private updateGameConfig(newConfig: any): void {
    if (!this.isLocalPlayerHost) {
      return;
    }
    
    this.gameConfig = { ...this.gameConfig, ...newConfig };
    this.gameConfigBinding.set(this.gameConfig);
    
    // Update the question count binding for the pre-game UI
    this.questionCountBinding.set(this.gameConfig.numQuestions.toString());
  }

  private handleCategoryChange(category: string): void {
    this.gameConfig.category = category;
    this.selectedCategoryBinding.set(category);
    this.gameConfigBinding.set(this.gameConfig);
  }

  private showErrorScreen(message: string): void {
    this.errorMessageBinding.set(message);
    this.showErrorBinding.set(true);
    this.showConfigBinding.set(false);
    this.updateLockIcon('host-pregame'); // Error screen shows host pre-game state
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;

    // Broadcast UI state update to show error screen
    this.sendNetworkBroadcastEvent(triviaUIStateEvent, {
      showConfig: false,
      showResults: false,
      showWaiting: false,
      showLeaderboard: false,
      showError: true,
      errorMessage: message
    });
  }

  private hideErrorScreen(): void {
    this.showErrorBinding.set(false);
    this.showConfigBinding.set(true);
    this.updateLockIcon('config'); // Update icon for config screen

    // Broadcast UI state update to hide error and show config
    this.sendNetworkBroadcastEvent(triviaUIStateEvent, {
      showConfig: true,
      showResults: false,
      showWaiting: false,
      showLeaderboard: false,
      showError: false
    });
  }

  private startTimer(): void {
    this.stopTimer(); // Clear any existing timer

    // Only start the actual countdown timer if timer is enabled
    if (!this.shouldShowTimer()) {
      // For no timer modifier, don't start countdown and don't update timer text
      return;
    }

    // All clients should run the timer locally for immediate updates
    this.timerInterval = this.async.setInterval(() => {
      this.timeRemaining--;

      // Only the host should broadcast timer updates to avoid conflicts
      if (this.isLocalPlayerHost) {
        // Broadcast timer update to all clients
        this.sendNetworkBroadcastEvent(triviaTimerUpdateEvent, {
          timeRemaining: this.timeRemaining,
          questionIndex: this.currentQuestionIndex
        });
      }

      this.timerBinding.set(this.timeRemaining.toString());

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        // Set timer to 0 for immediate visual feedback
        this.timeRemaining = 0;
        this.timerBinding.set("0");
        
        // All clients should show results when timer reaches 0
        this.showQuestionResults();
        
        // Only the host should broadcast timer end to sync with other clients
        if (this.isLocalPlayerHost) {
          this.sendNetworkBroadcastEvent(triviaTimerEndEvent, {
            questionIndex: this.currentQuestionIndex
          });
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      this.async.clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  initializeUI() {
    return View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent', // Fully transparent background
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center'
      },
      children: [
        // Main game container with 16:9 aspect ratio
        View({
          style: {
            width: '100vw', // Use full viewport width
            aspectRatio: 16/9, // 16:9 aspect ratio
            backgroundColor: (this.props as any).backgroundColor,
            position: 'relative',
            overflow: 'hidden',
            shadowColor: 'black',
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: [0, 6]
          },
          children: [
            // Configuration Screen (shows initially)
            UINode.if(
              this.showConfigBinding,
              View({
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16
                },
                children: [
                  // Background image container for proper centering
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    children: Image({
                      source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1142972504392965'))),
                      style: {
                        width: '100%',
                        height: '100%',
                        resizeMode: 'contain'
                      }
                    })
                  }),
                  // Header
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0, // Fill width from left edge
                      right: 0, // Fill width to right edge
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 8, // 8px padding for height that hugs the text
                    },
                    children: Text({
                      text: this.categoryNameBinding,
                      style: {
                        fontSize: 20, // Scaled down from 24
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: 'center'
                      }
                    })
                  }),

                  // Waiting for host message
                  View({
                    style: {
                      position: 'absolute',
                      bottom: 0, // Moved down further (10 pixels more)
                      left: '25%', // Centered with equal margins
                      right: '25%', // Centered with equal margins
                      height: 65,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                    },
                    children: Text({
                      text: 'Waiting for host...',
                      style: {
                        fontSize: 18, // Scaled down from 20
                        fontWeight: 'bold',
                        color: 'white',
                        textAlign: 'center'
                      }
                    })
                  }),

                  // Players avatars grid
                  View({
                    style: {
                      position: 'absolute',
                      top: 40, // Moved up 8 pixels from 48
                      left: '10%', // Reduced margin to make container wider
                      right: '10%', // Reduced margin to make container wider
                      bottom: '20%', // Leave more space for the waiting message
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      alignContent: 'center', // Center the wrapped lines vertically
                      paddingHorizontal: 10,
                    },
                    children: this.createStaticPlayersComponents()
                  }),

                  // Left side icons (Lock, Sentiment Neutral, Timer)
                  View({
                    style: {
                      position: 'absolute',
                      left: 0, // Start at left edge
                      top: 0, // Fill from top of viewport
                      bottom: 0, // Fill to bottom of viewport
                      width: 80, // Slightly wider for better spacing
                      flexDirection: 'column',
                      justifyContent: 'space-between', // Distribute icons evenly across full height
                      alignItems: 'center',
                      paddingVertical: 72, // Increased from 16 to 50 for more top/bottom margins
                    },
                    children: [
                      // Lock/AR face icon (dynamic based on screen type)
                      View({
                        style: {
                        },
                        children: Text({
                          text: this.questionCountBinding,
                          style: {
                            fontSize: 24,
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center'
                          }
                        })
                      }),
                      // Timer icon (dynamic based on selected timer type)
                      View({
                        style: {
                        },
                        children: Image({
                          source: this.timerIconSourceBinding,
                          style: {
                            width: 36, // Scaled up from 32
                            height: 36, // Scaled up from 32
                            opacity: this.leftIconOpacity[2]
                          }
                        })
                      }),
                      // Difficulty icon (dynamic based on selected difficulty)
                      View({
                        style: {
                        },
                        children: Image({
                          source: this.difficultyIconSourceBinding,
                          style: {
                            width: 36, // Scaled up from 32
                            height: 36, // Scaled up from 32
                            opacity: this.leftIconOpacity[1]
                          }
                        })
                      })
                    ]
                  }),

                  // Right side icons (Autoplay, All Inclusive, Bolt)
                  View({
                    style: {
                      position: 'absolute',
                      right: 0, // Start at right edge
                      top: 0, // Fill from top of viewport
                      bottom: 0, // Fill to bottom of viewport
                      width: 80, // Slightly wider for better spacing
                      flexDirection: 'column',
                      justifyContent: 'space-between', // Distribute icons evenly across full height
                      alignItems: 'center',
                      paddingVertical: 72, // Increased from 16 to 72 to match left side
                    },
                    children: [
                      // Autoplay icon (modifier: autoAdvance)
                      View({
                        style: {
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3145261165647718'))),
                          style: {
                            width: 32, // Scaled down from 48 by 4px
                            height: 32, // Scaled down from 48 by 4px
                            opacity: this.rightIconOpacity[0]
                          }
                        })
                      }),
                      // Bolt icon (modifier: powerUps) - Skip Leaderboard
                      View({
                        style: {
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1320579906276560'))),
                          style: {
                            width: 36, // Scaled down from 48 by 4px
                            height: 36, // Scaled down from 48 by 4px
                            opacity: this.rightIconOpacity[2]
                          }
                        })
                      }),
                      // All Inclusive icon (modifier: bonusRounds) - Infinite Questions
                      View({
                        style: {
                        },
                        children: Image({
                          source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3148012692041551'))),
                          style: {
                            width: 36, // Scaled down from 48 by 4px
                            height: 36, // Scaled down from 48 by 4px
                            opacity: this.rightIconOpacity[1]
                          }
                        })
                      })
                    ]
                  }),


                ]
              })
            ),

            // Game UI (shows when game is running)
            UINode.if(
              this.showConfigBinding.derive(show => !show),
              View({
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                },
                children: [
                  // Question text - conditional positioning based on image presence
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId === null || imageId === ""),
                    // No image - center the question (2-answer questions)
                    UINode.if(
                      this.answerCountTracking.derive(count => count === 2),
                      View({
                        style: {
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '5%',
                          paddingBottom: '25%', // Leave space for answer buttons
                        },
                        children: [
                          // Timer container - flex to fill left space
                          View({
                            style: {
                              flex: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                                children: [
                                  // Timer with alarm icon - always show icon, conditionally show text
                                  View({
                                    style: {
                                      position: 'relative',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    },
                                    children: [
                                      // Alarm icon background - always visible
                                      Image({
                                        source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1209829437577245'))), // alarm icon
                                        style: {
                                          width: 45,
                                          height: 45,
                                          tintColor: '#000000',
                                          marginTop: -3
                                        }
                                      }),
                                      // Timer text overlaid in center - only show when timer is enabled
                                      UINode.if(
                                        this.showTimerBinding,
                                        View({
                                          style: {
                                            position: 'absolute',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.timerBinding,
                                            style: {
                                              fontSize: 14,
                                              fontWeight: 'bold',
                                              color: '#000000'
                                            }
                                          })
                                        })
                                      )
                                    ]
                                  })
                                ]
                              }),

                              // Question text in the middle
                              View({
                                style: {
                                  backgroundColor: 'white',
                                  borderRadius: 6,
                                  shadowColor: 'black',
                                  shadowOpacity: 0.15,
                                  shadowRadius: 6,
                                  shadowOffset: [0, 2],
                                  paddingHorizontal: 16,
                                  paddingVertical: 16,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                },
                                children: [
                                  // Question text
                                  Text({
                                    text: this.questionBinding,
                                    numberOfLines: 5,
                                    style: {
                                      fontSize: 16,
                                      fontWeight: '500',
                                      color: 'black',
                                      textAlign: 'center',
                                      lineHeight: 18
                                    }
                                  })
                                ]
                              }),

                              // Answer count container - flex to fill right space
                              View({
                                style: {
                                  flex: 1,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                },
                                children: [
                                  // Answer count on the right
                                  View({
                                    style: {
                                      alignItems: 'center',
                                    },
                                    children: [
                                      Text({
                                        text: this.answerCountBinding,
                                        style: {
                                          fontSize: 16,
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      }),
                                      Text({
                                        text: 'Answers',
                                        style: {
                                          fontSize: 10,
                                          color: '#6B7280'
                                        }
                                      })
                                    ]
                                  })
                                ]
                              })
                        ]
                      })
                    )
                  ),

                  // No image - center the question (2-answer questions)
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId === null || imageId === ""),
                    UINode.if(
                      this.answerCountTracking.derive(count => count === 2),
                      View({
                        style: {
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '5%',
                          paddingBottom: '25%', // Leave space for answer buttons
                        },
                        children: [
                          // Timer container - flex to fill left space
                          View({
                            style: {
                              flex: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                                children: [
                                  // Timer with alarm icon - always show icon, conditionally show text
                                  View({
                                    style: {
                                      position: 'relative',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    },
                                    children: [
                                      // Alarm icon background - always visible
                                      Image({
                                        source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1209829437577245'))), // alarm icon
                                        style: {
                                          width: 45,
                                          height: 45,
                                          tintColor: '#000000',
                                          marginTop: -3
                                        }
                                      }),
                                      // Timer text overlaid in center - only show when timer is enabled
                                      UINode.if(
                                        this.showTimerBinding,
                                        View({
                                          style: {
                                            position: 'absolute',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.timerBinding,
                                            style: {
                                              fontSize: 14,
                                              fontWeight: 'bold',
                                              color: '#000000'
                                            }
                                          })
                                        })
                                      )
                                    ]
                                  })
                                ]
                              }),

                              // Question text in the middle
                              View({
                                style: {
                                  backgroundColor: 'white',
                                  borderRadius: 6,
                                  shadowColor: 'black',
                                  shadowOpacity: 0.15,
                                  shadowRadius: 6,
                                  shadowOffset: [0, 2],
                                  paddingTop: 12,
                                  paddingBottom: 12,
                                  paddingLeft: 12,
                                  paddingRight: 12,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  alignSelf: 'center',
                                  maxWidth: '60%',
                                },
                                children: [
                                  // Question text
                                  Text({
                                    text: this.questionBinding,
                                    numberOfLines: 5,
                                    style: {
                                      fontSize: 16,
                                      fontWeight: '500',
                                      color: 'black',
                                      textAlign: 'center',
                                      lineHeight: 18
                                    }
                                  })
                                ]
                              }),

                              // Answer count container - flex to fill right space
                              View({
                                style: {
                                  flex: 1,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                },
                                children: [
                                  // Answer count on the right
                                  View({
                                    style: {
                                      alignItems: 'center',
                                    },
                                    children: [
                                      Text({
                                        text: this.answerCountBinding,
                                        style: {
                                          fontSize: 20, // Increased from 16 to 20
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      }),
                                      Text({
                                        text: 'Answers',
                                        style: {
                                          fontSize: 12, // Increased from 10 to 12
                                          color: '#6B7280'
                                        }
                                      })
                                    ]
                                  })
                                ]
                              })
                        ]
                      })
                    )
                  ),

                  // No image - center the question (3+ answer questions)
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId === null || imageId === ""),
                    UINode.if(
                      this.answerCountTracking.derive(count => count !== 2),
                      View({
                        style: {
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '5%',
                          paddingBottom: '25%', // Leave space for answer buttons
                        },
                        children: [
                          // Timer container - flex to fill left space
                          View({
                            style: {
                              flex: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                                children: [
                                  // Timer with alarm icon - always show icon, conditionally show text
                                  View({
                                    style: {
                                      position: 'relative',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    },
                                    children: [
                                      // Alarm icon background - always visible
                                      Image({
                                        source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1209829437577245'))), // alarm icon
                                        style: {
                                          width: 45,
                                          height: 45,
                                          tintColor: '#000000',
                                          marginTop: -3
                                        }
                                      }),
                                      // Timer text overlaid in center - only show when timer is enabled
                                      UINode.if(
                                        this.showTimerBinding,
                                        View({
                                          style: {
                                            position: 'absolute',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.timerBinding,
                                            style: {
                                              fontSize: 14,
                                              fontWeight: 'bold',
                                              color: '#000000'
                                            }
                                          })
                                        })
                                      )
                                    ]
                                  })
                                ]
                              }),

                              // Question text in the middle
                              View({
                                style: {
                                  backgroundColor: 'white',
                                  borderRadius: 6,
                                  shadowColor: 'black',
                                  shadowOpacity: 0.15,
                                  shadowRadius: 6,
                                  shadowOffset: [0, 2],
                                  paddingTop: 12,
                                  paddingBottom: 12,
                                  paddingLeft: 12,
                                  paddingRight: 12,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  alignSelf: 'center',
                                  maxWidth: '60%',
                                },
                                children: [
                                  // Question text
                                  Text({
                                    text: this.questionBinding,
                                    numberOfLines: 5,
                                    style: {
                                      fontSize: 16,
                                      fontWeight: '500',
                                      color: 'black',
                                      textAlign: 'center',
                                      lineHeight: 18
                                    }
                                  })
                                ]
                              }),

                              // Answer count container - flex to fill right space
                              View({
                                style: {
                                  flex: 1,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                },
                                children: [
                                  // Answer count on the right
                                  View({
                                    style: {
                                      alignItems: 'center',
                                    },
                                    children: [
                                      Text({
                                        text: this.answerCountBinding,
                                        style: {
                                          fontSize: 20, // Increased from 16 to 20
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      }),
                                      Text({
                                        text: 'Answers',
                                        style: {
                                          fontSize: 12, // Increased from 10 to 12
                                          color: '#6B7280'
                                        }
                                      })
                                    ]
                                  })
                                ]
                              })
                        ]
                      })
                    )
                  ),

                  // Question text with image - positioned at top
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId !== null && imageId !== ""),
                    View({
                      style: {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0, // Fill available space, answer section will overlay at bottom
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'stretch',
                        paddingTop: '1%',
                        paddingBottom: this.answerCountTracking.derive(count => count === 2 ? 52 : 100) as any, // Reduce height for 2-answer questions (100 - 48px for unused button + gap)
                      },
                      children: [
                        // Question text only - centered at top (no timer/answer count here for image questions)
                        View({
                          style: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 58, // Increased height to accommodate padding (50 + 8)
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center', // Center the question text
                            width: '100%',
                            flexShrink: 0, // Prevent shrinking
                            paddingTop: 4, // Added top padding for better balance
                            paddingBottom: 4, // Reduced bottom padding from 8 to 4
                          },
                          children: [
                            // Question text in the middle (centered)
                            View({
                              style: {
                                backgroundColor: 'white',
                                borderRadius: 6,
                                shadowColor: 'black',
                                shadowOpacity: 0.15,
                                shadowRadius: 6,
                                shadowOffset: [0, 2],
                                paddingTop: 12,
                                paddingBottom: 12,
                                paddingLeft: 12,
                                paddingRight: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                maxWidth: '90%', // Increased since we removed timer and answer count from question text box
                              },
                              children: [
                                // Question text
                                Text({
                                  text: this.questionBinding,
                                  numberOfLines: 2,
                                  style: {
                                    fontSize: 14,
                                    fontWeight: '500',
                                    color: 'black',
                                    textAlign: 'center',
                                    lineHeight: 18
                                  }
                                })
                              ]
                            })
                          ]
                        }),

                        // Question image container with timer on left, image in middle, answer count on right
                        View({
                          style: {
                            position: 'absolute',
                            top: 58, // Start exactly at the bottom of the blue header container (58px height)
                            left: 0,
                            right: 0,
                            bottom: this.answerCountTracking.derive(count => count === 2 ? 62 : 110) as any, // Stop above the green answer container (110px height, reduced by 48px for 2-answer questions)
                            flexDirection: 'row', // Horizontal layout: timer | image | answer count
                            alignItems: 'center',
                          },
                          children: [
                            // Timer container on the left
                            View({
                              style: {
                                flex: 1, // Equal space with answer count container
                                height: '100%', // Fill the full height of the parent container
                                alignItems: 'center',
                                justifyContent: 'center',
                              },
                              children: [
                                // Timer with alarm icon - always show icon, conditionally show text
                                View({
                                  style: {
                                    position: 'relative',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  },
                                  children: [
                                    // Alarm icon background - always visible
                                    Image({
                                      source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1209829437577245'))), // alarm icon
                                      style: {
                                        width: 45,
                                        height: 45,
                                        tintColor: '#000000',
                                        marginTop: -3
                                      }
                                    }),
                                    // Timer text overlaid in center - only show when timer is enabled
                                    UINode.if(
                                      this.showTimerBinding,
                                      View({
                                        style: {
                                          position: 'absolute',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        },
                                        children: Text({
                                          text: this.timerBinding,
                                          style: {
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            color: '#000000'
                                          }
                                        })
                                      })
                                    )
                                  ]
                                })
                              ]
                            }),

                            // Image container in the middle
                            View({
                              style: {
                                width: 'auto', // Let container size itself to hug the image
                                maxWidth: '60%', // Prevent it from getting too wide
                                height: '100%', // Fill the full height of the parent container
                                alignItems: 'center',
                                justifyContent: 'center',
                              },
                              children: [
                                Image({
                                  source: this.questionImageBinding.derive(imageId => {
                                    if (!imageId) return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                                    const textureId = this.getTextureIdForImage(imageId);
                                    if (textureId) {
                                      try {
                                        const bigIntId = BigInt(textureId);
                                        return ImageSource.fromTextureAsset(new hz.TextureAsset(bigIntId));
                                      } catch (error) {
                                        return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                                      }
                                    }
                                    return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                                  }),
                                  style: {
                                    width: '100%', // Fill the full width of the container
                                    height: '100%', // Fill the full height of the container
                                    aspectRatio: 1.5, // Maintain 3:2 aspect ratio
                                    borderRadius: 8,
                                    alignSelf: 'center'
                                  }
                                })
                              ]
                            }),

                            // Answer count container on the right
                            View({
                              style: {
                                flex: 1, // Equal space with timer container
                                height: '100%', // Fill the full height of the parent container
                                alignItems: 'center',
                                justifyContent: 'center',
                              },
                              children: [
                                View({
                                  style: {
                                    alignItems: 'center',
                                  },
                                  children: [
                                    Text({
                                      text: this.answerCountBinding,
                                      style: {
                                        fontSize: 20, // Increased from 16 to 20
                                        fontWeight: 'bold',
                                        color: '#1F2937'
                                      }
                                    }),
                                    Text({
                                      text: 'Answers',
                                      style: {
                                        fontSize: 12, // Increased from 10 to 12
                                        color: '#6B7280'
                                      }
                                    })
                                  ]
                                })
                              ]
                            })
                          ]
                        })
                      ]
                    })
                  ),

                  // Answer options grid - anchored to bottom of game screen
                  View({
                    style: {
                      position: 'absolute',
                      bottom: 0, // Flush with bottom of red container
                      left: 0,
                      right: 0,
                      height: 110, // Fixed height for consistent 4-option layout
                      paddingHorizontal: 8, // Reduced from 16px to 8px for more button space
                      paddingTop: 5,
                      paddingBottom: 8, // Reduced from 16px to 8px for more button space
                    },
                    children: [
                      // Dynamic layout based on number of answers
                      UINode.if(
                        this.answerCountTracking.derive(count => count > 0),
                        View({
                          style: {
                            width: '100%',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'center'
                          },
                          children: [
                            // Always show 4 slots - for 2-answer questions, use bottom 2 slots
                            // Answer 0 (Red/Triangle) - Option 1 - show answer 0 only if there are 3+ answers
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginRight: 6,
                                marginBottom: 6,
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count > 2),
                                this.createAnswerButton(0, '#DC2626', '2085541485520283'),
                                this.createBlankButton()
                              )
                            }),

                            // Answer 1 (Blue/Star) - Option 2 - show answer 1 only if there are 4+ answers
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginBottom: 6,
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count > 3),
                                this.createAnswerButton(1, '#2563EB', '1317550153280256'),
                                this.createBlankButton()
                              )
                            }),

                            // Answer 2 (Red Triangle for 2-options, Yellow Circle for 3+) - Option 3 - show answer 0 for 2-answer questions, answer 2 for 3+ answer questions
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginRight: 6,
                                marginBottom: 6,
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count === 2),
                                // For 2-answer questions: show answer 0 in position 3 with red triangle
                                UINode.if(
                                  this.answerTexts[2].derive(text => text !== ''),
                                  this.createAnswerButton(2, '#DC2626', '2085541485520283'),
                                  this.createBlankButton()
                                ),
                                // For 3+ answer questions: show answer 2 in position 3 with yellow circle
                                UINode.if(
                                  this.answerTexts[2].derive(text => text !== ''),
                                  this.createAnswerButton(2, '#EAB308', '1247573280476332'),
                                  this.createBlankButton()
                                )
                              )
                            }),

                            // Answer 3 (Blue Square for 2-options, Green Star for 3+) - Option 4 - show answer 1 for 2-answer questions, answer 3 for 3+ answer questions
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginBottom: 6,
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count === 2),
                                // For 2-answer questions: show answer 1 in position 4 with blue square
                                UINode.if(
                                  this.answerTexts[3].derive(text => text !== ''),
                                  this.createAnswerButton(3, '#2563EB', '1317550153280256'),
                                  this.createBlankButton()
                                ),
                                // For 3+ answer questions: show answer 3 in position 4 with green star
                                UINode.if(
                                  this.answerTexts[3].derive(text => text !== ''),
                                  this.createAnswerButton(3, '#16A34A', '2403112933423824'),
                                  this.createBlankButton()
                                )
                              )
                            })
                          ]
                        })
                      )
                    ]
                  }),

                  // Waiting for Other Players overlay
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      display: this.showWaitingBinding.derive(show => show ? 'flex' : 'none')
                    },
                    children: View({
                      style: {
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 20,
                        alignItems: 'center',
                        maxWidth: '60%',
                        shadowColor: 'black',
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        shadowOffset: [0, 4],
                      },
                      children: [
                        Text({
                          text: ' Other Players...',
                          style: {
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: '#1F2937',
                            marginBottom: 8,
                            textAlign: 'center'
                          }
                        }),
                        Text({
                          text: 'Please wait while other players submit their answers',
                          style: {
                            fontSize: 12,
                            color: '#6B7280',
                            textAlign: 'center'
                          }
                        })
                      ]
                    })
                  }),

                  // Leaderboard overlay
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#F3F4F6',
                      display: this.showLeaderboardBinding.derive(show => show ? 'flex' : 'none')
                    },
                    children: [
                      // Background image for leaderboard
                      Image({
                        source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2770757216446813'))),
                        style: {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: '100%',
                          height: '100%',
                          resizeMode: 'cover',
                          zIndex: -1
                        }
                      }),
                      // Main content container
                      View({
                        style: {
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 32,
                          paddingVertical: 20,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0
                        },
                        children: [
                          // Header - "Leaderboard" or "Game Over!"
                          View({
                            style: {
                              backgroundColor: '#191919',
                              borderRadius: 8,
                              paddingHorizontal: 9,
                              paddingVertical: 9,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 12
                            },
                            children: Text({
                              text: this.showGameOverBinding.derive(isGameOver => isGameOver ? 'Game Complete!' : 'Leaderboard'),
                              style: {
                                fontSize: 21,
                                fontWeight: 'bold',
                                color: '#ffffff',
                                textAlign: 'center'
                              }
                            })
                          }),

                          // Player Entries
                          View({
                            style: {
                              width: '100%'
                            },
                            children: [
                              // First Place
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 0),
                                View({
                                  style: {
                                    backgroundColor: '#191919',
                                    height: 56,
                                    borderRadius: 10,
                                    paddingHorizontal: 13,
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 7
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38,
                                            height: 25,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10
                                          },
                                          children: Text({
                                            text: '1',
                                            style: {
                                              fontSize: 22,
                                              fontWeight: 'bold',
                                              color: '#ffffff'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42,
                                            height: 42,
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 0 && players[0].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 0 && players[0].headshotImageSource ? players[0].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42,
                                                  height: 42,
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 0 && !players[0].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 0 ? players[0].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13,
                                                  fontWeight: 'bold',
                                                  color: '#ffffff'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 0 ? players[0].name : ''
                                            ),
                                            style: {
                                              fontSize: 17,
                                              fontWeight: 'bold',
                                              color: '#ffffff',
                                              textAlign: 'left'
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 0 ? players[0].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17,
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              ),

                              // Second Place
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 1),
                                View({
                                  style: {
                                    backgroundColor: '#191919',
                                    height: 56,
                                    borderRadius: 10,
                                    paddingHorizontal: 13,
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 7
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38,
                                            height: 25,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10
                                          },
                                          children: Text({
                                            text: '2',
                                            style: {
                                              fontSize: 22,
                                              fontWeight: 'bold',
                                              color: '#ffffff'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42,
                                            height: 42,
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 1 && players[1].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 1 && players[1].headshotImageSource ? players[1].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42,
                                                  height: 42,
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 1 && !players[1].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 1 ? players[1].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13,
                                                  fontWeight: 'bold',
                                                  color: '#ffffff'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 1 ? players[1].name : ''
                                            ),
                                            style: {
                                              fontSize: 17,
                                              fontWeight: 'bold',
                                              color: '#ffffff',
                                              textAlign: 'left'
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 1 ? players[1].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17,
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              ),

                              // Third Place
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 2),
                                View({
                                  style: {
                                    backgroundColor: '#191919',
                                    height: 56,
                                    borderRadius: 10,
                                    paddingHorizontal: 13,
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38,
                                            height: 25,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10
                                          },
                                          children: Text({
                                            text: '3',
                                            style: {
                                              fontSize: 22,
                                              fontWeight: 'bold',
                                              color: '#ffffff'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42,
                                            height: 42,
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 2 && players[2].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 2 && players[2].headshotImageSource ? players[2].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42,
                                                  height: 42,
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 2 && !players[2].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 2 ? players[2].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13,
                                                  fontWeight: 'bold',
                                                  color: '#ffffff'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 2 ? players[2].name : ''
                                            ),
                                            style: {
                                              fontSize: 17,
                                              fontWeight: 'bold',
                                              color: '#ffffff',
                                              textAlign: 'left'
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 2 ? players[2].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17,
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              )
                            ]
                          })
                        ]
                      })
                    ]
                  }),

                  // Game Over Screen - Now identical to Leaderboard screen
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#F3F4F6',
                      display: this.showGameOverBinding.derive(show => show ? 'flex' : 'none')
                    },
                    children: [
                      // Background image for leaderboard
                      Image({
                        source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2770757216446813'))),
                        style: {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          width: '100%',
                          height: '100%',
                          resizeMode: 'cover',
                          zIndex: -1
                        }
                      }),
                      // Main content container
                      View({
                        style: {
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 32,
                          paddingVertical: 20,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0
                        },
                        children: [
                          // Header - "Leaderboard" or "Game Over!"
                          View({
                            style: {
                              backgroundColor: '#191919',
                              borderRadius: 8,
                              paddingHorizontal: 9,
                              paddingVertical: 9,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 12
                            },
                            children: Text({
                              text: this.showGameOverBinding.derive(isGameOver => isGameOver ? 'Game Complete!' : 'Leaderboard'),
                              style: {
                                fontSize: 21,
                                fontWeight: 'bold',
                                color: '#ffffff',
                                textAlign: 'center'
                              }
                            })
                          }),

                          // Player Entries
                          View({
                            style: {
                              width: '100%'
                            },
                            children: [
                              // First Place
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 0),
                                View({
                                  style: {
                                    backgroundColor: '#191919',
                                    height: 56,
                                    borderRadius: 10,
                                    paddingHorizontal: 13,
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 7
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38,
                                            height: 25,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10
                                          },
                                          children: Text({
                                            text: '1',
                                            style: {
                                              fontSize: 22,
                                              fontWeight: 'bold',
                                              color: '#ffffff'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42,
                                            height: 42,
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 0 && players[0].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 0 && players[0].headshotImageSource ? players[0].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42,
                                                  height: 42,
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 0 && !players[0].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 0 ? players[0].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13,
                                                  fontWeight: 'bold',
                                                  color: '#ffffff'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 0 ? players[0].name : ''
                                            ),
                                            style: {
                                              fontSize: 17,
                                              fontWeight: 'bold',
                                              color: '#ffffff',
                                              textAlign: 'left'
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 0 ? players[0].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17,
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              ),

                              // Second Place
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 1),
                                View({
                                  style: {
                                    backgroundColor: '#191919',
                                    height: 56,
                                    borderRadius: 10,
                                    paddingHorizontal: 13,
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 7
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38,
                                            height: 25,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10
                                          },
                                          children: Text({
                                            text: '2',
                                            style: {
                                              fontSize: 22,
                                              fontWeight: 'bold',
                                              color: '#ffffff'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42,
                                            height: 42,
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 1 && players[1].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 1 && players[1].headshotImageSource ? players[1].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42,
                                                  height: 42,
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 1 && !players[1].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 1 ? players[1].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13,
                                                  fontWeight: 'bold',
                                                  color: '#ffffff'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 1 ? players[1].name : ''
                                            ),
                                            style: {
                                              fontSize: 17,
                                              fontWeight: 'bold',
                                              color: '#ffffff',
                                              textAlign: 'left'
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 1 ? players[1].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17,
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              ),

                              // Third Place
                              UINode.if(
                                this.leaderboardDataBinding.derive(players => players.length > 2),
                                View({
                                  style: {
                                    backgroundColor: '#191919',
                                    height: 56,
                                    borderRadius: 10,
                                    paddingHorizontal: 13,
                                    paddingVertical: 0,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  },
                                  children: [
                                    View({
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1
                                      },
                                      children: [
                                        // Ranking number
                                        View({
                                          style: {
                                            width: 38,
                                            height: 25,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10
                                          },
                                          children: Text({
                                            text: '3',
                                            style: {
                                              fontSize: 22,
                                              fontWeight: 'bold',
                                              color: '#ffffff'
                                            }
                                          })
                                        }),
                                        // Avatar
                                        View({
                                          style: {
                                            width: 42,
                                            height: 42,
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 10,
                                            overflow: 'hidden'
                                          },
                                          children: [
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 2 && players[2].headshotImageSource
                                              ),
                                              Image({
                                                source: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 2 && players[2].headshotImageSource ? players[2].headshotImageSource : null
                                                ),
                                                style: {
                                                  width: 42,
                                                  height: 42,
                                                  borderRadius: 8
                                                }
                                              })
                                            ),
                                            UINode.if(
                                              this.leaderboardDataBinding.derive(players =>
                                                players.length > 2 && !players[2].headshotImageSource
                                              ),
                                              Text({
                                                text: this.leaderboardDataBinding.derive(players =>
                                                  players.length > 2 ? players[2].name.charAt(0).toUpperCase() : ''
                                                ),
                                                style: {
                                                  fontSize: 13,
                                                  fontWeight: 'bold',
                                                  color: '#ffffff'
                                                }
                                              })
                                            )
                                          ]
                                        }),
                                        // Player name
                                        View({
                                          style: {
                                            flex: 1,
                                            alignItems: 'flex-start',
                                            justifyContent: 'center'
                                          },
                                          children: Text({
                                            text: this.leaderboardDataBinding.derive(players =>
                                              players.length > 2 ? players[2].name : ''
                                            ),
                                            style: {
                                              fontSize: 17,
                                              fontWeight: 'bold',
                                              color: '#ffffff',
                                              textAlign: 'left'
                                            }
                                          })
                                        })
                                      ]
                                    }),
                                    // Score
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 2 ? players[2].score.toString() : '0'
                                      ),
                                      style: {
                                        fontSize: 17,
                                        fontWeight: 'bold',
                                        color: '#ffffff',
                                        marginRight: 8
                                      }
                                    })
                                  ]
                                })
                              )
                            ]
                          })
                        ]
                      })
                    ]
                  }),

                  // Error Screen overlay - only background image
                  View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: this.showErrorBinding.derive(show => show ? 'flex' : 'none'),
                      zIndex: 1000
                    },
                    children: [
                      // Background image only
                      Image({
                        source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(815090457525624))),
                        style: {
                          width: '100%',
                          height: '100%',
                          resizeMode: 'cover'
                        }
                      })
                    ]
                  })
                ]
              })
            )
          ]
        })
      ]
    });
  }

  private async loadPlayerHeadshot(player: hz.Player, stage: 'INIT' | 'RUNTIME' = 'RUNTIME'): Promise<void> {
    const playerId = player.id.toString();
    
    try {
      const headshotImageSource = await Social.getAvatarImageSource(player, {
        type: AvatarImageType.HEADSHOT,
        highRes: true
      });

      // Cache the headshot for this player
      this.playerHeadshots.set(playerId, headshotImageSource);
      
      // Trigger UI update to show the new headshot
      this.updateTriggerCounter++;
      this.playersUpdateTrigger.set(this.updateTriggerCounter);
      
    } catch (error) {
      // Could not get headshot for player, cache as null
      this.playerHeadshots.set(playerId, null);
    }
  }

  private createStaticPlayersComponents(): UINode[] {
    // Create static slots for up to 8 players that will reactively show/hide based on current players
    const maxSlots = 8;
    const components: UINode[] = [];
    
    for (let i = 0; i < maxSlots; i++) {
      components.push(
        UINode.if(
          this.playersUpdateTrigger.derive(() => {
            const currentPlayers = this.world.getPlayers();
            // Filter out opted-out players from display
            const activePlayers = currentPlayers.filter(player => 
              !this.playerManager.isPlayerOptedOut(player.id.toString())
            );
            const hasPlayerAtIndex = i < activePlayers.length;
            return hasPlayerAtIndex;
          }),
          View({
            style: {
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 8,
              marginRight: 12
            },
            children: [
              // Player avatar - reactive based on current player at this index
              View({
                style: {
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                  overflow: 'hidden',
                  position: 'relative'
                },
                children: [
                  // Show headshot if available
                  UINode.if(
                    this.playersUpdateTrigger.derive(() => {
                      const currentPlayers = this.world.getPlayers();
                      // Filter out opted-out players from display
                      const activePlayers = currentPlayers.filter(player => 
                        !this.playerManager.isPlayerOptedOut(player.id.toString())
                      );
                      if (i < activePlayers.length) {
                        const player = activePlayers[i];
                        const playerId = player.id.toString();
                        const hasHeadshot = this.playerHeadshots.has(playerId) && this.playerHeadshots.get(playerId) !== null;
                        return hasHeadshot;
                      }
                      return false;
                    }),
                    Image({
                      source: this.playersUpdateTrigger.derive(() => {
                        const currentPlayers = this.world.getPlayers();
                        // Filter out opted-out players from display
                        const activePlayers = currentPlayers.filter(player => 
                          !this.playerManager.isPlayerOptedOut(player.id.toString())
                        );
                        if (i < activePlayers.length) {
                          const player = activePlayers[i];
                          const playerId = player.id.toString();
                          const headshot = this.playerHeadshots.get(playerId);
                          return headshot || ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                        }
                        return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                      }),
                      style: {
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        zIndex: 2
                      }
                    })
                  ),
                  // Show initial letter as fallback (but not for host since they have crown)
                  UINode.if(
                    Binding.derive([this.playersUpdateTrigger, this.hostPlayerIdBinding], (playersCount, hostId) => {
                      const currentPlayers = this.world.getPlayers();
                      // Filter out opted-out players from display
                      const activePlayers = currentPlayers.filter(player => 
                        !this.playerManager.isPlayerOptedOut(player.id.toString())
                      );
                      if (i < activePlayers.length) {
                        const player = activePlayers[i];
                        const playerId = player.id.toString();
                        const hasHeadshot = this.playerHeadshots.has(playerId) && this.playerHeadshots.get(playerId) !== null;
                        const isHost = playerId === hostId;
                        return !hasHeadshot && !isHost; // Show letter when no headshot AND not host
                      }
                      return false;
                    }),
                    Text({
                      text: this.playersUpdateTrigger.derive(() => {
                        const currentPlayers = this.world.getPlayers();
                        // Filter out opted-out players from display
                        const activePlayers = currentPlayers.filter(player => 
                          !this.playerManager.isPlayerOptedOut(player.id.toString())
                        );
                        if (i < activePlayers.length) {
                          const player = activePlayers[i];
                          return player.name.get().charAt(0).toUpperCase();
                        }
                        return "";
                      }),
                      style: {
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: 'white'
                      }
                    })
                  ),
                  // Yellow border overlay for host - shows in front of headshot
                  UINode.if(
                    Binding.derive([this.playersUpdateTrigger, this.hostPlayerIdBinding], (playersCount, hostId) => {
                      const currentPlayers = this.world.getPlayers();
                      // Filter out opted-out players from display
                      const activePlayers = currentPlayers.filter(player => 
                        !this.playerManager.isPlayerOptedOut(player.id.toString())
                      );
                      if (i < activePlayers.length && hostId) {
                        const player = activePlayers[i];
                        const playerId = player.id.toString();
                        return playerId === hostId;
                      }
                      return false;
                    }),
                    View({
                      style: {
                        width: 48,
                        height: 48,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: '#FFD700', // Same yellow as crown icon
                        zIndex: 3 // Show in front of headshot
                      }
                    })
                  )
                ]
              }),
              // Player name
              Text({
                text: this.playersUpdateTrigger.derive(() => {
                  const currentPlayers = this.world.getPlayers();
                  // Filter out opted-out players from display
                  const activePlayers = currentPlayers.filter(player => 
                    !this.playerManager.isPlayerOptedOut(player.id.toString())
                  );
                  if (i < activePlayers.length) {
                    const player = activePlayers[i];
                    return player.name.get();
                  }
                  return "";
                }),
                style: {
                  fontSize: 10,
                  color: 'white',
                  textAlign: 'center',
                  maxWidth: 60,
                  overflow: 'hidden'
                }
              })
            ]
          })
        )
      );
    }
    
    // Add empty state when no active players (all opted out)
    components.push(
      UINode.if(
        this.playersUpdateTrigger.derive(() => {
          const currentPlayers = this.world.getPlayers();
          // Filter out opted-out players
          const activePlayers = currentPlayers.filter(player => 
            !this.playerManager.isPlayerOptedOut(player.id.toString())
          );
          const isEmpty = activePlayers.length === 0;
          return isEmpty;
        }),
        View({
          style: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            width: '100%'
          },
          children: Text({
            text: 'No active players yet...',
            style: {
              fontSize: 14,
              color: 'black',
              textAlign: 'center'
            }
          })
        })
      )
    );
    
    return components;
  }

  private createReactivePlayersGrid(): UINode {
    // Get current players from the world directly
    const currentPlayers = this.world.getPlayers().map(player => ({
      id: player.id.toString(),
      name: player.name.get()
    }));

    if (currentPlayers.length === 0) {
      return View({
        style: {
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        },
        children: Text({
          text: 'No players yet...',
          style: {
            fontSize: 14,
            color: 'black',
            textAlign: 'center'
          }
        })
      });
    }

    // Create player components for current players
    const playerComponents = currentPlayers.map((playerData: {id: string, name: string}, index: number) =>
      this.createPlayerComponent(playerData, index)
    );

    return View({
      style: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
      },
      children: playerComponents
    });
  }

  private createPlayerComponent(playerData: {id: string, name: string}, index: number): UINode {
    // Find the actual player object from the world
    const player = this.world.getPlayers().find(p => p.id.toString() === playerData.id);
    if (!player) {
      return View({
        style: {
          width: 48,
          height: 48,
          marginBottom: 8,
          marginRight: 12
        }
      });
    }

    return View({
      style: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 8,
        marginRight: 12
      },
      children: [
        // Player avatar - use conditional display based on headshot availability
        UINode.if(
          this.playersUpdateTrigger.derive(() => {
            // Check if headshot is available for this player
            const hasHeadshot = this.playerHeadshots.has(playerData.id) && this.playerHeadshots.get(playerData.id) !== null;
            return hasHeadshot;
          }),
          // Show headshot
          View({
            style: {
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
              overflow: 'hidden'
            },
            children: Image({
              source: this.playersUpdateTrigger.derive(() => {
                const headshot = this.playerHeadshots.get(playerData.id);
                return headshot || ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
              }),
              style: {
                width: 48,
                height: 48,
                borderRadius: 8
              }
            })
          }),
          // Show initial letter as fallback
          View({
            style: {
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
              overflow: 'hidden'
            },
            children: Text({
              text: playerData.name.charAt(0).toUpperCase(),
              style: {
                fontSize: 18,
                fontWeight: 'bold',
                color: 'black'
              }
            })
          })
        ),
        // Player name
        Text({
          text: playerData.name,
          style: {
            fontSize: 10,
            color: 'black',
            textAlign: 'center',
            maxWidth: 60,
            overflow: 'hidden'
          }
        })
      ]
    });
  }

  private createAnswerButton(index: number, color: string, iconTextureId: string): UINode {
    const textureAsset = new hz.TextureAsset(BigInt(iconTextureId));

    return View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: this.answerButtonColors[index],
        borderRadius: 4,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
      },
      children: [
        // Icon
        Image({
          source: ImageSource.fromTextureAsset(textureAsset),
          style: {
            width: 20,
            height: 20,
            aspectRatio: 1,
            marginRight: 6
          }
        }),

        // Answer text
        Text({
          text: this.answerTexts[index],
          numberOfLines: 5,
          style: {
            fontSize: 12,
            fontWeight: '500',
            color: 'white',
            flex: 1,
            textAlign: 'left',
            lineHeight: 12 // Reduced line spacing to prevent text cutoff
          }
        }),

        // Number indicator (only visible when answers are revealed)
        UINode.if(
          this.answerRevealedBinding,
          View({
            style: {
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
              paddingRight: 8 // Added right padding
            },
            children: Text({
              text: this.answerCountsBinding.derive(counts => {
                // Determine question type based on actual question data, not vote distribution
                const is2Answer = this.currentQuestion && this.currentQuestion.answers && this.currentQuestion.answers.length === 2;
                
                if (is2Answer) {
                  // 2-answer question logic: votes stored in counts[0], counts[1]
                  // Position 2 shows counts[0], Position 3 shows counts[1]
                  if (index === 2) return (counts[0] || 0).toString();
                  if (index === 3) return (counts[1] || 0).toString();
                  return "0"; // Positions 0,1 not used in 2-answer questions
                } else {
                  // 4-answer question logic: direct mapping
                  // Position 0 shows counts[0], Position 1 shows counts[1], etc.
                  return (counts[index] || 0).toString();
                }
              }),
              style: {
                fontSize: 10,
                fontWeight: 'bold',
                color: 'white' // Changed to white text
              }
            })
          })
        )
      ]
    });
  }

  private createBlankButton(): UINode {
    return View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent', // Transparent background
        borderRadius: 4,
        borderWidth: 0,
        borderColor: 'transparent', // No border outline
        paddingHorizontal: 8,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
      },
      children: [
        Text({
          text: '', // Empty text
          style: {
            fontSize: 12,
            fontWeight: '500',
            color: 'transparent'
          }
        })
      ]
    });
  }

  dispose(): void {
    this.isRunning = false;
    this.stopTimer();
    
    if (this.roundTimeoutId) {
      this.async.clearTimeout(this.roundTimeoutId);
      this.roundTimeoutId = null;
    }
    
    if (this.gameLoopTimeoutId) {
      this.async.clearTimeout(this.gameLoopTimeoutId);
      this.gameLoopTimeoutId = null;
    }
    
    // Clean up global registry
    if ((globalThis as any).triviaPhoneInstances) {
      const index = (globalThis as any).triviaPhoneInstances.indexOf(this);
      if (index > -1) {
        (globalThis as any).triviaPhoneInstances.splice(index, 1);
      }
    }
    
    super.dispose();
  }

  // Public method to handle preview mode transitions (can be called externally)
  public onPreviewModeTransition(): void {
    this.handlePreviewModeTransition();
  }

  // Enhanced method to handle preview mode transitions
  private handlePreviewModeTransition(): void {
    
    // Stop all running operations
    this.isRunning = false;
    this.stopTimer();
    
    // Clear all timers with safety checks
    if (this.roundTimeoutId) {
      this.async.clearTimeout(this.roundTimeoutId);
      this.roundTimeoutId = null;
    }
    if (this.gameLoopTimeoutId) {
      this.async.clearTimeout(this.gameLoopTimeoutId);
      this.gameLoopTimeoutId = null;
    }
    if (this.timerInterval) {
      this.async.clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Reset all UI bindings to safe defaults
    this.showConfigBinding.set(true);
    this.updateLockIcon('config'); // Update icon for config screen
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showGameOverBinding.set(false);
    this.showErrorBinding.set(false);
    
    // Reset internal state flags
    this.isShowingResults = false;
    this.isShowingLeaderboard = false;
    this.answerRevealed = false;
    this.answerRevealedBinding.set(false);
    
    // Clear question and answer data
    this.currentQuestion = null;
    this.currentQuestionIndex = 0;
    this.questionBinding.set("Configure your trivia game settings and press Start when ready!");
    this.questionImageBinding.set(null);
    this.centerQuestionBinding.set(false);
    
    // Clear answer texts and counts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
      this.currentAnswerCounts[i] = 0;
    }
    this.answerCountsBinding.set([0, 0, 0, 0]);
    this.answerCountBinding.set("0");
    this.answerCountTracking.set(4);
    
    // Reset timer display
    const timeLimit = (this.props as any).questionTimeLimit || 30;
    this.timeRemaining = timeLimit;
    this.timerBinding.set(timeLimit.toString());
    
    // Clear player tracking using PlayerManager
    this.playerManager.clearAnsweredPlayers();
    this.hasLocalPlayerAnswered = false;
    
    // Reset leaderboard data
    this.leaderboardDataBinding.set([]);
    
    // Clear any pending async operations by resetting question loading state
    this.isLoadingCategory = false;
    this.loadedCategories.clear();
    
    // Reinitialize player tracking for current world state using PlayerManager
    const currentPlayers = this.world.getPlayers();
    this.playerManager.updatePlayersInWorld(currentPlayers);
    
    // Reset host detection
    this.hostPlayerId = null;
    this.isLocalPlayerHost = false;
    this.isLocalPlayerHostBinding.set(false);
    this.detectHostPlayer();
    
    // Clear any cached player headshots that might be causing issues
    this.playerHeadshots.clear();
    
    // Reinitialize players list for UI
    this.currentPlayers = currentPlayers.map(player => ({
      id: player.id.toString(),
      name: player.name.get()
    }));
    this.playersListBinding.set([...this.currentPlayers]);
    
    // Broadcast comprehensive reset state to all clients
    this.sendNetworkBroadcastEvent(triviaUIStateEvent, {
      showConfig: true,
      showResults: false,
      showWaiting: false,
      showLeaderboard: false,
      showError: false
    });
    
    // Send game reset event to ensure TriviaPhones are also reset
    this.sendNetworkBroadcastEvent(triviaGameResetEvent, {
      hostId: this.hostPlayerId || 'unknown'
    });
    
  }

  // Handle state requests from TriviaPhone
  private async onStateRequest(event: { requesterId: string }): Promise<void> {
    
    // Determine current game state
    let gameState: 'waiting' | 'playing' | 'results' | 'leaderboard' | 'ended' = 'waiting';
    let responseData: any = {
      requesterId: event.requesterId,
      gameState: gameState
    };

    if (this.isRunning) {
      if (this.isShowingLeaderboard) {
        gameState = 'leaderboard';
        responseData.gameState = gameState;
        responseData.showLeaderboard = true;
        // Get current leaderboard data
        const leaderboardData = await this.generateRealLeaderboard();
        responseData.leaderboardData = leaderboardData.map(player => ({
          name: player.name,
          score: player.score,
          playerId: player.playerId
        }));
      } else if (this.isShowingResults) {
        gameState = 'results';
        responseData.gameState = gameState;
        responseData.showResults = true;
        if (this.currentQuestion) {
          responseData.currentQuestion = this.currentQuestion;
          responseData.questionIndex = this.currentQuestionIndex;
          // Include result data needed for display
          responseData.correctAnswerIndex = this.lastCorrectAnswerIndex;
          responseData.answerCounts = this.lastAnswerCounts;
        }
      } else if (this.currentQuestion) {
        gameState = 'playing';
        responseData.gameState = gameState;
        responseData.currentQuestion = this.currentQuestion;
        responseData.questionIndex = this.currentQuestionIndex;
        responseData.timeLimit = this.getTimeLimitForCurrentModifier();
      } else {
        // Game is running but no current question - could be between questions
        gameState = 'playing';
        responseData.gameState = gameState;
      }
    } else {
      gameState = 'waiting';
      responseData.gameState = gameState;
    }
    
    // Send the response
    this.sendNetworkBroadcastEvent(triviaStateResponseEvent, responseData);
  }

  private async syncNewPlayerToGameState(player: hz.Player): Promise<void> {
    const playerId = player.id.toString();
    
    // Check if player has opted out - if so, don't sync them to game state
    if (this.playerManager.isPlayerOptedOut(playerId)) {
      return;
    }
    
    // Give the TriviaPhone a moment to initialize after phone assignment
    this.async.setTimeout(async () => {
      // Send a game registration event to notify all TriviaPhones of the current state
      // The new player's phone will receive this and auto-request state sync
      this.sendNetworkBroadcastEvent(triviaGameRegisteredEvent, {
        isRunning: this.isRunning,
        hasQuestions: this.triviaQuestions.length > 0
      });
      
      // Also send the current game state directly as a fallback
      await this.sendGameStateToNewPlayer(playerId);
    }, 100); // Small delay to ensure phone is fully initialized
  }

  private async sendGameStateToNewPlayer(playerId: string): Promise<void> {
    // Determine current game state
    let gameState: 'waiting' | 'playing' | 'results' | 'leaderboard' | 'ended' = 'waiting';
    let responseData: any = {
      requesterId: playerId,
      gameState: gameState
    };

    if (this.isRunning) {
      if (this.isShowingResults || this.isShowingLeaderboard) {
        // For results or leaderboard, send waiting state so they see pre-game screen until next question
        gameState = 'waiting';
        responseData.gameState = gameState;
        
        // Track this player as someone who joined during interlude
        this.playersJoinedDuringInterlude.add(playerId);
        
      } else if (this.currentQuestion) {
        // Game is active with a current question - sync to question screen
        gameState = 'playing';
        responseData.gameState = gameState;
        
        // Create serializable question for both response data and events
        const serializableQuestion: SerializableQuestion = {
          id: this.currentQuestion.id,
          question: this.currentQuestion.question,
          category: this.currentQuestion.category || 'General',
          difficulty: this.currentQuestion.difficulty || 'easy',
          image: this.currentQuestion.image, // Include the image field
          answers: this.currentQuestion.answers
        };
        
        responseData.currentQuestion = serializableQuestion;
        responseData.questionIndex = this.currentQuestionIndex;
        responseData.timeLimit = this.getTimeLimitForCurrentModifier();
        
        // Also send the appropriate question type event to ensure proper UI display
        const answerCount = this.currentQuestion.answers ? this.currentQuestion.answers.length : 4;
        if (answerCount === 2) {
          // Send two-option question event
          this.sendNetworkBroadcastEvent(triviaTwoOptionsEvent, {
            question: serializableQuestion,
            questionIndex: this.currentQuestionIndex,
            timeLimit: this.getTimeLimitForCurrentModifier(),
            totalQuestions: this.triviaQuestions.length
          });
        } else {
          // Send four-option question event
          this.sendNetworkBroadcastEvent(triviaFourOptionsEvent, {
            question: serializableQuestion,
            questionIndex: this.currentQuestionIndex,
            timeLimit: this.getTimeLimitForCurrentModifier(),
            totalQuestions: this.triviaQuestions.length
          });
        }
        
        // If timer is active, sync the new player to current timer state
        if (this.timerInterval && this.timeRemaining > 0) {
          this.sendNetworkBroadcastEvent(triviaTimerUpdateEvent, {
            timeRemaining: this.timeRemaining,
            questionIndex: this.currentQuestionIndex
          });
        }
      } else {
        // Game is running but no current question - show pre-game screen
        gameState = 'waiting';
        responseData.gameState = gameState;
      }
    } else {
      gameState = 'waiting';
      responseData.gameState = gameState;
    }
    
    // Send the targeted state response directly to the new player
    this.sendNetworkBroadcastEvent(triviaStateResponseEvent, responseData);
  }

  /**
   * Syncs players who joined during results/leaderboard to the new question state
   */
  private syncPlayersJoinedDuringInterlude(serializableQuestion: SerializableQuestion, answerCount: number): void {
    if (this.playersJoinedDuringInterlude.size === 0) {
      return;
    }

    // Send explicit state update to each player who joined during interlude
    this.playersJoinedDuringInterlude.forEach(playerId => {
      
      // Send explicit state response to transition from waiting to playing
      this.sendNetworkBroadcastEvent(triviaStateResponseEvent, {
        requesterId: playerId,
        gameState: 'playing',
        currentQuestion: serializableQuestion,
        questionIndex: this.currentQuestionIndex,
        timeLimit: this.getTimeLimitForCurrentModifier()
      });

      // Also send the appropriate question type event specifically to this player
      const questionData = {
        question: serializableQuestion,
        questionIndex: this.currentQuestionIndex,
        timeLimit: this.getTimeLimitForCurrentModifier(),
        totalQuestions: this.triviaQuestions.length
      };

      if (answerCount === 2) {
        this.sendNetworkBroadcastEvent(triviaTwoOptionsEvent, questionData);
      } else {
        this.sendNetworkBroadcastEvent(triviaFourOptionsEvent, questionData);
      }
    });

    // Clear the set since we've now synced these players
    this.playersJoinedDuringInterlude.clear();
  }

  private onGameReset(event: { hostId: string }): void {
    
    // Reset the game to pre-game configuration screen
    this.isRunning = false;
    
    // Clear ALL timers to prevent interference with new games
    this.stopTimer();
    if (this.roundTimeoutId) {
      this.async.clearTimeout(this.roundTimeoutId);
      this.roundTimeoutId = null;
    }
    if (this.gameLoopTimeoutId) {
      this.async.clearTimeout(this.gameLoopTimeoutId);
      this.gameLoopTimeoutId = null;
    }
    
    // Reset all game state
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.isShowingResults = false;
    this.isShowingLeaderboard = false;
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    
    // Clear interlude tracking since game is resetting
    this.playersJoinedDuringInterlude.clear();
    
    // Show the configuration screen
    this.showConfigBinding.set(true);
    this.updateLockIcon('config'); // Update icon for config screen
    this.showErrorBinding.set(false);
    
    // Broadcast UI state update to show config screen
    this.sendNetworkBroadcastEvent(triviaUIStateEvent, {
      showConfig: true,
      showResults: false,
      showWaiting: false,
      showLeaderboard: false,
      showError: false
    });
    
    // Reset question display
    this.questionBinding.set("Configure your trivia game settings and press Start when ready!");
    
    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }
    
    // Reset timer display
    this.timerBinding.set("0");
    this.answerCountBinding.set("0");
    
    // Clear player tracking using PlayerManager
    this.playerManager.clearAnsweredPlayers();
    this.playerScores.clear();
    this.localPlayerScores.clear();
    
    // Note: PlayerManager opt-out state and game modifiers are NOT cleared - they persist across games
    // Note: persistentLeaderboardScores are NOT cleared - they persist across games
  }

  private async onAwardPoints(event: { playerId: string; points: number }): Promise<void> {
    try {
      // Find the player by ID
      const player = this.world.getPlayers().find(p => p.id.toString() === event.playerId);
      
      // Update persistent leaderboard directly with player ID using variable points
      const playerId = event.playerId;
      const currentCorrectAnswers = this.persistentLeaderboardScores.get(playerId) || 0;
      this.persistentLeaderboardScores.set(playerId, currentCorrectAnswers + event.points);
      
      const leaderboardName = "Trivia";
      if (player) {
        // Update native leaderboard with player object using variable points
        this.world.leaderboards.setScoreForPlayer(leaderboardName, player, currentCorrectAnswers + event.points, true);
      }
      
      // Send network event to update leaderboard.ts using variable points
      this.sendNetworkBroadcastEvent(leaderboardScoreUpdateEvent, {
        playerId: playerId,
        score: currentCorrectAnswers + event.points,
        leaderboardName: leaderboardName
      });
      
      // Update local game score cache using variable points
      const currentGamePoints = this.localPlayerScores.get(event.playerId) || 0;
      this.localPlayerScores.set(event.playerId, currentGamePoints + event.points);
      
      // Awarded ${event.points} points to player ${event.playerId}
    } catch (error) {
      console.error('❌ TriviaGame: Error awarding points:', error);
    }
  }

  // Phone management methods
  private async initializePhoneManager(): Promise<void> {
    
    // Create PhoneManager instance
    this.phoneManager = new PhoneManager();
    
    // Initialize the phone manager
    await this.phoneManager.start();
    
  }

  private setupPlayerEvents(): void {
    // Connect to player events
    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerEnterWorld,
      (player: hz.Player) => this.onPlayerEnter(player)
    );

    this.connectCodeBlockEvent(
      this.entity,
      hz.CodeBlockEvents.OnPlayerExitWorld,
      (player: hz.Player) => this.onPlayerExit(player)
    );

    // Assign phones to existing players and update players list
    const existingPlayers = this.world.getPlayers();
    this.currentPlayers = existingPlayers.map(player => ({
      id: player.id.toString(),
      name: player.name.get()
    }));
    
    // Initialize the reactive binding with current players
    this.playersListBinding.set([...this.currentPlayers]);
    
    // PhoneManager will automatically assign phones to existing players through its initialization
  }

  private onPlayerEnter(player: hz.Player): void {
    
    const playerId = player.id.toString();
    
    // Check if player has opted out - if so, don't add them to the game
    if (this.playerManager.isPlayerOptedOut(playerId)) {
      return;
    }
    
    // PhoneManager will automatically handle phone assignment via its own event handlers
    // We just need to handle TriviaGame-specific logic here
    
    // Load player headshot using Social API
    this.loadPlayerHeadshot(player, 'RUNTIME');
    
    // Update players list for UI
    const currentPlayers = this.world.getPlayers();
    this.currentPlayers = currentPlayers.map(p => ({
      id: p.id.toString(),
      name: p.name.get()
    }));
    
    // Update the reactive binding for UI updates
    this.playersListBinding.set([...this.currentPlayers]);
    
    // PlayerManager automatically handles player tracking when players enter
    
    // Broadcast updated player tracking to all clients using PlayerManager
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: this.playerManager.getPlayersInWorld(),
      playersAnswered: this.playerManager.getAnsweredPlayers(),
      answerCount: this.playerManager.getAnsweredCount()
    });
    
    // Trigger UI update
    this.updateTriggerCounter++;
    this.playersUpdateTrigger.set(this.updateTriggerCounter);
    
    // Detect host player when a new player joins (only if no host is set yet)
    this.detectHostPlayer();
    
    // Sync new player to current game state if game is active
    this.syncNewPlayerToGameState(player);
  }

  private onPlayerExit(player: hz.Player): void {
    
    // PhoneManager will automatically handle phone release via its own event handlers
    
    // Clean up player headshot from cache
    const playerId = player.id.toString();
    this.playerHeadshots.delete(playerId);
    
    // Remove from interlude tracking if they were being tracked
    this.playersJoinedDuringInterlude.delete(playerId);
    
    // Update players list for UI
    const currentPlayers = this.world.getPlayers().filter(p => p.id.toString() !== player.id.toString());
    this.currentPlayers = currentPlayers.map(p => ({
      id: p.id.toString(),
      name: p.name.get()
    }));
    
    // Update the reactive binding for UI updates
    this.playersListBinding.set([...this.currentPlayers]);
    
    // PlayerManager automatically handles player tracking when players exit
    
    // Remove player from all tracking using PlayerManager
    this.playerManager.removePlayer(playerId);
    
    // Broadcast updated player tracking to all clients using PlayerManager
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: this.playerManager.getPlayersInWorld(),
      playersAnswered: this.playerManager.getAnsweredPlayers(),
      answerCount: this.playerManager.getAnsweredCount()
    });
    
    // Update answer count binding using PlayerManager
    this.answerCountBinding.set(this.playerManager.getAnsweredCount().toString());
    
    // Check if all remaining players have answered after player left using PlayerManager
    if (this.playerManager.getAnsweredCount() >= this.playerManager.getActivePlayerCount() && this.playerManager.getActivePlayerCount() > 0) {
      this.showCorrectAnswersAndLeaderboard();
    }
    
    // Trigger UI update
    this.updateTriggerCounter++;
    this.playersUpdateTrigger.set(this.updateTriggerCounter);
    
    // Check if the leaving player was the host
    if (this.hostPlayerId === player.id.toString()) {
      // Clear current host
      const oldHostId = this.hostPlayerId;
      this.hostPlayerId = null;
      this.isLocalPlayerHost = false;
      this.isLocalPlayerHostBinding.set(false);
      
      // Reassign host using the centralized method
      this.detectHostPlayer();
      
      // If a new host was assigned, broadcast the change
      if (this.hostPlayerId && this.hostPlayerId !== oldHostId) {
        this.sendNetworkBroadcastEvent(hostChangedEvent, {
          newHostId: this.hostPlayerId,
          oldHostId: oldHostId
        });
      }
    }
  }

  // New synchronization event handlers
  private onPlayerUpdate(eventData: { playersInWorld: string[], playersAnswered: string[], answerCount: number }): void {
    // Update player tracking from network event using PlayerManager
    this.playerManager.updatePlayersInWorld(this.world.getPlayers());
    
    // Clear and update answered players
    this.playerManager.clearAnsweredPlayers();
    eventData.playersAnswered.forEach(playerId => {
      this.playerManager.addAnsweredPlayer(playerId);
    });

    // Update answer count binding
    this.answerCountBinding.set(eventData.answerCount.toString());
  }

  private onPlayerLogout(eventData: { playerId: string }): void {
    
    // Remove the player from playersInWorld set and get their answer if they had answered
    const removedAnswerIndex = this.playerManager.optOutPlayer(eventData.playerId);
    
    // If the player had answered, subtract their answer from the counts
    if (removedAnswerIndex !== null && this.currentAnswerCounts && removedAnswerIndex >= 0 && removedAnswerIndex < 4) {
      this.currentAnswerCounts[removedAnswerIndex] = Math.max(0, this.currentAnswerCounts[removedAnswerIndex] - 1);
      this.answerCountsBinding.set([...this.currentAnswerCounts]);
    }
    
    // Update answer count binding to reflect the change using PlayerManager
    this.answerCountBinding.set(this.playerManager.getAnsweredCount().toString());
    
    // Broadcast updated player tracking state to all clients using PlayerManager
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: this.playerManager.getPlayersInWorld(),
      playersAnswered: this.playerManager.getAnsweredPlayers(),
      answerCount: this.playerManager.getAnsweredCount()
    });
    
    // Check if all remaining active players have answered after this logout
    if (this.playerManager.getAnsweredCount() >= this.playerManager.getActivePlayerCount() && 
        this.playerManager.getActivePlayerCount() > 0 && 
        !this.isShowingResults) {
      this.showCorrectAnswersAndLeaderboard();
    }
    
    // Trigger UI update for pre-game screen to hide opted-out player
    this.updateTriggerCounter++;
    this.playersUpdateTrigger.set(this.updateTriggerCounter);
  }

  private onPlayerRejoin(eventData: { playerId: string }): void {
    
    // Call the rejoinPlayer method to handle the rejoin logic
    this.rejoinPlayer(eventData.playerId);
  }

  private onUIStateUpdate(eventData: { showConfig: boolean, showResults: boolean, showWaiting: boolean, showLeaderboard: boolean, showError: boolean, errorMessage?: string }): void {
    // Update UI state bindings from network event
    this.showConfigBinding.set(eventData.showConfig);
    
    // Determine screen type for icon update
    let screenType: 'config' | 'question' | 'results' | 'leaderboard' | 'host-pregame' | 'participant-ready';
    if (eventData.showConfig) {
      screenType = 'config';
    } else if (eventData.showResults) {
      screenType = 'results';
    } else if (eventData.showLeaderboard) {
      screenType = 'leaderboard';
    } else if (eventData.showError || eventData.showWaiting) {
      screenType = 'host-pregame';
    } else {
      screenType = 'question';
    }
    this.updateLockIcon(screenType);
    
    this.showResultsBinding.set(eventData.showResults);
    this.showWaitingBinding.set(eventData.showWaiting);
    this.showLeaderboardBinding.set(eventData.showLeaderboard);
    this.showErrorBinding.set(eventData.showError);

    if (eventData.errorMessage) {
      this.errorMessageBinding.set(eventData.errorMessage);
    }

    // Update internal state flags
    this.isShowingResults = eventData.showResults;
    this.isShowingLeaderboard = eventData.showLeaderboard;
  }

  private onTimerUpdate(eventData: { timeRemaining: number, questionIndex: number }): void {
    // Only update timer if it's for the current question
    if (eventData.questionIndex === this.currentQuestionIndex) {
      this.timeRemaining = eventData.timeRemaining;
      this.timerBinding.set(eventData.timeRemaining.toString());
    }
  }

  private onTimerEnd(eventData: { questionIndex: number }): void {
    // Only end timer if it's for the current question
    if (eventData.questionIndex === this.currentQuestionIndex) {
      this.stopTimer();
      // Set timer to 0 for immediate visual feedback
      this.timeRemaining = 0;
      this.timerBinding.set("0");
      this.showQuestionResults();
    }
  }

  private assignPhoneToPlayer(player: hz.Player): void {
    // Delegate to PhoneManager
    if (this.phoneManager) {
      this.phoneManager.assignPhoneToPlayer(player);
    }
  }

  private releasePlayerPhone(player: hz.Player): void {
    // Delegate to PhoneManager
    if (this.phoneManager) {
      this.phoneManager.releasePlayerPhone(player);
    }
  }

  private createNewPhoneForPlayer(player: hz.Player): void {
    // This is a placeholder for dynamic phone creation
    // In Horizon Worlds, you would typically pre-place enough phone entities
    // rather than creating them dynamically
  }

  // Public method to get phone assignment for a player (for debugging)
  public getPlayerPhone(player: hz.Player): hz.Entity | null {
    if (this.phoneManager) {
      return this.phoneManager.getPlayerPhone(player);
    }
    return null;
  }

  // Public method to get all assignments (for debugging)
  public getAssignments(): PhoneAssignment[] {
    if (this.phoneManager) {
      return this.phoneManager.getPhoneAssignments();
    }
    return [];
  }

  // Method to handle phone availability changes
  public notifyPhoneAvailable(phoneEntity: hz.Entity): void {
    // With PhoneManager, this is automatically handled
    if (this.phoneManager) {
    } else {
    }
  }

  // Helper method for debugging phone assignments
  public debugPhoneAssignments(): void {
    if (this.phoneManager) {
      this.phoneManager.debugPhoneAssignments();
    }
  }

  // Helper method to refresh phone assignments if needed
  public refreshPhoneAssignments(): void {
    if (this.phoneManager) {
      this.phoneManager.refreshAllAssignments();
    }
  }

  // Method to allow opted-out players to rejoin the game
  public rejoinPlayer(playerId: string): void {
    // Use PlayerManager to rejoin the player
    this.playerManager.rejoinPlayer(playerId);
    
    // Find the player object and add them to the game
    const player = this.world.getPlayers().find(p => p.id.toString() === playerId);
    if (player) {
      this.onPlayerEnter(player);
    }
  }

  // Method to check if a player is opted out
  public isPlayerOptedOut(playerId: string): boolean {
    return this.playerManager.isPlayerOptedOut(playerId);
  }
}

// Register the component so it can be attached to Custom UI gizmos
ui.UIComponent.register(TriviaGame);
