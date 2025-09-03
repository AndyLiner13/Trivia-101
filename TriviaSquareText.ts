import * as hz from 'horizon/core';

// Network events for syncing with other trivia components
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }>('triviaResults');

/**
 * Trivia Square Answer Text Display Component
 * 
 * This component attaches to a text gizmo and displays the second answer choice (square)
 * for trivia questions. It syncs with the TriviaQuestionText component.
 * 
 * Usage:
 * 1. Attach this script to a text gizmo in your world
 * 2. Position it where you want the square answer to appear
 * 3. The answer will automatically sync with trivia questions
 */
export class TriviaSquareText extends hz.Component<typeof TriviaSquareText> {
  
  static propsDefinition = {
    // Display settings
    fontSize: { type: hz.PropTypes.Number, default: 24 },
    textColor: { type: hz.PropTypes.String, default: "#FFFFFF" },
    backgroundColor: { type: hz.PropTypes.String, default: "#4444FF" }
  };

  // Answer state
  private currentAnswer: string = "";
  private isCorrect: boolean = false;
  private showingResults: boolean = false;

  // Text gizmo reference
  private textGizmo: hz.TextGizmo | null = null;

  async start() {
    console.log("TriviaSquareText: Starting up...");
    
    // Get reference to the text gizmo this component is attached to
    this.textGizmo = this.entity.as(hz.TextGizmo);
    if (!this.textGizmo) {
      console.error("TriviaSquareText: This component must be attached to a text gizmo!");
      return;
    }

    // Initialize display
    this.setDisplayText("🟦 Waiting for question...");
    
    // Set up network event listeners
    this.setupNetworkEvents();
  }

  private setupNetworkEvents(): void {
    // Listen for question start events
    this.connectNetworkBroadcastEvent(triviaQuestionShowEvent, this.onQuestionStart.bind(this));
    
    // Listen for results events
    this.connectNetworkBroadcastEvent(triviaResultsEvent, this.onQuestionResults.bind(this));
  }

  private onQuestionStart(eventData: { question: any, questionIndex: number, timeLimit: number }): void {
    const question = eventData.question;
    if (question && question.answers && question.answers.length > 1) {
      this.currentAnswer = question.answers[1].text;
      this.isCorrect = question.answers[1].correct;
      this.showingResults = false;
      
      this.setDisplayText(`🟦 ${this.currentAnswer}`);
    }
  }

  private onQuestionResults(eventData: { question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }): void {
    this.showingResults = true;
    
    // Show if this answer was correct with count
    const answerCount = eventData.answerCounts[1] || 0;
    const isCorrectAnswer = eventData.correctAnswerIndex === 1;
    
    let resultText: string;
    if (isCorrectAnswer) {
      resultText = `🟦 ✅ ${this.currentAnswer}\n${answerCount} players`;
    } else {
      resultText = `🟦 ❌ ${this.currentAnswer}\n${answerCount} players`;
    }
    
    this.setDisplayText(resultText);
    
    // Clear results after a few seconds
    this.async.setTimeout(() => {
      this.showingResults = false;
      this.setDisplayText("🟦 Next question...");
    }, 3000);
  }

  private setDisplayText(text: string): void {
    if (this.textGizmo) {
      this.textGizmo.text.set(text);
    }
  }
}

// Register the component so it can be attached to entities
hz.Component.register(TriviaSquareText);
