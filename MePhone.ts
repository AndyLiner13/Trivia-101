import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

// Contact interface
interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  company?: string;
  address?: string;
  website?: string;
  lastContact?: string;
}

// Email interface
interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
}

class MePhone extends ui.UIComponent<typeof MePhone> {
  static propsDefinition = {};

  // State management for current app
  private currentAppBinding = new ui.Binding('home');
  
  // Phone app state - MINIMAL bindings like PhoneApp.ts
  private phoneNumberBinding = new ui.Binding('');
  private isDialingBinding = new ui.Binding(false);
  
  // Calculator app state
  private calcDisplayBinding = new ui.Binding('0');
  private calcPreviousValueBinding = new ui.Binding('');
  private calcOperationBinding = new ui.Binding('');
  private calcWaitingForOperandBinding = new ui.Binding(false);

  // Internal calculator state tracking
  private calcDisplay = '0';
  private calcPreviousValue = '';
  private calcOperation = '';
  private calcWaitingForOperand = false;

  // Contacts app state
  private selectedContactBinding = new ui.Binding<Contact | null>(null);
  private favoritesBinding = new ui.Binding<Set<number>>(new Set());

  // MeMail app state
  private selectedEmailBinding = new ui.Binding<Email | null>(null);
  private isComposingBinding = new ui.Binding<boolean>(false);
  private composeToBinding = new ui.Binding<string>('');
  private composeSubjectBinding = new ui.Binding<string>('');
  private composeBodyBinding = new ui.Binding<string>('');

  // Sample emails data
  private emails: Email[] = [
    {
      id: '1',
      from: 'Sarah Wilson',
      subject: 'Project Update - Q4 Review',
      preview: 'Hi team, I wanted to share the latest updates on our Q4 review process...',
      timestamp: '10:30 AM',
      isRead: false
    },
    {
      id: '2',
      from: 'Alex Chen',
      subject: 'Design System Documentation',
      preview: 'Hey! I have finished updating the design system docs. The new components...',
      timestamp: '9:15 AM',
      isRead: false
    },
    {
      id: '3',
      from: 'Netflix',
      subject: 'New shows added to your list',
      preview: 'Check out the latest additions to Netflix. We think you will love these...',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: '4',
      from: 'Mom',
      subject: 'Dinner this Sunday?',
      preview: 'Hi honey! Are you free for dinner this Sunday? Dad and I were thinking...',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: '5',
      from: 'GitHub',
      subject: '[Security] New sign-in from MacBook Pro',
      preview: 'We noticed a new sign-in to your account from a MacBook Pro...',
      timestamp: '2 days ago',
      isRead: false
    },
    {
      id: '6',
      from: 'John Davis',
      subject: 'Meeting Rescheduled',
      preview: 'Hope you are doing well! I need to reschedule our meeting...',
      timestamp: '3 days ago',
      isRead: true
    }
  ];

  // Sample contacts data
  private contacts: Contact[] = [
    {
      id: 1,
      name: 'Alice Johnson',
      phone: '(555) 123-4567',
      email: 'alice.johnson@email.com',
      avatar: '👩',
      company: 'Tech Corp',
      address: '123 Main St, City',
      lastContact: '2 days ago'
    },
    {
      id: 2,
      name: 'Bob Smith',
      phone: '(555) 234-5678',
      email: 'bob.smith@email.com',
      avatar: '👨',
      company: 'Design Studio',
      lastContact: '1 week ago'
    },
    {
      id: 3,
      name: 'Carol Davis',
      phone: '(555) 345-6789',
      email: 'carol.davis@email.com',
      avatar: '👩',
      company: 'Art Gallery',
      address: '456 Oak Ave, Town',
      lastContact: '3 days ago'
    },
    {
      id: 4,
      name: 'David Wilson',
      phone: '(555) 456-7890',
      avatar: '👨',
      company: 'Research Lab',
      lastContact: '1 month ago'
    },
    {
      id: 5,
      name: 'Emma Brown',
      phone: '(555) 567-8901',
      email: 'emma.brown@email.com',
      avatar: '👩',
      company: 'University',
      address: '789 Pine St, Village',
      lastContact: '2 weeks ago'
    },
    {
      id: 6,
      name: 'Frank Miller',
      phone: '(555) 678-9012',
      avatar: '👨',
      company: 'Restaurant',
      lastContact: '5 days ago'
    }
  ];
  
  // Create minimal derived bindings once
  private isHomeBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'home');
  private isPhoneAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'phone');
  private isCalculatorAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'calculator');
  private isContactsAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'contacts');
  private isMemailAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'memail');
  private isDialerBinding = ui.Binding.derive([this.isDialingBinding], (isDialing) => !isDialing);

  initializeUI(): ui.UINode {
    return this.renderPhoneFrame();
  }

  start() {
    super.start();
  }

  private renderPhoneFrame(): ui.UINode {
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
                // Use UINode.if for proper conditional rendering - only renders active app
                ui.UINode.if(this.isHomeBinding, this.renderHomeScreen()),
                ui.UINode.if(this.isPhoneAppBinding, this.renderPhoneApp()),
                ui.UINode.if(this.isCalculatorAppBinding, this.renderCalculatorApp()),
                ui.UINode.if(this.isContactsAppBinding, this.renderContactsApp()),
                ui.UINode.if(this.isMemailAppBinding, this.renderMemailApp())
              ]
            })
          ]
        })
      ]
    });
  }

  private renderHomeScreen(): ui.UINode {
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
                this.createAppIcon('Phone', '#10B981', BigInt("24322726084045822"), 'phone'), // green-500
                this.createAppIcon('Calculator', '#3B82F6', BigInt("2175040452971461"), 'calculator') // blue-500
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
                this.createAppIcon('Contacts', '#F97316', BigInt("1328787472168292"), 'contacts'), // orange-500
                this.createAppIcon('MeMail', '#EF4444', BigInt("2571486876541221"), 'memail') // red-500
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
                this.createAppIcon('Browser', '#8B5CF6', BigInt("592774970456232"), 'browser'), // purple-500
                this.createAppIcon('Settings', '#6B7280', BigInt("1342398257464986"), 'settings') // gray-500
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
        padding: 6
      },
      onPress: () => {
        this.currentAppBinding.set(appId);
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
            // App icon symbol
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(assetId)),
              style: {
                width: 26,
                height: 26,
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
            fontSize: 13,
            fontWeight: '500',
            textAlign: 'center'
          }
        })
      ]
    });
  }

  // Phone number formatting utility
  private formatPhoneNumber(num: string): string {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
  }

  // Calculator display formatting utility
  private formatCalculatorDisplay(value: string): string {
    if (value.length > 12) {
      const num = parseFloat(value);
      if (num > 999999999999) {
        return num.toExponential(5);
      }
      return num.toFixed(8).replace(/\.?0+$/, '');
    }
    return value;
  }

  // Contacts utility function
  private groupContactsByLetter(contacts: Contact[]): Record<string, Contact[]> {
    return contacts.reduce((groups, contact) => {
      const firstLetter = contact.name[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(contact);
      return groups;
    }, {} as Record<string, Contact[]>);
  }

  private renderPhoneApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Use UINode.if for conditional rendering - only render active screen
        ui.UINode.if(this.isDialerBinding, this.renderDialerScreen()),
        ui.UINode.if(this.isDialingBinding, this.renderDialingScreen())
      ]
    });
  }

  private renderDialerScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6', // gray-100
        flexDirection: 'column'
      },
      children: [
        // Header - fixed at top
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.Pressable({
              style: {
                padding: 4
              },
              onPress: () => {
                this.currentAppBinding.set('home');
                // Reset phone state
                this.phoneNumberBinding.set('');
                this.isDialingBinding.set(false);
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 16,
                    height: 16,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            }),
            ui.Text({
              text: 'Phone',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),
        
        // Number Display - larger and more prominent
        ui.View({
          style: {
            backgroundColor: '#000000',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginTop: 36, // Account for fixed header
            minHeight: 80
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
                phoneNumber ? this.formatPhoneNumber(phoneNumber) : 'Enter phone number'
              ),
              style: {
                color: '#FFFFFF',
                fontSize: 18, // Static size for better performance
                fontWeight: '300',
                textAlign: 'center'
              }
            })
          ]
        }),
        
        // Dial Pad - improved spacing and sizing
        ui.View({
          style: {
            flex: 1,
            padding: 8,
            flexDirection: 'column',
            justifyContent: 'space-evenly'
          },
          children: [
            // Row 1: 1, 2, 3
            this.createDialPadRow(['1', '2', '3']),
            // Row 2: 4, 5, 6
            this.createDialPadRow(['4', '5', '6']),
            // Row 3: 7, 8, 9
            this.createDialPadRow(['7', '8', '9']),
            // Row 4: *, 0, #
            this.createDialPadRow(['*', '0', '#']),
            // Action buttons row
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 4,
                marginTop: 2
              },
              children: [
                // Delete button - static styling for performance
                ui.Pressable({
                  style: {
                    backgroundColor: '#E5E7EB', // Static gray
                    borderRadius: 8,
                    flex: 1,
                    marginRight: 1,
                    minHeight: 45,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => {
                    this.phoneNumberBinding.set(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1083116303985907"))),
                      style: {
                        width: 18,
                        height: 18,
                        tintColor: '#6B7280' // Static gray
                      }
                    })
                  ]
                }),
                // Call button - static styling for performance
                ui.Pressable({
                  style: {
                    backgroundColor: '#10B981', // Static green
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 1,
                    minHeight: 45,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => {
                    this.handleCallPress();
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1127859349222459"))),
                      style: {
                        width: 18,
                        height: 18,
                        tintColor: '#FFFFFF' // Static white
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

  private renderDialingScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#10B981', // green-500
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
      },
      children: [
        // Phone icon container
        ui.View({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 32,
            width: 120,
            height: 120,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24322726084045822"))),
              style: {
                width: 48,
                height: 48,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),
        
        // Calling text
        ui.Text({
          text: 'Calling...',
          style: {
            color: '#FFFFFF',
            fontSize: 28,
            fontWeight: '500',
            marginBottom: 8,
            textAlign: 'center'
          }
        }),
        
        // Phone number
        ui.Text({
          text: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
            this.formatPhoneNumber(phoneNumber)
          ),
          style: {
            color: '#FFFFFF',
            fontSize: 20,
            opacity: 0.9,
            marginBottom: 48,
            textAlign: 'center'
          }
        }),
        
        // End call button
        ui.Pressable({
          style: {
            backgroundColor: '#EF4444', // red-500
            borderRadius: 32,
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: () => {
            this.isDialingBinding.set(false);
            this.phoneNumberBinding.set('');
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("619686277659622"))),
              style: {
                width: 28,
                height: 28,
                tintColor: '#FFFFFF'
              }
            })
          ]
        })
      ]
    });
  }

  private createDialPadRow(digits: string[]): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginVertical: 1
      },
      children: digits.map(digit => 
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 1,
            minHeight: 45,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: () => {
            this.phoneNumberBinding.set(prev => 
              prev.length < 10 ? prev + digit : prev
            );
          },
          children: [
            ui.Text({
              text: digit,
              style: {
                fontSize: 22,
                color: '#374151',
                fontWeight: '400'
              }
            })
          ]
        })
      )
    });
  }

  private handleCallPress(): void {
    this.isDialingBinding.set(true);
  }

  private renderCalculatorApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6', // gray-100
        flexDirection: 'column'
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.Pressable({
              style: {
                padding: 4
              },
              onPress: () => {
                this.currentAppBinding.set('home');
                // Reset calculator state
                this.calcClear();
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 16,
                    height: 16,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            }),
            ui.Text({
              text: 'Calculator',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),
        
        // Display
        ui.View({
          style: {
            backgroundColor: '#000000',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginTop: 36, // Account for header
            minHeight: 80
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.calcDisplayBinding], (display) => 
                this.formatCalculatorDisplay(display)
              ),
              style: {
                color: '#FFFFFF',
                fontSize: 24,
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
            padding: 8,
            flexDirection: 'column',
            justifyContent: 'space-evenly'
          },
          children: [
            // Row 1: C, CE, ⌫, ÷
            this.createCalculatorRow([
              { label: 'C', type: 'function', action: () => this.calcClear(), bg: '#D1D5DB' },
              { label: 'CE', type: 'function', action: () => this.calcClearEntry(), bg: '#D1D5DB' },
              { label: '⌫', type: 'function', action: () => this.calcDeleteDigit(), bg: '#D1D5DB' },
              { label: '÷', type: 'operation', action: () => this.calcInputOperation('÷'), bg: '#F97316' }
            ]),
            // Row 2: 7, 8, 9, ×
            this.createCalculatorRow([
              { label: '7', type: 'number', action: () => this.calcInputNumber('7'), bg: '#FFFFFF' },
              { label: '8', type: 'number', action: () => this.calcInputNumber('8'), bg: '#FFFFFF' },
              { label: '9', type: 'number', action: () => this.calcInputNumber('9'), bg: '#FFFFFF' },
              { label: '×', type: 'operation', action: () => this.calcInputOperation('×'), bg: '#F97316' }
            ]),
            // Row 3: 4, 5, 6, -
            this.createCalculatorRow([
              { label: '4', type: 'number', action: () => this.calcInputNumber('4'), bg: '#FFFFFF' },
              { label: '5', type: 'number', action: () => this.calcInputNumber('5'), bg: '#FFFFFF' },
              { label: '6', type: 'number', action: () => this.calcInputNumber('6'), bg: '#FFFFFF' },
              { label: '-', type: 'operation', action: () => this.calcInputOperation('-'), bg: '#F97316' }
            ]),
            // Row 4: 1, 2, 3, +
            this.createCalculatorRow([
              { label: '1', type: 'number', action: () => this.calcInputNumber('1'), bg: '#FFFFFF' },
              { label: '2', type: 'number', action: () => this.calcInputNumber('2'), bg: '#FFFFFF' },
              { label: '3', type: 'number', action: () => this.calcInputNumber('3'), bg: '#FFFFFF' },
              { label: '+', type: 'operation', action: () => this.calcInputOperation('+'), bg: '#F97316' }
            ]),
            // Row 5: 0 (wide), ., =
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 4,
                marginVertical: 1
              },
              children: [
                // 0 button (double width)
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    flex: 2,
                    marginHorizontal: 1,
                    minHeight: 45,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcInputNumber('0'),
                  children: [
                    ui.Text({
                      text: '0',
                      style: {
                        fontSize: 22,
                        color: '#374151',
                        fontWeight: '400'
                      }
                    })
                  ]
                }),
                // . button
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    flex: 1,
                    marginHorizontal: 1,
                    minHeight: 45,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcInputDecimal(),
                  children: [
                    ui.Text({
                      text: '.',
                      style: {
                        fontSize: 22,
                        color: '#374151',
                        fontWeight: '400'
                      }
                    })
                  ]
                }),
                // = button
                ui.Pressable({
                  style: {
                    backgroundColor: '#F97316', // orange-500
                    borderRadius: 8,
                    flex: 1,
                    marginHorizontal: 1,
                    minHeight: 45,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcPerformCalculation(),
                  children: [
                    ui.Text({
                      text: '=',
                      style: {
                        fontSize: 22,
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

  private createCalculatorRow(buttons: Array<{label: string, type: string, action: () => void, bg: string}>): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginVertical: 1
      },
      children: buttons.map(button => 
        ui.Pressable({
          style: {
            backgroundColor: button.bg,
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 1,
            minHeight: 45,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: button.action,
          children: [
            button.label === '⌫' ? 
              ui.Image({
                source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("645495034835211"))),
                style: {
                  width: 22,
                  height: 22,
                  tintColor: button.bg === '#FFFFFF' ? '#374151' : '#FFFFFF'
                }
              }) :
              ui.Text({
                text: button.label,
                style: {
                  fontSize: 22,
                  color: button.bg === '#FFFFFF' ? '#374151' : '#FFFFFF',
                  fontWeight: '400'
                }
              })
          ]
        })
      )
    });
  }

  // Calculator logic methods
  private calcInputNumber(num: string): void {
    if (this.calcWaitingForOperand) {
      this.calcDisplay = num;
      this.calcWaitingForOperand = false;
    } else {
      this.calcDisplay = this.calcDisplay === '0' ? num : this.calcDisplay + num;
    }
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcInputOperation(nextOperation: string): void {
    const inputValue = parseFloat(this.calcDisplay);

    if (this.calcPreviousValue === '') {
      this.calcPreviousValue = this.calcDisplay;
    } else if (this.calcOperation) {
      const currentValue = this.calcPreviousValue || '0';
      const newValue = this.calcCalculate(parseFloat(currentValue), inputValue, this.calcOperation);
      
      this.calcDisplay = String(newValue);
      this.calcPreviousValue = String(newValue);
      this.calcDisplayBinding.set(this.calcDisplay);
    }

    this.calcWaitingForOperand = true;
    this.calcOperation = nextOperation;
    this.calcPreviousValueBinding.set(this.calcPreviousValue);
    this.calcOperationBinding.set(this.calcOperation);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcCalculate(firstOperand: number, secondOperand: number, operation: string): number {
    switch (operation) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '×':
        return firstOperand * secondOperand;
      case '÷':
        return secondOperand !== 0 ? firstOperand / secondOperand : 0;
      default:
        return secondOperand;
    }
  }

  private calcPerformCalculation(): void {
    if (this.calcPreviousValue && this.calcOperation) {
      const inputValue = parseFloat(this.calcDisplay);
      const currentValue = parseFloat(this.calcPreviousValue);
      const newValue = this.calcCalculate(currentValue, inputValue, this.calcOperation);

      this.calcDisplay = String(newValue);
      this.calcPreviousValue = '';
      this.calcOperation = '';
      this.calcWaitingForOperand = true;
      
      this.calcDisplayBinding.set(this.calcDisplay);
      this.calcPreviousValueBinding.set(this.calcPreviousValue);
      this.calcOperationBinding.set(this.calcOperation);
      this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
    }
  }

  private calcClear(): void {
    this.calcDisplay = '0';
    this.calcPreviousValue = '';
    this.calcOperation = '';
    this.calcWaitingForOperand = false;
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcPreviousValueBinding.set(this.calcPreviousValue);
    this.calcOperationBinding.set(this.calcOperation);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcClearEntry(): void {
    this.calcDisplay = '0';
    this.calcWaitingForOperand = false;
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcInputDecimal(): void {
    if (this.calcWaitingForOperand) {
      this.calcDisplay = '0.';
      this.calcWaitingForOperand = false;
    } else if (this.calcDisplay.indexOf('.') === -1) {
      this.calcDisplay = this.calcDisplay + '.';
    }
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcDeleteDigit(): void {
    if (this.calcDisplay.length > 1 && this.calcDisplay !== '0') {
      this.calcDisplay = this.calcDisplay.slice(0, -1);
    } else {
      this.calcDisplay = '0';
    }
    
    this.calcDisplayBinding.set(this.calcDisplay);
  }

  private renderContactsApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Contact Detail View
        ui.UINode.if(
          ui.Binding.derive([this.selectedContactBinding], (contact) => contact !== null),
          this.renderContactDetail()
        ),
        // Contacts List View
        ui.UINode.if(
          ui.Binding.derive([this.selectedContactBinding], (contact) => contact === null),
          this.renderContactsList()
        )
      ]
    });
  }

  private renderContactDetail(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Pressable({
                  style: {
                    padding: 4
                  },
                  onPress: () => {
                    this.currentAppBinding.set('home');
                    this.selectedContactBinding.set(null);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#9CA3AF'
                      }
                    })
                  ]
                }),
                ui.Pressable({
                  style: {
                    marginLeft: 8
                  },
                  onPress: () => {
                    this.selectedContactBinding.set(null);
                  },
                  children: [
                    ui.Text({
                      text: '⬅️',
                      style: {
                        fontSize: 18,
                        color: '#3B82F6'
                      }
                    })
                  ]
                })
              ]
            }),
            ui.Text({
              text: 'Contact',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),
        
        // Contact Info - Top aligned
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginTop: 36 // Account for fixed header
          },
          children: [
            // Avatar
            ui.View({
              style: {
                width: 60,
                height: 60,
                backgroundColor: '#3B82F6',
                borderRadius: 15,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                    contact ? contact.avatar : ''
                  ),
                  style: {
                    fontSize: 32
                  }
                })
              ]
            }),
            
            // Name
            ui.Text({
              text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                contact ? contact.name : ''
              ),
              style: {
                fontSize: 16,
                fontWeight: '500',
                color: '#111827',
                textAlign: 'center',
                marginBottom: 16
              }
            }),
            
            // Action buttons row
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16
              },
              children: [
                // Call button
                ui.Pressable({
                  style: {
                    backgroundColor: '#10B981',
                    borderRadius: 15,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6
                  },
                  onPress: () => {
                    // Switch to phone app and pre-fill the number
                    // Note: In a real implementation, we'd need to access the current contact
                    // For now, we'll use a simplified approach
                    this.currentAppBinding.set('phone');
                    this.selectedContactBinding.set(null);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1127859349222459"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#FFFFFF'
                      }
                    })
                  ]
                }),
                
                // Email button
                ui.Pressable({
                  style: {
                    backgroundColor: '#3B82F6',
                    borderRadius: 15,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6
                  },
                  onPress: () => {
                    console.log('Email button pressed');
                  },
                  children: [
                    ui.Text({
                      text: '📧',
                      style: {
                        fontSize: 16
                      }
                    })
                  ]
                }),
                
                // Favorite button
                ui.Pressable({
                  style: {
                    backgroundColor: '#E5E7EB',
                    borderRadius: 15,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6
                  },
                  onPress: () => {
                    // Toggle favorite status
                    // Note: We need to access the current selected contact differently
                    // For now, we'll handle this in a simplified way
                    this.favoritesBinding.set(prev => {
                      const newFavorites = new Set(prev);
                      // For this implementation, we'll just toggle a placeholder
                      return newFavorites;
                    });
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("787034810502774"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),
            
            // Contact Details
            ui.View({
              style: {
                width: '100%',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 16
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                    contact ? `Phone: ${contact.phone}` : ''
                  ),
                  style: {
                    fontSize: 14,
                    color: '#111827',
                    marginBottom: 8
                  }
                }),
                ui.Text({
                  text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                    contact && contact.email ? `Email: ${contact.email}` : ''
                  ),
                  style: {
                    fontSize: 14,
                    color: '#111827',
                    marginBottom: 8,
                    display: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                      contact && contact.email ? 'flex' : 'none'
                    )
                  }
                }),
                ui.Text({
                  text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                    contact && contact.company ? `Company: ${contact.company}` : ''
                  ),
                  style: {
                    fontSize: 14,
                    color: '#111827',
                    marginBottom: 8,
                    display: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                      contact && contact.company ? 'flex' : 'none'
                    )
                  }
                }),
                ui.Text({
                  text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                    contact && contact.lastContact ? `Last contact: ${contact.lastContact}` : ''
                  ),
                  style: {
                    fontSize: 12,
                    color: '#6B7280',
                    display: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                      contact && contact.lastContact ? 'flex' : 'none'
                    )
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderContactsList(): ui.UINode {
    const groupedContacts = this.groupContactsByLetter(this.contacts);
    const sortedLetters = Object.keys(groupedContacts).sort();
    
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.Pressable({
              style: {
                padding: 4
              },
              onPress: () => {
                this.currentAppBinding.set('home');
                this.selectedContactBinding.set(null);
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 16,
                    height: 16,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            }),
            ui.Text({
              text: 'Contacts',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),
        
        // Contacts List
        ui.View({
          style: {
            flex: 1,
            marginTop: 36,
            backgroundColor: '#FFFFFF'
          },
          children: [
            // Scrollable contacts list
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  style: {
                    paddingBottom: 20
                  },
                  children: sortedLetters.map(letter => 
                    ui.View({
                      style: {
                        width: '100%'
                      },
                      children: [
                        // Section header
                        this.createSectionHeader(letter),
                        
                        // Contacts in this section
                        ...groupedContacts[letter].map(contact =>
                          this.createContactListItem(contact)
                        )
                      ]
                    })
                  )
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private createSectionHeader(title: string): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB', // gray-50
        paddingHorizontal: 16,
        paddingVertical: 4,
        width: '100%'
      },
      children: [
        ui.Text({
          text: title.toUpperCase(),
          style: {
            fontSize: 12,
            color: '#6B7280',
            fontWeight: '500'
          }
        })
      ]
    });
  }

  private createContactListItem(contact: Contact): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: '100%'
      },
      onPress: () => {
        this.selectedContactBinding.set(contact);
      },
      children: [
        // Left content (avatar)
        ui.View({
          style: {
            width: 32,
            height: 32,
            backgroundColor: '#3B82F6', // blue-500
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
          },
          children: [
            ui.Text({
              text: contact.avatar,
              style: {
                fontSize: 16,
                color: '#FFFFFF'
              }
            })
          ]
        }),
        
        // Main content
        ui.View({
          style: {
            flex: 1,
            flexDirection: 'column',
            marginRight: 6
          },
          children: [
            ui.Text({
              text: contact.name,
              style: {
                fontSize: 12,
                fontWeight: '400',
                color: '#111827',
                marginBottom: contact.company || contact.phone ? 1 : 0
              }
            }),
            ...(contact.company || contact.phone ? [
              ui.Text({
                text: contact.company || contact.phone,
                style: {
                  fontSize: 10,
                  color: '#6B7280',
                  fontWeight: '400'
                }
              })
            ] : [])
          ]
        }),
        
        // Right content (favorite star)
        ui.Pressable({
          style: {
            padding: 4,
            borderRadius: 6
          },
          onPress: () => {
            this.favoritesBinding.set(prev => {
              const newFavorites = new Set(prev);
              if (newFavorites.has(contact.id)) {
                newFavorites.delete(contact.id);
              } else {
                newFavorites.add(contact.id);
              }
              return newFavorites;
            });
          },
          children: [
            ui.Image({
              source: ui.Binding.derive([this.favoritesBinding], (favorites) => 
                favorites.has(contact.id) 
                  ? ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24150527294650016")))
                  : ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("787034810502774")))
              ),
              style: {
                width: 14,
                height: 14,
                tintColor: ui.Binding.derive([this.favoritesBinding], (favorites) => 
                  favorites.has(contact.id) ? '#F59E0B' : '#9CA3AF'
                )
              }
            })
          ]
        })
      ]
    });
  }

  private renderMemailApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Inbox View
        ui.UINode.if(
          ui.Binding.derive([this.selectedEmailBinding, this.isComposingBinding], (email, composing) => 
            !email && !composing
          ),
          this.renderInbox()
        ),
        // Email Detail View
        ui.UINode.if(
          ui.Binding.derive([this.selectedEmailBinding], (email) => email !== null),
          this.renderEmailDetail()
        ),
        // Compose View
        ui.UINode.if(
          ui.Binding.derive([this.isComposingBinding], (composing) => composing),
          this.renderCompose()
        )
      ]
    });
  }

  private renderInbox(): ui.UINode {
    const unreadCount = this.emails.filter(e => !e.isRead).length;
    
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F9FAFB'
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.Pressable({
              style: {
                padding: 4
              },
              onPress: () => {
                this.currentAppBinding.set('home');
                // Reset email state
                this.selectedEmailBinding.set(null);
                this.isComposingBinding.set(false);
                this.composeToBinding.set('');
                this.composeSubjectBinding.set('');
                this.composeBodyBinding.set('');
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 16,
                    height: 16,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            }),
            ui.Text({
              text: 'MeMail',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            }),
            ui.Pressable({
              style: {
                padding: 4
              },
              onPress: () => {
                this.isComposingBinding.set(true);
              },
              children: [
                ui.Text({
                  text: '✏️',
                  style: {
                    fontSize: 16
                  }
                })
              ]
            })
          ]
        }),
        
        // Section Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            paddingHorizontal: 12,
            paddingVertical: 3,
            marginTop: 36,
            borderBottomWidth: 1
          },
          children: [
            ui.Text({
              text: `${unreadCount} Unread MeMails`,
              style: {
                fontSize: 10,
                color: '#6B7280',
                fontWeight: '500'
              }
            })
          ]
        }),
        
        // Email List
        ui.View({
          style: {
            flex: 1,
            backgroundColor: '#FFFFFF'
          },
          children: [
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  style: {
                    backgroundColor: '#FFFFFF'
                  },
                  children: this.emails.map(email => this.createEmailItem(email))
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderEmailDetail(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Pressable({
                  style: {
                    padding: 4
                  },
                  onPress: () => {
                    this.currentAppBinding.set('home');
                    this.selectedEmailBinding.set(null);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#9CA3AF'
                      }
                    })
                  ]
                }),
                ui.Pressable({
                  style: {
                    marginLeft: 8
                  },
                  onPress: () => {
                    this.selectedEmailBinding.set(null);
                  },
                  children: [
                    ui.Text({
                      text: '⬅️',
                      style: {
                        fontSize: 18,
                        color: '#3B82F6'
                      }
                    })
                  ]
                })
              ]
            }),
            ui.Text({
              text: 'Email',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),
        
        // Email Content
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginTop: 36
          },
          children: [
            // From
            ui.Text({
              text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                email ? `From: ${email.from}` : ''
              ),
              style: {
                fontSize: 9,
                color: '#6B7280',
                marginBottom: 6
              }
            }),
            // Subject
            ui.Text({
              text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                email ? email.subject : ''
              ),
              style: {
                fontSize: 12,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 12
              }
            }),
            // Body
            ui.Text({
              text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                email ? `${email.preview}\n\nThis is the full email content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.` : ''
              ),
              style: {
                fontSize: 10,
                color: '#374151',
                lineHeight: 14
              }
            })
          ]
        })
      ]
    });
  }

  private renderCompose(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Pressable({
                  style: {
                    padding: 4
                  },
                  onPress: () => {
                    this.currentAppBinding.set('home');
                    this.isComposingBinding.set(false);
                    this.composeToBinding.set('');
                    this.composeSubjectBinding.set('');
                    this.composeBodyBinding.set('');
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#9CA3AF'
                      }
                    })
                  ]
                }),
                ui.Pressable({
                  style: {
                    marginLeft: 8
                  },
                  onPress: () => {
                    this.isComposingBinding.set(false);
                    this.composeToBinding.set('');
                    this.composeSubjectBinding.set('');
                    this.composeBodyBinding.set('');
                  },
                  children: [
                    ui.Text({
                      text: '⬅️',
                      style: {
                        fontSize: 18,
                        color: '#3B82F6'
                      }
                    })
                  ]
                })
              ]
            }),
            ui.Text({
              text: 'Compose',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            }),
            ui.Pressable({
              style: {
                backgroundColor: '#10B981',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4
              },
              onPress: () => {
                console.log('Email sent!');
                this.isComposingBinding.set(false);
                this.composeToBinding.set('');
                this.composeSubjectBinding.set('');
                this.composeBodyBinding.set('');
              },
              children: [
                ui.Text({
                  text: 'Send',
                  style: {
                    fontSize: 12,
                    color: '#FFFFFF',
                    fontWeight: '500'
                  }
                })
              ]
            })
          ]
        }),
        
        // Compose Form
        ui.View({
          style: {
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginTop: 36
          },
          children: [
            // To field
            ui.View({
              style: {
                marginBottom: 12
              },
              children: [
                ui.Text({
                  text: 'To:',
                  style: {
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 4
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8
                  },
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.composeToBinding], (to) => 
                        to || 'recipient@example.com'
                      ),
                      style: {
                        fontSize: 14,
                        color: ui.Binding.derive([this.composeToBinding], (to) => 
                          to ? '#111827' : '#9CA3AF'
                        )
                      }
                    })
                  ]
                })
              ]
            }),
            // Subject field
            ui.View({
              style: {
                marginBottom: 12
              },
              children: [
                ui.Text({
                  text: 'Subject:',
                  style: {
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 4
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8
                  },
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.composeSubjectBinding], (subject) => 
                        subject || 'Enter subject...'
                      ),
                      style: {
                        fontSize: 14,
                        color: ui.Binding.derive([this.composeSubjectBinding], (subject) => 
                          subject ? '#111827' : '#9CA3AF'
                        )
                      }
                    })
                  ]
                })
              ]
            }),
            // Body field
            ui.View({
              style: {
                flex: 1
              },
              children: [
                ui.Text({
                  text: 'Message:',
                  style: {
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 4
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flex: 1,
                    minHeight: 100
                  },
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.composeBodyBinding], (body) => 
                        body || 'Type your message here...'
                      ),
                      style: {
                        fontSize: 14,
                        color: ui.Binding.derive([this.composeBodyBinding], (body) => 
                          body ? '#111827' : '#9CA3AF'
                        )
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

  private createEmailItem(email: Email): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48
      },
      onPress: () => {
        this.selectedEmailBinding.set(email);
      },
      children: [
        // Avatar
        ui.View({
          style: {
            width: 24,
            height: 24,
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            flexShrink: 0
          },
          children: [
            ui.Text({
              text: email.from.charAt(0),
              style: {
                fontSize: 10,
                color: '#FFFFFF',
                fontWeight: '500'
              }
            })
          ]
        }),
        
        // Content - Fixed width area
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            paddingRight: 8
          },
          children: [
            // Sender row with consistent spacing
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 2,
                height: 14
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexShrink: 0
                  },
                  children: [
                    ui.Text({
                      text: email.from,
                      style: {
                        fontSize: 11,
                        fontWeight: email.isRead ? '400' : '600',
                        color: '#111827'
                      }
                    }),
                    // Fixed space for unread dot
                    ui.View({
                      style: {
                        width: 10,
                        height: 14,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        paddingLeft: 4
                      },
                      children: [
                        ui.View({
                          style: {
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: email.isRead ? 'transparent' : '#3B82F6'
                          }
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            // Subject row
            ui.View({
              style: {
                height: 12,
                justifyContent: 'center'
              },
              children: [
                ui.Text({
                  text: email.subject,
                  style: {
                    fontSize: 9,
                    color: '#6B7280',
                    fontWeight: '400'
                  }
                })
              ]
            })
          ]
        }),
        
        // Timestamp - Fixed width
        ui.View({
          style: {
            width: 48,
            height: 24,
            justifyContent: 'center',
            alignItems: 'flex-end',
            flexShrink: 0
          },
          children: [
            ui.Text({
              text: email.timestamp,
              style: {
                fontSize: 8,
                color: '#9CA3AF'
              }
            })
          ]
        })
      ]
    });
  }
}

hz.Component.register(MePhone);
