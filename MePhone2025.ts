import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

// Define app types for navigation
type AppType = 'home' | 'phone' | 'calculator' | 'contacts' | 'mail' | 'browser' | 'settings';

interface AppNavigationData {
  contactId?: number;
  contactName?: string;
  contactPhone?: string;
  contactAvatar?: string;
  returnTo?: AppType;
  url?: string;
  productId?: string;
}

interface NavigationHistoryEntry {
  app: AppType;
  data?: AppNavigationData;
  isInSubpage: boolean;
}

// HomeScreen Component (inline to avoid import issues)
interface HomeScreenProps {
  onAppSelect: (app: AppType) => void;
}

class HomeScreenComponent {
  public static render(props: HomeScreenProps): ui.UINode {
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
        padding: '3%',
        overflow: 'hidden' // Ensure gradient doesn't bleed
      },
      children: [
        // App Grid Container
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            padding: '8%'
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
                HomeScreenComponent.createAppIcon('phone', 'Phone', '#10B981', '📞', props.onAppSelect), // green-500
                HomeScreenComponent.createAppIcon('calculator', 'Calculator', '#3B82F6', '🧮', props.onAppSelect) // blue-500
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
                HomeScreenComponent.createAppIcon('contacts', 'Contacts', '#F97316', '👥', props.onAppSelect), // orange-500
                HomeScreenComponent.createAppIcon('mail', 'MeMail', '#EF4444', '📧', props.onAppSelect) // red-500
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
                HomeScreenComponent.createAppIcon('browser', 'Browser', '#8B5CF6', '🌐', props.onAppSelect), // purple-500
                HomeScreenComponent.createAppIcon('settings', 'Settings', '#6B7280', '⚙️', props.onAppSelect) // gray-500
              ]
            })
          ]
        })
      ]
    });
  }

  private static createAppIcon(
    appId: AppType,
    appName: string, 
    color: string, 
    iconSymbol: string,
    onAppSelect: (app: AppType) => void
  ): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6
      },
      onPress: () => onAppSelect(appId),
      children: [
        // App icon background
        ui.View({
          style: {
            width: 65,
            height: 65,
            backgroundColor: color,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10
          },
          children: [
            // App icon symbol/letter
            ui.Text({
              text: iconSymbol,
              style: {
                color: '#FFFFFF',
                fontSize: 26,
                fontWeight: 'bold',
                textAlign: 'center'
              }
            })
          ]
        }),
        
        // App name label
        ui.Text({
          text: appName,
          style: {
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: '500',
            textAlign: 'center'
          }
        })
      ]
    });
  }
}

// Simple placeholder app component for non-home screens
class PlaceholderApp {
  static render(appName: string, icon: string, onBack: () => void, onHome: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      },
      children: [
        // Header
        ui.View({
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderColor: '#E5E7EB'
          },
          children: [
            ui.Pressable({
              onPress: onBack,
              children: [
                ui.Text({
                  text: '←',
                  style: {
                    fontSize: 18,
                    color: '#000000',
                    fontWeight: 'bold'
                  }
                })
              ]
            }),
            ui.Text({
              text: `${icon} ${appName}`,
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#000000'
              }
            }),
            ui.Pressable({
              onPress: onHome,
              children: [
                ui.Text({
                  text: '🏠',
                  style: {
                    fontSize: 16
                  }
                })
              ]
            })
          ]
        }),
        
        // Content
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 60
          },
          children: [
            ui.Text({
              text: icon,
              style: {
                fontSize: 80,
                marginBottom: 20
              }
            }),
            ui.Text({
              text: `${appName} App`,
              style: {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#1F2937',
                marginBottom: 10
              }
            }),
            ui.Text({
              text: 'App functionality will be implemented here',
              style: {
                fontSize: 16,
                color: '#6B7280',
                textAlign: 'center'
              }
            })
          ]
        })
      ]
    });
  }
}

/**
 * MePhone2025 - Complete phone interface system
 * Fresh component with only 6 apps - no caching issues
 * Uses modular app architecture with navigation
 */
class MePhone2025 extends ui.UIComponent<typeof MePhone2025> {
  static propsDefinition = {};

  // Panel dimensions to match original HomeScreen design
  panelWidth = 280;
  panelHeight = 480;

  // Navigation state bindings
  private currentAppBinding = new ui.Binding<AppType>('home');
  private appNavigationDataBinding = new ui.Binding<AppNavigationData | null>(null);
  private isInSubpageBinding = new ui.Binding<boolean>(false);
  private navigationHistoryBinding = new ui.Binding<NavigationHistoryEntry[]>([]);
  private isCallActiveBinding = new ui.Binding<boolean>(false);

  // Current state values
  private currentApp: AppType = 'home';
  private appNavigationData: AppNavigationData | null = null;
  private isInSubpage: boolean = false;
  private navigationHistory: NavigationHistoryEntry[] = [];
  private isCallActive: boolean = false;

  // Time display
  private timeBinding = new ui.Binding<string>('12:34');

  initializeUI(): ui.UINode {
    // Initialize time
    this.updateTime();
    return this.renderPhone();
  }

  start() {
    super.start();
  }

  private updateTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.timeBinding.set(`${hours}:${minutes}`);
  }

  private renderPhone(): ui.UINode {
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
                this.renderCurrentApp()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderCurrentApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Home Screen
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentAppBinding], (app) => 
              app === 'home' ? 'flex' : 'none'
            )
          },
          children: [
            HomeScreenComponent.render({
              onAppSelect: (app: AppType) => this.navigateToApp(app)
            })
          ]
        }),
        
        // Phone App
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentAppBinding], (app) => 
              app === 'phone' ? 'flex' : 'none'
            )
          },
          children: [
            PlaceholderApp.render('Phone', '📞', this.navigateBack, this.navigateToHome)
          ]
        }),
        
        // Calculator App
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentAppBinding], (app) => 
              app === 'calculator' ? 'flex' : 'none'
            )
          },
          children: [
            PlaceholderApp.render('Calculator', '🧮', this.navigateBack, this.navigateToHome)
          ]
        }),
        
        // Contacts App
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentAppBinding], (app) => 
              app === 'contacts' ? 'flex' : 'none'
            )
          },
          children: [
            PlaceholderApp.render('Contacts', '👥', this.navigateBack, this.navigateToHome)
          ]
        }),
        
        // Browser App
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentAppBinding], (app) => 
              app === 'browser' ? 'flex' : 'none'
            )
          },
          children: [
            PlaceholderApp.render('Browser', '🌐', this.navigateBack, this.navigateToHome)
          ]
        }),
        
        // Mail App
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentAppBinding], (app) => 
              app === 'mail' ? 'flex' : 'none'
            )
          },
          children: [
            PlaceholderApp.render('Mail', '📧', this.navigateBack, this.navigateToHome)
          ]
        }),
        
        // Settings App
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentAppBinding], (app) => 
              app === 'settings' ? 'flex' : 'none'
            )
          },
          children: [
            PlaceholderApp.render('Settings', '⚙️', this.navigateBack, this.navigateToHome)
          ]
        })
      ]
    });
  }

  // Navigation Methods
  private navigateToApp(app: AppType, data?: AppNavigationData) {
    // Add current state to history before navigating (but not if we're already at home)
    if (this.currentApp !== 'home') {
      this.navigationHistory.push({
        app: this.currentApp,
        data: this.appNavigationData || undefined,
        isInSubpage: this.isInSubpage
      });
      this.navigationHistoryBinding.set(this.navigationHistory);
    }
    
    // Reset call state when navigating away from phone app
    if (this.currentApp === 'phone' && app !== 'phone') {
      this.isCallActive = false;
      this.isCallActiveBinding.set(false);
    }
    
    this.currentApp = app;
    this.appNavigationData = data || null;
    this.isInSubpage = false;
    
    this.currentAppBinding.set(app);
    this.appNavigationDataBinding.set(this.appNavigationData);
    this.isInSubpageBinding.set(false);
  }

  private navigateToHome = () => {
    // Reset call state when going home
    this.isCallActive = false;
    this.isCallActiveBinding.set(false);
    
    this.currentApp = 'home';
    this.appNavigationData = null;
    this.isInSubpage = false;
    this.navigationHistory = [];
    
    this.currentAppBinding.set('home');
    this.appNavigationDataBinding.set(null);
    this.isInSubpageBinding.set(false);
    this.navigationHistoryBinding.set([]);
  }

  private navigateBack = () => {
    // Reset call state when navigating back
    if (this.currentApp === 'phone') {
      this.isCallActive = false;
      this.isCallActiveBinding.set(false);
    }
    
    // If we're in a subpage, just exit the subpage
    if (this.isInSubpage) {
      this.isInSubpage = false;
      this.isInSubpageBinding.set(false);
      return;
    }
    
    // If there's navigation history, go back to the previous screen
    if (this.navigationHistory.length > 0) {
      const previousEntry = this.navigationHistory[this.navigationHistory.length - 1];
      const newHistory = this.navigationHistory.slice(0, -1);
      
      this.currentApp = previousEntry.app;
      this.appNavigationData = previousEntry.data || null;
      this.isInSubpage = previousEntry.isInSubpage;
      this.navigationHistory = newHistory;
      
      this.currentAppBinding.set(this.currentApp);
      this.appNavigationDataBinding.set(this.appNavigationData);
      this.isInSubpageBinding.set(this.isInSubpage);
      this.navigationHistoryBinding.set(this.navigationHistory);
      return;
    }
    
    // If there's returnTo data, use it (legacy behavior)
    if (this.appNavigationData?.returnTo) {
      this.navigateToApp(this.appNavigationData.returnTo);
      return;
    }
    
    // Fallback to home
    this.navigateToHome();
  }
}

// Register the fresh component
ui.UIComponent.register(MePhone2025);
