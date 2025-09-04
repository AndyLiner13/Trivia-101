import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';
import { View, Text, Pressable, Binding, UINode, Image, ImageSource } from 'horizon/ui';

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
  historyQuestionsAsset?: any;
  scienceQuestionsAsset?: any;
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

// Settings update event for real-time sync with TriviaPhone
const triviaSettingsUpdateEvent = new hz.NetworkEvent<{
  hostId: string;
  settings: {
    numberOfQuestions: number;
    category: string;
    difficulty: string;
    timeLimit: number;
    autoAdvance: boolean;
    muteDuringQuestions: boolean;
    isLocked: boolean;
  };
}>('triviaSettingsUpdate');

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
    historyQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
    scienceQuestionsAsset: { type: hz.PropTypes.Asset, default: null },
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
  private showErrorBinding = new Binding(false);
  private errorMessageBinding = new Binding("No questions available for the selected category.");
  private correctAnswerBinding = new Binding(-1);
  private answerCountsBinding = new Binding([0, 0, 0, 0]);
  
  // Leaderboard data
  private leaderboardDataBinding = new Binding<Array<{name: string, score: number, playerId: string, headshotImageSource?: ImageSource}>>([]);
  
  // Player scores tracking - now using real variables instead of local Map
  private playerScores = new Map<string, number>();

  // Category and difficulty selection bindings
  private selectedCategoryBinding = new Binding("General");
  private selectedDifficultyBinding = new Binding("easy");

  // Methods to interact with the real variable system
  private getPlayerPoints(player: hz.Player): number {
    try {
      const points = this.world.persistentStorage.getPlayerVariable(player, 'Trivia:Points');
      return points || 0;
    } catch (error) {
      return 0;
    }
  }

  private setPlayerPoints(player: hz.Player, points: number): void {
    try {
      this.world.persistentStorage.setPlayerVariable(player, 'Trivia:Points', points);
    } catch (error) {
      // Failed to set player points
    }
  }

  private addToTotalPoints(points: number): void {
    try {
      const currentTotal = (this.world.persistentStorageWorld.getWorldVariable('Trivia:TotalPoints') as number) || 0;
      const newTotal = currentTotal + points;
      this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('Trivia:TotalPoints', newTotal);
    } catch (error) {
      // Failed to update total points
    }
  }

  private resetAllPlayerPoints(): void {
    const currentPlayers = this.world.getPlayers();
    currentPlayers.forEach(player => {
      this.setPlayerPoints(player, 0);
    });
  }

  // Game configuration state
  private showConfigBinding = new Binding(true); // Show config screen initially
  private gameConfigBinding = new Binding({
    timeLimit: 30,
    autoAdvance: true,
    numQuestions: 10,
    category: "General",
    difficulty: "easy"
  });
  private hostPlayerIdBinding = new Binding<string | null>(null);
  private isLocalPlayerHostBinding = new Binding(false);
  
  // Answer button color bindings for results state
  private answerButtonColors = [
    new Binding('#DC2626'), // Default red
    new Binding('#2563EB'), // Default blue  
    new Binding('#EAB308'), // Default yellow
    new Binding('#16A34A')  // Default green
  ];
  
  // Internal state variables (not bound to UI)
  private hostPlayerId: string | null = null;
  private isLocalPlayerHost: boolean = false;
  private gameConfig = {
    timeLimit: 30,
    autoAdvance: true,
    numQuestions: 10,
    category: "General",
    difficulty: "easy"
  };

  // Game data
  private generalQuestions: TriviaQuestion[] = [];
  private historyQuestions: TriviaQuestion[] = [];
  private scienceQuestions: TriviaQuestion[] = [];
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

  // Public getter for currentQuestionIndex to allow TriviaApp sync
  public getCurrentQuestionIndex(): number {
    return this.currentQuestionIndex;
  }

  // Public getter for showLeaderboard state to allow TriviaApp sync
  public getShowLeaderboard(): boolean {
    return this.isShowingLeaderboard;
  }

  // Public getter for results state to allow TriviaApp sync
  public getShowResults(): boolean {
    return this.isShowingResults;
  }

  // Player tracking for waiting logic
  private playersInWorld: Set<string> = new Set();
  private playersAnswered: Set<string> = new Set();
  private hasLocalPlayerAnswered: boolean = false;

  // Timer management properties
  private roundTimeoutId: number | null = null;
  private gameLoopTimeoutId: number | null = null;
  private timerInterval: number | null = null;

  // Phone management properties
  private phoneAssignments: PhoneAssignment[] = [];
  private maxPhones = 20; // Maximum number of phone entities we expect

  async start() {
    
    // Initialize phone management
    this.discoverPhoneEntities();
    this.setupPlayerEvents();
    
    // Register this TriviaGame instance with the world for TriviaApp access
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
    
    // Send a network event to notify any TriviaApps that a game is available
    this.sendNetworkBroadcastEvent(triviaGameRegisteredEvent, {
      isRunning: this.isRunning,
      hasQuestions: this.triviaQuestions.length > 0
    });
    
    // Also register with global registry as backup (may not work across script contexts)
    if (!(globalThis as any).triviaGameInstances) {
      (globalThis as any).triviaGameInstances = [];
    }
    (globalThis as any).triviaGameInstances.push(this);
    
    // Notify any existing TriviaApps about our registration
    const globalTriviaApps = (globalThis as any).triviaAppInstances || [];
    globalTriviaApps.forEach((triviaApp: any, index: number) => {
      if (triviaApp && typeof triviaApp.forceSyncWithTriviaGame === 'function') {
        triviaApp.forceSyncWithTriviaGame();
      }
    });
    
    // Load trivia questions from asset if provided, otherwise use defaults or JSON file
    await this.loadTriviaQuestions();
    
    // Load custom quiz data
    await this.loadCustomQuizData();
    
    // Set up network event listeners
    this.setupNetworkEvents();
    
    // Initialize the UI (shows config screen by default)
    this.resetGameState();
    
    // Detect host player (first player to join)
    this.detectHostPlayer();
  }

  private async loadTriviaQuestions(): Promise<void> {
    // Load general questions
    if (this.props.generalQuestionsAsset) {
      try {
        const assetData = await (this.props.generalQuestionsAsset as any).fetchAsData();
        const jsonData = assetData.asJSON() as TriviaQuestion[];
        if (Array.isArray(jsonData)) {
          this.generalQuestions = jsonData;
        }
      } catch (error) {
        // Failed to load general questions, using defaults
      }
    }

    // Load history questions
    if (this.props.historyQuestionsAsset) {
      try {
        const assetData = await (this.props.historyQuestionsAsset as any).fetchAsData();
        const jsonData = assetData.asJSON() as TriviaQuestion[];
        if (Array.isArray(jsonData)) {
          this.historyQuestions = jsonData;
        }
      } catch (error) {
        // Failed to load history questions, using defaults
      }
    }

    // Load science questions
    if (this.props.scienceQuestionsAsset) {
      try {
        const assetData = await (this.props.scienceQuestionsAsset as any).fetchAsData();
        const jsonData = assetData.asJSON() as TriviaQuestion[];
        if (Array.isArray(jsonData)) {
          this.scienceQuestions = jsonData;
        }
      } catch (error) {
        // Failed to load science questions, using defaults
      }
    }

    // If no assets loaded, use default questions
    if (this.generalQuestions.length === 0 && this.historyQuestions.length === 0 && this.scienceQuestions.length === 0) {
      // Categorize default questions by category
      this.generalQuestions = defaultTriviaQuestions.filter(q =>
        (q.category?.toLowerCase().includes('geography')) ||
        (q.category?.toLowerCase().includes('general')) ||
        (q.category?.toLowerCase().includes('math')) ||
        (q.category?.toLowerCase().includes('literature')) ||
        (q.category?.toLowerCase().includes('art')) ||
        (!q.category || !['science', 'history'].includes(q.category.toLowerCase()))
      );
      this.historyQuestions = defaultTriviaQuestions.filter(q => q.category?.toLowerCase().includes('history'));
      this.scienceQuestions = defaultTriviaQuestions.filter(q => q.category?.toLowerCase().includes('science'));
    }

    // Set default category to General and filter questions
    this.updateQuestionsForCategory("General", "easy");
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

      // Shuffle answers for randomization
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
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

  private updateQuestionsForCategory(category: string, difficulty: string): void {
    let allQuestions: TriviaQuestion[] = [];

    // Collect questions from selected category - NO FALLBACKS
    const categoryLower = category.toLowerCase();
    
    if (categoryLower === "general") {
      allQuestions = [...this.generalQuestions];
    } else if (categoryLower === "history") {
      allQuestions = [...this.historyQuestions];
    } else if (categoryLower === "science") {
      allQuestions = [...this.scienceQuestions];
    } else if (categoryLower === "italian brainrot quiz" || categoryLower === "italianbrainrot quiz" || categoryLower.includes("italian") && categoryLower.includes("brainrot")) {
      allQuestions = [...this.customQuizQuestions];
    } else {
      // For unknown categories, don't fall back - show error
      allQuestions = [];
    }

    // Filter by difficulty if specified (but NOT for Italian Brainrot Quiz)
    const isItalianBrainrot = categoryLower === "italian brainrot quiz" || categoryLower === "italianbrainrot quiz" || (categoryLower.includes("italian") && categoryLower.includes("brainrot"));
    
    if (!isItalianBrainrot && difficulty !== "all" && allQuestions.length > 0) {
      const beforeFilter = allQuestions.length;
      allQuestions = allQuestions.filter(q => q.difficulty?.toLowerCase() === difficulty.toLowerCase());
    } else if (isItalianBrainrot) {
    }

    // NO FALLBACKS - if no questions match the exact criteria, keep empty array
    // This will trigger error handling in handleStartGame

    // Limit number of questions (but NOT for Italian Brainrot Quiz)
    if (!isItalianBrainrot && this.gameConfig && this.gameConfig.numQuestions && allQuestions.length > this.gameConfig.numQuestions) {
      allQuestions = allQuestions.slice(0, this.gameConfig.numQuestions);
    } else if (isItalianBrainrot) {
    }

    this.triviaQuestions = allQuestions;
    this.currentQuestionIndex = 0;
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
    
    // Listen for settings updates from TriviaPhone
    this.connectNetworkBroadcastEvent(triviaSettingsUpdateEvent, this.onSettingsUpdate.bind(this));
    
    // Listen for state requests from MePhone/TriviaApp
    this.connectNetworkBroadcastEvent(triviaStateRequestEvent, this.onStateRequest.bind(this));
  }

  private resetGameState(): void {
    // Reset all game state variables
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.timeRemaining = this.props.questionTimeLimit;
    this.totalAnswers = 0;
    this.isRunning = false;

    // Clear player tracking
    this.playersAnswered.clear();
    this.hasLocalPlayerAnswered = false;

    // Reset UI bindings
    this.questionNumberBinding.set("Q1");
    const timeLimit = (this.props as any).questionTimeLimit || 30;
    this.timerBinding.set(timeLimit.toString());
    this.answerCountBinding.set("0");
    this.questionBinding.set("Loading first question...");
    this.questionImageBinding.set(null); // Clear image binding
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    this.showErrorBinding.set(false); // Hide error screen on reset

    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }

    // Reset answer count tracking
    this.answerCountTracking.set(4);

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
    this.timeRemaining = this.props.questionTimeLimit;
    this.totalAnswers = 0;
    // DON'T reset isRunning here

    // Clear player tracking
    this.playersAnswered.clear();
    this.hasLocalPlayerAnswered = false;

    // Reset UI bindings
    this.questionNumberBinding.set("Q1");
    const timeLimit = (this.props as any).questionTimeLimit || 30;
    this.timerBinding.set(timeLimit.toString());
    this.answerCountBinding.set("0");
    this.questionBinding.set("Loading first question...");
    this.questionImageBinding.set(null); // Clear image binding
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    this.showErrorBinding.set(false); // Hide error screen on reset

    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }

    // Reset answer count tracking
    this.answerCountTracking.set(4);

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
    this.timeRemaining = this.props.questionTimeLimit;
    this.totalAnswers = 0;

    // Update UI bindings
    this.questionNumberBinding.set(`Q${this.currentQuestionIndex + 1}`);
    this.questionBinding.set(shuffledQuestion.question);
    // Set the image binding for stable image display
    this.questionImageBinding.set(shuffledQuestion.image || null);
    // Don't reset answer count here - let it persist during results display
    this.showResultsBinding.set(false);

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
      // For 2-answer questions, set colors for positions 2 and 3 (yellow and green)
      this.answerButtonColors[0].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[1].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[2].set('#EAB308'); // Yellow for first answer (position 2)
      this.answerButtonColors[3].set('#16A34A'); // Green for second answer (position 3)
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

    // Send question to TriviaApp and other components
    const serializableQuestion: SerializableQuestion = {
      id: shuffledQuestion.id,
      question: shuffledQuestion.question,
      category: shuffledQuestion.category || 'General',
      difficulty: shuffledQuestion.difficulty || 'easy',
      image: shuffledQuestion.image, // Include the image field
      answers: shuffledQuestion.answers.map((answer: { text: string; correct: boolean }) => ({ text: answer.text, correct: answer.correct }))
    };

    this.sendNetworkBroadcastEvent(triviaQuestionShowEvent, {
      question: serializableQuestion,
      questionIndex: this.currentQuestionIndex,
      timeLimit: this.props.questionTimeLimit
    });

    // Reset answer count when starting new question
    this.answerCountBinding.set("0");

    // Start countdown timer
    this.startTimer();

    // Don't auto-schedule next question - wait for host to press "Next Question"
    // this.scheduleNextQuestion();
  }

  private shuffleQuestions(): void {
    if (this.triviaQuestions.length <= 1) return;

    // Use a more robust shuffling algorithm with better randomization
    // Fisher-Yates shuffle with additional randomization techniques

    // First, add some entropy by using current timestamp and player count
    const seed = Date.now() + (this.world?.getPlayers().length || 0) + Math.random() * 1000;

    // Create a seeded random function for more predictable but still random results
    let seedValue = seed;
    const seededRandom = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };

    // Perform multiple shuffle passes for better randomization
    for (let pass = 0; pass < 3; pass++) {
      for (let i = this.triviaQuestions.length - 1; i > 0; i--) {
        // Use a combination of seeded random and Math.random for maximum entropy
        const randomValue = (seededRandom() + Math.random()) / 2;
        const j = Math.floor(randomValue * (i + 1));

        // Swap elements
        [this.triviaQuestions[i], this.triviaQuestions[j]] = [this.triviaQuestions[j], this.triviaQuestions[i]];
      }
    }

    // Additional randomization: reverse sections randomly
    if (this.triviaQuestions.length > 3) {
      const midPoint = Math.floor(this.triviaQuestions.length / 2);
      if (Math.random() > 0.5) {
        // Reverse first half
        for (let i = 0; i < Math.floor(midPoint / 2); i++) {
          const temp = this.triviaQuestions[i];
          this.triviaQuestions[i] = this.triviaQuestions[midPoint - 1 - i];
          this.triviaQuestions[midPoint - 1 - i] = temp;
        }
      }

      if (Math.random() > 0.5) {
        // Reverse second half
        const start = midPoint;
        const end = this.triviaQuestions.length - 1;
        for (let i = 0; i < Math.floor((end - start + 1) / 2); i++) {
          const temp = this.triviaQuestions[start + i];
          this.triviaQuestions[start + i] = this.triviaQuestions[end - i];
          this.triviaQuestions[end - i] = temp;
        }
      }
    }

    // Final randomization pass
    for (let i = this.triviaQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.triviaQuestions[i], this.triviaQuestions[j]] = [this.triviaQuestions[j], this.triviaQuestions[i]];
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

    // Use multiple randomization techniques for better shuffling
    const answers = shuffledQuestion.answers;

    // First pass: Fisher-Yates shuffle
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    // Second pass: Additional randomization with different approach
    if (answers.length >= 3) {
      // Randomly swap pairs
      for (let i = 0; i < Math.min(3, answers.length - 1); i++) {
        const idx1 = Math.floor(Math.random() * answers.length);
        let idx2 = Math.floor(Math.random() * answers.length);
        while (idx2 === idx1) {
          idx2 = Math.floor(Math.random() * answers.length);
        }
        [answers[idx1], answers[idx2]] = [answers[idx2], answers[idx1]];
      }
    }

    // Third pass: Ensure correct answer isn't always in the same position
    // (This helps prevent players from memorizing positions)
    const correctIndex = answers.findIndex(a => a.correct);
    if (correctIndex !== -1 && Math.random() > 0.5) {
      // 50% chance to move correct answer to a different position
      const newPosition = Math.floor(Math.random() * answers.length);
      if (newPosition !== correctIndex) {
        [answers[correctIndex], answers[newPosition]] = [answers[newPosition], answers[correctIndex]];
      }
    }

    return shuffledQuestion;
  }

  private endGame(): void {
    this.isRunning = false;
    this.stopTimer();

    // Hide all game UI elements
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;

    // Show final message
    this.questionBinding.set("Game Complete! Thank you for playing.");

    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }

    // Reset timer display
    this.timerBinding.set("0");

    // Reset question index for next game
    this.currentQuestionIndex = 0;

    // Optionally show final leaderboard
    this.async.setTimeout(() => {
      this.showFinalLeaderboard();
    }, 2000);
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
    };      // Prepare final leaderboard data for network event
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
    });
  }

  private scheduleNextQuestion(): void {
    // Clear any existing game loop timer
    if (this.gameLoopTimeoutId) {
      this.async.clearTimeout(this.gameLoopTimeoutId);
    }

    // Schedule next question after question time + results time
    const totalTime = this.props.questionTimeLimit * 1000 + this.props.autoAdvanceTime * 1000;
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
    
    // Reset player tracking for new question
    this.playersAnswered.clear();
    this.hasLocalPlayerAnswered = false;
    this.showWaitingBinding.set(false);
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    
    // Get current players in world
    const currentPlayers = this.world.getPlayers();
    this.playersInWorld.clear();
    currentPlayers.forEach(player => {
      this.playersInWorld.add(player.id.toString());
    });
    
    // Update UI bindings
    this.questionNumberBinding.set(`Q${eventData.questionIndex + 1}`);
    this.questionBinding.set(eventData.question.question);
    // Set the image binding for stable image display
    this.questionImageBinding.set((eventData.question as any).image || null);
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
      // For 2-answer questions, set colors for positions 2 and 3 (yellow and green)
      this.answerButtonColors[0].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[1].set('#6B7280'); // Gray for empty slot
      this.answerButtonColors[2].set('#EAB308'); // Yellow for first answer (position 2)
      this.answerButtonColors[3].set('#16A34A'); // Green for second answer (position 3)
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
    
    // Start countdown timer
    this.startTimer();
  }

  private onQuestionResults(eventData: { question: SerializableQuestion, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }): void {
    
    this.showResultsBinding.set(true);
    this.isShowingResults = true;
    this.showWaitingBinding.set(false); // Hide waiting screen when results come in
    this.correctAnswerBinding.set(eventData.correctAnswerIndex);
    this.answerCountsBinding.set(eventData.answerCounts);
    
    // Store the results data for state responses
    this.lastCorrectAnswerIndex = eventData.correctAnswerIndex;
    this.lastAnswerCounts = eventData.answerCounts;
    
    // Calculate total answers
    this.totalAnswers = eventData.answerCounts.reduce((sum, count) => sum + count, 0);
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
    
    // Track this player as having answered
    this.playersAnswered.add(eventData.playerId);
    
    // Update answer count immediately
    this.answerCountBinding.set(this.playersAnswered.size.toString());
    
    // Check if all players have answered
    if (this.playersAnswered.size >= this.playersInWorld.size && this.playersInWorld.size > 0) {
      this.showCorrectAnswersAndLeaderboard();
    }
  }

  private showCorrectAnswersAndLeaderboard(): void {
    if (!this.currentQuestion) return;
    
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
    this.answerCountBinding.set(this.playersAnswered.size.toString());
    
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
    
    // Call TriviaApp instances directly via world reference
    const triviaApps = (this.world as any).triviaApps;
    
    // Also check global registry as backup
    const globalTriviaApps = (globalThis as any).triviaAppInstances || [];
    
    // Also send network event for TriviaApp instances that might be listening
    // Use actual answer count in a way that won't reset our display
    // Create answer counts array based on the number of answers for this question
    const actualAnswerCounts = new Array(this.currentQuestion.answers.length).fill(0);
    actualAnswerCounts[correctAnswerIndex] = this.playersAnswered.size;
    
    // Try world registry first
    if (triviaApps && Array.isArray(triviaApps)) {
      triviaApps.forEach((triviaApp: any, index: number) => {
        if (triviaApp && typeof triviaApp.onTriviaResults === 'function') {
          triviaApp.onTriviaResults({
            question: serializableQuestion,
            correctAnswerIndex: correctAnswerIndex,
            answerCounts: actualAnswerCounts,
            scores: {}
          });
        }
      });
    } else if (globalTriviaApps.length > 0) {
      // Fallback to global registry
      globalTriviaApps.forEach((triviaApp: any, index: number) => {
        if (triviaApp && typeof triviaApp.onTriviaResults === 'function') {
          triviaApp.onTriviaResults({
            question: serializableQuestion,
            correctAnswerIndex: correctAnswerIndex,
            answerCounts: actualAnswerCounts,
            scores: {}
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
    
    // After 5 seconds, show leaderboard (but don't auto-advance to next question)
    this.async.setTimeout(() => {
      this.showLeaderboard();
    }, 5000);
  }

  private async showLeaderboard(): Promise<void> {
    
    // Hide results, show leaderboard
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showLeaderboardBinding.set(true);
    this.isShowingLeaderboard = true;
    
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
    
    // Create leaderboard entries for each real player
    for (const player of currentPlayers) {
      const playerId = player.id.toString();
      if (this.playersInWorld.has(playerId)) {
        // Get actual score from the variable system
        const score = this.getPlayerPoints(player);
        
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
          name: player.name.get() || `Player ${leaderboard.length + 1}`,
          score: score,
          playerId: playerId,
          headshotImageSource: headshotImageSource
        });
      }
    }

    // Sort by score descending
    return leaderboard.sort((a, b) => b.score - a.score);
  }  private advanceToNextQuestion(): void {
    
    // Hide leaderboard
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
    
    // Clear any previous results state
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showWaitingBinding.set(false);
    
    // Reset players answered tracking for new question
    this.playersAnswered.clear();
    
    // Move to next question
    this.currentQuestionIndex++;
    
    // Show the next question (this will send network event to all TriviaApps)
    this.showNextQuestion();
  }

  private onSettingsUpdate(eventData: { hostId: string, settings: { numberOfQuestions: number, category: string, difficulty: string, timeLimit: number, autoAdvance: boolean, muteDuringQuestions: boolean, isLocked: boolean } }): void {
    
    // Update the game configuration immediately when settings change in TriviaPhone
    this.gameConfig = {
      timeLimit: eventData.settings.timeLimit,
      autoAdvance: eventData.settings.autoAdvance,
      numQuestions: eventData.settings.numberOfQuestions,
      category: eventData.settings.category.toLowerCase(),
      difficulty: eventData.settings.difficulty
    };
    
    // Update the binding to reflect changes in the UI
    this.gameConfigBinding.set(this.gameConfig);
    
    // Update questions based on new category and difficulty
    this.updateQuestionsForCategory(this.gameConfig.category, this.gameConfig.difficulty);
  }

  private onNextQuestionRequest(data: { playerId: string }): void {
    // Only allow the host to advance to the next question
    if (data.playerId === this.hostPlayerId) {
      this.advanceToNextQuestion();
    }
  }

  private detectHostPlayer(): void {
    const localPlayer = this.world.getLocalPlayer();
    if (!localPlayer) return;
    
    const allPlayers = this.world.getPlayers();
    
    if (allPlayers.length === 0) {
      // No players yet, local player becomes host
      this.hostPlayerId = localPlayer.id.toString();
      this.isLocalPlayerHost = true;
      this.hostPlayerIdBinding.set(this.hostPlayerId);
      this.isLocalPlayerHostBinding.set(true);
    } else {
      // Check if there's already a host or if local player is first
      if (!this.hostPlayerId) {
        // No host set yet, local player becomes host
        this.hostPlayerId = localPlayer.id.toString();
        this.isLocalPlayerHost = true;
        this.hostPlayerIdBinding.set(this.hostPlayerId);
        this.isLocalPlayerHostBinding.set(true);
      } else {
        // Host already exists
        this.isLocalPlayerHost = this.hostPlayerId === localPlayer.id.toString();
        this.isLocalPlayerHostBinding.set(this.isLocalPlayerHost);
      }
    }
  }

  private handleStartGame(): void {
    if (!this.isLocalPlayerHost) {
      return;
    }

    // Get selected category and difficulty from gameConfig
    const selectedCategory = this.gameConfig.category;
    const selectedDifficulty = this.gameConfig.difficulty;

    // Update questions based on selection
    this.updateQuestionsForCategory(selectedCategory, selectedDifficulty);

    // Check if we have questions for the selected category
    if (this.triviaQuestions.length === 0) {
      this.showErrorScreen(`No questions available for "${selectedCategory}". Please check your category selection and ensure the data source is properly configured.`);
      return;
    }

    // Shuffle questions for completely random order - do this multiple times for maximum randomness
    this.shuffleQuestions();
    // Additional shuffle pass for extra randomness
    this.async.setTimeout(() => this.shuffleQuestions(), 10);

    // Reset all player points to 0 for new game
    this.resetAllPlayerPoints();

    // Broadcast game start to all players
    this.sendNetworkBroadcastEvent(triviaGameStartEvent, {
      hostId: this.hostPlayerId!,
      config: this.gameConfig
    });

    // Hide config screen and start game locally
    this.showConfigBinding.set(false);
    this.showErrorBinding.set(false); // Hide any error screen

    // Apply current configuration
    this.timeRemaining = this.gameConfig.timeLimit;
    this.timerBinding.set(this.gameConfig.timeLimit.toString());

    // Start the trivia game
    this.startContinuousGame();
  }

  private onGameStart(data: { hostId: string, config: any, questions?: any[] }): void {
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

    // Use questions from TriviaApp if provided, otherwise use local questions
    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      this.triviaQuestions = data.questions;
    } else {
      // Update questions based on the new configuration
      this.updateQuestionsForCategory(this.gameConfig.category, this.gameConfig.difficulty);
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

    // Apply configuration
    this.timeRemaining = this.gameConfig.timeLimit;
    this.timerBinding.set(this.gameConfig.timeLimit.toString());

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
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
  }

  private hideErrorScreen(): void {
    this.showErrorBinding.set(false);
    this.showConfigBinding.set(true);
  }

  private startTimer(): void {
    this.stopTimer(); // Clear any existing timer
    
    this.timerInterval = this.async.setInterval(() => {
      this.timeRemaining--;
      this.timerBinding.set(this.timeRemaining.toString());
      
      if (this.timeRemaining <= 0) {
        this.stopTimer();
        // Show results when timer reaches 0
        this.showQuestionResults();
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
            backgroundColor: '#F3F4F6',
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
                  backgroundColor: 'linear-gradient(180deg, #7C3AED 0%, #3B82F6 100%)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16
                },
                children: [
                  // Header
                  View({
                    style: {
                      position: 'absolute',
                      top: '8%',
                      left: 0,
                      right: 0,
                      alignItems: 'center'
                    },
                    children: Text({
                      text: 'Waiting for Host...',
                      style: {
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: 'black',
                        textAlign: 'center'
                      }
                    })
                  }),

                  // Players Section
                  View({
                    style: {
                      position: 'absolute',
                      top: '18%',
                      left: '8%',
                      right: '8%',
                      bottom: '35%',
                      alignItems: 'center'
                    },
                    children: [
                      // Player count header
                      View({
                        style: {
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 12
                        },
                        children: [
                          Text({
                            text: '👥',
                            style: {
                              fontSize: 16,
                              marginRight: 8
                            }
                          }),
                          Text({
                            text: 'Players',
                            style: {
                              fontSize: 16,
                              fontWeight: '600',
                              color: 'black'
                            }
                          })
                        ]
                      }),

                      // Players grid
                      View({
                        style: {
                          flex: 1,
                          width: '100%'
                        },
                        children: this.createPlayersGrid()
                      })
                    ]
                  }),

                  // Game Settings Panel - Bottom
                  View({
                    style: {
                      position: 'absolute',
                      bottom: '8%',
                      left: '8%',
                      right: '8%',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 12,
                      padding: 12
                    },
                    children: [
                      View({
                        style: {
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        },
                        children: [
                          // Category
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1
                            },
                            children: [
                              Text({
                                text: 'Category:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: this.gameConfigBinding.derive(config => config.category),
                                style: {
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: '#1F2937'
                                }
                              })
                            ]
                          }),

                          // Questions
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1
                            },
                            children: [
                              Text({
                                text: 'Questions:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: this.gameConfigBinding.derive(config => `Q${config.numQuestions}`),
                                style: {
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: '#1F2937'
                                }
                              })
                            ]
                          }),

                          // Time
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1
                            },
                            children: [
                              Text({
                                text: 'Time:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              View({
                                style: {
                                  flexDirection: 'row',
                                  alignItems: 'center'
                                },
                                children: [
                                  Text({
                                    text: '⏱️',
                                    style: {
                                      fontSize: 12,
                                      marginRight: 4
                                    }
                                  }),
                                  Text({
                                    text: this.gameConfigBinding.derive(config => `${config.timeLimit}s`),
                                    style: {
                                      fontSize: 12,
                                      fontWeight: '600',
                                      color: '#1F2937'
                                    }
                                  })
                                ]
                              })
                            ]
                          }),

                          // Difficulty
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1
                            },
                            children: [
                              Text({
                                text: 'Difficulty:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: this.gameConfigBinding.derive(config => {
                                  const diff = config.difficulty;
                                  return diff.charAt(0).toUpperCase() + diff.slice(1);
                                }),
                                style: {
                                  fontSize: 12,
                                  fontWeight: '600',
                                  color: '#1F2937'
                                }
                              })
                            ]
                          }),

                          // Auto-Advance
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1
                            },
                            children: [
                              Text({
                                text: 'Auto:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: this.gameConfigBinding.derive(config => config.autoAdvance ? '▶️' : '⏸️'),
                                style: {
                                  fontSize: 14
                                }
                              })
                            ]
                          }),

                          // Mute
                          View({
                            style: {
                              alignItems: 'center',
                              flex: 1
                            },
                            children: [
                              Text({
                                text: 'Audio:',
                                style: {
                                  fontSize: 10,
                                  color: '#6B7280',
                                  marginBottom: 4
                                }
                              }),
                              Text({
                                text: '🔊',
                                style: {
                                  fontSize: 14
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
                  // Timer - positioned at left, aligned with question
                  View({
                    style: {
                      position: 'absolute',
                      left: '5%',
                      top: '2%',
                      width: 35,
                      height: 35,
                      backgroundColor: '#FF6B35',
                      borderRadius: 17.5,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: 'black',
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      shadowOffset: [0, 1]
                    },
                    children: Text({
                      text: this.timerBinding,
                      style: {
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: 'white'
                      }
                    })
                  }),

                  // Answer count - positioned at right, aligned with question
                  View({
                    style: {
                      position: 'absolute',
                      right: '5%',
                      top: '2%',
                      alignItems: 'center'
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
                  }),

                  // Question text - always shown at the top
                  View({
                    style: {
                      position: 'absolute',
                      left: '12%',
                      right: '12%',
                      top: '2%',
                      height: '15%',
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    children: View({
                      style: {
                        backgroundColor: 'white',
                        borderRadius: 6,
                        shadowColor: 'black',
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        shadowOffset: [0, 2],
                        padding: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%'
                      },
                      children: [
                        // Question text
                        Text({
                          text: this.questionBinding,
                          style: {
                            fontSize: 14,
                            fontWeight: '500',
                            color: 'black',
                            textAlign: 'center',
                            lineHeight: 1.3
                          }
                        })
                      ]
                    })
                  }),

                  // Question image - centered in middle area
                  UINode.if(
                    this.questionImageBinding.derive(imageId => imageId !== null),
                    View({
                      style: {
                        position: 'absolute',
                        left: '15%',
                        right: '15%',
                        top: this.answerCountTracking.derive(count => count === 2 ? '20%' : '16%'), // Lower position for 2-answer questions
                        bottom: this.answerCountTracking.derive(count => count === 2 ? '25%' : '35%'), // Larger area for 2-answer questions
                        alignItems: 'center',
                        justifyContent: 'center'
                      },
                      children: Image({
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
                          width: 'auto',
                          height: this.answerCountTracking.derive(count => count === 2 ? '100%' : '80%'), // Bigger image for 2-answer questions
                          aspectRatio: 1.5, // 3:2 aspect ratio to maintain proportions
                          borderRadius: 8,
                          alignSelf: 'center'
                        }
                      })
                    })
                  ),

                  // Answer options grid - positioned at bottom
                  View({
                    style: {
                      position: 'absolute',
                      bottom: 5,
                      left: 15,
                      right: 15,
                      height: 100
                    },
                    children: [
                      // Dynamic layout based on number of answers
                      UINode.if(
                        this.answerCountTracking.derive(count => count > 0),
                        View({
                          style: {
                            width: '100%',
                            height: '100%',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'center'
                          },
                          children: [
                            // For 2-answer questions: Show options 3 and 4, hide 1 and 2
                            UINode.if(
                              this.answerCountTracking.derive(count => count === 2),
                              View({
                                style: {
                                  width: '100%',
                                  height: '100%',
                                  flexDirection: 'row',
                                  flexWrap: 'wrap',
                                  justifyContent: 'center',
                                  alignItems: 'flex-end' // Align to bottom of container
                                },
                                children: [
                                  // Empty spacers for top row (where options 1 and 2 would be)
                                  View({
                                    style: {
                                      width: '48%',
                                      height: 42,
                                      marginRight: '4%',
                                      marginBottom: 6,
                                      opacity: 0 // Invisible spacer
                                    }
                                  }),
                                  View({
                                    style: {
                                      width: '48%',
                                      height: 42,
                                      marginBottom: 6,
                                      opacity: 0 // Invisible spacer
                                    }
                                  }),
                                  
                                  // Answer 2 (Yellow/Circle) - shows as Option 3 in bottom row
                                  UINode.if(
                                    this.answerTexts[2].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42,
                                        marginRight: '4%'
                                      },
                                      children: this.createAnswerButton(2, '#EAB308', '797899126007085')
                                    })
                                  ),
                                  // Answer 3 (Green/Square) - shows as Option 4 in bottom row
                                  UINode.if(
                                    this.answerTexts[3].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42
                                      },
                                      children: this.createAnswerButton(3, '#16A34A', '1286736292915198')
                                    })
                                  )
                                ]
                              })
                            ),

                            // For 3+ answer questions: Show all options normally
                            UINode.if(
                              this.answerCountTracking.derive(count => count !== 2),
                              View({
                                style: {
                                  width: '100%',
                                  height: '100%',
                                  flexDirection: 'row',
                                  flexWrap: 'wrap',
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                },
                                children: [
                                  // Answer 0 (Red/Triangle) - Option 1
                                  UINode.if(
                                    this.answerTexts[0].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: this.answerTexts[2].derive(text => text !== '') ? '48%' : '48%',
                                        height: 42,
                                        marginRight: this.answerTexts[1].derive(text => text !== '') ? '4%' : '0%',
                                        marginBottom: this.answerTexts[2].derive(text => text !== '') ? 6 : 0
                                      },
                                      children: this.createAnswerButton(0, '#DC2626', '1290982519195562')
                                    })
                                  ),

                                  // Answer 1 (Blue/Star) - Option 2
                                  UINode.if(
                                    this.answerTexts[1].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: this.answerTexts[2].derive(text => text !== '') ? '48%' : '48%',
                                        height: 42,
                                        marginBottom: this.answerTexts[2].derive(text => text !== '') ? 6 : 0
                                      },
                                      children: this.createAnswerButton(1, '#2563EB', '764343253011569')
                                    })
                                  ),

                                  // Answer 2 (Yellow/Circle) - Option 3
                                  UINode.if(
                                    this.answerTexts[2].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42,
                                        marginRight: '4%'
                                      },
                                      children: this.createAnswerButton(2, '#EAB308', '797899126007085')
                                    })
                                  ),

                                  // Answer 3 (Green/Square) - Option 4
                                  UINode.if(
                                    this.answerTexts[3].derive(text => text !== ''),
                                    View({
                                      style: {
                                        width: '48%',
                                        height: 42
                                      },
                                      children: this.createAnswerButton(3, '#16A34A', '1286736292915198')
                                    })
                                  )
                                ]
                              })
                            )
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
                        maxWidth: '60%'
                      },
                      children: [
                        Text({
                          text: 'Waiting for Other Players...',
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
                      // Header
                      View({
                        style: {
                          position: 'absolute',
                          top: 12,
                          left: 0,
                          right: 0,
                          alignItems: 'center'
                        },
                        children: View({
                          style: {
                            backgroundColor: 'white',
                            borderRadius: 8,
                            paddingHorizontal: 24,
                            paddingVertical: 8,
                            shadowColor: 'black',
                            shadowOpacity: 0.1,
                            shadowRadius: 6,
                            shadowOffset: [0, 2]
                          },
                          children: Text({
                            text: 'Leaderboard',
                            style: {
                              fontSize: 18,
                              fontWeight: 'bold',
                              color: '#1F2937'
                            }
                          })
                        })
                      }),

                      // Leaderboard list
                      View({
                        style: {
                          position: 'absolute',
                          top: 60,
                          bottom: 15,
                          left: '10%',
                          right: '10%',
                          flexDirection: 'column'
                        },
                        children: [
                          // Player entries with improved spacing
                          UINode.if(
                            this.leaderboardDataBinding.derive(players => players.length > 0),
                            View({
                              style: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: 'black',
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                shadowOffset: [0, 1]
                              },
                              children: [
                                View({
                                  style: {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flex: 1
                                  },
                                  children: [
                                    View({
                                      style: {
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: '#F3F4F6',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 12
                                      },
                                      children: Text({
                                        text: '1',
                                        style: {
                                          fontSize: 12,
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      })
                                    }),
                                    UINode.if(
                                      this.leaderboardDataBinding.derive(players =>
                                        players.length > 0 && players[0].headshotImageSource
                                      ),
                                      Image({
                                        source: this.leaderboardDataBinding.derive(players =>
                                          players.length > 0 && players[0].headshotImageSource ? players[0].headshotImageSource : null
                                        ),
                                        style: {
                                          width: 30,
                                          height: 30,
                                          borderRadius: 15,
                                          marginRight: 8
                                        }
                                      })
                                    ),
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 0 ? players[0].name : ''
                                      ),
                                      style: {
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#1F2937'
                                      }
                                    })
                                  ]
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 0 ? players[0].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#1F2937'
                                  }
                                })
                              ]
                            })
                          ),

                          // Additional player entries...
                          UINode.if(
                            this.leaderboardDataBinding.derive(players => players.length > 1),
                            View({
                              style: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: 'black',
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                shadowOffset: [0, 1]
                              },
                              children: [
                                View({
                                  style: {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flex: 1
                                  },
                                  children: [
                                    View({
                                      style: {
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: '#F3F4F6',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 12
                                      },
                                      children: Text({
                                        text: '2',
                                        style: {
                                          fontSize: 12,
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      })
                                    }),
                                    UINode.if(
                                      this.leaderboardDataBinding.derive(players =>
                                        players.length > 1 && players[1].headshotImageSource
                                      ),
                                      Image({
                                        source: this.leaderboardDataBinding.derive(players =>
                                          players.length > 1 && players[1].headshotImageSource ? players[1].headshotImageSource : null
                                        ),
                                        style: {
                                          width: 30,
                                          height: 30,
                                          borderRadius: 15,
                                          marginRight: 8
                                        }
                                      })
                                    ),
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 1 ? players[1].name : ''
                                      ),
                                      style: {
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#1F2937'
                                      }
                                    })
                                  ]
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 1 ? players[1].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#1F2937'
                                  }
                                })
                              ]
                            })
                          ),

                          UINode.if(
                            this.leaderboardDataBinding.derive(players => players.length > 2),
                            View({
                              style: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                shadowColor: 'black',
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                shadowOffset: [0, 1]
                              },
                              children: [
                                View({
                                  style: {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flex: 1
                                  },
                                  children: [
                                    View({
                                      style: {
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: '#F3F4F6',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: 12
                                      },
                                      children: Text({
                                        text: '3',
                                        style: {
                                          fontSize: 12,
                                          fontWeight: 'bold',
                                          color: '#1F2937'
                                        }
                                      })
                                    }),
                                    UINode.if(
                                      this.leaderboardDataBinding.derive(players =>
                                        players.length > 2 && players[2].headshotImageSource
                                      ),
                                      Image({
                                        source: this.leaderboardDataBinding.derive(players =>
                                          players.length > 2 && players[2].headshotImageSource ? players[2].headshotImageSource : null
                                        ),
                                        style: {
                                          width: 30,
                                          height: 30,
                                          borderRadius: 15,
                                          marginRight: 8
                                        }
                                      })
                                    ),
                                    Text({
                                      text: this.leaderboardDataBinding.derive(players =>
                                        players.length > 2 ? players[2].name : ''
                                      ),
                                      style: {
                                        fontSize: 14,
                                        fontWeight: '500',
                                        color: '#1F2937'
                                      }
                                    })
                                  ]
                                }),
                                Text({
                                  text: this.leaderboardDataBinding.derive(players =>
                                    players.length > 2 ? players[2].score.toString() : '0'
                                  ),
                                  style: {
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    color: '#1F2937'
                                  }
                                })
                              ]
                            })
                          )
                        ]
                      })
                    ]
                  }),

                  // Error Screen overlay
                  ui.View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      display: this.showErrorBinding.derive(show => show ? 'flex' : 'none')
                    },
                    children: ui.View({
                      style: {
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 24,
                        alignItems: 'center',
                        maxWidth: '70%',
                        shadowColor: 'black',
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        shadowOffset: [0, 4]
                      },
                      children: [
                        // Error icon
                        ui.Text({
                          text: '⚠️',
                          style: {
                            fontSize: 32,
                            marginBottom: 12
                          }
                        }),
                        // Error title
                        ui.Text({
                          text: 'No Questions Available',
                          style: {
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#DC2626',
                            marginBottom: 8,
                            textAlign: 'center'
                          }
                        }),
                        // Error message
                        ui.Text({
                          text: this.errorMessageBinding,
                          style: {
                            fontSize: 14,
                            color: '#6B7280',
                            textAlign: 'center',
                            lineHeight: 1.4,
                            marginBottom: 16
                          }
                        }),
                        // Back to config button
                        ui.Pressable({
                          style: {
                            backgroundColor: '#3B82F6',
                            borderRadius: 6,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            alignItems: 'center'
                          },
                          onPress: () => this.hideErrorScreen(),
                          children: [
                            ui.Text({
                              text: 'Back to Settings',
                              style: {
                                fontSize: 14,
                                fontWeight: '600',
                                color: 'white'
                              }
                            })
                          ]
                        })
                      ]
                    })
                  })
                ]
              })
            )
          ]
        })
      ]
    });
  }

  private async loadPlayerHeadshot(player: hz.Player, headshotBinding: Binding<ImageSource | null>): Promise<void> {
    try {
      const headshotImageSource = await Social.getAvatarImageSource(player, {
        type: AvatarImageType.HEADSHOT,
        highRes: true
      });

      if (headshotImageSource) {
        headshotBinding.set(headshotImageSource);
      }
    } catch (error) {
      // Could not get headshot for player, binding will remain null and show fallback
    }
  }

  private createPlayersGrid(): UINode {
    // Get current players in the world
    const currentPlayers = this.world.getPlayers();

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

    // Create player avatar components
    const playerComponents = currentPlayers.map((player, index) => {
      // Create a binding for the headshot image
      const headshotBinding = new Binding<ImageSource | null>(null);

      // Load headshot asynchronously
      this.loadPlayerHeadshot(player, headshotBinding);

      return View({
        style: {
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 8,
          marginRight: 12
        },
        children: [
          // Player avatar with headshot or fallback
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
            children: [
              // Try to show headshot image first
              UINode.if(
                headshotBinding.derive(image => image !== null),
                Image({
                  source: headshotBinding.derive(image => image || ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)))),
                  style: {
                    width: 48,
                    height: 48,
                    borderRadius: 8
                  }
                })
              ),
              // Fallback to initial letter if no headshot
              UINode.if(
                headshotBinding.derive(image => image === null),
                Text({
                  text: player.name.get().charAt(0).toUpperCase(),
                  style: {
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: 'black'
                  }
                })
              )
            ]
          }),
          // Player name
          Text({
            text: player.name.get(),
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
    });

    return View({
      style: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
      },
      children: playerComponents
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
        paddingHorizontal: 8,
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
            width: 12,
            height: 12,
            marginRight: 6
          }
        }),

        // Answer text only (no results indicator)
        Text({
          text: this.answerTexts[index],
          style: {
            fontSize: 11,
            fontWeight: '500',
            color: 'white'
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
    if ((globalThis as any).triviaGameInstances) {
      const index = (globalThis as any).triviaGameInstances.indexOf(this);
      if (index > -1) {
        (globalThis as any).triviaGameInstances.splice(index, 1);
      }
    }
    
    super.dispose();
  }

  // Handle state requests from MePhone/TriviaApp
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
        responseData.timeLimit = this.props.questionTimeLimit;
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

  // Phone management methods
  private discoverPhoneEntities(): void {
    // Find all entities in the world with the "MePhone" tag
    const allEntitiesInWorld = this.world.getEntitiesWithTags(['MePhone']);

    for (const entity of allEntitiesInWorld) {
      this.phoneAssignments.push({
        phoneEntity: entity,
        assignedPlayer: null,
        isInUse: false
      });

      // Initially set the phone to be invisible
      entity.visible.set(false);
    }
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

    // Assign phones to existing players
    this.world.getPlayers().forEach(player => {
      this.assignPhoneToPlayer(player);
    });
  }

  private onPlayerEnter(player: hz.Player): void {
    this.assignPhoneToPlayer(player);
  }

  private onPlayerExit(player: hz.Player): void {
    this.releasePlayerPhone(player);
  }

  private assignPhoneToPlayer(player: hz.Player): void {
    // Check if player already has a phone assigned
    const existingAssignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );

    if (existingAssignment) {
      return;
    }

    // Find an available phone
    const availablePhone = this.phoneAssignments.find(
      assignment => !assignment.isInUse && assignment.assignedPlayer === null
    );

    if (availablePhone) {
      // Assign the phone to the player
      availablePhone.assignedPlayer = player;
      availablePhone.isInUse = true;

      // Make the phone visible only to this player
      availablePhone.phoneEntity.visible.set(false); // Hide from everyone first
      // Note: Player-specific visibility may need to be handled differently in Horizon
      // You may need to use a different approach for per-player visibility
      availablePhone.phoneEntity.visible.set(true);

      // Set ownership of the phone entity to this player
      availablePhone.phoneEntity.owner.set(player);
    } else {
      // Optionally create a new phone entity dynamically if none available
      // This would require instantiating a new CustomUI entity
      this.createNewPhoneForPlayer(player);
    }
  }

  private releasePlayerPhone(player: hz.Player): void {
    const playerAssignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );

    if (playerAssignment) {
      // Hide the phone entity
      playerAssignment.phoneEntity.visible.set(false);

      // Note: Cannot set owner to null, so we'll leave it as is or set to another player
      // playerAssignment.phoneEntity.owner.set(null); // This causes error

      // Mark as available
      playerAssignment.assignedPlayer = null;
      playerAssignment.isInUse = false;
    }
  }

  private createNewPhoneForPlayer(player: hz.Player): void {
    // This is a placeholder for dynamic phone creation
    // In Horizon Worlds, you would typically pre-place enough phone entities
    // rather than creating them dynamically
  }

  // Public method to get phone assignment for a player (for debugging)
  public getPlayerPhone(player: hz.Player): hz.Entity | null {
    const assignment = this.phoneAssignments.find(
      assignment => assignment.assignedPlayer === player
    );
    return assignment ? assignment.phoneEntity : null;
  }

  // Public method to get all assignments (for debugging)
  public getAssignments(): PhoneAssignment[] {
    return [...this.phoneAssignments];
  }

  // Method to handle phone availability changes
  public notifyPhoneAvailable(phoneEntity: hz.Entity): void {
    const assignment = this.phoneAssignments.find(
      assignment => assignment.phoneEntity === phoneEntity
    );

    if (assignment && assignment.isInUse) {
      assignment.isInUse = false;

      // Try to assign to any waiting players if needed
      this.tryAssignWaitingPlayers();
    }
  }

  private tryAssignWaitingPlayers(): void {
    // Find players without phones and try to assign them
    const playersWithoutPhones = this.world.getPlayers().filter(player => {
      return !this.phoneAssignments.some(
        assignment => assignment.assignedPlayer === player
      );
    });

    for (const player of playersWithoutPhones) {
      this.assignPhoneToPlayer(player);
    }
  }
}

// Register the component so it can be attached to Custom UI gizmos
ui.UIComponent.register(TriviaGame);
