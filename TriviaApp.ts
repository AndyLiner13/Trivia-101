import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';
import { Social, AvatarImageType } from 'horizon/social';

// Global registry for TriviaApp instances
(globalThis as any).triviaAppInstances = (globalThis as any).triviaAppInstances || [];

// Network events for syncing with world trivia game
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');

// Network event for trivia results (now includes leaderboard data)
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');
const triviaGameCompleteEvent = new hz.NetworkEvent<{ finalScores: Array<{ playerId: string, score: number }>, totalQuestions: number }>('triviaGameComplete');
const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{ playerId: string, answerIndex: number, responseTime: number }>('triviaAnswerSubmitted');

// Network event for starting the game
const triviaGameStartEvent = new hz.NetworkEvent<{ hostId: string, config: { timeLimit: number, category: string, difficulty: string, numQuestions: number } }>('triviaGameStart');
const triviaNextQuestionEvent = new hz.NetworkEvent<{ playerId: string }>('triviaNextQuestion');

interface Question {
  id: number;
  question: string;
  category?: string;
  difficulty?: string;
  answers: {
    text: string;
    correct: boolean;
  }[];
}

interface TriviaQuestionsData {
  questions: Question[];
}

const answerShapes = [
  { iconId: '797899126007085', color: '#EF4444', shape: 'Circle' },
  { iconId: '1286736292915198', color: '#3B82F6', shape: 'Square' },
  { iconId: '1290982519195562', color: '#EAB308', shape: 'Triangle' },
  { iconId: '1286736292915198', color: '#22C55E', shape: 'Diamond', rotation: 45 }
];

const quirkyWaitingMessages = [
  "🤔 Hmm... let me think about this...",
  "🎯 Calculating your genius level...",
  "🔮 Consulting the oracle of knowledge...",
  "🧠 Brain waves processing...",
  "⚡ Lightning-fast computation in progress...",
  "🎪 The suspense is killing me!",
  "🎲 Rolling the dice of destiny...",
  "🌟 Checking with the trivia gods...",
  "🔍 Investigating your answer...",
  "⏰ Time for the moment of truth...",
  "🎭 Drumroll please...",
  "🚀 Launching answer verification...",
  "🎨 Painting the results...",
  "🎵 Writing your trivia symphony...",
  "🏆 Preparing your fate..."
];

type GameState = 'waiting_for_game' | 'playing' | 'waiting' | 'answered' | 'leaderboard' | 'finished';

export class TriviaApp {
  // Props definition for the component
  static propsDefinition = {
    questionsAsset: { type: hz.PropTypes.Asset }
  };

  // Game state bindings
  private currentQuestionIndex = 0;
  private score = 0;
  private gameState: GameState = 'waiting_for_game';
  private selectedAnswer: number | null = null;
  private showResult = false;
  private waitingMessage = '';
  
  // Additional state tracking for debugging
  private lastAnswerTimestamp: number = 0;
  private answerSelectionCount = 0;
  
  // Persistent answer storage to prevent loss
  private persistentAnswerStorage: { [questionIndex: number]: number } = {};
  
  // Questions array - can be updated externally
  private questions: Question[] = [];
  private useExternalQuestions = false;

  // Asset for loading questions
  private questionsAsset: hz.Asset | null = null;

  // Answer texts for current question
  private answerTexts: string[] = [];

  // Auto-progression timer
  private autoProgressTimer: any = null;
  private countdownTimer: any = null;
  private secondsRemaining = 5;
  
  // Question timing for response time calculation
  private questionStartTime: number = 0;
  
  // World context for network events
  private world: hz.World | null = null;
  
  // Network event callback
  private sendNetworkCallback: ((event: hz.NetworkEvent<any>, data: any) => void) | null = null;
  
  // Async utilities for timers
  private asyncUtils: any = null;
  
  // Assigned player context for binding updates
  private assignedPlayer: hz.Player | null = null;

  // Bindings for UI reactivity
  private currentQuestionIndexBinding = new ui.Binding(0);
  private scoreBinding = new ui.Binding(0);
  private gameStateBinding = new ui.Binding<GameState>('waiting_for_game');
  private selectedAnswerBinding = new ui.Binding<number | null>(null);
  private showResultBinding = new ui.Binding(false);
  private isAnswerCorrectBinding = new ui.Binding<boolean | null>(null);
  private waitingMessageBinding = new ui.Binding('');
  private secondsRemainingBinding = new ui.Binding(5);

  // Question display bindings
  private questionBinding = new ui.Binding('');
  private answerTextsBinding = new ui.Binding<string[]>([]);

  // Leaderboard bindings
  private playerRankBinding = new ui.Binding(1);
  private playerScoreBinding = new ui.Binding(0);
  private totalPlayersBinding = new ui.Binding(1);
  private playerHeadshotBinding = new ui.Binding<ui.ImageSource | null>(null);

  // Host detection binding
  private isLocalPlayerHostBinding = new ui.Binding(false);
  private storedHostId: string | null = null;

  // Track if we've already synced with TriviaGame
  private hasSynced: boolean = false;

  constructor(world?: hz.World, sendNetworkCallback?: (event: hz.NetworkEvent<any>, data: any) => void, asyncUtils?: any, questionsAsset?: hz.Asset) {
    // Store world reference for network events
    this.world = world || null;
    this.sendNetworkCallback = sendNetworkCallback || null;
    this.asyncUtils = asyncUtils || null;
    
    // Store the questions asset
    this.questionsAsset = questionsAsset || null;
    
    // Initialize variable groups for points tracking
    this.initializeVariableGroups();
    
    // Register this TriviaApp instance with the world for results callbacks
    if (this.world) {
      if (!(this.world as any).triviaApps) {
        (this.world as any).triviaApps = [];
      }
      (this.world as any).triviaApps.push(this);
    }
    
    // Also register with global registry as backup
    (globalThis as any).triviaAppInstances.push(this);
    
    // Set up network event listeners
    this.setupNetworkEvents();
    
    // Initialize host detection
    this.detectHostPlayer();
  }

  // Detect if the local player is the host
  private detectHostPlayer(): void {
    if (!this.world) {
      this.isLocalPlayerHostBinding.set(false);
      return;
    }

    const localPlayer = this.world.getLocalPlayer();
    if (!localPlayer) {
      this.isLocalPlayerHostBinding.set(false);
      return;
    }

    const allPlayers = this.world.getPlayers();

    // More robust host detection: check if local player is the one who started the game
    // or if they're the first player to join (fallback)
    if (allPlayers.length > 0) {
      // First, check if we have a stored host ID from game start
      if (this.storedHostId) {
        const isHost = this.storedHostId === localPlayer.id.toString();
        this.isLocalPlayerHostBinding.set(isHost);
      } else {
        // Fallback: first player in the world is considered host
        const isHost = allPlayers[0].id.toString() === localPlayer.id.toString();
        this.isLocalPlayerHostBinding.set(isHost);
        // Store this for future reference
        if (isHost) {
          this.storedHostId = localPlayer.id.toString();
        }
      }
    } else {
      // If no players yet, assume local player is host
      this.isLocalPlayerHostBinding.set(true);
      this.storedHostId = localPlayer.id.toString();
    }
  }

  // Set up network event listeners to sync with TriviaGame
  private setupNetworkEvents(): void {
    // TriviaApp receives events through direct method calls from TriviaGame
    // via the parent MePhone component that forwards the events
    // No additional setup needed here as events are forwarded from MePhone
  }

  // Handle starting the game (only for host)
  private async handleStartGame(): Promise<void> {
    // Load questions first
    await this.loadQuestionsFromData();

    // Ensure we have questions before proceeding
    if (this.questions.length === 0) {
      // Fallback to hardcoded questions if loading failed
      this.questions = [
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
          question: "Which planet is known as the Red Planet?",
          category: "Science",
          difficulty: "easy",
          answers: [
            { text: "Mars", correct: true },
            { text: "Venus", correct: false },
            { text: "Jupiter", correct: false },
            { text: "Saturn", correct: false }
          ]
        }
      ];
    }

    // Reset game state BEFORE setting up the playing state
    this.resetGame();

    // Send network event to start the game in TriviaGame component with questions
    const gameStartData = {
      hostId: this.world?.getLocalPlayer()?.id.toString() || 'local',
      config: {
        timeLimit: 30,
        category: 'General',
        difficulty: 'easy',
        numQuestions: 10
      },
      questions: this.questions // Send the loaded questions to TriviaGame
    };
    
    // Store the host ID for consistent host detection throughout the game
    this.storedHostId = gameStartData.hostId;
    this.isLocalPlayerHostBinding.set(true); // The player starting the game is the host
    
    this.sendNetworkEvent(triviaGameStartEvent, gameStartData);

    // Immediately transition to playing state and set up first question
    this.gameState = 'playing';
    this.currentQuestionIndex = 0;
    this.gameStateBinding.set('playing', this.assignedPlayer ? [this.assignedPlayer] : undefined);
    this.currentQuestionIndexBinding.set(0, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    
    // Set up answer texts from the first question
    if (this.questions.length > 0) {
      this.answerTexts = this.questions[0].answers.map(answer => answer.text);
      this.answerTextsBinding.set(this.answerTexts, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    }

    // TriviaGame will send back the question via network event to sync any shuffled answers
  }

  // Method to show the next question
  private showNextQuestion(): void {
    // Check if we have questions loaded
    if (this.questions.length === 0) {
      return;
    }
    
    // Check if we've reached the end of questions
    if (this.currentQuestionIndex >= this.questions.length) {
      this.gameState = 'finished';
      this.gameStateBinding.set('finished');
      return;
    }
    
    // Get the current question
    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (!currentQuestion) {
      return;
    }
    
    // Update the question display
    this.questionBinding.set(currentQuestion.question);
    
    // Update answer options
    this.answerTexts = currentQuestion.answers.map(answer => answer.text);
    this.answerTextsBinding.set(this.answerTexts);
    
    // Reset answer state
    this.selectedAnswer = null;
    this.showResult = false;
    this.gameState = 'playing';
    this.questionStartTime = Date.now();
    
    // Update bindings
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.gameStateBinding.set('playing');
  }

  // Method to sync TriviaApp state with TriviaGame
  public syncWithTriviaGame(triviaGame: any): void {
    if (!triviaGame) {
      // If no TriviaGame, stay in waiting state
      this.gameState = 'waiting_for_game';
      this.gameStateBinding.set('waiting_for_game', this.assignedPlayer ? [this.assignedPlayer] : undefined);
      return;
    }

    // Check if TriviaGame is running
    if (triviaGame.isRunning) {
      // Game is running - sync with current state
      if (triviaGame.currentQuestion) {
        // There's a current question - sync to playing state
        this.gameState = 'playing';
        this.currentQuestionIndex = triviaGame.currentQuestionIndex;
        this.gameStateBinding.set('playing', this.assignedPlayer ? [this.assignedPlayer] : undefined);
        this.currentQuestionIndexBinding.set(this.currentQuestionIndex, this.assignedPlayer ? [this.assignedPlayer] : undefined);
        
        // Sync the question data
        this.syncWithExternalTrivia({
          question: triviaGame.currentQuestion,
          questionIndex: triviaGame.currentQuestionIndex,
          timeLimit: triviaGame.props?.questionTimeLimit || 30
        });
      } else {
        // Game is running but no current question - might be in results/leaderboard state
        // Check TriviaGame's UI bindings to determine state
        if (triviaGame.showLeaderboardBinding?.get()) {
          this.gameState = 'leaderboard';
          this.gameStateBinding.set('leaderboard', this.assignedPlayer ? [this.assignedPlayer] : undefined);
        } else if (triviaGame.showResultsBinding?.get()) {
          this.gameState = 'answered';
          this.showResult = true;
          this.gameStateBinding.set('answered', this.assignedPlayer ? [this.assignedPlayer] : undefined);
          this.showResultBinding.set(true, this.assignedPlayer ? [this.assignedPlayer] : undefined);
        } else {
          // Default to playing state if game is running
          this.gameState = 'playing';
          this.gameStateBinding.set('playing', this.assignedPlayer ? [this.assignedPlayer] : undefined);
        }
      }
    } else {
      // Game is not running - show waiting screen
      this.gameState = 'waiting_for_game';
      this.gameStateBinding.set('waiting_for_game', this.assignedPlayer ? [this.assignedPlayer] : undefined);
    }
  }

  // Method to sync with external trivia system
  public syncWithExternalTrivia(questionData: {
    question: any;
    questionIndex: number;
    timeLimit?: number;
  }): void {

    // Convert external question to our format
    const externalQuestion: Question = {
      id: questionData.question.id || questionData.questionIndex + 1,
      question: questionData.question.question,
      category: questionData.question.category,
      difficulty: questionData.question.difficulty,
      answers: questionData.question.answers || []
    };

    // Check if this is a new question or if we need to reset state
    const isNewQuestion = questionData.questionIndex !== this.currentQuestionIndex;
    const shouldResetState = this.selectedAnswer === null || this.showResult === true || isNewQuestion || this.gameState === 'leaderboard';

    // Update our questions array and current index
    this.questions[questionData.questionIndex] = externalQuestion;
    this.currentQuestionIndex = questionData.questionIndex;

    // Reset state for new question or when transitioning from leaderboard
    if (shouldResetState) {
      this.selectedAnswer = null;
      this.showResult = false;
      this.waitingMessage = '';
      this.gameState = 'playing';
      this.questionStartTime = Date.now(); // Record when question starts

      // Reset tracking variables too
      this.lastAnswerTimestamp = 0;
      this.answerSelectionCount = 0;

      // Clear any running timers when new question starts
      this.clearAutoProgressTimer();

      // Update bindings with assignedPlayer
      this.selectedAnswerBinding.set(null, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      this.showResultBinding.set(false, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      this.isAnswerCorrectBinding.set(null, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      this.waitingMessageBinding.set('', this.assignedPlayer ? [this.assignedPlayer] : undefined);
      this.gameStateBinding.set('playing', this.assignedPlayer ? [this.assignedPlayer] : undefined);
    } else {
      // Just update the question-related bindings, keep the selected answer
      this.questionStartTime = Date.now(); // Still update start time
    }

    // Always update these bindings regardless
    this.currentQuestionIndexBinding.set(this.currentQuestionIndex, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    
    // Update the question display with the new question data
    this.questionBinding.set(externalQuestion.question, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    
    // Update answer options
    this.answerTexts = externalQuestion.answers.map(answer => answer.text);
    this.answerTextsBinding.set(this.answerTexts, this.assignedPlayer ? [this.assignedPlayer] : undefined);
  }

  // Public method to manually trigger host detection (can be called by parent component)
  public updateHostStatus(): void {
    this.detectHostPlayer();
  }

  // Initialize access to the Trivia variable group
  private initializeVariableGroups(): void {
    try {
      // Variable group access will be set up when player is assigned
    } catch (error) {
      // Failed to initialize variable groups
    }
  }

  // Get player's current points from the variable group
  private getPlayerPoints(): number {
    if (!this.assignedPlayer || !this.world) {
      return 0;
    }
    
    try {
      const points = this.world.persistentStorage.getPlayerVariable(this.assignedPlayer, 'Trivia:Points');
      const numericPoints = points || 0;
      return numericPoints;
    } catch (error) {
      return 0;
    }
  }

  // Set player's points in the variable group
  private setPlayerPoints(points: number): void {
    if (!this.assignedPlayer || !this.world) {
      return;
    }
    
    try {
      this.world.persistentStorage.setPlayerVariable(this.assignedPlayer, 'Trivia:Points', points);
      
      // Update local score and binding
      this.score = points;
      this.scoreBinding.set(points, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    } catch (error) {
      // Failed to set player points
    }
  }

  // Add points to player's current total
  private addPlayerPoints(pointsToAdd: number): void {
    const currentPoints = this.getPlayerPoints();
    const newPoints = currentPoints + pointsToAdd;
    this.setPlayerPoints(newPoints);
    
    // Also add to the world total points
    this.addToWorldTotalPoints(pointsToAdd);
  }

  // Add points to the world total
  private addToWorldTotalPoints(points: number): void {
    if (!this.world) {
      return;
    }
    
    try {
      const currentTotal = (this.world.persistentStorageWorld.getWorldVariable('Trivia:TotalPoints') as number) || 0;
      const newTotal = currentTotal + points;
      this.world.persistentStorageWorld.setWorldVariableAcrossAllInstancesAsync('Trivia:TotalPoints', newTotal);
    } catch (error) {
      // Failed to update world total points
    }
  }

  // Reset points to 0 (called at game start)
  private resetPlayerPoints(): void {
    this.setPlayerPoints(0);
  }

  // Set the assigned player for this TriviaApp instance
  public setAssignedPlayer(player: hz.Player | null): void {
    this.assignedPlayer = player;
    
    // Load current points when player is assigned
    if (player) {
      const currentPoints = this.getPlayerPoints();
      this.score = currentPoints;
      this.scoreBinding.set(currentPoints, [player]);
    }
    
    // Ensure registration with world when player is assigned
    if (player && this.world) {
      if (!(this.world as any).triviaApps) {
        (this.world as any).triviaApps = [];
      }
      // Check if already registered to avoid duplicates
      const existingIndex = (this.world as any).triviaApps.indexOf(this);
      if (existingIndex === -1) {
        (this.world as any).triviaApps.push(this);
      }
    }
    
    // Re-run host detection when player is assigned (in case world wasn't available during construction)
    if (player) {
      this.detectHostPlayer();
    }
  }

  // Called by TriviaGame when trivia results are available
  public async onTriviaResults(eventData: { question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }): Promise<void> {
    // Check if this is a leaderboard event
    if (eventData.showLeaderboard && eventData.leaderboardData) {
      await this.handleLeaderboardData(eventData.leaderboardData);
      return;
    }
    
    // Try to recover answer from persistent storage if selectedAnswer is null
    let effectiveSelectedAnswer = this.selectedAnswer;
    if (effectiveSelectedAnswer === null && this.persistentAnswerStorage[this.currentQuestionIndex] !== undefined) {
      effectiveSelectedAnswer = this.persistentAnswerStorage[this.currentQuestionIndex];
      // Update the selectedAnswer with recovered value
      this.selectedAnswer = effectiveSelectedAnswer;
      this.selectedAnswerBinding.set(effectiveSelectedAnswer, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    }
    
    // Determine if the player's answer was correct
    let isCorrect: boolean | null = null;
    if (effectiveSelectedAnswer !== null) {
      isCorrect = effectiveSelectedAnswer === eventData.correctAnswerIndex;
    } else {
      isCorrect = null; // No answer submitted
    }
    
    // Update the correct/wrong binding
    this.isAnswerCorrectBinding.set(isCorrect, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    
    // Transition to answered state to show results
    this.gameState = 'answered';
    this.showResult = true;
    this.gameStateBinding.set('answered', this.assignedPlayer ? [this.assignedPlayer] : undefined);
    this.showResultBinding.set(true, this.assignedPlayer ? [this.assignedPlayer] : undefined);
  }

  // Called when leaderboard data is received for this specific player
  public async onLeaderboardData(eventData: { playerId: string, rank: number, score: number, totalPlayers: number }): Promise<void> {
    // Check if this data is for the assigned player
    const assignedPlayerId = this.assignedPlayer?.id.toString();
    
    if (assignedPlayerId && eventData.playerId === assignedPlayerId) {
      // Update leaderboard bindings
      this.playerRankBinding.set(eventData.rank, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      this.playerScoreBinding.set(eventData.score, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      this.totalPlayersBinding.set(eventData.totalPlayers, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      
      // Get headshot using Social API
      try {
        if (this.assignedPlayer) {
          const headshotImageSource = await Social.getAvatarImageSource(this.assignedPlayer, {
            type: AvatarImageType.HEADSHOT,
            highRes: true
          });
          this.playerHeadshotBinding.set(headshotImageSource, this.assignedPlayer ? [this.assignedPlayer] : undefined);
        }
      } catch (error) {
        this.playerHeadshotBinding.set(null, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      }
      
      // Transition to leaderboard state
      this.gameState = 'leaderboard';
      this.showResult = false; // Hide answer result screen
      this.gameStateBinding.set('leaderboard', this.assignedPlayer ? [this.assignedPlayer] : undefined);
      this.showResultBinding.set(false, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    }
  }

  private async handleLeaderboardData(leaderboardData: Array<{name: string, score: number, playerId: string}>): Promise<void> {
    // Try multiple ways to get the current player ID
    let currentPlayerId: string | null = null;
    
    // Method 1: Use assigned player
    if (this.assignedPlayer) {
      currentPlayerId = this.assignedPlayer.id.toString();
    }
    
    // Method 2: If no assigned player, but we have leaderboard data with only one player, use that
    if (!currentPlayerId && leaderboardData.length === 1) {
      currentPlayerId = leaderboardData[0].playerId;
    }
    
    // Method 3: Check if there's a player ID we can derive from previous interactions
    if (!currentPlayerId) {
      if (leaderboardData.length > 0) {
        currentPlayerId = leaderboardData[0].playerId;
      }
    }
    
    if (!currentPlayerId) {
      return;
    }
    
    // Find player's rank and score
    const playerIndex = leaderboardData.findIndex(player => player.playerId === currentPlayerId);
    if (playerIndex === -1) {
      return;
    }
    
    const playerData = leaderboardData[playerIndex];
    const rank = playerIndex + 1; // Rank is 1-based
    const totalPlayers = leaderboardData.length;
    
    // Update leaderboard bindings
    this.playerRankBinding.set(rank, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    this.playerScoreBinding.set(playerData.score, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    this.totalPlayersBinding.set(totalPlayers, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    
    // Get headshot using Social API - try to use assignedPlayer or get current player from world
    try {
      let playerForHeadshot = this.assignedPlayer;
      
      if (playerForHeadshot) {
        const headshotImageSource = await Social.getAvatarImageSource(playerForHeadshot, {
          type: AvatarImageType.HEADSHOT,
          highRes: true
        });
        this.playerHeadshotBinding.set(headshotImageSource, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      } else {
        this.playerHeadshotBinding.set(null, this.assignedPlayer ? [this.assignedPlayer] : undefined);
      }
    } catch (error) {
      this.playerHeadshotBinding.set(null, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    }
    
    // Transition to leaderboard state
    this.gameState = 'leaderboard';
    this.showResult = false; // Hide answer result screen
    this.gameStateBinding.set('leaderboard', this.assignedPlayer ? [this.assignedPlayer] : undefined);
    this.showResultBinding.set(false, this.assignedPlayer ? [this.assignedPlayer] : undefined);
  }

  // Method to send network events (requires callback from parent component)
  private sendNetworkEvent(event: hz.NetworkEvent<any>, data: any): void {
    if (this.sendNetworkCallback) {
      this.sendNetworkCallback(event, data);
    }
  }

  private async loadQuestionsFromData(): Promise<void> {
    try {
      // If we have a questions asset, load from it
      if (this.questionsAsset) {
        const assetData = await this.questionsAsset.fetchAsData();
        const jsonData = assetData.asJSON<TriviaQuestionsData>();
        
        if (jsonData && jsonData.questions && Array.isArray(jsonData.questions)) {
          this.questions = jsonData.questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            category: q.category,
            difficulty: q.difficulty,
            answers: q.answers
          }));
          this.useExternalQuestions = true;
        }
      } else {
        // Fallback to hardcoded questions if no asset provided
        const fallbackQuestions: Question[] = [
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
            question: "Which planet is known as the Red Planet?",
            category: "Science",
            difficulty: "easy",
            answers: [
              { text: "Mars", correct: true },
              { text: "Venus", correct: false },
              { text: "Jupiter", correct: false },
              { text: "Saturn", correct: false }
            ]
          },
          {
            id: 3,
            question: "What is 7 × 8?",
            category: "Mathematics",
            difficulty: "medium",
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
          }
        ];
        
        this.questions = fallbackQuestions;
        this.useExternalQuestions = false;
      }
    } catch (error) {
      // Could not load questions, use fallback
      const fallbackQuestions: Question[] = [
        {
          id: 1,
          question: "What is the capital of France?",
          answers: [
            { text: "London", correct: false },
            { text: "Berlin", correct: false },
            { text: "Paris", correct: true },
            { text: "Madrid", correct: false }
          ]
        },
        {
          id: 2,
          question: "Which planet is known as the Red Planet?",
          answers: [
            { text: "Mars", correct: true },
            { text: "Venus", correct: false },
            { text: "Jupiter", correct: false },
            { text: "Saturn", correct: false }
          ]
        }
      ];
      
      this.questions = fallbackQuestions;
      this.useExternalQuestions = false;
    }
  }

  private handleNextQuestion(assignedPlayer?: hz.Player): void {
    // Send network event to TriviaGame to advance to next question
    // Use the stored host ID instead of assignedPlayer ID to ensure correct host validation
    this.sendNetworkEvent(triviaNextQuestionEvent, {
      playerId: this.storedHostId || assignedPlayer?.id.toString() || 'host'
    });
  }

  // Method to show results from external trivia system
  public showExternalResults(resultsData: {
    question: any;
    correctAnswerIndex: number;
    answerCounts?: number[];
    scores?: { [key: string]: number };
  }): void {
    // Show results automatically
    this.gameState = 'answered';
    this.showResult = true;
    this.gameStateBinding.set('answered');
    this.showResultBinding.set(true);
  }

  // Method to end game from external trivia system
  public endExternalGame(gameData: {
    finalScores?: Array<{ playerId: string; score: number }>;
    totalQuestions?: number;
  }): void {
    // End the game
    this.gameState = 'finished';
    this.gameStateBinding.set('finished');
  }

  // Standardized Header Component
  private createAppHeader(props: {
    appName: string;
    onHomePress: () => void;
    onBackPress?: () => void;
    showBackButton?: boolean;
    rightElement?: ui.UINode;
  }): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 36,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10
      },
      children: [
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            // Home button
            ui.Pressable({
              style: {
                padding: 2
              },
              onPress: props.onHomePress,
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 20,
                    height: 20,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            }),
            // Back button (conditional)
            ...(props.showBackButton && props.onBackPress ? [
              ui.Pressable({
                style: {
                  marginLeft: 0,
                  padding: 2
                },
                onPress: props.onBackPress,
                children: [
                  ui.Image({
                    source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1083116303985907"))),
                    style: {
                      width: 20,
                      height: 20,
                      tintColor: '#9CA3AF'
                    }
                  })
                ]
              })
            ] : [])
          ]
        }),
        // Right side container with text and optional right element
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: props.appName,
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            }),
            // Right element (if provided)
            ...(props.rightElement ? [
              ui.View({
                style: {
                  marginLeft: 8
                },
                children: [props.rightElement]
              })
            ] : [])
          ]
        })
      ]
    });
  }

  private handleAnswerSelect(answerIndex: number, assignedPlayer?: hz.Player): void {
    // Only allow selection during playing state
    if (this.gameState !== 'playing') {
      return;
    }
    
    this.selectedAnswer = answerIndex;
    this.lastAnswerTimestamp = Date.now();
    this.answerSelectionCount++;
    
    // Store answer persistently by question index
    this.persistentAnswerStorage[this.currentQuestionIndex] = answerIndex;
    
    // Calculate response time
    const responseTime = Date.now() - this.questionStartTime;
    
    // Get player ID for the event
    const playerId = assignedPlayer?.id.toString() || 'local';
    
    // Send network event to sync with TriviaGame
    this.sendNetworkEvent(triviaAnswerSubmittedEvent, {
      playerId: playerId,
      answerIndex: answerIndex,
      responseTime: responseTime
    });
    
    // Check how many players are in the world
    const playersInWorld = this.world?.getPlayers() || [];
    const playerCount = playersInWorld.length;
    
    // Update the selected answer binding immediately
    this.selectedAnswerBinding.set(answerIndex, assignedPlayer ? [assignedPlayer] : undefined);
    
    // Only show waiting screen if there are multiple players
    if (playerCount > 1) {
      // Multiple players - show waiting screen
      this.gameState = 'waiting';
      const waitingMessage = "Waiting...";
      this.waitingMessage = waitingMessage;
      
      // Update bindings to show waiting state
      this.gameStateBinding.set('waiting', assignedPlayer ? [assignedPlayer] : undefined);
      this.waitingMessageBinding.set(waitingMessage, assignedPlayer ? [assignedPlayer] : undefined);
    }
    
    // Store the correct answer for scoring when results come back
    const currentQuestion = this.questions[this.currentQuestionIndex];
    
    if (currentQuestion.answers[answerIndex].correct) {
      // Add 1 point for correct answer using the variable system
      this.addPlayerPoints(1);
    }
    
    // Results will be shown when onTriviaResults is called
  }

  private startAutoProgressTimer(assignedPlayer?: hz.Player): void {
    // Clear any existing timers
    this.clearAutoProgressTimer();
    
    // Reset countdown
    this.secondsRemaining = 5;
    this.secondsRemainingBinding.set(this.secondsRemaining, assignedPlayer ? [assignedPlayer] : undefined);
    
    // Start countdown timer (updates every second) - only if async utils available
    if (this.asyncUtils) {
      this.countdownTimer = this.asyncUtils.setInterval(() => {
        this.secondsRemaining -= 1;
        this.secondsRemainingBinding.set(this.secondsRemaining, assignedPlayer ? [assignedPlayer] : undefined);
        
        if (this.secondsRemaining <= 0) {
          // Time's up, clear timers and progress
          this.clearAutoProgressTimer();
          this.checkGameEnd(assignedPlayer);
        }
      }, 1000);
      
      // Set main timer for 5 seconds (backup in case interval fails)
      this.autoProgressTimer = this.asyncUtils.setTimeout(() => {
        this.clearAutoProgressTimer();
        this.checkGameEnd(assignedPlayer);
      }, 5000);
    }
  }

  private clearAutoProgressTimer(): void {
    if (this.autoProgressTimer) {
      this.asyncUtils?.clearTimeout(this.autoProgressTimer);
      this.autoProgressTimer = null;
    }
    if (this.countdownTimer) {
      this.asyncUtils?.clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private nextQuestion(assignedPlayer?: hz.Player): void {
    // Clear any running timer
    this.clearAutoProgressTimer();
    
    this.currentQuestionIndex += 1;
    this.selectedAnswer = null;
    this.showResult = false;
    this.waitingMessage = '';
    this.gameState = 'playing';
    this.questionStartTime = Date.now(); // Record when question starts
    
    // Update bindings
    this.currentQuestionIndexBinding.set(this.currentQuestionIndex, assignedPlayer ? [assignedPlayer] : undefined);
    this.selectedAnswerBinding.set(null, assignedPlayer ? [assignedPlayer] : undefined);
    this.showResultBinding.set(false, assignedPlayer ? [assignedPlayer] : undefined);
    this.waitingMessageBinding.set('', assignedPlayer ? [assignedPlayer] : undefined);
    this.gameStateBinding.set('playing', assignedPlayer ? [assignedPlayer] : undefined);
  }

  private checkGameEnd(assignedPlayer?: hz.Player): void {
    const isLastQuestion = this.currentQuestionIndex === this.questions.length - 1;
    if (isLastQuestion) {
      this.gameState = 'finished';
      this.gameStateBinding.set('finished', assignedPlayer ? [assignedPlayer] : undefined);
    } else {
      this.nextQuestion(assignedPlayer);
    }
  }

  private resetGame(assignedPlayer?: hz.Player): void {
    // Clear any running timer
    this.clearAutoProgressTimer();
    
    // Reset points to 0 for new game
    this.resetPlayerPoints();
    
    this.currentQuestionIndex = 0;
    this.gameState = 'waiting_for_game';
    this.selectedAnswer = null;
    this.showResult = false;
    this.waitingMessage = '';
    this.secondsRemaining = 5;
    this.questionStartTime = Date.now(); // Record when first question starts
    
    // Reset sync flag so we can sync again when needed
    this.hasSynced = false;
    
    // Update bindings (score will be updated by resetPlayerPoints)
    this.currentQuestionIndexBinding.set(0, assignedPlayer ? [assignedPlayer] : undefined);
    this.gameStateBinding.set('waiting_for_game', assignedPlayer ? [assignedPlayer] : undefined);
    this.selectedAnswerBinding.set(null, assignedPlayer ? [assignedPlayer] : undefined);
    this.showResultBinding.set(false, assignedPlayer ? [assignedPlayer] : undefined);
    this.isAnswerCorrectBinding.set(null, assignedPlayer ? [assignedPlayer] : undefined);
    this.waitingMessageBinding.set('', assignedPlayer ? [assignedPlayer] : undefined);
    this.secondsRemainingBinding.set(5, assignedPlayer ? [assignedPlayer] : undefined);
  }

  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  }

  private getAnswerButtonColor(answerIndex: number): string {
    if (!this.showResult) {
      return answerShapes[answerIndex].color;
    }
    
    const currentQuestion = this.questions[this.currentQuestionIndex];
    const isCorrect = currentQuestion.answers[answerIndex].correct;
    const isSelected = this.selectedAnswer === answerIndex;
    
    if (isCorrect) {
      return '#22C55E'; // Show correct answer in green
    } else if (isSelected && !isCorrect) {
      return '#EF4444'; // Show selected wrong answer in red
    } else {
      return '#9CA3AF'; // Dim other answers
    }
  }

  render(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    // Sync with TriviaGame when rendering (only if we have an assigned player and haven't synced yet)
    if (assignedPlayer && !this.hasSynced) {
      // Try to find TriviaGame instance to sync with
      if (this.world) {
        // Look for TriviaGame in the world
        const triviaGame = (this.world as any).triviaGame;
        if (triviaGame) {
          this.syncWithTriviaGame(triviaGame);
          this.hasSynced = true;
        }
      }
    }
    
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Use simple binding checks for conditional rendering
        ui.UINode.if(
          ui.Binding.derive([this.gameStateBinding], (state) => state === 'finished'),
          this.renderFinishedScreen(onHomePress, assignedPlayer)
        ),
        ui.UINode.if(
          ui.Binding.derive([this.gameStateBinding], (state) => state === 'leaderboard'),
          this.renderLeaderboardScreen(onHomePress, assignedPlayer)
        ),
        ui.UINode.if(
          ui.Binding.derive([this.gameStateBinding], (state) => state === 'waiting_for_game'),
          this.renderWaitingForGameScreen(onHomePress, assignedPlayer)
        ),
        ui.UINode.if(
          ui.Binding.derive([this.gameStateBinding], (state) => state !== 'finished' && state !== 'leaderboard' && state !== 'waiting_for_game'),
          this.renderGameScreen(onHomePress, assignedPlayer)
        )
      ]
    });
  }

  private renderFinishedScreen(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      },
      children: [
        ui.View({
          style: {
            alignItems: 'center',
            marginBottom: 40
          },
          children: [
            ui.Text({
              text: '🎉 Game Complete! 🎉',
              style: {
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 16
              }
            }),
            ui.Text({
              text: 'Final Score',
              style: {
                fontSize: 16,
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 8
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.scoreBinding], (score) => `${score}/${this.questions.length}`),
              style: {
                fontSize: 36,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 8
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.scoreBinding], (score) => {
                if (score === this.questions.length) return 'Perfect!';
                if (score >= this.questions.length * 0.8) return 'Excellent!';
                if (score >= this.questions.length * 0.6) return 'Good job!';
                return 'Keep trying!';
              }),
              style: {
                fontSize: 14,
                color: '#FFFFFF',
                textAlign: 'center'
              }
            })
          ]
        }),
        
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          },
          onPress: () => this.resetGame(assignedPlayer),
          children: [
            ui.Text({
              text: '🔄 Play Again',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#7C3AED'
              }
            })
          ]
        })
      ]
    });
  }

  private renderWaitingForGameScreen(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    // Ensure host detection is up to date when rendering the waiting screen
    this.updateHostStatus();
    
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#6366F1',
        flexDirection: 'column'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Trivia',
          onHomePress: onHomePress
        }),

        // Main Content Area
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            paddingTop: 48 // Space for header
          },
          children: [
            ui.View({
              style: {
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: 32,
                width: '90%',
                maxWidth: 300
              },
              children: [
                ui.Text({
                  text: '⏳',
                  style: {
                    fontSize: 48,
                    textAlign: 'center',
                    marginBottom: 16
                  }
                }),
                ui.Text({
                  text: 'Waiting for Game to Start',
                  style: {
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    marginBottom: 8
                  }
                }),
                ui.Text({
                  text: 'A trivia game will begin shortly.',
                  style: {
                    fontSize: 14,
                    color: 'rgba(255, 255, 255, 0.8)',
                    textAlign: 'center',
                    marginBottom: 16
                  }
                }),
                ui.Text({
                  text: 'Get ready to test your knowledge!',
                  style: {
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center'
                  }
                }),

                // Start Game Button (only for host)
                ui.UINode.if(
                  ui.Binding.derive([this.isLocalPlayerHostBinding], (isHost) => {
                    // Show button if user is host OR if no assigned player (fallback for single-player)
                    const shouldShow = isHost || !this.assignedPlayer;
                    return shouldShow;
                  }),
                  ui.View({
                    style: {
                      marginTop: 24,
                      alignItems: 'center'
                    },
                    children: [
                      ui.Pressable({
                        style: {
                          backgroundColor: '#22C55E',
                          borderRadius: 12,
                          paddingHorizontal: 24,
                          paddingVertical: 12,
                          shadowColor: '#000000',
                          shadowOffset: [0, 2],
                          shadowOpacity: 0.3,
                          shadowRadius: 4
                        },
                        onPress: () => this.handleStartGame(),
                        children: [
                          ui.Text({
                            text: '🎮 Start Game',
                            style: {
                              fontSize: 16,
                              fontWeight: '700',
                              color: '#FFFFFF',
                              textAlign: 'center'
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
        })
      ]
    });
  }

  private renderLeaderboardScreen(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    // Ensure host detection is up to date when rendering the leaderboard screen
    this.updateHostStatus();
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#4F46E5', // Indigo background
        flexDirection: 'column'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Trivia',
          onHomePress: () => {
            onHomePress();
            this.resetGame(assignedPlayer);
          }
        }),

        // Main Content Area
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            paddingTop: 48 // Space for header
          },
          children: [
            ui.View({
              style: {
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: 24,
                width: '90%',
                maxWidth: 280
              },
              children: [
                // Title
                ui.Text({
                  text: '🏆 Your Ranking',
                  style: {
                    fontSize: 20,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    marginBottom: 20
                  }
                }),
                
                // Player headshot (if available)
                ui.UINode.if(
                  ui.Binding.derive([this.playerHeadshotBinding], (headshot) => headshot !== null),
                  ui.View({
                    style: {
                      marginBottom: 16,
                      alignItems: 'center'
                    },
                    children: [
                      ui.Image({
                        source: this.playerHeadshotBinding,
                        style: {
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          borderWidth: 3,
                          borderColor: '#FFFFFF'
                        }
                      })
                    ]
                  })
                ),
                
                // Rank display
                ui.View({
                  style: {
                    alignItems: 'center',
                    marginBottom: 16
                  },
                  children: [
                    ui.Text({
                      text: 'Rank',
                      style: {
                        fontSize: 14,
                        color: 'rgba(255, 255, 255, 0.8)',
                        textAlign: 'center',
                        marginBottom: 4
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.playerRankBinding, this.totalPlayersBinding], (rank, total) => 
                        `${rank}${this.getOrdinalSuffix(rank)} of ${total}`
                      ),
                      style: {
                        fontSize: 24,
                        fontWeight: '700',
                        color: '#FFFFFF',
                        textAlign: 'center'
                      }
                    })
                  ]
                }),
                
                // Score display
                ui.View({
                  style: {
                    alignItems: 'center',
                    marginBottom: 20
                  },
                  children: [
                    ui.Text({
                      text: 'Score',
                      style: {
                        fontSize: 14,
                        color: 'rgba(255, 255, 255, 0.8)',
                        textAlign: 'center',
                        marginBottom: 4
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.playerScoreBinding], (score) => score.toString()),
                      style: {
                        fontSize: 32,
                        fontWeight: '700',
                        color: '#FFFFFF',
                        textAlign: 'center'
                      }
                    }),
                    ui.Text({
                      text: 'points',
                      style: {
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.6)',
                        textAlign: 'center'
                      }
                    })
                  ]
                }),
                
                // Waiting message
                ui.Text({
                  text: 'Waiting for next question...',
                  style: {
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'center'
                  }
                }),

                // Next Question Button (only for host)
                ui.UINode.if(
                  ui.Binding.derive([this.isLocalPlayerHostBinding], (isHost) => isHost),
                  ui.View({
                    style: {
                      marginTop: 20,
                      alignItems: 'center'
                    },
                    children: [
                      ui.Pressable({
                        style: {
                          backgroundColor: '#3B82F6',
                          borderRadius: 12,
                          paddingHorizontal: 24,
                          paddingVertical: 12,
                          shadowColor: '#000000',
                          shadowOffset: [0, 2],
                          shadowOpacity: 0.3,
                          shadowRadius: 4
                        },
                        onPress: () => this.handleNextQuestion(assignedPlayer),
                        children: [
                          ui.Text({
                            text: 'Next Question',
                            style: {
                              fontSize: 16,
                              fontWeight: '700',
                              color: '#FFFFFF',
                              textAlign: 'center'
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
        })
      ]
    });
  }

  private renderGameScreen(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: ui.Binding.derive([
          this.gameStateBinding,
          this.showResultBinding,
          this.isAnswerCorrectBinding
        ], (gameState, showResult, isCorrect) => {
          if (gameState === 'answered' && showResult) {
            if (isCorrect === null) {
              return '#6B7280'; // Gray for no answer
            }
            return isCorrect ? '#22C55E' : '#EF4444'; // Green for correct, red for wrong
          }
          return '#6366F1'; // Default indigo
        }),
        flexDirection: 'column'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Trivia',
          onHomePress: () => {
            onHomePress();
            this.resetGame(assignedPlayer);
          }
        }),

        // Main Content Area
        ui.View({
          style: {
            flex: 1,
            padding: 8,
            paddingTop: 48, // Reduced gap below header
            paddingBottom: 12 // Match footer gap
          },
          children: [
            // Waiting State
            ui.UINode.if(
              ui.Binding.derive([this.gameStateBinding], (state) => state === 'waiting'),
              ui.View({
                style: {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 16
                },
                children: [
                  // Container for better visual grouping
                  ui.View({
                    style: {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 24,
                      alignItems: 'center',
                      width: '85%',
                      maxWidth: 200
                    },
                    children: [
                      // Loading animation placeholder (using emoji as visual element)
                      ui.Text({
                        text: '⏳',
                        style: {
                          fontSize: 32,
                          textAlign: 'center'
                        }
                      })
                    ]
                  })
                ]
              })
            ),

            // Answer Result State
            ui.UINode.if(
              ui.Binding.derive([this.gameStateBinding, this.showResultBinding], 
                (state, showResult) => state === 'answered' && showResult
              ),
              ui.View({
                style: {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center'
                },
                children: [
                  ui.View({
                    style: {
                      alignItems: 'center',
                      padding: 16
                    },
                    children: [
                      ui.Text({
                        text: ui.Binding.derive([
                          this.isAnswerCorrectBinding
                        ], (isCorrect) => {
                          if (isCorrect === null) {
                            return '⏰ No Answer';
                          }
                          return isCorrect ? '✅ Correct!' : '❌ Wrong!';
                        }),
                        style: {
                          fontSize: 20,
                          fontWeight: '700',
                          color: '#FFFFFF',
                          textAlign: 'center',
                          marginBottom: 8
                        }
                      }),
                      ui.View({
                        style: {
                          alignItems: 'center'
                        },
                        children: [
                          ui.Text({
                            text: ui.Binding.derive([
                              this.selectedAnswerBinding,
                              this.currentQuestionIndexBinding,
                              this.isAnswerCorrectBinding
                            ], (selectedAnswer, questionIndex, isCorrect) => {
                              if (selectedAnswer !== null && isCorrect === false) {
                                const currentQuestion = this.questions[questionIndex];
                                const correctAnswer = currentQuestion?.answers.find(a => a.correct)?.text;
                                return `Correct: ${correctAnswer || ''}`;
                              }
                              return '';
                            }),
                            style: {
                              fontSize: 14,
                              color: '#FFFFFF',
                              textAlign: 'center',
                              opacity: 0.9
                            }
                          }),
                          ui.Text({
                            text: "Waiting for next question...",
                            style: {
                              fontSize: 12,
                              color: '#FFFFFF',
                              textAlign: 'center',
                              opacity: 0.7,
                              marginTop: 12
                            }
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ),

            // Answer Choices (only during playing)
            ui.UINode.if(
              ui.Binding.derive([this.gameStateBinding], (state) => state === 'playing'),
              ui.View({
                style: {
                  flex: 1,
                  flexDirection: 'column',
                  padding: 8
                },
                children: [
                  // Top row
                  ui.View({
                    style: {
                      flexDirection: 'row',
                      flex: 1,
                      marginBottom: 8
                    },
                    children: [
                      this.createAnswerButton(0, assignedPlayer),
                      this.createAnswerButton(1, assignedPlayer)
                    ]
                  }),
                  // Bottom row
                  ui.View({
                    style: {
                      flexDirection: 'row',
                      flex: 1
                    },
                    children: [
                      this.createAnswerButton(2, assignedPlayer),
                      this.createAnswerButton(3, assignedPlayer)
                    ]
                  })
                ]
              })
            )
          ]
        }),

        // Bottom Status Bar
        ui.View({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.currentQuestionIndexBinding], (index) => 
                `Question ${index + 1} of ${this.questions.length}`
              ),
              style: {
                fontSize: 12,
                color: '#6B7280'
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.scoreBinding], (score) => `Score: ${score}`),
              style: {
                fontSize: 12,
                fontWeight: '600',
                color: '#6B7280'
              }
            })
          ]
        })
      ]
    });
  }

  private createAnswerButton(answerIndex: number, assignedPlayer?: hz.Player): ui.UINode {
    const shape = answerShapes[answerIndex];

    return ui.Pressable({
      style: {
        flex: 1,
        backgroundColor: this.getAnswerButtonColor(answerIndex),
        borderRadius: 12,
        margin: 4,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100,
        padding: 8
      },
      onPress: () => this.handleAnswerSelect(answerIndex, assignedPlayer),
      children: [
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(shape.iconId))),
          style: {
            width: 32,
            height: 32,
            tintColor: '#FFFFFF',
            ...(shape.rotation ? { transform: [{ rotate: `${shape.rotation}deg` }] } : {})
          }
        })
      ]
    });
  }

  // Getter methods to access bindings from parent
  getCurrentQuestionIndexBinding(): ui.Binding<number> {
    return this.currentQuestionIndexBinding;
  }

  getScoreBinding(): ui.Binding<number> {
    return this.scoreBinding;
  }

  getGameStateBinding(): ui.Binding<GameState> {
    return this.gameStateBinding;
  }
}
