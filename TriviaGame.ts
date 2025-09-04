import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';
import { View, Text, Pressable, Binding, UINode, Image, ImageSource } from 'horizon/ui';

// Interface for trivia question data from JSON asset
interface TriviaQuestion {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  answers: {
    text: string;
    correct: boolean;
  }[];
}

// SerializableState-compatible interfaces for network events
interface SerializableQuestion {
  [key: string]: hz.SerializableState;
  id: number;
  question: string;
  category: string;
  difficulty: string;
  answers: Array<{ text: string; correct: boolean }>;
}

// Network events for syncing with the world trivia system
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: SerializableQuestion, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: SerializableQuestion, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');
const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{ playerId: string, answerIndex: number, responseTime: number }>('triviaAnswerSubmitted');
const triviaGameStartEvent = new hz.NetworkEvent<{ hostId: string, config: any }>('triviaGameStart');

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
  private questionBinding = new Binding("Waiting for question...");
  private answerTexts = [
    new Binding(""),
    new Binding(""),
    new Binding(""),
    new Binding("")
  ];
  private showResultsBinding = new Binding(false);
  private showWaitingBinding = new Binding(false);
  private showLeaderboardBinding = new Binding(false);
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
  private triviaQuestions: TriviaQuestion[] = [...defaultTriviaQuestions];
  private currentQuestionIndex: number = 0;
  private currentQuestion: TriviaQuestion | null = null;
  private timeRemaining: number = 30;
  private totalAnswers: number = 0;
  private isRunning: boolean = false;

  // Player tracking for waiting logic
  private playersInWorld: Set<string> = new Set();
  private playersAnswered: Set<string> = new Set();
  private hasLocalPlayerAnswered: boolean = false;

  // Timer management
  private timerInterval: number | null = null;
  private roundTimeoutId: number | null = null;
  private gameLoopTimeoutId: number | null = null;

  async start() {
    
    // Load trivia questions from asset if provided, otherwise use defaults
    if (this.props.triviaAsset) {
      await this.loadTriviaQuestions();
    }
    
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
        console.log("Failed to load general questions, using defaults");
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
        console.log("Failed to load history questions, using defaults");
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
        console.log("Failed to load science questions, using defaults");
      }
    }

    // If no assets loaded, use default questions
    if (this.generalQuestions.length === 0 && this.historyQuestions.length === 0 && this.scienceQuestions.length === 0) {
      this.generalQuestions = [...defaultTriviaQuestions];
    }

    // Set default category to General and filter questions
    this.updateQuestionsForCategory("General", "easy");
  }

  private updateQuestionsForCategory(category: string, difficulty: string): void {
    let allQuestions: TriviaQuestion[] = [];

    // Collect questions from selected category
    switch (category.toLowerCase()) {
      case "general":
        allQuestions = [...this.generalQuestions];
        break;
      case "history":
        allQuestions = [...this.historyQuestions];
        break;
      case "science":
        allQuestions = [...this.scienceQuestions];
        break;
      default:
        allQuestions = [...this.generalQuestions, ...this.historyQuestions, ...this.scienceQuestions];
        break;
    }

    // Filter by difficulty if specified
    if (difficulty !== "all") {
      allQuestions = allQuestions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    // If no questions match the filter, use all questions from the category
    if (allQuestions.length === 0) {
      switch (category.toLowerCase()) {
        case "general":
          allQuestions = [...this.generalQuestions];
          break;
        case "history":
          allQuestions = [...this.historyQuestions];
          break;
        case "science":
          allQuestions = [...this.scienceQuestions];
          break;
        default:
          allQuestions = [...this.generalQuestions, ...this.historyQuestions, ...this.scienceQuestions];
          break;
      }
    }

    // If still no questions, use defaults
    if (allQuestions.length === 0) {
      allQuestions = [...defaultTriviaQuestions];
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
    this.timerBinding.set(this.props.questionTimeLimit.toString());
    this.answerCountBinding.set("0");
    this.questionBinding.set("Starting trivia game...");
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);

    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }

    // Reset answer button colors
    this.answerButtonColors[0].set('#DC2626');
    this.answerButtonColors[1].set('#2563EB');
    this.answerButtonColors[2].set('#EAB308');
    this.answerButtonColors[3].set('#16A34A');

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

    this.isRunning = true;
    this.currentQuestionIndex = 0;

    // Reset game state for new game
    this.resetGameState();

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
    // Don't reset answer count here - let it persist during results display
    this.showResultsBinding.set(false);

    // Update answer options with shuffled answers
    for (let i = 0; i < 4; i++) {
      if (i < shuffledQuestion.answers.length) {
        this.answerTexts[i].set(shuffledQuestion.answers[i].text);
      } else {
        this.answerTexts[i].set("");
      }
    }
    
    // Reset answer button colors to defaults
    this.answerButtonColors[0].set('#DC2626'); // Red
    this.answerButtonColors[1].set('#2563EB'); // Blue
    this.answerButtonColors[2].set('#EAB308'); // Yellow
    this.answerButtonColors[3].set('#16A34A'); // Green

    // Send question to TriviaApp and other components
    const serializableQuestion: SerializableQuestion = {
      id: shuffledQuestion.id,
      question: shuffledQuestion.question,
      category: shuffledQuestion.category,
      difficulty: shuffledQuestion.difficulty,
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
        category: this.currentQuestion.category,
        difficulty: this.currentQuestion.difficulty,
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
    this.showLeaderboardBinding.set(false);
    
    // Get current players in world
    const currentPlayers = this.world.getPlayers();
    this.playersInWorld.clear();
    currentPlayers.forEach(player => {
      this.playersInWorld.add(player.id.toString());
    });
    
    // Update UI bindings
    this.questionNumberBinding.set(`Q${eventData.questionIndex + 1}`);
    this.questionBinding.set(eventData.question.question);
    // Don't reset answer count here - let it persist during results display
    this.showResultsBinding.set(false);
    
    // Update answer options
    const answers = eventData.question.answers;
    for (let i = 0; i < 4; i++) {
      if (i < answers.length) {
        this.answerTexts[i].set(answers[i].text);
      } else {
        this.answerTexts[i].set("");
      }
    }
    
    // Reset answer button colors to defaults
    this.answerButtonColors[0].set('#DC2626'); // Red
    this.answerButtonColors[1].set('#2563EB'); // Blue
    this.answerButtonColors[2].set('#EAB308'); // Yellow
    this.answerButtonColors[3].set('#16A34A'); // Green
    
    // Reset answer count when starting new question
    this.answerCountBinding.set("0");
    
    // Start countdown timer
    this.startTimer();
  }

  private onQuestionResults(eventData: { question: SerializableQuestion, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }): void {
    
    this.showResultsBinding.set(true);
    this.showWaitingBinding.set(false); // Hide waiting screen when results come in
    this.correctAnswerBinding.set(eventData.correctAnswerIndex);
    this.answerCountsBinding.set(eventData.answerCounts);
    
    // Calculate total answers
    this.totalAnswers = eventData.answerCounts.reduce((sum, count) => sum + count, 0);
    this.answerCountBinding.set(this.totalAnswers.toString());
    
    // Stop timer
    this.stopTimer();
    
    // Clear results after a few seconds
    this.async.setTimeout(() => {
      this.showResultsBinding.set(false);
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
    
    // Update answer button colors for results
    for (let i = 0; i < 4; i++) {
      if (i === correctAnswerIndex) {
        this.answerButtonColors[i].set('#16A34A'); // Green for correct
      } else {
        this.answerButtonColors[i].set('#DC2626'); // Red for incorrect
      }
    }
    
    // Convert question to serializable format
    const serializableQuestion: SerializableQuestion = {
      id: this.currentQuestion.id,
      question: this.currentQuestion.question,
      category: this.currentQuestion.category,
      difficulty: this.currentQuestion.difficulty,
      answers: this.currentQuestion.answers
    };
    
    // Call TriviaApp instances directly via world reference
    const triviaApps = (this.world as any).triviaApps;
    
    // Also check global registry as backup
    const globalTriviaApps = (globalThis as any).triviaAppInstances || [];
    
    // Also send network event for TriviaApp instances that might be listening
    // Use actual answer count in a way that won't reset our display
    const actualAnswerCounts = [0, 0, 0, 0];
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
    
    // After 5 seconds, show leaderboard (but don't auto-advance to next question)
    this.async.setTimeout(() => {
      this.showLeaderboard();
    }, 5000);
  }

  private async showLeaderboard(): Promise<void> {
    
    // Hide results, show leaderboard
    this.showResultsBinding.set(false);
    this.showLeaderboardBinding.set(true);
    
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
      category: this.currentQuestion.category,
      difficulty: this.currentQuestion.difficulty,
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
    
    // Clear any previous results state
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    
    // Reset players answered tracking for new question
    this.playersAnswered.clear();
    
    // Move to next question
    this.currentQuestionIndex++;
    
    // Show the next question (this will send network event to all TriviaApps)
    this.showNextQuestion();
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

    // Apply current configuration
    this.timeRemaining = this.gameConfig.timeLimit;
    this.timerBinding.set(this.gameConfig.timeLimit.toString());

    // Start the trivia game
    this.startContinuousGame();
  }

  private onGameStart(data: { hostId: string, config: any }): void {
    
    // Update configuration
    this.gameConfig = data.config;
    this.gameConfigBinding.set(this.gameConfig);
    
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

  private handleDifficultyChange(difficulty: string): void {
    this.gameConfig.difficulty = difficulty;
    this.selectedDifficultyBinding.set(difficulty);
    this.gameConfigBinding.set(this.gameConfig);
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
        aspectRatio: 16/9, // 16:9 aspect ratio matching TriviaUIReference
        backgroundColor: '#F3F4F6', // Gray-100 background
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8
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
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center'
            },
            children: [
              // Title
              View({
                style: {
                  position: 'absolute',
                  top: '15%',
                  left: 0,
                  right: 0,
                  alignItems: 'center'
                },
                children: Text({
                  text: 'Trivia Game Configuration',
                  style: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#1F2937',
                    textAlign: 'center'
                  }
                })
              }),

              // Host indicator
              View({
                style: {
                  position: 'absolute',
                  top: '25%',
                  left: 0,
                  right: 0,
                  alignItems: 'center'
                },
                children: Text({
                  text: this.isLocalPlayerHostBinding.derive(isHost => 
                    isHost ? '👑 You are the host' : '👥 Waiting for host to start...'
                  ),
                  style: {
                    fontSize: 16,
                    color: '#6B7280',
                    textAlign: 'center'
                  }
                })
              }),

              // Configuration panel (only visible to host)
              UINode.if(
                this.isLocalPlayerHostBinding,
                View({
                  style: {
                    position: 'absolute',
                    top: '35%',
                    left: '20%',
                    right: '20%',
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    shadowColor: 'black',
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    shadowOffset: [0, 4]
                  },
                  children: [
                    // Time limit setting
                    View({
                      style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12
                      },
                      children: [
                        Text({
                          text: 'Time per question:',
                          style: {
                            fontSize: 14,
                            color: '#1F2937'
                          }
                        }),
                        Text({
                          text: this.gameConfigBinding.derive(config => `${config.timeLimit}s`),
                          style: {
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#6366F1'
                          }
                        })
                      ]
                    }),

                    // Category selection
                    View({
                      style: {
                        marginBottom: 12
                      },
                      children: [
                        Text({
                          text: 'Category:',
                          style: {
                            fontSize: 14,
                            color: '#1F2937',
                            marginBottom: 4
                          }
                        }),
                        View({
                          style: {
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                          },
                          children: [
                            // General button
                            Pressable({
                              onPress: () => this.handleCategoryChange('General'),
                              style: {
                                backgroundColor: this.selectedCategoryBinding.derive(cat => cat === 'General' ? '#6366F1' : '#E5E7EB'),
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                marginRight: 4
                              },
                              children: Text({
                                text: 'General',
                                style: {
                                  fontSize: 12,
                                  color: this.selectedCategoryBinding.derive(cat => cat === 'General' ? 'white' : '#1F2937')
                                }
                              })
                            }),
                            // History button
                            Pressable({
                              onPress: () => this.handleCategoryChange('History'),
                              style: {
                                backgroundColor: this.selectedCategoryBinding.derive(cat => cat === 'History' ? '#6366F1' : '#E5E7EB'),
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                marginRight: 4
                              },
                              children: Text({
                                text: 'History',
                                style: {
                                  fontSize: 12,
                                  color: this.selectedCategoryBinding.derive(cat => cat === 'History' ? 'white' : '#1F2937')
                                }
                              })
                            }),
                            // Science button
                            Pressable({
                              onPress: () => this.handleCategoryChange('Science'),
                              style: {
                                backgroundColor: this.selectedCategoryBinding.derive(cat => cat === 'Science' ? '#6366F1' : '#E5E7EB'),
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6
                              },
                              children: Text({
                                text: 'Science',
                                style: {
                                  fontSize: 12,
                                  color: this.selectedCategoryBinding.derive(cat => cat === 'Science' ? 'white' : '#1F2937')
                                }
                              })
                            })
                          ]
                        })
                      ]
                    }),

                    // Difficulty selection
                    View({
                      style: {
                        marginBottom: 12
                      },
                      children: [
                        Text({
                          text: 'Difficulty:',
                          style: {
                            fontSize: 14,
                            color: '#1F2937',
                            marginBottom: 4
                          }
                        }),
                        View({
                          style: {
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                          },
                          children: [
                            // Easy button
                            Pressable({
                              onPress: () => this.handleDifficultyChange('easy'),
                              style: {
                                backgroundColor: this.selectedDifficultyBinding.derive(diff => diff === 'easy' ? '#10B981' : '#E5E7EB'),
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                marginRight: 4
                              },
                              children: Text({
                                text: 'Easy',
                                style: {
                                  fontSize: 12,
                                  color: this.selectedDifficultyBinding.derive(diff => diff === 'easy' ? 'white' : '#1F2937')
                                }
                              })
                            }),
                            // Medium button
                            Pressable({
                              onPress: () => this.handleDifficultyChange('medium'),
                              style: {
                                backgroundColor: this.selectedDifficultyBinding.derive(diff => diff === 'medium' ? '#F59E0B' : '#E5E7EB'),
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                marginRight: 4
                              },
                              children: Text({
                                text: 'Medium',
                                style: {
                                  fontSize: 12,
                                  color: this.selectedDifficultyBinding.derive(diff => diff === 'medium' ? 'white' : '#1F2937')
                                }
                              })
                            }),
                            // Hard button
                            Pressable({
                              onPress: () => this.handleDifficultyChange('hard'),
                              style: {
                                backgroundColor: this.selectedDifficultyBinding.derive(diff => diff === 'hard' ? '#EF4444' : '#E5E7EB'),
                                borderRadius: 6,
                                paddingHorizontal: 12,
                                paddingVertical: 6
                              },
                              children: Text({
                                text: 'Hard',
                                style: {
                                  fontSize: 12,
                                  color: this.selectedDifficultyBinding.derive(diff => diff === 'hard' ? 'white' : '#1F2937')
                                }
                              })
                            })
                          ]
                        })
                      ]
                    }),

                    // Number of questions setting
                    View({
                      style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      },
                      children: [
                        Text({
                          text: 'Number of questions:',
                          style: {
                            fontSize: 14,
                            color: '#1F2937'
                          }
                        }),
                        Text({
                          text: this.gameConfigBinding.derive(config => config.numQuestions.toString()),
                          style: {
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#6366F1'
                          }
                        })
                      ]
                    })
                  ]
                })
              ),

              // Start button (only visible to host)
              UINode.if(
                this.isLocalPlayerHostBinding,
                View({
                  style: {
                    position: 'absolute',
                    bottom: '20%',
                    left: '30%',
                    right: '30%'
                  },
                  children: Pressable({
                    onPress: () => this.handleStartGame(),
                    style: {
                      backgroundColor: '#10B981', // Green-500
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      alignItems: 'center',
                      shadowColor: 'black',
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      shadowOffset: [0, 2]
                    },
                    children: Text({
                      text: 'Start Trivia Game',
                      style: {
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: 'white'
                      }
                    })
                  })
                })
              )
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
              // Header with question number - centered at top
              View({
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F3F4F6'
                },
                children: Text({
                  text: this.questionNumberBinding,
                  style: {
                    fontSize: 20,
                    fontWeight: '500',
                    color: '#FF6B35' // Orange-500 color
                  }
                })
              }),

              // Timer - positioned at left, aligned with question
              View({
                style: {
                  position: 'absolute',
                  left: '8%',
                  top: '25%',
                  width: 40,
                  height: 40,
                  backgroundColor: '#FF6B35', // Orange-500
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center'
                },
                children: Text({
                  text: this.timerBinding,
                  style: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: 'white'
                  }
                })
              }),

              // Answer count - positioned at right, aligned with question
              View({
                style: {
                  position: 'absolute',
                  right: '8%',
                  top: '25%',
                  alignItems: 'center'
                },
                children: [
                  Text({
                    text: this.answerCountBinding,
                    style: {
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: '#1F2937' // Gray-800
                    }
                  }),
                  Text({
                    text: 'Answers',
                    style: {
                      fontSize: 10,
                      color: '#6B7280' // Gray-600
                    }
                  })
                ]
              }),

              // Question - positioned in center area, moved up
              View({
                style: {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '20%',
                  bottom: '60%',
                  alignItems: 'center',
                  justifyContent: 'center'
                },
                children: View({
                  style: {
                    backgroundColor: 'white',
                    borderRadius: 6,
                    shadowColor: 'black',
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    shadowOffset: [0, 2],
                    padding: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '60%' // Prevent it from getting too wide
                  },
                  children: Text({
                    text: this.questionBinding,
                    style: {
                      fontSize: 16,
                      fontWeight: '500',
                      color: 'black',
                      textAlign: 'center'
                    }
                  })
                })
              }),

              // Answer options grid - positioned at bottom with compact spacing
              View({
                style: {
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  right: 8,
                  height: 120
                },
                children: [
                  // Top row
                  View({
                    style: {
                      width: '100%',
                      height: 50,
                      flexDirection: 'row',
                      marginBottom: 8
                    },
                    children: [
                      // Red answer (Triangle)
                      View({
                        style: { width: '48%', marginRight: '4%' },
                        children: this.createAnswerButton(0, '#DC2626', '1290982519195562')
                      }),
                      
                      // Blue answer (Star)  
                      View({
                        style: { width: '48%' },
                        children: this.createAnswerButton(1, '#2563EB', '764343253011569')
                      })
                    ]
                  }),
                  
                  // Bottom row
                  View({
                    style: {
                      width: '100%',
                      height: 50,
                      flexDirection: 'row'
                    },
                    children: [
                      // Yellow answer (Circle)
                      View({
                        style: { width: '48%', marginRight: '4%' },
                        children: this.createAnswerButton(2, '#EAB308', '797899126007085')
                      }),
                      
                      // Green answer (Square) 
                      View({
                        style: { width: '48%' },
                        children: this.createAnswerButton(3, '#16A34A', '1286736292915198')
                      })
                    ]
                  })
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
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent overlay
                  alignItems: 'center',
                  justifyContent: 'center',
                  display: this.showWaitingBinding.derive(show => show ? 'flex' : 'none')
                },
                children: View({
                  style: {
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 24,
                    alignItems: 'center',
                    maxWidth: '80%'
                  },
                  children: [
                    Text({
                      text: 'Waiting for Other Players...',
                      style: {
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#1F2937',
                        marginBottom: 8,
                        textAlign: 'center'
                      }
                    }),
                    Text({
                      text: 'Please wait while other players submit their answers',
                      style: {
                        fontSize: 14,
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
                  backgroundColor: '#F3F4F6', // Light gray background like main UI
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
                          fontSize: 20,
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
                      bottom: 12,
                      left: '15%',
                      right: '15%',
                      flexDirection: 'column'
                    },
                    children: [
                      // Player 1
                      UINode.if(
                        this.leaderboardDataBinding.derive(players => players.length > 0),
                        View({
                          style: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: 'black',
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            shadowOffset: [0, 2]
                          },
                          children: [
                            // Left side: rank and name
                            View({
                              style: {
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 1
                              },
                              children: [
                                // Rank
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
                                
                                // Player headshot (if available)
                                UINode.if(
                                  this.leaderboardDataBinding.derive(players => 
                                    players.length > 0 && players[0].headshotImageSource
                                  ),
                                  Image({
                                    source: this.leaderboardDataBinding.derive(players => 
                                      players.length > 0 && players[0].headshotImageSource ? players[0].headshotImageSource : null
                                    ),
                                    style: {
                                      width: 32,
                                      height: 32,
                                      borderRadius: 16,
                                      marginRight: 8
                                    }
                                  })
                                ),
                                
                                // Player name
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
                            
                            // Right side: score
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
                      
                      // Player 2
                      UINode.if(
                        this.leaderboardDataBinding.derive(players => players.length > 1),
                        View({
                          style: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: 'black',
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            shadowOffset: [0, 2]
                          },
                          children: [
                            // Left side: rank and name
                            View({
                              style: {
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 1
                              },
                              children: [
                                // Rank
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
                                
                                // Player headshot (if available)
                                UINode.if(
                                  this.leaderboardDataBinding.derive(players => 
                                    players.length > 1 && players[1].headshotImageSource
                                  ),
                                  Image({
                                    source: this.leaderboardDataBinding.derive(players => 
                                      players.length > 1 && players[1].headshotImageSource ? players[1].headshotImageSource : null
                                    ),
                                    style: {
                                      width: 32,
                                      height: 32,
                                      borderRadius: 16,
                                      marginRight: 8
                                    }
                                  })
                                ),
                                
                                // Player name
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
                            
                            // Right side: score
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
                      
                      // Player 3
                      UINode.if(
                        this.leaderboardDataBinding.derive(players => players.length > 2),
                        View({
                          style: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            shadowColor: 'black',
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            shadowOffset: [0, 2]
                          },
                          children: [
                            // Left side: rank and name
                            View({
                              style: {
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 1
                              },
                              children: [
                                // Rank
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
                                
                                // Player headshot (if available)
                                UINode.if(
                                  this.leaderboardDataBinding.derive(players => 
                                    players.length > 2 && players[2].headshotImageSource
                                  ),
                                  Image({
                                    source: this.leaderboardDataBinding.derive(players => 
                                      players.length > 2 && players[2].headshotImageSource ? players[2].headshotImageSource : null
                                    ),
                                    style: {
                                      width: 32,
                                      height: 32,
                                      borderRadius: 16,
                                      marginRight: 8
                                    }
                                  })
                                ),
                                
                                // Player name
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
                            
                            // Right side: score
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
                      ),
                      
                      // Next button (only visible to host)
                      UINode.if(
                        this.isLocalPlayerHostBinding,
                        Pressable({
                          onPress: () => {
                            this.advanceToNextQuestion();
                          },
                          style: {
                            backgroundColor: '#3B82F6',
                            borderRadius: 8,
                            paddingVertical: 12,
                            paddingHorizontal: 24,
                            marginTop: 16,
                            alignItems: 'center',
                            shadowColor: 'black',
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            shadowOffset: [0, 2]
                          },
                          children: Text({
                            text: 'Next Question',
                            style: {
                              fontSize: 16,
                              fontWeight: 'bold',
                              color: 'white'
                            }
                          })
                        })
                      )
                    ]
                  })
                ]
              })
            ]
          })
        )
      ]
    });
  }

  private createAnswerButton(index: number, color: string, iconTextureId: string) {
    const textureAsset = new hz.TextureAsset(BigInt(iconTextureId));
    
    return View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: this.answerButtonColors[index],
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
      },
      children: [
        // Icon
        Image({
          source: ImageSource.fromTextureAsset(textureAsset),
          style: {
            width: 16,
            height: 16,
            marginRight: 8
          }
        }),
        
        // Answer text only (no results indicator)
        Text({
          text: this.answerTexts[index],
          style: {
            fontSize: 14,
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
    
    super.dispose();
  }
}

// Register the component so it can be attached to Custom UI gizmos
ui.UIComponent.register(TriviaGame);
