import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import * as camera from 'horizon/camera';
import { Social, AvatarImageType } from 'horizon/social';

// Network events for trivia
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');
const triviaGameStartEvent = new hz.NetworkEvent<{ hostId: string, config: { timeLimit: number, category: string, difficulty: string, numQuestions: number } }>('triviaGameStart');
const triviaNextQuestionEvent = new hz.NetworkEvent<{ playerId: string }>('triviaNextQuestion');

// Network event for keyboard input from separate KeyboardInputHandler (fallback)
const mePhoneKeyboardTriggerEvent = new hz.NetworkEvent<{ playerId: string }>('mePhoneKeyboardTrigger');

// Import all the app classes
import { TriviaApp } from './TriviaApp';
import { MeChatApp } from './MeChatApp';
import { ContactsApp } from './ContactsApp';
import { MePayApp } from './MePayApp';
import { CalculatorApp } from './CalculatorApp';
import { SettingsApp } from './SettingsApp';

class MePhone extends ui.UIComponent<typeof MePhone> {
  static propsDefinition = {};

  // MePhone - A mobile phone interface that positions exactly at the camera location
  // Features:
  // - Player ownership system with H key assignment
  // - Positions exactly at the camera's location and orientation when H is pressed
  // - Rotates to face towards the user's viewport (opposite of camera direction)
  // - Automatically restores camera position and rotation when leaving UI interaction
  // - Returns to original position when unassigned
  // - Multiple apps: Trivia, Messages, Contacts, Calculator, Settings
  // - UI focus support with 100ms delay for position changes and instant focus (duration: 0)
  // - Automatically hides when UI loses focus and shows when focused
  // - Provides methods to explicitly hide/show the MePhone (forceHide(), forceShow(), unfocusAndHide(), handleExternalUnfocus())

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
  private inputConnection: hz.PlayerInput | null = null;
  private eKeyInputConnection: hz.PlayerInput | null = null;

  // State management for current app - PLAYER SPECIFIC
  private currentAppBinding = new ui.Binding('home');

  // Derived bindings for conditional rendering
  private isHomeBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'home');
  private isTriviaAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'trivia');
  private isMessagesAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'messages');
  private isContactsAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'contacts');
  private isMePayAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'mepay');
  private isCalculatorAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'calculator');
  private isSettingsAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'settings');

  // App instances - one per app type
  private triviaApp = new TriviaApp(this.world, (event, data) => this.sendNetworkBroadcastEvent(event, data), this.async);
  private messagesApp = new MeChatApp();
  private contactsApp: ContactsApp | null = null; // Initialize lazily
  private mePayApp = new MePayApp();
  private calculatorApp = new CalculatorApp();
  private settingsApp = new SettingsApp();

  constructor() {
    super();
  }

  async start() {
    this.setupNetworkEvents();
    this.setupKeyboardInput();
    
    // Store the original position when the component starts
    this.originalPosition = this.entity.position.get().clone();
  }

  // Position the MePhone exactly at the camera's position and orientation (where the user is looking)
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

      // Position the MePhone in front of the camera with forward offset
      // This ensures the MePhone appears in front of where the user is looking
      const forwardOffset = 2.5; // Move 2.5 units forward from camera position (increased from 1.5)
      const desiredPosition = cameraPosition.add(cameraForward.mul(forwardOffset));

      // Update the MePhone's position to match the camera's position with forward offset
      this.entity.position.set(desiredPosition);

      // Make the MePhone face the opposite direction of the camera (towards the user's viewport)
      const faceOppositeRotation = hz.Quaternion.fromAxisAngle(hz.Vec3.up, Math.PI); // 180 degrees around Y-axis
      const finalRotation = cameraRotation.mul(faceOppositeRotation);
      this.entity.rotation.set(finalRotation);

    } catch (error) {
      // Fallback to player position if camera access fails
      this.teleportToPlayerFallback(player);
    }
  }

  // Fallback method to teleport to player position if camera access fails
  private teleportToPlayerFallback(player: hz.Player): void {
    try {
      // Get the player's current position
      const playerPosition = player.position.get();

      // Calculate the desired position for the MePhone (player position + offset)
      // Offset: (0, 0.3, 1.0) = slightly above and 1 unit in front of player
      const desiredPosition = playerPosition.add(this.followOffset);

      // Update the MePhone's position to the player's location
      this.entity.position.set(desiredPosition);

      // Make the MePhone face the player (rotate 180 degrees from player's direction)
      const playerRotation = player.rotation.get();
      const facePlayerRotation = hz.Quaternion.fromAxisAngle(hz.Vec3.up, Math.PI); // 180 degrees around Y-axis
      const finalRotation = playerRotation.mul(facePlayerRotation);
      this.entity.rotation.set(finalRotation);

    } catch (error) {
    }
  }

  // Stop following the player (legacy method, now just logs)
  private stopFollowingPlayer(): void {
  }

  // Update method called every frame - using alternative polling approach
  update(dt: number) {
    // Alternative polling approach: Check if UI is still visible/active
    if (this.assignedPlayer) {
      try {
        // Check if the MePhone entity is still visible (as an indicator of UI focus)
        const isVisible = this.entity.visible.get();

        // If the MePhone was visible but is no longer visible, trigger restoration
        if (this.isPlayerFocusedOnUI && !isVisible) {

          // Restore the camera position and rotation to what it was when the user started the interaction
          try {
            if (camera.default && this.cameraPositionAtHKeyPress && this.cameraRotationAtHKeyPress) {
              // Restore camera position and rotation with a smooth transition
              camera.default.setCameraModeFixed({
                position: this.cameraPositionAtHKeyPress,
                rotation: this.cameraRotationAtHKeyPress,
                duration: 0.5 // 0.5 second transition for smooth restoration
              });

              // Clear the stored camera state
              this.cameraPositionAtHKeyPress = null;
              this.cameraRotationAtHKeyPress = null;
            }
          } catch (error) {
          }

          // Mark that the player is no longer focused on the UI
          this.isPlayerFocusedOnUI = false;
        }

      } catch (error) {
      }
    }
  }  // Cleanup when component is destroyed
  stop() {
    if (this.inputConnection) {
      this.inputConnection.disconnect();
      this.inputConnection = null;
    }
    if (this.eKeyInputConnection) {
      this.eKeyInputConnection.disconnect();
      this.eKeyInputConnection = null;
    }
  }

  // Set up network event listeners for trivia events
  private setupNetworkEvents(): void {

    // Listen for trivia question show events
    this.connectNetworkBroadcastEvent(triviaQuestionShowEvent, (eventData) => {
      if (this.triviaApp) {
        this.triviaApp.syncWithExternalTrivia(eventData);
      }
    });

    // Listen for trivia results events
    this.connectNetworkBroadcastEvent(triviaResultsEvent, (eventData) => {
      if (this.triviaApp) {
        this.triviaApp.onTriviaResults(eventData);
      }
    });

    // Listen for trivia game start events (forward to TriviaGame component)
    this.connectNetworkBroadcastEvent(triviaGameStartEvent, (eventData) => {
      // TriviaGame component will receive this event directly since it's registered separately
      // No additional handling needed here as TriviaGame listens for this event
    });

  }

  // Set up keyboard input handling directly in the MePhone
  private setupKeyboardInput(): void {
    try {
      // Check if PlayerControls is available (should be since this is a CustomUI running locally)
      if (typeof hz.PlayerControls === 'undefined') {
        this.fallbackToSeparateComponent();
        return;
      }

      // Get the local player (owner of the MePhone)
      const localPlayer = this.world.getLocalPlayer();
      if (!localPlayer) {
        this.fallbackToSeparateComponent();
        return;
      }

      // Additional check: verify we can actually call PlayerControls methods
      try {
        // This will throw an error if not in the right context
        hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary);
      } catch (contextError) {
        this.fallbackToSeparateComponent();
        return;
      }

      // Check if LeftTertiary action is supported (maps to H key on desktop)
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary)) {
        this.inputConnection = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.LeftTertiary,
          hz.ButtonIcon.Menu,
          this,
          { preferredButtonPlacement: hz.ButtonPlacement.Center }
        );

        this.inputConnection.registerCallback((action, pressed) => {
          if (pressed) {
            // Handle keyboard trigger directly
            this.handleKeyboardTrigger(localPlayer);
          }
        });

        // Set up E key input for hiding MePhone when focused
        if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.RightGrip)) {
          this.eKeyInputConnection = hz.PlayerControls.connectLocalInput(
            hz.PlayerInputAction.RightGrip,
            hz.ButtonIcon.None,
            this,
            { preferredButtonPlacement: hz.ButtonPlacement.Default }
          );

          this.eKeyInputConnection.registerCallback((action, pressed) => {
            if (pressed) {
              // Handle E key trigger - hide MePhone if player is focused on UI
              this.handleEKeyTrigger(localPlayer);
            }
          });

        } else {
        }
      } else {
        this.fallbackToSeparateComponent();
      }
    } catch (error) {
      this.fallbackToSeparateComponent();
    }
  }

  // Fallback to separate keyboard input component
  private fallbackToSeparateComponent(): void {
  }



  // Handle when the UI gains focus
  onFocus(player: hz.Player): void {
    // Mark that the player is now focused on the UI
    this.isPlayerFocusedOnUI = true;

    // Show the MePhone when focused - make it visible to all players
    this.entity.visible.set(true);
  }

  // Handle when the UI loses focus
  onUnfocus(player: hz.Player): void {
    // Mark that the player is no longer focused on the UI
    this.isPlayerFocusedOnUI = false;

    // Hide the MePhone when unfocused - make it invisible to all players
    this.hideMePhone();
  }

  // Method to explicitly hide the MePhone
  private hideMePhone(): void {
    this.entity.visible.set(false);
  }

  // Method to explicitly show the MePhone
  private showMePhone(): void {
    this.entity.visible.set(true);
  }

  // Handle MePhone assignment/toggle via keyboard input
  private handleKeyboardTrigger(player: hz.Player): void {
    // Check if the MePhone is currently visible and assigned to this player
    // Also check if it's positioned normally (not hidden by E key)
    const isVisible = this.entity.visible.get();
    const isAssignedToPlayer = this.assignedPlayer?.id === player.id;
    const currentPosition = this.entity.position.get();
    const isPositionedNormally = currentPosition.y > -500; // Not hidden far below

    // Debug logging
    console.log(`[MePhone] H key pressed - isVisible: ${isVisible}, isAssignedToPlayer: ${isAssignedToPlayer}, isPlayerFocusedOnUI: ${this.isPlayerFocusedOnUI}, positionY: ${currentPosition.y}`);

    if (isVisible && isAssignedToPlayer && isPositionedNormally) {
      console.log(`[MePhone] Blocking H key - phone is visible, assigned to player, and positioned normally`);
      return; // Don't execute H key functionality if player is already using the phone
    }

    console.log(`[MePhone] Allowing H key - proceeding with functionality`);

    // Capture camera position when H key is pressed
    try {
      if (camera.default) {
        this.cameraPositionAtHKeyPress = camera.default.position.get().clone();
        this.cameraRotationAtHKeyPress = camera.default.rotation.get().clone();
      }
    } catch (error) {
    }

    // If phone is not assigned to anyone, assign it to this player and open UI
    if (!this.assignedPlayer) {
      this.initializeForPlayer(player);
      this.teleportToPlayer(player);
      // Open and focus the MePhone UI on the player's device with delay
      this.openAndFocusUIForPlayer(player);
      return;
    }

    // If phone is assigned to this player, teleport and focus the UI (keep current app)
    if (this.assignedPlayer.id === player.id) {
      this.teleportToPlayer(player);
      this.openAndFocusUIForPlayer(player);
    } else {
      // If phone is assigned to someone else, reassign it to this player and teleport/focus UI

      // Stop following the previous player
      this.stopFollowingPlayer();

      // Assign to new player and teleport (keep current app state)
      this.assignedPlayer = player;
      // Removed: this.currentAppBinding.set('home'); - Keep current app instead of forcing home
      this.teleportToPlayer(player);

      this.openAndFocusUIForPlayer(player);
    }
  }

  // Handle E key press - always hide MePhone by setting y position to -1000
  private handleEKeyTrigger(player: hz.Player): void {
    // Always set the MePhone's y position to -1000 when E is pressed
    const currentPosition = this.entity.position.get();
    this.entity.position.set(new hz.Vec3(currentPosition.x, -1000, currentPosition.z));

    // Reset focus state since player is no longer actively using the phone
    this.isPlayerFocusedOnUI = false;
  }

  // Open the MePhone UI on the player's device
  private openUIForPlayer(player: hz.Player): void {
    try {
      // Removed: this.currentAppBinding.set('home'); - Don't force home screen navigation
      // Keep the current app state when opening UI

      // The UI should automatically be visible to the player if they're interacting with the CustomUI gizmo
      // This ensures the phone is ready when they look at it

    } catch (error) {
    }
  }

  // Open and focus the MePhone UI on the player's device with shorter delay
  private openAndFocusUIForPlayer(player: hz.Player): void {
    try {
      // First prepare the UI
      this.openUIForPlayer(player);

      // Set focus state immediately to prevent H key from working during the transition
      this.isPlayerFocusedOnUI = true;

      // Wait 25ms for position change to take effect, then focus the UI (reduced from 100ms)
      this.async.setTimeout(() => {
        try {
          player.focusUI(this.entity, { duration: 0.1 });
        } catch (focusError) {
          // If focus fails, reset the focus state
          this.isPlayerFocusedOnUI = false;
        }
      }, 25);

    } catch (error) {
      // If something goes wrong, reset the focus state
      this.isPlayerFocusedOnUI = false;
    }
  }

  // Ensure ContactsApp is initialized with world context
  private ensureContactsApp(): ContactsApp {
    if (!this.contactsApp) {
      this.contactsApp = new ContactsApp(this.world);
    }
    return this.contactsApp;
  }

  initializeUI() {
    return this.render();
  }

  onPlayerAssigned(player: hz.Player) {
    this.assignedPlayer = player;
    this.isInitialized = true;

    // Teleport to the player
    this.teleportToPlayer(player);

    // Set the assigned player for TriviaApp
    this.triviaApp.setAssignedPlayer(player);
    console.log(`[MePhone] Assigned player ${player.id} to TriviaApp`);

    // Load contacts for the assigned player
    this.ensureContactsApp().updateContacts(player);

    // Removed: this.currentAppBinding.set('home'); - Keep current app state instead of forcing home

  }

  onPlayerUnassigned(player: hz.Player) {
    this.assignedPlayer = null;
    this.isInitialized = false;

    // Clear stored camera state
    this.cameraPositionAtHKeyPress = null;
    this.cameraRotationAtHKeyPress = null;

    // Hide the MePhone when unassigned
    this.hideMePhone();

    // Return to original position
    if (this.originalPosition) {
      this.entity.position.set(this.originalPosition.clone());
    }

    // Clear the assigned player for TriviaApp
    this.triviaApp.setAssignedPlayer(null);

    // Removed: this.currentAppBinding.set('home'); - Don't reset to home on unassignment

  }  // Initialize phone for a specific player
  public initializeForPlayer(player: hz.Player) {
    this.assignedPlayer = player;
    this.isInitialized = true;

    // Initialize contacts for this player
    this.ensureContactsApp().updateContacts(player);

    // Removed: this.currentAppBinding.set('home'); - Don't force home screen on initialization
    // Keep whatever app was previously selected or default to home if this is the first time

  }

  // Method to release the MePhone back to its original position
  public releaseMePhone(): void {
    if (this.assignedPlayer) {
      this.onPlayerUnassigned(this.assignedPlayer);
    }
  }

  // Method to unfocus and hide the MePhone
  public unfocusAndHide(): void {
    if (this.assignedPlayer) {
      const playerId = this.assignedPlayer.id;

      // Explicitly hide the MePhone after a short delay to ensure unfocus completes
      this.async.setTimeout(() => {
        this.hideMePhone();
      }, 50);
    }
  }

  // Method to check and hide MePhone if not focused
  public checkAndHideIfUnfocused(): void {
    if (this.assignedPlayer) {
      // For now, just hide it since we can't easily check focus state
      // This method can be called externally when unfocus is suspected
      this.hideMePhone();
    }
  }

  // Method to check if the MePhone is currently assigned to a player
  public isFollowing(): boolean {
    return this.assignedPlayer !== null;
  }

  // Method to get the currently assigned player
  public getAssignedPlayer(): hz.Player | null {
    return this.assignedPlayer;
  }

  // Method to force hide the MePhone (can be called externally)
  public forceHide(): void {
    this.hideMePhone();
  }

  // Method to force show the MePhone (can be called externally)
  public forceShow(): void {
    this.showMePhone();
  }

  // Method to handle external unfocus calls (when Player.unfocusUI() is called externally)
  public handleExternalUnfocus(): void {
    if (this.assignedPlayer) {

      // Hide the MePhone immediately when external unfocus is detected
      this.hideMePhone();
    }
  }

  // Method to get a callback function for external unfocus handling
  public getUnfocusCallback(): () => void {
    return () => {
      this.handleExternalUnfocus();
    };
  }

  // Check if a player can interact with this phone
  private canPlayerInteract(player: hz.Player): boolean {
    // If no one has claimed this phone yet, anyone can use it
    if (!this.assignedPlayer) {
      return true;
    }
    
    // Otherwise, only the assigned player can use it
    return this.assignedPlayer === player;
  }

  private navigateToApp(appName: string) {
    this.currentAppBinding.set(appName);
  }

  private navigateHome() {
    this.currentAppBinding.set('home');
  }

  // Create the home screen with app icons - restored original design
  private createHomeScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        gradientColorA: '#60A5FA', // blue-400
        gradientColorB: '#2563EB', // blue-600
        gradientAngle: '180deg', // top to bottom gradient
        borderRadius: 14, // Match the screen border radius
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: '10%',
        paddingRight: '10%',
        overflow: 'hidden' // Ensure gradient doesn't bleed
      },
      children: [
        // App Grid Container - 2x3 grid layout like reference
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            paddingTop: 16,
            paddingBottom: 16
          },
          children: [
            // First row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('Contacts', '#ff6900', BigInt("1328787472168292"), 'contacts'),
                this.createAppIcon('MeChat', '#fb2c36', BigInt("1480228839964364"), 'messages')
              ]
            }),
            
            // Second row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('MePay', '#10b981', BigInt("769107079414002"), 'mepay'),
                this.createAppIcon('Trivia', '#7C3AED', BigInt("1806321090277222"), 'trivia')
              ]
            }),
            
            // Third row of apps
            ui.View({
              style: {
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
                flex: 1
              },
              children: [
                this.createAppIcon('Calculator', '#F97316', BigInt("2175040452971461"), 'calculator'),
                this.createAppIcon('Settings', '#6a7282', BigInt("1342398257464986"), 'settings')
              ]
            })
          ]
        })
      ]
    });
  }

  private createAppIcon(appName: string, color: string, assetId: bigint, appId: string): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: '100%'
      },
      onPress: (player: hz.Player) => {
        // Auto-assign phone to player if not assigned yet
        if (!this.assignedPlayer) {
          this.initializeForPlayer(player);
        }
        
        // Check if this player is authorized to use this phone
        if (!this.canPlayerInteract(player)) {
          return;
        }

        // Navigate to the app
        if (appId === 'contacts') {
          // Force refresh contacts when contacts app is opened
          this.ensureContactsApp().updateContacts(this.assignedPlayer ?? undefined);
          this.navigateToApp(appId);
        } else if (appId === 'trivia') {
          // Force sync with TriviaGame when trivia app is opened
          this.triviaApp.forceSyncWithTriviaGame();
          this.navigateToApp(appId);
        } else {
          this.navigateToApp(appId);
        }
      },
      children: [
        // App icon background
        ui.View({
          style: {
            width: 68,
            height: 68,
            backgroundColor: color,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4
          },
          children: [
            // App icon symbol
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(assetId)),
              style: {
                width: 34,
                height: 34,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),
        
        // App name label
        ui.Text({
          text: appName,
          style: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center'
          }
        })
      ]
    });
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
                // Dynamic content based on current app using conditional rendering
                ui.UINode.if(this.isHomeBinding, this.createHomeScreen()),
                ui.UINode.if(this.isTriviaAppBinding, this.triviaApp.render(() => this.navigateHome(), this.assignedPlayer ?? undefined)),
                ui.UINode.if(this.isMessagesAppBinding, this.messagesApp.render(() => this.navigateHome())),
                ui.UINode.if(this.isContactsAppBinding, this.ensureContactsApp().render(() => this.navigateHome(), this.assignedPlayer ?? undefined)),
                ui.UINode.if(this.isMePayAppBinding, this.mePayApp.render(() => this.navigateHome())),
                ui.UINode.if(this.isCalculatorAppBinding, this.calculatorApp.render(() => this.navigateHome(), this.assignedPlayer ?? undefined)),
                ui.UINode.if(this.isSettingsAppBinding, this.settingsApp.render(() => this.navigateHome()))
              ]
            })
          ]
        })
      ]
    });
  }
}

// Register the component for Horizon Worlds
ui.UIComponent.register(MePhone);
