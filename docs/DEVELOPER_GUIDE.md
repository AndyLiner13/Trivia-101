# 🔧 Developer Guide

This guide is for developers who want to contribute to or modify the Horizon Worlds Trivia Game project.

## 🏗️ Development Setup

### Prerequisites
- **Node.js 18+** with npm
- **TypeScript 4.7.4** (installed via npm)
- **Git** for version control
- **Horizon Worlds Creator Access** for testing
- **VS Code** (recommended) with TypeScript extension

### Environment Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/AndyLiner13/MePhone.git
   cd MePhone
   npm install
   ```

2. **VS Code Configuration**
   The project includes `.vscode/settings.json` with TypeScript workspace configuration.

3. **Development Scripts**
   ```bash
   npm run dev          # Watch mode compilation
   npm run build        # Production build
   npm run type-check   # Type checking only
   npm run validate     # Full validation
   npm run clean        # Clean build artifacts
   ```

## 📁 Project Architecture

### Core Components

```
src/
├── TriviaGame.ts              # Main game engine & host UI
├── TriviaPhone.ts             # Player phone interface  
├── PlayerManager.ts           # Player state management
└── PhoneManager.ts            # Phone UI coordination
```

### Manager System
```
managers/
├── TriviaAssetManager.ts      # Asset loading & caching
├── TriviaGameStateManager.ts  # Game state synchronization  
├── TriviaScoreManager.ts      # Scoring & leaderboards
└── TriviaTimeoutManager.ts    # Timer management
```

### Supporting Systems
```
utils/
├── TriviaPlayerUtils.ts       # Player utility functions
├── TriviaNetworkEvents.ts     # Network event definitions
└── WrongScreenBanter.json     # UI message content
```

### Data & Assets
```
data/
├── TriviaQuestions/           # Question databases
├── Asset IDs/                 # Asset reference documentation
└── types/                     # TypeScript definitions
```

## 🔧 Development Workflow

### 1. Code Style & Standards

#### TypeScript Guidelines
- Use **strict mode** TypeScript configuration
- Prefer **interfaces** over type aliases for object shapes
- Use **meaningful names** for variables and functions
- Add **JSDoc comments** for public APIs

#### Horizon Worlds Conventions
- Each `.ts` file represents a **separate script** in Horizon Worlds
- Follow the **component architecture** pattern
- Use **network events** for cross-script communication
- Implement proper **error handling** for all async operations

#### Code Organization
```typescript
// File structure pattern
export class ComponentName extends ui.UIComponent {
  // 1. Bindings and state
  private stateBinding = new Binding(defaultValue);
  
  // 2. Lifecycle methods
  start() { }
  
  // 3. Public API
  public mainMethods() { }
  
  // 4. Private implementation
  private helperMethods() { }
  
  // 5. Event handlers
  private onEventHandlers() { }
}
```

### 2. Development Process

#### Feature Development
1. **Create feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement changes** following code standards
3. **Test thoroughly** in Horizon Worlds environment
4. **Update documentation** as needed
5. **Submit Pull Request** with filled template

#### Testing Strategy
- **Unit Testing**: Test individual manager classes
- **Integration Testing**: Test cross-component communication
- **Multiplayer Testing**: Test with multiple players (2+, 10+, 20+)
- **Performance Testing**: Monitor performance with large player counts
- **Edge Case Testing**: Player disconnections, rejoining, host leaving

#### Code Review Process
- All changes require **peer review**
- **CI checks** must pass (type checking, build)
- **Documentation** must be updated for API changes
- **Breaking changes** require version bump discussion

### 3. Debugging & Testing

#### Debug Tools
- **DebugUIs/TriviaGameDebugUI.ts**: Game state debugging
- **DebugUIs/TriviaPhoneDebugUI.ts**: Phone interface testing
- **Horizon Worlds Console**: Runtime error monitoring

#### Testing in Horizon Worlds
1. **Upload scripts** to your test world
2. **Attach to CustomUI Gizmos** appropriately
3. **Test in Preview Mode** for basic functionality
4. **Test in Publish Mode** for multiplayer scenarios

#### Performance Monitoring
- Monitor **CustomUI binding updates** (< 0.5ms/frame target)
- Watch **network event frequency** and size
- Check **memory usage** with asset loading
- Profile **large player scenarios** (20+ players)

## 🌐 Network Architecture

### Event-Driven System
The game uses Horizon Worlds' network events for communication:

```typescript
// Network event pattern
interface EventData {
  playerId: string;
  // event-specific data
}

// Send event
this.sendNetworkBroadcastEvent(eventName, data);

// Handle event  
onNetworkEvent(eventName: string, data: EventData) {
  // process event
}
```

### Host Authority Model
- **Host Selection**: First player to start becomes host
- **Host Responsibilities**: Game flow, question progression, validation
- **Client Responsibilities**: UI updates, player input, state display
- **Host Migration**: Handled automatically if host leaves

### State Synchronization
- **Game State**: Distributed via host broadcasts
- **Player State**: Individual player updates
- **Score State**: Real-time leaderboard updates
- **UI State**: Local binding updates with network sync

## 🎨 UI Development

### CustomUI Component Pattern
```typescript
export class UIComponent extends ui.UIComponent {
  // Bindings for reactive UI
  private dataBinding = new Binding(initialValue);
  
  // UI lifecycle
  start() {
    this.setupBindings();
    this.initializeUI();
  }
  
  private setupBindings() {
    // Connect bindings to UI elements
  }
}
```

### Responsive Design Considerations
- **Mobile Support**: UI works on mobile devices
- **VR Optimization**: Comfortable viewing distances
- **Performance**: Minimize binding updates
- **Accessibility**: Clear visual hierarchy

## 📊 Performance Guidelines

### Optimization Targets
- **UI Binding Updates**: < 0.5ms per frame (client), < 1.5ms (server)
- **Network Events**: Batch when possible, minimize frequency
- **Asset Loading**: Use caching and preloading strategies
- **Memory Usage**: Monitor with large question databases

### Best Practices
- **Lazy Loading**: Load assets and data as needed
- **Caching**: Cache frequently accessed data
- **Batching**: Group related operations
- **Cleanup**: Properly dispose of resources

## 🚀 Deployment & Release

### Release Process
1. **Version Bump**: Update version in package.json
2. **Changelog**: Document changes in CHANGELOG.md
3. **Testing**: Full regression testing
4. **Documentation**: Update docs for changes
5. **Release**: Create GitHub release with notes

### Versioning Strategy
- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (1.X.0)**: New features, backwards compatible
- **Patch (1.0.X)**: Bug fixes, minor improvements

## 🤝 Contributing Guidelines

### Getting Started
1. **Read Documentation**: Understand the project architecture
2. **Set Up Environment**: Follow development setup guide
3. **Find Issues**: Look for "good first issue" labels
4. **Ask Questions**: Use GitHub Discussions for help

### Contribution Types
- **Bug Fixes**: Fix reported issues
- **Features**: Implement new functionality
- **Documentation**: Improve guides and references
- **Performance**: Optimize existing code
- **Testing**: Add test coverage

### Code Review Expectations
- **Functionality**: Does it work as intended?
- **Performance**: Does it maintain good performance?
- **Style**: Does it follow project conventions?
- **Documentation**: Is it properly documented?
- **Testing**: Has it been thoroughly tested?

## 📚 Resources

### Horizon Worlds Documentation
- **[Core APIs](../documentation/core/)**: Fundamental classes and utilities
- **[UI System](../documentation/ui/)**: CustomUI component system
- **[Network Events](../documentation/HorizonTechnicalDoc.md)**: Communication patterns
- **[Performance](../documentation/performance/)**: Optimization guidelines

### External Resources
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)**: Language reference
- **[VS Code TypeScript](https://code.visualstudio.com/docs/languages/typescript)**: Editor setup
- **[Git Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)**: Version control best practices

### Community
- **[GitHub Issues](https://github.com/AndyLiner13/MePhone/issues)**: Bug reports and features
- **[GitHub Discussions](https://github.com/AndyLiner13/MePhone/discussions)**: Questions and ideas
- **[Pull Requests](https://github.com/AndyLiner13/MePhone/pulls)**: Code contributions

---

**Ready to contribute?** Start with the [Contributing Guidelines](../CONTRIBUTING.md) and join our community of developers building amazing trivia experiences in Horizon Worlds!
