import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

class MePhone extends ui.UIComponent<typeof MePhone> {
  static propsDefinition = {};

  // State management for current app
  private currentAppBinding = new ui.Binding('home');
  
  // Phone app state - MINIMAL bindings like PhoneApp.ts
  private phoneNumberBinding = new ui.Binding('');
  private isDialingBinding = new ui.Binding(false);
  
  // Create minimal derived bindings once
  private isHomeBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'home');
  private isPhoneAppBinding = ui.Binding.derive([this.currentAppBinding], (currentApp) => currentApp === 'phone');
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
                ui.UINode.if(this.isPhoneAppBinding, this.renderPhoneApp())
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
}

hz.Component.register(MePhone);
