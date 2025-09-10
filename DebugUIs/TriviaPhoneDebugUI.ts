import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import * as camera from 'horizon/camera';
import { Social, AvatarImageType } from 'horizon/social';

// Network events for trivia
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');
const triviaTwoOptionsEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaTwoOptions');
const triviaFourOptionsEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaFourOptions');
const triviaGameStartEvent = new hz.NetworkEvent<{ hostId: string, config: { timeLimit: number, category: string, difficulty: string, numQuestions: number } }>('triviaGameStart');
const triviaNextQuestionEvent = new hz.NetworkEvent<{ playerId: string }>('triviaNextQuestion');
const triviaGameRegisteredEvent = new hz.NetworkEvent<{ isRunning: boolean, hasQuestions: boolean }>('triviaGameRegistered');
const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{ playerId: string, answerIndex: number, responseTime: number }>('triviaAnswerSubmitted');
const triviaSettingsUpdateEvent = new hz.NetworkEvent<{ hostId: string, settings: { numberOfQuestions: number, category: string, difficulty: string, timeLimit: number, autoAdvance: boolean, muteDuringQuestions: boolean, isLocked: boolean } }>('triviaSettingsUpdate');
const triviaGameEndEvent = new hz.NetworkEvent<{ hostId: string, finalLeaderboard?: Array<{name: string, score: number, playerId: string}> }>('triviaGameEnd');
const triviaGameResetEvent = new hz.NetworkEvent<{ hostId: string }>('triviaGameReset');
const triviaAwardPointsEvent = new hz.NetworkEvent<{ playerId: string; points: number }>('triviaAwardPoints');

// Request-response events for state synchronization
const triviaStateRequestEvent = new hz.NetworkEvent<{ requesterId: string }>('triviaStateRequest');
const triviaStateResponseEvent = new hz.NetworkEvent<{
  requesterId: string,
  gameState: 'waiting' | 'playing' | 'results' | 'leaderboard' | 'ended',
  currentQuestion?: any,
  questionIndex?: number,
  timeLimit?: number,
  showLeaderboard?: boolean,
  leaderboardData?: Array<{name: string, score: number, playerId: string}>
}>('triviaStateResponse');

// Network event for host management
const hostChangedEvent = new hz.NetworkEvent<{
  newHostId: string;
  oldHostId?: string;
}>('hostChanged');

// Built-in trivia questions (fallback only - TriviaGame provides the actual questions)
const triviaQuestions: any[] = [];

const answerShapes = [
  { iconId: '797899126007085', color: '#EF4444', shape: 'Circle' },
  { iconId: '1286736292915198', color: '#3B82F6', shape: 'Square' },
  { iconId: '1290982519195562', color: '#EAB308', shape: 'Triangle' },
  { iconId: '1286736292915198', color: '#22C55E', shape: 'Diamond', rotation: 45 }
];

class TriviaPhone extends ui.UIComponent<typeof TriviaPhone> {
  static propsDefinition = {};

  // Asset Pool Gizmo will handle ownership automatically
  private isInitialized = false;

  // Position tracking for teleporting to the player
  private originalPosition: hz.Vec3 | null = null;
  private followOffset = new hz.Vec3(0, 0.3, 1.0); // Position relative to player (in front and slightly above)

  // Camera state tracking for restoration when leaving UI interaction
  private cameraPositionAtHKeyPress: hz.Vec3 | null = null;
  private cameraRotationAtHKeyPress: hz.Quaternion | null = null;
  private isPlayerFocusedOnUI: boolean = false;

  // Keyboard input connection
  private eKeyInputConnection: hz.PlayerInput | null = null;
  private rightSecondaryInputConnection: hz.PlayerInput | null = null;
  private leftSecondaryInputConnection: hz.PlayerInput | null = null;
  private leftTertiaryInputConnection: hz.PlayerInput | null = null;

  // Game state
  private currentQuestionIndex = 0;
  private score = 0;
  private selectedAnswer: number | null = null;
  private showResult = false;
  private gameStarted = false;
  private answerSubmitted = false;

  // Current question data from TriviaGame
  private currentQuestion: any = null;

  // Game settings state
  private gameSettings = {
    numberOfQuestions: 5,
    category: 'Italian Brainrot Quiz',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeLimit: 30,
    autoAdvance: false,
    muteDuringQuestions: false,
    isLocked: false
  };

  // View mode for navigation
  private currentViewMode: 'pre-game' | 'game-settings' = 'pre-game';

  // UI bindings
  private currentQuestionIndexBinding = new ui.Binding(0);
  private scoreBinding = new ui.Binding(0);
  
  // Stable question index for footer (prevents updates during leaderboard transition)
  private stableQuestionIndex: number = 0;
  private selectedAnswerBinding = new ui.Binding<number | null>(null);
  private showResultBinding = new ui.Binding(false);
  private gameStartedBinding = new ui.Binding(false);
  private gameEndedBinding = new ui.Binding(false);
  private isCorrectAnswerBinding = new ui.Binding(false);
  private correctAnswerIndexBinding = new ui.Binding<number | null>(null);
  private showLeaderboardBinding = new ui.Binding(false);
  private answerSubmittedBinding = new ui.Binding(false);

  // Current question binding to prevent flashing
  private currentQuestionBinding = new ui.Binding<any>(null);

  // Layout type binding to ensure immediate switching between layouts
  private layoutTypeBinding = new ui.Binding<'two-options' | 'four-options'>('four-options');

  // Explicit screen type binding for routing from TriviaGame
  private screenTypeBinding = new ui.Binding<'waiting' | 'two-options' | 'four-options' | 'results'>('four-options');

  // Non-reactive screen type for immediate render decisions
  private currentScreenType: 'waiting' | 'two-options' | 'four-options' | 'results' = 'four-options';
  private lastQuestionType: 'two-options' | 'four-options' = 'four-options';

  // Game settings bindings
  private gameSettingsBinding = new ui.Binding(this.gameSettings);
  private currentViewModeBinding = new ui.Binding<'pre-game' | 'game-settings'>('pre-game');
  
  // Debug outline toggle binding
  private showOutlinesBinding = new ui.Binding(false);
  private showOutlines: boolean = false;

  // DEBUG MODE PROPERTIES
  // =====================
  // IMPORTANT: The debug panel is STRICTLY for navigation and visual testing only.
  // Debug buttons should ALWAYS show the corresponding UI screen regardless of actual game state.
  // Never add conditional logic that could prevent viewing any debug screen.
  // The debug panel is NOT for testing real game functionality - it's purely for UI navigation.
  private debugMode: boolean = true; // Always true in this debug component
  private debugCurrentScreen: string = 'pre-game-host'; // Tracks which debug screen to show
  private debugCurrentScreenBinding = new ui.Binding<string>('pre-game-host');

  // Info pop-up binding
  private showInfoPopupBinding = new ui.Binding(false);
  private infoPopupTypeBinding = new ui.Binding<'timer' | 'difficulty' | 'gamemode'>('timer');

  // Host status binding
  private isHostBinding = new ui.Binding(false);
  private currentHostStatus = false;

  // Ready state binding for participants
  private isReadyBinding = new ui.Binding(false);
  private isReady = false;

  // Button pressed state to prevent white flash
  private buttonPressedBinding = new ui.Binding(false);

  constructor() {
    super();
    this.isReady = false;
  }

  // Methods to interact with the native leaderboard system
  private isPersistentStorageReady(): boolean {
    // Since we're no longer using persistent storage, this is always true
    return true;
  }

  private getPlayerPoints(player: hz.Player): number {
    try {
      // Get score from native leaderboard system (if available)
      // Note: Native leaderboard doesn't have getScoreForPlayer, so we return the local score
      return this.score;
    } catch (error) {
      return 0;
    }
  }

  private updateScoreDisplay(): void {
    // Asset Pool Gizmo handles ownership - always update for local player
    const currentScore = this.score;
    this.scoreBinding.set(currentScore);
  }

  private updateScoreDisplayDelayed(): void {
    this.async.setTimeout(() => {
      this.updateScoreDisplay();
    }, 1000); // Increased delay to 1000ms to give persistent storage more time to initialize
  }

  private updateScoreDisplayWithRetry(retryCount: number = 0): void {
    // Since we're not using persistent storage anymore, just update with current local score
    this.updateScoreDisplay();
  }

  private waitForPersistentStorageAndUpdateScore(): void {
    // Since we're not using persistent storage anymore, just update the score display
    this.updateScoreDisplay();
  }

  async start() {
    // Register this TriviaPhone instance with the world for TriviaGame access
    (this.world as any).triviaPhones = (this.world as any).triviaPhones || [];
    (this.world as any).triviaPhones.push(this);
    
    // Also register with global registry as backup
    if (!(globalThis as any).triviaGameDebugInstances) {
      (globalThis as any).triviaGameDebugInstances = [];
    }
    (globalThis as any).triviaGameDebugInstances.push(this);
    
    // Register with debug-specific registry
    if (!(globalThis as any).triviaPhoneDebugInstances) {
      (globalThis as any).triviaPhoneDebugInstances = [];
    }
    (globalThis as any).triviaPhoneDebugInstances.push(this);
    
    this.setupNetworkEvents();
    this.setupKeyboardInput();

    // Store the original position when the component starts
    this.originalPosition = this.entity.position.get().clone();

    // Initialize host status binding
    this.currentHostStatus = this.isHost();
    this.isHostBinding.set(this.currentHostStatus);

    // Update score display
    this.waitForPersistentStorageAndUpdateScore();
    
    // Setup debug-specific functionality
    this.setupDebugFunctionality();
  }

  private setupDebugFunctionality(): void {
    // Debug-specific setup to ensure compatibility with TriviaGameDebugUI
    
    // Ensure debug network events are properly registered
    this.connectNetworkBroadcastEvent(triviaStateRequestEvent, this.onStateRequest.bind(this));
    
    // Register with debug-specific global registry
    if (!(globalThis as any).triviaGameDebugInstances) {
      (globalThis as any).triviaGameDebugInstances = [];
    }
    (globalThis as any).triviaGameDebugInstances.push(this);
  }

  private onStateRequest(event: { requesterId: string }): void {
    // Handle state requests from TriviaGameDebugUI
    
    // Send current state back to requester
    const currentState = {
      requesterId: event.requesterId,
      gameState: this.gameStarted ? 'playing' as const : 'waiting' as const,
      currentQuestion: this.currentQuestion,
      questionIndex: this.currentQuestionIndex,
      timeLimit: this.gameSettings.timeLimit
    };
    
    this.sendNetworkBroadcastEvent(triviaStateResponseEvent, currentState);
  }

  private teleportToPlayer(player: hz.Player): void {
    try {
      // Check if LocalCamera is available (accessed via camera module)
      if (!camera.default) {
        this.teleportToPlayerFallback(player);
        return;
      }

      // Get the camera's current position, rotation, and forward direction
      const cameraPosition = camera.default.position.get();
      const cameraRotation = camera.default.rotation.get();
      const cameraForward = camera.default.forward.get();

      // Position the TriviaPhone in front of the camera with forward offset
      // This ensures the TriviaPhone appears in front of where the user is looking
      const forwardOffset = 2.5; // Move 2.5 units forward from camera position (increased from 1.5)
      const desiredPosition = cameraPosition.add(cameraForward.mul(forwardOffset));

      // Update the TriviaPhone's position to match the camera's position with forward offset
      this.entity.position.set(desiredPosition);

      // Make the TriviaPhone face the opposite direction of the camera (towards the user's viewport)
      const faceOppositeRotation = hz.Quaternion.fromAxisAngle(hz.Vec3.up, Math.PI); // 180 degrees around Y-axis
      const finalRotation = cameraRotation.mul(faceOppositeRotation);
      this.entity.rotation.set(finalRotation);

    } catch (error) {
      // Fallback to player position if camera access fails
      this.teleportToPlayerFallback(player);
    }
  }

  private teleportToPlayerFallback(player: hz.Player): void {
    try {
      // Get the player's current position and rotation
      const playerPosition = player.position.get();
      const playerRotation = player.rotation.get();

      // Transform the offset vector by the player's rotation to position it relative to their facing direction
      const rotatedOffset = hz.Quaternion.mulVec3(playerRotation, this.followOffset);

      // Calculate the desired position for the TriviaPhone
      const desiredPosition = playerPosition.add(rotatedOffset);

      // Update the TriviaPhone's position to the player's location with rotated offset
      this.entity.position.set(desiredPosition);

      // Make the TriviaPhone face the player (rotate 180 degrees from player's direction)
      const facePlayerRotation = hz.Quaternion.fromAxisAngle(hz.Vec3.up, Math.PI); // 180 degrees around Y-axis
      const finalRotation = playerRotation.mul(facePlayerRotation);
      this.entity.rotation.set(finalRotation);

    } catch (error) {
      // Fallback to player position if camera access fails
    }
  }

  private teleportDirectlyInFrontOfVRUser(player: hz.Player): void {
    try {
      // Get player position first
      const playerPosition = player.position.get();

      // Set position first (using fallback player forward for initial positioning)
      let cameraForward: hz.Vec3;
      try {
        if (camera.default) {
          cameraForward = camera.default.forward.get();
        } else {
          cameraForward = player.forward.get();
        }
      } catch (error) {
        cameraForward = player.forward.get();
      }

      // Calculate left direction and desired position
      const playerLeft = cameraForward.cross(hz.Vec3.up).normalize();
      const desiredPosition = playerPosition
        .add(cameraForward.mul(1.0))
        .add(playerLeft.mul(0.0)); // Small positive value moves phone to the left
      // Set Y position based on user's body position (ground level + offset)
      desiredPosition.y = playerPosition.y + 0.4;

      // Calculate direction to player and rotation BEFORE setting position
      const directionToPlayer = playerPosition.sub(desiredPosition).normalize();
      const angleY = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      const desiredRotation = hz.Quaternion.fromAxisAngle(new hz.Vec3(0, 1, 0), angleY);


      // Set position and rotation at the same time
      this.entity.position.set(desiredPosition);
      this.entity.rotation.set(desiredRotation);

      // Disable physics and collision
      this.entity.simulated.set(false);
      this.entity.collidable.set(false);

    } catch (error) {
      // Fallback to the original method if something goes wrong
      this.teleportToPlayerFallback(player);
    }
  }

  update(dt: number) {
    // Update host status binding if it has changed
    const currentHostStatus = this.isHost();
    if (currentHostStatus !== this.currentHostStatus) {
      this.currentHostStatus = currentHostStatus;
      this.isHostBinding.set(currentHostStatus);
    }

    // Asset Pool Gizmo handles ownership, so we work with the local player
    const localPlayer = this.world.getLocalPlayer();
    if (localPlayer) {
      try {
        // Check if the TriviaPhone entity is still visible (as an indicator of UI focus)
        const isVisible = this.entity.visible.get();

        // If the TriviaPhone was visible but is no longer visible, trigger restoration
        if (this.isPlayerFocusedOnUI && !isVisible) {
          // Mark that the player is no longer focused on the UI
          this.isPlayerFocusedOnUI = false;
        }

        // Keep VR phone positioned and ensure bottom points down
        if (localPlayer.deviceType.get() === hz.PlayerDeviceType.VR && isVisible) {
          // Check if phone is currently "hidden" at y=0 (don't reposition if hidden)
          const currentPosition = this.entity.position.get();
          if (currentPosition.y === 0) {
            return; // Don't reposition if hidden
          }

          // Disable physics/simulation
          this.entity.simulated.set(false);
          this.entity.collidable.set(false);

          // Maintain position 1 unit in front and 0.25 units to the left of player
          const playerPosition = localPlayer.position.get();
          const playerForward = localPlayer.forward.get();
          const playerLeft = playerForward.cross(hz.Vec3.up).normalize();
          const desiredPosition = playerPosition
            .add(playerForward.mul(1.0))
            .add(playerLeft.mul(-0.25)); // Negative for left
          desiredPosition.y += 0.4;
          // Allow Z position to change based on user location
          this.entity.position.set(desiredPosition);

          // Calculate direction to player and set rotation manually
          const playerPos = localPlayer.position.get();
          const phonePos = this.entity.position.get();
          const directionToPlayer = playerPos.sub(phonePos).normalize();

          // Create a quaternion that rotates the phone to face the player
          // First, get the angle in the XZ plane
          const angleY = Math.atan2(directionToPlayer.x, directionToPlayer.z);

          // Create rotation quaternion
          const rotation = hz.Quaternion.fromAxisAngle(new hz.Vec3(0, 1, 0), angleY);
          this.entity.rotation.set(rotation);
        }

      } catch (error) {
      }
    }
  }

  stop() {
    if (this.eKeyInputConnection) {
      this.eKeyInputConnection.disconnect();
      this.eKeyInputConnection = null;
    }
    if (this.rightSecondaryInputConnection) {
      this.rightSecondaryInputConnection.disconnect();
      this.rightSecondaryInputConnection = null;
    }
    if (this.leftSecondaryInputConnection) {
      this.leftSecondaryInputConnection.disconnect();
      this.leftSecondaryInputConnection = null;
    }
    if (this.leftTertiaryInputConnection) {
      this.leftTertiaryInputConnection.disconnect();
      this.leftTertiaryInputConnection = null;
    }
    
    // Clean up global registry
    if ((globalThis as any).triviaGameDebugInstances) {
      const index = (globalThis as any).triviaGameDebugInstances.indexOf(this);
      if (index > -1) {
        (globalThis as any).triviaGameDebugInstances.splice(index, 1);
      }
    }
    
    // Clean up world registry
    if ((this.world as any).triviaPhones) {
      const index = (this.world as any).triviaPhones.indexOf(this);
      if (index > -1) {
        (this.world as any).triviaPhones.splice(index, 1);
      }
    }
  }

  private setupNetworkEvents(): void {
    // Listen for trivia results events
    this.connectNetworkBroadcastEvent(triviaResultsEvent, (eventData) => {
      this.onTriviaResults(eventData);
    });

    // Listen for two-option question events
    this.connectNetworkBroadcastEvent(triviaTwoOptionsEvent, (eventData) => {
      this.onTriviaTwoOptions(eventData);
    });

    // Listen for four-option question events
    this.connectNetworkBroadcastEvent(triviaFourOptionsEvent, (eventData) => {
      this.onTriviaFourOptions(eventData);
    });

    // Listen for trivia game start events
    this.connectNetworkBroadcastEvent(triviaGameStartEvent, (eventData) => {
      this.startGame();
    });

    // Listen for trivia game registration events
    this.connectNetworkBroadcastEvent(triviaGameRegisteredEvent, (eventData) => {
      // Request current game state to sync with any ongoing game
      this.sendNetworkBroadcastEvent(triviaStateRequestEvent, {
        requesterId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
      });
    });

    // Listen for trivia state responses
    this.connectNetworkBroadcastEvent(triviaStateResponseEvent, (eventData) => {
      this.onTriviaStateResponse(eventData);
    });

    // Listen for trivia game end events
    this.connectNetworkBroadcastEvent(triviaGameEndEvent, (eventData) => {
      this.onTriviaGameEnd(eventData);
    });

    // Listen for trivia game reset events
    this.connectNetworkBroadcastEvent(triviaGameResetEvent, (eventData) => {
      this.onTriviaGameReset(eventData);
    });

    // Listen for host changed events
    this.connectNetworkBroadcastEvent(hostChangedEvent, (eventData) => {
      this.onHostChanged(eventData);
    });

    // Request state immediately when component starts (for players joining mid-game)
    this.async.setTimeout(() => {
      this.sendNetworkBroadcastEvent(triviaStateRequestEvent, {
        requesterId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
      });
    }, 1000); // Wait 1 second for everything to initialize
  }

  private setupKeyboardInput(): void {
    try {
      // Check if PlayerControls is available (should be since this is a CustomUI running locally)
      if (typeof hz.PlayerControls === 'undefined') {
        this.fallbackToSeparateComponent();
        return;
      }

      // Get the local player (owner of the TriviaPhone)
      const localPlayer = this.world.getLocalPlayer();
      if (!localPlayer) {
        this.fallbackToSeparateComponent();
        return;
      }

      // Additional check: verify we can actually call PlayerControls methods
      try {
        // This will throw an error if not in the right context
        hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightSecondary);
      } catch (contextError) {
        this.fallbackToSeparateComponent();
        return;
      }

      // Set up E key input for hiding TriviaPhone when focused - ENABLED for non-VR users only
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightGrip)) {
        // Check if the local player is NOT a VR user
        const isVRUser = localPlayer.deviceType.get() === hz.PlayerDeviceType.VR;

        if (!isVRUser) {
          this.eKeyInputConnection = hz.PlayerControls.connectLocalInput(
            hz.PlayerInputAction.RightGrip,
            hz.ButtonIcon.None,
            this,
            { preferredButtonPlacement: hz.ButtonPlacement.Default }
          );

          this.eKeyInputConnection.registerCallback((action, pressed) => {
            if (pressed) {
              // Handle E key trigger - hide TriviaPhone for non-VR users
              this.handleEKeyTrigger(localPlayer);
            }
          });
        }
      }

      // Set up H key input for opening TriviaPhone (desktop, web, and mobile users only)
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary)) {
        // Check if the local player is NOT a VR user
        const isVRUser = localPlayer.deviceType.get() === hz.PlayerDeviceType.VR;

        if (!isVRUser) {
          this.leftTertiaryInputConnection = hz.PlayerControls.connectLocalInput(
            hz.PlayerInputAction.LeftTertiary,

            hz.ButtonIcon.Menu,
            this,
            { preferredButtonPlacement: hz.ButtonPlacement.Center }
          );

          this.leftTertiaryInputConnection.registerCallback((action: hz.PlayerInputAction, pressed: boolean) => {
            if (pressed) {
              // Handle H key trigger - show TriviaPhone for non-VR users
              this.handleLeftTertiaryTrigger(localPlayer);
            }
          });
        }
      } else {
      }

      // Set up RightSecondary input for VR users only
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightSecondary)) {
        // Check if the local player IS a VR user
        const isVRUser = localPlayer.deviceType.get() === hz.PlayerDeviceType.VR;

        if (isVRUser) {
          this.rightSecondaryInputConnection = hz.PlayerControls.connectLocalInput(
            hz.PlayerInputAction.RightSecondary,
            hz.ButtonIcon.Menu,
            this,
            { preferredButtonPlacement: hz.ButtonPlacement.Default }
          );

          this.rightSecondaryInputConnection.registerCallback((action: hz.PlayerInputAction, pressed: boolean) => {
            if (pressed) {
              // Handle RightSecondary trigger - show/hide TriviaPhone for VR users
              this.handleRightSecondaryTrigger(localPlayer);
            }
          });
        } else {
        }
      } else {
      }

      // Set up LeftSecondary input for VR users only (same functionality as RightSecondary)
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftSecondary)) {
        // Check if the local player IS a VR user
        const isVRUser = localPlayer.deviceType.get() === hz.PlayerDeviceType.VR;

        if (isVRUser) {
          this.leftSecondaryInputConnection = hz.PlayerControls.connectLocalInput(
            hz.PlayerInputAction.LeftSecondary,
            hz.ButtonIcon.Menu,
            this,
            { preferredButtonPlacement: hz.ButtonPlacement.Default }
          );

          this.leftSecondaryInputConnection.registerCallback((action: hz.PlayerInputAction, pressed: boolean) => {
            if (pressed) {
              // Handle LeftSecondary trigger - same as RightSecondary for VR users
              this.handleRightSecondaryTrigger(localPlayer);
            }
          });
        } else {
        }
      } else {
      }
    } catch (error) {
      this.fallbackToSeparateComponent();
    }
  }

  private fallbackToSeparateComponent(): void {
  }

  onFocus(player: hz.Player): void {
    // Mark that the player is now focused on the UI
    this.isPlayerFocusedOnUI = true;

    // Show the TriviaPhone when focused - make it visible to all players
    this.entity.visible.set(true);
  }

  onUnfocus(player: hz.Player): void {
    // Mark that the player is no longer focused on the UI
    this.isPlayerFocusedOnUI = false;

    // Hide the TriviaPhone when unfocused - make it invisible to all players
    this.hideTriviaPhone();
  }

  private hideTriviaPhone(): void {
    this.entity.visible.set(false);
  }

  private showTriviaPhone(): void {
    this.entity.visible.set(true);
  }

  private handleEKeyTrigger(player: hz.Player): void {
    // Check if the player is a VR user
    const isVRUser = player.deviceType.get() === hz.PlayerDeviceType.VR;

    if (isVRUser) {
      // For VR users: Rotate to face ground and set y to 0
      const currentPosition = this.entity.position.get();
      this.entity.position.set(new hz.Vec3(currentPosition.x, 0, currentPosition.z));

      // Rotate to face the ground (90 degrees around X-axis)
      const groundRotation = hz.Quaternion.fromAxisAngle(new hz.Vec3(1, 0, 0), Math.PI / 2);
      this.entity.rotation.set(groundRotation);
    } else {
      // For non-VR users: Set y to -1000 as before
      const currentPosition = this.entity.position.get();
      this.entity.position.set(new hz.Vec3(currentPosition.x, -1000, currentPosition.z));
    }

    // Reset focus state since player is no longer actively using the phone
    this.isPlayerFocusedOnUI = false;
  }

  private handleRightSecondaryTrigger(player: hz.Player): void {
    // Handle RightSecondary trigger - show/hide TriviaPhone for VR users
    const phonePosition = this.entity.position.get();
    const playerPosition = player.position.get();

    // For VR users, check if y position is 0 OR if the phone is very far from the player
    // This ensures first-time VR users can see the phone on their first click
    const isVRUser = player.deviceType.get() === hz.PlayerDeviceType.VR;
    const shouldShow = isVRUser ? 
      (phonePosition.y <= 0.1 || phonePosition.distance(playerPosition) > 5) : 
      (phonePosition.distance(playerPosition) > 10);

    if (shouldShow) {
      // Check if the CustomUI is already open by checking if phone is close to player and not hidden
      const isPhoneVisibleToPlayer = phonePosition.distance(playerPosition) < 5 && phonePosition.y > -500;

      if (this.isPlayerFocusedOnUI && isPhoneVisibleToPlayer) {
        // UI is already open, do nothing
        return;
      }

      // Capture camera position when RightSecondary is pressed
      try {
        if (camera.default) {
          this.cameraPositionAtHKeyPress = camera.default.position.get().clone();
          this.cameraRotationAtHKeyPress = camera.default.rotation.get().clone();
        }
      } catch (error) {
      }

      // Asset Pool Gizmo handles ownership assignment automatically

      // Use VR-specific teleport method for VR users
      this.teleportDirectlyInFrontOfVRUser(player);
      this.openAndFocusUIForPlayer(player);
    } else {
      // Phone is visible (within range), hide it
      if (isVRUser) {
        // For VR users: Rotate to face ground and set y to 0
        this.entity.position.set(new hz.Vec3(phonePosition.x, 0, phonePosition.z));

        // Rotate to face the ground (90 degrees around X-axis)
        const groundRotation = hz.Quaternion.fromAxisAngle(new hz.Vec3(1, 0, 0), Math.PI / 2);
        this.entity.rotation.set(groundRotation);
      } else {
        // For non-VR users: Set y to -1000
        this.entity.position.set(new hz.Vec3(phonePosition.x, -1000, phonePosition.z));
      }

      // Reset focus state since player is no longer actively using the phone
      this.isPlayerFocusedOnUI = false;
    }
  }

  private handleLeftTertiaryTrigger(player: hz.Player): void {
    // This method is only called for non-VR users (desktop, web, mobile) since we only register the input for them

    // Check if the CustomUI is already open by checking if phone is close to player and not hidden
    const phonePosition = this.entity.position.get();
    const playerPosition = player.position.get();
    const isPhoneVisibleToPlayer = phonePosition.distance(playerPosition) < 5 && phonePosition.y > -500;

    if (this.isPlayerFocusedOnUI && isPhoneVisibleToPlayer) {
      // UI is already open, do nothing
      return;
    }

    // Asset Pool Gizmo handles ownership assignment automatically

    // Show the TriviaPhone and focus the UI for non-VR users
    this.teleportToPlayer(player);
    this.openAndFocusUIForPlayer(player);
  }

  private openUIForPlayer(player: hz.Player): void {
    try {
      // The UI should automatically be visible to the player if they're interacting with the CustomUI gizmo
      // This ensures the phone is ready when they look at it

    } catch (error) {
    }
  }

  private openAndFocusUIForPlayer(player: hz.Player): void {
    try {
      // First prepare the UI
      this.openUIForPlayer(player);

      // Set focus state immediately to prevent H key from working during the transition
      this.isPlayerFocusedOnUI = true;

      // For VR users, skip focusUI to avoid hiding other players
      const isVRUser = player.deviceType.get() === hz.PlayerDeviceType.VR;
      if (!isVRUser) {
        // Wait 25ms for position change to take effect, then focus the UI (reduced from 100ms)
        this.async.setTimeout(() => {
          try {
            player.focusUI(this.entity, { duration: 0.1 });
          } catch (focusError) {
            // If focus fails, reset the focus state
            this.isPlayerFocusedOnUI = false;
          }
        }, 25);
      }
      // For VR users, we skip the focusUI call to prevent the player invisibility bug

    } catch (error) {
      // If something goes wrong, reset the focus state
      this.isPlayerFocusedOnUI = false;
    }
  }

  initializeUI() {
    return this.render();
  }

  // Asset Pool Gizmo handles ownership automatically - these methods are no longer needed

  public unfocusAndHide(): void {
    // Asset Pool Gizmo handles ownership, so we work with the local player
    const localPlayer = this.world.getLocalPlayer();
    if (localPlayer) {
      // Explicitly hide the TriviaPhone after a short delay to ensure unfocus completes
      this.async.setTimeout(() => {
        this.hideTriviaPhone();
      }, 50);
    }
  }

  public checkAndHideIfUnfocused(): void {
    // Asset Pool Gizmo handles ownership, so we work with the local player
    const localPlayer = this.world.getLocalPlayer();
    if (localPlayer) {
      // For now, just hide it since we can't easily check focus state
      this.hideTriviaPhone();
    }
  }

  public isFollowing(): boolean {
    // Asset Pool Gizmo handles ownership - always return true since it's managed externally
    return true;
  }

  public getAssignedPlayer(): hz.Player | null {
    // Asset Pool Gizmo handles ownership - return local player
    return this.world.getLocalPlayer();
  }

  public forceHide(): void {
    this.hideTriviaPhone();
  }

  public forceShow(): void {
    this.showTriviaPhone();
  }

  public handleExternalUnfocus(): void {
    // Asset Pool Gizmo handles ownership - always hide for local player
    this.hideTriviaPhone();
  }

  public getUnfocusCallback(): () => void {
    return () => {
      this.handleExternalUnfocus();
    };
  }

  private canPlayerInteract(player: hz.Player): boolean {
    // Asset Pool Gizmo handles ownership - allow interaction for the local player
    const localPlayer = this.world.getLocalPlayer();
    return localPlayer ? localPlayer.id === player.id : false;
  }

  private isHost(): boolean {
    // Use centralized host status from TriviaGame
    return this.currentHostStatus;
  }

  private handleStartGame(): void {
    if (!this.isHost()) return;

    // Send network event to start the game for all players with configured settings
    this.sendNetworkBroadcastEvent(triviaGameStartEvent, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'host',
      config: {
        timeLimit: this.gameSettings.timeLimit,
        category: this.gameSettings.category.toLowerCase().replace(' ', ''),
        difficulty: this.gameSettings.difficulty,
        numQuestions: this.gameSettings.numberOfQuestions
      }
    });
  }

  private handleReadyButtonPress(): void {
    if (this.isHost()) {
      // Host should navigate to game settings
      this.navigateToGameSettings();
    } else {
      // Participant should toggle ready state
      this.isReady = !this.isReady;
      this.isReadyBinding.set(this.isReady);
    }
  }

  private handleGameSettingsOrReadyButton(): void {
    if (this.isHost()) {
      this.navigateToGameSettings();
    } else {
      this.buttonPressedBinding.set(true);
    }
  }

  private handleGameSettingsOrReadyButtonRelease(): void {
    if (!this.isHost()) {
      this.buttonPressedBinding.set(false);
      this.handleReadyButtonPress();
    }
  }

  // Trivia game methods
  private startGame(): void {
    this.gameStarted = true;
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.score = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    this.gameStartedBinding.set(true);
    this.gameEndedBinding.set(false); // Reset game ended state
    this.currentQuestionIndexBinding.set(0);
    this.scoreBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.isCorrectAnswerBinding.set(false);
    this.correctAnswerIndexBinding.set(null);
    this.answerSubmittedBinding.set(false);
    
    // Reset layout type to default (four-options)
    this.layoutTypeBinding.set('four-options');
    
    // Reset screen type to waiting
    this.currentScreenType = 'waiting';
    this.screenTypeBinding.set('waiting');

    // Initialize score from persistent storage with robust retry logic
    this.updateScoreDisplayWithRetry();
  }

  public forceSyncWithTriviaGame(): void {
    // This method can be called by TriviaGame to force a sync
    // For now, we'll rely on network events for synchronization
  }

  public onTriviaResults(eventData: { 
    question: any, 
    correctAnswerIndex: number, 
    answerCounts: number[], 
    scores: { [key: string]: number },
    showLeaderboard?: boolean,
    leaderboardData?: Array<{name: string, score: number, playerId: string}>
  }): void {
    this.showResult = true;
    this.showResultBinding.set(true);
    
    // Set screen type to results
    this.currentScreenType = 'results';
    this.screenTypeBinding.set('results');
    
    // Store the current question data
    this.currentQuestion = eventData.question;
    this.currentQuestionBinding.set(eventData.question); // Update binding to prevent flashing
    
    // Store the correct answer index
    this.correctAnswerIndexBinding.set(eventData.correctAnswerIndex);

    // Check if player's answer was correct - only award points during answer reveal (not leaderboard transition)
    const playerDidNotAnswer = this.selectedAnswer === null;
    const isCorrect = playerDidNotAnswer ? false : this.selectedAnswer === eventData.correctAnswerIndex;
    this.isCorrectAnswerBinding.set(isCorrect);
    
    if (isCorrect && this.world.getLocalPlayer() && !eventData.showLeaderboard) {
      // Send network event to TriviaGame to award points using persistent storage
      this.sendNetworkBroadcastEvent(triviaAwardPointsEvent, {
        playerId: this.world.getLocalPlayer()!.id.toString(),
        points: 1
      });

      // Immediate local score increment for instant feedback
      this.score += 1;
      this.scoreBinding.set(this.score);

      // DON'T update from persistent storage immediately after a correct answer
      // The local increment is the source of truth until the next game event
    }
    
    // Update leaderboard binding
    this.showLeaderboardBinding.set(eventData.showLeaderboard || false);

    // Only update score display from persistent storage when leaderboard is shown
    // This ensures we sync with server state at appropriate times
    if (eventData.showLeaderboard) {
      // Wait a bit longer for the server to process the award, then sync
      this.async.setTimeout(() => {
        this.updateScoreDisplayWithRetry(0);
      }, 2000); // Wait 2 seconds for server processing
    }
  }

  public onTriviaTwoOptions(eventData: { 
    question: any, 
    questionIndex: number, 
    timeLimit: number 
  }): void {
    
    // Reset result display
    this.showResult = false;
    this.showResultBinding.set(false);
    
    // Set screen type to two-options
    this.currentScreenType = 'two-options';
    this.lastQuestionType = 'two-options';
    this.screenTypeBinding.set('two-options');
    
    // Store the current question data
    this.currentQuestion = eventData.question;
    this.currentQuestionBinding.set(eventData.question);
    
    // Reset selected answer
    this.selectedAnswer = null;
    this.selectedAnswerBinding.set(null);
    
    // Store question index
    this.currentQuestionIndex = eventData.questionIndex;
    
  }

  public onTriviaFourOptions(eventData: { 
    question: any, 
    questionIndex: number, 
    timeLimit: number 
  }): void {
    
    // Reset result display
    this.showResult = false;
    this.showResultBinding.set(false);
    
    // Set screen type to four-options
    this.currentScreenType = 'four-options';
    this.lastQuestionType = 'four-options';
    this.screenTypeBinding.set('four-options');
    
    // Store the current question data
    this.currentQuestion = eventData.question;
    this.currentQuestionBinding.set(eventData.question);
    
    // Reset selected answer
    this.selectedAnswer = null;
    this.selectedAnswerBinding.set(null);
    
    // Store question index
    this.currentQuestionIndex = eventData.questionIndex;
    
  }

  private onTriviaStateResponse(event: {
    requesterId: string,
    gameState: 'waiting' | 'playing' | 'results' | 'leaderboard' | 'ended',
    currentQuestion?: any,
    questionIndex?: number,
    timeLimit?: number,
    showLeaderboard?: boolean,
    leaderboardData?: Array<{name: string, score: number, playerId: string}>
  }): void {
    // Only process responses meant for this player
    const localPlayer = this.world.getLocalPlayer();
    if (!localPlayer || event.requesterId !== localPlayer.id.toString()) {
      return;
    }

    switch (event.gameState) {
      case 'waiting':
        this.gameStarted = false;
        this.gameStartedBinding.set(false);
        this.currentScreenType = 'waiting';
        this.screenTypeBinding.set('waiting');
        break;
      case 'playing':
        this.gameStarted = true;
        this.gameStartedBinding.set(true);
        if (event.currentQuestion) {
          // Determine screen type based on answer count and route appropriately
          const answerCount = event.currentQuestion.answers ? event.currentQuestion.answers.length : 4;
          if (answerCount === 2) {
            this.onTriviaTwoOptions({
              question: event.currentQuestion,
              questionIndex: event.questionIndex || 0,
              timeLimit: event.timeLimit || this.gameSettings.timeLimit
            });
          } else {
            this.onTriviaFourOptions({
              question: event.currentQuestion,
              questionIndex: event.questionIndex || 0,
              timeLimit: event.timeLimit || this.gameSettings.timeLimit
            });
          }
        }
        break;
      case 'results':
        this.showResult = true;
        this.showResultBinding.set(true);
        this.currentScreenType = 'results';
        this.screenTypeBinding.set('results');
        break;
      case 'leaderboard':
        this.showLeaderboardBinding.set(event.showLeaderboard || false);
        break;
      case 'ended':
        this.gameStarted = false;
        this.gameStartedBinding.set(false);
        this.currentScreenType = 'waiting';
        this.screenTypeBinding.set('waiting');
        break;
    }
  }

  private onTriviaGameEnd(eventData: { 
    hostId: string, 
    finalLeaderboard?: Array<{name: string, score: number, playerId: string}> 
  }): void {

    // Reset game state to show Start Game screen
    this.gameStarted = false;
    this.gameStartedBinding.set(false);
    this.gameEndedBinding.set(true); // Mark game as ended
    this.showResult = false;
    this.showResultBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.selectedAnswer = null;
    this.selectedAnswerBinding.set(null);
    this.currentQuestionIndex = 0;
    this.currentQuestionIndexBinding.set(0);
    this.answerSubmitted = false;
    this.answerSubmittedBinding.set(false);
    
    // Set screen type to waiting
    this.currentScreenType = 'waiting';
    this.screenTypeBinding.set('waiting');
    
    // Clear current question data
    this.currentQuestion = null;
    this.currentQuestionBinding.set(null); // Clear binding
    
    // Show final leaderboard data if provided
    if (eventData.finalLeaderboard && eventData.finalLeaderboard.length > 0) {
      // Briefly show final leaderboard, then return to start screen
      this.showLeaderboardBinding.set(true);
      this.async.setTimeout(() => {
        this.showLeaderboardBinding.set(false);
      }, 5000); // Show for 5 seconds
    }
  }

  private onTriviaGameReset(eventData: { hostId: string }): void {
    
    // Reset all game state to initial values
    this.gameStarted = false;
    this.gameEndedBinding.set(false);
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.currentQuestionBinding.set(null); // Clear binding
    this.score = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    // Reset all bindings
    this.gameStartedBinding.set(false);
    this.currentQuestionIndexBinding.set(0);
    this.scoreBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.answerSubmittedBinding.set(false);
    
    // Reset layout type to default
    this.layoutTypeBinding.set('four-options');
    
    // Navigate back to pre-game screen
    this.currentViewMode = 'pre-game';
    this.currentViewModeBinding.set('pre-game');

    // Update score display from persistent storage after reset with robust retry
    this.updateScoreDisplayWithRetry();
  }

  private onHostChanged(eventData: { newHostId: string; oldHostId?: string }): void {
    
    // Update host status based on centralized host management
    const localPlayer = this.world.getLocalPlayer();
    const isLocalPlayerHost = localPlayer ? eventData.newHostId === localPlayer.id.toString() : false;
    
    this.currentHostStatus = isLocalPlayerHost;
    this.isHostBinding.set(isLocalPlayerHost);
  }

  private endGame(): void {
    if (!this.isHost()) {
      return;
    }

    // Send reset event to TriviaGame and all TriviaPhones
    this.sendNetworkBroadcastEvent(triviaGameResetEvent, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
    });
  }

  private handleAnswerSelect(answerIndex: number): void {
    if (this.showResult) return;

    // For 2-answer questions, map button indices 2 and 3 to answer indices 0 and 1
    let actualAnswerIndex = answerIndex;
    if (this.currentQuestion && this.currentQuestion.answers && this.currentQuestion.answers.length === 2) {
      if (answerIndex === 2) {
        actualAnswerIndex = 0;
      } else if (answerIndex === 3) {
        actualAnswerIndex = 1;
      }
    }

    this.selectedAnswer = actualAnswerIndex;
    this.selectedAnswerBinding.set(actualAnswerIndex);
    this.answerSubmitted = true;
    this.answerSubmittedBinding.set(true);

    // Send network event with the answer index
    this.sendNetworkBroadcastEvent(triviaAnswerSubmittedEvent, {
      playerId: this.world.getLocalPlayer()?.id.toString() || 'local',
      answerIndex: actualAnswerIndex,
      responseTime: 0
    });
  }

  private nextQuestion(): void {
    // Send next question event to TriviaGame - let it handle all the logic
    this.sendNetworkBroadcastEvent(triviaNextQuestionEvent, {
      playerId: this.world.getLocalPlayer()?.id.toString() || 'host'
    });
  }

  private resetGame(): void {
    this.gameStarted = false;
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.currentQuestionBinding.set(null); // Clear binding
    this.score = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    this.gameStartedBinding.set(false);
    this.currentQuestionIndexBinding.set(0);
    this.scoreBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.answerSubmittedBinding.set(false);
  }

  // Game settings methods
  private navigateToGameSettings(): void {
    this.currentViewMode = 'game-settings';
    this.currentViewModeBinding.set('game-settings');
  }

  private navigateToPreGame(): void {
    this.currentViewMode = 'pre-game';
    this.currentViewModeBinding.set('pre-game');
  }

  private updateGameSetting(key: string, value: any): void {
    if (this.gameSettings.isLocked) return;

    (this.gameSettings as any)[key] = value;
    this.gameSettingsBinding.set({ ...this.gameSettings });

    // Send settings update to TriviaGame immediately
    this.sendNetworkBroadcastEvent(triviaSettingsUpdateEvent, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'host',
      settings: { ...this.gameSettings }
    });
  }

  private toggleSettingsLock(): void {
    this.updateGameSetting('isLocked', !this.gameSettings.isLocked);
  }

  // DEBUG NAVIGATION METHOD
  // =======================
  // CRITICAL: This method is PURELY for UI navigation and visual testing.
  // The debug panel should NEVER test actual game functionality.
  // Every debug button click should ALWAYS show the corresponding screen.
  // There should be NO conditional logic that prevents viewing any debug screen.
  // This is strictly for designers and developers to view different UI states.
  debugShowScreen(screenType: string): void {
    // IMPORTANT: Set the debug screen tracker first - this ensures the screen will show
    this.debugCurrentScreen = screenType;
    this.debugCurrentScreenBinding.set(screenType);
    
    // Set up the necessary bindings to force the UI to show the requested screen
    // These are the MINIMUM required bindings to make each screen visible
    switch (screenType) {
      case 'pre-game':
        // Pre-game screen (generic)
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(false);
        this.showResultBinding.set(false);
        break;
        
      case 'pre-game-host':
        // Pre-game screen for host user
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(false);
        this.showResultBinding.set(false);
        this.isHostBinding.set(true);
        this.currentHostStatus = true;
        break;
        
      case 'pre-game-participant':
        // Pre-game screen for participant user
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(false);
        this.showResultBinding.set(false);
        this.isHostBinding.set(false);
        this.currentHostStatus = false;
        break;
        
      case 'game-settings':
        // Game settings configuration screen
        this.currentViewModeBinding.set('game-settings');
        this.gameStartedBinding.set(false);
        this.showResultBinding.set(false);
        break;
        
      case 'two-options':
        // Two-answer question screen (2A)
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(true);
        this.screenTypeBinding.set('two-options');
        this.showResultBinding.set(false);
        // Mock question data for visual testing only
        this.currentQuestion = {
          question: 'Debug: Two Options Question?',
          answers: ['Option A', 'Option B'],
          correctAnswer: 0,
          image: null
        };
        break;
        
      case 'four-options':
        // Four-answer question screen (4A)
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(true);
        this.screenTypeBinding.set('four-options');
        this.showResultBinding.set(false);
        // Mock question data for visual testing only
        this.currentQuestion = {
          question: 'Debug: Four Options Question?',
          answers: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 1,
          image: null
        };
        break;
        
      case 'results-host-correct':
        // Results screen for host with correct answer
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(true);
        this.screenTypeBinding.set('results');
        this.showResultBinding.set(true);
        this.isCorrectAnswerBinding.set(true);
        this.selectedAnswerBinding.set(0);
        this.isHostBinding.set(true);
        this.currentHostStatus = true;
        // Mock question data for visual testing only
        this.currentQuestion = {
          question: 'Debug: Host Correct Question?',
          answers: ['Correct Answer', 'Wrong Answer'],
          correctAnswer: 0,
          image: null
        };
        break;
        
      case 'results-host-wrong':
        // Results screen for host with wrong answer
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(true);
        this.screenTypeBinding.set('results');
        this.showResultBinding.set(true);
        this.isCorrectAnswerBinding.set(false);
        this.selectedAnswerBinding.set(1);
        this.isHostBinding.set(true);
        this.currentHostStatus = true;
        // Mock question data for visual testing only
        this.currentQuestion = {
          question: 'Debug: Host Wrong Question?',
          answers: ['Correct Answer', 'Wrong Answer'],
          correctAnswer: 0,
          image: null
        };
        break;
        
      case 'results-participant-correct':
        // Results screen for participant with correct answer
        // CRITICAL: This should ALWAYS show when this debug button is clicked
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(true);
        this.screenTypeBinding.set('results');
        this.showResultBinding.set(true);
        this.isCorrectAnswerBinding.set(true);
        this.selectedAnswerBinding.set(0);
        this.isHostBinding.set(false);
        this.currentHostStatus = false;
        this.showLeaderboardBinding.set(false);
        // Mock question data for visual testing only
        this.currentQuestion = {
          question: 'Debug: Participant Correct Question?',
          answers: ['Correct Answer', 'Wrong Answer'],
          correctAnswer: 0,
          image: null
        };
        break;
        
      case 'results-participant-wrong':
        // Results screen for participant with wrong answer
        // CRITICAL: This should ALWAYS show when this debug button is clicked
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(true);
        this.screenTypeBinding.set('results');
        this.showResultBinding.set(true);
        this.isCorrectAnswerBinding.set(false);
        this.selectedAnswerBinding.set(1);
        this.isHostBinding.set(false);
        this.currentHostStatus = false;
        this.showLeaderboardBinding.set(false);
        // Mock question data for visual testing only
        this.currentQuestion = {
          question: 'Debug: Participant Wrong Question?',
          answers: ['Correct Answer', 'Wrong Answer'],
          correctAnswer: 0,
          image: null
        };
        break;
        
      default:
        // Fallback to pre-game host screen
        this.debugCurrentScreen = 'pre-game-host';
        this.debugCurrentScreenBinding.set('pre-game-host');
        this.currentViewModeBinding.set('pre-game');
        this.gameStartedBinding.set(false);
        this.showResultBinding.set(false);
        this.isHostBinding.set(true);
        this.currentHostStatus = true;
        break;
    }
    
    // DEBUG LOG: Always log which screen was requested for debugging purposes
    console.log(`🔧 Debug Panel Navigation: Showing ${screenType} screen`);
  }

  private toggleOutlines(): void {
    this.showOutlines = !this.showOutlines;
    this.showOutlinesBinding.set(this.showOutlines);
    
  }

  render(): ui.UINode {
    // Log screen dimensions
    console.log('📱 Phone Screen Dimensions:');
    console.log('   Height (top to bottom): 388 pixels');
    console.log('   Width (left to right): 188 pixels');
    console.log('   Total frame: 200x400 pixels (with 6px padding)');
    console.log('   Screen area: 188x388 pixels (usable content area)');

    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      },
      children: [
        // Phone container (left side)
        ui.View({
          style: {
            width: 200,
            height: 400,
            backgroundColor: '#000000', // Black phone frame
            borderRadius: 20,
            padding: 6,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 20
          },
          children: [
            // Phone screen content area
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: ui.Binding.derive([this.screenTypeBinding, this.currentViewModeBinding, this.gameStartedBinding], (screenType, mode, started) => {
                  if (mode === 'game-settings') return '#6366F1';
                  if (started && (screenType === 'two-options' || screenType === 'four-options')) return 'transparent';
                  if (started && screenType === 'results') return '#FFFFFF'; // Will be overridden by feedback screen
                  return '#FFFFFF';
                }),
                borderRadius: 14,
                overflow: 'hidden'
              },
              children: [
                // Waiting screen - default state during game
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding], (mode, screenType, started) => 
                    mode === 'pre-game' && started && (screenType === 'waiting' || !screenType)
                  ),
                  this.renderWaitingScreen()
                ),

                // Pre-game screen - shows when game hasn't started
                // DEBUG MODE: Always show when debug panel requests it
                ui.UINode.if(
                  ui.Binding.derive([this.debugCurrentScreenBinding, this.currentViewModeBinding, this.gameStartedBinding], (debugScreen, mode, started) => 
                    // PRIORITY 1: Debug mode - always show if debug panel requested pre-game screens
                    debugScreen === 'pre-game' || debugScreen === 'pre-game-host' || debugScreen === 'pre-game-participant' ||
                    // PRIORITY 2: Normal mode - show only when all conditions are met
                    (mode === 'pre-game' && !started)
                  ),
                  this.renderPreGameScreen()
                ),
                // Game settings screen
                // DEBUG MODE: Always show when debug panel requests it
                ui.UINode.if(
                  ui.Binding.derive([this.debugCurrentScreenBinding, this.currentViewModeBinding], (debugScreen, mode) => 
                    // PRIORITY 1: Debug mode - always show if debug panel requested this screen
                    debugScreen === 'game-settings' ||
                    // PRIORITY 2: Normal mode - show only when all conditions are met
                    (mode === 'game-settings')
                  ),
                  this.renderGameSettings()
                ),

                // Two-options question screen
                // DEBUG MODE: Always show when debug panel requests it
                ui.UINode.if(
                  ui.Binding.derive([this.debugCurrentScreenBinding, this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding], (debugScreen, mode, screenType, started) => 
                    // PRIORITY 1: Debug mode - always show if debug panel requested this screen
                    debugScreen === 'two-options' ||
                    // PRIORITY 2: Normal mode - show only when all conditions are met
                    (mode === 'pre-game' && started && screenType === 'two-options')
                  ),
                  this.renderTriviaGameWithTwoOptions()
                ),

                // Four-options question screen
                // DEBUG MODE: Always show when debug panel requests it
                ui.UINode.if(
                  ui.Binding.derive([this.debugCurrentScreenBinding, this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding], (debugScreen, mode, screenType, started) => 
                    // PRIORITY 1: Debug mode - always show if debug panel requested this screen
                    debugScreen === 'four-options' ||
                    // PRIORITY 2: Normal mode - show only when all conditions are met
                    (mode === 'pre-game' && started && screenType === 'four-options')
                  ),
                  ui.View({
                    style: {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0
                    },
                    children: [
                      // Background image
                      ui.Image({
                        source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1358485312536960'))),
                        style: {
                          width: '100%',
                          height: '100%',
                          resizeMode: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }
                      }),
                      this.renderFourOptionsPage()
                    ]
                  })
                ),

                // Results screen - participant correct
                // DEBUG MODE: This screen should ALWAYS show when debug panel requests it
                ui.UINode.if(
                  ui.Binding.derive([this.debugCurrentScreenBinding, this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding, this.showResultBinding, this.isCorrectAnswerBinding, this.isHostBinding], (debugScreen, mode, screenType, started, showResult, isCorrect, isHost) => 
                    // PRIORITY 1: Debug mode - always show if debug panel requested this screen
                    debugScreen === 'results-participant-correct' ||
                    // PRIORITY 2: Normal mode - show only when all conditions are met
                    (mode === 'pre-game' && started && screenType === 'results' && showResult && isCorrect && !isHost)
                  ),
                  this.renderParticipantCorrectResults()
                ),

                // Results screen - participant wrong
                // DEBUG MODE: This screen should ALWAYS show when debug panel requests it
                ui.UINode.if(
                  ui.Binding.derive([this.debugCurrentScreenBinding, this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding, this.showResultBinding, this.isCorrectAnswerBinding, this.isHostBinding], (debugScreen, mode, screenType, started, showResult, isCorrect, isHost) => 
                    // PRIORITY 1: Debug mode - always show if debug panel requested this screen
                    debugScreen === 'results-participant-wrong' ||
                    // PRIORITY 2: Normal mode - show only when all conditions are met
                    (mode === 'pre-game' && started && screenType === 'results' && showResult && !isCorrect && !isHost)
                  ),
                  this.renderParticipantWrongResults()
                ),

                // Results screen - host correct
                // DEBUG MODE: This screen should ALWAYS show when debug panel requests it
                ui.UINode.if(
                  ui.Binding.derive([this.debugCurrentScreenBinding, this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding, this.showResultBinding, this.isCorrectAnswerBinding, this.isHostBinding], (debugScreen, mode, screenType, started, showResult, isCorrect, isHost) => 
                    // PRIORITY 1: Debug mode - always show if debug panel requested this screen
                    debugScreen === 'results-host-correct' ||
                    // PRIORITY 2: Normal mode - show only when all conditions are met
                    (mode === 'pre-game' && started && screenType === 'results' && showResult && isCorrect && isHost)
                  ),
                  this.renderHostCorrectResults()
                ),

                // Results screen - host wrong
                // DEBUG MODE: This screen should ALWAYS show when debug panel requests it
                ui.UINode.if(
                  ui.Binding.derive([this.debugCurrentScreenBinding, this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding, this.showResultBinding, this.isCorrectAnswerBinding, this.isHostBinding], (debugScreen, mode, screenType, started, showResult, isCorrect, isHost) => 
                    // PRIORITY 1: Debug mode - always show if debug panel requested this screen
                    debugScreen === 'results-host-wrong' ||
                    // PRIORITY 2: Normal mode - show only when all conditions are met
                    (mode === 'pre-game' && started && screenType === 'results' && showResult && !isCorrect && isHost)
                  ),
                  this.renderHostWrongResults()
                )
              ]
            })
          ]
        }),

        // Debug Panel (right side)
        ui.View({
          style: {
            width: 200,
            height: 400,
            backgroundColor: '#2D3748',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'column'
          },
          children: [
            ui.Text({
              text: '🔧 Debug Panel',
              style: {
                fontSize: 16,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 16
              }
            }),
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                // Waiting Screen
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('pre-game-host'),
                  children: [
                    ui.Text({
                      text: 'Pre-Game (Host)',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Participant Waiting Screen
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('pre-game-participant'),
                  children: [
                    ui.Text({
                      text: 'Pre-Game (Participant)',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Game Settings
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('game-settings'),
                  children: [
                    ui.Text({
                      text: '⚙️ Game Settings',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // 2-Options Question
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('two-options'),
                  children: [
                    ui.Text({
                      text: '2A',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // 4-Options Question
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('four-options'),
                  children: [
                    ui.Text({
                      text: '4A',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Host Results Screen - Correct
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('results-host-correct'),
                  children: [
                    ui.Text({
                      text: '👑 Host - Correct',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Host Results Screen - Wrong
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('results-host-wrong'),
                  children: [
                    ui.Text({
                      text: '👑 Host - Wrong',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Participant Results Screen - Correct
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('results-participant-correct'),
                  children: [
                    ui.Text({
                      text: '👤 Participant - Correct',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Participant Results Screen - Wrong
                ui.Pressable({
                  style: {
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.debugShowScreen('results-participant-wrong'),
                  children: [
                    ui.Text({
                      text: '👤 Participant - Wrong',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Toggle Outlines
                ui.Pressable({
                  style: {
                    backgroundColor: this.showOutlinesBinding.derive(show => show ? '#16A34A' : '#DC2626'),
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginTop: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.toggleOutlines(),
                  children: [
                    ui.Text({
                      text: this.showOutlinesBinding.derive(show => show ? '🔲 Hide Outlines' : '⬜ Show Outlines'),
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderGameSettings(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2225071587959777'))),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Confirm Settings button at bottom
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 58,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8,
            paddingBottom: 8
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => this.navigateToPreGame(),
              children: [
                ui.Text({
                  text: 'Confirm Settings',
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111111',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Settings content
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 58,
            flexDirection: 'column'
          },
          children: [
            // Top row - Light/Dark mode and Settings icon
            ui.View({
              style: {
                width: '100%',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              },
              children: [
                // Light/Dark mode container
                ui.View({
                  style: {
                    backgroundColor: '#191919',
                    borderRadius: 8,
                    padding: 4,
                    flexDirection: 'row',
                    alignItems: 'center'
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))),
                      style: {
                        width: 24,
                        height: 24,
                        tintColor: '#FFFFFF'
                      }
                    }),
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))),
                      style: {
                        width: 24,
                        height: 24,
                        tintColor: 'rgba(255, 255, 255, 0.35)'
                      }
                    })
                  ]
                }),

                // Settings icon container
                ui.View({
                  style: {
                    backgroundColor: '#191919',
                    borderRadius: 8,
                    padding: 1,
                    width: 32,
                    height: 32,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1247632857052841'))),
                      style: {
                        width: 26,
                        height: 26,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                })
              ]
            }),

            // Category selection - General Trivia
            ui.View({
              style: {
                width: '100%',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 8
              },
              children: [
                ui.Pressable({
                  style: {
                    width: '100%',
                    minHeight: 44,
                    paddingTop: 8,
                    paddingBottom: 8,
                    backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.category === 'General' ? '#FFFFFF' : '#191919'
                    ),
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.updateGameSetting('category', 'General'),
                  children: [
                    ui.Text({
                      text: 'General Trivia',
                      style: {
                        fontSize: 18,
                        fontWeight: '600',
                        color: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.category === 'General' ? '#000000' : '#FFFFFF'
                        ),
                        textAlign: 'center'
                      }
                    })
                  ]
                })
              ]
            }),

            // Category selection - Another Category
            ui.View({
              style: {
                width: '100%',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 8
              },
              children: [
                ui.Pressable({
                  style: {
                    width: '100%',
                    minHeight: 44,
                    paddingTop: 8,
                    paddingBottom: 8,
                    backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.category === 'Another Category' ? '#FFFFFF' : '#191919'
                    ),
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.updateGameSetting('category', 'Another Category'),
                  children: [
                    ui.Text({
                      text: 'Another Category',
                      style: {
                        fontSize: 18,
                        fontWeight: '600',
                        color: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.category === 'Another Category' ? '#000000' : '#FFFFFF'
                        ),
                        textAlign: 'center'
                      }
                    })
                  ]
                })
              ]
            }),

            // Category selection - Italian Brainrot
            ui.View({
              style: {
                width: '100%',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 8
              },
              children: [
                ui.Pressable({
                  style: {
                    width: '100%',
                    minHeight: 44,
                    paddingTop: 8,
                    paddingBottom: 8,
                    backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.category === 'Italian Brainrot Quiz' ? '#FFFFFF' : '#191919'
                    ),
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.updateGameSetting('category', 'Italian Brainrot Quiz'),
                  children: [
                    ui.Text({
                      text: 'Italian Brainrot',
                      style: {
                        fontSize: 18,
                        fontWeight: '600',
                        color: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.category === 'Italian Brainrot Quiz' ? '#000000' : '#FFFFFF'
                        ),
                        textAlign: 'center'
                      }
                    })
                  ]
                })
              ]
            }),

            // Timer settings row
            ui.View({
              style: {
                width: '100%',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              },
              children: [
                // Timer options container
                ui.View({
                  style: {
                    backgroundColor: '#191919',
                    borderRadius: 8,
                    padding: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start'
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1739710850290036'))), // timer_off
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.timeLimit === 0 ? '#FFFFFF' : '#666666'
                        ),
                        marginRight: 2
                      }
                    }),
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1739710850290036'))), // timer
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.timeLimit > 0 ? '#FFFFFF' : '#666666'
                        ),
                        marginRight: 2
                      }
                    }),
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1471075670874559'))), // more_time
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.timeLimit > 30 ? '#FFFFFF' : '#666666'

   )
                      }
                    })
                  ]
                }),

                // Info icon container
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 5,
                    padding: 2,
                    width: 32,
                    height: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 5
                  },
                  onPress: () => {
                    this.infoPopupTypeBinding.set('timer');
                    this.showInfoPopupBinding.set(true);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('24898127093144614'))), // info_i
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: '#000000'
                      }
                    })
                  ]
                })
              ]
            }),

            // Difficulty settings row
            ui.View({
              style: {
                width: '100%',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              },
              children: [
                // Difficulty options container
                ui.View({
                  style: {
                    backgroundColor: '#191919',
                    borderRadius: 8,
                    padding: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start'
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('773002615685804'))), // sentiment_satisfied
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.difficulty === 'easy' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'
                        ),
                        marginRight: 2
                      }
                    }),
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1167500291866690'))), // sentiment_neutral
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.difficulty === 'medium' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'
                        ),
                        marginRight: 2
                      }
                    }),
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('789632350092375'))), // skull
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.difficulty === 'hard' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'
                        )
                      }
                    })
                  ]
                }),

                // Info icon container
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 5,
                    padding: 2,
                    width: 32,
                    height: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 5
                  },
                  onPress: () => {
                    this.infoPopupTypeBinding.set('difficulty');
                    this.showInfoPopupBinding.set(true);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('24898127093144614'))), // info_i
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: '#000000'
                      }
                    })
                  ]
                })
              ]
            }),

            // Game mode settings row
            ui.View({
              style: {
                width: '100%',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              },
              children: [
                // Game mode options container
                ui.View({
                  style: {
                    backgroundColor: '#191919',
                    borderRadius: 8,
                    padding: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start'
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3145261165647718'))), // autoplay
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.autoAdvance ? '#FFFFFF' : '#666666'
                        ),
                        marginRight: 2
                      }
                    }),
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1320579906276560'))), // bolt
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          !settings.muteDuringQuestions ? '#FFFFFF' : '#666666'
                        ),
                        marginRight: 2
                      }
                    }),
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3148012692041551'))), // all_inclusive
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: '#666666' // Always dimmed as per reference
                      }
                    })
                  ]
                }),

                // Info icon container
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 5,
                    padding: 2,
                    width: 32,
                    height: 32,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 5
                  },
                  onPress: () => {
                    this.infoPopupTypeBinding.set('gamemode');
                    this.showInfoPopupBinding.set(true);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('24898127093144614'))), // info_i
                      style: {
                        width: 28,
                        height: 28,
                        tintColor: '#000000'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        }),

        // Info pop-up
        ui.UINode.if(
          this.showInfoPopupBinding,
          this.renderInfoPopup()
        )
      ]
    });
  }

  private renderInfoPopup(): ui.UINode {
    return ui.View({
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      },
      children: [
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            padding: 8,
            minWidth: 140,
            maxWidth: 140,
            marginHorizontal: 4
          },
          children: [
            // Title
            ui.View({
              style: {
                paddingTop: 2,
                paddingBottom: 2,
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                    switch (type) {
                      case 'timer': return 'Timer';
                      case 'difficulty': return 'Difficulty';
                      case 'gamemode': return 'Modifiers';
                      default: return 'Game Settings';
                    }
                  }),
                  style: {
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#000000',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Content
            ui.View({
              style: {
                paddingTop: 8,
                alignItems: 'center'
              },
              children: [
                // Options container
                ui.View({
                  style: {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    alignSelf: 'center'
                  },
                  children: [
                    // Timer option
                    ui.View({
                      style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        marginBottom: 8
                      },
                  children: [
                    ui.Image({
                      source: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1929373007796069'))); // none icon
                          case 'difficulty': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('773002615685804'))); // sentiment_satisfied
                          case 'gamemode': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3145261165647718'))); // autoplay
                          default: return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1739710850290036')));
                        }
                      }),
                      style: {
                        width: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'gamemode' ? 18 : 24),
                        height: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'gamemode' ? 18 : 24),

                        tintColor: '#000000'
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return 'None';
                          case 'difficulty': return 'Easy';
                          case 'gamemode': return 'AutoPlay';
                          default: return 'Timer Settings';
                        }
                      }),
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#000000',
                        marginLeft: 6
                      }
                    })
                  ]
                }),

                    // Difficulty option
                    ui.View({
                      style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingLeft: 5,
                        paddingRight: 6,
                        paddingVertical: 4,
                        marginBottom: 8
                      },
                  children: [
                    ui.Image({
                      source: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1739710850290036'))); // timer
                          case 'difficulty': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1167500291866690'))); // sentiment_neutral
                          case 'gamemode': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1320579906276560'))); // bolt
                          default: return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('773002615685804')));
                        }
                      }),
                      style: {
                        width: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'gamemode' ? 20 : 24),
                        height: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'gamemode' ? 20 : 24),

                        tintColor: '#000000'
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return '30 Seconds';
                          case 'difficulty': return 'Medium';
                          case 'gamemode': return 'Questions Only';
                          default: return 'Difficulty Levels';
                        }
                      }),
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#000000',
                        marginLeft: 6
                      }
                    })
                  ]
                }),

                    // Game mode option
                    ui.View({
                      style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 6,
                        paddingVertical: 4
                      },
                  children: [
                    ui.Image({
                      source: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1471075670874559'))); // more_time
                          case 'difficulty': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('789632350092375'))); // skull
                          case 'gamemode': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3148012692041551'))); // all_inclusive
                          default: return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3145261165647718')));
                        }
                      }),
                      style: {
                        width: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'gamemode' ? 20 : 24),
                        height: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'gamemode' ? 20 : 24),
                        tintColor: '#000000'
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return '90 Seconds';
                          case 'difficulty': return 'Hard';
                          case 'gamemode': return 'Endless Mode';
                          default: return 'Game Modes';
                        }
                      }),
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#000000',
                        marginLeft: 6
                      }
                    })
                  ]
                })
                ]
              })
              ]
            }),

            // Got it button
            ui.View({
              style: {
                paddingTop: 8,
                alignItems: 'center'
              },
              children: [
                ui.Pressable({
                  style: {
                    backgroundColor: '#0fba09',
                    borderRadius: 4,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    minWidth: 120,
                    alignItems: 'center'
                  },
                  onPress: () => this.showInfoPopupBinding.set(false),
                  children: [
                    ui.Text({
                      text: 'Got it',
                      style: {
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#FFFFFF',
                        textAlign: 'center'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderTriviaGameWithTwoOptions(): ui.UINode {
    return ui.View({
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1358485312536960'))),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),
        this.renderTwoOptionsPage()
      ]
    });
  }

  private renderPreGameScreen(): ui.UINode {
    return ui.View({
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      },
      children: [
        // Full-screen background image
        ui.Image({
          source: ui.Binding.derive([this.isReadyBinding], (isReady) => 
            ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(isReady ? '797739146176423' : '791326273594709')))
          ),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Header anchored to top - now fills full viewport height
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0, // Changed from 58 to 0 to fill viewport height
            flexDirection: 'column',
            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
            borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0033' : 'transparent'), // RED-2 - header container (variation)
            backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(0, 255, 204, 0.5)' : 'transparent') // Aqua fill (complementary to red)
          },
          children: [
            // Light/Dark mode container
            ui.View({
              style: {
                position: 'absolute',
                top: 8,
                left: 8,
                borderRadius: 8,
                padding: 4,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                borderColor: this.showOutlinesBinding.derive(show => show ? '#0000CC' : 'transparent'), // BLUE-4 - within red
                backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(255, 204, 0, 0.5)' : '#191919') // Gold fill (complementary to blue)
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: 'rgba(255, 255, 255, 0.35)'
                  }
                })
              ]
            }),

            // Settings icon container
            ui.View({
              style: {
                position: 'absolute',
                top: 8,
                right: 8,
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                borderColor: this.showOutlinesBinding.derive(show => show ? '#CC0000' : 'transparent'), // BLUE-5 - within red
                backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(0, 255, 51, 0.5)' : '#191919') // Chartreuse fill (complementary to blue)
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1247632857052841'))),
                  style: {
                    width: 26,
                    height: 26,
                    tintColor: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),

        // Crown container - separate from buttons
        ui.UINode.if(
          this.isHostBinding.derive(isHost => isHost),
          ui.View({
            style: {
              position: 'absolute',
              bottom: 230, // Moved up 80 pixels from 200
              left: 0,
              right: 0,
              justifyContent: 'center',
              alignItems: 'center',
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 8,
              paddingBottom: 8,
              borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
              borderColor: this.showOutlinesBinding.derive(show => show ? '#66FF00' : 'transparent'), // GREEN-4 - crown container (variation)
              backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(153, 0, 255, 0.5)' : 'transparent'), // Violet fill (complementary to green)
              zIndex: 11 // Higher than buttons container
            },
            children: [
              ui.Image({
                source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1325134306066406'))),
                style: {
                  width: 90,
                  height: 81,
                  tintColor: '#F7CE23'
                }
              })
            ]
          })
        ),

        // Buttons container - now only contains text and buttons
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'column',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8,
            paddingBottom: 8,
            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
            borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF33' : 'transparent'), // GREEN-2 - within red (variation)
            backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(255, 0, 128, 0.5)' : 'transparent'), // Pink fill (complementary to green)
            zIndex: 10 // Ensure buttons appear on top of the red container
          },
          children: [
            // "You are the host!" text
            ui.UINode.if(
              this.isHostBinding.derive(isHost => isHost),
              ui.View({
                style: {
                  width: '100%',
                  height: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                  borderColor: this.showOutlinesBinding.derive(show => show ? '#0000FF' : 'transparent'), // BLUE - within green
                  backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(255, 255, 0, 0.5)' : 'transparent') // Yellow fill (complementary to blue)
                },
                children: [
                  ui.Text({
                    text: 'You are the host!',
                    style: {
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ),
            // Start Game button (only for hosts)
            ui.UINode.if(
              this.isHostBinding.derive(isHost => isHost),
              ui.Pressable({
                style: {
                  width: '100%',
                  height: 42,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                  borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent'), // PURPLE - within blue
                  backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(0, 255, 128, 0.5)' : '#FFFFFF') // Spring green fill (complementary to purple)
                },
                onPress: () => this.handleStartGame(),
                children: [
                  ui.Text({
                    text: 'Start Game',
                    style: {
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#111111',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ),
            ui.Pressable({
              style: {
                width: '100%',
                height: 42,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                borderColor: this.showOutlinesBinding.derive(show => show ? '#8000FF' : 'transparent'), // PURPLE-2 - within blue (variation)
                backgroundColor: ui.Binding.derive([this.isHostBinding, this.isReadyBinding, this.buttonPressedBinding], (isHost, isReady, isPressed) => 
                  isHost ? '#FFFFFF' : (isReady ? '#cb002f' : '#FFFFFF')
                )
              },
              onPress: () => {
                this.buttonPressedBinding.set(true);
              },
              onRelease: () => {
                this.buttonPressedBinding.set(false);
                this.handleReadyButtonPress();
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.isHostBinding, this.isReadyBinding], (isHost, isReady) => 
                    isHost ? 'Game Settings' : (isReady ? 'Not Ready' : 'Ready Up')
                  ),
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: ui.Binding.derive([this.isHostBinding, this.isReadyBinding], (isHost, isReady) => 
                      isHost ? '#111111' : (isReady ? '#FFFFFF' : '#111111')
                    ),
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderWaitingScreen(): ui.UINode {
    return ui.View({
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      },
      children: [
        // Full-screen background image
        ui.Image({
          source: ui.Binding.derive([this.isReadyBinding], (isReady) => 
            ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(isReady ? '797739146176423' : '1358485312536960')))
          ),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Header anchored to top - now fills full viewport height
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0, // Changed from 58 to 0 to fill viewport height
            flexDirection: 'column',
            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
            borderColor: this.showOutlinesBinding.derive(show => show ? '#FF0033' : 'transparent'), // RED-2 - header container (variation)
            backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(0, 255, 204, 0.5)' : 'transparent') // Aqua fill (complementary to red)
          },
          children: [
            // Light/Dark mode container
            ui.View({
              style: {
                position: 'absolute',
                top: 8,
                left: 8,
                borderRadius: 8,
                padding: 4,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                borderColor: this.showOutlinesBinding.derive(show => show ? '#0000CC' : 'transparent'), // BLUE-4 - within red
                backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(255, 204, 0, 0.5)' : '#191919') // Gold fill (complementary to blue)
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: 'rgba(255, 255, 255, 0.35)'
                  }
                })
              ]
            }),

            // Settings icon container
            ui.View({
              style: {
                position: 'absolute',
                top: 8,
                right: 8,
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                borderColor: this.showOutlinesBinding.derive(show => show ? '#CC0000' : 'transparent'), // BLUE-5 - within red
                backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(0, 255, 51, 0.5)' : '#191919') // Chartreuse fill (complementary to blue)
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1247632857052841'))),
                  style: {
                    width: 26,
                    height: 26,
                    tintColor: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),

        // Buttons container - participant version
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'column',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8,
            paddingBottom: 8,
            borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
            borderColor: this.showOutlinesBinding.derive(show => show ? '#00FF33' : 'transparent'), // GREEN-2 - within red (variation)
            backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(255, 0, 128, 0.5)' : 'transparent'), // Pink fill (complementary to green)
            zIndex: 10 // Ensure buttons appear on top of the red container
          },
          children: [
            // Start Game button (only for hosts)
            ui.UINode.if(
              this.isHostBinding.derive(isHost => isHost),
              ui.Pressable({
                style: {
                  width: '100%',
                  height: 42,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                  borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                  borderColor: this.showOutlinesBinding.derive(show => show ? '#800080' : 'transparent'), // PURPLE - within blue
                  backgroundColor: this.showOutlinesBinding.derive(show => show ? 'rgba(0, 255, 128, 0.5)' : '#FFFFFF') // Spring green fill (complementary to purple)
                },
                onPress: () => this.handleStartGame(),
                children: [
                  ui.Text({
                    text: 'Start Game',
                    style: {
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#111111',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ),
            // Game Settings button (for both hosts and participants)
            ui.Pressable({
              style: {
                width: '100%',
                height: 42,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: this.showOutlinesBinding.derive(show => show ? 2 : 0),
                borderColor: this.showOutlinesBinding.derive(show => show ? '#8000FF' : 'transparent'), // PURPLE-2 - within blue (variation)
                backgroundColor: ui.Binding.derive([this.isHostBinding, this.isReadyBinding, this.buttonPressedBinding], (isHost, isReady, isPressed) => 
                  isHost ? '#FFFFFF' : (isReady ? '#cb002f' : '#FFFFFF')
                )
              },
              onPress: () => this.handleGameSettingsOrReadyButton(),
              onRelease: () => this.handleGameSettingsOrReadyButtonRelease(),
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.isHostBinding, this.isReadyBinding], (isHost, isReady) => 
                    isHost ? 'Game Settings' : (isReady ? 'Not Ready' : 'Ready Up')
                  ),
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: ui.Binding.derive([this.isHostBinding, this.isReadyBinding], (isHost, isReady) => 
                      isHost ? '#111111' : (isReady ? '#FFFFFF' : '#111111')
                    ),
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderStatusBar(): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 12,
        marginBottom: 13,
        borderWidth: 2,
        borderColor: '#FFA500' // Orange - footer container
      },
      children: [
        ui.Text({
          text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding, this.showLeaderboardBinding], (index, settings, showLeaderboard) => {
            // Only update the question number when not showing leaderboard to prevent footer updates during transition
            if (!showLeaderboard) {
              this.stableQuestionIndex = index;
            }
            return `Question ${this.stableQuestionIndex + 1} of ${settings.numberOfQuestions}`;
          }),
          style: {
            fontSize: 12,
            color: '#6B7280',
            fontWeight: '600'
          }
        }),
        ui.Text({
          text: ui.Binding.derive([this.scoreBinding], (score) => `Score: ${score}`),
          style: {
            fontSize: 12,
            fontWeight: '600',
            color: '#6B7280'
          }
        })
      ]
    });
  }

  private createAnswerButton(answerIndex: number): ui.UINode {
    const shape = answerShapes[answerIndex];

    return ui.Pressable({
      style: {
        flex: 1,
        backgroundColor: ui.Binding.derive([
          this.showResultBinding,
          this.selectedAnswerBinding,
          this.currentQuestionBinding
        ], (showResult, selectedAnswer, question) => {
          if (showResult && question) {
            const correctIndex = question.answers.findIndex((answer: any) => answer.correct);

            let mappedCorrectIndex = correctIndex;
            let mappedSelectedAnswer = selectedAnswer;
            if (question.answers.length === 2) {
              if (correctIndex === 0) mappedCorrectIndex = 2;
              else if (correctIndex === 1) mappedCorrectIndex = 3;

              if (selectedAnswer === 0) mappedSelectedAnswer = 2;
              else if (selectedAnswer === 1) mappedSelectedAnswer = 3;
            }

            const isCorrect = answerIndex === mappedCorrectIndex;
            const isSelected = answerIndex === mappedSelectedAnswer;

            if (isCorrect) return '#22C55E';
            if (isSelected && !isCorrect) return '#EF4444';
            return '#9CA3AF';
          }
          return shape.color;
        }),
        borderRadius: 12,
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 140,
        padding: 6,
        opacity: ui.Binding.derive([this.currentQuestionBinding], (question) => {
          if (!question || !question.answers) {
            return answerIndex < 4 ? 1 : 0;
          }

          const answerCount = question.answers.length;
          if (answerCount === 2) {
            return (answerIndex === 2 || answerIndex === 3) ? 1 : 0;
          } else {
            return answerIndex < answerCount ? 1 : 0;
          }
        })
      },
      onPress: () => this.handleAnswerSelect(answerIndex),
      children: [
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(shape.iconId))),
          style: {
            width: 50,
            height: 50,
            tintColor: '#FFFFFF',
            ...(shape.rotation ? { transform: [{ rotate: `${shape.rotation}deg` }] } : {})
          }
        })
      ]
    });
  }

  private renderTwoOptionsPage(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Header with light/dark mode toggle and settings icon
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8
          },
          children: [
            // Light/Dark mode container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 4,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: 'rgba(255, 255, 255, 0.35)'
                  }
                })
              ]
            }),

            // Points display container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 7,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.scoreBinding], (score) => `${score} points`),
                  style: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Settings icon container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1997295517705951'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),

        // Answer buttons grid - positioned between header and status bar
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 58, // Leave space for the status bar
            flexDirection: 'column',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 48, // 8px spacing from header
            paddingBottom: 8
          },
          children: [
            // Top row
            ui.View({
              style: {
                flexDirection: 'row',
                flex: 1,
                marginBottom: 4
              },
              children: [
                // Full-width red circle button
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#d70f33',
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => this.handleAnswerSelect(0),
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1247573280476332'))), // circle
                      style: {
                        width: 55,
                        height: 54,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                })
              ]
            }),

            // Bottom row
            ui.View({
              style: {
                flexDirection: 'row',
                flex: 1,
                marginTop: 4
              },
              children: [
                // Full-width green square button
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#2db22c',
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => this.handleAnswerSelect(1),
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1317550153280256'))), // square
                      style: {
                        width: 54,
                        height: 55,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        }),

        // Status bar - using same layout as Confirm Settings button
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 58,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 0,
            paddingBottom: 8
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {}, // No action for status bar
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding, this.showLeaderboardBinding], (index, settings, showLeaderboard) => {
                    // Only update the question number when not showing leaderboard to prevent footer updates during transition
                    if (!showLeaderboard) {
                      this.stableQuestionIndex = index;
                    }
                    return `Question ${this.stableQuestionIndex + 1} of ${settings.numberOfQuestions}`;
                  }),
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111111',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderParticipantCorrectResults(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('793736319770298'))),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Top navigation bar with 4A-style layout
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8
          },
          children: [
            // Light/Dark mode toggle
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 4,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))), // light_mode
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))), // dark_mode
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: 'rgba(255, 255, 255, 0.35)'
                  }
                })
              ]
            }),

            // Points display container (like 4A page)
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 7,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.scoreBinding], (score) => `${score} points`),
                  style: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Settings icon container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1997295517705951'))), // settings icon
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),

        // Checkmark container - moved up from center
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 136,
            height: 136,
            marginTop: -90, // Moved up from -68 to -120 (52 pixels higher)
            marginLeft: -68, // Half of width to center horizontally
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            // Checkmark icon (no green circle background)
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2019383778812059'))), // Using specified check icon
              style: {
                width: 120,
                height: 120,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Points display underneath checkmark
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            marginTop: 32, // Moved up significantly from 60 to 8 (52 pixels higher to match checkmark movement)
            height: 50,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: '+1200 points',
              style: {
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center'
                // Removed drop shadow properties
              }
            })
          ]
        }),

        // Bottom status bar (like 4A page with question info)
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 58,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 0,
            paddingBottom: 8
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {}, // No action for status bar
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding], (index, settings) => {
                    return `Question ${index + 1} of ${settings.numberOfQuestions}`;
                  }),
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111111',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderParticipantWrongResults(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('648661411200941'))),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Top navigation bar with 4A-style layout
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8
          },
          children: [
            // Light/Dark mode toggle
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 4,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))), // light_mode
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))), // dark_mode
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: 'rgba(255, 255, 255, 0.35)'
                  }
                })
              ]
            }),

            // Points display container (like 4A page)
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 7,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.scoreBinding], (score) => `${score} points`),
                  style: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Settings icon container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1997295517705951'))), // settings icon
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),

        // Close icon container - moved up from center
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 136,
            height: 136,
            marginTop: -90, // Moved up from -68 to -120 (52 pixels higher)
            marginLeft: -68, // Half of width to center horizontally
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            // Close icon
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('24587675990884692'))), // close icon
              style: {
                width: 120,
                height: 120,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Message display underneath close icon
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            marginTop: 32, // Moved up significantly from 60 to 8 (52 pixels higher to match checkmark movement)
            height: 80, // Increased height to accommodate two lines
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40 // Match close icon width (120px / 2 = 60px on each side)
          },
          children: [
            ui.Text({
              text: 'You need to lock in twin',
              style: {
                fontSize: 20, // Reduced from 24 to 20
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center'
                // Removed drop shadow properties
              }
            })
          ]
        }),

        // Bottom status bar (like 4A page with question info)
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 58,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 0,
            paddingBottom: 8
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {}, // No action for status bar
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding], (index, settings) => {
                    return `Question ${index + 1} of ${settings.numberOfQuestions}`;
                  }),
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111111',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderHostCorrectResults(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('793736319770298'))),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Top navigation bar with 4A-style layout
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8
          },
          children: [
            // Light/Dark mode toggle
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 4,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))), // light_mode
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))), // dark_mode
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: 'rgba(255, 255, 255, 0.35)'
                  }
                })
              ]
            }),

            // Points display container (like 4A page)
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 7,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.scoreBinding], (score) => `${score} points`),
                  style: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Settings icon container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1997295517705951'))), // settings icon
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),

        // Checkmark container - moved up from center
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 136,
            height: 136,
            marginTop: -90, // Moved up from -68 to -120 (52 pixels higher)
            marginLeft: -68, // Half of width to center horizontally
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            // Checkmark icon (no green circle background)
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2019383778812059'))), // Using specified check icon
              style: {
                width: 120,
                height: 120,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Points display underneath checkmark
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            marginTop: 16, // Moved up from 32 to 16 (16 pixels higher)
            height: 50,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: '+1200 points',
              style: {
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center'
                // Removed drop shadow properties
              }
            })
          ]
        }),

        // Next Question button
        ui.View({
          style: {
            position: 'absolute',
            bottom: 80, // Position moved down from 120 to 80 (closer to bottom)
            left: 16,
            right: 16,
            height: 42,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 8
              },
              onPress: () => {
                // Handle next question logic
                console.log('✅ Next Question pressed');
              },
              children: [
                ui.Text({
                  text: 'Next Question',
                  style: {
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#000000',
                    textAlign: 'center',
                    flex: 1
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1806442143313699'))), // arrow_forward
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#000000'
                  }
                })
              ]
            })
          ]
        }),

        // Bottom status bar (like 4A page with question info)
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 58,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 0,
            paddingBottom: 8
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {}, // No action for status bar
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding], (index, settings) => {
                    return `Question ${index + 1} of ${settings.numberOfQuestions}`;
                  }),
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111111',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderHostWrongResults(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('648661411200941'))),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Top navigation bar with 4A-style layout
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8
          },
          children: [
            // Light/Dark mode toggle
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 4,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))), // light_mode
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))), // dark_mode
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: 'rgba(255, 255, 255, 0.35)'
                  }
                })
              ]
            }),

            // Points display container (like 4A page)
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 7,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.scoreBinding], (score) => `${score} points`),
                  style: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Settings icon container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1997295517705951'))), // settings icon
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),

        // Close icon container - moved up from center
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 136,
            height: 136,
            marginTop: -90, // Moved up from -68 to -120 (52 pixels higher)
            marginLeft: -68, // Half of width to center horizontally
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            // Close icon
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('24587675990884692'))), // close icon
              style: {
                width: 120,
                height: 120,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // NOTE: Textbox removed from host wrong screen per user request - no message display needed

        // Bottom status bar (like 4A page with question info)
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 58,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 0,
            paddingBottom: 8
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {}, // No action for status bar
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding], (index, settings) => {
                    return `Question ${index + 1} of ${settings.numberOfQuestions}`;
                  }),
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111111',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Next Question button
        ui.View({
          style: {
            position: 'absolute',
            bottom: 80, // Position moved down from 120 to 80 (closer to bottom)
            left: 16,
            right: 16,
            height: 42,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 8
              },
              onPress: () => {
                // Handle next question logic
                console.log('✅ Next Question pressed');
              },
              children: [
                ui.Text({
                  text: 'Next Question',
                  style: {
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#000000',
                    textAlign: 'center',
                    flex: 1
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1806442143313699'))), // arrow_forward
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#000000'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderFourOptionsPage(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Header with light/dark mode toggle and settings icon
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8
          },
          children: [
            // Light/Dark mode container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 4,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('718380744580513'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                }),
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('828932029475123'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: 'rgba(255, 255, 255, 0.35)'
                  }
                })
              ]
            }),

            // Points display container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 7,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.scoreBinding], (score) => `${score} points`),
                  style: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Settings icon container
            ui.View({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1997295517705951'))),
                  style: {
                    width: 24,
                    height: 24,
                    tintColor: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),

        // Answer buttons grid - positioned between header and status bar
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 58, // Leave space for the status bar
            flexDirection: 'column',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 48, // 8px spacing from header
            paddingBottom: 8
          },
          children: [
            // Top row
            ui.View({
              style: {
                flexDirection: 'row',
                flex: 1,
                marginBottom: 4
              },
              children: [
                // Top-left button (Circle)
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#d70f33',
                    borderRadius: 16,
                    marginRight: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => this.handleAnswerSelect(0),
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1247573280476332'))), // circle
                      style: {
                        width: 55,
                        height: 54,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Top-right button (Square)
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#2db22c',
                    borderRadius: 16,
                    marginLeft: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => this.handleAnswerSelect(1),
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1317550153280256'))), // square
                      style: {
                        width: 54,
                        height: 55,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                })
              ]
            }),

            // Bottom row
            ui.View({
              style: {
                flexDirection: 'row',
                flex: 1,
                marginTop: 4
              },
              children: [
                // Bottom-left button (Triangle)
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#f7ce23',
                    borderRadius: 16,
                    marginRight: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => this.handleAnswerSelect(2),
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2085541485520283'))), // triangle
                      style: {
                        width: 55,
                        height: 54,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Bottom-right button (Blue)
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#2773ea',
                    borderRadius: 16,
                    marginLeft: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => this.handleAnswerSelect(3),
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2403112933423824'))), // star
                      style: {
                        width: 50,
                        height: 50,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        }),

        // Status bar - using same layout as Confirm Settings button
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 58,
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 0,
            paddingBottom: 8
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {}, // No action for status bar
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding, this.showLeaderboardBinding], (index, settings, showLeaderboard) => {
                    // Only update the question number when not showing leaderboard to prevent footer updates during transition
                    if (!showLeaderboard) {
                      this.stableQuestionIndex = index;
                    }
                    return `Question ${this.stableQuestionIndex + 1} of ${settings.numberOfQuestions}`;
                  }),
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#111111',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }
}

// Register the component for Horizon Worlds
ui.UIComponent.register(TriviaPhone);
