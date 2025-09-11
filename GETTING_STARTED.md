# 🚀 Getting Started with Horizon Worlds Trivia Game

Welcome! This guide will walk you through everything you need to know to get the Horizon Worlds Trivia Game up and running in your own world.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Meta Horizon Worlds Creator Access** - You need to be approved as a Horizon Worlds creator
- **A Horizon World** - Either create a new world or use an existing one
- **Basic TypeScript Knowledge** - Understanding of TypeScript/JavaScript basics will be helpful
- **Git** (optional) - For version control and easier updates

## ⚡ Quick Start (5 Minutes)

### Step 1: Get the Code
```bash
# Clone the repository
git clone https://github.com/AndyLiner13/MePhone.git
cd MePhone

# Or download the ZIP file from GitHub
```

### Step 2: Upload to Horizon Worlds
1. Open your Horizon World in **Edit Mode**
2. Open the **Script** menu
3. Create a new **CustomUI** script called `TriviaGame`
4. Copy the contents of `TriviaGame.ts` into the script
5. Create another **CustomUI** script called `TriviaPhone`
6. Copy the contents of `TriviaPhone.ts` into the script

### Step 3: Set Up the UI Gizmos
1. Add a **CustomUI Gizmo** to your world for the main game
2. Attach the `TriviaGame` script to this gizmo
3. Add another **CustomUI Gizmo** for the phone interface
4. Attach the `TriviaPhone` script to this gizmo

### Step 4: Test It Out!
1. Switch to **Preview Mode**
2. Interact with the trivia game interface
3. Start a game and test the basic functionality

🎉 **Congratulations!** You now have a basic trivia game running. Continue reading for full customization.

## 📝 Detailed Setup Guide

### 1. Project Structure Overview

```
MePhone/
├── TriviaGame.ts           # Main game logic and host UI
├── TriviaPhone.ts          # Player phone interface
├── PlayerManager.ts        # Player state management  
├── TriviaQuestions/        # Question databases
├── Asset IDs/             # Asset reference files
└── documentation/         # Horizon Worlds API docs
```

### 2. Installing All Components

#### Core Scripts (Required)
These are the essential scripts that must be uploaded:

1. **TriviaGame.ts** - Main game engine
   - Create a CustomUI script in Horizon Worlds
   - Copy the entire file content
   - Attach to a CustomUI Gizmo

2. **TriviaPhone.ts** - Player interface
   - Create another CustomUI script
   - Copy the entire file content  
   - Attach to a separate CustomUI Gizmo

#### Manager Scripts (Recommended)
For full functionality, also upload these:

3. **PlayerManager.ts** - Enhanced player management
4. **PhoneManager.ts** - Phone UI coordination
5. **TriviaAssetManager.ts** - Asset loading optimization
6. **TriviaGameStateManager.ts** - Game state synchronization
7. **TriviaScoreManager.ts** - Advanced scoring
8. **TriviaTimeoutManager.ts** - Timer management

#### Supporting Files
9. **TriviaNetworkEvents.ts** - Network event definitions
10. **TriviaPlayerUtils.ts** - Utility functions

### 3. Asset Configuration

The game uses various assets that you'll need to configure:

#### Required Assets
1. **Question Images** - For image-based questions
2. **UI Backgrounds** - Interface styling
3. **Icons and Buttons** - UI elements
4. **Sound Effects** - Audio feedback

#### Setting Up Assets
1. Upload your assets to Horizon Worlds
2. Copy the Asset IDs from the Asset Library
3. Update the asset references in the `Asset IDs/` folder files
4. Modify the asset constants in your scripts

**Example asset configuration:**
```typescript
// In your script, update these with your actual Asset IDs
const BACKGROUND_ASSET_ID = "your-background-asset-id-here";
const ICON_ASSET_ID = "your-icon-asset-id-here";
```

### 4. Question Database Setup

#### Using Included Questions
The project comes with thousands of pre-made questions:
- General Knowledge (3,000 questions)
- Entertainment categories (Film, Music, TV, Games)
- Geography, History, Science & Nature
- Special Italian Brainrot Quiz with images

#### Adding Custom Questions
1. Open any file in `TriviaQuestions/`
2. Follow this JSON format:
```json
{
  "questions": [
    {
      "id": 1,
      "question": "Your question text here?",
      "answers": ["Correct Answer", "Wrong Answer 1", "Wrong Answer 2", "Wrong Answer 3"],
      "category": "Your Category",
      "difficulty": "easy"
    }
  ]
}
```

#### Loading Questions in Game
Questions are loaded dynamically based on the selected category. The game will automatically find and use your question files.

### 5. Game Configuration

#### Default Settings
The game starts with these default settings:
- **Time Limit:** 30 seconds per question
- **Questions per Game:** 20 questions
- **Default Category:** Italian Brainrot Quiz
- **Auto-advance:** Enabled

#### Customizing Settings
Modify these in the `TriviaGame.ts` file:
```typescript
private gameConfigBinding = new Binding({
  timeLimit: 45,        // Seconds per question
  autoAdvance: true,    // Auto-advance after all players answer
  numQuestions: 15,     // Questions per game
  category: "General Knowledge",  // Default category
  difficulty: "medium"  // Default difficulty
});
```

### 6. Network Setup

The game uses Horizon Worlds' network events for multiplayer functionality:

#### Host Authority
- One player becomes the "host" (usually the first to start)
- Host controls game flow and question progression
- All players receive updates from the host

#### Player Synchronization
- Player answers are synchronized in real-time
- Scores update live during gameplay
- Players can join/leave mid-game

## 🎮 Usage Guide

### For World Creators

#### Starting the Game
1. Enter your world in Edit or Preview mode
2. Interact with the main trivia UI
3. Configure game settings (category, time limit, etc.)
4. Click "Start Game" to begin

#### Managing Games
- Use host controls to pause/resume
- Skip questions if needed
- View live player scores and participation

### For Players

#### Joining a Game
1. Find and interact with the phone interface
2. The phone will show available games
3. Tap to join an active game
4. Wait for the game to start

#### Playing
1. Read each question carefully
2. Tap your answer choice on the phone
3. Wait for results and next question
4. Check the leaderboard for your score

## 🛠️ Customization Options

### UI Themes and Colors
Modify the color scheme in the script files:
```typescript
// Answer button colors
private answerButtonColors = [
  new Binding('#DC2626'), // Red
  new Binding('#2563EB'), // Blue  
  new Binding('#EAB308'), // Yellow
  new Binding('#16A34A')  // Green
];
```

### Game Modes
You can create different game modes by modifying:
- Question selection logic
- Scoring algorithms  
- Timer behaviors
- UI layouts

### Advanced Features
- **Power-ups:** Add special abilities for players
- **Team Mode:** Group players into teams
- **Tournament Mode:** Bracket-style elimination
- **Custom Categories:** Create themed question sets

## 🐛 Troubleshooting

### Common Issues

#### "Game Won't Start"
- Check that both CustomUI Gizmos are properly configured
- Ensure scripts are attached correctly
- Verify no console errors in the debug panel

#### "Players Can't Join"
- Confirm the phone interface script is running
- Check network event definitions match between scripts
- Ensure player management is initialized

#### "Questions Not Loading"
- Verify question files are properly formatted JSON
- Check category names match exactly
- Ensure asset IDs are correctly configured

#### "UI Not Displaying"
- Check CustomUI bindings are properly set up
- Verify asset references are valid
- Test with simpler UI elements first

### Getting Help
1. **Check the Console** - Look for error messages in Horizon Worlds' debug console
2. **Review Documentation** - Check the `/docs` folder for detailed guides
3. **Community Support** - Open an issue on GitHub for assistance
4. **Debug UI** - Use the included debug interfaces for testing

## 🚀 Next Steps

Once you have the basic game running:

1. **Customize the Experience**
   - Add your own questions and categories
   - Modify UI colors and layouts
   - Configure game rules to your liking

2. **Expand Features**  
   - Implement power-ups or special abilities
   - Add team-based gameplay
   - Create tournament modes

3. **Optimize Performance**
   - Use the asset manager for better loading
   - Implement caching for frequently used data
   - Monitor player count and adjust accordingly

4. **Share with the Community**
   - Contribute new features back to the project
   - Share your custom question categories
   - Help other creators with setup and customization

## 📚 Additional Resources

- **[Full Documentation](docs/)** - Comprehensive guides and API references
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and components
- **[API Reference](docs/API.md)** - Technical documentation for developers
- **[Horizon Worlds Documentation](documentation/)** - Official API documentation

## 💬 Community

- **GitHub Issues** - Report bugs and request features
- **GitHub Discussions** - Ask questions and share ideas
- **Pull Requests** - Contribute code improvements

---

**Ready to create amazing trivia experiences?** Follow this guide and you'll have a fully functional multiplayer trivia game in your Horizon World. If you run into any issues or have questions, don't hesitate to reach out to the community for help!
