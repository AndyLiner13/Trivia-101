/**
 * Horizon Worlds Trivia Game - Player Manager
 * 
 * Centralized player state management system that handles:
 * - Player tracking and world population monitoring
 * - Host assignment and permissions management
 * - Answer submission and opt-out state tracking
 * - Player statistics and scoring coordination
 * 
 * This manager is used by both TriviaGame and TriviaPhone components
 * to maintain consistent player state across the multiplayer session.
 * 
 * @author AndyLiner13
 * @version 1.0.0
 * @license MIT
 */

import * as hz from 'horizon/core';
export class PlayerManager {
  private playersInWorld: Set<string> = new Set();
  private optedOutPlayers: Set<string> = new Set();
  private answeredPlayers: Set<string> = new Set();
  private playerAnswers: Map<string, number> = new Map(); // Track which answer each player selected
  private hostPlayerId: string | null = null;
  
  /**
   * Update the list of players in the world
   */
  updatePlayersInWorld(players: hz.Player[]): void {
    this.playersInWorld.clear();
    players.forEach(player => {
      this.playersInWorld.add(player.id.toString());
    });
  }
  
  /**
   * Check if player is in the world
   */
  isPlayerInWorld(playerId: string): boolean {
    return this.playersInWorld.has(playerId);
  }
  
  /**
   * Get list of player IDs in the world
   */
  getPlayersInWorld(): string[] {
    return Array.from(this.playersInWorld);
  }
  
  /**
   * Get count of players in the world
   */
  getPlayerCount(): number {
    return this.playersInWorld.size;
  }
  
  /**
   * Add player to opted out list and remove their answer if they already answered
   * Returns the answer index that was removed, or null if no answer was removed
   */
  optOutPlayer(playerId: string): number | null {
    this.optedOutPlayers.add(playerId);
    let removedAnswerIndex: number | null = null;
    
    // Remove player from answered list if they had already answered (their answer no longer counts)
    if (this.answeredPlayers.has(playerId)) {
      this.answeredPlayers.delete(playerId);
      removedAnswerIndex = this.playerAnswers.get(playerId) || null;
      this.playerAnswers.delete(playerId);
    }
    
    return removedAnswerIndex;
  }
  
  /**
   * Remove player from opted out list
   */
  rejoinPlayer(playerId: string): void {
    this.optedOutPlayers.delete(playerId);
  }
  
  /**
   * Check if player has opted out
   */
  isPlayerOptedOut(playerId: string): boolean {
    return this.optedOutPlayers.has(playerId);
  }
  
  /**
   * Get list of opted out players
   */
  getOptedOutPlayers(): string[] {
    return Array.from(this.optedOutPlayers);
  }
  
  /**
   * Add player to answered list for current question and track their answer
   */
  addAnsweredPlayer(playerId: string, answerIndex?: number): void {
    // Handle 'local' player ID from mobile users - always accept these
    if (playerId === 'local' || !this.optedOutPlayers.has(playerId)) {
      this.answeredPlayers.add(playerId);
      if (answerIndex !== undefined) {
        this.playerAnswers.set(playerId, answerIndex);
      }
    }
  }
  
  /**
   * Check if player has answered current question
   */
  hasPlayerAnswered(playerId: string): boolean {
    return this.answeredPlayers.has(playerId);
  }
  
  /**
   * Clear answered players for new question
   */
  clearAnsweredPlayers(): void {
    this.answeredPlayers.clear();
    this.playerAnswers.clear(); // Also clear the tracked answers
  }
  
  /**
   * Get list of players who answered
   */
  getAnsweredPlayers(): string[] {
    return Array.from(this.answeredPlayers);
  }
  
  /**
   * Get count of players who answered
   */
  getAnsweredCount(): number {
    return this.answeredPlayers.size;
  }
  
  /**
   * Get count of active (non-opted-out) players
   */
  getActivePlayerCount(): number {
    return this.playersInWorld.size - this.optedOutPlayers.size;
  }
  
  /**
   * Get list of active player IDs
   */
  getActivePlayers(): string[] {
    return this.getPlayersInWorld().filter(playerId => !this.isPlayerOptedOut(playerId));
  }
  
  /**
   * Set the host player
   */
  setHost(playerId: string): void {
    this.hostPlayerId = playerId;
  }
  
  /**
   * Get the host player ID
   */
  getHostId(): string | null {
    return this.hostPlayerId;
  }
  
  /**
   * Check if player is the host
   */
  isHost(playerId: string): boolean {
    return this.hostPlayerId === playerId;
  }
  
  /**
   * Clear host
   */
  clearHost(): void {
    this.hostPlayerId = null;
  }
  
  /**
   * Reset all player state
   */
  reset(): void {
    this.playersInWorld.clear();
    this.optedOutPlayers.clear();
    this.answeredPlayers.clear();
    this.hostPlayerId = null;
  }
  
  /**
   * Remove player from all tracking when they leave
   */
  removePlayer(playerId: string): void {
    this.playersInWorld.delete(playerId);
    this.optedOutPlayers.delete(playerId);
    this.answeredPlayers.delete(playerId);
    
    if (this.hostPlayerId === playerId) {
      this.hostPlayerId = null;
    }
  }
  
  /**
   * Get statistics for debugging
   */
  getStats(): {
    totalPlayers: number;
    activePlayers: number;
    optedOutPlayers: number;
    answeredPlayers: number;
    hostId: string | null;
  } {
    return {
      totalPlayers: this.playersInWorld.size,
      activePlayers: this.getActivePlayerCount(),
      optedOutPlayers: this.optedOutPlayers.size,
      answeredPlayers: this.answeredPlayers.size,
      hostId: this.hostPlayerId
    };
  }
}
