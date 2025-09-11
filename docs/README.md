# Documentation Index

Welcome to the Horizon Worlds Trivia Game documentation! This index will help you find the information you need.

## 📚 Getting Started

### Essential Reading
- **[README.md](README.md)** - Project overview and quick start guide
- **[Installation Guide](docs/INSTALLATION.md)** - Step-by-step setup instructions
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to the project

### For New Users
1. Start with the [README.md](README.md) for a project overview
2. Follow the [Installation Guide](docs/INSTALLATION.md) to set up the game
3. Check out the [Architecture Overview](docs/ARCHITECTURE.md) to understand how it works

### For Developers
1. Read the [API Reference](docs/API.md) for technical details
2. Review the [Architecture Overview](docs/ARCHITECTURE.md) for system design
3. Check the [Contributing Guidelines](CONTRIBUTING.md) for development workflow

## 📖 Core Documentation

### Project Information
- **[README.md](README.md)** - Main project documentation with features and usage
- **[LICENSE](LICENSE)** - MIT License terms and conditions
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[ROADMAP.md](ROADMAP.md)** - Future development plans and feature roadmap

### Setup and Installation  
- **[Installation Guide](docs/INSTALLATION.md)** - Complete setup instructions for Horizon Worlds
- **[Asset IDs Documentation](Asset%20IDs/)** - Asset references and configuration
- **[TypeScript Configuration](tsconfig.json)** - Development environment setup

### Development
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute code, report bugs, and request features
- **[API Reference](docs/API.md)** - Technical API documentation for developers
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and component relationships

### Security and Governance
- **[Security Policy](SECURITY.md)** - Security reporting and best practices
- **[Code of Conduct](#)** - Community guidelines and standards
- **[Issue Templates](.github/ISSUE_TEMPLATE/)** - Bug reports and feature requests
- **[Pull Request Template](.github/pull_request_template.md)** - Code contribution guidelines

## 🛠️ Technical Documentation

### Core Components
| File | Description |
|------|-------------|
| [TriviaGame.ts](TriviaGame.ts) | Main game engine and UI management |
| [TriviaPhone.ts](TriviaPhone.ts) | Phone-style player interface |
| [PlayerManager.ts](PlayerManager.ts) | Player state and interaction management |
| [TriviaNetworkEvents.ts](TriviaNetworkEvents.ts) | Network event definitions and types |

### Manager Systems
| File | Description |
|------|-------------|
| [PhoneManager.ts](PhoneManager.ts) | Phone UI coordination |
| [TriviaAssetManager.ts](TriviaAssetManager.ts) | Asset loading and caching |
| [TriviaGameStateManager.ts](TriviaGameStateManager.ts) | Game state synchronization |
| [TriviaScoreManager.ts](TriviaScoreManager.ts) | Scoring and leaderboard management |
| [TriviaTimeoutManager.ts](TriviaTimeoutManager.ts) | Timer and timeout coordination |

### Utilities and Data
| File | Description |
|------|-------------|
| [TriviaPlayerUtils.ts](TriviaPlayerUtils.ts) | Player utility functions |
| [TriviaQuestions/](TriviaQuestions/) | Question databases by category |
| [WrongScreenBanter.json](WrongScreenBanter.json) | Fun messages for incorrect answers |

## 🎮 Game Content

### Question Categories
- **[General Knowledge](TriviaQuestions/general_knowledge_trivia_questions_3000.json)** - Broad knowledge topics
- **[Entertainment](TriviaQuestions/)** - Film, Music, Television, Video Games
- **[Geography](TriviaQuestions/geography_trivia_questions_3000.json)** - World geography and locations
- **[History](TriviaQuestions/history_trivia_questions_3000.json)** - Historical events and figures
- **[Science & Nature](TriviaQuestions/science_and_nature_trivia_questions_3000.json)** - Scientific concepts and natural world
- **[Italian Brainrot](TriviaQuestions/ItalianBrainrotQuiz.json)** - Special meme-based category

### Asset Resources
- **[Background Images](Asset%20IDs/background_images.md)** - UI background textures
- **[Icons](Asset%20IDs/icons.md)** - UI icons and buttons  
- **[Images](Asset%20IDs/images.md)** - Question images and category graphics
- **[Sound Effects](Asset%20IDs/SFX.md)** - Audio feedback and ambiance

## 🔧 Development Tools

### Debug and Testing
- **[TriviaGameDebugUI.ts](DebugUIs/TriviaGameDebugUI.ts)** - Game state debugging interface
- **[TriviaPhoneDebugUI.ts](DebugUIs/TriviaPhoneDebugUI.ts)** - Phone interface debugging tools

### Configuration
- **[package.json](package.json)** - Project dependencies and scripts
- **[tsconfig.json](tsconfig.json)** - TypeScript compiler configuration
- **[.gitignore](.gitignore)** - Git ignore patterns

## 🌟 Horizon Worlds API Documentation

The project includes comprehensive API documentation in the [documentation/](documentation/) folder:

### Core APIs
- **[Core](documentation/core/)** - Fundamental Horizon Worlds classes and utilities
- **[UI](documentation/ui/)** - User interface components and management
- **[Social](documentation/social/)** - Player interaction and social features
- **[Camera](documentation/camera/)** - Camera control and management

### Specialized APIs
- **[Avatar AI Agent](documentation/avatar_ai_agent/)** - AI-powered avatar behaviors
- **[Mobile](documentation/Mobile/)** - Mobile device and gesture APIs
- **[Performance](documentation/performance/)** - Performance monitoring tools
- **[NPC](documentation/npc/)** - Non-player character systems

## 🎯 Quick Reference

### Common Tasks
| Task | Documentation |
|------|---------------|
| First-time setup | [Installation Guide](docs/INSTALLATION.md) |
| Adding new questions | [Installation Guide - Question Categories](docs/INSTALLATION.md#step-6-configure-game-settings) |
| Customizing UI | [API Reference - UI Components](docs/API.md#ui-components) |
| Adding features | [Contributing Guidelines](CONTRIBUTING.md) |
| Reporting bugs | [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) |
| Understanding architecture | [Architecture Overview](docs/ARCHITECTURE.md) |

### File Organization
```
📁 Project Root
├── 📄 Core Documentation (README, LICENSE, etc.)
├── 📁 docs/ - Detailed documentation guides
├── 📁 .github/ - GitHub templates and workflows
├── 📄 Game Scripts (*.ts files)
├── 📁 Asset IDs/ - Asset reference documentation
├── 📁 TriviaQuestions/ - Question databases
├── 📁 DebugUIs/ - Development debugging tools
├── 📁 documentation/ - Horizon Worlds API docs
└── 📁 types/ - TypeScript type definitions
```

## 🆘 Getting Help

### Community Support
- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For general questions and community interaction
- **Pull Requests**: For code contributions and improvements

### Documentation Issues
If you find any documentation that is:
- Unclear or confusing
- Out of date or incorrect
- Missing important information

Please open an issue or submit a pull request to help us improve!

### Quick Links
- [Open a Bug Report](https://github.com/AndyLiner13/MePhone/issues/new?template=bug_report.md)
- [Request a Feature](https://github.com/AndyLiner13/MePhone/issues/new?template=feature_request.md)
- [View Existing Issues](https://github.com/AndyLiner13/MePhone/issues)
- [Submit a Pull Request](https://github.com/AndyLiner13/MePhone/pulls)

---

**Welcome to the community!** We hope this documentation helps you get the most out of the Horizon Worlds Trivia Game. If you have suggestions for improving this documentation, please let us know!
