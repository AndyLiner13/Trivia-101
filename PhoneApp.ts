import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

class PhoneApp extends ui.UIComponent<typeof PhoneApp> {
  static propsDefinition = {};
  
  private phoneNumberBinding = new ui.Binding('');
  private isDialingBinding = new ui.Binding(false);

  initializeUI(): ui.UINode {
    return this.renderPhoneFrame();
  }

  start() {
    super.start();
  }

  // Utility function from MePhone/utils/phoneUtils.ts
  private formatPhoneNumber(num: string): string {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
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
                this.renderPhoneApp()
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
        height: '100%'
      },
      children: [
        // Dialer Screen
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.isDialingBinding], (isDialing) => 
              !isDialing ? 'flex' : 'none'
            )
          },
          children: [this.renderDialerScreen()]
        }),
        // Dialing Screen
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.isDialingBinding], (isDialing) => 
              isDialing ? 'flex' : 'none'
            )
          },
          children: [this.renderDialingScreen()]
        })
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
            ui.Text({
              text: '🏠',
              style: {
                fontSize: 16,
                color: '#9CA3AF'
              }
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
            marginTop: 32, // Account for fixed header
            minHeight: 80
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
                phoneNumber ? this.formatPhoneNumber(phoneNumber) : 'Enter phone number'
              ),
              style: {
                color: '#FFFFFF',
                fontSize: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
                  phoneNumber ? 20 : 14
                ),
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
                // Delete button
                ui.Pressable({
                  style: {
                    backgroundColor: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) =>
                      phoneNumber ? '#D1D5DB' : '#F3F4F6'
                    ),
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
                    ui.Text({
                      text: '⌫',
                      style: {
                        fontSize: 18,
                        color: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) =>
                          phoneNumber ? '#374151' : '#9CA3AF'
                        )
                      }
                    })
                  ]
                }),
                // Call button
                ui.Pressable({
                  style: {
                    backgroundColor: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) =>
                      phoneNumber ? '#10B981' : '#D1FAE5'
                    ),
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
                    ui.Text({
                      text: '📞',
                      style: {
                        fontSize: 18,
                        color: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) =>
                          phoneNumber ? '#FFFFFF' : '#10B981'
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
            ui.Text({
              text: '📞',
              style: {
                fontSize: 48
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
            ui.Text({
              text: '❌',
              style: {
                fontSize: 28,
                color: '#FFFFFF'
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

hz.Component.register(PhoneApp);
