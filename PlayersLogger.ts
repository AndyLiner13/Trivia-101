import * as hz from 'horizon/core';

/**
 * PlayersLogger script that logs all players in the world upon initialization
 * and then every 15 seconds as a single line per run.
 */
class PlayersLogger extends hz.Component<typeof PlayersLogger> {
  static propsDefinition = {};

  start() {
    // Log players immediately when the world starts
    this.logPlayersOneline();
    
    // Set up interval to log players every 15 seconds (15000 milliseconds)
    this.async.setInterval(() => {
      this.logPlayersOneline();
    }, 15000);
  }

  /**
   * Logs all players in the world as a single line
   */
  private logPlayersOneline() {
    const players = this.world.getPlayers();
    
    if (players.length === 0) {
      // No players in the world
    } else {
      const playerNames = players.map(player => player.name.get()).join(', ');
      // Players logged
    }
  }
}

// Register the component so it can be used in Horizon Worlds
hz.Component.register(PlayersLogger);
