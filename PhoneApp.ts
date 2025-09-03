import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';

export class PhoneApp {
  // Phone app state bindings
  private phoneNumberBinding = new ui.Binding('');
  private isDialingBinding = new ui.Binding(false);

  // Derived bindings
  private isDialerBinding = ui.Binding.derive([this.isDialingBinding], (isDialing) => !isDialing);

  constructor() {}

  // Phone number formatting utility
  private formatPhoneNumber(num: string): string {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
  }

  // Standardized Header Component
  private createAppHeader(props: {
    appName: string;
    onHomePress: () => void;
    onBackPress?: () => void;
    showBackButton?: boolean;
    rightElement?: ui.UINode;
  }): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 36,
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
            // Home button
            ui.Pressable({
              style: {
                padding: 2
              },
              onPress: props.onHomePress,
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 20,
                    height: 20,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            }),
            // Back button (conditional)
            ...(props.showBackButton && props.onBackPress ? [
              ui.Pressable({
                style: {
                  marginLeft: 0,
                  padding: 2
                },
                onPress: props.onBackPress,
                children: [
                  ui.Image({
                    source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1083116303985907"))),
                    style: {
                      width: 20,
                      height: 20,
                      tintColor: '#9CA3AF'
                    }
                  })
                ]
              })
            ] : [])
          ]
        }),
        // Right side container with text and optional right element
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: props.appName,
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            }),
            // Right element (if provided)
            ...(props.rightElement ? [
              ui.View({
                style: {
                  marginLeft: 8
                },
                children: [props.rightElement]
              })
            ] : [])
          ]
        })
      ]
    });
  }

  render(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Use UINode.if for conditional rendering - only render active screen
        ui.UINode.if(this.isDialerBinding, this.renderDialerScreen(onHomePress, assignedPlayer)),
        ui.UINode.if(this.isDialingBinding, this.renderDialingScreen())
      ]
    });
  }

  private renderDialerScreen(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        flexDirection: 'column'
      },
      children: [
        // Header - standardized
        this.createAppHeader({
          appName: 'Phone',
          onHomePress: () => {
            onHomePress();
            // Reset phone state
            this.phoneNumberBinding.set('', assignedPlayer ? [assignedPlayer] : undefined);
            this.isDialingBinding.set(false, assignedPlayer ? [assignedPlayer] : undefined);
          }
        }),
        
        // Number Display - larger and more prominent
        ui.View({
          style: {
            backgroundColor: '#000000',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginTop: 36,
            minHeight: 60
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.phoneNumberBinding], (phoneNumber) => 
                phoneNumber ? this.formatPhoneNumber(phoneNumber) : 'Enter phone #'
              ),
              numberOfLines: 1,
              style: {
                color: '#FFFFFF',
                fontSize: 18,
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
            this.createDialPadRow(['1', '2', '3'], assignedPlayer),
            // Row 2: 4, 5, 6
            this.createDialPadRow(['4', '5', '6'], assignedPlayer),
            // Row 3: 7, 8, 9
            this.createDialPadRow(['7', '8', '9'], assignedPlayer),
            // Row 4: *, 0, #
            this.createDialPadRow(['*', '0', '#'], assignedPlayer),
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
                    backgroundColor: '#E5E7EB',
                    borderRadius: 8,
                    flex: 1,
                    marginRight: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => {
                    this.phoneNumberBinding.set(prev => prev.length > 0 ? prev.slice(0, -1) : prev, assignedPlayer ? [assignedPlayer] : undefined);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("802575082453612"))),
                      style: {
                        width: 18,
                        height: 18,
                        tintColor: '#6B7280'
                      }
                    })
                  ]
                }),
                // Call button
                ui.Pressable({
                  style: {
                    backgroundColor: '#00c951',
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => {
                    this.handleCallPress(assignedPlayer);
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1127859349222459"))),
                      style: {
                        width: 18,
                        height: 18,
                        tintColor: '#FFFFFF'
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
        backgroundColor: '#00c951',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
      },
      children: [
        // Phone icon container
        ui.View({
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 20,
            width: 60,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24322726084045822"))),
              style: {
                width: 24,
                height: 24,
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
            fontSize: 18,
            fontWeight: '500',
            marginBottom: 4,
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
            fontSize: 14,
            opacity: 0.9,
            marginBottom: 24,
            textAlign: 'center'
          }
        }),
        
        // End call button
        ui.Pressable({
          style: {
            backgroundColor: '#fb2c36',
            borderRadius: 20,
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: () => {
            this.isDialingBinding.set(false);
            this.phoneNumberBinding.set('');
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24322726084045822"))),
              style: {
                width: 20,
                height: 20,
                tintColor: '#FFFFFF',
                transform: [{ rotate: '135deg' }]
              }
            })
          ]
        })
      ]
    });
  }

  private createDialPadRow(digits: string[], assignedPlayer?: hz.Player): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginVertical: 3
      },
      children: digits.map(digit => 
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 3,
            minHeight: 46,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: () => {
            this.phoneNumberBinding.set(prev => 
              prev.length < 10 ? prev + digit : prev, 
              assignedPlayer ? [assignedPlayer] : undefined
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

  private handleCallPress(assignedPlayer?: hz.Player): void {
    this.isDialingBinding.set(true, assignedPlayer ? [assignedPlayer] : undefined);
  }

  // Getter methods to access bindings from parent
  getPhoneNumberBinding(): ui.Binding<string> {
    return this.phoneNumberBinding;
  }

  getIsDialingBinding(): ui.Binding<boolean> {
    return this.isDialingBinding;
  }
}
