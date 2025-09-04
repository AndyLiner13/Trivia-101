import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';

// Network events for trivia
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');

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

  // Player ownership tracking
  private assignedPlayer: hz.Player | null = null;
  private isInitialized = false;

  // Keyboard input connection
  private inputConnection: hz.PlayerInput | null = null;

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
  }

  // Cleanup when component is destroyed
  stop() {
    if (this.inputConnection) {
      this.inputConnection.disconnect();
      this.inputConnection = null;
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

  }

  // Set up keyboard input handling directly in the MePhone
  private setupKeyboardInput(): void {
    try {
      // Check if PlayerControls is available (should be since this is a CustomUI running locally)
      if (typeof hz.PlayerControls === 'undefined') {
        console.log('PlayerControls not available - keyboard input disabled');
        console.log('This may be because the CustomUI gizmo is not set up correctly');
        this.fallbackToSeparateComponent();
        return;
      }

      // Get the local player (owner of the MePhone)
      const localPlayer = this.world.getLocalPlayer();
      if (!localPlayer) {
        console.log('No local player found - keyboard input disabled');
        this.fallbackToSeparateComponent();
        return;
      }

      // Additional check: verify we can actually call PlayerControls methods
      try {
        // This will throw an error if not in the right context
        hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary);
      } catch (contextError) {
        console.log('PlayerControls context error:', contextError instanceof Error ? contextError.message : contextError);
        console.log('Falling back to separate keyboard input component...');
        this.fallbackToSeparateComponent();
        return;
      }

      // Check if LeftTertiary action is supported (maps to H key on desktop)
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary)) {
        this.inputConnection = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.LeftTertiary,
          hz.ButtonIcon.Jump,
          this,
          { preferredButtonPlacement: hz.ButtonPlacement.Center }
        );

        this.inputConnection.registerCallback((action, pressed) => {
          if (pressed) {
            // Handle keyboard trigger directly
            this.handleKeyboardTrigger(localPlayer);
          }
        });

        console.log('MePhone keyboard input connected successfully');
        console.log('Press H key (or platform equivalent) to claim/prepare MePhone for interaction');
        console.log('Note: You still need to press E when near the CustomUI gizmo to open the interface');
      } else {
        console.log('LeftTertiary input action not supported on this platform');
        console.log('Falling back to separate keyboard input component...');
        this.fallbackToSeparateComponent();
      }
    } catch (error) {
      console.log('MePhone keyboard input setup failed:', error instanceof Error ? error.message : error);
      console.log('Falling back to separate keyboard input component...');
      this.fallbackToSeparateComponent();
    }
  }

  // Fallback to separate keyboard input component
  private fallbackToSeparateComponent(): void {
    console.log('=== FALLBACK MODE: Using separate KeyboardInputHandler ===');
    console.log('To enable keyboard input:');
    console.log('1. Create a new entity in your world');
    console.log('2. Attach the KeyboardInputHandler.ts script to it');
    console.log('3. Set the script execution mode to Local');
    console.log('4. Set the entity owner to the player');
    console.log('5. The H key will claim/prepare the MePhone (you still need to press E to open it)');
    console.log('===================================================');
  }



  // Handle MePhone assignment/toggle via keyboard input
  private handleKeyboardTrigger(player: hz.Player): void {
    // If phone is not assigned to anyone, assign it to this player and open UI
    if (!this.assignedPlayer) {
      this.initializeForPlayer(player);
      // Open and focus the MePhone UI on the player's device
      this.openAndFocusUIForPlayer(player);
      console.log('MePhone assigned to player via keyboard and UI opened/focused:', player.id);
      return;
    }

    // If phone is assigned to this player, open/show and focus the UI
    if (this.assignedPlayer.id === player.id) {
      this.openAndFocusUIForPlayer(player);
      console.log('MePhone UI opened/focused via keyboard for player:', player.id);
    } else {
      // If phone is assigned to someone else, reassign it to this player and open/focus UI
      console.log('MePhone reassigned from', this.assignedPlayer.id, 'to', player.id, 'via keyboard');
      this.assignedPlayer = player;
      this.currentAppBinding.set('home');
      this.openAndFocusUIForPlayer(player);
    }
  }

  // Open the MePhone UI on the player's device
  private openUIForPlayer(player: hz.Player): void {
    try {
      // Navigate to home screen first
      this.currentAppBinding.set('home');

      // The UI should automatically be visible to the player if they're interacting with the CustomUI gizmo
      // This ensures the phone is ready when they look at it
      console.log('MePhone UI prepared for player:', player.id);
      console.log('Player should see the MePhone interface when looking at the CustomUI gizmo');

    } catch (error) {
      console.log('Failed to prepare MePhone UI:', error instanceof Error ? error.message : error);
    }
  }

  // Open and focus the MePhone UI on the player's device
  private openAndFocusUIForPlayer(player: hz.Player): void {
    try {
      // First prepare the UI
      this.openUIForPlayer(player);

      // Then focus the UI for the player
      player.focusUI(this.entity);
      console.log('MePhone UI focused for player:', player.id);

    } catch (error) {
      console.log('Failed to focus MePhone UI:', error instanceof Error ? error.message : error);
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
    
    // Set the assigned player for TriviaApp
    this.triviaApp.setAssignedPlayer(player);
    
    // Load contacts for the assigned player
    this.ensureContactsApp().updateContacts(player);
    
    // Reset to home screen when a new player is assigned
    this.currentAppBinding.set('home');
  }

  onPlayerUnassigned(player: hz.Player) {
    this.assignedPlayer = null;
    this.isInitialized = false;
    
    // Clear the assigned player for TriviaApp
    this.triviaApp.setAssignedPlayer(null);
    
    // Reset to home screen
    this.currentAppBinding.set('home');
  }

  // Initialize phone for a specific player
  public initializeForPlayer(player: hz.Player) {
    this.assignedPlayer = player;
    this.isInitialized = true;
    
    // Initialize contacts for this player
    this.ensureContactsApp().updateContacts(player);
    
    // Reset to home screen for this player
    this.currentAppBinding.set('home');
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
