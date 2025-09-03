# Trivia Sync System

The MePhone TriviaApp can now sync with the world trivia game! Here's how it works:

## Features Added

### 1. **Enhanced Question Set**
- The TriviaApp now uses the same question set as the world trivia game
- Loaded from the `trivia-questions.json` data (10 questions with categories and difficulty)
- Includes Geography, Science, Mathematics, Art, History, Physics, and Literature questions

### 2. **Sync Infrastructure**
- **TriviaSync Component**: A new component that can listen to world trivia game events
- **Network Events**: Uses the same network events as other trivia components:
  - `triviaQuestionShowEvent`: When a new question is shown
  - `triviaResultsEvent`: When question results are displayed
  - `triviaGameCompleteEvent`: When the trivia game ends

### 3. **TriviaApp Sync Methods**
The TriviaApp class now has methods for external synchronization:
- `syncWithExternalTrivia()`: Sync with a question from world trivia
- `showExternalResults()`: Show results from world trivia
- `endExternalGame()`: End game when world trivia ends

## How to Enable Full Sync

### Option 1: Automatic Sync (Recommended)
1. **Add TriviaSync Component to World**:
   - Create an invisible entity in your world (like a small cube)
   - Attach the `TriviaSync` component to it
   - Enable debug logging if desired

2. **Use Existing World Trivia**:
   - Make sure you have `TriviaQuestionText` components in your world
   - The MePhone will automatically sync when trivia events are broadcast

### Option 2: Manual Integration
If you want to manually control sync, you can call the TriviaApp sync methods directly:

```typescript
// Get reference to MePhone's TriviaApp
const triviaApp = mePhone.getTriviaApp();

// Sync with external question
triviaApp.syncWithExternalTrivia({
  question: {
    id: 1,
    question: "What is the capital of France?",
    answers: [
      { text: "London", correct: false },
      { text: "Paris", correct: true },
      // ... more answers
    ]
  },
  questionIndex: 0,
  timeLimit: 30
});

// Show results
triviaApp.showExternalResults({
  question: currentQuestion,
  correctAnswerIndex: 1,
  answerCounts: [2, 5, 1, 0], // How many people chose each answer
  scores: { "player1": 1, "player2": 0 }
});
```

## Benefits

1. **Unified Experience**: Players can play trivia on their MePhone and see the same questions as the world game
2. **Real-time Sync**: MePhone trivia updates when world trivia changes questions
3. **Shared Results**: See how other players answered when results are shown
4. **Category Variety**: Now includes 10 diverse questions across multiple subjects
5. **Fallback Support**: Still works independently if no world trivia is present

## Files Modified

- **TriviaApp.ts**: Enhanced with sync capabilities and expanded question set
- **TriviaSync.ts**: New component for listening to world trivia events  
- **MePhone.ts**: Integrated TriviaSync setup
- **trivia-questions.json**: Question data source (referenced in TriviaApp)

## Usage in World

1. Place a `TriviaQuestionText` component in your world with trivia questions
2. Add a `TriviaSync` component to any entity
3. Players using MePhones will automatically sync with the world trivia game
4. Questions, timing, and results will be synchronized across all devices

The system is designed to be backwards compatible - if no world trivia exists, the MePhone trivia app continues to work independently with its enhanced question set.
