import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

// Import all the app classes
import { TriviaApp } from './TriviaApp';
import { MeChatApp } from './MeChatApp';
import { ContactsApp } from './ContactsApp';
import { MePayApp } from './MePayApp';
import { CalculatorApp } from './CalculatorApp';
import { SettingsApp } from './SettingsApp';

/**
 * MePhone Overlay - A mobile phone interface that appears as an overlay when pressing M
 * Only visible to the player who activated it
 */
class MePhone extends ui.UIComponent<typeof MePhone> {
  static propsDefinition = {};

  // Player ownership tracking
  private assignedPlayer: hz.Player | null = null;
  private isInitialized = false;

  // Overlay visibility - player specific (default to false for all players)
  private isOverlayVisible = new ui.Binding<boolean>(false);

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
    this.setupKeyboardInput();
  }

  // Cleanup when component is destroyed
  stop() {
    if (this.inputConnection) {
      this.inputConnection.disconnect();
      this.inputConnection = null;
    }
  }

  // Set up keyboard input handling directly in the MePhone
  private setupKeyboardInput(): void {
    try {
      // Check if PlayerControls is available
      if (typeof hz.PlayerControls === 'undefined') {
        // PlayerControls not available - keyboard input disabled
        return;
      }

      // Get the local player (owner of the MePhone)
      const localPlayer = this.world.getLocalPlayer();
      if (!localPlayer) {
        // No local player found - keyboard input disabled
        return;
      }

      // Check if LeftTertiary action is supported (maps to M key on desktop)
      if (hz.PlayerControls.isInputActionSupported(hz.PlayerInputAction.LeftTertiary)) {
        this.inputConnection = hz.PlayerControls.connectLocalInput(
          hz.PlayerInputAction.LeftTertiary,
          hz.ButtonIcon.Jump,
          this,
          { preferredButtonPlacement: hz.ButtonPlacement.Center }
        );

        this.inputConnection.registerCallback((action, pressed) => {
          if (pressed) {
            // Toggle the MePhone overlay visibility
            this.toggleOverlay(localPlayer);
          }
        });

        // MePhone overlay keyboard input connected successfully
        // Press M key (or platform equivalent) to toggle MePhone overlay
      } else {
        // LeftTertiary input action not supported on this platform
      }
    } catch (error) {
      // MePhone keyboard input setup failed: [error instanceof Error ? error.message : error]
    }
  }

  // Toggle the MePhone overlay visibility
  private toggleOverlay(player: hz.Player): void {
    // If phone is not assigned to anyone, assign it to this player and show overlay
    if (!this.assignedPlayer) {
      this.initializeForPlayer(player);
      this.isOverlayVisible.set(true, [player]);
      // MePhone assigned to player and overlay opened: [player.id]
      return;
    }

    // If phone is assigned to this player, toggle overlay visibility
    if (this.assignedPlayer.id === player.id) {
      this.isOverlayVisible.set(current => !current, [player]);
      // MePhone overlay toggled for player: [player.id]
    } else {
      // If phone is assigned to someone else, reassign it to this player and show overlay
      // MePhone reassigned from [this.assignedPlayer.id] to [player.id]
      this.assignedPlayer = player;
      this.currentAppBinding.set('home');
      this.isOverlayVisible.set(true, [player]);
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
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      },
      children: [
        // Always render the overlay but control visibility through opacity and interaction
        ui.View({
          style: {
            width: 250,
            height: 450,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            borderRadius: 25,
            padding: 8,
            justifyContent: 'center',
            alignItems: 'center',
            // Control visibility through derived binding
            opacity: ui.Binding.derive([this.isOverlayVisible], visible => visible ? 1 : 0)
          },
          children: [
            // Phone screen content area
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
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

  // Create the home screen with app icons
  private createHomeScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        gradientColorA: '#60A5FA',
        gradientColorB: '#2563EB',
        gradientAngle: '180deg',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: '8%',
        paddingRight: '8%',
        overflow: 'hidden'
      },
      children: [
        // Close button at top
        ui.View({
          style: {
            position: 'absolute',
            top: 10,
            right: 10,
            width: 30,
            height: 30,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Pressable({
              style: {
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: (player: hz.Player) => {
                this.isOverlayVisible.set(false, [player]);
              },
              children: [
                ui.Text({
                  text: '×',
                  style: {
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // App Grid Container
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            paddingTop: 40,
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
            width: 50,
            height: 50,
            backgroundColor: color,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4
          },
          children: [
            // App icon symbol
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(assetId)),
              style: {
                width: 25,
                height: 25,
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
            fontSize: 10,
            fontWeight: '500',
            textAlign: 'center'
          }
        })
      ]
    });
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
}

// Register the component for Horizon Worlds
ui.UIComponent.register(MePhone);
