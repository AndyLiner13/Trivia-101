import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
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
const triviaResultsEvent = new hz.NetworkEvent<{ question: SerializableQuestion, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }>('triviaResults');
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
    // Reference to the trivia questions JSON asset
    triviaAsset: { type: hz.PropTypes.Asset, default: null },
    
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
  private leaderboardDataBinding = new Binding<Array<{name: string, score: number, playerId: string}>>([]);

  // Game configuration state
  private showConfigBinding = new Binding(true); // Show config screen initially
  private gameConfigBinding = new Binding({
    timeLimit: 30,
    autoAdvance: true,
    numQuestions: 10,
    category: "General",
    difficulty: "Medium"
  });
  private hostPlayerIdBinding = new Binding<string | null>(null);
  private isLocalPlayerHostBinding = new Binding(false);
  
  // Internal state variables (not bound to UI)
  private hostPlayerId: string | null = null;
  private isLocalPlayerHost: boolean = false;
  private gameConfig = {
    timeLimit: 30,
    autoAdvance: true,
    numQuestions: 10,
    category: "General",
    difficulty: "Medium"
  };

  // Game data
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
    console.log("TriviaGame: Starting up...");
    
    // Load trivia questions from asset if provided, otherwise use defaults
    if (this.props.triviaAsset) {
      await this.loadTriviaQuestions();
    } else {
      console.log("TriviaGame: Using default trivia questions");
    }
    
    // Set up network event listeners
    this.setupNetworkEvents();
    
    // Initialize the UI (shows config screen by default)
    this.initializeGameState();
    
    // Detect host player (first player to join)
    this.detectHostPlayer();
    
    console.log("TriviaGame: Initialized - showing configuration screen");
  }

  private async loadTriviaQuestions(): Promise<void> {
    if (!this.props.triviaAsset) {
      console.error("TriviaGame: No trivia asset assigned!");
      return;
    }

    try {
      // Try to load data from the asset
      const assetData = await (this.props.triviaAsset as any).fetchAsData();
      const jsonData = assetData.asJSON() as TriviaQuestion[];
      
      if (!jsonData || !Array.isArray(jsonData)) {
        throw new Error("Invalid JSON format - expected array of trivia questions");
      }

      this.triviaQuestions = jsonData;
      console.log(`TriviaGame: Loaded ${this.triviaQuestions.length} trivia questions`);
      
    } catch (error) {
      console.error("TriviaGame: Failed to load trivia questions:", error);
      this.questionBinding.set("Failed to load trivia questions. Please check the JSON asset format.");
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
  }

  private initializeGameState(): void {
    this.questionNumberBinding.set("Q1");
    this.timerBinding.set("30");
    this.answerCountBinding.set("0");
    this.questionBinding.set("Starting trivia game...");
    this.showResultsBinding.set(false);
    this.showWaitingBinding.set(false);
    this.showLeaderboardBinding.set(false);
    
    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }
    
    // Reset leaderboard
    this.leaderboardDataBinding.set([]);
  }

  private startContinuousGame(): void {
    if (this.triviaQuestions.length === 0) {
      console.error("TriviaGame: No questions available for continuous game");
      this.questionBinding.set("No questions available. Please add trivia questions.");
      return;
    }

    console.log("TriviaGame: Starting continuous trivia game");
    this.isRunning = true;
    this.currentQuestionIndex = 0;
    
    // Reset game state for new game
    this.initializeGameState();
    
    this.showNextQuestion();
  }

  private showNextQuestion(): void {
    if (!this.isRunning || this.triviaQuestions.length === 0) {
      return;
    }

    // Get random question or cycle through questions
    if (this.currentQuestionIndex >= this.triviaQuestions.length) {
      this.currentQuestionIndex = 0;
      // Shuffle questions for variety
      this.shuffleQuestions();
    }

    const question = this.triviaQuestions[this.currentQuestionIndex];
    this.currentQuestion = question;
    this.timeRemaining = this.props.questionTimeLimit;
    this.totalAnswers = 0;

    // Update UI bindings
    this.questionNumberBinding.set(`Q${this.currentQuestionIndex + 1}`);
    this.questionBinding.set(question.question);
    this.answerCountBinding.set("0");
    this.showResultsBinding.set(false);

    // Update answer options
    for (let i = 0; i < 4; i++) {
      if (i < question.answers.length) {
        this.answerTexts[i].set(question.answers[i].text);
      } else {
        this.answerTexts[i].set("");
      }
    }

    // Send question to TriviaApp and other components
    const serializableQuestion: SerializableQuestion = {
      id: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      answers: question.answers.map(a => ({ text: a.text, correct: a.correct }))
    };

    this.sendNetworkBroadcastEvent(triviaQuestionShowEvent, {
      question: serializableQuestion,
      questionIndex: this.currentQuestionIndex,
      timeLimit: this.props.questionTimeLimit
    });

    // Start countdown timer
    this.startTimer();

    // Schedule next question after time limit + results display time
    this.scheduleNextQuestion();

    console.log(`TriviaGame: Showing question ${this.currentQuestionIndex + 1}: ${question.question}`);
  }

  private shuffleQuestions(): void {
    // Simple shuffle algorithm
    for (let i = this.triviaQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.triviaQuestions[i], this.triviaQuestions[j]] = [this.triviaQuestions[j], this.triviaQuestions[i]];
    }
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

    // Find correct answer
    const correctAnswerIndex = this.currentQuestion.answers.findIndex(a => a.correct);
    
    // Show results
    this.showResultsBinding.set(true);
    this.correctAnswerBinding.set(correctAnswerIndex);
    
    // Mock answer counts for demonstration (in real implementation, these would come from player submissions)
    const mockAnswerCounts = [
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5), 
      Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 5)
    ];
    this.answerCountsBinding.set(mockAnswerCounts);
    
    // Calculate total answers
    this.totalAnswers = mockAnswerCounts.reduce((sum, count) => sum + count, 0);
    this.answerCountBinding.set(this.totalAnswers.toString());

    // Send results to TriviaApp and other components
    const serializableQuestion: SerializableQuestion = {
      id: this.currentQuestion.id,
      question: this.currentQuestion.question,
      category: this.currentQuestion.category,
      difficulty: this.currentQuestion.difficulty,
      answers: this.currentQuestion.answers.map(a => ({ text: a.text, correct: a.correct }))
    };

    this.sendNetworkBroadcastEvent(triviaResultsEvent, {
      question: serializableQuestion,
      correctAnswerIndex: correctAnswerIndex,
      answerCounts: mockAnswerCounts,
      scores: {}
    });

    console.log(`TriviaGame: Showing results for question ${this.currentQuestionIndex + 1}`);
  }

  private onQuestionStart(eventData: { question: SerializableQuestion, questionIndex: number, timeLimit: number }): void {
    console.log("TriviaGame: Question started", eventData);
    
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
    
    console.log(`TriviaGame: ${this.playersInWorld.size} players in world`);
    
    // Update UI bindings
    this.questionNumberBinding.set(`Q${eventData.questionIndex + 1}`);
    this.questionBinding.set(eventData.question.question);
    this.answerCountBinding.set("0");
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
    
    // Start countdown timer
    this.startTimer();
  }

  private onQuestionResults(eventData: { question: SerializableQuestion, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }): void {
    console.log("TriviaGame: Question results", eventData);
    
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
      this.questionBinding.set("Waiting for next question...");
    }, this.props.autoAdvanceTime * 1000);
  }

  private onPlayerAnswerSubmitted(eventData: { playerId: string, answerIndex: number, responseTime: number }): void {
    console.log("TriviaGame: Player answer submitted", eventData);
    
    // Track this player as having answered
    this.playersAnswered.add(eventData.playerId);
    
    // Update answer count immediately
    this.answerCountBinding.set(this.playersAnswered.size.toString());
    
    console.log(`TriviaGame: ${this.playersAnswered.size}/${this.playersInWorld.size} players have answered`);
    
    // Check if all players have answered
    if (this.playersAnswered.size >= this.playersInWorld.size && this.playersInWorld.size > 0) {
      console.log("TriviaGame: All players have answered, showing correct answers");
      this.showCorrectAnswersAndLeaderboard();
    }
  }

  private showCorrectAnswersAndLeaderboard(): void {
    if (!this.currentQuestion) return;
    
    // Stop timer and hide waiting screen
    this.stopTimer();
    this.showWaitingBinding.set(false);
    
    // Find the correct answer index
    const correctAnswerIndex = this.currentQuestion.answers.findIndex(answer => answer.correct);
    this.correctAnswerBinding.set(correctAnswerIndex);
    
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
    if (triviaApps && Array.isArray(triviaApps)) {
      console.log(`TriviaGame: Notifying ${triviaApps.length} TriviaApp instances of results`);
      triviaApps.forEach((triviaApp: any) => {
        if (triviaApp && typeof triviaApp.onTriviaResults === 'function') {
          triviaApp.onTriviaResults({
            question: serializableQuestion,
            correctAnswerIndex: correctAnswerIndex,
            answerCounts: [0, 0, 0, 0],
            scores: {}
          });
        }
      });
    }
    
    // Also send network event for other systems that might be listening
    this.sendNetworkBroadcastEvent(triviaResultsEvent, {
      question: serializableQuestion,
      correctAnswerIndex: correctAnswerIndex,
      answerCounts: [0, 0, 0, 0], // No vote counts in this implementation
      scores: {} // Simplified scores
    });
    
    console.log("TriviaGame: Sent results to TriviaApps");
    
    // Show results without vote counts (just correct/incorrect indicators)
    this.showResultsBinding.set(true);
    
    console.log("TriviaGame: Showing correct answers for 5 seconds");
    
    // After 5 seconds, show leaderboard
    this.async.setTimeout(() => {
      this.showLeaderboard();
    }, 5000);
  }

  private showLeaderboard(): void {
    console.log("TriviaGame: Showing leaderboard");
    
    // Hide results, show leaderboard
    this.showResultsBinding.set(false);
    this.showLeaderboardBinding.set(true);
    
    // Generate mock leaderboard data (in a real implementation, this would come from server)
    const mockLeaderboard = this.generateMockLeaderboard();
    this.leaderboardDataBinding.set(mockLeaderboard);
    
    // After 5 seconds, auto-advance to next question
    this.async.setTimeout(() => {
      this.advanceToNextQuestion();
    }, 5000);
  }

  private generateMockLeaderboard(): Array<{name: string, score: number, playerId: string}> {
    // Get actual players in the world
    const currentPlayers = this.world.getPlayers();
    const leaderboard: Array<{name: string, score: number, playerId: string}> = [];
    
    // Create leaderboard entries for each player with mock scores
    currentPlayers.forEach((player, index) => {
      const playerId = player.id.toString();
      if (this.playersInWorld.has(playerId)) {
        leaderboard.push({
          name: player.name.get() || `Player ${index + 1}`,
          score: Math.floor(Math.random() * 500) + 500, // Random score between 500-999
          playerId: playerId
        });
      }
    });
    
    // Add some mock players if we don't have enough real players
    const mockNames = ["Alex Johnson", "Sarah Davis", "Mike Chen", "Emma Wilson", "James Brown"];
    while (leaderboard.length < 3 && leaderboard.length < mockNames.length) {
      const index = leaderboard.length;
      leaderboard.push({
        name: mockNames[index],
        score: Math.floor(Math.random() * 400) + 300, // Lower scores for mock players
        playerId: `mock-${index}`
      });
    }
    
    // Sort by score descending
    return leaderboard.sort((a, b) => b.score - a.score);
  }

  private advanceToNextQuestion(): void {
    console.log("TriviaGame: Auto-advancing to next question");
    
    // Hide leaderboard
    this.showLeaderboardBinding.set(false);
    
    // Reset question state
    this.questionBinding.set("Waiting for next question...");
    
    // The next question will be triggered by the server via onQuestionStart
  }

  private detectHostPlayer(): void {
    const localPlayer = this.world.getLocalPlayer();
    if (!localPlayer) return;
    
    const allPlayers = this.world.getPlayers();
    console.log(`TriviaGame: Detecting host among ${allPlayers.length} players`);
    
    if (allPlayers.length === 0) {
      // No players yet, local player becomes host
      this.hostPlayerId = localPlayer.id.toString();
      this.isLocalPlayerHost = true;
      this.hostPlayerIdBinding.set(this.hostPlayerId);
      this.isLocalPlayerHostBinding.set(true);
      console.log("TriviaGame: Local player is the host (first to join)");
    } else {
      // Check if there's already a host or if local player is first
      if (!this.hostPlayerId) {
        // No host set yet, local player becomes host
        this.hostPlayerId = localPlayer.id.toString();
        this.isLocalPlayerHost = true;
        this.hostPlayerIdBinding.set(this.hostPlayerId);
        this.isLocalPlayerHostBinding.set(true);
        console.log("TriviaGame: Local player is the host");
      } else {
        // Host already exists
        this.isLocalPlayerHost = this.hostPlayerId === localPlayer.id.toString();
        this.isLocalPlayerHostBinding.set(this.isLocalPlayerHost);
        console.log(`TriviaGame: Host is ${this.hostPlayerId}, local player is host: ${this.isLocalPlayerHost}`);
      }
    }
  }

  private handleStartGame(): void {
    if (!this.isLocalPlayerHost) {
      console.log("TriviaGame: Only host can start the game");
      return;
    }
    
    console.log("TriviaGame: Host is starting the game");
    
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
    console.log("TriviaGame: Received game start from host", data.hostId);
    
    // Update configuration
    this.gameConfig = data.config;
    this.gameConfigBinding.set(this.gameConfig);
    
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
      console.log("TriviaGame: Only host can change game settings");
      return;
    }
    
    this.gameConfig = { ...this.gameConfig, ...newConfig };
    this.gameConfigBinding.set(this.gameConfig);
    console.log("TriviaGame: Game configuration updated", this.gameConfig);
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

  private handleAnswerPress(answerIndex: number): void {
    if (!this.currentQuestion || this.hasLocalPlayerAnswered) {
      return; // Can't answer if no question or already answered
    }
    
    const player = this.world.getLocalPlayer();
    if (!player) return;
    
    // Mark that local player has answered
    this.hasLocalPlayerAnswered = true;
    this.playersAnswered.add(player.id.toString());
    
    // Update answer count immediately
    this.answerCountBinding.set(this.playersAnswered.size.toString());
    
    // Send answer to the world trivia system
    this.sendNetworkBroadcastEvent(triviaAnswerSubmittedEvent, {
      playerId: player.id.toString(),
      answerIndex: answerIndex,
      responseTime: this.props.questionTimeLimit - this.timeRemaining
    });
    
    console.log(`TriviaGame: Player ${player.id} answered ${answerIndex}`);
    
    // Check if we need to show waiting screen based on number of players
    if (this.playersInWorld.size === 1) {
      // Single player - results will come immediately from server
      console.log("TriviaGame: Single player mode, waiting for immediate results");
    } else {
      // Multiplayer - show waiting screen until all players answer
      this.showWaitingBinding.set(true);
      console.log(`TriviaGame: Multiplayer mode (${this.playersInWorld.size} players), showing waiting screen`);
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

                    // Number of questions setting
                    View({
                      style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12
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
                    }),

                    // Difficulty setting
                    View({
                      style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      },
                      children: [
                        Text({
                          text: 'Difficulty:',
                          style: {
                            fontSize: 14,
                            color: '#1F2937'
                          }
                        }),
                        Text({
                          text: this.gameConfigBinding.derive(config => config.difficulty),
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
    
    return Pressable({
      onPress: () => this.handleAnswerPress(index),
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: color,
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
        
        // Answer text with results overlay
        View({
          style: {
            flex: 1,
            flexDirection: 'column'
          },
          children: [
            Text({
              text: this.answerTexts[index],
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: 'white'
              }
            }),
            
            // Results indicator
            UINode.if(
              this.showResultsBinding,
              View({
                style: {
                  marginTop: 2,
                  alignItems: 'center'
                },
                children: [
                  // Correct/incorrect indicator only
                  Text({
                    text: this.correctAnswerBinding.derive(correct => correct === index ? '✅ Correct' : '❌'),
                    style: {
                      fontSize: 12,
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  })
                ]
              })
            )
          ]
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
