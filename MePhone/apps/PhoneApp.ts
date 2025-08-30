import * as ui from 'horizon/ui';

export interface PhoneAppProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * PhoneApp - Dialer interface for making calls
 * Refactored from root PhoneApp.ts
 */
export class PhoneApp {
  private static phoneNumberBinding = new ui.Binding('');
  private static isDialingBinding = new ui.Binding(false);

  static render(props: PhoneAppProps): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6'
      },
      children: [
        // Header
        this.renderHeader(props),
        // Content
        ui.View({
          style: {
            flex: 1,
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
        })
      ]
    });
  }

  private static renderHeader(props: PhoneAppProps): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB'
      },
      children: [
        // Back button
        ui.Pressable({
          style: {
            padding: 8,
            borderRadius: 8
          },
          onPress: props.onBack,
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
        // App title and icon
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: '📞',
              style: {
                fontSize: 18,
                marginRight: 8
              }
            }),
            ui.Text({
              text: 'Phone',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#000000'
              }
            })
          ]
        }),
        // Home button
        ui.Pressable({
          style: {
            padding: 8,
            borderRadius: 8
          },
          onPress: props.onHome,
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
    });
  }

  private static renderDialerScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        flexDirection: 'column'
      },
      children: [
        // Phone number display
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            padding: 20,
            alignItems: 'center',
            marginBottom: 10
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
                phoneNumber || 'Enter phone number'
              ),
              style: {
                fontSize: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
                  phoneNumber ? 24 : 18
                ),
                color: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
                  phoneNumber ? '#000000' : '#9CA3AF'
                ),
                textAlign: 'center'
              }
            })
          ]
        }),
        
        // Dial Pad
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
                      text: '↩️',
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
                      phoneNumber ? '#10B981' : '#D1D5DB'
                    ),
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 1,
                    minHeight: 45,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.handleCallPress(),
                  children: [
                    ui.Text({
                      text: '📞',
                      style: {
                        fontSize: 18,
                        color: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) =>
                          phoneNumber ? '#FFFFFF' : '#9CA3AF'
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

  private static createDialPadRow(digits: string[]): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginVertical: 4
      },
      children: digits.map((digit) => 
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 35,
            width: 65,
            height: 65,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000000',
            shadowOffset: [0, 2],
            shadowOpacity: 0.1,
            shadowRadius: 4
          },
          onPress: () => {
            this.phoneNumberBinding.set(prev => prev + digit);
          },
          children: [
            ui.Text({
              text: digit,
              style: {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#1F2937'
              }
            })
          ]
        })
      )
    });
  }

  private static renderDialingScreen(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#10B981',
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
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16
          }
        }),
        
        // Phone number display
        ui.Text({
          text: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
            this.formatPhoneNumber(phoneNumber) || 'Unknown'
          ),
          style: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 18,
            textAlign: 'center',
            marginBottom: 40
          }
        }),
        
        // End call button
        ui.Pressable({
          style: {
            backgroundColor: '#EF4444',
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
              text: '📵',
              style: {
                fontSize: 32
              }
            })
          ]
        })
      ]
    });
  }

  private static handleCallPress(): void {
    // Get current phone number value and simulate calling
    this.isDialingBinding.set(true);
    // Note: In Horizon Worlds, we'd use event-driven patterns instead of setTimeout
    // For demo purposes, we'll just show the dialing screen
  }

  private static formatPhoneNumber(num: string): string {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
  }
}
