# Trivia System Variable Integration

## Changes Made

The trivia system has been updated to use the real Horizon Worlds "Trivia" variable group instead of local tracking.

### Variable Group Structure
- **Group Name**: Trivia
- **Player Persistent Variables**: 
  - `Points` (number) - Temporary points for current game session
- **World Variables**: 
  - `TotalPoints` (number) - Cumulative points across all games

### Updated Files

#### TriviaApp.ts
- Added variable group integration methods:
  - `initializeVariableGroups()` - Sets up variable access
  - `getPlayerPoints()` - Reads player's current points from variables
  - `setPlayerPoints()` - Updates player's points in variables
  - `addPlayerPoints()` - Adds points and updates world total
  - `addToWorldTotalPoints()` - Updates the world total points
  - `resetPlayerPoints()` - Resets player points to 0 for new games

- Updated game flow:
  - `setAssignedPlayer()` - Loads current points when player is assigned
  - `handleAnswerSelect()` - Uses real variable system for scoring
  - `resetGame()` - Resets points to 0 for new games

#### TriviaGame.ts
- Added variable system methods:
  - `getPlayerPoints()` - Gets points from variable system
  - `setPlayerPoints()` - Sets points in variable system
  - `addToTotalPoints()` - Adds to world total points
  - `resetAllPlayerPoints()` - Resets all players to 0 points

- Updated game management:
  - `handleStartGame()` - Resets all player points when host starts game
  - `onGameStart()` - Resets points for non-host players
  - `generateRealLeaderboard()` - Uses real variables for leaderboard scores

## How It Works

### Points System
1. **Temporary Points**: The `Points` variable is reset to 0 at the start of each trivia game
2. **Persistent Total**: The `TotalPoints` variable accumulates across all games and persists
3. **Automatic Management**: Points are automatically added to both player total and world total when correct answers are given

### Game Flow
1. When trivia game starts → All player `Points` reset to 0
2. Player answers correctly → `Points` +1, `TotalPoints` +1
3. Game continues → Points accumulate during session
4. Next game starts → `Points` reset to 0, `TotalPoints` persists

### Variable Access
- Player variables: `world.persistentStorage.getPlayerVariable(player, 'Points')`
- World variables: `world.persistentStorageWorld.getWorldVariable('TotalPoints')`

## Testing the Integration

To verify the system is working:

1. **Start a trivia game** - Check that all players start with 0 points
2. **Answer questions correctly** - Verify points increase in real-time
3. **Check leaderboard** - Confirm scores match the variable values
4. **Start new game** - Verify Points reset to 0 but TotalPoints persist
5. **Monitor console** - Look for variable update logs

## Console Messages to Watch For

```
TriviaApp: Setting player [PlayerName] points to [X]
TriviaApp: Added [X] to world total points. New total: [Y]
TriviaGame: Setting player [PlayerName] points to [X]
TriviaGame: Resetting all player points to 0 for new game
```

The system now uses real Horizon Worlds variables and will persist data correctly across sessions!
