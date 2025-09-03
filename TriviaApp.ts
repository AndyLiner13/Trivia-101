import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';

// Network events for syncing with world trivia game
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }>('triviaResults');
const triviaGameCompleteEvent = new hz.NetworkEvent<{ finalScores: Array<{ playerId: string, score: number }>, totalQuestions: number }>('triviaGameComplete');
const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{ playerId: string, answerIndex: number, responseTime: number }>('triviaAnswerSubmitted');

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

const sampleQuestions: Question[] = [
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
  },
  {
    id: 3,
    question: "What is 7 × 8?",
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
    answers: [
      { text: "Atlantic", correct: false },
      { text: "Pacific", correct: true },
      { text: "Indian", correct: false },
      { text: "Arctic", correct: false }
    ]
  }
];

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

type GameState = 'playing' | 'waiting' | 'answered' | 'finished';

export class TriviaApp {
  // Game state bindings
  private currentQuestionIndex = 0;
  private score = 0;
  private gameState: GameState = 'playing';
  private selectedAnswer: number | null = null;
  private showResult = false;
  private waitingMessage = '';
  
  // Questions array - can be updated externally
  private questions: Question[] = sampleQuestions;
  private useExternalQuestions = false;

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
  
  // Assigned player context for binding updates
  private assignedPlayer: hz.Player | null = null;

  // Bindings for UI reactivity
  private currentQuestionIndexBinding = new ui.Binding(0);
  private scoreBinding = new ui.Binding(0);
  private gameStateBinding = new ui.Binding<GameState>('playing');
  private selectedAnswerBinding = new ui.Binding<number | null>(null);
  private showResultBinding = new ui.Binding(false);
  private waitingMessageBinding = new ui.Binding('');
  private secondsRemainingBinding = new ui.Binding(5);

  constructor(world?: hz.World, sendNetworkCallback?: (event: hz.NetworkEvent<any>, data: any) => void) {
    // Store world reference for network events
    this.world = world || null;
    this.sendNetworkCallback = sendNetworkCallback || null;
    
    // Register this TriviaApp instance with the world for results callbacks
    if (this.world && (this.world as any).triviaApps) {
      (this.world as any).triviaApps = (this.world as any).triviaApps || [];
      (this.world as any).triviaApps.push(this);
    } else if (this.world) {
      (this.world as any).triviaApps = [this];
    }
    
    // Load questions from the JSON data
    this.loadQuestionsFromData();
  }

  // Set the assigned player for this TriviaApp instance
  public setAssignedPlayer(player: hz.Player | null): void {
    this.assignedPlayer = player;
  }

  // Called by TriviaGame when trivia results are available
  public onTriviaResults(eventData: { question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }): void {
    console.log('TriviaApp: Received trivia results', eventData);
    
    // Show the results immediately
    this.gameState = 'answered';
    this.showResult = true;
    this.gameStateBinding.set('answered', this.assignedPlayer ? [this.assignedPlayer] : undefined);
    this.showResultBinding.set(true, this.assignedPlayer ? [this.assignedPlayer] : undefined);
    
    console.log('TriviaApp: Showing results screen');
    
    // Start auto-progression timer (5 seconds)
    this.startAutoProgressTimer(this.assignedPlayer ?? undefined);
  }

  // Method to send network events (requires callback from parent component)
  private sendNetworkEvent(event: hz.NetworkEvent<any>, data: any): void {
    if (this.sendNetworkCallback) {
      this.sendNetworkCallback(event, data);
    } else {
      console.warn('TriviaApp: Cannot send network event - no network callback');
    }
  }

  private loadQuestionsFromData(): void {
    try {
      // Load questions from the trivia-questions.json data
      // In a real implementation, this could be loaded via asset system
      const questionsData = [
        {
          "id": 1,
          "question": "What is the capital of France?",
          "category": "Geography",
          "difficulty": "easy",
          "answers": [
            { "text": "London", "correct": false },
            { "text": "Berlin", "correct": false },
            { "text": "Paris", "correct": true },
            { "text": "Madrid", "correct": false }
          ]
        },
        {
          "id": 2,
          "question": "Which planet is known as the Red Planet?",
          "category": "Science",
          "difficulty": "easy",
          "answers": [
            { "text": "Mars", "correct": true },
            { "text": "Venus", "correct": false },
            { "text": "Jupiter", "correct": false },
            { "text": "Saturn", "correct": false }
          ]
        },
        {
          "id": 3,
          "question": "What is 7 × 8?",
          "category": "Mathematics",
          "difficulty": "medium",
          "answers": [
            { "text": "54", "correct": false },
            { "text": "56", "correct": true },
            { "text": "64", "correct": false },
            { "text": "48", "correct": false }
          ]
        },
        {
          "id": 4,
          "question": "Who painted the Mona Lisa?",
          "category": "Art",
          "difficulty": "medium",
          "answers": [
            { "text": "Van Gogh", "correct": false },
            { "text": "Picasso", "correct": false },
            { "text": "Da Vinci", "correct": true },
            { "text": "Monet", "correct": false }
          ]
        },
        {
          "id": 5,
          "question": "What is the largest ocean on Earth?",
          "category": "Geography",
          "difficulty": "easy",
          "answers": [
            { "text": "Atlantic", "correct": false },
            { "text": "Pacific", "correct": true },
            { "text": "Indian", "correct": false },
            { "text": "Arctic", "correct": false }
          ]
        },
        {
          "id": 6,
          "question": "In which year did World War II end?",
          "category": "History",
          "difficulty": "medium",
          "answers": [
            { "text": "1944", "correct": false },
            { "text": "1945", "correct": true },
            { "text": "1946", "correct": false },
            { "text": "1947", "correct": false }
          ]
        },
        {
          "id": 7,
          "question": "What is the chemical symbol for gold?",
          "category": "Science",
          "difficulty": "hard",
          "answers": [
            { "text": "Go", "correct": false },
            { "text": "Gd", "correct": false },
            { "text": "Au", "correct": true },
            { "text": "Ag", "correct": false }
          ]
        },
        {
          "id": 8,
          "question": "Which Shakespeare play features the character Romeo?",
          "category": "Literature",
          "difficulty": "easy",
          "answers": [
            { "text": "Hamlet", "correct": false },
            { "text": "Macbeth", "correct": false },
            { "text": "Romeo and Juliet", "correct": true },
            { "text": "Othello", "correct": false }
          ]
        },
        {
          "id": 9,
          "question": "What is the speed of light in a vacuum?",
          "category": "Physics",
          "difficulty": "hard",
          "answers": [
            { "text": "299,792,458 m/s", "correct": true },
            { "text": "300,000,000 m/s", "correct": false },
            { "text": "186,000 m/s", "correct": false },
            { "text": "150,000,000 m/s", "correct": false }
          ]
        },
        {
          "id": 10,
          "question": "Which country has the most natural lakes?",
          "category": "Geography",
          "difficulty": "hard",
          "answers": [
            { "text": "United States", "correct": false },
            { "text": "Russia", "correct": false },
            { "text": "Canada", "correct": true },
            { "text": "Finland", "correct": false }
          ]
        }
      ];

      if (Array.isArray(questionsData) && questionsData.length > 0) {
        this.questions = questionsData.map((q: any) => ({
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          answers: q.answers
        }));
        this.useExternalQuestions = true;
        console.log(`TriviaApp: Loaded ${this.questions.length} questions from trivia data`);
      }
    } catch (error) {
      console.log('TriviaApp: Could not load external questions, using sample questions:', error);
      // Keep using sample questions as fallback
    }
  }

  // Method to sync with external trivia system
  public syncWithExternalTrivia(questionData: {
    question: any;
    questionIndex: number;
    timeLimit?: number;
  }): void {
    console.log("TriviaApp: Syncing with external trivia question", questionData);
    
    // Clear any running timer since we're syncing with external system
    this.clearAutoProgressTimer();
    
    // Convert external question to our format
    const externalQuestion: Question = {
      id: questionData.question.id || questionData.questionIndex + 1,
      question: questionData.question.question,
      category: questionData.question.category,
      difficulty: questionData.question.difficulty,
      answers: questionData.question.answers || []
    };
    
    // Update our questions array and current index
    this.questions[questionData.questionIndex] = externalQuestion;
    this.currentQuestionIndex = questionData.questionIndex;
    
    // Reset state for new question
    this.selectedAnswer = null;
    this.showResult = false;
    this.waitingMessage = '';
    this.gameState = 'playing';
    this.questionStartTime = Date.now(); // Record when question starts
    
    // Update bindings
    this.currentQuestionIndexBinding.set(this.currentQuestionIndex);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.waitingMessageBinding.set('');
    this.gameStateBinding.set('playing');
  }

  // Method to show results from external trivia system
  public showExternalResults(resultsData: {
    question: any;
    correctAnswerIndex: number;
    answerCounts?: number[];
    scores?: { [key: string]: number };
  }): void {
    console.log("TriviaApp: Showing external trivia results", resultsData);
    
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
    console.log("TriviaApp: External trivia game completed", gameData);
    
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
    if (this.gameState !== 'playing') return;
    
    this.selectedAnswer = answerIndex;
    
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
    
    console.log(`TriviaApp: Player ${playerId} answered ${answerIndex} in ${responseTime}ms`);
    
    // Check how many players are in the world
    const playersInWorld = this.world?.getPlayers() || [];
    const playerCount = playersInWorld.length;
    
    console.log(`TriviaApp: ${playerCount} players in world`);
    
    // Only show waiting screen if there are multiple players
    if (playerCount > 1) {
      // Multiple players - show waiting screen
      this.gameState = 'waiting';
      const waitingMessage = "Waiting...";
      this.waitingMessage = waitingMessage;
      
      // Update bindings to show waiting state
      this.selectedAnswerBinding.set(answerIndex, assignedPlayer ? [assignedPlayer] : undefined);
      this.gameStateBinding.set('waiting', assignedPlayer ? [assignedPlayer] : undefined);
      this.waitingMessageBinding.set(waitingMessage, assignedPlayer ? [assignedPlayer] : undefined);
      
      console.log(`TriviaApp: Multiplayer mode, showing waiting screen`);
    } else {
      // Single player - skip waiting and stay in playing state for immediate results
      this.selectedAnswerBinding.set(answerIndex, assignedPlayer ? [assignedPlayer] : undefined);
      console.log(`TriviaApp: Single player mode, waiting for immediate results`);
    }
    
    // Store the correct answer for scoring when results come back
    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (currentQuestion.answers[answerIndex].correct) {
      this.score += 1;
      this.scoreBinding.set(this.score, assignedPlayer ? [assignedPlayer] : undefined);
    }
    
    console.log(`TriviaApp: Waiting for results from TriviaGame...`);
    // Results will be shown when triviaResultsEvent is received
  }

  private startAutoProgressTimer(assignedPlayer?: hz.Player): void {
    // Clear any existing timers
    this.clearAutoProgressTimer();
    
    // Reset countdown
    this.secondsRemaining = 5;
    this.secondsRemainingBinding.set(this.secondsRemaining, assignedPlayer ? [assignedPlayer] : undefined);
    
    // Start countdown timer (updates every second)
    this.countdownTimer = (globalThis as any).setInterval(() => {
      this.secondsRemaining -= 1;
      this.secondsRemainingBinding.set(this.secondsRemaining, assignedPlayer ? [assignedPlayer] : undefined);
      
      if (this.secondsRemaining <= 0) {
        // Time's up, clear timers and progress
        this.clearAutoProgressTimer();
        this.checkGameEnd(assignedPlayer);
      }
    }, 1000);
    
    // Set main timer for 5 seconds (backup in case interval fails)
    this.autoProgressTimer = (globalThis as any).setTimeout(() => {
      this.clearAutoProgressTimer();
      this.checkGameEnd(assignedPlayer);
    }, 5000);
  }

  private clearAutoProgressTimer(): void {
    if (this.autoProgressTimer) {
      (globalThis as any).clearTimeout(this.autoProgressTimer);
      this.autoProgressTimer = null;
    }
    if (this.countdownTimer) {
      (globalThis as any).clearInterval(this.countdownTimer);
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
    
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.gameState = 'playing';
    this.selectedAnswer = null;
    this.showResult = false;
    this.waitingMessage = '';
    this.secondsRemaining = 5;
    this.questionStartTime = Date.now(); // Record when first question starts
    
    // Update bindings
    this.currentQuestionIndexBinding.set(0, assignedPlayer ? [assignedPlayer] : undefined);
    this.scoreBinding.set(0, assignedPlayer ? [assignedPlayer] : undefined);
    this.gameStateBinding.set('playing', assignedPlayer ? [assignedPlayer] : undefined);
    this.selectedAnswerBinding.set(null, assignedPlayer ? [assignedPlayer] : undefined);
    this.showResultBinding.set(false, assignedPlayer ? [assignedPlayer] : undefined);
    this.waitingMessageBinding.set('', assignedPlayer ? [assignedPlayer] : undefined);
    this.secondsRemainingBinding.set(5, assignedPlayer ? [assignedPlayer] : undefined);
  }

  private getBackgroundColor(): string {
    if (this.gameState === 'answered' && this.showResult && this.selectedAnswer !== null) {
      const currentQuestion = sampleQuestions[this.currentQuestionIndex];
      const isCorrect = currentQuestion.answers[this.selectedAnswer].correct;
      return isCorrect ? '#22C55E' : '#EF4444'; // Green for correct, red for wrong
    }
    return '#6366F1'; // Default indigo
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
          ui.Binding.derive([this.gameStateBinding], (state) => state !== 'finished'),
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

  private renderGameScreen(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: ui.Binding.derive([
          this.gameStateBinding,
          this.showResultBinding,
          this.selectedAnswerBinding
        ], (gameState, showResult, selectedAnswer) => {
          if (gameState === 'answered' && showResult && selectedAnswer !== null) {
            const currentQuestion = this.questions[this.currentQuestionIndex];
            const isCorrect = currentQuestion.answers[selectedAnswer].correct;
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
                          this.selectedAnswerBinding,
                          this.currentQuestionIndexBinding
                        ], (selectedAnswer, questionIndex) => {
                          if (selectedAnswer !== null) {
                            const currentQuestion = this.questions[questionIndex];
                            const isCorrect = currentQuestion?.answers[selectedAnswer]?.correct;
                            return isCorrect ? '✅ Correct!' : '❌ Wrong!';
                          }
                          return '❌ Wrong!';
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
                              this.currentQuestionIndexBinding
                            ], (selectedAnswer, questionIndex) => {
                              if (selectedAnswer !== null) {
                                const currentQuestion = this.questions[questionIndex];
                                const isCorrect = currentQuestion?.answers[selectedAnswer]?.correct;
                                if (isCorrect) {
                                  return ''; // Don't show correct answer if they got it right
                                } else {
                                  const correctAnswer = currentQuestion?.answers.find(a => a.correct)?.text;
                                  return `Correct: ${correctAnswer || ''}`;
                                }
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
                            text: ui.Binding.derive([this.secondsRemainingBinding], (seconds) => 
                              seconds > 0 ? `Next question in ${seconds} second${seconds !== 1 ? 's' : ''}...` : 'Loading next question...'
                            ),
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
                  flexDirection: 'column'
                },
                children: [
                  // Top row
                  ui.View({
                    style: {
                      flexDirection: 'row',
                      flex: 1,
                      paddingBottom: 4
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
                      flex: 1,
                      paddingTop: 4
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
    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (!currentQuestion) return ui.View({ children: [] });

    const shape = answerShapes[answerIndex];

    return ui.Pressable({
      style: {
        flex: 1,
        backgroundColor: this.getAnswerButtonColor(answerIndex),
        borderRadius: 12,
        margin: 4,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100
      },
      onPress: () => this.handleAnswerSelect(answerIndex, assignedPlayer),
      children: [
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(shape.iconId))),
          style: {
            width: 40,
            height: 40,
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
