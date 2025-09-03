import * as hz from 'horizon/core';

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
interface SerializableGameState {
  [key: string]: hz.SerializableState;
  currentQuestionIndex: number;
  gamePhase: string; // 'waiting' | 'question' | 'results' | 'finished'
  timeRemaining: number;
  scores: { [key: string]: number };
  selectedAnswers: { [key: string]: number };
}

interface SerializableQuestion {
  [key: string]: hz.SerializableState;
  id: number;
  question: string;
  category: string;
  difficulty: string;
  answers: Array<{ text: string; correct: boolean }>;
}

// Network events for multiplayer communication
const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{ playerId: string, answerIndex: number, responseTime: number }>('triviaAnswerSubmitted');
const triviaGameStartEvent = new hz.NetworkEvent<{}>('triviaGameStart');
const triviaNextQuestionEvent = new hz.NetworkEvent<{}>('triviaNextQuestion');
const triviaGameResetEvent = new hz.NetworkEvent<{}>('triviaGameReset');
const triviaGameReadyEvent = new hz.NetworkEvent<{ totalQuestions: number, gameState: SerializableGameState }>('triviaGameReady');
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: SerializableQuestion, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: SerializableQuestion, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }>('triviaResults');
const triviaGameCompleteEvent = new hz.NetworkEvent<{ finalScores: Array<{ playerId: string, score: number }>, totalQuestions: number }>('triviaGameComplete');

/**
 * Trivia Question Text Display Component
 * 
 * This component attaches to a text gizmo and displays trivia questions
 * from a JSON asset. It runs continuously and syncs with other trivia text components.
 * 
 * Usage:
 * 1. Upload a trivia.json file to your Asset Library
 * 2. Attach this script to a text gizmo in your world
 * 3. Assign the trivia JSON asset to the triviaAsset property
 * 4. The display will show questions and coordinate with answer/timer text objects
 */
export class TriviaQuestionText extends hz.Component<typeof TriviaQuestionText> {
  
  static propsDefinition = {
    // Reference to the trivia questions JSON asset
    triviaAsset: { type: hz.PropTypes.Asset },
    
    // Game configuration
    questionTimeLimit: { type: hz.PropTypes.Number, default: 30 },
    showCorrectAnswer: { type: hz.PropTypes.Boolean, default: true },
    autoAdvanceTime: { type: hz.PropTypes.Number, default: 5 },
    
    // Display settings
    fontSize: { type: hz.PropTypes.Number, default: 24 },
    textColor: { type: hz.PropTypes.String, default: "#FFFFFF" },
    backgroundColor: { type: hz.PropTypes.String, default: "#6366F1" }
  };

  // Game data
  private triviaQuestions: TriviaQuestion[] = [];
  private currentQuestionIndex: number = 0;

  // Timer management
  private roundTimeoutId: number | null = null;

  // Text gizmo reference
  private textGizmo: hz.TextGizmo | null = null;

  async start() {
    console.log("TriviaQuestionText: Starting up...");
    
    // Get reference to the text gizmo this component is attached to
    this.textGizmo = this.entity.as(hz.TextGizmo);
    if (!this.textGizmo) {
      console.error("TriviaQuestionText: This component must be attached to a text gizmo!");
      return;
    }

    // Load trivia questions from asset
    await this.loadTriviaQuestions();
    
    // Start continuous trivia game immediately
    this.startContinuousTrivia();
  }

  private async loadTriviaQuestions(): Promise<void> {
    if (!this.props.triviaAsset) {
      console.error("TriviaQuestionText: No trivia asset assigned!");
      this.setDisplayText("No trivia asset assigned! Please assign a JSON asset with trivia questions.");
      return;
    }

    try {
      const assetData = await this.props.triviaAsset.fetchAsData();
      const jsonData = assetData.asJSON<TriviaQuestion[]>();
      
      if (!jsonData || !Array.isArray(jsonData)) {
        throw new Error("Invalid JSON format - expected array of trivia questions");
      }

      this.triviaQuestions = jsonData;
      console.log(`TriviaQuestionText: Loaded ${this.triviaQuestions.length} trivia questions`);
      
    } catch (error) {
      console.error("TriviaQuestionText: Failed to load trivia questions:", error);
      this.setDisplayText("Failed to load trivia questions. Please check the JSON asset format.");
    }
  }

  private startContinuousTrivia(): void {
    if (this.triviaQuestions.length === 0) {
      this.setDisplayText("No trivia questions available. Please check the asset.");
      return;
    }

    // Start with first question
    this.currentQuestionIndex = 0;
    this.showCurrentQuestion();
  }

  private showCurrentQuestion(): void {
    // Make sure we have questions
    if (this.triviaQuestions.length === 0) {
      this.setDisplayText("Loading questions...");
      return;
    }

    // Get current question
    const question = this.triviaQuestions[this.currentQuestionIndex];
    if (!question) {
      this.setDisplayText("Error loading question");
      return;
    }

    // Display the question
    this.setDisplayText(question.question);

    // Send question to other components
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
      timeLimit: 30
    });

    // Schedule next question in 30 seconds
    this.scheduleNextQuestion();
  }

  private scheduleNextQuestion(): void {
    // Clear any existing timer
    if (this.roundTimeoutId) {
      this.async.clearTimeout(this.roundTimeoutId);
    }

    // Schedule next question
    this.roundTimeoutId = this.async.setTimeout(() => {
      this.moveToNextQuestion();
    }, 30000); // 30 seconds
  }

  private moveToNextQuestion(): void {
    // Show results briefly
    this.showResults();

    // Move to next question after 5 seconds
    this.async.setTimeout(() => {
      this.currentQuestionIndex++;
      
      // Loop back to first question if we've reached the end
      if (this.currentQuestionIndex >= this.triviaQuestions.length) {
        this.currentQuestionIndex = 0;
      }
      
      this.showCurrentQuestion();
    }, 5000);
  }

  private showResults(): void {
    const question = this.triviaQuestions[this.currentQuestionIndex];
    if (!question) return;

    // Find correct answer
    const correctAnswerIndex = question.answers.findIndex(a => a.correct);
    const correctAnswer = question.answers[correctAnswerIndex];

    // Show correct answer briefly
    this.setDisplayText(`Correct Answer: ${correctAnswer?.text || 'Unknown'}`);

    // Send results to other components
    const serializableQuestion: SerializableQuestion = {
      id: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      answers: question.answers.map(a => ({ text: a.text, correct: a.correct }))
    };

    this.sendNetworkBroadcastEvent(triviaResultsEvent, {
      question: serializableQuestion,
      correctAnswerIndex: correctAnswerIndex,
      answerCounts: [0, 0, 0, 0], // Default counts
      scores: {}
    });
  }

  private setDisplayText(text: string): void {
    if (this.textGizmo) {
      this.textGizmo.text.set(text);
      console.log(`TriviaQuestionText: Displaying - ${text}`);
    }
  }

  dispose(): void {
    if (this.roundTimeoutId) {
      this.async.clearTimeout(this.roundTimeoutId);
      this.roundTimeoutId = null;
    }
    super.dispose();
  }
}

// Register the component so it can be attached to entities
hz.Component.register(TriviaQuestionText);
