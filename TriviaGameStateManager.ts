import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';
import { GameState, GameSettings, LeaderboardEntry } from './TriviaNetworkEvents';

/**
 * Manages common game state and UI bindings shared between components
 */
export class TriviaGameStateManager {
  // Game state bindings
  readonly gameStartedBinding = new ui.Binding(false);
  readonly gameEndedBinding = new ui.Binding(false);
  readonly showResultsBinding = new ui.Binding(false);
  readonly showLeaderboardBinding = new ui.Binding(false);
  readonly showWaitingBinding = new ui.Binding(true);
  readonly showErrorBinding = new ui.Binding(false);
  readonly errorMessageBinding = new ui.Binding("");
  
  // Question and answer bindings
  readonly currentQuestionBinding = new ui.Binding<any>(null);
  readonly currentQuestionIndexBinding = new ui.Binding(0);
  readonly selectedAnswerBinding = new ui.Binding<number | null>(null);
  readonly correctAnswerIndexBinding = new ui.Binding<number | null>(null);
  readonly isCorrectAnswerBinding = new ui.Binding(false);
  readonly answerSubmittedBinding = new ui.Binding(false);
  readonly answerRevealedBinding = new ui.Binding(false);
  
  // Score and leaderboard
  readonly scoreBinding = new ui.Binding(0);
  readonly lastRoundPointsBinding = new ui.Binding(0);
  readonly leaderboardDataBinding = new ui.Binding<LeaderboardEntry[]>([]);
  
  // Player tracking
  readonly playersInWorldBinding = new ui.Binding<string[]>([]);
  readonly playersAnsweredBinding = new ui.Binding<string[]>([]);
  readonly answerCountBinding = new ui.Binding(0);
  
  // Host status
  readonly isHostBinding = new ui.Binding(false);
  readonly hostPlayerIdBinding = new ui.Binding<string | null>(null);
  
  // View modes
  readonly currentViewModeBinding = new ui.Binding<'pre-game' | 'game-settings'>('pre-game');
  readonly layoutTypeBinding = new ui.Binding<'two-options' | 'four-options'>('four-options');
  readonly screenTypeBinding = new ui.Binding<'waiting' | 'two-options' | 'four-options' | 'results'>('waiting');
  
  // Game settings
  readonly gameSettingsBinding = new ui.Binding<GameSettings>({
    numberOfQuestions: 5,
    category: 'Italian Brainrot Quiz',
    difficulty: 'medium',
    timeLimit: 30,
    timerType: 'normal',
    difficultyType: 'medium',
    isLocked: true,
    modifiers: {
      autoAdvance: false,
      powerUps: false,
      bonusRounds: false
    }
  });
  
  // Timer
  readonly timerBinding = new ui.Binding("30");
  
  // Info popups
  readonly showInfoPopupBinding = new ui.Binding(false);
  readonly infoPopupTypeBinding = new ui.Binding<'timer' | 'difficulty' | 'modifiers' | 'questions'>('timer');
  readonly showLogoutPopupBinding = new ui.Binding(false);
  
  // Opted out status
  readonly isOptedOutBinding = new ui.Binding(false);
  
  // State tracking
  private currentGameState: GameState = 'waiting';
  private score: number = 0;
  private playersInWorld: string[] = [];
  private playersAnswered: string[] = [];
  private gameSettings: GameSettings = {
    numberOfQuestions: 5,
    category: 'Italian Brainrot Quiz',
    difficulty: 'medium',
    timeLimit: 30,
    timerType: 'normal',
    difficultyType: 'medium',
    isLocked: true,
    modifiers: {
      autoAdvance: false,
      powerUps: false,
      bonusRounds: false
    }
  };
  
  /**
   * Reset all game state for new game
   */
  resetGameState(): void {
    this.gameStartedBinding.set(false);
    this.gameEndedBinding.set(false);
    this.showResultsBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.showWaitingBinding.set(true);
    this.showErrorBinding.set(false);
    
    this.currentQuestionBinding.set(null);
    this.currentQuestionIndexBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.correctAnswerIndexBinding.set(null);
    this.isCorrectAnswerBinding.set(false);
    this.answerSubmittedBinding.set(false);
    this.answerRevealedBinding.set(false);
    
    this.scoreBinding.set(0);
    this.lastRoundPointsBinding.set(0);
    this.leaderboardDataBinding.set([]);
    
    this.playersAnsweredBinding.set([]);
    this.answerCountBinding.set(0);
    
    this.screenTypeBinding.set('waiting');
    this.layoutTypeBinding.set('four-options');
    
    this.score = 0;
    this.playersAnswered = [];
    this.currentGameState = 'waiting';
  }
  
  /**
   * Update game state
   */
  setGameState(state: GameState): void {
    this.currentGameState = state;
    
    // Update visibility bindings based on state
    this.showWaitingBinding.set(state === 'waiting');
    this.showResultsBinding.set(state === 'results');
    this.showLeaderboardBinding.set(state === 'leaderboard');
    this.gameEndedBinding.set(state === 'ended');
    
    if (state === 'playing') {
      this.gameStartedBinding.set(true);
    }
  }
  
  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.currentGameState;
  }
  
  /**
   * Update score
   */
  updateScore(points: number): void {
    this.score += points;
    this.scoreBinding.set(this.score);
    this.lastRoundPointsBinding.set(points);
  }
  
  /**
   * Set absolute score
   */
  setScore(score: number): void {
    this.score = score;
    this.scoreBinding.set(score);
  }
  
  /**
   * Get current score
   */
  getScore(): number {
    return this.score;
  }
  
  /**
   * Update player tracking
   */
  updatePlayers(playersInWorld: string[], playersAnswered: string[]): void {
    this.playersInWorld = playersInWorld;
    this.playersAnswered = playersAnswered;
    this.playersInWorldBinding.set(playersInWorld);
    this.playersAnsweredBinding.set(playersAnswered);
    this.answerCountBinding.set(playersAnswered.length);
  }
  
  /**
   * Check if player has answered
   */
  hasPlayerAnswered(playerId: string): boolean {
    return this.playersAnswered.includes(playerId);
  }
  
  /**
   * Add player to answered list
   */
  addAnsweredPlayer(playerId: string): void {
    if (!this.playersAnswered.includes(playerId)) {
      this.playersAnswered.push(playerId);
      this.playersAnsweredBinding.set([...this.playersAnswered]);
      this.answerCountBinding.set(this.playersAnswered.length);
    }
  }
  
  /**
   * Clear answered players for new question
   */
  clearAnsweredPlayers(): void {
    this.playersAnswered = [];
    this.playersAnsweredBinding.set([]);
    this.answerCountBinding.set(0);
  }
  
  /**
   * Update leaderboard data
   */
  updateLeaderboard(data: LeaderboardEntry[]): void {
    this.leaderboardDataBinding.set(data);
  }
  
  /**
   * Update game settings
   */
  updateGameSettings(settings: Partial<GameSettings>): void {
    this.gameSettings = { ...this.gameSettings, ...settings };
    this.gameSettingsBinding.set(this.gameSettings);
  }
  
  /**
   * Get game settings
   */
  getGameSettings(): GameSettings {
    return this.gameSettings;
  }
  
  /**
   * Set host status
   */
  setHostStatus(isHost: boolean, hostId: string | null): void {
    this.isHostBinding.set(isHost);
    this.hostPlayerIdBinding.set(hostId);
  }
  
  /**
   * Show error message
   */
  showError(message: string): void {
    this.errorMessageBinding.set(message);
    this.showErrorBinding.set(true);
  }
  
  /**
   * Hide error message
   */
  hideError(): void {
    this.showErrorBinding.set(false);
  }
}
