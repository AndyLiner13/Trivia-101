import * as hz from 'horizon/core';
import { LeaderboardEntry } from './TriviaNetworkEvents';

/**
 * Manages scoring and leaderboard functionality for trivia games
 */
export class TriviaScoreManager {
  private localPlayerScores = new Map<string, number>();
  private persistentLeaderboardScores = new Map<string, number>();
  
  /**
   * Get player's current score
   */
  getPlayerScore(player: hz.Player): number {
    try {
      const playerId = player.id.toString();
      return this.localPlayerScores.get(playerId) || 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Set player's score
   */
  setPlayerScore(player: hz.Player, score: number): void {
    try {
      const playerId = player.id.toString();
      this.localPlayerScores.set(playerId, score);
    } catch (error) {
      // Error setting player score
    }
  }
  
  /**
   * Add points to player's score
   */
  addPointsToPlayer(player: hz.Player, points: number): void {
    const currentScore = this.getPlayerScore(player);
    this.setPlayerScore(player, currentScore + points);
  }
  
  /**
   * Calculate points based on speed (faster = more points)
   */
  calculateSpeedBonus(responseTime: number, timeLimit: number, basePoints: number = 1000): number {
    const timeRatio = Math.max(0, (timeLimit - responseTime) / timeLimit);
    const speedMultiplier = 1 + (timeRatio * 0.5); // Up to 50% bonus for fast answers
    return Math.round(basePoints * speedMultiplier);
  }
  
  /**
   * Generate leaderboard from current scores
   */
  generateLeaderboard(players: hz.Player[]): LeaderboardEntry[] {
    const leaderboard: LeaderboardEntry[] = [];
    
    for (const player of players) {
      try {
        const playerId = player.id.toString();
        const score = this.getPlayerScore(player);
        const playerName = player.name.get();
        
        leaderboard.push({
          name: playerName,
          score: score,
          playerId: playerId
        });
      } catch (error) {
        // Failed to add player to leaderboard
      }
    }
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    return leaderboard;
  }
  
  /**
   * Reset all scores
   */
  resetAllScores(): void {
    this.localPlayerScores.clear();
    this.persistentLeaderboardScores.clear();
  }
  
  /**
   * Get top N players
   */
  getTopPlayers(players: hz.Player[], count: number = 10): LeaderboardEntry[] {
    const leaderboard = this.generateLeaderboard(players);
    return leaderboard.slice(0, count);
  }
  
  /**
   * Check if player has any points
   */
  hasPlayerScored(player: hz.Player): boolean {
    return this.getPlayerScore(player) > 0;
  }
  
  /**
   * Get total points awarded across all players
   */
  getTotalPointsAwarded(): number {
    let total = 0;
    this.localPlayerScores.forEach((score) => {
      total += score;
    });
    return total;
  }
  
  /**
   * Update persistent leaderboard score (if using native leaderboards)
   */
  updatePersistentScore(player: hz.Player, points: number): void {
    try {
      const playerId = player.id.toString();
      const currentPersistent = this.persistentLeaderboardScores.get(playerId) || 0;
      this.persistentLeaderboardScores.set(playerId, currentPersistent + points);
      
      // Note: In a real implementation, you might want to use hz.Leaderboards
      // or another persistent storage mechanism here
    } catch (error) {
      // Failed to update persistent score
    }
  }
}
