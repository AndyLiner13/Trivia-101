import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';

// Network events for trivia
const triviaQuestionShowEvent = new hz.NetworkEvent<{ question: any, questionIndex: number, timeLimit: number }>('triviaQuestionShow');
const triviaResultsEvent = new hz.NetworkEvent<{ question: any, correctAnswerIndex: number, answerCounts: number[], scores: { [key: string]: number }, showLeaderboard?: boolean, leaderboardData?: Array<{name: string, score: number, playerId: string}> }>('triviaResults');

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
