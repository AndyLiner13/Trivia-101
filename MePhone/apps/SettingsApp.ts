import * as ui from 'horizon/ui';

export interface SettingsAppProps {
  onBack: () => void;
  onHome: () => void;
}

interface SettingItem {
  id: string;
  label: string;
  icon: string;
  hasToggle?: boolean;
  hasArrow?: boolean;
  value?: string;
}

/**
 * SettingsApp - Phone settings interface
 * Refactored from root SettingsApp.ts
 */
export class SettingsApp {
  private static notificationsEnabledBinding = new ui.Binding<boolean>(true);
  private static selectedRingtoneBinding = new ui.Binding<string>('classic-ring');
  private static currentViewBinding = new ui.Binding<'main' | 'ringtones'>('main');

  private static settingsItems: SettingItem[] = [
    { id: 'notifications', label: 'Notifications', icon: '🔔', hasToggle: true },
    { id: 'ringtone', label: 'Ringtone', icon: '🔊', hasArrow: true, value: 'Classic Ring' },
    { id: 'display', label: 'Display & Brightness', icon: '☀️', hasArrow: true },
    { id: 'sounds', label: 'Sounds & Haptics', icon: '🔊', hasArrow: true },
    { id: 'privacy', label: 'Privacy & Security', icon: '🔒', hasArrow: true },
    { id: 'storage', label: 'Storage', icon: '💾', hasArrow: true },
    { id: 'about', label: 'About', icon: 'ℹ️', hasArrow: true }
  ];

  private static ringtones = [
    { id: 'classic-ring', name: 'Classic Ring', category: 'Default' },
    { id: 'modern-chime', name: 'Modern Chime', category: 'Default' },
    { id: 'gentle-bell', name: 'Gentle Bell', category: 'Default' },
    { id: 'electronic-beat', name: 'Electronic Beat', category: 'Modern' },
    { id: 'nature-sound', name: 'Nature Sound', category: 'Ambient' }
  ];

  static render(props: SettingsAppProps): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F9FAFB'
      },
      children: [
        // Header
        this.renderHeader(props),
        // Settings content
        ui.View({
          style: {
            flex: 1
          },
          children: [
            // Main settings view
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
            // Ringtones view
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                display: ui.Binding.derive([this.currentViewBinding], (view) => 
                  view === 'ringtones' ? 'flex' : 'none'
                )
              },
              children: [this.renderRingtoneSettings()]
            })
          ]
        })
      ]
    });
  }

  private static renderHeader(props: SettingsAppProps): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Back button
        ui.Pressable({
          style: {
            padding: 8,
            borderRadius: 8
          },
          onPress: () => {
            // Check if in sub-view
            const currentView = this.currentViewBinding;
            // For simplicity, always go back to main settings first, then to previous screen
            this.currentViewBinding.set('main');
          },
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
              text: '⚙️',
              style: {
                fontSize: 18,
                marginRight: 8
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.currentViewBinding], (view) => 
                view === 'ringtones' ? 'Ringtones' : 'Settings'
              ),
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

  private static renderMainSettings(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        padding: 16
      },
      children: [
        // Profile section
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            alignItems: 'center'
          },
          children: [
            ui.View({
              style: {
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#3B82F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12
              },
              children: [
                ui.Text({
                  text: '👤',
                  style: {
                    fontSize: 36
                  }
                })
              ]
            }),
            ui.Text({
              text: 'John Doe',
              style: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#1F2937',
                marginBottom: 4
              }
            }),
            ui.Text({
              text: 'john.doe@email.com',
              style: {
                fontSize: 14,
                color: '#6B7280'
              }
            })
          ]
        }),
        
        // Settings list
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            overflow: 'hidden'
          },
          children: this.settingsItems.map((item, index) => 
            this.renderSettingItem(item, index === this.settingsItems.length - 1)
          )
        })
      ]
    });
  }

  private static renderSettingItem(item: SettingItem, isLast: boolean): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderColor: '#F3F4F6'
      },
      onPress: () => {
        if (item.id === 'ringtone') {
          this.currentViewBinding.set('ringtones');
        }
        // Handle other setting items here
      },
      children: [
        // Icon
        ui.Text({
          text: item.icon,
          style: {
            fontSize: 24,
            marginRight: 12,
            width: 30
          }
        }),
        
        // Label and value
        ui.View({
          style: {
            flex: 1
          },
          children: [
            ui.Text({
              text: item.label,
              style: {
                fontSize: 16,
                color: '#1F2937',
                marginBottom: item.value ? 2 : 0
              }
            }),
            ...(item.value ? [
              ui.Text({
                text: item.value,
                style: {
                  fontSize: 14,
                  color: '#6B7280'
                }
              })
            ] : [])
          ]
        }),
        
        // Controls
        ...(item.hasToggle ? [
          ui.Pressable({
            style: {
              width: 50,
              height: 30,
              borderRadius: 15,
              backgroundColor: ui.Binding.derive([this.notificationsEnabledBinding], (enabled) => 
                enabled ? '#10B981' : '#D1D5DB'
              ),
              justifyContent: 'center',
              alignItems: 'center'
            },
            onPress: () => {
              // Toggle the binding - need to get current value first
              this.notificationsEnabledBinding.set(!this.notificationsEnabledBinding);
            },
            children: [
              ui.Text({
                text: ui.Binding.derive([this.notificationsEnabledBinding], (enabled) => 
                  enabled ? '●' : '○'
                ),
                style: {
                  fontSize: 16,
                  color: '#FFFFFF'
                }
              })
            ]
          })
        ] : item.hasArrow ? [
          ui.Text({
            text: '›',
            style: {
              fontSize: 18,
              color: '#9CA3AF'
            }
          })
        ] : [])
      ]
    });
  }

  private static renderRingtoneSettings(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        padding: 16
      },
      children: [
        // Current selection
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20
          },
          children: [
            ui.Text({
              text: 'Current Ringtone',
              style: {
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 8
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
                this.ringtones.find(r => r.id === selected)?.name || 'Classic Ring'
              ),
              style: {
                fontSize: 18,
                fontWeight: '600',
                color: '#1F2937'
              }
            })
          ]
        }),
        
        // Ringtone list
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            overflow: 'hidden'
          },
          children: this.ringtones.map((ringtone, index) => 
            this.renderRingtoneItem(ringtone, index === this.ringtones.length - 1)
          )
        })
      ]
    });
  }

  private static renderRingtoneItem(ringtone: any, isLast: boolean): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderColor: '#F3F4F6'
      },
      onPress: () => {
        this.selectedRingtoneBinding.set(ringtone.id);
      },
      children: [
        // Ringtone info
        ui.View({
          style: {
            flex: 1
          },
          children: [
            ui.Text({
              text: ringtone.name,
              style: {
                fontSize: 16,
                color: '#1F2937',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: ringtone.category,
              style: {
                fontSize: 14,
                color: '#6B7280'
              }
            })
          ]
        }),
        
        // Selection indicator
        ui.View({
          style: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
              selected === ringtone.id ? '#10B981' : '#D1D5DB'
            ),
            backgroundColor: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
              selected === ringtone.id ? '#10B981' : 'transparent'
            ),
            justifyContent: 'center',
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.selectedRingtoneBinding], (selected) => 
                selected === ringtone.id ? '✓' : ''
              ),
              style: {
                fontSize: 12,
                color: '#FFFFFF',
                fontWeight: 'bold'
              }
            })
          ]
        })
      ]
    });
  }
}
