import * as hz from 'horizon/core';

// Network events for syncing with other trivia components
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number } }>('triviaResults');

/**
 * Trivia Timer Text Display Component
 * 
 * This component attaches to a text gizmo and displays the countdown timer
 * for trivia questions. It syncs with the TriviaQuestionText component.
 * 
 * Usage:
 * 1. Attach this script to a text gizmo in your world
 * 2. Position it where you want the timer to appear
 * 3. The timer will automatically sync with trivia questions
 */
export class TriviaTimerText extends hz.Component<typeof TriviaTimerText> {
  
  static propsDefinition = {
    // Display settings
    fontSize: { type: hz.PropTypes.Number, default: 48 },
    textColor: { type: hz.PropTypes.String, default: "#FF4444" },
    backgroundColor: { type: hz.PropTypes.String, default: "#000000" }
  };

  // Timer state
  private timeRemaining: number = 30;
  private isActive: boolean = false;
  private timerTimeoutId: number | null = null;
  private autoStartTimeoutId: number | null = null;

  // Text gizmo reference
  private textGizmo: hz.TextGizmo | null = null;

  async start() {
    console.log("TriviaTimerText: Starting up...");
    
    // Get reference to the text gizmo this component is attached to
    this.textGizmo = this.entity.as(hz.TextGizmo);
    if (!this.textGizmo) {
      console.error("TriviaTimerText: This component must be attached to a text gizmo!");
      return;
    }

    // Initialize display and start auto countdown
    this.setDisplayText("⏰ 30");
    
    // Set up network event listeners
    this.setupNetworkEvents();
    
    // Start auto timer that restarts every 30 seconds
    this.startAutoTimer();
  }

  private setupNetworkEvents(): void {
    // Listen for question start events
    this.connectNetworkBroadcastEvent(triviaQuestionShowEvent, this.onQuestionStart.bind(this));
    
    // Listen for results events (to stop timer)
    this.connectNetworkBroadcastEvent(triviaResultsEvent, this.onQuestionEnd.bind(this));
  }

  private onQuestionStart(eventData: { question: any, questionIndex: number, timeLimit: number }): void {
    this.timeRemaining = eventData.timeLimit;
    this.isActive = true;
    this.startCountdown();
  }

  private onQuestionEnd(eventData: any): void {
    this.isActive = false;
    if (this.timerTimeoutId) {
      this.async.clearTimeout(this.timerTimeoutId);
      this.timerTimeoutId = null;
    }
    
    // Show "TIME'S UP!" briefly
    this.setDisplayText("⏰ TIME'S UP!");
    
    // Reset after a moment
    this.async.setTimeout(() => {
      this.setDisplayText("⏰ --");
    }, 2000);
  }

  private startAutoTimer(): void {
    this.timeRemaining = 30;
    this.isActive = true;
    this.startCountdown();
  }

  private startCountdown(): void {
    if (this.timerTimeoutId) {
      this.async.clearTimeout(this.timerTimeoutId);
    }

    const countdown = () => {
      if (!this.isActive) return;
      
      this.updateTimerDisplay();
      
      if (this.timeRemaining <= 0) {
        this.isActive = false;
        this.setDisplayText("⏰ 0");
        
        // Auto-restart timer after 5 seconds (for results display)
        this.autoStartTimeoutId = this.async.setTimeout(() => {
          this.startAutoTimer();
        }, 5000);
      } else {
        this.timeRemaining--;
        // Schedule next countdown
        this.timerTimeoutId = this.async.setTimeout(countdown, 1000);
      }
    };

    // Start the countdown
    this.updateTimerDisplay();
    this.timerTimeoutId = this.async.setTimeout(countdown, 1000);
  }

  private updateTimerDisplay(): void {
    if (this.timeRemaining <= 0) {
      this.setDisplayText("⏰ 0");
      return;
    }

    // Color code the timer based on time remaining
    let timerText: string;
    if (this.timeRemaining > 10) {
      timerText = `⏰ ${this.timeRemaining}`;
    } else if (this.timeRemaining > 5) {
      timerText = `⚠️ ${this.timeRemaining}`;
    } else {
      timerText = `🚨 ${this.timeRemaining}`;
    }

    this.setDisplayText(timerText);
  }

  private setDisplayText(text: string): void {
    if (this.textGizmo) {
      this.textGizmo.text.set(text);
    }
  }

  dispose(): void {
    if (this.timerTimeoutId) {
      this.async.clearTimeout(this.timerTimeoutId);
      this.timerTimeoutId = null;
    }
    if (this.autoStartTimeoutId) {
      this.async.clearTimeout(this.autoStartTimeoutId);
      this.autoStartTimeoutId = null;
    }
    super.dispose();
  }
}

// Register the component so it can be attached to entities
hz.Component.register(TriviaTimerText);
