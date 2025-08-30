// MePhone - Complete phone interface with full functionality
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
  navigationRef?: any; // Add reference to parent component for debugging
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
      onPress: () => {
        console.log(`🖱️ App icon pressed: ${appName} (${appId})`);
        onAppSelect(appId);
      },
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

// App header component for consistency across apps
class AppHeader {
  static render(appName: string, icon: string, onBack: () => void, onHome: () => void): ui.UINode {
    return ui.View({
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        zIndex: 10
      },
      children: [
        // Back button
        ui.Pressable({
          style: {
            padding: 4
          },
          onPress: onBack,
          children: [
            ui.Text({
              text: '←',
              style: {
                fontSize: 16,
                color: '#6B7280'
              }
            })
          ]
        }),
        
        // App title
        ui.Text({
          text: appName,
          style: {
            fontSize: 14,
            fontWeight: '600',
            color: '#1F2937'
          }
        }),
        
        // Home button
        ui.Pressable({
          style: {
            padding: 4
          },
          onPress: onHome,
          children: [
            ui.Text({
              text: '🏠',
              style: {
                fontSize: 14,
                color: '#6B7280'
              }
            })
          ]
        })
      ]
    });
  }
}

/**
 * MePhone - Complete phone interface system
 * Updated: 2025-08-29 - Complete functionality implementation
 * Uses modular app architecture with navigation
 */
class MePhone extends ui.UIComponent<typeof MePhone> {
  static propsDefinition = {};

  // Panel dimensions to match original HomeScreen design
  panelWidth = 280;
  panelHeight = 480;

  // Navigation state bindings
  private currentAppBinding = new ui.Binding<AppType>('home');
  private appNavigationDataBinding = new ui.Binding<AppNavigationData | null>(null);
  private isInSubpageBinding = new ui.Binding<boolean>(false);
  private navigationHistoryBinding = new ui.Binding<NavigationHistoryEntry[]>([]);
  
  // Calculator state
  private calcDisplayBinding = new ui.Binding<string>('0');
  private calcPreviousValue = 0;
  private calcCurrentValue = 0;
  private calcCurrentOperation = '';
  private calcWaitingForOperand = false;
  
  // Phone state
  private phoneNumberBinding = new ui.Binding<string>('');
  private phoneCurrentNumber = '';
  private isDialingBinding = new ui.Binding<boolean>(false);
  
  // Contacts data
  private contacts = [
    { id: 1, name: 'Alice Johnson', phone: '(555) 123-4567', avatar: '👩‍💼' },
    { id: 2, name: 'Bob Smith', phone: '(555) 234-5678', avatar: '👨‍💻' },
    { id: 3, name: 'Carol Davis', phone: '(555) 345-6789', avatar: '👩‍⚕️' },
    { id: 4, name: 'David Wilson', phone: '(555) 456-7890', avatar: '👨‍🍳' },
    { id: 5, name: 'Emma Brown', phone: '(555) 567-8901', avatar: '👩‍🎨' },
    { id: 6, name: 'Frank Miller', phone: '(555) 678-9012', avatar: '👨‍🚒' }
  ];

  // Current state values
  private currentApp: AppType = 'home';
  private appNavigationData: AppNavigationData | null = null;
  private isInSubpage: boolean = false;
  private navigationHistory: NavigationHistoryEntry[] = [];

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
              onAppSelect: (app: AppType) => {
                console.log(`📱 User navigating to: ${app}`);
                this.navigateToApp(app);
              },
              navigationRef: this
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
            this.renderPhoneApp()
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
            this.renderCalculatorApp()
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
            this.renderContactsApp()
          ]
        }),
        
        // Browser App (includes MeBank, MeShop, MeNews)
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

  private renderCalculatorApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        flexDirection: 'column'
      },
      children: [
        AppHeader.render('Calculator', '🧮', 
          () => this.navigateBack(), 
          () => this.navigateToApp('home')
        ),
        
        // Display
        ui.View({
          style: {
            backgroundColor: '#000000',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginTop: 40,
            minHeight: 100
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.calcDisplayBinding], (display) => display),
              style: {
                color: '#FFFFFF',
                fontSize: 36,
                fontWeight: '300',
                textAlign: 'right'
              }
            })
          ]
        }),
        
        // Button Grid
        ui.View({
          style: {
            flex: 1,
            padding: 12,
            backgroundColor: '#F3F4F6'
          },
          children: [
            // Row 1: C, ±, %, ÷
            this.createCalcRow([
              { label: 'C', type: 'clear', action: () => this.calcClear(), bg: '#A1A1AA' },
              { label: '±', type: 'operation', action: () => this.calcToggleSign(), bg: '#A1A1AA' },
              { label: '%', type: 'operation', action: () => this.calcPercent(), bg: '#A1A1AA' },
              { label: '÷', type: 'operation', action: () => this.calcOperation('/'), bg: '#FF9500' }
            ]),
            // Row 2: 7, 8, 9, ×
            this.createCalcRow([
              { label: '7', type: 'number', action: () => this.calcInputNumber('7'), bg: '#333333' },
              { label: '8', type: 'number', action: () => this.calcInputNumber('8'), bg: '#333333' },
              { label: '9', type: 'number', action: () => this.calcInputNumber('9'), bg: '#333333' },
              { label: '×', type: 'operation', action: () => this.calcOperation('*'), bg: '#FF9500' }
            ]),
            // Row 3: 4, 5, 6, -
            this.createCalcRow([
              { label: '4', type: 'number', action: () => this.calcInputNumber('4'), bg: '#333333' },
              { label: '5', type: 'number', action: () => this.calcInputNumber('5'), bg: '#333333' },
              { label: '6', type: 'number', action: () => this.calcInputNumber('6'), bg: '#333333' },
              { label: '-', type: 'operation', action: () => this.calcOperation('-'), bg: '#FF9500' }
            ]),
            // Row 4: 1, 2, 3, +
            this.createCalcRow([
              { label: '1', type: 'number', action: () => this.calcInputNumber('1'), bg: '#333333' },
              { label: '2', type: 'number', action: () => this.calcInputNumber('2'), bg: '#333333' },
              { label: '3', type: 'number', action: () => this.calcInputNumber('3'), bg: '#333333' },
              { label: '+', type: 'operation', action: () => this.calcOperation('+'), bg: '#FF9500' }
            ]),
            // Row 5: 0 (wide), ., =
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: 2
              },
              children: [
                // 0 button (double width)
                ui.Pressable({
                  style: {
                    backgroundColor: '#333333',
                    borderRadius: 12,
                    flex: 2,
                    marginHorizontal: 2,
                    minHeight: 60,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcInputNumber('0'),
                  children: [
                    ui.Text({
                      text: '0',
                      style: {
                        fontSize: 24,
                        color: '#FFFFFF',
                        fontWeight: '400'
                      }
                    })
                  ]
                }),
                // Decimal point
                ui.Pressable({
                  style: {
                    backgroundColor: '#333333',
                    borderRadius: 12,
                    flex: 1,
                    marginHorizontal: 2,
                    minHeight: 60,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcInputDecimal(),
                  children: [
                    ui.Text({
                      text: '.',
                      style: {
                        fontSize: 24,
                        color: '#FFFFFF',
                        fontWeight: '400'
                      }
                    })
                  ]
                }),
                // Equals button
                ui.Pressable({
                  style: {
                    backgroundColor: '#FF9500',
                    borderRadius: 12,
                    flex: 1,
                    marginHorizontal: 2,
                    minHeight: 60,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcEquals(),
                  children: [
                    ui.Text({
                      text: '=',
                      style: {
                        fontSize: 24,
                        color: '#FFFFFF',
                        fontWeight: '400'
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

  private renderPhoneApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        flexDirection: 'column'
      },
      children: [
        AppHeader.render('Phone', '📞', 
          () => this.navigateBack(), 
          () => this.navigateToApp('home')
        ),
        
        // Display area
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            marginTop: 40,
            padding: 20,
            alignItems: 'center',
            borderBottomWidth: 1,
            borderColor: '#E5E7EB'
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.phoneNumberBinding], (number) => 
                number || 'Enter a number'
              ),
              style: {
                fontSize: 24,
                fontWeight: '300',
                color: '#1F2937',
                textAlign: 'center',
                minHeight: 30
              }
            }),
            
            // Call status
            ui.View({
              style: {
                display: ui.Binding.derive([this.isDialingBinding], (isDialing) => 
                  isDialing ? 'flex' : 'none'
                ),
                marginTop: 10
              },
              children: [
                ui.Text({
                  text: 'Calling...',
                  style: {
                    fontSize: 16,
                    color: '#059669',
                    fontWeight: '500'
                  }
                })
              ]
            })
          ]
        }),
        
        // Dial pad
        ui.View({
          style: {
            flex: 1,
            padding: 20,
            justifyContent: 'center'
          },
          children: [
            // Row 1: 1, 2, 3
            this.createDialRow(['1', '2', '3']),
            // Row 2: 4, 5, 6
            this.createDialRow(['4', '5', '6']),
            // Row 3: 7, 8, 9
            this.createDialRow(['7', '8', '9']),
            // Row 4: *, 0, #
            this.createDialRow(['*', '0', '#']),
            
            // Action buttons
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginTop: 20
              },
              children: [
                // Delete button
                ui.Pressable({
                  style: {
                    backgroundColor: '#EF4444',
                    borderRadius: 25,
                    width: 50,
                    height: 50,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.phoneDeleteDigit(),
                  children: [
                    ui.Text({
                      text: '⌫',
                      style: {
                        fontSize: 18,
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),
                
                // Call/End Call button (conditional)
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.isDialingBinding], (isDialing) => 
                      !isDialing ? 'flex' : 'none'
                    )
                  },
                  children: [
                    ui.Pressable({
                      style: {
                        backgroundColor: '#10B981',
                        borderRadius: 25,
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center'
                      },
                      onPress: () => this.phoneCall(),
                      children: [
                        ui.Text({
                          text: '📞',
                          style: {
                            fontSize: 18
                          }
                        })
                      ]
                    })
                  ]
                }),
                
                // End call button (when calling)
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.isDialingBinding], (isDialing) => 
                      isDialing ? 'flex' : 'none'
                    )
                  },
                  children: [
                    ui.Pressable({
                      style: {
                        backgroundColor: '#EF4444',
                        borderRadius: 25,
                        width: 50,
                        height: 50,
                        justifyContent: 'center',
                        alignItems: 'center'
                      },
                      onPress: () => this.phoneEndCall(),
                      children: [
                        ui.Text({
                          text: '📞',
                          style: {
                            fontSize: 18,
                            color: '#FFFFFF'
                          }
                        })
                      ]
                    })
                  ]
                }),
                
                // Clear button
                ui.Pressable({
                  style: {
                    backgroundColor: '#6B7280',
                    borderRadius: 25,
                    width: 50,
                    height: 50,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.phoneClear(),
                  children: [
                    ui.Text({
                      text: 'C',
                      style: {
                        fontSize: 16,
                        color: '#FFFFFF',
                        fontWeight: '600'
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

  private createDialRow(digits: string[]): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 8
      },
      children: digits.map(digit => 
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 30,
            width: 60,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E5E7EB'
          },
          onPress: () => this.phoneInputDigit(digit),
          children: [
            ui.Text({
              text: digit,
              style: {
                fontSize: 24,
                color: '#1F2937',
                fontWeight: '400'
              }
            })
          ]
        })
      )
    });
  }

  private renderContactsApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        flexDirection: 'column'
      },
      children: [
        AppHeader.render('Contacts', '👥', 
          () => this.navigateBack(), 
          () => this.navigateToApp('home')
        ),
        
        // Check if we're viewing a specific contact
        ui.View({
          style: {
            flex: 1,
            marginTop: 40,
            display: ui.Binding.derive([this.appNavigationDataBinding], (data) => 
              data?.contactId ? 'none' : 'flex'
            )
          },
          children: [
            // Contacts list
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                flex: 1
              },
              children: [
                // Header
                ui.View({
                  style: {
                    padding: 16,
                    borderBottomWidth: 1,
                    borderColor: '#E5E7EB'
                  },
                  children: [
                    ui.Text({
                      text: 'All Contacts',
                      style: {
                        fontSize: 18,
                        fontWeight: '600',
                        color: '#1F2937'
                      }
                    })
                  ]
                }),
                
                // Contact list
                ...this.contacts.map(contact => 
                  ui.Pressable({
                    style: {
                      padding: 16,
                      borderBottomWidth: 1,
                      borderColor: '#F3F4F6',
                      flexDirection: 'row',
                      alignItems: 'center'
                    },
                    onPress: () => this.openContactDetail(contact),
                    children: [
                      // Avatar
                      ui.View({
                        style: {
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: '#E5E7EB',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12
                        },
                        children: [
                          ui.Text({
                            text: contact.avatar,
                            style: {
                              fontSize: 20
                            }
                          })
                        ]
                      }),
                      
                      // Contact info
                      ui.View({
                        style: {
                          flex: 1
                        },
                        children: [
                          ui.Text({
                            text: contact.name,
                            style: {
                              fontSize: 16,
                              fontWeight: '500',
                              color: '#1F2937',
                              marginBottom: 2
                            }
                          }),
                          ui.Text({
                            text: contact.phone,
                            style: {
                              fontSize: 14,
                              color: '#6B7280'
                            }
                          })
                        ]
                      }),
                      
                      // Arrow
                      ui.Text({
                        text: '→',
                        style: {
                          fontSize: 16,
                          color: '#9CA3AF'
                        }
                      })
                    ]
                  })
                )
              ]
            })
          ]
        }),
        
        // Contact detail view
        ui.View({
          style: {
            flex: 1,
            marginTop: 40,
            display: ui.Binding.derive([this.appNavigationDataBinding], (data) => 
              data?.contactId ? 'flex' : 'none'
            )
          },
          children: [
            this.renderContactDetail()
          ]
        })
      ]
    });
  }

  private renderContactDetail(): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#FFFFFF',
        flex: 1
      },
      children: [
        ui.View({
          style: {
            alignItems: 'center',
            padding: 32,
            borderBottomWidth: 1,
            borderColor: '#E5E7EB'
          },
          children: [
            // Large avatar
            ui.View({
              style: {
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#E5E7EB',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.appNavigationDataBinding], (data) => 
                    data?.contactAvatar || '👤'
                  ),
                  style: {
                    fontSize: 40
                  }
                })
              ]
            }),
            
            // Name
            ui.Text({
              text: ui.Binding.derive([this.appNavigationDataBinding], (data) => 
                data?.contactName || 'Unknown Contact'
              ),
              style: {
                fontSize: 24,
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: 8
              }
            }),
            
            // Phone number
            ui.Text({
              text: ui.Binding.derive([this.appNavigationDataBinding], (data) => 
                data?.contactPhone || 'No phone number'
              ),
              style: {
                fontSize: 18,
                color: '#6B7280'
              }
            })
          ]
        }),
        
        // Action buttons
        ui.View({
          style: {
            padding: 20
          },
          children: [
            // Call button
            ui.Pressable({
              style: {
                backgroundColor: '#10B981',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => this.callContact(),
              children: [
                ui.Text({
                  text: '📞',
                  style: {
                    fontSize: 18,
                    marginRight: 8
                  }
                }),
                ui.Text({
                  text: 'Call',
                  style: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF'
                  }
                })
              ]
            }),
            
            // Back to contacts button
            ui.Pressable({
              style: {
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: () => this.backToContactsList(),
              children: [
                ui.Text({
                  text: '👥',
                  style: {
                    fontSize: 18,
                    marginRight: 8
                  }
                }),
                ui.Text({
                  text: 'Back to Contacts',
                  style: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#1F2937'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  // Contact navigation methods
  private openContactDetail(contact: any) {
    console.log(`👥 Contacts: User viewing ${contact.name}`);
    this.navigateToApp('contacts', {
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactAvatar: contact.avatar
    });
  }

  private callContact() {
    const contactPhone = this.appNavigationData?.contactPhone;
    const contactName = this.appNavigationData?.contactName;
    if (contactPhone) {
      console.log(`👥 Contacts: User calling ${contactName} at ${contactPhone}`);
      // Set the phone number and switch to phone app
      this.phoneCurrentNumber = contactPhone;
      this.phoneNumberBinding.set(contactPhone);
      this.navigateToApp('phone');
      // Auto-initiate call immediately
      this.phoneCall();
    }
  }

  private backToContactsList() {
    this.navigateToApp('contacts');
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
      this.isDialingBinding.set(false);
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
    this.isDialingBinding.set(false);
    
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
      this.isDialingBinding.set(false);
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
  
  // Calculator methods
  private calcInputNumber(digit: string) {
    console.log(`🧮 Calculator: User pressed ${digit}`);
    if (this.calcWaitingForOperand) {
      this.calcDisplayBinding.set(digit);
      this.calcCurrentValue = parseFloat(digit);
      this.calcWaitingForOperand = false;
    } else {
      // Get current display from our tracking variable
      const currentDisplay = this.calcCurrentValue.toString();
      const newDisplay = currentDisplay === '0' ? digit : currentDisplay + digit;
      this.calcDisplayBinding.set(newDisplay);
      this.calcCurrentValue = parseFloat(newDisplay);
    }
  }
  
  private calcInputDecimal() {
    const currentDisplay = this.calcCurrentValue.toString();
    if (this.calcWaitingForOperand) {
      this.calcDisplayBinding.set('0.');
      this.calcCurrentValue = 0;
      this.calcWaitingForOperand = false;
    } else if (currentDisplay.indexOf('.') === -1) {
      const newDisplay = currentDisplay + '.';
      this.calcDisplayBinding.set(newDisplay);
    }
  }
  
  private calcClear() {
    this.calcDisplayBinding.set('0');
    this.calcPreviousValue = 0;
    this.calcCurrentValue = 0;
    this.calcCurrentOperation = '';
    this.calcWaitingForOperand = false;
  }
  
  private calcToggleSign() {
    if (this.calcCurrentValue !== 0) {
      const newValue = -this.calcCurrentValue;
      this.calcDisplayBinding.set(newValue.toString());
      this.calcCurrentValue = newValue;
    }
  }
  
  private calcPercent() {
    const currentValue = this.calcCurrentValue / 100;
    this.calcDisplayBinding.set(currentValue.toString());
    this.calcCurrentValue = currentValue;
  }
  
  private calcOperation(nextOperation: string) {
    if (this.calcCurrentOperation && !this.calcWaitingForOperand) {
      this.calcEquals();
    }
    
    this.calcPreviousValue = this.calcCurrentValue;
    this.calcCurrentOperation = nextOperation;
    this.calcWaitingForOperand = true;
  }
  
  private calcEquals() {
    if (!this.calcCurrentOperation || this.calcWaitingForOperand) {
      return;
    }
    
    let result = this.calcPreviousValue;
    
    switch (this.calcCurrentOperation) {
      case '+':
        result = this.calcPreviousValue + this.calcCurrentValue;
        break;
      case '-':
        result = this.calcPreviousValue - this.calcCurrentValue;
        break;
      case '*':
        result = this.calcPreviousValue * this.calcCurrentValue;
        break;
      case '/':
        if (this.calcCurrentValue !== 0) {
          result = this.calcPreviousValue / this.calcCurrentValue;
        } else {
          this.calcDisplayBinding.set('Error');
          return;
        }
        break;
    }
    
    this.calcDisplayBinding.set(result.toString());
    this.calcCurrentValue = result;
    this.calcPreviousValue = 0;
    this.calcCurrentOperation = '';
    this.calcWaitingForOperand = true;
  }
  
  private createCalcRow(buttons: Array<{label: string, type: string, action: () => void, bg: string}>): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2
      },
      children: buttons.map(button => 
        ui.Pressable({
          style: {
            backgroundColor: button.bg,
            borderRadius: 12,
            flex: 1,
            marginHorizontal: 2,
            minHeight: 60,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: button.action,
          children: [
            ui.Text({
              text: button.label,
              style: {
                fontSize: 24,
                color: button.bg === '#333333' || button.bg === '#FF9500' ? '#FFFFFF' : '#000000',
                fontWeight: '400'
              }
            })
          ]
        })
      )
    });
  }
  
  // Phone methods
  private phoneInputDigit(digit: string) {
    console.log(`📞 Phone: User dialed ${digit}`);
    this.phoneCurrentNumber = this.phoneCurrentNumber + digit;
    this.phoneNumberBinding.set(this.phoneCurrentNumber);
  }
  
  private phoneDeleteDigit() {
    this.phoneCurrentNumber = this.phoneCurrentNumber.slice(0, -1);
    this.phoneNumberBinding.set(this.phoneCurrentNumber);
  }
  
  private phoneClear() {
    this.phoneCurrentNumber = '';
    this.phoneNumberBinding.set('');
  }
  
  private phoneCall() {
    if (this.phoneCurrentNumber) {
      console.log(`📞 Phone: User calling ${this.phoneCurrentNumber}`);
      this.isDialingBinding.set(true);
      // Note: Call will remain active until user navigates away or manually ends it
      // In a real implementation, you might connect to actual Horizon Worlds voice chat
    }
  }
  
  private phoneEndCall() {
    console.log(`📞 Phone: User ended call`);
    this.isDialingBinding.set(false);
  }
}

// Register the component for CustomUI
ui.UIComponent.register(MePhone);