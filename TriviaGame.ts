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

const triviaTwoOptionsEvent = new hz.NetworkEvent<{
  question: SerializableQuestion;
  questionIndex: number;
  timeLimit: number;
}>('triviaTwoOptions');

const triviaFourOptionsEvent = new hz.NetworkEvent<{
  question: SerializableQuestion;
  questionIndex: number;
  timeLimit: number;
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
    autoAdvance: boolean;
    muteDuringQuestions: boolean;
    isLocked: boolean;
  };
}>('triviaSettingsUpdate');

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

  private addCorrectAnswerToLeaderboard(player: hz.Player): void {
    try {
      const playerId = player.id.toString();
      const currentCorrectAnswers = this.persistentLeaderboardScores.get(playerId) || 0;
      this.persistentLeaderboardScores.set(playerId, currentCorrectAnswers + 1);
      
      // Update local score for current game leaderboard
      const currentLocalScore = this.localPlayerScores.get(playerId) || 0;
      this.localPlayerScores.set(playerId, currentLocalScore + 1);
      
      // Update native leaderboard with total correct answers
      const leaderboardName = "Trivia";
      this.world.leaderboards.setScoreForPlayer(leaderboardName, player, currentCorrectAnswers + 1, true);
      
      // Send network event to update leaderboard.ts
      this.sendNetworkBroadcastEvent(leaderboardScoreUpdateEvent, {
        playerId: playerId,
        score: currentCorrectAnswers + 1,
        leaderboardName: leaderboardName
      });
    } catch (error) {
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
    numQuestions: 5,
    category: "Italian Brainrot Quiz",
    difficulty: "easy"
  });
  private hostPlayerIdBinding = new Binding<string | null>(null);
  private isLocalPlayerHostBinding = new Binding(false);
  
  // Layout mode binding - determines if question should be centered (true) or at top (false)
  private centerQuestionBinding = new Binding(false);
  
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
    numQuestions: 5,
    category: "Italian Brainrot Quiz",
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

  // Player tracking for waiting logic
  private playersInWorld: Set<string> = new Set();
  private playersAnswered: Set<string> = new Set();
  private hasLocalPlayerAnswered: boolean = false;

  // Current players list for UI (not a binding to avoid circular reference issues)
  private currentPlayers: Array<{id: string, name: string}> = [];

  // Timer management properties
  private roundTimeoutId: number | null = null;
  private gameLoopTimeoutId: number | null = null;
  private timerInterval: number | null = null;

  // Phone management properties
  private phoneAssignments: PhoneAssignment[] = [];
  private maxPhones = 20; // Maximum number of phone entities we expect

  // Player headshot cache - maps player ID to ImageSource
  private playerHeadshots = new Map<string, ImageSource | null>();

  async start() {
    
    // Initialize phone management
    this.discoverPhoneEntities();
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
    
    // Initialize the UI (shows config screen by default)
    this.resetGameState();
    
    // Initialize players list
    const initialPlayers = this.world.getPlayers();
    this.currentPlayers = initialPlayers.map(player => ({
      id: player.id.toString(),
      name: player.name.get()
    }));

    // Load headshots for existing players
    for (const player of initialPlayers) {
      await this.loadPlayerHeadshot(player, 'INIT');
    }
    
    // Detect host player for existing players
    this.detectHostPlayer();
  }

  private async loadTriviaQuestions(): Promise<void> {
    // No longer loading all JSON files upfront - will load on demand when categories are selected
  }

  private parseOpenTriviaFormat(jsonData: any, expectedCategory: string): TriviaQuestion[] {
    const convertedQuestions: TriviaQuestion[] = [];
    
    // Extract questions from all difficulty levels
    const difficulties = ['easy', 'medium', 'hard'];
    
    for (const difficulty of difficulties) {
      if (jsonData.questions[difficulty] && Array.isArray(jsonData.questions[difficulty])) {
        for (const question of jsonData.questions[difficulty]) {
          try {
            // Convert Open Trivia Database format to TriviaQuestion format
            const answers = [
              { text: question.correct_answer, correct: true },
              ...question.incorrect_answers.map((answer: string) => ({ text: answer, correct: false }))
            ];

            // Shuffle answers for randomization
            for (let i = answers.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [answers[i], answers[j]] = [answers[j], answers[i]];
            }

            const triviaQuestion: TriviaQuestion = {
              id: parseInt(question.id) || Math.floor(Math.random() * 1000000),
              question: question.question,
              category: expectedCategory,
              difficulty: difficulty,
              image: undefined, // Open Trivia Database doesn't have images
              answers: answers
            };

            convertedQuestions.push(triviaQuestion);
          } catch (error) {
            // Skip malformed questions
            continue;
          }
        }
      } else {
        // Skip malformed questions
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
        } else if (categoryKey === "history") {
          allQuestions = [...this.historyQuestions];
        } else if (categoryKey === "science") {
          allQuestions = [...this.scienceQuestions];
        } else if (categoryKey === "italian brainrot quiz" || categoryKey === "italianbrainrot quiz" || categoryKey.includes("italian") && categoryKey.includes("brainrot")) {
          allQuestions = [...this.customQuizQuestions];
        }
        
        // Pre-shuffle cached questions to ensure different subset each game
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
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

      // IMPORTANT: Shuffle the entire question pool BEFORE limiting to ensure variety
      if (allQuestions.length > 1) {
        // Use the same ultra-randomization algorithm as shuffleQuestions but for the full pool
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
        }
        
        // Additional randomization pass with timestamp entropy
        const entropy = Date.now() % 1000;
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const j = Math.floor((Math.random() + entropy / 1000) * (i + 1)) % (i + 1);
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

    // Listen for timer synchronization events
    this.connectNetworkBroadcastEvent(triviaTimerUpdateEvent, this.onTimerUpdate.bind(this));
    this.connectNetworkBroadcastEvent(triviaTimerEndEvent, this.onTimerEnd.bind(this));

    // Listen for UI state synchronization events
    this.connectNetworkBroadcastEvent(triviaUIStateEvent, this.onUIStateUpdate.bind(this));

    // Listen for player tracking synchronization events
    this.connectNetworkBroadcastEvent(triviaPlayerUpdateEvent, this.onPlayerUpdate.bind(this));
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
    this.centerQuestionBinding.set(false); // Reset to top layout
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
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
    this.centerQuestionBinding.set(false); // Reset to top layout
    this.showResultsBinding.set(false);
    this.isShowingResults = false;
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;
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
    const imageValue = shuffledQuestion.image;
    this.questionImageBinding.set(imageValue && imageValue.trim() !== "" ? imageValue : null);
    
    // Set layout mode - center question if no image
    this.centerQuestionBinding.set(!imageValue || imageValue.trim() === "");
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
      timeLimit: this.props.questionTimeLimit
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

    // Enhanced randomization to ensure completely unique question orders between games
    // Multiple entropy sources for maximum randomness

    // Generate multiple entropy sources for ultra-random shuffling
    const timestamp = Date.now();
    const microseconds = (Date.now() * Math.random() * 1000) % 1000000; // Alternative high-precision timing
    const playerCount = this.world?.getPlayers().length || 0;
    const randomBase = Math.random() * 999999;
    const gameSessionId = Math.floor(Math.random() * 1000000); // Unique per game session
    
    // Create multiple independent random seeds
    const seed1 = (timestamp % 99991) + playerCount;
    const seed2 = Math.floor(microseconds) % 99991;
    const seed3 = Math.floor(randomBase) % 99991;
    const seed4 = gameSessionId % 99991;

    // Advanced pseudo-random generator with multiple seeds
    let rng1 = seed1;
    let rng2 = seed2;
    let rng3 = seed3;
    let rng4 = seed4;

    const advancedRandom = () => {
      // Linear congruential generators with different parameters
      rng1 = (rng1 * 16807) % 2147483647;
      rng2 = (rng2 * 48271) % 2147483647;
      rng3 = (rng3 * 69621) % 2147483647;
      rng4 = (rng4 * 40692) % 2147483647;
      
      // Combine all generators with Math.random for maximum entropy
      const combined = (rng1 + rng2 + rng3 + rng4) / (4 * 2147483647);
      return (combined + Math.random() + Math.random()) / 3; // Triple random for extra chaos
    };

    // Perform 5 complete shuffle passes with different algorithms
    for (let pass = 0; pass < 5; pass++) {
      // Fisher-Yates shuffle with enhanced randomness
      for (let i = this.triviaQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(advancedRandom() * (i + 1));
        [this.triviaQuestions[i], this.triviaQuestions[j]] = [this.triviaQuestions[j], this.triviaQuestions[i]];
      }

      // Random segment swapping
      if (this.triviaQuestions.length > 4) {
        const segmentSize = Math.floor(advancedRandom() * 3) + 2; // 2-4 elements
        const start1 = Math.floor(advancedRandom() * (this.triviaQuestions.length - segmentSize));
        const start2 = Math.floor(advancedRandom() * (this.triviaQuestions.length - segmentSize));
        
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

    // Additional chaos operations
    if (this.triviaQuestions.length > 6) {
      // Random rotation
      const rotateAmount = Math.floor(advancedRandom() * this.triviaQuestions.length);
      const rotated = [...this.triviaQuestions.slice(rotateAmount), ...this.triviaQuestions.slice(0, rotateAmount)];
      this.triviaQuestions.splice(0, this.triviaQuestions.length, ...rotated);

      // Random reversal of subsections
      const numReversals = Math.floor(advancedRandom() * 3) + 1;
      for (let r = 0; r < numReversals; r++) {
        const start = Math.floor(advancedRandom() * (this.triviaQuestions.length - 2));
        const end = start + Math.floor(advancedRandom() * (this.triviaQuestions.length - start - 1)) + 1;
        
        // Reverse subsection
        for (let i = start; i < start + Math.floor((end - start) / 2); i++) {
          const temp = this.triviaQuestions[i];
          this.triviaQuestions[i] = this.triviaQuestions[end - (i - start)];
          this.triviaQuestions[end - (i - start)] = temp;
        }
      }
    }

    // Final mega-shuffle using all entropy sources
    for (let finalPass = 0; finalPass < 3; finalPass++) {
      for (let i = this.triviaQuestions.length - 1; i > 0; i--) {
        // Use all random sources combined
        const ultraRandom = (Math.random() + advancedRandom() + (Date.now() % 1000) / 1000) / 3;
        const j = Math.floor(ultraRandom * (i + 1));
        [this.triviaQuestions[i], this.triviaQuestions[j]] = [this.triviaQuestions[j], this.triviaQuestions[i]];
      }
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
      // For non-true/false questions, use the existing shuffling logic
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
    }

    return shuffledQuestion;
  }

  private endGame(): void {
    
    // Reset the game to pre-game configuration screen
    this.isRunning = false;
    this.stopTimer();

    // Hide all game UI elements
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.isShowingLeaderboard = false;

    // Show the configuration screen instead of "Game Complete!" message
    this.showConfigBinding.set(true);
    this.showErrorBinding.set(false);
    
    // Broadcast UI state update to show config screen
    this.sendNetworkBroadcastEvent(triviaUIStateEvent, {
      showConfig: true,
      showResults: false,
      showWaiting: false,
      showLeaderboard: false,
      showError: false
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

    // Clear player tracking
    this.playersAnswered.clear();

    // Notify TriviaPhones that the game has ended and reset to pre-game
    this.sendNetworkBroadcastEvent(triviaGameEndEvent, {
      hostId: this.hostPlayerId || 'unknown'
    });
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
    
    // Broadcast initial player tracking state
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: Array.from(this.playersInWorld),
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
    
    // Track this player as having answered
    this.playersAnswered.add(eventData.playerId);
    
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
    
    // Update answer count immediately
    this.answerCountBinding.set(this.playersAnswered.size.toString());
    
    // Broadcast player tracking update to all clients
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: Array.from(this.playersInWorld),
      playersAnswered: Array.from(this.playersAnswered),
      answerCount: this.playersAnswered.size
    });
    
    // Check if all current players have answered (use dynamic player count)
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
          // Check if this phone's player answered
          const phonePlayerId = triviaPhone.assignedPlayer?.id.toString();
          const playerAnswered = phonePlayerId ? this.playersAnswered.has(phonePlayerId) : false;
          
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
          // Check if this phone's player answered
          const phonePlayerId = triviaPhone.assignedPlayer?.id.toString();
          const playerAnswered = phonePlayerId ? this.playersAnswered.has(phonePlayerId) : false;
          
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
      if (this.playersInWorld.has(playerId)) {
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

  private advanceToNextQuestion(): void {
    
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
    
    // Show the next question (this will send network event to all TriviaPhones)
    this.showNextQuestion();
  }

  private async onSettingsUpdate(eventData: { hostId: string, settings: { numberOfQuestions: number, category: string, difficulty: string, timeLimit: number, autoAdvance: boolean, muteDuringQuestions: boolean, isLocked: boolean } }): Promise<void> {
    
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
    
    // Update questions based on new category and difficulty (now async with lazy loading)
    await this.updateQuestionsForCategory(this.gameConfig.category, this.gameConfig.difficulty);
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

    // Ultra-randomize questions for completely unique order every game
    // Multiple shuffle passes with different timing for maximum entropy
    this.shuffleQuestions();
    
    // Additional delayed shuffles with different entropy at each time point
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
                      text: 'Players Ready',
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
                          width: '100%',
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          justifyContent: 'center'
                        },
                        children: this.createStaticPlayersComponents()
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
                                  // Timer on the left
                                  View({
                                    style: {
                                      width: 45, // Increased from 35 to 45
                                      height: 45, // Increased from 35 to 45
                                      backgroundColor: '#FF6B35',
                                      borderRadius: 22.5, // Increased from 17.5 to 22.5
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    },
                                    children: Text({
                                      text: this.timerBinding,
                                      style: {
                                        fontSize: 16, // Increased from 12 to 16
                                        fontWeight: 'bold',
                                        color: 'white'
                                      }
                                    })
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
                                  // Timer on the left
                                  View({
                                    style: {
                                      width: 45, // Increased from 35 to 45
                                      height: 45, // Increased from 35 to 45
                                      backgroundColor: '#FF6B35',
                                      borderRadius: 22.5, // Increased from 17.5 to 22.5
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    },
                                    children: Text({
                                      text: this.timerBinding,
                                      style: {
                                        fontSize: 16, // Increased from 12 to 16
                                        fontWeight: 'bold',
                                        color: 'white'
                                      }
                                    })
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
                                  // Timer on the left
                                  View({
                                    style: {
                                      width: 45, // Increased from 35 to 45
                                      height: 45, // Increased from 35 to 45
                                      backgroundColor: '#FF6B35',
                                      borderRadius: 22.5, // Increased from 17.5 to 22.5
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    },
                                    children: Text({
                                      text: this.timerBinding,
                                      style: {
                                        fontSize: 16, // Increased from 12 to 16
                                        fontWeight: 'bold',
                                        color: 'white'
                                      }
                                    })
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
                                View({
                                  style: {
                                    width: 45, // Increased from 35 to 45
                                    height: 45, // Increased from 35 to 45
                                    backgroundColor: '#FF6B35',
                                    borderRadius: 22.5, // Increased from 17.5 to 22.5
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  },
                                  children: Text({
                                    text: this.timerBinding,
                                    style: {
                                      fontSize: 16, // Increased from 12 to 16
                                      fontWeight: 'bold',
                                      color: 'white'
                                    }
                                  })
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
                                this.createAnswerButton(0, '#DC2626', '1290982519195562'),
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
                                this.createAnswerButton(1, '#2563EB', '764343253011569'),
                                this.createBlankButton()
                              )
                            }),

                            // Answer 2 (Yellow/Circle) - Option 3 - show answer 0 for 2-answer questions, answer 2 for 3+ answer questions
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginRight: 6,
                                marginBottom: 6,
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count === 2),
                                // For 2-answer questions: show answer 0 in position 3
                                UINode.if(
                                  this.answerTexts[2].derive(text => text !== ''),
                                  this.createAnswerButton(2, '#EAB308', '797899126007085'),
                                  this.createBlankButton()
                                ),
                                // For 3+ answer questions: show answer 2 in position 3
                                UINode.if(
                                  this.answerTexts[2].derive(text => text !== ''),
                                  this.createAnswerButton(2, '#EAB308', '797899126007085'),
                                  this.createBlankButton()
                                )
                              )
                            }),

                            // Answer 3 (Green/Square) - Option 4 - show answer 1 for 2-answer questions, answer 3 for 3+ answer questions
                            View({
                              style: {
                                width: '48%',
                                height: 42,
                                marginBottom: 6,
                              },
                              children: UINode.if(
                                this.answerCountTracking.derive(count => count === 2),
                                // For 2-answer questions: show answer 1 in position 4
                                UINode.if(
                                  this.answerTexts[3].derive(text => text !== ''),
                                  this.createAnswerButton(3, '#16A34A', '1286736292915198'),
                                  this.createBlankButton()
                                ),
                                // For 3+ answer questions: show answer 3 in position 4
                                UINode.if(
                                  this.answerTexts[3].derive(text => text !== ''),
                                  this.createAnswerButton(3, '#16A34A', '1286736292915198'),
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
            const hasPlayerAtIndex = i < currentPlayers.length;
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
                  overflow: 'hidden'
                },
                children: [
                  // Show headshot if available
                  UINode.if(
                    this.playersUpdateTrigger.derive(() => {
                      const currentPlayers = this.world.getPlayers();
                      if (i < currentPlayers.length) {
                        const player = currentPlayers[i];
                        const playerId = player.id.toString();
                        const hasHeadshot = this.playerHeadshots.has(playerId) && this.playerHeadshots.get(playerId) !== null;
                        return hasHeadshot;
                      }
                      return false;
                    }),
                    Image({
                      source: this.playersUpdateTrigger.derive(() => {
                        const currentPlayers = this.world.getPlayers();
                        if (i < currentPlayers.length) {
                          const player = currentPlayers[i];
                          const playerId = player.id.toString();
                          const headshot = this.playerHeadshots.get(playerId);
                          return headshot || ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                        }
                        return ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(0)));
                      }),
                      style: {
                        width: 48,
                        height: 48,
                        borderRadius: 8
                      }
                    })
                  ),
                  // Show initial letter as fallback
                  UINode.if(
                    this.playersUpdateTrigger.derive(() => {
                      const currentPlayers = this.world.getPlayers();
                      if (i < currentPlayers.length) {
                        const player = currentPlayers[i];
                        const playerId = player.id.toString();
                        const hasHeadshot = this.playerHeadshots.has(playerId) && this.playerHeadshots.get(playerId) !== null;
                        return !hasHeadshot; // Show letter when no headshot
                      }
                      return false;
                    }),
                    Text({
                      text: this.playersUpdateTrigger.derive(() => {
                        const currentPlayers = this.world.getPlayers();
                        if (i < currentPlayers.length) {
                          const player = currentPlayers[i];
                          return player.name.get().charAt(0).toUpperCase();
                        }
                        return "";
                      }),
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
                text: this.playersUpdateTrigger.derive(() => {
                  const currentPlayers = this.world.getPlayers();
                  if (i < currentPlayers.length) {
                    const player = currentPlayers[i];
                    return player.name.get();
                  }
                  return "";
                }),
                style: {
                  fontSize: 10,
                  color: 'black',
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
    
    // Add empty state when no players
    components.push(
      UINode.if(
        this.playersUpdateTrigger.derive(() => {
          const currentPlayers = this.world.getPlayers();
          const isEmpty = currentPlayers.length === 0;
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
            text: 'No players yet...',
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

  private onGameReset(event: { hostId: string }): void {
    
    // Reset the game to pre-game configuration screen
    this.isRunning = false;
    this.stopTimer();
    
    // Reset all game state
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.isShowingResults = false;
    this.isShowingLeaderboard = false;
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    
    // Show the configuration screen
    this.showConfigBinding.set(true);
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
    
    // Clear player tracking
    this.playersAnswered.clear();
    this.playerScores.clear();
    this.localPlayerScores.clear();
    
    // Note: persistentLeaderboardScores are NOT cleared - they persist across games
  }

  private async onAwardPoints(event: { playerId: string; points: number }): Promise<void> {
    try {
      // Find the player by ID
      const player = this.world.getPlayers().find(p => p.id.toString() === event.playerId);
      
      // Update persistent leaderboard directly with player ID
      const playerId = event.playerId;
      const currentCorrectAnswers = this.persistentLeaderboardScores.get(playerId) || 0;
      this.persistentLeaderboardScores.set(playerId, currentCorrectAnswers + 1);
      
      const leaderboardName = "Trivia";
      if (player) {
        // Update native leaderboard with player object
        this.world.leaderboards.setScoreForPlayer(leaderboardName, player, currentCorrectAnswers + 1, true);
      }
      
      // Send network event to update leaderboard.ts
      this.sendNetworkBroadcastEvent(leaderboardScoreUpdateEvent, {
        playerId: playerId,
        score: currentCorrectAnswers + 1,
        leaderboardName: leaderboardName
      });
      
      // Update local game score cache
      const currentGamePoints = this.localPlayerScores.get(event.playerId) || 0;
      this.localPlayerScores.set(event.playerId, currentGamePoints + event.points);
    } catch (error) {
    }
  }

  // Phone management methods
  private discoverPhoneEntities(): void {
    // Find all entities in the world with the "TriviaPhone" tag
    const allEntitiesInWorld = this.world.getEntitiesWithTags(['TriviaPhone']);

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

    // Assign phones to existing players and update players list
    const existingPlayers = this.world.getPlayers();
    this.currentPlayers = existingPlayers.map(player => ({
      id: player.id.toString(),
      name: player.name.get()
    }));
    
    // Initialize the reactive binding with current players
    this.playersListBinding.set([...this.currentPlayers]);
    
    existingPlayers.forEach(player => {
      this.assignPhoneToPlayer(player);
    });
  }

  private onPlayerEnter(player: hz.Player): void {
    this.assignPhoneToPlayer(player);
    
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
    
    // Update playersInWorld Set for dynamic answer counting during active questions
    this.playersInWorld.add(player.id.toString());
    
    // Broadcast updated player tracking to all clients
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: Array.from(this.playersInWorld),
      playersAnswered: Array.from(this.playersAnswered),
      answerCount: this.playersAnswered.size
    });
    
    // Trigger UI update
    this.updateTriggerCounter++;
    this.playersUpdateTrigger.set(this.updateTriggerCounter);
    
    // Detect host player when a new player joins (only if no host is set yet)
    this.detectHostPlayer();
  }

  private onPlayerExit(player: hz.Player): void {
    this.releasePlayerPhone(player);
    
    // Clean up player headshot from cache
    const playerId = player.id.toString();
    this.playerHeadshots.delete(playerId);
    
    // Update players list for UI
    const currentPlayers = this.world.getPlayers().filter(p => p.id.toString() !== player.id.toString());
    this.currentPlayers = currentPlayers.map(p => ({
      id: p.id.toString(),
      name: p.name.get()
    }));
    
    // Update the reactive binding for UI updates
    this.playersListBinding.set([...this.currentPlayers]);
    
    // Update playersInWorld Set for dynamic answer counting during active questions
    this.playersInWorld.delete(playerId);
    
    // Remove player from answered set if they were answering
    this.playersAnswered.delete(playerId);
    
    // Broadcast updated player tracking to all clients
    this.sendNetworkBroadcastEvent(triviaPlayerUpdateEvent, {
      playersInWorld: Array.from(this.playersInWorld),
      playersAnswered: Array.from(this.playersAnswered),
      answerCount: this.playersAnswered.size
    });
    
    // Update answer count binding
    this.answerCountBinding.set(this.playersAnswered.size.toString());
    
    // Check if all remaining players have answered after player left
    if (this.playersAnswered.size >= this.playersInWorld.size && this.playersInWorld.size > 0) {
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
    // Update player tracking from network event
    this.playersInWorld.clear();
    eventData.playersInWorld.forEach(playerId => {
      this.playersInWorld.add(playerId);
    });

    this.playersAnswered.clear();
    eventData.playersAnswered.forEach(playerId => {
      this.playersAnswered.add(playerId);
    });

    // Update answer count binding
    this.answerCountBinding.set(eventData.answerCount.toString());
  }

  private onUIStateUpdate(eventData: { showConfig: boolean, showResults: boolean, showWaiting: boolean, showLeaderboard: boolean, showError: boolean, errorMessage?: string }): void {
    // Update UI state bindings from network event
    this.showConfigBinding.set(eventData.showConfig);
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

      // Asset Pool Gizmo will handle ownership assignment automatically
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

      // Asset Pool Gizmo will handle ownership removal automatically

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
