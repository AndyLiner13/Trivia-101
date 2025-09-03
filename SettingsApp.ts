import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';

// Settings interfaces
interface SettingItem {
  id: string;
  label: string;
  icon: BigInt;
  hasToggle?: boolean;
  toggleValue?: boolean;
  hasArrow?: boolean;
  hasCheck?: boolean;
  isSelected?: boolean;
}

export class SettingsApp {
  // Settings app state bindings
  private currentSettingsViewBinding = new ui.Binding<'main'>('main');
  private notificationsEnabledBinding = new ui.Binding<boolean>(true);
  private selectedEmailBinding = new ui.Binding<string>('');
  
  // Settings app state - internal tracking
  private notificationsEnabled = true;

  constructor() {}

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

  render(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Main Settings View
        ui.UINode.if(
          ui.Binding.derive([this.currentSettingsViewBinding], (view) => view === 'main'),
          this.renderMainSettings(onHomePress)
        )
      ]
    });
  }

  private renderMainSettings(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F9FAFB'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Settings',
          onHomePress: () => {
            onHomePress();
            // Reset settings state
            this.currentSettingsViewBinding.set('main');
          },
          showBackButton: false
        }),

        // Preferences Section
        ui.View({
          style: {
            marginTop: 36
          },
          children: [
            this.createSettingsSectionHeader('Preferences'),
            ui.View({
              style: {
                backgroundColor: '#FFFFFF'
              },
              children: [
                this.createSettingItem({
                  id: 'notifications',
                  label: 'Notifications',
                  icon: BigInt("1060423696117146"),
                  hasToggle: true
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private createSettingsSectionHeader(title: string): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 2
      },
      children: [
        ui.Text({
          text: title,
          style: {
            fontSize: 9,
            color: '#6B7280',
            fontWeight: '500'
          }
        })
      ]
    });
  }

  private createSettingItem(item: SettingItem): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44
      },
      onPress: () => {
        // Only handle toggle for notifications if it's not already handled by the toggle button
        if (item.id === 'notifications' && item.hasToggle) {
          // Toggle logic is handled by the toggle button itself
        }
      },
      children: [
        // Icon container (matching ListItem pattern)
        ui.View({
          style: {
            width: 28,
            height: 28,
            backgroundColor: '#3B82F6',
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            flexShrink: 0
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(item.icon.toString()))),
              style: {
                width: 14,
                height: 14,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Content area
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            paddingRight: 6
          },
          children: [
            ui.Text({
              text: item.label,
              style: {
                fontSize: 12,
                fontWeight: '400',
                color: '#111827'
              }
            })
          ]
        }),

        // Right content area
        ui.View({
          style: {
            flexShrink: 0,
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            item.hasToggle ? ui.Pressable({
              style: {
                padding: 6
              },
              onPress: () => {
                this.notificationsEnabledBinding.set(!this.notificationsEnabled);
                this.notificationsEnabled = !this.notificationsEnabled;
              },
              children: [
                ui.View({
                  style: {
                    position: 'relative',
                    width: 20,
                    height: 20
                  },
                  children: [
                    // Toggle-right (enabled state)
                    ui.View({
                      style: {
                        position: 'absolute',
                        opacity: ui.Binding.derive([this.notificationsEnabledBinding], (enabled) => enabled ? 1 : 0)
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1481787463159775"))),
                          style: {
                            width: 20,
                            height: 20
                          }
                        })
                      ]
                    }),
                    // Toggle-left (disabled state)
                    ui.View({
                      style: {
                        position: 'absolute',
                        opacity: ui.Binding.derive([this.notificationsEnabledBinding], (enabled) => enabled ? 0 : 1)
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("654797137149888"))),
                          style: {
                            width: 20,
                            height: 20
                          }
                        })
                      ]
                    })
                  ]
                })
              ]
            }) : item.hasArrow ? ui.Text({
              text: '›',
              style: {
                fontSize: 24,
                color: '#9CA3AF',
                paddingHorizontal: 6
              }
            }) : null
          ].filter(Boolean) as ui.UINode[]
        })
      ]
    });
  }

}
