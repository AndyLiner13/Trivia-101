import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import * as camera from 'horizon/camera';
import { Social, AvatarImageType } from 'horizon/social';
import { TriviaNetworkEvents, GameSettings, LeaderboardEntry } from './TriviaNetworkEvents';
import { TriviaAssetManager } from './TriviaAssetManager';
import { TriviaGameStateManager } from './TriviaGameStateManager';
import { TriviaScoreManager } from './TriviaScoreManager';
import { TriviaTimeoutManager } from './TriviaTimeoutManager';
import { TriviaPlayerUtils } from './TriviaPlayerUtils';

// Built-in trivia questions (fallback only - TriviaGame provides the actual questions)
const triviaQuestions: any[] = [];

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

  // Question start time for speed multiplier calculation
  private questionStartTime: number = 0;

  // Current question time limit for speed multiplier calculation
  private currentQuestionTimeLimit: number = 30;

  // Game settings state
  private gameSettings = {
    numberOfQuestions: 5,
    category: 'Italian Brainrot Quiz',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeLimit: 30,
    // Timer options (one must be selected)
    timerType: 'normal' as 'fast' | 'normal' | 'slow',
    // Difficulty options (one must be selected) 
    difficultyType: 'medium' as 'easy' | 'medium' | 'hard',
    // Lock state (toggleable by host only)
    isLocked: true,
    // Modifiers (can select multiple, none, or all)
    modifiers: {
      autoAdvance: false,
      powerUps: false,
      bonusRounds: false
    }
  };

  // View mode for navigation
  private currentViewMode: 'pre-game' | 'game-settings' = 'pre-game';

  // UI bindings
  private currentQuestionIndexBinding = new ui.Binding(0);
  private scoreBinding = new ui.Binding(0);
  
  // Stable question index for footer (prevents updates during leaderboard transition)
  private stableQuestionIndex: number = 0;
  private updateFooterBinding = new ui.Binding(false); // New binding to trigger footer updates
  private selectedAnswerBinding = new ui.Binding<number | null>(null);
  private showResultBinding = new ui.Binding(false);
  private gameStartedBinding = new ui.Binding(false);
  private gameEndedBinding = new ui.Binding(false);
  private gameEnded = false; // Track game ended state
  private isCorrectAnswerBinding = new ui.Binding(false);
  private correctAnswerIndexBinding = new ui.Binding<number | null>(null);
  private showLeaderboardBinding = new ui.Binding(false);
  private answerSubmittedBinding = new ui.Binding(false);

  // Last round points binding for displaying points earned
  private lastRoundPointsBinding = new ui.Binding(0);

  // Player tracking for conditional answer submission screen
  private playersInWorld: string[] = [];
  private playersAnswered: string[] = [];

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

  // Timeout tracking for cleanup during reset
  private pendingTimeouts: Set<any> = new Set();
  
  // Flag to track if game has been reset (to prevent late leaderboard display)
  private gameHasBeenReset: boolean = false;

  // Host status binding
  private isHostBinding = new ui.Binding(false);
  private currentHostStatus = false;

  // Opted-out status binding
  private isOptedOutBinding = new ui.Binding(false);
  private currentOptedOutStatus = false;

  // Info popup bindings
  private showInfoPopupBinding = new ui.Binding(false);
  private infoPopupTypeBinding = new ui.Binding<'timer' | 'difficulty' | 'modifiers' | 'questions'>('timer');

  // Logout popup binding
  private showLogoutPopupBinding = new ui.Binding(false);

  // Transfer host popup binding
  private showTransferHostPopupBinding = new ui.Binding(false);
  
  // Players list binding for transfer host popup
  private playersInWorldBinding = new ui.Binding<{id: string, name: string}[]>([]);
  private selectedPlayerForTransferBinding = new ui.Binding<string | null>(null);
  private selectedPlayerForTransfer: string | null = null;

  // Debug outline toggle binding
  private showOutlinesBinding = new ui.Binding(false);
  private showOutlines: boolean = false;

  constructor() {
    super();
    
    // Initialize players binding with current world players
    this.initializePlayersBinding();
  }
  
  private initializePlayersBinding(): void {
    try {
      const currentPlayers = this.world.getPlayers();
      const playerIds = currentPlayers.map(player => player.id.toString());
      const playersWithNames = currentPlayers.map(player => ({
        id: player.id.toString(),
        name: player.name.get() || `Player ${player.id.toString()}`
      }));
      
      this.playersInWorld = playerIds;
      this.playersInWorldBinding.set(playersWithNames);
      console.log(`✅ Initialized players binding with ${playersWithNames.length} players:`, playersWithNames);
    } catch (error) {
      console.log('❌ Error initializing players binding:', error);
      // Fallback to empty array
      this.playersInWorldBinding.set([]);
    }
  }

  // Clear all pending timeouts to prevent interference between games
  private clearAllPendingTimeouts(): void {
    this.pendingTimeouts.forEach(timeoutId => {
      this.async.clearTimeout(timeoutId);
    });
    this.pendingTimeouts.clear();
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
    const timeoutId = this.async.setTimeout(() => {
      this.pendingTimeouts.delete(timeoutId);
      this.updateScoreDisplay();
    }, 1000); // Increased delay to 1000ms to give persistent storage more time to initialize
    this.pendingTimeouts.add(timeoutId);
  }

  private updateScoreDisplayWithRetry(retryCount: number = 0): void {
    // Since we're not using persistent storage anymore, just update with current local score
    this.updateScoreDisplay();
  }

  private waitForPersistentStorageAndUpdateScore(): void {
    // Since we're not using persistent storage anymore, just update the score display
    this.updateScoreDisplay();
  }

  // Asset cache to keep images in memory permanently
  private assetCache = new Map<string, ui.ImageSource>();

  private async preloadTriviaPhoneAssets(): Promise<void> {
    
    // Define all texture IDs used in TriviaPhone
    const assetTextureIds = [
      // Background textures
      '2225071587959777',   // Main TriviaPhone background
      '9783264971776963',   // Pre-game background
      '1358485312536960',   // Question pages background
      
      // AnswerSubmitted screen backgrounds
      '4164501203820285',   // Red Triangle Screen
      '781053527999316',    // Blue Square Screen
      '1276483883806975',   // Yellow Circle Screen
      '1029237235836066',   // Green Star Screen
      
      // Lock icons
      '667887239673613',    // lock
      '1667289068007821',   // lock_open_right
      
      // Timer icons
      '2035737657163790',   // timer (normal)
      '1466620987937637',   // timer_off
      '1830264154592827',   // more_time
      
      // Difficulty icons
      '794548760190405',    // sentiment_satisfied (easy)
      '1138269638213533',   // sentiment_neutral (medium)
      '712075511858553',    // skull (hard)
      
      // UI icons
      '24898127093144614',  // info_i
      '1997295517705951',   // logout
      '1209829437577245',   // alarm icon
      '2019383778812059',   // check
      '24587675990884692',  // close
      '1806442143313699',   // arrow_forward
      
      // Shape/answer icons
      '2085541485520283',   // triangle
      '1317550153280256',   // square  
      '1247573280476332',    // circle
      '2403112933423824',   // star
      '1317550153280256',   // diamond
      
      // Modifier background icons
      '789207380187265',    // Left side icon background
      '3148012692041551',   // Center icon background
      '1320579906276560'    // Right side icon background
    ];
    
    let successCount = 0;
    const startTime = Date.now();
    
    // Preload all assets and cache them
    for (const textureId of assetTextureIds) {
      try {
        const imageSource = ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(textureId)));
        this.assetCache.set(textureId, imageSource);
        successCount++;
      } catch (error) {
      }
    }
    
    const loadTime = Date.now() - startTime;
  }

  // Helper method to get cached asset or create new one
  private getCachedImageSource(textureId: string): ui.ImageSource {
    const cached = this.assetCache.get(textureId);
    if (cached) {
      return cached;
    }
    
    // If not cached, create and cache it
    const imageSource = ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(textureId)));
    this.assetCache.set(textureId, imageSource);
    return imageSource;
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

    // Preload all TriviaPhone assets for fast rendering
    await this.preloadTriviaPhoneAssets();

    // Initialize host status binding
    this.currentHostStatus = this.isHost();
    this.isHostBinding.set(this.currentHostStatus);

    // Initialize opted-out status
    this.checkOptedOutStatus();

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

        // Keep mobile phone positioned and rotated 90 degrees for landscape view
        if (localPlayer.deviceType.get() === hz.PlayerDeviceType.Mobile && isVisible) {
          // Mobile user detected, applying rotation logic
          // Check if phone is currently "hidden" at y=-1000 (don't reposition if hidden)
          const currentPosition = this.entity.position.get();
          if (currentPosition.y === -1000) {
            // Phone is hidden (y=-1000), skipping mobile positioning
            return; // Don't reposition if hidden
          }

          // Applying mobile positioning and rotation
          // Disable physics/simulation
          this.entity.simulated.set(false);
          this.entity.collidable.set(false);

          // Position the phone in front of the player (similar to desktop positioning)
          const playerPosition = localPlayer.position.get();
          const playerForward = localPlayer.forward.get();
          const desiredPosition = playerPosition.add(playerForward.mul(1.5));
          desiredPosition.y += 0.3; // Slightly above ground level
          this.entity.position.set(desiredPosition);

          // Apply 90-degree rotation around Y-axis for mobile landscape view
          const mobileRotation = hz.Quaternion.fromAxisAngle(new hz.Vec3(0, 1, 0), Math.PI / 2);
          this.entity.rotation.set(mobileRotation);
          // Mobile rotation applied successfully
        } else if (localPlayer.deviceType.get() === hz.PlayerDeviceType.Mobile && !isVisible) {
          // Mobile user detected but phone is not visible, skipping rotation
        } else {
          // Non-mobile user or phone not visible, device type: localPlayer.deviceType.get(), isVisible: isVisible
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
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.results, (eventData) => {
      this.onTriviaResults(eventData);
    });

    // Listen for two-option question events
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.twoOptions, (eventData) => {
      this.onTriviaTwoOptions(eventData);
    });

    // Listen for four-option question events
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.fourOptions, (eventData) => {
      this.onTriviaFourOptions(eventData);
    });

    // Listen for trivia game start events
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.gameStart, (eventData) => {
      this.startGame();
    });

    // Listen for trivia game registration events
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.gameRegistered, (eventData) => {
      // Request current game state to sync with any ongoing game
      this.sendNetworkBroadcastEvent(TriviaNetworkEvents.stateRequest, {
        requesterId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
      });
    });

    // Listen for player update events to track answer submission status
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.playerUpdate, (eventData) => {
      this.onPlayerUpdate(eventData);
    });

    // Listen for trivia state responses
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.stateResponse, (eventData) => {
      this.onTriviaStateResponse(eventData);
    });

    // Listen for trivia game end events
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.gameEnd, (eventData) => {
      this.onTriviaGameEnd(eventData);
    });

    // Listen for trivia game reset events
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.gameReset, (eventData) => {
      this.onTriviaGameReset(eventData);
    });

    // Listen for host changed events
    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.hostChanged, (eventData) => {
      this.onHostChanged(eventData);
    });

    this.connectNetworkBroadcastEvent(TriviaNetworkEvents.settingsUpdate, (eventData) => {
      this.onSettingsUpdate(eventData);
    });

    // Request state immediately when component starts (for players joining mid-game)
    const stateRequestTimeoutId = this.async.setTimeout(() => {
      this.pendingTimeouts.delete(stateRequestTimeoutId);
      this.sendNetworkBroadcastEvent(TriviaNetworkEvents.stateRequest, {
        requesterId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
      });
    }, 1000); // Wait 1 second for everything to initialize
    this.pendingTimeouts.add(stateRequestTimeoutId);
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

      // Set up E key input for hiding TriviaPhone when focused - ENABLED for desktop and web users only
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightGrip)) {
        // Check if the local player is NOT a VR user and NOT a mobile user
        const isVRUser = localPlayer.deviceType.get() === hz.PlayerDeviceType.VR;
        const isMobileUser = localPlayer.deviceType.get() === hz.PlayerDeviceType.Mobile;

        if (!isVRUser && !isMobileUser) {
          this.eKeyInputConnection = hz.PlayerControls.connectLocalInput(
            hz.PlayerInputAction.RightGrip,
            hz.ButtonIcon.None,
            this,
            { preferredButtonPlacement: hz.ButtonPlacement.Default }
          );

          this.eKeyInputConnection.registerCallback((action, pressed) => {
            if (pressed) {
              // Handle E key trigger - hide TriviaPhone for desktop and web users
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
    try {
      // onFocus called for player device type: player.deviceType.get()
      // Mark that the player is now focused on the UI
      this.isPlayerFocusedOnUI = true;

      // Show the TriviaPhone when focused - make it visible to all players
      this.entity.visible.set(true);
      // Phone made visible in onFocus
    } catch (error) {
      // Error in onFocus: error
      this.isPlayerFocusedOnUI = false;
    }
  }

  onUnfocus(player: hz.Player): void {
    try {
      // Check if this is a mobile user
      const isMobileUser = player.deviceType.get() === hz.PlayerDeviceType.Mobile;

      // onUnfocus called - Device type: player.deviceType.get(), isMobile: isMobileUser

      // Mark that the player is no longer focused on the UI
      this.isPlayerFocusedOnUI = false;

      // For mobile users, don't immediately hide the phone on unfocus
      // as touch interactions may trigger unfocus events unintentionally
      if (!isMobileUser) {
        // Non-mobile user unfocused, hiding phone
        // Hide the TriviaPhone when unfocused for non-mobile users
        this.hideTriviaPhone();
      } else {
        // Mobile user unfocused, keeping phone visible to prevent touch interaction issues
      }
      // For mobile users, we keep the phone visible to prevent touch interaction issues
    } catch (error) {
      // Error in onUnfocus: error
    }
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
        // Could not capture camera position
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
    const isMobileUser = player.deviceType.get() === hz.PlayerDeviceType.Mobile;
    // handleLeftTertiaryTrigger called - Device type: player.deviceType.get(), isMobile: isMobileUser

    // Check if the CustomUI is already open by checking if phone is close to player and not hidden
    const phonePosition = this.entity.position.get();
    const playerPosition = player.position.get();
    const isPhoneVisibleToPlayer = phonePosition.distance(playerPosition) < 5 && phonePosition.y > -500;

    // Phone status - isPlayerFocusedOnUI: this.isPlayerFocusedOnUI, isPhoneVisibleToPlayer: isPhoneVisibleToPlayer, distance: phonePosition.distance(playerPosition).toFixed(2)

    // For mobile users: toggle behavior (open if closed, close if open)
    if (isMobileUser) {
      if (this.isPlayerFocusedOnUI && isPhoneVisibleToPlayer) {
        // Phone is open, close it (same as E key behavior for mobile)
        // Mobile user - phone is open, closing it
        this.handleEKeyTrigger(player);
        return;
      } else {
        // Phone is closed, open it
        // Mobile user - phone is closed, opening it
        this.teleportToPlayer(player);
        this.openAndFocusUIForPlayer(player);
        return;
      }
    }

    // For desktop and web users: original behavior (open only, skip if already open)
    if (this.isPlayerFocusedOnUI && isPhoneVisibleToPlayer) {
      // UI is already open, do nothing
      // Desktop/Web user - UI already open, skipping focus
      return;
    }

    // Asset Pool Gizmo handles ownership assignment automatically

    // Show the TriviaPhone and focus the UI for desktop and web users
    // Desktop/Web user - opening and focusing UI
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

      // For VR users, skip focusUI to avoid hiding other players
      const isVRUser = player.deviceType.get() === hz.PlayerDeviceType.VR;
      const isMobileUser = player.deviceType.get() === hz.PlayerDeviceType.Mobile;

      // openAndFocusUIForPlayer called - Device type: player.deviceType.get(), isVR: isVRUser, isMobile: isMobileUser

      if (!isVRUser) {
        // For both desktop and mobile users, attempt to focus UI
        // Non-VR user detected, attempting to focus UI
        // Wait 25ms for position change to take effect, then focus the UI with retry logic
        const focusTimeoutId = this.async.setTimeout(() => {
          this.pendingTimeouts.delete(focusTimeoutId);
          this.attemptFocusWithRetry(player, 0);
        }, 25);
        this.pendingTimeouts.add(focusTimeoutId);
      } else {
        // VR user detected, skipping focusUI call
        // For VR users, set focus state immediately since we skip focusUI
        this.isPlayerFocusedOnUI = true;
      }
      // We now allow mobile users to focus, but prevent unfocus from touch events in the onUnfocus method

    } catch (error) {
      // ❌ TriviaPhone: Error in openAndFocusUIForPlayer - focus operation failed
      // If something goes wrong, reset the focus state
      this.isPlayerFocusedOnUI = false;
    }
  }

  private attemptFocusWithRetry(player: hz.Player, attemptCount: number): void {
    const maxRetries = 3;
    const retryDelay = 100; // 100ms delay between retries

    try {
      player.focusUI(this.entity, { duration: 0.1 });
      // Only set focus state after successful focus operation
      this.isPlayerFocusedOnUI = true;
    } catch (focusError) {
      // Focus operation failed

      if (attemptCount < maxRetries - 1) {
        // Try again after delay
        const retryTimeoutId = this.async.setTimeout(() => {
          this.pendingTimeouts.delete(retryTimeoutId);
          this.attemptFocusWithRetry(player, attemptCount + 1);
        }, retryDelay);
        this.pendingTimeouts.add(retryTimeoutId);
      } else {
        // All retries exhausted, reset focus state
        this.isPlayerFocusedOnUI = false;
      }
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
      const hideTimeoutId = this.async.setTimeout(() => {
        this.pendingTimeouts.delete(hideTimeoutId);
        this.hideTriviaPhone();
      }, 50);
      this.pendingTimeouts.add(hideTimeoutId);
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

  private checkOptedOutStatus(): void {
    // Check if this player is opted out by querying TriviaGame
    const localPlayer = this.world.getLocalPlayer();
    if (localPlayer) {
      // Find TriviaGame instance to check opted-out status
      const triviaGame = (this.world as any).triviaGame;
      if (triviaGame && typeof triviaGame.isPlayerOptedOut === 'function') {
        const isOptedOut = triviaGame.isPlayerOptedOut(localPlayer.id.toString());
        this.isOptedOutBinding.set(isOptedOut);
        this.currentOptedOutStatus = isOptedOut; // Mirror the binding value
      }
    }
  }

  private handleRejoinGame(): void {
    const localPlayer = this.world.getLocalPlayer();
    if (!localPlayer) return;

    // Send rejoin event to TriviaGame
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.playerRejoin, {
      playerId: localPlayer.id.toString()
    });

    // Immediately update local opted-out status to hide opted-out screen
    this.isOptedOutBinding.set(false);
    this.currentOptedOutStatus = false;

    // Check current game state to determine immediate action
    // Use instance variables for gameStarted and showResult
    // For showLeaderboard, we'll check the current screen type instead
    const gameStarted = this.gameStarted;
    const showResult = this.showResult;
    const currentScreenType = this.currentScreenType;

    // If a question is currently showing (game started, not showing results, and screen is two-options or four-options)
    if (gameStarted && !showResult && (currentScreenType === 'two-options' || currentScreenType === 'four-options')) {
      // Request current game state from TriviaGame to get the latest question
      this.sendNetworkBroadcastEvent(TriviaNetworkEvents.stateRequest, {
        requesterId: localPlayer.id.toString()
      });
    } else {
      // For results/leaderboard/game over screens, the rejoin is complete
      // The opted-out screen is already hidden above
    }
  }  private handleStartGame(): void {
    if (!this.isHost()) return;

    // Send network event to start the game for all players with configured settings
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.gameStart, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'host',
      config: {
        timeLimit: this.gameSettings.timeLimit,
        category: this.gameSettings.category.toLowerCase().replace(' ', ''),
        difficulty: this.gameSettings.difficulty,
        numQuestions: this.gameSettings.numberOfQuestions
      }
    });

    // Also send the settings update event with modifier information
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.settingsUpdate, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'host',
      settings: {
        numberOfQuestions: this.gameSettings.numberOfQuestions,
        category: this.gameSettings.category,
        difficulty: this.gameSettings.difficulty,
        timeLimit: this.gameSettings.timeLimit,
        timerType: this.gameSettings.timerType,
        difficultyType: this.gameSettings.difficultyType,
        isLocked: this.gameSettings.isLocked,
        modifiers: this.gameSettings.modifiers
      }
    });
  }

  // Trivia game methods
  private startGame(): void {
    this.gameStarted = true;
    this.gameHasBeenReset = false; // ✅ Clear reset flag when new game starts
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
    // 📊 TriviaPhone: Results received - resetting answerSubmitted and setting showResult = true
    this.showResult = true;
    this.showResultBinding.set(true);
    
    // Reset answer submitted state since results are now showing
    this.answerSubmitted = false;
    this.answerSubmittedBinding.set(false);
    
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
    
    // Reset last round points
    this.lastRoundPointsBinding.set(0);
    
    if (isCorrect && this.world.getLocalPlayer() && !eventData.showLeaderboard) {
      // Calculate speed multiplier: faster answers get higher points
      const basePoints = 1;
      const maxPoints = 100000;
      const timeLimit = this.currentQuestionTimeLimit * 1000; // Convert to milliseconds using actual question time limit
      
      // Calculate response time (use the time from when question was received)
      const responseTime = Date.now() - this.questionStartTime;
      
      // New speed multiplier formula: P = -33.3t + 1999 (where t is in seconds)
      let calculatedPoints = basePoints;
      if (responseTime > 0 && responseTime < timeLimit) {
        // Convert response time to seconds for the formula
        const responseTimeSeconds = responseTime / 1000;
        // Apply formula: P = -33.3t + 1999, clamped to minimum 1 point
        calculatedPoints = Math.max(1, Math.floor(-33.3 * responseTimeSeconds + 999));
      } else if (responseTime >= timeLimit) {
        // If answered at or after time limit, give minimum points
        calculatedPoints = basePoints;
      }
      
      // 🏆 TriviaPhone: Speed bonus calculated - Response time: ${responseTime}ms (${(responseTime/1000).toFixed(2)}s), Points: ${calculatedPoints}
      
      // Send network event to TriviaGame to award calculated points
      this.sendNetworkBroadcastEvent(TriviaNetworkEvents.awardPoints, {
        playerId: this.world.getLocalPlayer()!.id.toString(),
        points: calculatedPoints
      });

      // Set last round points for display
      this.lastRoundPointsBinding.set(calculatedPoints);

      // Immediate local score increment for instant feedback
      this.score += calculatedPoints;
      this.scoreBinding.set(this.score);
    }
    
    // Update leaderboard binding - but don't show leaderboard if game has ended or been reset
    this.showLeaderboardBinding.set(eventData.showLeaderboard && !this.gameEnded && !this.gameHasBeenReset || false);
    
    // Log when leaderboard is shown
    if (eventData.showLeaderboard && !this.gameEnded && !this.gameHasBeenReset) {
      // Check if end game button should be visible
      const isLastQuestion = (this.currentQuestionIndex + 1) >= this.gameSettings.numberOfQuestions;
      const isHost = this.isHost();
      if (isHost && isLastQuestion) {
        // END GAME button is now visible (last question + host)
      }
    }

    // Only update score display from persistent storage when leaderboard is shown
    // This ensures we sync with server state at appropriate times
    if (eventData.showLeaderboard) {
      // Wait a bit longer for the server to process the award, then sync
      const scoreUpdateTimeoutId = this.async.setTimeout(() => {
        this.pendingTimeouts.delete(scoreUpdateTimeoutId);
        this.updateScoreDisplayWithRetry(0);
      }, 2000); // Wait 2 seconds for server processing
      this.pendingTimeouts.add(scoreUpdateTimeoutId);
    }
  }

  public onTriviaTwoOptions(eventData: { 
    question: any, 
    questionIndex: number, 
    timeLimit: number,
    totalQuestions: number 
  }): void {
    // Check opted-out status before processing question event
    this.checkOptedOutStatus();
    
    // If player is opted out, don't process question events
    if (this.currentOptedOutStatus) {
      return;
    }
    
    // Record question start time for speed multiplier calculation
    this.questionStartTime = Date.now();
    
    // Store the actual time limit from the event for speed multiplier calculation
    this.currentQuestionTimeLimit = eventData.timeLimit;
    
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
    
    // Reset answer submitted state for new question
    this.answerSubmitted = false;
    this.answerSubmittedBinding.set(false);
    
    // Store question index and update the current question index binding
    this.currentQuestionIndex = eventData.questionIndex;
    this.currentQuestionIndexBinding.set(eventData.questionIndex);
    
    // Update game settings with actual total questions from the game
    this.gameSettings.numberOfQuestions = eventData.totalQuestions;
    this.gameSettingsBinding.set({ ...this.gameSettings });
    
    // Update footer immediately when receiving a new question
    this.updateFooterBinding.set(true);
    const footerTimeoutId1 = this.async.setTimeout(() => {
      this.pendingTimeouts.delete(footerTimeoutId1);
      this.updateFooterBinding.set(false);
    }, 100);
    this.pendingTimeouts.add(footerTimeoutId1);
  }

  public onTriviaFourOptions(eventData: { 
    question: any, 
    questionIndex: number, 
    timeLimit: number,
    totalQuestions: number 
  }): void {
    // Check opted-out status before processing question event
    this.checkOptedOutStatus();
    
    // If player is opted out, don't process question events
    if (this.currentOptedOutStatus) {
      return;
    }
    
    // Record question start time for speed multiplier calculation
    this.questionStartTime = Date.now();
    
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
    
    // Reset answer submitted state for new question
    this.answerSubmitted = false;
    this.answerSubmittedBinding.set(false);
    
    // Store question index and update the current question index binding
    this.currentQuestionIndex = eventData.questionIndex;
    this.currentQuestionIndexBinding.set(eventData.questionIndex);
    
    // Update game settings with actual total questions from the game
    this.gameSettings.numberOfQuestions = eventData.totalQuestions;
    this.gameSettingsBinding.set({ ...this.gameSettings });
    
    // Update footer immediately when receiving a new question
    this.updateFooterBinding.set(true);
    const footerTimeoutId2 = this.async.setTimeout(() => {
      this.pendingTimeouts.delete(footerTimeoutId2);
      this.updateFooterBinding.set(false);
    }, 100);
    this.pendingTimeouts.add(footerTimeoutId2);
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

    // Check opted-out status after receiving state response
    this.checkOptedOutStatus();

    // If player is opted out, don't process game state updates
    // Use the current opted-out status that was just updated
    if (this.currentOptedOutStatus) {
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
        
        // Reset answer submitted state since results are now showing
        this.answerSubmitted = false;
        this.answerSubmittedBinding.set(false);
        
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
    
    // ✅ Clear all pending timeouts to prevent interference with the new game
    this.clearAllPendingTimeouts();
    
    // ✅ Set reset flag to prevent any late leaderboard displays
    this.gameHasBeenReset = true;
    
    // Reset all game state to initial values
    this.gameStarted = false;
    this.gameEnded = false; // ✅ Reset game ended flag
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
    
    // ✅ Reset screen type to waiting to override any results/leaderboard screen
    this.currentScreenType = 'waiting';
    this.screenTypeBinding.set('waiting');
    
    // Navigate back to pre-game screen
    this.currentViewMode = 'pre-game';
    this.currentViewModeBinding.set('pre-game');

    // Refresh opted-out status when game resets (preserve opted-out status and game modifiers)
    this.checkOptedOutStatus();

    // Update score display from persistent storage after reset with robust retry
    this.updateScoreDisplayWithRetry();

    // ✅ TriviaPhone: Game reset complete - all timers cleared, leaderboard hidden, screen set to waiting
  }

  private onPlayerUpdate(eventData: { playersInWorld: string[], playersAnswered: string[], answerCount: number }): void {
    // Update tracking data
    this.playersInWorld = eventData.playersInWorld;
    this.playersAnswered = eventData.playersAnswered;
    
    // Convert player IDs to player objects with names for the binding
    try {
      const currentPlayers = this.world.getPlayers();
      const playersWithNames = eventData.playersInWorld.map(playerId => {
        const player = currentPlayers.find(p => p.id.toString() === playerId);
        return {
          id: playerId,
          name: player?.name.get() || `Player ${playerId}`
        };
      });
      this.playersInWorldBinding.set(playersWithNames);
    } catch (error) {
      console.log('❌ Error converting player IDs to names:', error);
      // Fallback: just use player IDs as names
      const playersWithIds = eventData.playersInWorld.map(playerId => ({
        id: playerId,
        name: `Player ${playerId}`
      }));
      this.playersInWorldBinding.set(playersWithIds);
    }
    
    // 📡 TriviaPhone: Player update received - playersAnswered: ${eventData.playersAnswered.length}, playersInWorld: ${eventData.playersInWorld.length}
  }

  private onHostChanged(eventData: { newHostId: string; oldHostId?: string }): void {
    
    // Update host status based on centralized host management
    const localPlayer = this.world.getLocalPlayer();
    const isLocalPlayerHost = localPlayer ? eventData.newHostId === localPlayer.id.toString() : false;
    
    this.currentHostStatus = isLocalPlayerHost;
    this.isHostBinding.set(isLocalPlayerHost);
  }

  private onSettingsUpdate(eventData: { hostId: string, settings: { numberOfQuestions: number, category: string, difficulty: string, timeLimit: number, timerType: string, difficultyType: string, isLocked: boolean, modifiers: { autoAdvance: boolean, powerUps: boolean, bonusRounds: boolean } } }): void {
    // Don't process our own updates to avoid feedback loops
    const localPlayerId = this.world.getLocalPlayer()?.id.toString();
    if (eventData.hostId === localPlayerId) {
      return;
    }
    
    // Update local game settings when receiving updates from any player
    this.gameSettings = {
      ...this.gameSettings,
      numberOfQuestions: eventData.settings.numberOfQuestions,
      category: eventData.settings.category,
      difficulty: eventData.settings.difficulty as "easy" | "medium" | "hard",
      timeLimit: eventData.settings.timeLimit,
      timerType: eventData.settings.timerType as "normal" | "slow" | "fast",
      difficultyType: eventData.settings.difficultyType as "easy" | "medium" | "hard",
      isLocked: eventData.settings.isLocked,
      modifiers: eventData.settings.modifiers
    };
    this.gameSettingsBinding.set(this.gameSettings);
  }

  private endGame(): void {
    if (!this.isHost()) {
      return;
    }

    // Send reset event to TriviaGame and all TriviaPhones
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.gameReset, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
    });
  }

  private handleAnswerSelect(answerIndex: number): void {
    // User selected answer with index: {answerIndex}
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

    // Calculate response time in milliseconds
    const responseTime = Date.now() - this.questionStartTime;
    // Response time calculated: {responseTime} ms

    // Send network event with the answer index and calculated response time
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.answerSubmitted, {
      playerId: this.assignedPlayer?.id.toString() || 'local',
      answerIndex: actualAnswerIndex,
      responseTime: responseTime
    });

    // Check if this answer will complete all answers (local calculation to avoid timing issues)
    const answersAfterThis = this.playersAnswered.length + 1; // Add 1 for this player's answer
    const willCompleteAllAnswers = answersAfterThis >= this.playersInWorld.length && this.playersInWorld.length > 0;
    
    // Players answered: {this.playersAnswered.length}, players in world: {this.playersInWorld.length}, answers after this: {answersAfterThis}, will complete all answers: {willCompleteAllAnswers}
    
    // Only show answerSubmitted screen if this answer won't complete all answers
    if (!willCompleteAllAnswers) {
      this.answerSubmitted = true;
      this.answerSubmittedBinding.set(true);
      // Answer submitted - showing answerSubmitted screen for answer {actualAnswerIndex}
    } else {
      // Answer submitted for answer {actualAnswerIndex} - skipping answerSubmitted screen (this completes all answers)
    }
  }

  private nextQuestion(): void {
    // Send next question event to TriviaGame - let it handle all the logic
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.nextQuestion, {
      playerId: this.world.getLocalPlayer()?.id.toString() || 'host'
    });
    
    // Trigger footer update immediately when next question button is clicked
    this.updateFooterBinding.set(true);
    
    // Reset the trigger after a short delay to allow the binding to update
    const nextQuestionTimeoutId = this.async.setTimeout(() => {
      this.pendingTimeouts.delete(nextQuestionTimeoutId);
      this.updateFooterBinding.set(false);
    }, 100);
    this.pendingTimeouts.add(nextQuestionTimeoutId);
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
    // Notify TriviaGame that host is in game settings
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.hostViewMode, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'host',
      viewMode: 'game-settings'
    });
  }

  private navigateToPreGame(): void {
    this.currentViewMode = 'pre-game';
    this.currentViewModeBinding.set('pre-game');
    // Notify TriviaGame that host is in pre-game
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.hostViewMode, {
      hostId: this.world.getLocalPlayer()?.id.toString() || 'host',
      viewMode: 'pre-game'
    });
  }

  private updateGameSetting(key: string, value: any): void {
    (this.gameSettings as any)[key] = value;
    this.gameSettingsBinding.set({ ...this.gameSettings });
    this.sendSettingsUpdate();
  }

  private toggleSettingsLock(): void {
    // No longer needed - removed lock functionality
  }

  // Timer type methods
  private setTimerType(type: 'fast' | 'normal' | 'slow'): void {
    
    this.gameSettings.timerType = type;
    // Update actual timeLimit based on timer type
    switch (type) {
      case 'fast':
        this.gameSettings.timeLimit = 15;
        break;
      case 'normal':
        this.gameSettings.timeLimit = 30;
        break;
      case 'slow':
        this.gameSettings.timeLimit = 60;
        break;
    }
    this.gameSettingsBinding.set({ ...this.gameSettings });
    this.sendSettingsUpdate();
  }

  // Difficulty type methods
  private setDifficultyType(type: 'easy' | 'medium' | 'hard'): void {
    
    this.gameSettings.difficultyType = type;
    this.gameSettings.difficulty = type; // Keep backward compatibility
    this.gameSettingsBinding.set({ ...this.gameSettings });
    this.sendSettingsUpdate();
  }

  // Lock toggle method (host only)
  private toggleLock(): void {
    this.gameSettings.isLocked = !this.gameSettings.isLocked;
    this.gameSettingsBinding.set({ ...this.gameSettings });
    this.sendSettingsUpdate();
  }

  // Modifier toggle methods
  private toggleModifier(modifier: 'autoAdvance' | 'powerUps' | 'bonusRounds'): void {
    // Toggle the modifier value
    this.gameSettings.modifiers[modifier] = !this.gameSettings.modifiers[modifier];
    
    // Force a deep copy of the entire gameSettings object to ensure binding updates
    this.gameSettingsBinding.set({
      ...this.gameSettings,
      modifiers: {
        ...this.gameSettings.modifiers
      }
    });
    
    this.sendSettingsUpdate();
  }

  private sendSettingsUpdate(): void {
    const isHost = this.isHost();
    const canMakeChanges = isHost || !this.gameSettings.isLocked;
    
    if (!canMakeChanges) {
      return;
    }
    
    const playerId = this.world.getLocalPlayer()?.id.toString() || 'unknown';
    
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.settingsUpdate, {
      hostId: playerId, // Use actual player ID instead of always 'host'
      settings: {
        numberOfQuestions: this.gameSettings.numberOfQuestions,
        category: this.gameSettings.category,
        difficulty: this.gameSettings.difficulty,
        timeLimit: this.gameSettings.timeLimit,
        timerType: this.gameSettings.timerType,
        difficultyType: this.gameSettings.difficultyType,
        isLocked: this.gameSettings.isLocked,
        modifiers: this.gameSettings.modifiers
      }
    });
  }

  render(): ui.UINode {
    // Render called with current state: {currentViewMode}, gameStarted: {gameStarted}, gameEnded: {gameEnded}, showResult: {showResult}, answerSubmitted: {answerSubmitted}, screenType: {currentScreenType}, isHost: {isHost()}, isOptedOut: {currentOptedOutStatus}
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
                  if (mode === 'game-settings') return '#191919';
                  if (started && (screenType === 'two-options' || screenType === 'four-options')) return '#191919';
                  if (started && screenType === 'results') return '#191919'; // Dark background for feedback screen
                  return '#191919';
                }),
                borderRadius: 14,
                overflow: 'hidden'
              },
              children: [
                // Opted-out screen - shows when player has opted out
                ui.UINode.if(
                  this.isOptedOutBinding,
                  this.renderOptedOutScreen()
                ),

                // Pre-game screen - shows when game hasn't started and player is not opted out
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.gameStartedBinding, this.gameEndedBinding, this.showResultBinding, this.isOptedOutBinding], (mode, started, gameEnded, showResult, isOptedOut) => 
                    mode === 'pre-game' && !started && (!gameEnded || !showResult) && !isOptedOut
                  ),
                  this.renderPreGameScreen()
                ),

                // Two-option trivia screen - shows only when event received and game is started
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding, this.showResultBinding, this.answerSubmittedBinding], (mode, screenType, started, showResult, answerSubmitted) => 
                    mode === 'pre-game' && started && screenType === 'two-options' && !showResult && !answerSubmitted
                  ),
                  this.renderTwoOptionsPage()
                ),
                
                // Four-option trivia screen - shows only when event received and game is started
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.screenTypeBinding, this.gameStartedBinding, this.showResultBinding, this.answerSubmittedBinding], (mode, screenType, started, showResult, answerSubmitted) => 
                    mode === 'pre-game' && started && screenType === 'four-options' && !showResult && !answerSubmitted
                  ),
                  this.renderFourOptionsPage()
                ),

                // Host correct results screen
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.gameStartedBinding, this.showResultBinding, this.gameEndedBinding, this.isHostBinding, this.isCorrectAnswerBinding], (mode, started, showResult, gameEnded, isHost, isCorrect) => 
                    mode === 'pre-game' && (started || gameEnded) && showResult && isHost && isCorrect
                  ),
                  this.renderHostCorrectResults()
                ),

                // Host wrong results screen
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.gameStartedBinding, this.showResultBinding, this.gameEndedBinding, this.isHostBinding, this.isCorrectAnswerBinding], (mode, started, showResult, gameEnded, isHost, isCorrect) => 
                    mode === 'pre-game' && (started || gameEnded) && showResult && isHost && !isCorrect
                  ),
                  this.renderHostWrongResults()
                ),

                // Participant correct results screen
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.gameStartedBinding, this.showResultBinding, this.gameEndedBinding, this.isHostBinding, this.isCorrectAnswerBinding], (mode, started, showResult, gameEnded, isHost, isCorrect) => {
                    const shouldShow = mode === 'pre-game' && (started || gameEnded) && showResult && !isHost && isCorrect;
                    // Participant correct results condition MET - showing screen
                    return shouldShow;
                  }),
                  this.renderParticipantCorrectResults()
                ),

                // Participant wrong results screen
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.gameStartedBinding, this.showResultBinding, this.gameEndedBinding, this.isHostBinding, this.isCorrectAnswerBinding], (mode, started, showResult, gameEnded, isHost, isCorrect) => {
                    const shouldShow = mode === 'pre-game' && (started || gameEnded) && showResult && !isHost && !isCorrect;
                    // Participant wrong results condition MET - showing screen
                    return shouldShow;
                  }),
                  this.renderParticipantWrongResults()
                ),
                
                // Answer submitted screen - shows when answer is submitted but results not yet shown
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding, this.gameStartedBinding, this.answerSubmittedBinding, this.showResultBinding], (mode, started, answerSubmitted, showResult) => {
                    const shouldShow = mode === 'pre-game' && started && answerSubmitted && !showResult;
                    // Answer submitted screen condition MET - showing screen
                    return shouldShow;
                  }),
                  this.renderAnswerSubmittedScreen()
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

  private incrementQuestionCount(): void {
    const currentCount = this.gameSettings.numberOfQuestions || 5;
    const newCount = Math.min(currentCount + 5, 95); // Max 95 questions
    
    this.updateGameSetting('numberOfQuestions', newCount);
    // Incremented question count to {newCount}
  }

  private decrementQuestionCount(): void {
    const currentCount = this.gameSettings.numberOfQuestions || 5;
    const newCount = Math.max(currentCount - 5, 5); // Min 5 questions
    
    this.updateGameSetting('numberOfQuestions', newCount);
    // Decremented question count to {newCount}
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
                backgroundColor: '#191919',
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
                    color: '#FFFFFF',
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
                    alignSelf: 'flex-start',
                    opacity: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.category === 'Italian Brainrot Quiz' ? 0.3 : 1
                    )
                  },
                  children: [
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.setTimerType('slow');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1466620987937637'))), // timer_off
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.timerType === 'slow' ? '#FFFFFF' : '#666666'
                            ),
                            marginRight: 2
                          }
                        })
                      ]
                    }),
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.setTimerType('normal');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2035737657163790'))), // timer
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.timerType === 'normal' ? '#FFFFFF' : '#666666'
                            ),
                            marginRight: 2
                          }
                        })
                      ]
                    }),
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.setTimerType('fast');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1830264154592827'))), // more_time
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.timerType === 'fast' ? '#FFFFFF' : '#666666'
                            )
                          }
                        })
                      ]
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
                    alignSelf: 'flex-start',
                    opacity: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.category === 'Italian Brainrot Quiz' ? 0.3 : 1
                    )
                  },
                  children: [
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.setDifficultyType('easy');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('794548760190405'))), // sentiment_satisfied
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.difficultyType === 'easy' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'
                            ),
                            marginRight: 2
                          }
                        })
                      ]
                    }),
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.setDifficultyType('medium');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1138269638213533'))), // sentiment_neutral
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.difficultyType === 'medium' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'
                            ),
                            marginRight: 2
                          }
                        })
                      ]
                    }),
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.setDifficultyType('hard');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('712075511858553'))), // skull
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.difficultyType === 'hard' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'
                            )
                          }
                        })
                      ]
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

            // Modifiers settings row
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
                // Modifiers options container
                ui.View({
                  style: {
                    backgroundColor: '#191919',
                    borderRadius: 8,
                    padding: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    opacity: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.category === 'Italian Brainrot Quiz' ? 0.3 : 1
                    )
                  },
                  children: [
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.toggleModifier('autoAdvance');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('789207380187265'))), // autoplay
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.modifiers.autoAdvance ? '#FFFFFF' : '#666666'
                            ),
                            marginRight: 2
                          }
                        })
                      ]
                    }),
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.toggleModifier('powerUps');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1320579906276560'))), // bolt
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.modifiers.powerUps ? '#FFFFFF' : '#666666'
                            ),
                            marginRight: 2
                          }
                        })
                      ]
                    }),
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.toggleModifier('bonusRounds');
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3148012692041551'))), // all_inclusive
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                              settings.modifiers.bonusRounds ? '#FFFFFF' : '#666666'
                            )
                          }
                        })
                      ]
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
                    this.infoPopupTypeBinding.set('modifiers');
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

            // Number of Questions settings row
            ui.View({
              style: {
                width: '100%',
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 6,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              },
              children: [
                // Add/Remove container
                ui.View({
                  style: {
                    backgroundColor: '#191919',
                    borderRadius: 8,
                    padding: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    opacity: ui.Binding.derive([this.gameSettingsBinding], (settings) =>
                      settings.category === 'Italian Brainrot Quiz' ? 0.3 : 1
                    )
                  },
                  children: [
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.decrementQuestionCount();
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('642575278900917'))), // remove
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: '#FFFFFF',
                            marginRight: 2
                          }
                        })
                      ]
                    }),
                    // Text field showing current count
                    ui.View({
                      style: {
                        width: 28,
                        height: 28,
                        justifyContent: 'center',
                        alignItems: 'center'
                      },
                      children: [
                        ui.Text({
                          text: ui.Binding.derive([this.gameSettingsBinding], (settings) => 
                            settings.numberOfQuestions?.toString() || '5'
                          ),
                          style: {
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#FFFFFF',
                            textAlign: 'center'
                          }
                        })
                      ]
                    }),
                    ui.Pressable({
                      onPress: () => {
                        if (this.gameSettings.category !== 'Italian Brainrot Quiz') {
                          this.incrementQuestionCount();
                        }
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1125453972243822'))), // add
                          style: {
                            width: 28,
                            height: 28,
                            tintColor: '#FFFFFF'
                          }
                        })
                      ]
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
                    this.infoPopupTypeBinding.set('questions');
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
        ),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
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
            backgroundColor: '#191919',
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
                      case 'modifiers': return 'Modifiers';
                      case 'questions': return 'Questions';
                      default: return 'Game Settings';
                    }
                  }),
                  style: {
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#FFFFFF',
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
                          case 'timer': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1466620987937637'))); // none icon
                          case 'difficulty': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('794548760190405'))); // sentiment_satisfied
                          case 'modifiers': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('789207380187265'))); // autoplay
                          case 'questions': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1125453972243822'))); // add icon
                          default: return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2035737657163790')));
                        }
                      }),
                      style: {
                        width: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'modifiers' ? 18 : 24),
                        height: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'modifiers' ? 18 : 24),

                        tintColor: '#FFFFFF'
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return 'None';
                          case 'difficulty': return 'Easy';
                          case 'modifiers': return 'AutoPlay';
                          case 'questions': return 'Add';
                          default: return 'Timer Settings';
                        }
                      }),
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF',
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
                          case 'timer': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('2035737657163790'))); // timer
                          case 'difficulty': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1138269638213533'))); // sentiment_neutral
                          case 'modifiers': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1320579906276560'))); // bolt
                          case 'questions': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('642575278900917'))); // remove icon
                          default: return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('794548760190405')));
                        }
                      }),
                      style: {
                        width: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'modifiers' ? 20 : 24),
                        height: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'modifiers' ? 20 : 24),

                        tintColor: '#FFFFFF'
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return '30 Seconds';
                          case 'difficulty': return 'Medium';
                          case 'modifiers': return 'Questions Only';
                          case 'questions': return 'Remove Question';
                          default: return 'Difficulty Levels';
                        }
                      }),
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF',
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
                          case 'timer': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1830264154592827'))); // more_time
                          case 'difficulty': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('712075511858553'))); // skull
                          case 'modifiers': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('3148012692041551'))); // all_inclusive
                          case 'questions': return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('823218936808494'))); // info icon
                          default: return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('789207380187265')));
                        }
                      }),
                      style: {
                        width: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'modifiers' ? 20 : 24),
                        height: ui.Binding.derive([this.infoPopupTypeBinding], (type) => type === 'modifiers' ? 20 : 24),
                        tintColor: '#FFFFFF'
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.infoPopupTypeBinding], (type) => {
                        switch (type) {
                          case 'timer': return '90 Seconds';
                          case 'difficulty': return 'Hard';
                          case 'modifiers': return 'Endless Mode';
                          case 'questions': return 'Question Count';
                          default: return 'Game Modes';
                        }
                      }),
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF',
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

  private renderAnswerSubmittedScreen(): ui.UINode {
    // Answer submitted screen displayed
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image based on selected answer
        ui.Image({
          source: ui.Binding.derive([this.selectedAnswerBinding], (selectedAnswer) => {
            // Map answer index to background image
            const backgroundImages = [
              '4164501203820285', // Red Triangle Screen (button index 0)
              '781053527999316',  // Blue Square Screen (button index 1)
              '1276483883806975', // Yellow Circle Screen (button index 2)
              '1029237235836066'  // Green Star Screen (button index 3)
            ];
            const answerIndex = selectedAnswer !== null ? selectedAnswer : 0;
            const imageId = backgroundImages[answerIndex] || backgroundImages[0];
            return ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(imageId)));
          }),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Top navigation bar
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
            ui.Pressable({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {
                this.showLogoutPopupBinding.set(true);
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

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        ),

        // Bottom status bar
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
                backgroundColor: '#191919',
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
                    color: '#FFFFFF',
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

  private renderLogoutPopup(): ui.UINode {
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
            backgroundColor: '#191919',
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
                paddingTop: 0,
                paddingBottom: 8,
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.isHostBinding, this.gameStartedBinding], (isHost, gameStarted) => {
                    if (isHost && gameStarted) {
                      return 'End game?';
                    } else {
                      return 'Are you sure?';
                    }
                  }),
                  style: {
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#ffffff',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Yes button (green)
            ui.View({
              style: {
                paddingBottom: 8,
                alignItems: 'center'
              },
              children: [
                ui.Pressable({
                  style: {
                    backgroundColor: '#16A34A',
                    borderRadius: 4,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    minWidth: 120,
                    alignItems: 'center'
                  },
                  onPress: () => this.handleLogoutConfirm(),
                  children: [
                    ui.Text({
                      text: 'Yes',
                      style: {
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#ffffff',
                        textAlign: 'center'
                      }
                    })
                  ]
                })
              ]
            }),

            // No button (red)
            ui.View({
              style: {
                alignItems: 'center'
              },
              children: [
                ui.Pressable({
                  style: {
                    backgroundColor: '#DC2626',
                    borderRadius: 4,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    minWidth: 120,
                    alignItems: 'center'
                  },
                  onPress: () => this.showLogoutPopupBinding.set(false),
                  children: [
                    ui.Text({
                      text: 'No',
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

  private handleLogoutConfirm(): void {
    const isHost = this.isHost();
    
    if (isHost) {

      
      // Send game reset event to end the game for all players
      this.sendNetworkBroadcastEvent(TriviaNetworkEvents.gameReset, {
        hostId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
      });
      
      // Navigate to pre-game screen
      this.currentViewMode = 'pre-game';
      this.currentViewModeBinding.set('pre-game');
      
      // Close the popup
      this.showLogoutPopupBinding.set(false);
      
      // Reset game state for this player
      this.gameStarted = false;
      this.gameStartedBinding.set(false);
      this.currentQuestionIndex = 0;
      this.currentQuestionIndexBinding.set(0);
      this.score = 0;
      this.scoreBinding.set(0);
      this.selectedAnswer = null;
      this.selectedAnswerBinding.set(null);
      this.showResult = false;
      this.showResultBinding.set(false);
      this.answerSubmitted = false;
      this.answerSubmittedBinding.set(false);
      
      // Host logout completed - game ended for all players
    } else {

      
      // Send logout event to TriviaGame to remove this player from active players
      this.sendNetworkBroadcastEvent(TriviaNetworkEvents.playerLogout, {
        playerId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
      });
      
      // Immediately set opted-out status to show opted-out screen
      this.isOptedOutBinding.set(true);
      this.currentOptedOutStatus = true;
      
      // Navigate to opted-out screen instead of pre-game
      this.currentViewMode = 'pre-game'; // Keep view mode as pre-game for other logic
      this.currentViewModeBinding.set('pre-game');
      
      // Close the popup
      this.showLogoutPopupBinding.set(false);
      
      // Reset game state for this player
      this.gameStarted = false;
      this.gameStartedBinding.set(false);
      this.currentQuestionIndex = 0;
      this.currentQuestionIndexBinding.set(0);
      this.score = 0;
      this.scoreBinding.set(0);
      this.selectedAnswer = null;
      this.selectedAnswerBinding.set(null);
      this.showResult = false;
      this.showResultBinding.set(false);
      this.answerSubmitted = false;
      this.answerSubmittedBinding.set(false);
      

    }
  }

  private handleTransferHostConfirm(): void {
    // Check if a player is selected
    if (!this.selectedPlayerForTransfer) {
      console.log('❌ No player selected for transfer');
      return;
    }
    
    console.log(`👑 Transferring host to player: ${this.selectedPlayerForTransfer}`);
    
    // Send host changed event to notify all players of the new host
    this.sendNetworkBroadcastEvent(TriviaNetworkEvents.hostChanged, {
      newHostId: this.selectedPlayerForTransfer,
      oldHostId: this.world.getLocalPlayer()?.id.toString() || 'unknown'
    });
    
    // Close the popup and clear selection
    this.showTransferHostPopupBinding.set(false);
    this.selectedPlayerForTransferBinding.set(null);
    this.selectedPlayerForTransfer = null;
    
    // Update local host status (this player is no longer host)
    this.currentHostStatus = false;
    this.isHostBinding.set(false);
    
    console.log('✅ Host transfer initiated');
    this.selectedAnswerBinding.set(null);
    this.showResult = false;
    this.showResultBinding.set(false);
    this.answerSubmitted = false;
    this.answerSubmittedBinding.set(false);
    
    // Transfer host completed - game ended for all players
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      },
      children: [
        // Full-screen background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('9783264971776963'))),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),

        // Top navigation bar - only show logout for hosts
        ui.UINode.if(
          this.isHostBinding.derive(isHost => isHost),
          ui.View({
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 8,
              zIndex: 12
            },
            children: [
              // Transfer Host icon container
              ui.Pressable({
                style: {
                  backgroundColor: '#191919',
                  borderRadius: 8,
                  padding: 1,
                  width: 32,
                  height: 32,
                  justifyContent: 'center',
                  alignItems: 'center'
                },
                onPress: () => {
                  // Refresh players list before showing popup
                  this.initializePlayersBinding();
                  this.showTransferHostPopupBinding.set(true);
                },
                children: [
                  ui.Image({
                    source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1325134306066406'))), // crown icon for transfer host
                    style: {
                      width: 24,
                      height: 24,
                      tintColor: '#F7CE23' // Golden color for crown
                    }
                  })
                ]
              })
            ]
          })
        ),

        // Header anchored to top - now fills full viewport height
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0, // Changed from 58 to 0 to fill viewport height
            flexDirection: 'column'
          },
          children: [
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
                  marginBottom: 8
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
            // Start Game button - only show for hosts
            ui.UINode.if(
              this.isHostBinding.derive(isHost => isHost),
              ui.Pressable({
                style: {
                  width: '100%',
                  height: 42,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#191919'
                },
                onPress: () => this.handleStartGame(),
                children: [
                  ui.Text({
                    text: 'Start Game',
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
            // Game Settings button - only show for hosts
            ui.UINode.if(
              this.isHostBinding.derive(isHost => isHost),
              ui.Pressable({
                style: {
                  width: '100%',
                  height: 42,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#191919',
                  marginTop: 8
                },
                onPress: () => this.currentViewModeBinding.set('game-settings'),
                children: [
                  ui.Text({
                    text: 'Game Settings',
                    style: {
                      fontSize: 18,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            )
          ]
        }),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        ),

        // Transfer Host pop-up
        ui.UINode.if(
          this.showTransferHostPopupBinding,
          this.renderTransferHostPopup()
        )
      ]
    });
  }

  private renderTransferHostPopup(): ui.UINode {
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
            backgroundColor: '#191919',
            borderRadius: 8,
            padding: 16,
            minWidth: 200,
            maxWidth: 280,
            maxHeight: '80%',
            marginHorizontal: 8
          },
          children: [
            // Title
            ui.View({
              style: {
                paddingBottom: 12,
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: 'Transfer Host',
                  style: {
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#ffffff',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Subtitle
            ui.View({
              style: {
                paddingBottom: 16,
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: 'Select a player to transfer host privileges to:',
                  style: {
                    fontSize: 12,
                    fontWeight: '400',
                    color: '#cccccc',
                    textAlign: 'center'
                  }
                })
              ]
            }),

            // Scrollable Players List
            ui.ScrollView({
              style: {
                maxHeight: 200,
                borderRadius: 4,
                backgroundColor: '#2a2a2a',
                marginBottom: 16
              },
              children: [
                // Show "No other players available" message when needed
                ui.UINode.if(
                  this.playersInWorldBinding.derive((players) => {
                    const currentPlayer = this.world.getLocalPlayer()?.id.toString();
                    const otherPlayers = players.filter(player => player.id !== currentPlayer);
                    return otherPlayers.length === 0;
                  }),
                  ui.View({
                    style: {
                      padding: 16,
                      alignItems: 'center'
                    },
                    children: [
                      ui.Text({
                        text: 'No other players available',
                        style: {
                          fontSize: 14,
                          fontWeight: '400',
                          color: '#888888',
                          textAlign: 'center'
                        }
                      })
                    ]
                  })
                ),
                
                // Create static slots for up to 10 players
                ...this.createTransferHostPlayerSlots()
              ]
            }),

            // Action buttons
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between'
              },
              children: [
                // Cancel button
                ui.Pressable({
                  style: {
                    backgroundColor: '#6B7280',
                    borderRadius: 4,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    flex: 1,
                    alignItems: 'center',
                    marginRight: 4
                  },
                  onPress: () => {
                    this.showTransferHostPopupBinding.set(false);
                    this.selectedPlayerForTransferBinding.set(null);
                    this.selectedPlayerForTransfer = null;
                  },
                  children: [
                    ui.Text({
                      text: 'Cancel',
                      style: {
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#ffffff',
                        textAlign: 'center'
                      }
                    })
                  ]
                }),

                // Transfer button
                ui.Pressable({
                  style: {
                    backgroundColor: this.selectedPlayerForTransferBinding.derive(selected => 
                      selected ? '#DC2626' : '#555555'
                    ),
                    borderRadius: 4,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    flex: 1,
                    alignItems: 'center',
                    marginLeft: 4
                  },
                  onPress: () => this.handleTransferHostConfirm(),
                  children: [
                    ui.Text({
                      text: 'Transfer',
                      style: {
                        fontSize: 14,
                        fontWeight: '600',
                        color: this.selectedPlayerForTransferBinding.derive(selected => 
                          selected ? '#ffffff' : '#888888'
                        ),
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

  private createTransferHostPlayerSlots(): ui.UINode[] {
    // Create static slots for up to 10 players that will reactively show/hide based on current players
    const maxSlots = 10;
    const components: ui.UINode[] = [];
    
    for (let i = 0; i < maxSlots; i++) {
      const slotIndex = i; // Capture the index for the closure
      components.push(
        ui.UINode.if(
          this.playersInWorldBinding.derive((players) => {
            const currentPlayer = this.world.getLocalPlayer()?.id.toString();
            const otherPlayers = players.filter(player => player.id !== currentPlayer);
            return slotIndex < otherPlayers.length;
          }),
          ui.Pressable({
            style: {
              padding: 12,
              backgroundColor: this.selectedPlayerForTransferBinding.derive((selected) => {
                // Use the original playersInWorld array to match against selection
                const currentPlayer = this.world.getLocalPlayer()?.id.toString();
                const otherPlayers = this.playersInWorld.filter(playerId => playerId !== currentPlayer);
                if (slotIndex < otherPlayers.length) {
                  const playerId = otherPlayers[slotIndex];
                  return selected === playerId ? '#3B82F6' : 'transparent';
                }
                return 'transparent';
              }),
              marginBottom: 1
            },
            onPress: () => {
              // Use the original playersInWorld array to get player IDs
              const currentPlayer = this.world.getLocalPlayer()?.id.toString();
              const otherPlayers = this.playersInWorld.filter(playerId => playerId !== currentPlayer);
              if (slotIndex < otherPlayers.length) {
                const playerId = otherPlayers[slotIndex];
                this.selectedPlayerForTransferBinding.set(playerId);
                this.selectedPlayerForTransfer = playerId;
              }
            },
            children: [
              ui.Text({
                text: this.playersInWorldBinding.derive((players) => {
                  const currentPlayer = this.world.getLocalPlayer()?.id.toString();
                  const otherPlayers = players.filter(player => player.id !== currentPlayer);
                  if (slotIndex < otherPlayers.length) {
                    return otherPlayers[slotIndex].name;
                  }
                  return '';
                }),
                style: {
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#ffffff',
                  textAlign: 'left'
                }
              })
            ]
          })
        )
      );
    }
    
    return components;
  }

  private renderStatusBar(): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 12,
        marginBottom: 13,
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: [0, 2],
      },
      children: [
        ui.Text({
          text: ui.Binding.derive([this.currentQuestionIndexBinding, this.gameSettingsBinding, this.updateFooterBinding], (index, settings, shouldUpdate) => {
            // Update the question number when the next question button is clicked
            if (shouldUpdate) {
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
    const shape = TriviaAssetManager.ANSWER_SHAPES[answerIndex];

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
        shadowColor: 'black',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: [0, 3],
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
            tintColor: '#FFFFFF'
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

        // Top navigation bar
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
            ui.Pressable({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {
                // Logout icon pressed
                this.showLogoutPopupBinding.set(true);
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1997295517705951'))), // logout icon
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
                // Full-width red triangle button
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#DC2626',
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => {
                    this.handleAnswerSelect(0);
                  },
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
                // Full-width blue square button
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#2563EB',
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => {
                    this.handleAnswerSelect(1);
                  },
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

        // Bottom status bar
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
                backgroundColor: '#191919',
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
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        )
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

        // Top navigation bar
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
            ui.Pressable({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {
                this.showLogoutPopupBinding.set(true);
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('804799288656881'))), // settings icon
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

        // Answer buttons grid
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
                // Top-left button (Red Triangle - Option 1)
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#DC2626',
                    borderRadius: 16,
                    marginRight: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => {
                    this.handleAnswerSelect(0);
                  },
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

                // Top-right button (Blue Square - Option 2)
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#2563EB',
                    borderRadius: 16,
                    marginLeft: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => {
                    this.handleAnswerSelect(1);
                  },
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
                // Bottom-left button (Yellow Circle - Option 3)
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#EAB308',
                    borderRadius: 16,
                    marginRight: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => {
                    this.handleAnswerSelect(2);
                  },
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

                // Bottom-right button (Green Star - Option 4)
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#16A34A',
                    borderRadius: 16,
                    marginLeft: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowOffset: [0, 0],
                    shadowRadius: 9.6,
                    shadowColor: 'rgba(0, 0, 0, 0.21)',
                    shadowOpacity: 1
                  },
                  onPress: () => {
                    this.handleAnswerSelect(3);
                  },
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

        // Bottom status bar
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
                backgroundColor: '#191919',
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
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        )
      ]
    });
  }



  private renderParticipantCorrectResults(): ui.UINode {
    // Participant correct results screen displayed
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1418913812533291'))),
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
            ui.Pressable({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {
                this.showLogoutPopupBinding.set(true);
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('804799288656881'))), // settings icon
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

        // Checkmark container - centered
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 136,
            height: 136,
            marginTop: -68, // Half of height to center vertically
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

        // Text message between checkmark and bottom bar
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            marginTop: 68, // Position below the checkmark container
            paddingHorizontal: 16,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.lastRoundPointsBinding], (points) => `+${points} points!`),
              style: {
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center'
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
                backgroundColor: '#191919',
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
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        )
      ]
    });
  }

  private renderParticipantWrongResults(): ui.UINode {
    // Participant wrong results screen displayed
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('792752243300401'))),
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
            ui.Pressable({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {
                this.showLogoutPopupBinding.set(true);
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('804799288656881'))), // settings icon
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

        // Close icon container - centered
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 136,
            height: 136,
            marginTop: -68, // Half of height to center vertically
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

        // Text message between close icon and bottom bar
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            marginTop: 68, // Position below the close icon container
            paddingHorizontal: 16,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.lastRoundPointsBinding], (points) => `+${points} points!`),
              style: {
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center'
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
                backgroundColor: '#191919',
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
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        )
      ]
    });
  }

  private renderHostCorrectResults(): ui.UINode {
    // Host correct results screen displayed
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1418913812533291'))),
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
            ui.Pressable({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {
                this.showLogoutPopupBinding.set(true);
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('804799288656881'))), // settings icon
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

        // Checkmark container - centered
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 136,
            height: 136,
            marginTop: -68, // Half of height to center vertically
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

        // Text message between checkmark and bottom bar
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            marginTop: 68, // Position below the checkmark container
            paddingHorizontal: 16,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.lastRoundPointsBinding], (points) => `+${points} points!`),
              style: {
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center'
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
            // Show Next Question button when leaderboard is shown, otherwise show status bar
            ui.UINode.if(
              this.showLeaderboardBinding,
              ui.Pressable({
                style: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#191919',
                  borderRadius: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 8
                },
                onPress: () => {
                  // Handle next question logic
                  this.nextQuestion();
                },
                children: [
                  ui.Text({
                    text: 'Next Question',
                    style: {
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      flex: 1
                    }
                  }),
                  ui.Image({
                    source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1806442143313699'))), // arrow_forward
                    style: {
                      width: 24,
                      height: 24,
                      tintColor: '#FFFFFF'
                    }
                  })
                ]
              })
            ),
            // Show status bar when leaderboard is not shown
            ui.UINode.if(
              this.showLeaderboardBinding.derive(showLeaderboard => !showLeaderboard),
              ui.Pressable({
                style: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#191919',
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
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            )
          ]
        }),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        )
      ]
    });
  }

  private renderHostWrongResults(): ui.UINode {
    // Host wrong results screen displayed
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('792752243300401'))),
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
            ui.Pressable({
              style: {
                backgroundColor: '#191919',
                borderRadius: 8,
                padding: 1,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {
                this.showLogoutPopupBinding.set(true);
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('804799288656881'))), // settings icon
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

        // Close icon container - centered
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 136,
            height: 136,
            marginTop: -68, // Half of height to center vertically
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

        // Text message between close icon and bottom bar
        ui.View({
          style: {
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            marginTop: 68, // Position below the close icon container
            paddingHorizontal: 16,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.lastRoundPointsBinding], (points) => `+${points} points!`),
              style: {
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center'
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
            // Show Next Question button when leaderboard is shown, otherwise show status bar
            ui.UINode.if(
              this.showLeaderboardBinding,
              ui.Pressable({
                style: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#191919',
                  borderRadius: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 8
                },
                onPress: () => {
                  // Handle next question logic
                  this.nextQuestion();
                },
                children: [
                  ui.Text({
                    text: 'Next Question',
                    style: {
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      textAlign: 'center',
                      flex: 1
                    }
                  }),
                  ui.Image({
                    source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1806442143313699'))), // arrow_forward
                    style: {
                      width: 24,
                      height: 24,
                      tintColor: '#FFFFFF'
                    }
                  })
                ]
              })
            ),
            // Show status bar when leaderboard is not shown
            ui.UINode.if(
              this.showLeaderboardBinding.derive(showLeaderboard => !showLeaderboard),
              ui.Pressable({
                style: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#191919',
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
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            )
          ]
        }),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        )
      ]
    });
  }

  private renderOptedOutScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        position: 'relative'
      },
      children: [
        // Background image - using a neutral gray background
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt('1357119322709193'))),
          style: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
          }
        }),





        // Bottom status bar
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
                backgroundColor: '#22C55E', // Green color for Join Game button
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => {
                this.handleRejoinGame();
              },
              children: [
                ui.Text({
                  text: 'Join Game',
                  style: {
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Logout pop-up
        ui.UINode.if(
          this.showLogoutPopupBinding,
          this.renderLogoutPopup()
        )
      ]
    });
  }

  // Public method to handle preview mode transitions (can be called externally)
  public onPreviewModeTransition(): void {
    this.handlePreviewModeTransition();
  }

  // Enhanced method to handle preview mode transitions
  private handlePreviewModeTransition(): void {
    
    // Reset all game state to initial values
    this.gameStarted = false;
    this.gameEnded = false;
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
    this.currentQuestionBinding.set(null);
    this.score = 0;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    // Reset all bindings
    this.gameStartedBinding.set(false);
    this.gameEndedBinding.set(false);
    this.currentQuestionIndexBinding.set(0);
    this.scoreBinding.set(0);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.answerSubmittedBinding.set(false);
    this.isCorrectAnswerBinding.set(false);
    this.correctAnswerIndexBinding.set(null);
    
    // Reset layout and screen types
    this.layoutTypeBinding.set('four-options');
    this.currentScreenType = 'waiting';
    this.screenTypeBinding.set('waiting');
    this.lastQuestionType = 'four-options';
    
    // Reset view mode
    this.currentViewMode = 'pre-game';
    this.currentViewModeBinding.set('pre-game');
    
    // Reset host status
    this.currentHostStatus = this.isHost();
    this.isHostBinding.set(this.currentHostStatus);
    
    // Reset info popup
    this.showInfoPopupBinding.set(false);
    
    // Clear leaderboard data
    this.leaderboardDataBinding.set([]);
    
    // Reset stable question index
    this.stableQuestionIndex = 0;
    this.updateFooterBinding.set(false);
    
    // Preview mode transition cleanup completed successfully
  }
}

// Register the component for Horizon Worlds
ui.UIComponent.register(TriviaPhone);
