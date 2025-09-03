import * as hz from 'horizon/core';

// Network events for syncing with world trivia game (same as used by other trivia components)
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }>('triviaResults');
const triviaGameCompleteEvent = new hz.NetworkEvent<{ finalScores: Array<{ playerId: string, score: number }>, totalQuestions: number }>('triviaGameComplete');

/**
 * Trivia Sync Component
 * 
 * This component listens to world trivia game events and can be used to sync
 * the MePhone TriviaApp with the world trivia game. Attach this to any entity
 * in your world to enable trivia sync functionality.
 * 
 * Usage:
 * 1. Attach this script to any entity in your world (like an invisible cube)
 * 2. The component will automatically listen for trivia game events
 * 3. Access the component via code to get current trivia state
 */
export class TriviaSync extends hz.Component<typeof TriviaSync> {
  
  static propsDefinition = {
    // Enable debug logging
    enableDebugLog: { type: hz.PropTypes.Boolean, default: false }
  };

  // Current trivia state
  private currentQuestion: any = null;
  private currentQuestionIndex: number = 0;
  private currentResults: any = null;
  private gameComplete: boolean = false;
  private timeLimit: number = 30;

  // Callbacks for external systems (like MePhone)
  private onQuestionCallback: ((questionData: { question: any, questionIndex: number, timeLimit: number }) => void) | null = null;
  private onResultsCallback: ((resultsData: { question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }) => void) | null = null;
  private onGameCompleteCallback: ((gameData: { finalScores: Array<{ playerId: string, score: number }>, totalQuestions: number }) => void) | null = null;

  async start() {
    if (this.props.enableDebugLog) {
      console.log("TriviaSync: Starting up...");
    }
    
    this.setupNetworkListeners();
  }

  private setupNetworkListeners(): void {
    // Listen for question start events
    this.connectNetworkBroadcastEvent(triviaQuestionShowEvent, this.onQuestionShow.bind(this));
    
    // Listen for results events
    this.connectNetworkBroadcastEvent(triviaResultsEvent, this.onResults.bind(this));
    
    // Listen for game complete events
    this.connectNetworkBroadcastEvent(triviaGameCompleteEvent, this.onGameComplete.bind(this));
  }

  private onQuestionShow(eventData: { question: any, questionIndex: number, timeLimit: number }): void {
    if (this.props.enableDebugLog) {
      console.log("TriviaSync: Question show event received", eventData);
    }
    
    this.currentQuestion = eventData.question;
    this.currentQuestionIndex = eventData.questionIndex;
    this.timeLimit = eventData.timeLimit;
    this.gameComplete = false;
    
    // Notify external systems
    if (this.onQuestionCallback) {
      this.onQuestionCallback(eventData);
    }
  }

  private onResults(eventData: { question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }): void {
    if (this.props.enableDebugLog) {
      console.log("TriviaSync: Results event received", eventData);
    }
    
    this.currentResults = eventData;
    
    // Notify external systems
    if (this.onResultsCallback) {
      this.onResultsCallback(eventData);
    }
  }

  private onGameComplete(eventData: { finalScores: Array<{ playerId: string, score: number }>, totalQuestions: number }): void {
    if (this.props.enableDebugLog) {
      console.log("TriviaSync: Game complete event received", eventData);
    }
    
    this.gameComplete = true;
    
    // Notify external systems
    if (this.onGameCompleteCallback) {
      this.onGameCompleteCallback(eventData);
    }
  }

  // Public API for external systems to register callbacks
  public setOnQuestionCallback(callback: (questionData: { question: any, questionIndex: number, timeLimit: number }) => void): void {
    this.onQuestionCallback = callback;
  }

  public setOnResultsCallback(callback: (resultsData: { question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }) => void): void {
    this.onResultsCallback = callback;
  }

  public setOnGameCompleteCallback(callback: (gameData: { finalScores: Array<{ playerId: string, score: number }>, totalQuestions: number }) => void): void {
    this.onGameCompleteCallback = callback;
  }

  // Public API to get current state
  public getCurrentQuestion(): any {
    return this.currentQuestion;
  }

  public getCurrentQuestionIndex(): number {
    return this.currentQuestionIndex;
  }

  public getCurrentResults(): any {
    return this.currentResults;
  }

  public isGameComplete(): boolean {
    return this.gameComplete;
  }

  public getTimeLimit(): number {
    return this.timeLimit;
  }

  dispose(): void {
    // Clean up callbacks
    this.onQuestionCallback = null;
    this.onResultsCallback = null;
    this.onGameCompleteCallback = null;
  }
}

// Register the component so it can be attached to entities
hz.Component.register(TriviaSync);
