import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import * as camera from 'horizon/camera';
import { Social, AvatarImageType } from 'horizon/social';

// Network events for trivia
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');
const triviaGameStartEvent = new hz.NetworkEvent<{ hostId: string, config: { timeLimit: number, category: string, difficulty: string, numQuestions: number } }>('triviaGameStart');
const triviaNextQuestionEvent = new hz.NetworkEvent<{ playerId: string }>('triviaNextQuestion');
const triviaGameRegisteredEvent = new hz.NetworkEvent<{ isRunning: boolean, hasQuestions: boolean }>('triviaGameRegistered');
const triviaAnswerSubmittedEvent = new hz.NetworkEvent<{ playerId: string, answerIndex: number, responseTime: number }>('triviaAnswerSubmitted');
const triviaSettingsUpdateEvent = new hz.NetworkEvent<{ hostId: string, settings: { numberOfQuestions: number, category: string, difficulty: string, timeLimit: number, autoAdvance: boolean, muteDuringQuestions: boolean, isLocked: boolean } }>('triviaSettingsUpdate');
const triviaGameEndEvent = new hz.NetworkEvent<{ hostId: string, finalLeaderboard?: Array<{name: string, score: number, playerId: string}> }>('triviaGameEnd');
const triviaGameResetEvent = new hz.NetworkEvent<{ hostId: string }>('triviaGameReset');

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

// Network event for keyboard input from separate KeyboardInputHandler (fallback)
const mePhoneKeyboardTriggerEvent = new hz.NetworkEvent<{ playerId: string }>('mePhoneKeyboardTrigger');

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

  // Player ownership tracking
  private assignedPlayer: hz.Player | null = null;
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
    numberOfQuestions: 1,
    category: 'General',
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
  private selectedAnswerBinding = new ui.Binding<number | null>(null);
  private showResultBinding = new ui.Binding(false);
  private gameStartedBinding = new ui.Binding(false);
  private gameEndedBinding = new ui.Binding(false);
  private isCorrectAnswerBinding = new ui.Binding(false);
  private correctAnswerIndexBinding = new ui.Binding<number | null>(null);
  private showLeaderboardBinding = new ui.Binding(false);
  private answerSubmittedBinding = new ui.Binding(false);

  // Game settings bindings
  private gameSettingsBinding = new ui.Binding(this.gameSettings);
  private currentViewModeBinding = new ui.Binding<'pre-game' | 'game-settings'>('pre-game');

  constructor() {
    super();
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
    // Alternative polling approach: Check if UI is still visible/active
    if (this.assignedPlayer) {
      try {
        // Check if the TriviaPhone entity is still visible (as an indicator of UI focus)
        const isVisible = this.entity.visible.get();

        // If the TriviaPhone was visible but is no longer visible, trigger restoration
        if (this.isPlayerFocusedOnUI && !isVisible) {
          // Mark that the player is no longer focused on the UI
          this.isPlayerFocusedOnUI = false;
        }

        // Keep VR phone positioned and ensure bottom points down
        if (this.assignedPlayer.deviceType.get() === hz.PlayerDeviceType.VR && isVisible) {
          // Check if phone is currently "hidden" at y=0 (don't reposition if hidden)
          const currentPosition = this.entity.position.get();
          if (currentPosition.y === 0) {
            return; // Don't reposition if hidden
          }

          // Disable physics/simulation
          this.entity.simulated.set(false);
          this.entity.collidable.set(false);

          // Maintain position 1 unit in front and 0.25 units to the left of player
          const playerPosition = this.assignedPlayer.position.get();
          const playerForward = this.assignedPlayer.forward.get();
          const playerLeft = playerForward.cross(hz.Vec3.up).normalize();
          const desiredPosition = playerPosition
            .add(playerForward.mul(1.0))
            .add(playerLeft.mul(-0.25)); // Negative for left
          desiredPosition.y += 0.4;
          // Allow Z position to change based on user location
          this.entity.position.set(desiredPosition);

          // Calculate direction to player and set rotation manually
          const playerPos = this.assignedPlayer.position.get();
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
    // Listen for trivia question show events
    this.connectNetworkBroadcastEvent(triviaQuestionShowEvent, (eventData) => {
      this.syncWithExternalTrivia(eventData);
    });

    // Listen for trivia results events
    this.connectNetworkBroadcastEvent(triviaResultsEvent, (eventData) => {
      this.onTriviaResults(eventData);
    });

    // Listen for trivia game start events
    this.connectNetworkBroadcastEvent(triviaGameStartEvent, (eventData) => {
      this.startGame();
    });

    // Listen for trivia game registration events
    this.connectNetworkBroadcastEvent(triviaGameRegisteredEvent, (eventData) => {
      // Registration event received
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

      // Set up E key input for hiding TriviaPhone when focused
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightGrip)) {
        this.eKeyInputConnection = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.RightGrip,
          hz.ButtonIcon.None,
          this,
          { preferredButtonPlacement: hz.ButtonPlacement.Default }
        );

        this.eKeyInputConnection.registerCallback((action, pressed) => {
          if (pressed) {
            // Handle E key trigger - hide TriviaPhone if player is focused on UI
            this.handleEKeyTrigger(localPlayer);
          }
        });

      } else {
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

    // For VR users, check if y position is 0 instead of distance
    const isVRUser = player.deviceType.get() === hz.PlayerDeviceType.VR;
    const shouldShow = isVRUser ? (phonePosition.y === 0) : (phonePosition.distance(playerPosition) > 10);

    if (shouldShow) {
      // Phone is hidden (y=0 for VR, or >10 units away for others), teleport it in front of the user

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

    // If phone is not assigned to anyone, assign it to this player
    if (!this.assignedPlayer) {
      this.initializeForPlayer(player);
    } else if (this.assignedPlayer.id !== player.id) {
      // If phone is assigned to someone else, reassign it to this player
      this.assignedPlayer = player;
    }

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

  onPlayerAssigned(player: hz.Player) {
    this.assignedPlayer = player;
    this.isInitialized = true;

    // Use VR-specific teleport method for VR users, regular method for others
    if (player.deviceType.get() === hz.PlayerDeviceType.VR) {
      this.teleportDirectlyInFrontOfVRUser(player);
    } else {
      this.teleportToPlayer(player);
    }
  }

  onPlayerUnassigned(player: hz.Player) {
    this.assignedPlayer = null;
    this.isInitialized = false;

    // Clear stored camera state
    this.cameraPositionAtHKeyPress = null;
    this.cameraRotationAtHKeyPress = null;

    // Hide the TriviaPhone when unassigned
    this.hideTriviaPhone();

    // Return to original position
    if (this.originalPosition) {
      this.entity.position.set(this.originalPosition.clone());
    }
  }

  public initializeForPlayer(player: hz.Player) {
    this.assignedPlayer = player;
    this.isInitialized = true;
  }

  public releaseTriviaPhone(): void {
    if (this.assignedPlayer) {
      this.onPlayerUnassigned(this.assignedPlayer);
    }
  }

  public unfocusAndHide(): void {
    if (this.assignedPlayer) {
      const playerId = this.assignedPlayer.id;

      // Explicitly hide the TriviaPhone after a short delay to ensure unfocus completes
      this.async.setTimeout(() => {
        this.hideTriviaPhone();
      }, 50);
    }
  }

  public checkAndHideIfUnfocused(): void {
    if (this.assignedPlayer) {
      // For now, just hide it since we can't easily check focus state
      // This method can be called externally when unfocus is suspected
      this.hideTriviaPhone();
    }
  }

  public isFollowing(): boolean {
    return this.assignedPlayer !== null;
  }

  public getAssignedPlayer(): hz.Player | null {
    return this.assignedPlayer;
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
    // If no one has claimed this phone yet, anyone can use it
    if (!this.assignedPlayer) {
      return true;
    }

    // Otherwise, only the assigned player can use it
    return this.assignedPlayer === player;
  }

  private isHost(): boolean {
    // The host is the first player in the world (player with index 0)
    const localPlayer = this.world.getLocalPlayer();
    if (!localPlayer) return false;

    const allPlayers = this.world.getPlayers();
    if (allPlayers.length === 0) return false;

    // Check if local player is the first player (host)
    return allPlayers[0].id === localPlayer.id;
  }

  private handleStartGame(): void {
    if (!this.isHost()) return;

    // Send network event to start the game for all players with configured settings
    this.sendNetworkBroadcastEvent(triviaGameStartEvent, {
      hostId: this.assignedPlayer?.id.toString() || 'host',
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
  }

  private syncWithExternalTrivia(questionData: { question: any, questionIndex: number, timeLimit: number }): void {
    this.currentQuestionIndex = questionData.questionIndex;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    this.currentQuestionIndexBinding.set(questionData.questionIndex);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.isCorrectAnswerBinding.set(false);
    this.correctAnswerIndexBinding.set(null);
    this.answerSubmittedBinding.set(false);
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
    
    // Store the correct answer index
    this.correctAnswerIndexBinding.set(eventData.correctAnswerIndex);

    // Check if player's answer was correct
    const isCorrect = this.selectedAnswer === eventData.correctAnswerIndex;
    this.isCorrectAnswerBinding.set(isCorrect);
    
    if (isCorrect) {
      this.score++;
      this.scoreBinding.set(this.score);
    }

    // Update leaderboard binding
    this.showLeaderboardBinding.set(eventData.showLeaderboard || false);
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
    switch (event.gameState) {
      case 'waiting':
        this.gameStarted = false;
        this.gameStartedBinding.set(false);
        break;
      case 'playing':
        this.gameStarted = true;
        this.gameStartedBinding.set(true);
        if (event.currentQuestion) {
          this.syncWithExternalTrivia({
            question: event.currentQuestion,
            questionIndex: event.questionIndex || 0,
            timeLimit: event.timeLimit || this.gameSettings.timeLimit
          });
        }
        break;
      case 'results':
        this.showResult = true;
        this.showResultBinding.set(true);
        break;
      case 'ended':
        this.gameStarted = false;
        this.gameStartedBinding.set(false);
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
    
    // Clear current question data
    this.currentQuestion = null;
    
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

    // Reset all game state to pre-game
    this.gameStarted = false;
    this.gameStartedBinding.set(false);
    this.gameEndedBinding.set(false); // Clear ended state
    this.showResult = false;
    this.showResultBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.selectedAnswer = null;
    this.selectedAnswerBinding.set(null);
    this.currentQuestionIndex = 0;
    this.currentQuestionIndexBinding.set(0);
    this.answerSubmitted = false;
    this.answerSubmittedBinding.set(false);
    
    // Clear current question data
    this.currentQuestion = null;
    
    // Reset to pre-game view mode
    this.currentViewModeBinding.set('pre-game');
  }

  private endGame(): void {
    if (!this.isHost()) {
      return;
    }

    // Send reset event to TriviaGame and all TriviaPhones
    this.sendNetworkBroadcastEvent(triviaGameResetEvent, {
      hostId: this.assignedPlayer?.id.toString() || 'unknown'
    });
  }

  private handleAnswerSelect(answerIndex: number): void {
    if (this.showResult) return;

    this.selectedAnswer = answerIndex;
    this.selectedAnswerBinding.set(answerIndex);
    this.answerSubmitted = true;
    this.answerSubmittedBinding.set(true);

    // Send network event
    this.sendNetworkBroadcastEvent(triviaAnswerSubmittedEvent, {
      playerId: this.assignedPlayer?.id.toString() || 'local',
      answerIndex: answerIndex,
      responseTime: 0
    });
  }

  private nextQuestion(): void {
    this.currentQuestionIndex++;
    this.selectedAnswer = null;
    this.showResult = false;
    this.answerSubmitted = false;

    this.currentQuestionIndexBinding.set(this.currentQuestionIndex);
    this.selectedAnswerBinding.set(null);
    this.showResultBinding.set(false);
    this.showLeaderboardBinding.set(false);
    this.answerSubmittedBinding.set(false);

    // Send next question event
    this.sendNetworkBroadcastEvent(triviaNextQuestionEvent, {
      playerId: this.assignedPlayer?.id.toString() || 'host'
    });
  }

  private resetGame(): void {
    this.gameStarted = false;
    this.currentQuestionIndex = 0;
    this.currentQuestion = null;
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
      hostId: this.assignedPlayer?.id.toString() || 'host',
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
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
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                overflow: 'hidden'
              },
              children: [
                // Trivia game content
                ui.UINode.if(
                  ui.Binding.derive([this.currentViewModeBinding], (mode) => mode === 'pre-game'),
                  this.renderTriviaGame()
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

  private renderTriviaGame(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: ui.Binding.derive([
          this.showResultBinding,
          this.isCorrectAnswerBinding,
          this.answerSubmittedBinding
        ], (showResult, isCorrect, answerSubmitted) => {
          if (showResult) {
            return isCorrect ? '#22C55E' : '#EF4444'; // Green for correct, red for wrong
          }
          if (answerSubmitted) {
            return '#F59E0B'; // Orange for answer submitted
          }
          return '#6366F1'; // Default blue
        }),
        flexDirection: 'column'
      },
      children: [
        // Show feedback screen when results are being displayed
        ui.UINode.if(
          ui.Binding.derive([this.showResultBinding], (showResult) => showResult),
          ui.View({
            style: {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16
            },
            children: [
              // Large emoji icon
              ui.Text({
                text: ui.Binding.derive([
                  this.isCorrectAnswerBinding
                ], (isCorrect) => {
                  return isCorrect ? '✅' : '❌';
                }),
                style: {
                  fontSize: 80,
                  textAlign: 'center',
                  marginBottom: 16
                }
              }),
              
              // "Correct!" or "Wrong!" text
              ui.Text({
                text: ui.Binding.derive([
                  this.isCorrectAnswerBinding
                ], (isCorrect) => {
                  return isCorrect ? 'Correct!' : 'Wrong!';
                }),
                style: {
                  fontSize: 32,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginBottom: 12
                }
              }),

              // Show the question text
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

              // Show correct answer if wrong
              ui.UINode.if(
                ui.Binding.derive([this.isCorrectAnswerBinding], (isCorrect) => !isCorrect),
                ui.Text({
                  text: ui.Binding.derive([
                    this.correctAnswerIndexBinding
                  ], (correctIndex) => {
                    if (correctIndex !== null && this.currentQuestion && this.currentQuestion.answers[correctIndex]) {
                      return `Correct answer: ${this.currentQuestion.answers[correctIndex].text}`;
                    }
                    return '';
                  }),
                  numberOfLines: 2,
                  style: {
                    fontSize: 16,
                    color: '#FFFFFF',
                    textAlign: 'center',
                    opacity: 0.8,
                    lineHeight: 22
                  }
                })
              ),

              // Next Question button - only show for host during active game when leaderboard is displayed (not last question)
              ui.UINode.if(
                ui.Binding.derive([this.showLeaderboardBinding, this.gameStartedBinding, this.gameEndedBinding, this.currentQuestionIndexBinding, this.gameSettingsBinding], 
                  (showLeaderboard, gameStarted, gameEnded, currentIndex, settings) => 
                    showLeaderboard && gameStarted && !gameEnded && this.isHost() && (currentIndex + 1) < settings.numberOfQuestions
                ),
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginTop: 16,
                    alignSelf: 'center'
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
                })
              ),

              // End Game button - only show for host when on last question or when game has ended
              ui.UINode.if(
                ui.Binding.derive([this.showLeaderboardBinding, this.gameStartedBinding, this.gameEndedBinding, this.currentQuestionIndexBinding, this.gameSettingsBinding], 
                  (showLeaderboard, gameStarted, gameEnded, currentIndex, settings) => 
                    showLeaderboard && gameStarted && !gameEnded && this.isHost() && (currentIndex + 1) >= settings.numberOfQuestions
                ),
                ui.Pressable({
                  style: {
                    backgroundColor: '#FF6B35',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginTop: 16,
                    alignSelf: 'center'
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
                })
              )
            ]
          })
        ),

        // Show answer submitted screen when answer is submitted but waiting for others
        ui.UINode.if(
          ui.Binding.derive([this.answerSubmittedBinding, this.showResultBinding], (answerSubmitted, showResult) => answerSubmitted && !showResult),
          ui.View({
            style: {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16
            },
            children: [
              // Large checkmark icon
              ui.Text({
                text: '✅',
                style: {
                  fontSize: 80,
                  textAlign: 'center',
                  marginBottom: 16
                }
              }),
              
              // "Answer Submitted!" text
              ui.Text({
                text: 'Answer Submitted!',
                style: {
                  fontSize: 32,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginBottom: 12
                }
              }),

              // Waiting message
              ui.Text({
                text: 'Waiting for other players...',
                style: {
                  fontSize: 18,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  opacity: 0.9
                }
              })
            ]
          })
        ),

        // Show normal game content when NOT showing results and answer not submitted
        ui.UINode.if(
          ui.Binding.derive([this.showResultBinding, this.answerSubmittedBinding], (showResult, answerSubmitted) => !showResult && !answerSubmitted),
          ui.View({
            style: {
              flex: 1,
              padding: 8,
              paddingBottom: 12
            },
            children: [
            // Waiting for game screen
            ui.UINode.if(
              ui.Binding.derive([this.gameStartedBinding], (started) => !started),
              ui.View({
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
                        text: ui.Binding.derive([], () => this.isHost() ? '👑 You are the Host' : '👤 You are a Participant'),
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
                    ui.Binding.derive([], () => this.isHost()),
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
                    ui.Binding.derive([], () => !this.isHost()),
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
              })
            ),

              // Game screen
              ui.UINode.if(
                ui.Binding.derive([this.gameStartedBinding], (started) => started),
                ui.View({
                  style: {
                    flex: 1,
                    flexDirection: 'column'
                  },
                  children: [
                    // Answer buttons container
                    ui.View({
                      style: {
                        flex: 1,
                        flexDirection: 'column',
                        padding: 4
                      },
                      children: [
                        // Top row (buttons 0 and 1)
                        ui.View({
                          style: {
                            flexDirection: 'row',
                            flex: 1,
                            marginBottom: 2
                          },
                          children: [
                            this.createAnswerButton(0),
                            this.createAnswerButton(1)
                          ]
                        }),
                        // Bottom row (buttons 2 and 3)
                        ui.View({
                          style: {
                            flexDirection: 'row',
                            flex: 1,
                            marginTop: 2
                          },
                          children: [
                            this.createAnswerButton(2),
                            this.createAnswerButton(3)
                          ]
                        })
                      ]
                    })
                  ]
                })
              )
            ]
          })
        ),

        // Bottom status bar
        ui.View({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.currentQuestionIndexBinding], (index) =>
                `Question ${index + 1}`
              ),
              style: {
                fontSize: 12,
                color: '#6B7280'
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

  private createAnswerButton(answerIndex: number): ui.UINode {
    const shape = answerShapes[answerIndex];

    return ui.Pressable({
      style: {
        flex: 1,
        backgroundColor: ui.Binding.derive([
          this.showResultBinding,
          this.selectedAnswerBinding,
          this.currentQuestionIndexBinding
        ], (showResult, selectedAnswer, questionIndex) => {
          if (showResult && this.currentQuestion) {
            const correctIndex = this.currentQuestion.answers.findIndex((answer: any) => answer.correct);
            const isCorrect = answerIndex === correctIndex;
            const isSelected = answerIndex === selectedAnswer;

            if (isCorrect) return '#22C55E'; // Green for correct
            if (isSelected && !isCorrect) return '#EF4444'; // Red for wrong selection
            return '#9CA3AF'; // Gray for other answers
          }
          return shape.color;
        }),
        borderRadius: 12,
        margin: 2,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 150,
        padding: 8
      },
      onPress: () => this.handleAnswerSelect(answerIndex),
      children: [
        ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(shape.iconId))),
          style: {
            width: 60,
            height: 60,
            tintColor: '#FFFFFF',
            ...(shape.rotation ? { transform: [{ rotate: `${shape.rotation}deg` }] } : {})
          }
        })
      ]
    });
  }
}

// Register the component for Horizon Worlds
ui.UIComponent.register(TriviaPhone);
