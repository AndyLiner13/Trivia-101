import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

interface SettingItem {
  id: string;
  label: string;
  icon: string;
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

class SettingsApp extends ui.UIComponent<typeof SettingsApp> {
  static propsDefinition = {};

  private currentViewBinding = new ui.Binding<'main' | 'ringtones'>('main');
  private notificationsEnabledBinding = new ui.Binding<boolean>(true);
  private selectedRingtoneBinding = new ui.Binding<string>('classic-ring');
  private notificationsEnabled = true; // Track the current state

  private ringtones: Ringtone[] = [
    { id: 'classic-ring', name: 'Classic Ring', category: 'Default' },
    { id: 'digital-bell', name: 'Digital Bell', category: 'Default' },
    { id: 'modern-chime', name: 'Modern Chime', category: 'Default' },
    { id: 'my-recording', name: 'My Recording', category: 'Custom' },
    { id: 'uploaded-song', name: 'Uploaded Song', category: 'Custom' },
    { id: 'custom-tone', name: 'Custom Tone', category: 'Custom' }
  ];

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
                this.renderSettingsApp()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderSettingsApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Main Settings View
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentViewBinding], (view) => 
              view === 'main' ? 'flex' : 'none'
            )
          },
          children: [this.renderMainSettings()]
        }),
        // Ringtones View
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.currentViewBinding], (view) => 
              view === 'ringtones' ? 'flex' : 'none'
            )
          },
          children: [this.renderRingtones()]
        })
      ]
    });
  }

  private renderMainSettings(): ui.UINode {
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
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
              style: {
                width: 16,
                height: 16,
                tintColor: '#9CA3AF'
              }
            }),
            ui.Text({
              text: 'Settings',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),

        // Device Section
        ui.View({
          style: {
            marginTop: 36
          },
          children: [
            this.createSectionHeader('Device'),
            ui.View({
              style: {
                backgroundColor: '#FFFFFF'
              },
              children: [
                this.createSettingItem({
                  id: 'ringtones',
                  label: 'Ringtones',
                  icon: '🔊',
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
            this.createSectionHeader('Preferences'),
            ui.View({
              style: {
                backgroundColor: '#FFFFFF'
              },
              children: [
                this.createSettingItem({
                  id: 'notifications',
                  label: 'Notifications',
                  icon: '🔔',
                  hasToggle: true
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderRingtones(): ui.UINode {
    const categories = Array.from(new Set(this.ringtones.map(r => r.category)));

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
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 16,
                    height: 16,
                    tintColor: '#9CA3AF'
                  }
                }),
                ui.Pressable({
                  style: {
                    marginLeft: 8
                  },
                  onPress: () => {
                    this.currentViewBinding.set('main');
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
              text: 'Ringtones',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
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
                    this.createSectionHeader('CURRENT RINGTONE'),
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
                          this.createSectionHeader(category.toUpperCase()),
                          ui.View({
                            style: {
                              backgroundColor: '#FFFFFF'
                            },
                            children: this.ringtones
                              .filter(r => r.category === category)
                              .map(ringtone => this.createRingtoneItem(ringtone, false))
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

  private createSectionHeader(title: string): ui.UINode {
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
          this.currentViewBinding.set('ringtones');
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
            ui.Text({
              text: item.icon,
              style: {
                fontSize: 12,
                color: '#FFFFFF'
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
                    enabled ? '�' : '⚪'
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
    const isSelected = ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
      selected === ringtone.id
    );

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
            backgroundColor: isCurrent ? '#10B981' : '#3B82F6',
            borderRadius: 11,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1288271619346253"))),
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
        isCurrent ? ui.Text({
          text: '▶️',
          style: {
            fontSize: 10,
            color: '#3B82F6'
          }
        }) : ui.Text({
          text: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
            selected === ringtone.id ? '✅' : '▶️'
          ),
          style: {
            fontSize: 10,
            color: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
              selected === ringtone.id ? '#10B981' : '#9CA3AF'
            )
          }
        })
      ]
    });
  }
}

ui.UIComponent.register(SettingsApp);
