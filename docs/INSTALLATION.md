# Installation Guide

This guide will help you set up the Horizon Worlds Trivia Game in your own Horizon World.

## Prerequisites

Before you begin, make sure you have:

- **Meta Horizon Worlds Creator Access**: You need creator permissions to upload and manage scripts
- **Basic TypeScript Knowledge**: Helpful for customization and debugging
- **Horizon Worlds Experience**: Familiarity with CustomUI Gizmos and world building

## Step 1: Download the Project

1. Clone or download the repository:
   ```bash
   git clone https://github.com/AndyLiner13/MePhone.git
   cd MePhone
   ```

2. Install development dependencies (optional, for local development):
   ```bash
   npm install
   ```

## Step 2: Prepare Your Horizon World

1. **Create a New World** or open an existing one where you want to add the trivia game
2. **Set up the basic environment** where players will interact with the trivia game
3. **Ensure you have adequate space** for multiple players (recommended: 8-20 players max)

## Step 3: Upload Assets

### Upload Trivia Questions
1. Navigate to the `TriviaQuestions/` folder
2. Upload the JSON files containing trivia questions to your world as **Text Assets**
3. Note the Asset IDs for each uploaded file

### Upload Images and Sounds
1. Check the `Asset IDs/` folder for required assets:
   - Background images
   - Icons
   - Sound effects
   - Images for special categories (like Italian Brainrot)
2. Upload these assets to your world
3. Update the Asset ID references in the respective markdown files

## Step 4: Configure Asset IDs

Update the asset references in your code:

1. **Open each file in `Asset IDs/` folder**
2. **Replace the placeholder Asset IDs** with your actual uploaded asset IDs
3. **Key files to update:**
   - `background_images.md` - Background textures
   - `icons.md` - UI icons and buttons
   - `images.md` - Question images and category graphics
   - `SFX.md` - Sound effects for game events

### Example Asset ID Update:
```typescript
// Before (placeholder)
source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1234567890123456')))

// After (your asset ID)
source: ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('YOUR_ASSET_ID_HERE')))
```

## Step 5: Upload Scripts

### Main Game Script
1. **Create a CustomUI Gizmo** in your world for the main game interface
2. **Upload `TriviaGame.ts`** as a script and attach it to this gizmo
3. **Position the gizmo** where players can see the main game display

### Phone Interface Script
1. **Create another CustomUI Gizmo** for the phone interface
2. **Upload `TriviaPhone.ts`** as a script and attach it to this gizmo
3. **Position this gizmo** where players can easily interact with it

### Manager Scripts
Upload the following files as **Library Scripts** (not attached to gizmos):
- `PlayerManager.ts`
- `PhoneManager.ts`
- `TriviaAssetManager.ts`
- `TriviaGameStateManager.ts`
- `TriviaScoreManager.ts`
- `TriviaTimeoutManager.ts`
- `TriviaPlayerUtils.ts`
- `TriviaNetworkEvents.ts`

## Step 6: Configure Game Settings

### Default Settings
Edit the game configuration in `TriviaPhone.ts`:

```typescript
private gameSettings = {
  numberOfQuestions: 20,          // Number of questions per game
  category: 'General',            // Default category
  difficulty: 'medium',           // Default difficulty
  timeLimit: 30,                  // Seconds per question
  // ... other settings
};
```

### Question Categories
Ensure your trivia question JSON files are properly formatted:

```json
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correct_answer": 2,
      "difficulty": "easy"
    }
  ]
}
```

## Step 7: Test Your Installation

### Basic Testing
1. **Enter your world** and locate both CustomUI interfaces
2. **Test the phone interface** - can you see the main menu?
3. **Test host controls** - can you configure and start a game?
4. **Test player interaction** - can players join and answer questions?

### Multiplayer Testing
1. **Invite friends** or create alternate accounts
2. **Test with multiple players** (recommended: 3-5 for testing)
3. **Verify synchronization** - do all players see the same questions?
4. **Test edge cases** - players joining/leaving, network issues, etc.

## Step 8: Debug and Troubleshoot

### Enable Debug Mode
If you encounter issues, use the debug UIs:
1. Upload `DebugUIs/TriviaGameDebugUI.ts`
2. Upload `DebugUIs/TriviaPhoneDebugUI.ts`
3. Use these to monitor game state and diagnose problems

### Common Issues
- **Asset IDs not working**: Double-check that all asset IDs are correctly updated
- **Scripts not communicating**: Ensure all manager scripts are uploaded as libraries
- **Players can't join**: Check that both CustomUI gizmos are properly positioned and accessible
- **Questions not loading**: Verify trivia JSON files are uploaded correctly

## Step 9: Customize (Optional)

### Add Your Own Questions
1. Create new JSON files in the same format
2. Upload them as Text Assets
3. Update the category selection code to include your new categories

### Customize UI
1. Modify colors, fonts, and layouts in the UI code
2. Add new visual elements or animations
3. Customize the phone interface design

### Add New Features
1. Review the existing code structure
2. Follow the modular pattern for new managers
3. Update network events for new multiplayer features

## Support

If you need help:
1. Check the [documentation](../documentation/) folder
2. Review existing [GitHub issues](https://github.com/AndyLiner13/MePhone/issues)
3. Create a new issue if you encounter problems

## Next Steps

Once your trivia game is working:
- Invite players to test and provide feedback
- Consider creating custom question categories
- Explore additional features and customizations
- Share your experience with the community!

---

**Congratulations!** You now have a fully functional trivia game in your Horizon World. Have fun hosting amazing trivia sessions!
