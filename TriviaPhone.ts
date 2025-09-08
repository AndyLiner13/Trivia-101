import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import * as camera from 'horizon/camera';
import { Social, AvatarImageType } from 'horizon/social';

// Network events for trivia
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');
const triviaTwoOptionsEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number, totalQuestions: number }>('triviaTwoOptions');
const triviaFourOptionsEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number, totalQuestions: number }>('triviaFourOptions');
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

  // Player assignment for ownership tracking
  private assignedPlayer: hz.Player | null = null;

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
  private gameEnded = false; // Track game ended state
  private isCorrectAnswerBinding = new ui.Binding(false);
  private correctAnswerIndexBinding = new ui.Binding<number | null>(null);
  private showLeaderboardBinding = new ui.Binding(false);
  private answerSubmittedBinding = new ui.Binding(false);

  // Leaderboard data for results screen
  private leaderboardDataBinding = new ui.Binding<Array<{name: string, score: number, playerId: string}>>([]);

  // Current question binding to prevent flashing
  private currentQuestionBinding = new ui.Binding<any>(null);

  // Layout type binding to ensure immediate switching between layouts
  private layoutTypeBinding = new ui.Binding<'two-options' | 'four-options'>('four-options');

  // Explicit screen type binding for routing from TriviaGame
  private screenTypeBinding = new ui.Binding<'waiting' | 'two-options' | 'four-options' | 'results'>('waiting');

  // Non-reactive screen type for immediate render decisions
  private currentScreenType: 'waiting' | 'two-options' | 'four-options' | 'results' = 'waiting';
  private lastQuestionType: 'two-options' | 'four-options' = 'four-options';

  // Game settings bindings
  private gameSettingsBinding = new ui.Binding(this.gameSettings);
  private currentViewModeBinding = new ui.Binding<'pre-game' | 'game-settings'>('pre-game');

  // Host status binding
  private isHostBinding = new ui.Binding(false);
  private currentHostStatus = false;

  constructor() {
    super();
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
    if (this.assignedPlayer) {
      // Use local score since we can't read from native leaderboard
      const currentScore = this.score;
      this.scoreBinding.set(currentScore);
    }
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
    if (!(globalThis as any).triviaPhoneInstances) {
      (globalThis as any).triviaPhoneInstances = [];
    }
    (globalThis as any).triviaPhoneInstances.push(this);
    
    this.setupNetworkEvents();
    this.setupKeyboardInput();

    // Store the original position when the component starts
    this.originalPosition = this.entity.position.get().clone();

    // Initialize host status binding
    this.currentHostStatus = this.isHost();
    this.isHostBinding.set(this.currentHostStatus);

    // Update score display
    this.waitForPersistentStorageAndUpdateScore();
  }

  public initializeForPlayer(player: hz.Player): void {
    this.assignedPlayer = player;
    this.isInitialized = true;
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
    if ((globalThis as any).triviaPhoneInstances) {
      const index = (globalThis as any).triviaPhoneInstances.indexOf(this);
      if (index > -1) {
        (globalThis as any).triviaPhoneInstances.splice(index, 1);
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

      // If phone is not assigned to anyone, assign it to this player
      if (!this.assignedPlayer) {
        this.initializeForPlayer(player);
      } else if (this.assignedPlayer.id !== player.id) {
        // If phone is assigned to someone else, reassign it to this player
        this.assignedPlayer = player;
      }

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
    if (this.assignedPlayer) {
      // Hide the TriviaPhone immediately when external unfocus is detected
      this.hideTriviaPhone();
    }
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
    console.log("✅ TriviaPhone: Transitioning to RESULTS screen");
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
    
    // Update leaderboard binding - but don't show leaderboard if game has ended
    this.showLeaderboardBinding.set(eventData.showLeaderboard && !this.gameEnded || false);
    
    // Log when leaderboard is shown
    if (eventData.showLeaderboard && !this.gameEnded) {
      console.log("✅ TriviaPhone: Showing LEADERBOARD screen");
      
      // Check if end game button should be visible
      const isLastQuestion = (this.currentQuestionIndex + 1) >= this.gameSettings.numberOfQuestions;
      const isHost = this.isHost();
      if (isHost && isLastQuestion) {
        console.log("✅ TriviaPhone: END GAME button is now visible (last question + host)");
      }
    }

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
    timeLimit: number,
    totalQuestions: number 
  }): void {
    console.log("✅ TriviaPhone: Transitioning to TWO-OPTIONS screen");
    
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
    
    // Store question index and update the current question index binding
    this.currentQuestionIndex = eventData.questionIndex;
    this.currentQuestionIndexBinding.set(eventData.questionIndex);
    
    // Update game settings with actual total questions from the game
    this.gameSettings.numberOfQuestions = eventData.totalQuestions;
    this.gameSettingsBinding.set({ ...this.gameSettings });
    
  }

  public onTriviaFourOptions(eventData: { 
    question: any, 
    questionIndex: number, 
    timeLimit: number,
    totalQuestions: number 
  }): void {
    console.log("✅ TriviaPhone: Transitioning to FOUR-OPTIONS screen");
    
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
    
    // Store question index and update the current question index binding
    this.currentQuestionIndex = eventData.questionIndex;
    this.currentQuestionIndexBinding.set(eventData.questionIndex);
    
    // Update game settings with actual total questions from the game
    this.gameSettings.numberOfQuestions = eventData.totalQuestions;
    this.gameSettingsBinding.set({ ...this.gameSettings });
    
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
              timeLimit: event.timeLimit || this.gameSettings.timeLimit,
              totalQuestions: this.gameSettings.numberOfQuestions // Use current settings as fallback
            });
          } else {
            this.onTriviaFourOptions({
              question: event.currentQuestion,
              questionIndex: event.questionIndex || 0,
              timeLimit: event.timeLimit || this.gameSettings.timeLimit,
              totalQuestions: this.gameSettings.numberOfQuestions // Use current settings as fallback
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
    console.log("✅ TriviaPhone: Game ended - staying on current screen");

    // Mark game as ended but don't change screens - just stay on the current feedback screen
    this.gameStarted = false;
    this.gameStartedBinding.set(false);
    this.gameEndedBinding.set(true); // Mark game as ended
    this.gameEnded = true; // Set the flag
    
    // Don't change the current screen - let it stay on the feedback screen
    // This allows players to see their final result (right/wrong/time's up)
    
    // Hide leaderboard since game is over
    this.showLeaderboardBinding.set(false);
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
    console.log("✅ TriviaPhone: END GAME button pressed by host");
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
      playerId: this.assignedPlayer?.id.toString() || 'local',
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

  render(): ui.UINode {
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
        // Phone container
        ui.View({
          style: {
            width: 200,
            height: 400,
            backgroundColor: '#000000', // Black phone frame
            borderRadius: 20,
            padding: 6,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            // Phone screen content area
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: ui.Binding.derive([this.screenTypeBinding, this.currentViewModeBinding, this.gameStartedBinding], (screenType, mode, started) => {
                  if (mode === 'game-settings') return '#6366F1';
                  if (started && (screenType === 'two-options' || screenType === 'four-options')) return '#6366F1';
                  if (started && screenType === 'results') return '#FFFFFF'; // Will be overridden by feedback screen
                  return '#FFFFFF';
                }),
                borderRadius: 14,
                overflow: 'hidden'
              },
              children: [
                // Pre-game screen - shows when game hasn't started
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.gameStartedBinding, this.gameEndedBinding, this.showResultBinding], (mode, started, gameEnded, showResult) => 
                    mode === 'pre-game' && !started && (!gameEnded || !showResult)
                  ),
                  this.renderPreGameScreen()
                ),

                // Two-option trivia screen - shows only when event received and game is started
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding, this.showResultBinding], (mode, screenType, started, showResult) => 
                    mode === 'pre-game' && started && screenType === 'two-options' && !showResult
                  ),
                  ui.View({
                    style: {
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#6366F1',
                      flexDirection: 'column'
                    },
                    children: [
                      this.renderTwoOptionsPage(),
                      this.renderStatusBar()
                    ]
                  })
                ),
                
                // Four-option trivia screen - shows only when event received and game is started
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding, this.showResultBinding], (mode, screenType, started, showResult) => 
                    mode === 'pre-game' && started && screenType === 'four-options' && !showResult
                  ),
                  ui.View({
                    style: {
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#6366F1',
                      flexDirection: 'column'
                    },
                    children: [
                      this.renderFourOptionsPage(),
                      this.renderStatusBar()
                    ]
                  })
                ),

                // Feedback screen - shows right/wrong when results are displayed
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.gameStartedBinding, this.showResultBinding, this.gameEndedBinding], (mode, started, showResult, gameEnded) => 
                    mode === 'pre-game' && (started || gameEnded) && showResult
                  ),
                  ui.View({
                    style: {
                      width: '100%',
                      height: '100%',
                      backgroundColor: ui.Binding.derive([
                        this.isCorrectAnswerBinding,
                        this.selectedAnswerBinding
                      ], (isCorrect, selectedAnswer) => {
                        if (selectedAnswer === null) return '#F59E0B'; // Orange for time's up
                        return isCorrect ? '#22C55E' : '#EF4444'; // Green for correct, red for wrong
                      }),
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 12
                    },
                    children: [
                      ui.Text({
                        text: ui.Binding.derive([
                          this.isCorrectAnswerBinding,
                          this.selectedAnswerBinding
                        ], (isCorrect, selectedAnswer) => {
                          if (isCorrect) return '✅';
                          if (selectedAnswer === null) return '⏰'; // Clock emoji for time's up
                          return '❌';
                        }),
                        style: {
                          fontSize: 80,
                          textAlign: 'center',
                          marginBottom: 16
                        }
                      }),
                      ui.Text({
                        text: ui.Binding.derive([
                          this.isCorrectAnswerBinding,
                          this.selectedAnswerBinding
                        ], (isCorrect, selectedAnswer) => {
                          if (isCorrect) return 'Correct!';
                          if (selectedAnswer === null) return 'Time\'s Up!';
                          return 'Wrong!';
                        }),
                        style: {
                          fontSize: 32,
                          fontWeight: '700',
                          color: '#FFFFFF',
                          textAlign: 'center',
                          marginBottom: 12
                        }
                      }),
                      ui.Text({
                        text: ui.Binding.derive([], () => {
                          return this.currentQuestion ? this.currentQuestion.question : '';
                        }),
                        numberOfLines: 2,
                        style: {
                          fontSize: 18,
                          color: '#FFFFFF',
                          textAlign: 'center',
                          marginBottom: 12,
                          opacity: 0.9,
                          lineHeight: 24
                        }
                      }),
                      ui.Pressable({
                        style: {
                          backgroundColor: '#FFFFFF',
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          marginTop: 16,
                          alignSelf: 'center',
                          opacity: ui.Binding.derive([this.showLeaderboardBinding, this.gameStartedBinding, this.gameEndedBinding, this.currentQuestionIndexBinding, this.gameSettingsBinding, this.isHostBinding],
                            (showLeaderboard, gameStarted, gameEnded, currentIndex, settings, isHost) =>
                              showLeaderboard && gameStarted && !gameEnded && isHost && (currentIndex + 1) < settings.numberOfQuestions ? 1 : 0
                          )
                        },
                        onPress: () => this.nextQuestion(),
                        children: [
                          ui.Text({
                            text: '➡️ Next Question',
                            style: {
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#6366F1',
                              textAlign: 'center'
                            }
                          })
                        ]
                      }),
                      ui.Pressable({
                        style: {
                          backgroundColor: '#FF6B35',
                          borderRadius: 8,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          marginTop: 16,
                          alignSelf: 'center',
                          opacity: ui.Binding.derive([this.showLeaderboardBinding, this.gameStartedBinding, this.gameEndedBinding, this.currentQuestionIndexBinding, this.gameSettingsBinding, this.isHostBinding],
                            (showLeaderboard, gameStarted, gameEnded, currentIndex, settings, isHost) =>
                              (showLeaderboard && gameStarted && !gameEnded && isHost && (currentIndex + 1) >= settings.numberOfQuestions) ||
                              (gameEnded && isHost) ? 1 : 0
                          )
                        },
                        onPress: () => this.endGame(),
                        children: [
                          ui.Text({
                            text: '🔚 End Game',
                            style: {
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#FFFFFF',
                              textAlign: 'center'
                            }
                          })
                        ]
                      }),
                      // Footer with question progress and score
                      ui.View({
                        style: {
                          position: 'absolute',
                          bottom: 13,
                          left: 12,
                          right: 12,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        },
                        children: [
                          ui.Text({
                            text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding], (index, settings) => 
                              `Question ${index + 1}/${settings.numberOfQuestions}`
                            ),
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
                              color: '#6B7280',
                              fontWeight: '600'
                            }
                          })
                        ]
                      })
                    ]
                  })
                ),
                
                // Waiting screen - default state during game
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding], (mode, screenType, started) => 
                    mode === 'pre-game' && started && (screenType === 'waiting' || !screenType)
                  ),
                  this.renderWaitingScreen()
                ),
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding], (mode) => mode === 'game-settings'),
                  this.renderGameSettings()
                )
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
        backgroundColor: '#6366F1',
        flexDirection: 'column'
      },
      children: [
        // Header with lock/unlock
        ui.View({
          style: {
            padding: 16,
            alignItems: 'center'
          },
          children: [
            ui.Pressable({
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center'
              },
              onPress: () => this.toggleSettingsLock(),
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                    settings.isLocked ? '🔒' : '🔓'
                  ),
                  style: {
                    fontSize: 16,
                    marginRight: 8
                  }
                }),
                ui.Text({
                  text: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                    settings.isLocked ? 'Settings Locked' : 'Settings Unlocked'
                  ),
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#000000'
                  }
                })
              ]
            })
          ]
        }),

        // Scrollable settings content
        ui.ScrollView({
          style: {
            flex: 1,
            padding: 16,
            paddingBottom: 80,
            opacity: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
              settings.isLocked ? 0.6 : 1
            )
          },
          children: [
            // Number of Questions
            ui.View({
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              },
              children: [
                ui.Text({
                  text: 'Number of Questions',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#000000',
                    textAlign: 'center',
                    marginBottom: 8
                  }
                }),
                ui.View({
                  style: {
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  },
                  children: [1, 5, 10, 15, 20].map(count =>
                    ui.Pressable({
                      style: {
                        flex: 1,
                        backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.numberOfQuestions === count ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)'
                        ),
                        borderRadius: 8,
                        paddingVertical: 12,
                        marginHorizontal: 4,
                        alignItems: 'center'
                      },
                      onPress: () => this.updateGameSetting('numberOfQuestions', count),
                      children: [
                        ui.Text({
                          text: count.toString(),
                          style: {
                            fontSize: 12,
                            fontWeight: '600',
                            color: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.numberOfQuestions === count ? '#6366F1' : '#FFFFFF'
                            )
                          }
                        })
                      ]
                    })
                  )
                })
              ]
            }),

            // Category
            ui.View({
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              },
              children: [
                ui.Text({
                  text: 'Category',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#000000',
                    textAlign: 'center',
                    marginBottom: 8
                  }
                }),
                ui.View({
                  style: {
                    flexDirection: 'column'
                  },
                  children: ['General', 'Italian Brainrot Quiz'].map(category =>
                    ui.Pressable({
                      style: {
                        backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.category === category ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)'
                        ),
                        borderRadius: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        marginBottom: 8,
                        alignItems: 'center'
                      },
                      onPress: () => this.updateGameSetting('category', category),
                      children: [
                        ui.Text({
                          text: category,
                          style: {
                            fontSize: 12,
                            fontWeight: '600',
                            color: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.category === category ? '#6366F1' : '#FFFFFF'
                            ),
                            textAlign: 'center'
                          }
                        })
                      ]
                    })
                  )
                })
              ]
            }),

            // Difficulty
            ui.View({
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              },
              children: [
                ui.Text({
                  text: 'Difficulty',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#000000',
                    textAlign: 'center',
                    marginBottom: 8
                  }
                }),
                ui.View({
                  style: {
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  },
                  children: ['easy', 'medium', 'hard'].map(difficulty =>
                    ui.Pressable({
                      style: {
                        flex: 1,
                        backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.difficulty === difficulty ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)'
                        ),
                        borderRadius: 8,
                        paddingVertical: 12,
                        marginHorizontal: 4,
                        alignItems: 'center'
                      },
                      onPress: () => this.updateGameSetting('difficulty', difficulty),
                      children: [
                        ui.Text({
                          text: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
                          style: {
                            fontSize: 12,
                            fontWeight: '600',
                            color: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.difficulty === difficulty ? '#6366F1' : '#FFFFFF'
                            )
                          }
                        })
                      ]
                    })
                  )
                })
              ]
            }),

            // Time Limit
            ui.View({
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              },
              children: [
                ui.Text({
                  text: 'Question Time Limit',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#000000',
                    textAlign: 'center',
                    marginBottom: 8
                  }
                }),
                ui.View({
                  style: {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                  },
                  children: [10, 15, 30, 45, 60].map(time =>
                    ui.Pressable({
                      style: {
                        width: '18%',
                        backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                          settings.timeLimit === time ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)'
                        ),
                        borderRadius: 8,
                        paddingVertical: 8,
                        marginBottom: 8,
                        alignItems: 'center'
                      },
                      onPress: () => this.updateGameSetting('timeLimit', time),
                      children: [
                        ui.Text({
                          text: `${time}s`,
                          style: {
                            fontSize: 10,
                            fontWeight: '600',
                            color: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.timeLimit === time ? '#6366F1' : '#FFFFFF'
                            )
                          }
                        })
                      ]
                    })
                  )
                })
              ]
            }),

            // Options
            ui.View({
              style: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 16
              },
              children: [
                ui.Text({
                  text: 'Options',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#000000',
                    textAlign: 'center',
                    marginBottom: 8
                  }
                }),
                // Auto-Advance
                ui.Pressable({
                  style: {
                    backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.autoAdvance ? '#16A34A' : '#DC2626'
                    ),
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    alignItems: 'center'
                  },
                  onPress: () => this.updateGameSetting('autoAdvance', !this.gameSettings.autoAdvance),
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                        `Auto-Advance: ${settings.autoAdvance ? 'ON' : 'OFF'}`
                      ),
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),
                // Mute During Questions
                ui.Pressable({
                  style: {
                    backgroundColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.muteDuringQuestions ? '#16A34A' : '#DC2626'
                    ),
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center'
                  },
                  onPress: () => this.updateGameSetting('muteDuringQuestions', !this.gameSettings.muteDuringQuestions),
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                        `Mute Audio: ${settings.muteDuringQuestions ? 'ON' : 'OFF'}`
                      ),
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
        }),

        // Fixed Confirm Button
        ui.View({
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: 'rgba(99, 102, 241, 0.9)'
          },
          children: [
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center'
              },
              onPress: () => this.navigateToPreGame(),
              children: [
                ui.Text({
                  text: 'Confirm Settings',
                  style: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#000000'
                  }
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
        width: '100%',
        height: '100%',
        backgroundColor: ui.Binding.derive([
          this.showResultBinding,
          this.isCorrectAnswerBinding
        ], (showResult, isCorrect) => {
          if (showResult) {
            return isCorrect ? '#22C55E' : '#EF4444'; // Green for correct, red for wrong
          }
          return '#6366F1'; // Default blue
        }),
        flexDirection: 'column'
      },
      children: [
        // Show normal game content when NOT showing results
        ui.UINode.if(
          ui.Binding.derive([this.showResultBinding], (showResult) => !showResult),
          ui.View({
            style: {
              flex: 1,
              padding: 8,
              paddingBottom: 11
            },
            children: [
              this.renderTwoOptionsPage()
            ]
          })
        ),

        // Bottom status bar
        this.renderStatusBar()
      ]
    });
  }

  private renderTriviaGameWithFourOptions(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: ui.Binding.derive([
          this.showResultBinding,
          this.isCorrectAnswerBinding
        ], (showResult, isCorrect) => {
          if (showResult) {
            return isCorrect ? '#22C55E' : '#EF4444'; // Green for correct, red for wrong
          }
          return '#6366F1'; // Default blue
        }),
        flexDirection: 'column'
      },
      children: [
        // Show normal game content when NOT showing results
        ui.UINode.if(
          ui.Binding.derive([this.showResultBinding], (showResult) => !showResult),
          ui.View({
            style: {
              flex: 1,
              padding: 8,
              paddingBottom: 12
            },
            children: [
              this.renderFourOptionsPage()
            ]
          })
        ),

        // Bottom status bar
        this.renderStatusBar()
      ]
    });
  }

  private renderPreGameScreen(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      },
      children: [
        // Role Badge
        ui.View({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#000000',
            shadowOffset: [0, 4],
            shadowOpacity: 0.3,
            shadowRadius: 8,
            marginBottom: 32
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.isHostBinding], (isHost) => isHost ? '👑 You are the Host' : '👤 You are a Participant'),
              style: {
                fontSize: 18,
                fontWeight: '600',
                color: '#4B5563',
                textAlign: 'center'
              }
            })
          ]
        }),
        // Host Controls
        ui.UINode.if(
          this.isHostBinding.derive(isHost => isHost),
          ui.View({
            style: {
              alignItems: 'center'
            },
            children: [
              // Game Settings Button
              ui.Pressable({
                style: {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  width: 150,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                  shadowColor: '#000000',
                  shadowOffset: [0, 2],
                  shadowOpacity: 0.1,
                  shadowRadius: 4
                },
                onPress: () => this.navigateToGameSettings(),
                children: [
                  ui.Text({
                    text: '⚙️ Game Settings',
                    style: {
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#6366F1',
                      textAlign: 'center'
                    }
                  })
                ]
              }),
              // Start Game Button
              ui.Pressable({
                style: {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  width: 150,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000000',
                  shadowOffset: [0, 2],
                  shadowOpacity: 0.1,
                  shadowRadius: 4
                },
                onPress: () => this.handleStartGame(),
                children: [
                  ui.Text({
                    text: '🎯 Start Game',
                    style: {
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#6366F1',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ]
          })
        ),
        // Participant Waiting Message
        ui.UINode.if(
          ui.Binding.derive([this.isHostBinding], (isHost) => !isHost),
          ui.Text({
            text: 'Waiting for host to start the game...',
            style: {
              fontSize: 16,
              color: '#FFFFFF',
              textAlign: 'center',
              opacity: 0.9
            }
          })
        )
      ]
    });
  }

  private renderWaitingScreen(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      },
      children: [
        // Role Badge
        ui.View({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#000000',
            shadowOffset: [0, 4],
            shadowOpacity: 0.3,
            shadowRadius: 8,
            marginBottom: 32
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.isHostBinding], (isHost) => isHost ? '👑 You are the Host' : '👤 You are a Participant'),
              style: {
                fontSize: 18,
                fontWeight: '600',
                color: '#4B5563',
                textAlign: 'center'
              }
            })
          ]
        }),
        // Host Controls
        ui.UINode.if(
          this.isHostBinding.derive(isHost => isHost),
          ui.View({
            style: {
              alignItems: 'center'
            },
            children: [
              // Game Settings Button
              ui.Pressable({
                style: {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  width: 150,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                  shadowColor: '#000000',
                  shadowOffset: [0, 2],
                  shadowOpacity: 0.1,
                  shadowRadius: 4
                },
                onPress: () => this.navigateToGameSettings(),
                children: [
                  ui.Text({
                    text: '⚙️ Game Settings',
                    style: {
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#6366F1',
                      textAlign: 'center'
                    }
                  })
                ]
              }),
              // Start Game Button
              ui.Pressable({
                style: {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  width: 150,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000000',
                  shadowOffset: [0, 2],
                  shadowOpacity: 0.1,
                  shadowRadius: 4
                },
                onPress: () => this.handleStartGame(),
                children: [
                  ui.Text({
                    text: '🎯 Start Game',
                    style: {
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#6366F1',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ]
          })
        ),
        // Participant Waiting Message
        ui.UINode.if(
          ui.Binding.derive([this.isHostBinding], (isHost) => !isHost),
          ui.Text({
            text: 'Waiting for host to start the game...',
            style: {
              fontSize: 16,
              color: '#FFFFFF',
              textAlign: 'center',
              opacity: 0.9
            }
          })
        )
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
        marginBottom: 13
      },
      children: [
        ui.Text({
          text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding, this.showLeaderboardBinding], (index, settings, showLeaderboard) => {
            // Only update the question number when not showing leaderboard to prevent footer updates during transition
            if (!showLeaderboard) {
              this.stableQuestionIndex = index;
            }
            return `Question ${this.stableQuestionIndex + 1}/${settings.numberOfQuestions}`;
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
        flex: 1,
        flexDirection: 'column',
        padding: 8
      },
      children: [
        ui.View({
          style: {
            flex: 1,
            marginBottom: 8
          },
          children: [this.createAnswerButton(2)]
        }),
        ui.View({
          style: {
            flex: 1,
            marginTop: 8
          },
          children: [this.createAnswerButton(3)]
        })
      ]
    });
  }

  private renderFourOptionsPage(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        flexDirection: 'column',
        padding: 9
      },
      children: [
        // Top row (buttons 0 and 1) - Fixed static buttons
        ui.View({
          style: {
            flexDirection: 'row',
            flex: 1,
            marginBottom: 0
          },
          children: [
            this.createAnswerButton(0),
            this.createAnswerButton(1)
          ]
        }),
        // Bottom row (buttons 2 and 3) - Fixed static buttons
        ui.View({
          style: {
            flexDirection: 'row',
            flex: 1,
            marginTop: 0
          },
          children: [
            this.createAnswerButton(2),
            this.createAnswerButton(3)
          ]
        })
      ]
    });
  }
}

// Register the component for Horizon Worlds
ui.UIComponent.register(TriviaPhone);
