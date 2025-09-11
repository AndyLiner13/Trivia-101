import * as hz from 'horizon/core';

/**
 * Utilities for player management in trivia games
 */
export class TriviaPlayerUtils {
  
  /**
   * Get all players currently in the world
   */
  static getWorldPlayers(world: hz.World): hz.Player[] {
    try {
      return world.getPlayers();
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Get player IDs as strings
   */
  static getPlayerIds(players: hz.Player[]): string[] {
    return players.map(player => {
      try {
        return player.id.toString();
      } catch (error) {
        return '';
      }
    }).filter(id => id !== '');
  }
  
  /**
   * Find player by ID
   */
  static findPlayerById(players: hz.Player[], playerId: string): hz.Player | null {
    return players.find(player => {
      try {
        return player.id.toString() === playerId;
      } catch (error) {
        return false;
      }
    }) || null;
  }
  
  /**
   * Get player name safely
   */
  static getPlayerName(player: hz.Player): string {
    try {
      return player.name.get();
    } catch (error) {
      return 'Unknown Player';
    }
  }
  
  /**
   * Check if player is valid and connected
   */
  static isPlayerValid(player: hz.Player | null): boolean {
    if (!player) return false;
    
    try {
      // Try to access player properties to see if they're still valid
      player.id.toString();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get player by name (case-insensitive)
   */
  static findPlayerByName(players: hz.Player[], name: string): hz.Player | null {
    const lowerName = name.toLowerCase();
    return players.find(player => {
      try {
        return this.getPlayerName(player).toLowerCase() === lowerName;
      } catch (error) {
        return false;
      }
    }) || null;
  }
  
  /**
   * Filter out disconnected or invalid players
   */
  static filterValidPlayers(players: hz.Player[]): hz.Player[] {
    return players.filter(player => this.isPlayerValid(player));
  }
  
  /**
   * Create player info object with safe access
   */
  static createPlayerInfo(player: hz.Player): { id: string; name: string; valid: boolean } {
    try {
      return {
        id: player.id.toString(),
        name: this.getPlayerName(player),
        valid: true
      };
    } catch (error) {
      return {
        id: '',
        name: 'Unknown Player',
        valid: false
      };
    }
  }
  
  /**
   * Get player count safely
   */
  static getPlayerCount(world: hz.World): number {
    try {
      return world.getPlayers().length;
    } catch (error) {
      return 0;
    }
  }
  
  /**
   * Check if player is the first (host) player
   */
  static isFirstPlayer(player: hz.Player, world: hz.World): boolean {
    try {
      const allPlayers = world.getPlayers();
      if (allPlayers.length === 0) return false;
      
      const firstPlayer = allPlayers[0];
      return player.id.toString() === firstPlayer.id.toString();
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get players excluding a specific player
   */
  static getPlayersExcluding(world: hz.World, excludePlayer: hz.Player): hz.Player[] {
    try {
      const allPlayers = world.getPlayers();
      const excludeId = excludePlayer.id.toString();
      return allPlayers.filter(player => {
        try {
          return player.id.toString() !== excludeId;
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      return [];
    }
  }
}
