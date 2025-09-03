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

interface Ringtone {
  id: string;
  name: string;
  category: string;
}

export class SettingsApp {
  // Settings app state bindings
  private currentSettingsViewBinding = new ui.Binding<'main' | 'ringtones'>('main');
  private notificationsEnabledBinding = new ui.Binding<boolean>(true);
  private selectedRingtoneBinding = new ui.Binding<string>('classic-ring');
  private selectedEmailBinding = new ui.Binding<string>('');
  
  // Settings app state - internal tracking
  private notificationsEnabled = true;

  private ringtones: Ringtone[] = [
    { id: 'classic-ring', name: 'Classic Ring', category: 'Default' },
    { id: 'digital-bell', name: 'Digital Bell', category: 'Default' },
    { id: 'modern-chime', name: 'Modern Chime', category: 'Default' },
    { id: 'my-recording', name: 'My Recording', category: 'Custom' },
    { id: 'uploaded-song', name: 'Uploaded Song', category: 'Custom' },
    { id: 'custom-tone', name: 'Custom Tone', category: 'Custom' }
  ];

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
        ),
        // Ringtones View
        ui.UINode.if(
          ui.Binding.derive([this.currentSettingsViewBinding], (view) => view === 'ringtones'),
          this.renderRingtones(onHomePress)
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

        // Device Section
        ui.View({
          style: {
            marginTop: 36
          },
          children: [
            this.createSettingsSectionHeader('Device'),
            ui.View({
              style: {
                backgroundColor: '#FFFFFF'
              },
              children: [
                this.createSettingItem({
                  id: 'ringtones',
                  label: 'Ringtones',
                  icon: BigInt("1288271619346253"),
                  hasArrow: true
                })
              ]
            })
          ]
        }),

        // Preferences Section
        ui.View({
          style: {
            marginTop: 16
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

  private renderRingtones(onHomePress: () => void): ui.UINode {
    const categories = Array.from(new Set(this.ringtones.map(r => r.category)));

    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F9FAFB'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Ringtones',
          onHomePress: () => {
            onHomePress();
            this.currentSettingsViewBinding.set('main');
          },
          onBackPress: () => {
            this.currentSettingsViewBinding.set('main');
          },
          showBackButton: true
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            marginTop: 36
          },
          children: [
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  style: {
                    paddingBottom: 20
                  },
                  children: [
                    // Current Ringtone Section
                    this.createSettingsSectionHeader('CURRENT RINGTONE'),
                    ui.View({
                      style: {
                        backgroundColor: '#FFFFFF',
                        marginBottom: 16
                      },
                      children: [
                        this.createRingtoneItem(this.ringtones[0], true)
                      ]
                    }),

                    // Ringtone Categories
                    ...categories.map(category => 
                      ui.View({
                        style: {
                          marginBottom: 16
                        },
                        children: [
                          this.createSettingsSectionHeader(category.toUpperCase()),
                          ui.View({
                            style: {
                              backgroundColor: '#FFFFFF'
                            },
                            children: [
                              ...this.ringtones
                                .filter(r => r.category === category)
                                .map(ringtone => this.createRingtoneItem(ringtone, false))
                            ]
                          })
                        ]
                      })
                    )
                  ]
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
        paddingVertical: 8,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40
      },
      onPress: () => {
        if (item.id === 'ringtones') {
          this.currentSettingsViewBinding.set('ringtones');
        } else if (item.id === 'notifications' && item.hasToggle) {
          // Toggle the notifications state
          this.notificationsEnabledBinding.set(!this.notificationsEnabled);
          this.notificationsEnabled = !this.notificationsEnabled;
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
                ui.Text({
                  text: ui.Binding.derive([this.notificationsEnabledBinding], (enabled) => 
                    enabled ? '🟢' : '⚪'
                  ),
                  style: {
                    fontSize: 16
                  }
                })
              ]
            }) : item.hasArrow ? ui.Text({
              text: '›',
              style: {
                fontSize: 16,
                color: '#9CA3AF',
                paddingHorizontal: 6
              }
            }) : null
          ].filter(Boolean) as ui.UINode[]
        })
      ]
    });
  }

  private createRingtoneItem(ringtone: Ringtone, isCurrent: boolean): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40
      },
      onPress: () => {
        this.selectedRingtoneBinding.set(ringtone.id);
      },
      children: [
        // Icon
        ui.View({
          style: {
            width: 22,
            height: 22,
            backgroundColor: isCurrent ? '#00c951' : '#3B82F6',
            borderRadius: 11,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1060423696117146"))),
              style: {
                width: 9,
                height: 9,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center'
          },
          children: [
            ui.Text({
              text: ringtone.name,
              style: {
                fontSize: 10,
                fontWeight: '400',
                color: '#111827'
              }
            })
          ]
        }),

        // Right content
        isCurrent ? ui.Image({
          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1131016642456733"))),
          style: {
            width: 10,
            height: 10,
            tintColor: '#3B82F6'
          }
        }) : ui.View({
          style: {
            width: 10,
            height: 10
          },
          children: [
            // Check icon (when selected)
            ui.View({
              style: {
                position: 'absolute',
                width: 10,
                height: 10,
                opacity: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
                  selected === ringtone.id ? 1 : 0
                )
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24270584229301990"))),
                  style: {
                    width: 10,
                    height: 10,
                    tintColor: '#00c951'
                  }
                })
              ]
            }),
            // Play icon (when not selected)
            ui.View({
              style: {
                position: 'absolute',
                width: 10,
                height: 10,
                opacity: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
                  selected === ringtone.id ? 0 : 1
                )
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1131016642456733"))),
                  style: {
                    width: 10,
                    height: 10,
                    tintColor: '#9CA3AF'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }
}
