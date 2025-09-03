import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';
import { Social, AvatarImageType } from 'horizon/social';

// Import all the app classes
import { PhoneApp } from './PhoneApp';
import { MessagesApp } from './MessagesApp';
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

  // Derived bindings for each app
  private isHomeBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'home');
  private isPhoneAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'phone');
  private isMessagesAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'messages');
  private isContactsAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'contacts');
  private isMePayAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'mepay');
  private isCalculatorAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'calculator');
  private isSettingsAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'settings');

  // App instances - one per app type
  private phoneApp = new PhoneApp();
  private messagesApp = new MessagesApp();
  private contactsApp = new ContactsApp(this.world);
  private mePayApp = new MePayApp();
  private calculatorApp = new CalculatorApp();
  private settingsApp = new SettingsApp();

  constructor() {
    super();
    console.log('[MePhone] Component initialized');
  }

  initializeUI() {
    // Required abstract method implementation
    return this.render();
  }

  onPlayerAssigned(player: hz.Player) {
    console.log(`[MePhone] Player assigned: ${player.id} (${player.name.get()})`);
    this.assignedPlayer = player;
    this.isInitialized = true;
    
    // Reset to home screen when a new player is assigned
    this.currentAppBinding.set('home');
  }

  onPlayerUnassigned(player: hz.Player) {
    console.log(`[MePhone] Player unassigned: ${player.id} (${player.name.get()})`);
    this.assignedPlayer = null;
    this.isInitialized = false;
    
    // Reset to home screen
    this.currentAppBinding.set('home');
  }

  private navigateToApp(appName: string) {
    console.log(`[MePhone] Navigating to app: ${appName}`);
    this.currentAppBinding.set(appName);
  }

  private navigateHome() {
    console.log('[MePhone] Navigating to home');
    this.currentAppBinding.set('home');
  }

  // Create the home screen with app icons
  private createHomeScreen(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        backgroundColor: '#000000',
        paddingTop: 40,
        paddingBottom: 20,
        paddingHorizontal: 20
      },
      children: [
        // Status bar
        ui.View({
          style: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 30,
            paddingHorizontal: 10
          },
          children: [
            ui.Text({
              text: '9:41',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF'
              }
            }),
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: '📶',
                  style: {
                    fontSize: 14,
                    marginRight: 5
                  }
                }),
                ui.Text({
                  text: '🔋',
                  style: {
                    fontSize: 14
                  }
                })
              ]
            })
          ]
        }),

        // App grid
        ui.View({
          style: {
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            alignContent: 'flex-start'
          },
          children: [
            this.createAppIcon('📞', 'Phone', 'phone'),
            this.createAppIcon('💬', 'Messages', 'messages'),
            this.createAppIcon('👥', 'Contacts', 'contacts'),
            this.createAppIcon('💳', 'MePay', 'mepay'),
            this.createAppIcon('🔢', 'Calculator', 'calculator'),
            this.createAppIcon('⚙️', 'Settings', 'settings')
          ]
        }),

        // Dock
        ui.View({
          style: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginTop: 20
          },
          children: [
            this.createAppIcon('📱', 'Phone', 'phone', true)
          ]
        })
      ]
    });
  }

  private createAppIcon(emoji: string, label: string, appName: string, isDock: boolean = false): ui.UINode {
    return ui.Pressable({
      style: {
        alignItems: 'center',
        margin: isDock ? 0 : 15,
        width: isDock ? 60 : 80
      },
      onPress: () => this.navigateToApp(appName),
      children: [
        ui.View({
          style: {
            width: isDock ? 50 : 60,
            height: isDock ? 50 : 60,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: isDock ? 12 : 15,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 5
          },
          children: [
            ui.Text({
              text: emoji,
              style: {
                fontSize: isDock ? 24 : 28
              }
            })
          ]
        }),
        ui.Text({
          text: label,
          style: {
            fontSize: isDock ? 10 : 12,
            color: '#FFFFFF',
            textAlign: 'center',
            fontWeight: '500'
          }
        })
      ]
    });
  }

  render(): ui.UINode {
    return ui.View({
      style: {
        width: 200,
        height: 400,
        backgroundColor: '#1F2937',
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#374151',
        overflow: 'hidden',
        position: 'relative'
      },
      children: [
        // Dynamic content based on current app using conditional rendering
        ui.UINode.if(this.isHomeBinding, this.createHomeScreen()),
        ui.UINode.if(this.isPhoneAppBinding, this.phoneApp.render(() => this.navigateHome(), this.assignedPlayer ?? undefined)),
        ui.UINode.if(this.isMessagesAppBinding, this.messagesApp.render(() => this.navigateHome())),
        ui.UINode.if(this.isContactsAppBinding, this.contactsApp.render(() => this.navigateHome(), this.assignedPlayer ?? undefined)),
        ui.UINode.if(this.isMePayAppBinding, this.mePayApp.render(() => this.navigateHome())),
        ui.UINode.if(this.isCalculatorAppBinding, this.calculatorApp.render(() => this.navigateHome(), this.assignedPlayer ?? undefined)),
        ui.UINode.if(this.isSettingsAppBinding, this.settingsApp.render(() => this.navigateHome()))
      ]
    });
  }
}

// Register the component for Horizon Worlds
ui.UIComponent.register(MePhone);
