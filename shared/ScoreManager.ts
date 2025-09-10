import * as hz from 'horizon/core';
import { LeaderboardEntry } from './NetworkEvents';

/**
 * Centralized scoring and leaderboard management
 */
export class ScoreManager {
  private playerScores = new Map<string, number>();
  private localPlayerScores = new Map<string, number>();
  
  /**
   * Get player's current score
   */
  getPlayerScore(playerId: string): number {
    return this.playerScores.get(playerId) || 0;
  }
  
  /**
   * Update player's score
   */
  updatePlayerScore(playerId: string, score: number): void {
    this.playerScores.set(playerId, score);
  }
  
  /**
   * Add points to player's score
   */
  addPointsToPlayer(playerId: string, points: number): number {
    const currentScore = this.getPlayerScore(playerId);
    const newScore = currentScore + points;
    this.updatePlayerScore(playerId, newScore);
    return newScore;
  }
  
  /**
   * Calculate speed bonus based on response time
   */
  calculateSpeedBonus(responseTime: number, timeLimit: number): number {
    const speedRatio = 1 - (responseTime / timeLimit);
    if (speedRatio > 0.8) return 2; // Very fast
    if (speedRatio > 0.6) return 1; // Fast
    return 0; // Normal speed, no bonus
  }
  
  /**
   * Calculate points for correct answer with speed bonus
   */
  calculateAnswerPoints(isCorrect: boolean, responseTime: number, timeLimit: number): number {
    if (!isCorrect) return 0;
    
    const basePoints = 100;
    const speedBonus = this.calculateSpeedBonus(responseTime, timeLimit);
    return basePoints + (speedBonus * 50);
  }
  
  /**
   * Generate leaderboard data sorted by score
   */
  generateLeaderboard(world: hz.World): LeaderboardEntry[] {
    const players = world.getPlayers();
    const leaderboard: LeaderboardEntry[] = [];
    
    players.forEach(player => {
      const score = this.getPlayerScore(player.id.toString());
      if (score > 0) { // Only include players with scores
        leaderboard.push({
          name: player.name.get(),
          score: score,
          playerId: player.id.toString()
        });
      }
    });
    
    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);
    
    return leaderboard;
  }
  
  /**
   * Reset all scores
   */
  resetAllScores(): void {
    this.playerScores.clear();
    this.localPlayerScores.clear();
  }
  
  /**
   * Get top N players
   */
  getTopPlayers(world: hz.World, count: number = 5): LeaderboardEntry[] {
    const leaderboard = this.generateLeaderboard(world);
    return leaderboard.slice(0, count);
  }
  
  /**
   * Check if player has any score
   */
  hasScore(playerId: string): boolean {
    return this.playerScores.has(playerId) && this.getPlayerScore(playerId) > 0;
  }
  
  /**
   * Get total number of players with scores
   */
  getActivePlayers(): number {
    let count = 0;
    for (const score of this.playerScores.values()) {
      if (score > 0) count++;
    }
    return count;
  }
}

/**
 * Timeout management utility for cleaning up async operations
 */
export class TimeoutManager {
  private pendingTimeouts = new Set<any>();
  
  /**
   * Create a managed timeout
   */
  setTimeout(asyncManager: any, callback: () => void, delay: number): void {
    const timeoutId = asyncManager.setTimeout(() => {
      this.pendingTimeouts.delete(timeoutId);
      callback();
    }, delay);
    this.pendingTimeouts.add(timeoutId);
  }
  
  /**
   * Clear all pending timeouts
   */
  clearAllTimeouts(asyncManager: any): void {
    this.pendingTimeouts.forEach(timeoutId => {
      asyncManager.clearTimeout(timeoutId);
    });
    this.pendingTimeouts.clear();
  }
  
  /**
   * Get count of pending timeouts
   */
  getPendingCount(): number {
    return this.pendingTimeouts.size;
  }
}
