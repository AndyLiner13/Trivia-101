# Architecture Overview

This document provides a high-level overview of the Horizon Worlds Trivia Game architecture.

## System Architecture

The trivia game is built with a modular architecture consisting of several key components that work together to provide a seamless multiplayer experience.

```
┌─────────────────────────────────────────────────────────────┐
│                     Horizon Worlds Platform                 │
├─────────────────────────────────────────────────────────────┤
│                        Network Layer                        │
├─────────────────────────────────────────────────────────────┤
│  CustomUI Gizmos                    │  Library Scripts      │
│  ┌─────────────────┐               │  ┌─────────────────┐  │
│  │   TriviaGame    │◄──────────────┤  │    Managers     │  │
│  │                 │               │  │                 │  │
│  └─────────────────┘               │  └─────────────────┘  │
│  ┌─────────────────┐               │                       │
│  │  TriviaPhone    │◄──────────────┤                       │
│  │                 │               │                       │
│  └─────────────────┘               │                       │
├─────────────────────────────────────────────────────────────┤
│                    Asset Management                         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CustomUI Scripts (Gizmo-Attached)

#### TriviaGame (`TriviaGame.ts`)
- **Purpose**: Main game engine and display interface
- **Responsibilities**:
  - Manages game flow (questions, timing, scoring)
  - Renders main game UI visible to all players
  - Handles host controls and configuration
  - Manages leaderboards and results display
  - Coordinates with all manager systems

#### TriviaPhone (`TriviaPhone.ts`)
- **Purpose**: Individual player interaction interface  
- **Responsibilities**:
  - Provides phone-style UI for each player
  - Handles answer submission and player input
  - Manages player-specific game state
  - Displays personal scores and progress
  - Handles join/leave game functionality

### 2. Management Systems (Library Scripts)

#### PlayerManager (`PlayerManager.ts`)
- **Purpose**: Central player state management
- **Key Features**:
  - Tracks all players in the world
  - Manages player joining/leaving game sessions
  - Handles player scoring and statistics
  - Maintains player headshot and profile data
  - Synchronizes player states across all clients

#### PhoneManager (`PhoneManager.ts`)
- **Purpose**: Coordinates phone interface interactions
- **Key Features**:
  - Manages multiple phone instances
  - Handles phone UI state synchronization
  - Coordinates with TriviaGame for game events
  - Manages phone-specific networking

#### TriviaAssetManager (`TriviaAssetManager.ts`)
- **Purpose**: Centralized asset loading and caching
- **Key Features**:
  - Loads trivia questions from JSON assets
  - Manages image and audio asset caching
  - Handles special category assets (Italian Brainrot)
  - Provides asset availability checking
  - Optimizes loading performance

#### TriviaGameStateManager (`TriviaGameStateManager.ts`)
- **Purpose**: Game state coordination and synchronization
- **Key Features**:
  - Manages overall game state (waiting, playing, results)
  - Synchronizes state between TriviaGame and TriviaPhone
  - Handles state transitions and validation
  - Manages game configuration persistence

#### TriviaScoreManager (`TriviaScoreManager.ts`)
- **Purpose**: Scoring system and leaderboard management
- **Key Features**:
  - Calculates and tracks individual player scores
  - Manages leaderboard rankings and display
  - Handles score persistence and recovery
  - Provides scoring statistics and analytics

#### TriviaTimeoutManager (`TriviaTimeoutManager.ts`)
- **Purpose**: Timer and timeout coordination
- **Key Features**:
  - Manages question timers and countdown displays
  - Handles timeout events for answer submission
  - Coordinates timing across all clients
  - Manages timer synchronization and drift correction

### 3. Utility Systems

#### TriviaPlayerUtils (`TriviaPlayerUtils.ts`)
- **Purpose**: Player-related utility functions
- **Key Features**:
  - Player validation and verification
  - Utility functions for player data manipulation
  - Helper methods for player state checks
  - Common player operations

#### TriviaNetworkEvents (`TriviaNetworkEvents.ts`)
- **Purpose**: Network event definitions and constants
- **Key Features**:
  - Defines all network event types
  - Provides event data structures
  - Centralizes network communication protocols
  - Ensures consistent event handling

## Data Flow

### 1. Game Initialization Flow
```
TriviaGame.start() 
    ├── Load Assets (AssetManager)
    ├── Initialize Players (PlayerManager)  
    ├── Setup Network Events
    ├── Initialize UI Components
    └── Register with Phone Manager
```

### 2. Player Join Flow
```
Player Interacts with Phone
    ├── TriviaPhone detects interaction
    ├── PlayerManager registers player
    ├── Network event sent to TriviaGame
    ├── Game state synchronized
    └── Player added to active session
```

### 3. Question Flow
```
Host Starts Game
    ├── TriviaGame loads question (AssetManager)
    ├── Timer starts (TimeoutManager)
    ├── Question broadcast to all players
    ├── TriviaPhone displays question to players
    ├── Players submit answers
    ├── Scores calculated (ScoreManager)
    └── Results displayed and synchronized
```

## Network Architecture

### Event-Driven Communication
The system uses Horizon Worlds' network broadcast events for real-time communication:

- **Game Events**: Start, stop, reset, configuration changes
- **Player Events**: Join, leave, answer submission, score updates  
- **State Events**: Question display, results, leaderboard updates
- **Sync Events**: State synchronization, player updates

### State Synchronization
- **Authoritative Host**: One player (usually first) acts as game host
- **State Broadcasting**: Host broadcasts authoritative game state
- **Client Prediction**: Clients predict state changes for responsiveness
- **Conflict Resolution**: Host state always takes precedence

## UI Architecture

### CustomUI System
Built using Horizon Worlds' CustomUI framework:

- **Component-Based**: Modular UI components for reusability
- **Reactive Bindings**: Data binding for real-time UI updates
- **Event-Driven**: UI responds to game events and state changes
- **Responsive Design**: Adapts to different VR display contexts

### Phone Interface Design
- **Familiar UX**: Mobile phone-style interface for intuitive interaction
- **Touch-Friendly**: Designed for VR hand tracking and controllers
- **Context-Aware**: UI adapts based on game state and player role
- **Accessibility**: Clear visual hierarchy and readable text

## Performance Considerations

### Optimization Strategies
1. **Asset Caching**: Preload and cache frequently used assets
2. **Event Throttling**: Limit network event frequency
3. **State Batching**: Batch state updates to reduce network traffic
4. **Selective Rendering**: Only render UI elements when needed
5. **Memory Management**: Cleanup unused assets and event listeners

### Scalability Limits
- **Recommended Players**: 8-20 players for optimal performance
- **Network Bandwidth**: Limited by Horizon Worlds' network capabilities
- **Asset Limits**: Bounded by world asset quotas
- **Update Frequency**: Balanced for responsiveness vs. performance

## Extension Points

### Adding New Features
1. **Create new Manager**: Follow existing manager pattern
2. **Define Network Events**: Add events to `TriviaNetworkEvents.ts`
3. **Update UI Components**: Modify `TriviaGame.ts` or `TriviaPhone.ts`
4. **Handle State Changes**: Update `TriviaGameStateManager.ts`

### Customization Areas
- **Question Categories**: Add new trivia categories and data sources
- **Scoring Systems**: Implement alternative scoring algorithms
- **UI Themes**: Customize visual design and layout
- **Game Modes**: Add new game modes and rule variations
- **Integration**: Connect with external APIs or services

## Security Considerations

### Client Validation
- **Host Authority**: Critical game logic runs on host client
- **Input Validation**: Validate all player inputs and network events
- **State Verification**: Cross-check state consistency across clients
- **Timeout Protection**: Prevent indefinite waits and deadlocks

### Data Protection
- **Player Privacy**: Don't store sensitive player information
- **Asset Security**: Protect asset references and IDs
- **Network Security**: Use Horizon Worlds' built-in security features

This architecture provides a robust foundation for the trivia game while remaining flexible enough for future enhancements and customizations.
