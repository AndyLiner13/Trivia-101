# API Reference

This document provides an API reference for developers who want to extend or integrate with the Horizon Worlds Trivia Game.

## Core Classes

### TriviaGame

The main game engine class that manages the trivia game flow.

#### Constructor
```typescript
class TriviaGame extends ui.UIComponent
```

#### Key Methods

##### `async start(): Promise<void>`
Initializes the trivia game system.
- Loads assets and questions
- Sets up network event listeners
- Initializes player management
- Configures UI components

##### `handleStartGame(): Promise<void>`
Starts a new trivia game session.
- Validates game configuration
- Shuffles questions
- Broadcasts game start to all players
- Initializes game timer

##### `showNextQuestion(): void`
Displays the next question in the sequence.
- Updates question display
- Starts answer timer
- Broadcasts question to all players
- Handles special question types

##### `endGame(): void`
Ends the current game session.
- Calculates final scores
- Displays final leaderboard
- Resets game state
- Cleans up resources

#### Events Emitted
- `triviaGameStartEvent`: Game session started
- `triviaQuestionShowEvent`: New question displayed
- `triviaResultsEvent`: Question results available
- `triviaGameEndEvent`: Game session ended

### TriviaPhone

The player interface class providing phone-style interaction.

#### Constructor
```typescript
class TriviaPhone extends ui.UIComponent<typeof TriviaPhone>
```

#### Key Methods

##### `submitAnswer(answerIndex: number): void`
Submits a player's answer to the current question.
```typescript
// Example usage
triviaPhone.submitAnswer(2); // Submit answer option 3 (0-indexed)
```

##### `joinGame(): void`
Adds the player to the current trivia session.

##### `leaveGame(): void`
Removes the player from the current trivia session.

##### `navigateToGameSettings(): void`
Opens the game configuration interface (host only).

#### Events Emitted
- `triviaAnswerSubmittedEvent`: Player submitted an answer
- `triviaPlayerJoinEvent`: Player joined the game
- `triviaPlayerLeaveEvent`: Player left the game

## Manager Classes

### PlayerManager

Manages player states and interactions.

#### Methods

##### `addPlayer(player: hz.Player): void`
Adds a player to the managed player list.

##### `removePlayer(playerId: string): void`
Removes a player from the managed list.

##### `updatePlayerScore(playerId: string, score: number): void`
Updates a player's score.

##### `getPlayerScore(playerId: string): number`
Retrieves a player's current score.

##### `getLeaderboard(): Array<LeaderboardEntry>`
Returns the current leaderboard sorted by score.

```typescript
interface LeaderboardEntry {
  playerId: string;
  name: string;
  score: number;
  headshotImageSource?: any;
}
```

### AssetManager

Manages game assets and loading.

#### Methods

##### `async loadTriviaQuestions(category: string): Promise<Question[]>`
Loads trivia questions for a specific category.

##### `async preloadAssets(): Promise<void>`
Preloads commonly used game assets.

##### `getAssetById(assetId: string): any`
Retrieves a cached asset by ID.

```typescript
interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
}
```

## Network Events

### Event Types

#### Game Control Events

##### `triviaGameStartEvent`
Broadcast when a game starts.
```typescript
{
  hostId: string;
  config: GameConfig;
}
```

##### `triviaGameEndEvent`
Broadcast when a game ends.
```typescript
{
  hostId: string;
  finalLeaderboard: LeaderboardEntry[];
}
```

##### `triviaGameResetEvent`
Broadcast when a game is reset.
```typescript
{
  hostId: string;
}
```

#### Question Events

##### `triviaQuestionShowEvent`
Broadcast when a new question is displayed.
```typescript
{
  question: SerializableQuestion;
  questionIndex: number;
  timeLimit: number;
}
```

##### `triviaResultsEvent`
Broadcast when question results are available.
```typescript
{
  correctAnswer: number;
  scores: { [playerId: string]: number };
  leaderboard: LeaderboardEntry[];
}
```

#### Player Events

##### `triviaPlayerJoinEvent`
Broadcast when a player joins.
```typescript
{
  playerId: string;
  playerName: string;
}
```

##### `triviaAnswerSubmittedEvent`
Broadcast when a player submits an answer.
```typescript
{
  playerId: string;
  answerIndex: number;
  timestamp: number;
}
```

### Event Handling

#### Listening to Events
```typescript
this.connectNetworkBroadcastEvent(eventType, this.handlerMethod.bind(this));
```

#### Broadcasting Events
```typescript
this.sendNetworkBroadcastEvent(eventType, eventData);
```

## Configuration

### Game Configuration

```typescript
interface GameConfig {
  timeLimit: number;           // Seconds per question
  category: string;           // Question category
  difficulty: string;         // Question difficulty
  numQuestions: number;       // Questions per game
  timerType: 'fast' | 'normal' | 'slow';
  modifiers: {
    autoAdvance: boolean;
    powerUps: boolean;
    bonusRounds: boolean;
  };
}
```

### Phone Settings

```typescript
interface PhoneSettings {
  numberOfQuestions: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  timerType: 'fast' | 'normal' | 'slow';
  isLocked: boolean;
  modifiers: ModifierSettings;
}
```

## UI Components

### Custom UI Bindings

The system uses reactive UI bindings for real-time updates:

```typescript
// Score binding
this.scoreBinding = new ui.Binding(0);

// Question binding  
this.questionBinding = new ui.Binding<string>("");

// Timer binding
this.timerBinding = new ui.Binding<string>("30");
```

### UI Node Construction

```typescript
// Example button component
ui.Pressable({
  style: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12
  },
  onPress: () => this.handleButtonPress(),
  children: [
    ui.Text({
      text: 'Submit Answer',
      style: { color: '#FFFFFF', fontSize: 16 }
    })
  ]
})
```

## Error Handling

### Common Error Patterns

```typescript
try {
  await this.loadTriviaQuestions(category);
} catch (error) {
  console.log('❌ Failed to load questions:', error);
  this.showErrorScreen('Failed to load questions');
}
```

### Network Error Handling

```typescript
// Validate network events
private validateNetworkEvent(eventData: any): boolean {
  if (!eventData || typeof eventData !== 'object') {
    console.log('❌ Invalid network event data');
    return false;
  }
  return true;
}
```

## Extension Examples

### Adding a New Question Category

1. **Create question data file**:
```json
{
  "questions": [
    {
      "question": "Your custom question?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 2,
      "difficulty": "medium"
    }
  ]
}
```

2. **Update category list**:
```typescript
const categories = [
  'General',
  'Science',
  'History',
  'Your New Category'  // Add here
];
```

3. **Handle category loading**:
```typescript
case 'your-new-category':
  await this.loadCustomCategoryQuestions();
  break;
```

### Creating a Custom Manager

```typescript
class CustomManager {
  private gameInstance: TriviaGame;
  
  constructor(gameInstance: TriviaGame) {
    this.gameInstance = gameInstance;
  }
  
  // Your custom functionality
  public async handleCustomFeature(): Promise<void> {
    // Implementation
  }
}
```

### Adding Custom Network Events

1. **Define event in TriviaNetworkEvents.ts**:
```typescript
export const customEvent = 'trivia_custom_event';
```

2. **Listen for event**:
```typescript
this.connectNetworkBroadcastEvent(customEvent, this.onCustomEvent.bind(this));
```

3. **Broadcast event**:
```typescript
this.sendNetworkBroadcastEvent(customEvent, { customData: 'value' });
```

## Performance Guidelines

### Best Practices

1. **Limit Network Events**: Batch updates when possible
2. **Cache Assets**: Preload and reuse assets
3. **Optimize UI Updates**: Use bindings efficiently
4. **Memory Management**: Clean up event listeners and timeouts

### Performance Monitoring

```typescript
// Measure operation performance
const startTime = Date.now();
await this.performOperation();
const duration = Date.now() - startTime;
console.log(`✅ Operation completed in ${duration}ms`);
```

This API reference provides the foundation for extending and customizing the Horizon Worlds Trivia Game. For more detailed implementation examples, refer to the source code and documentation files.
