import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { View, Text, Pressable, Binding, UINode } from 'horizon/ui';

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
  private correctAnswerBinding = new Binding(-1);
  private answerCountsBinding = new Binding([0, 0, 0, 0]);

  // Game data
  private triviaQuestions: TriviaQuestion[] = [...defaultTriviaQuestions];
  private currentQuestionIndex: number = 0;
  private currentQuestion: TriviaQuestion | null = null;
  private timeRemaining: number = 30;
  private totalAnswers: number = 0;
  private isRunning: boolean = false;

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
    
    // Initialize the UI
    this.initializeGameState();
    
    // Start continuous trivia game
    this.startContinuousGame();
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
  }

  private initializeGameState(): void {
    this.questionNumberBinding.set("Q1");
    this.timerBinding.set("30");
    this.answerCountBinding.set("0");
    this.questionBinding.set("Starting trivia game...");
    this.showResultsBinding.set(false);
    
    // Clear answer texts
    for (let i = 0; i < 4; i++) {
      this.answerTexts[i].set("");
    }
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
    if (!this.currentQuestion) {
      return; // Can't answer if no question
    }
    
    const player = this.world.getLocalPlayer();
    if (!player) return;
    
    // Send answer to the world trivia system
    this.sendNetworkBroadcastEvent(triviaAnswerSubmittedEvent, {
      playerId: player.id.toString(),
      answerIndex: answerIndex,
      responseTime: this.props.questionTimeLimit - this.timeRemaining
    });
    
    console.log(`TriviaGame: Player ${player.id} answered ${answerIndex}`);
  }

  initializeUI() {
    return View({
      style: {
        width: '100%',
        aspectRatio: 16/9, // 16:9 aspect ratio for widescreen display
        backgroundColor: this.props.backgroundColor,
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 32 // Increased padding for wider layout
      },
      children: [
        // Header with question number
        View({
          style: {
            width: '100%',
            height: 80, // Restored height for better visibility
            backgroundColor: this.props.headerColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            marginBottom: 20
          },
          children: Text({
            text: this.questionNumberBinding,
            style: {
              fontSize: 36, // Larger font for widescreen
              fontWeight: 'bold',
              color: 'white'
            }
          })
        }),

        // Main content area with timer, question, and answer count
        View({
          style: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          },
          children: [
            // Timer (left)
            View({
              style: {
                width: 90, // Larger timer for 16:9
                height: 90,
                backgroundColor: '#FF6B35',
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center'
              },
              children: Text({
                text: this.timerBinding,
                style: {
                  fontSize: 28, // Larger font for bigger timer
                  fontWeight: 'bold',
                  color: 'white'
                }
              })
            }),

            // Question (center)
            View({
              style: {
                flex: 1,
                backgroundColor: 'white',
                borderRadius: 16, // Larger radius for widescreen
                padding: 32, // Increased padding for more space
                marginHorizontal: 32, // More horizontal spacing
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: 'black',
                shadowOpacity: 0.1,
                shadowRadius: 6
              },
              children: Text({
                text: this.questionBinding,
                style: {
                  fontSize: Math.max(22, this.props.fontSize), // Larger font for widescreen
                  fontWeight: '500',
                  color: 'black',
                  textAlign: 'center'
                }
              })
            }),

            // Answer count (right)
            View({
              style: {
                alignItems: 'center'
              },
              children: [
                Text({
                  text: this.answerCountBinding,
                  style: {
                    fontSize: 38, // Larger answer count for widescreen
                    fontWeight: 'bold',
                    color: '#374151'
                  }
                }),
                Text({
                  text: 'Answers',
                  style: {
                    fontSize: 16, // Larger label text
                    color: '#6B7280'
                  }
                })
              ]
            })
          ]
        }),

        // Answer options grid
        View({
          style: {
            height: 160, // Increased height for better button proportions
            width: '100%',
            flexDirection: 'row',
            flexWrap: 'wrap'
          },
          children: [
            // Red answer (Triangle)
            this.createAnswerButton(0, '#DC2626', '▲'),
            
            // Blue answer (Diamond)
            this.createAnswerButton(1, '#2563EB', '♦'),
            
            // Yellow answer (Circle)
            this.createAnswerButton(2, '#EAB308', '●'),
            
            // Green answer (Square)
            this.createAnswerButton(3, '#16A34A', '■')
          ]
        })
      ]
    });
  }

  private createAnswerButton(index: number, color: string, icon: string) {
    return Pressable({
      onPress: () => this.handleAnswerPress(index),
      style: {
        flex: 1,
        minWidth: '47%', // Good width for 16:9
        backgroundColor: color,
        borderRadius: 12, // Restored larger radius
        padding: 20, // Increased padding for better proportions
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        margin: 8 // Restored margin for proper spacing
      },
      children: [
        // Icon
        Text({
          text: icon,
          style: {
            fontSize: 26, // Larger icon for widescreen
            color: 'white',
            fontWeight: 'bold',
            marginRight: 16 // More spacing
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
                fontSize: 20, // Larger answer text for widescreen
                fontWeight: '500',
                color: 'white'
              }
            }),
            
            // Results indicator
            UINode.if(
              this.showResultsBinding,
              View({
                style: {
                  marginTop: 6, // Slightly more spacing
                  flexDirection: 'row',
                  alignItems: 'center'
                },
                children: [
                  // Correct/incorrect indicator
                  Text({
                    text: this.correctAnswerBinding.derive(correct => correct === index ? '✅' : '❌'),
                    style: {
                      fontSize: 18, // Larger results indicator
                      marginRight: 6
                    }
                  }),
                  
                  // Answer count for this option
                  Text({
                    text: this.answerCountsBinding.derive(counts => `${counts[index] || 0} players`),
                    style: {
                      fontSize: 16, // Larger player count text
                      color: 'white',
                      opacity: 0.9
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
