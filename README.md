# 📱 Horizon Worlds Trivia Game

A feature-rich multiplayer trivia game built for Meta's Horizon Worlds platform, featuring a phone-style UI interface and comprehensive game management system.

## 🎮 Features

- **Interactive Phone UI**: Custom phone interface for game interaction
- **Multiplayer Support**: Real-time multiplayer trivia gameplay
- **Multiple Categories**: Various trivia categories including:
  - General Knowledge
  - Entertainment (Film, Music, Television, Video Games)
  - Geography
  - History
  - Science & Nature
  - Italian Brainrot Quiz (Special Category)
- **Configurable Settings**: Adjustable game parameters (time limits, question count, difficulty)
- **Real-time Leaderboard**: Live scoring and player rankings
- **Host Controls**: Comprehensive game management for hosts
- **Player Management**: Join/leave game functionality with persistent scoring
- **Debug Tools**: Built-in debugging interfaces for development

## 🏗️ Project Structure

```
scripts/
├── 📁 Core Game Files
│   ├── TriviaGame.ts              # Main game logic and UI
│   ├── TriviaPhone.ts             # Phone interface component
│   └── TriviaPhoneBackup.ts       # Backup phone implementation
│
├── 📁 Management Systems
│   ├── PlayerManager.ts           # Player state management
│   ├── PhoneManager.ts           # Phone UI management
│   ├── TriviaAssetManager.ts     # Asset loading and management
│   ├── TriviaGameStateManager.ts # Game state coordination
│   ├── TriviaScoreManager.ts     # Scoring system
│   └── TriviaTimeoutManager.ts   # Timer management
│
├── 📁 Utilities
│   ├── TriviaPlayerUtils.ts      # Player utility functions
│   ├── TriviaNetworkEvents.ts    # Network event definitions
│   └── WrongScreenBanter.json    # Fun messages for incorrect answers
│
├── 📁 Question Data
│   └── TriviaQuestions/          # JSON files containing trivia questions
│
├── 📁 Assets
│   └── Asset IDs/                # Asset references for images, sounds, etc.
│
├── 📁 Debug Tools
│   └── DebugUIs/                 # Development debugging interfaces
│
├── 📁 Documentation
│   └── documentation/            # Horizon Worlds API documentation
│
└── 📁 Type Definitions
    └── types/                    # TypeScript definitions for Horizon APIs
```

## 🚀 Getting Started

### Prerequisites

- Meta Horizon Worlds Creator Access
- TypeScript 4.7.4+
- Basic understanding of Horizon Worlds scripting

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AndyLiner13/MePhone.git
   cd MePhone
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Import to Horizon Worlds**:
   - Upload the script files to your Horizon World
   - Attach `TriviaGame.ts` to a CustomUI Gizmo for the main game interface
   - Attach `TriviaPhone.ts` to a CustomUI Gizmo for the phone interface
   - Configure asset IDs in the `Asset IDs/` folder

### Configuration

1. **Update Asset IDs**: Modify files in `Asset IDs/` folder with your world's specific asset references
2. **Question Categories**: Add or modify trivia questions in the `TriviaQuestions/` folder
3. **Game Settings**: Adjust default settings in the respective manager files

## 🎯 Usage

### For Players
- Interact with the phone interface to join games
- Answer trivia questions within the time limit
- View real-time leaderboard and scoring
- Rejoin games if disconnected

### For Hosts
- Configure game settings (categories, time limits, question count)
- Start and manage trivia games
- Control game flow and player management
- Access debug tools for troubleshooting

## 🔧 Development

### Key Components

- **TriviaGame**: Main game engine handling question flow, scoring, and UI
- **TriviaPhone**: Phone-style interface for player interaction
- **PlayerManager**: Handles player state, connections, and scoring
- **NetworkEvents**: Manages real-time multiplayer communication

### Adding New Features

1. Create new manager classes following the existing pattern
2. Add network events to `TriviaNetworkEvents.ts`
3. Update UI components in the respective `.ts` files
4. Test using the debug UI interfaces

### Debug Tools

Enable debug mode by using the debug UI components in `DebugUIs/`:
- `TriviaGameDebugUI.ts`: Game state debugging
- `TriviaPhoneDebugUI.ts`: Phone interface debugging

## 📝 API Documentation

The project includes comprehensive Horizon Worlds API documentation in the `documentation/` folder covering:

- Core APIs and utilities
- UI component system
- Camera and mobile gesture APIs
- Social and performance systems
- Custom UI building and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow TypeScript best practices
- Adhere to Horizon Worlds API conventions
- Include appropriate error handling
- Test thoroughly with multiple players
- Update documentation for new features

## 🐛 Known Issues

- Timer synchronization may occasionally drift in poor network conditions
- Large player counts (>20) may experience performance impacts
- Asset loading times vary based on world optimization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Meta Horizon Worlds team for the platform and APIs
- Community contributors for trivia question databases
- Beta testers who helped refine the gameplay experience

## 📞 Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the documentation in the `documentation/` folder
- Review existing issues and discussions

---

**Built with ❤️ for the Horizon Worlds community**
