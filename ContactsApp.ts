import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';
import { Social, AvatarImageType } from 'horizon/social';

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
  playerId?: number; // Store player ID instead of player object
}

export class ContactsApp {
  // Contacts app state bindings
  private selectedContactIdBinding = new ui.Binding<number | null>(null);
  private realContactsBinding = new ui.Binding<Contact[]>([]);
  private favoritesBinding = new ui.Binding<Set<number>>(new Set());

  // Derived binding to get the selected contact from the ID
  private selectedContactBinding = ui.Binding.derive(
    [this.selectedContactIdBinding, this.realContactsBinding],
    (contactId, contacts) => {
      if (contactId === null) return null;
      return contacts.find(c => c.id === contactId) || null;
    }
  );

  // Derived bindings for contact details display
  private selectedContactAvatarTextBinding = ui.Binding.derive(
    [this.selectedContactIdBinding, this.realContactsBinding],
    (contactId, contacts) => {
      if (contactId === null) return '';
      const contact = contacts.find(c => c.id === contactId);
      return contact ? contact.name.charAt(0).toUpperCase() : '';
    }
  );

  private selectedContactNameBinding = ui.Binding.derive(
    [this.selectedContactIdBinding, this.realContactsBinding],
    (contactId, contacts) => {
      if (contactId === null) return '';
      const contact = contacts.find(c => c.id === contactId);
      return contact ? contact.name : '';
    }
  );

  // Player cache for avatar loading
  private playersCache = new Map<number, hz.Player>();
  private lastContactsUpdate: number = 0;

  constructor(private world: hz.World) {}

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

  // Real contacts data from players in the world
  private async updateRealContacts(assignedPlayer?: hz.Player): Promise<void> {
    // Throttle contacts updates to prevent spam (max once every 5 seconds for testing)
    const now = Date.now();
    if (now - this.lastContactsUpdate < 5000) {
      console.log(`[Contacts] Throttled - last update was ${(now - this.lastContactsUpdate) / 1000} seconds ago`);
      return;
    }
    this.lastContactsUpdate = now;

    console.log(`[Contacts] Starting updateRealContacts for player: ${assignedPlayer?.name.get() || 'unassigned'}`);

    const players = this.world.getPlayers();
    const localPlayer = this.world.getLocalPlayer();
    
    // Debug logging to match PlayersLogger
    console.log(`[Contacts] Total players found: ${players.length}`);
    if (players.length > 0) {
      const playerInfo = players.map(player => `${player.name.get()}(ID:${player.id})`).join(', ');
      console.log(`[Contacts] All players: [${playerInfo}]`);
    }
    console.log(`[Contacts] Local player: ${localPlayer ? `${localPlayer.name.get()}(ID:${localPlayer.id})` : 'null'}`);
    console.log(`[Contacts] Assigned player: ${assignedPlayer ? `${assignedPlayer.name.get()}(ID:${assignedPlayer.id})` : 'null'}`);
    
    // For contacts, we want to show all OTHER players (not the one using this phone)
    // If there's an assigned player, exclude them. Otherwise exclude local player.
    const playerToExclude = assignedPlayer || localPlayer;
    const playerIdToExclude = playerToExclude?.id;
    
    // Filter using player IDs instead of player object references
    const otherPlayers = players.filter(player => player.id !== playerIdToExclude);
    
    console.log(`[Contacts] Player ID to exclude: ${playerIdToExclude || 'null'}`);
    console.log(`[Contacts] Other players (excluding phone owner by ID): ${otherPlayers.length}`);
    if (otherPlayers.length > 0) {
      const otherPlayerInfo = otherPlayers.map(player => `${player.name.get()}(ID:${player.id})`).join(', ');
      console.log(`[Contacts] Other player info: [${otherPlayerInfo}]`);
    }
    if (otherPlayers.length > 0) {
      const otherPlayerNames = otherPlayers.map(player => player.name.get()).join(', ');
      console.log(`[Contacts] Other player names: [${otherPlayerNames}]`);
    }
    const contacts: Contact[] = [];
    
    // Clear the existing players cache
    this.playersCache.clear();
    
    for (let i = 0; i < otherPlayers.length; i++) {
      const player = otherPlayers[i];
      const playerName = player.name.get();
      
      console.log(`[Contacts] Adding contact: ${playerName}`);
      
      // Cache the player for later lookup
      this.playersCache.set(player.id, player);
      
      contacts.push({
        id: i + 1,
        name: playerName,
        phone: `(555) ${String(i + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        avatar: '👤', // Placeholder, will be replaced with real avatar
        company: 'Horizon Worlds',
        lastContact: 'Online now',
        playerId: player.id
      });
    }
    
    console.log(`[Contacts] Final contacts count: ${contacts.length}`);
    console.log(`[Contacts] Contacts list:`, contacts.map(c => c.name));
    
    // Set the binding with player-specific targeting if we have an assigned player
    console.log(`[Contacts] Setting binding with ${contacts.length} contacts`);
    console.log(`[Contacts] Contacts being set:`, contacts.map(c => ({ name: c.name, id: c.id })));
    
    // For now, always set globally to debug binding issues
    this.realContactsBinding.set(contacts);
    console.log(`[Contacts] Binding set complete.`);
  }

  render(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    console.log(`[Contacts UI] renderContactsApp() called - forcing contacts update`);
    
    // Force a contacts update when the app is opened (bypassing throttle)
    this.lastContactsUpdate = 0;
    this.updateRealContacts(assignedPlayer);
    
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Contact Detail View
        ui.UINode.if(
          ui.Binding.derive([this.selectedContactIdBinding], (contactId) => contactId !== null),
          this.renderContactDetail(onHomePress, assignedPlayer)
        ),
        // Contacts List View
        ui.UINode.if(
          ui.Binding.derive([this.selectedContactIdBinding], (contactId) => contactId === null),
          this.renderContactsList(onHomePress, assignedPlayer)
        )
      ]
    });
  }

  private renderContactDetail(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    // Create a binding for the detail avatar image
    const detailAvatarImageBinding = new ui.Binding<ui.ImageSource | null>(null);
    
    // Set up reactive loading of avatar when contact changes
    // Use a derived binding to automatically update the avatar
    ui.Binding.derive(
      [this.selectedContactIdBinding, this.realContactsBinding],
      (contactId, contacts) => {
        if (contactId !== null) {
          const contact = contacts.find((c: Contact) => c.id === contactId);
          if (contact?.playerId) {
            const player = this.playersCache.get(contact.playerId);
            if (player) {
              Social.getAvatarImageSource(player, { 
                type: AvatarImageType.HEADSHOT, 
                highRes: true 
              }).then(imageSource => {
                detailAvatarImageBinding.set(imageSource);
              }).catch(() => {
                detailAvatarImageBinding.set(null);
              });
            } else {
              detailAvatarImageBinding.set(null);
            }
          } else {
            detailAvatarImageBinding.set(null);
          }
        } else {
          detailAvatarImageBinding.set(null);
        }
        return contactId; // Return something to satisfy the derive function
      }
    );
    
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header - standardized
        this.createAppHeader({
          appName: 'Contact',
          onHomePress: () => {
            onHomePress();
            this.selectedContactIdBinding.set(null, assignedPlayer ? [assignedPlayer] : undefined);
          },
          onBackPress: () => {
            this.selectedContactIdBinding.set(null);
            // Refresh contacts when going back to contacts list
            this.updateRealContacts(assignedPlayer);
          },
          showBackButton: true
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
                marginBottom: 12,
                overflow: 'hidden'
              },
              children: [
                // Show real avatar image if available, otherwise show placeholder
                ui.UINode.if(
                  ui.Binding.derive([detailAvatarImageBinding], (image) => image !== null),
                  ui.Image({
                    source: ui.Binding.derive([detailAvatarImageBinding], (image) => image || new ui.ImageSource()),
                    style: {
                      width: 60,
                      height: 60,
                      borderRadius: 15
                    }
                  })
                ),
                ui.UINode.if(
                  ui.Binding.derive([detailAvatarImageBinding], (image) => image === null),
                  ui.Text({
                    text: this.selectedContactAvatarTextBinding,
                    style: {
                      fontSize: 32,
                      color: '#FFFFFF'
                    }
                  })
                )
              ]
            }),
            
            // Name
            ui.Text({
              text: this.selectedContactNameBinding,
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
                    backgroundColor: '#00c951',
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
                    console.log('Call button pressed');
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
                
                // Message button
                ui.Pressable({
                  style: {
                    backgroundColor: '#fb2c36',
                    borderRadius: 15,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 6
                  },
                  onPress: () => {
                    console.log('Message button pressed');
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1480228839964364"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#FFFFFF'
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
            
            // Uber Button - replacing contact details
            ui.View({
              style: {
                width: '100%',
                alignItems: 'center'
              },
              children: [
                ui.View({
                  style: {
                    width: '100%',
                    maxWidth: 300
                  },
                  children: [
                    ui.Pressable({
                      style: {
                        width: '100%',
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#000000',
                        borderRadius: 12,
                        padding: 12
                      },
                      onPress: () => {
                        // In a real app, this would open the Uber app or teleport to the contact
                        console.log('Opening Uber to contact');
                      },
                      children: [
                        ui.Image({
                          source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("662001530262929"))),
                          style: {
                            width: 20,
                            height: 20,
                            tintColor: '#FFFFFF',
                            marginRight: 8
                          }
                        }),
                        ui.View({
                          style: {
                            flex: 1,
                            alignItems: 'flex-start'
                          },
                          children: [
                            ui.Text({
                              text: 'Uber to Contact',
                              style: {
                                fontSize: 14,
                                fontWeight: 'bold',
                                color: '#FFFFFF'
                              }
                            })
                          ]
                        })
                      ]
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

  private renderContactsList(onHomePress: () => void, assignedPlayer?: hz.Player): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Contacts',
          onHomePress: () => {
            onHomePress();
            this.selectedContactIdBinding.set(null);
          },
          showBackButton: false
        }),
        
        // Debug refresh button
        ui.Pressable({
          style: {
            backgroundColor: '#3B82F6',
            marginHorizontal: 16,
            marginTop: 8,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6
          },
          onPress: () => {
            console.log(`[Contacts UI] Manual refresh requested`);
            this.lastContactsUpdate = 0; // Reset throttle
            this.updateRealContacts(assignedPlayer);
          },
          children: [
            ui.Text({
              text: 'Refresh Contacts',
              style: {
                color: '#FFFFFF',
                fontSize: 12,
                textAlign: 'center',
                fontWeight: '500'
              }
            })
          ]
        }),
        
        // Contacts List or No Contacts Message
        ui.View({
          style: {
            flex: 1,
            marginTop: 36,
            backgroundColor: '#FFFFFF'
          },
          children: [
            // Show "No Contacts" message when no contacts
            ui.UINode.if(
              ui.Binding.derive([this.realContactsBinding], (contacts) => {
                console.log(`[Contacts UI - No Contacts Check] Received binding data:`, contacts);
                console.log(`[Contacts UI - No Contacts Check] Is array:`, Array.isArray(contacts));
                console.log(`[Contacts UI - No Contacts Check] Length:`, contacts ? contacts.length : 'null/undefined');
                
                const safeContacts = Array.isArray(contacts) ? contacts : [];
                console.log(`[Contacts UI - No Contacts Check] Safe contacts:`, safeContacts.map(c => c.name || 'unnamed'));
                
                // Filter out test contacts for the "no contacts" check
                const realContacts = safeContacts.filter(c => c.id === 999); // Show "No Contacts" only if we have test contacts
                const hasNoRealContacts = safeContacts.length === 0 || safeContacts.length === realContacts.length;
                console.log(`[Contacts UI - No Contacts Check] Real contacts count: ${safeContacts.length - realContacts.length}, showing no contacts message: ${hasNoRealContacts}`);
                return hasNoRealContacts;
              }),
              ui.View({
                style: {
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 32
                },
                children: [
                  ui.Text({
                    text: 'No Contacts',
                    style: {
                      fontSize: 18,
                      fontWeight: '500',
                      color: '#6B7280',
                      textAlign: 'center',
                      marginBottom: 8
                    }
                  }),
                  ui.Text({
                    text: 'No other players are currently in this world.',
                    style: {
                      fontSize: 14,
                      color: '#9CA3AF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ),

            // Show contacts list when contacts exist
            ui.UINode.if(
              ui.Binding.derive([this.realContactsBinding], (contacts) => {
                const safeContacts = Array.isArray(contacts) ? contacts : [];
                // Filter out test contacts for the display check
                const testContacts = safeContacts.filter(c => c.id === 999);
                console.log(`[Contacts UI] Contacts list check - real contacts: ${safeContacts.length - testContacts.length}, total: ${safeContacts.length}`);
                const shouldShow = safeContacts.length > 0 && safeContacts.length > testContacts.length;
                console.log(`[Contacts UI] Should show contacts list: ${shouldShow}`);
                return shouldShow;
              }),
              ui.ScrollView({
                style: {
                  flex: 1
                },
                children: [
                  ui.View({
                    style: {
                      paddingBottom: 20,
                      width: '100%'
                    },
                    children: [
                      // Dynamic contacts list with proper UI
                      ui.DynamicList<Contact>({
                        data: this.realContactsBinding,
                        renderItem: (contact: Contact) => this.createContactListItem(contact)
                      })
                    ]
                  })
                ]
              })
            )
          ]
        })
      ]
    });
  }

  private createContactListItem(contact: Contact): ui.UINode {
    console.log(`[Contacts UI] Creating contact list item for: ${contact.name}`);
    
    // Create a binding for the avatar image
    const avatarImageBinding = new ui.Binding<ui.ImageSource | null>(null);
    
    // Load the avatar asynchronously if we have a player reference
    if (contact.playerId) {
      const player = this.playersCache.get(contact.playerId);
      if (player) {
        Social.getAvatarImageSource(player, {
          type: AvatarImageType.HEADSHOT,
          highRes: false
        }).then(imageSource => {
          avatarImageBinding.set(imageSource);
        }).catch(error => {
          console.log(`[Contacts UI] Failed to load avatar for ${contact.name}:`, error);
          avatarImageBinding.set(null);
        });
      }
    }
    
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
        // Refresh contacts to ensure we have the latest data
        this.updateRealContacts();
        this.selectedContactIdBinding.set(contact.id);
      },
      children: [
        // Left content (avatar) - with real avatar loading
        ui.View({
          style: {
            width: 32,
            height: 32,
            backgroundColor: '#3B82F6',
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
            overflow: 'hidden'
          },
          children: [
            // Show real avatar if loaded, otherwise show placeholder
            ui.UINode.if(
              ui.Binding.derive([avatarImageBinding], (avatar) => avatar !== null),
              ui.Image({
                source: avatarImageBinding,
                style: {
                  width: 32,
                  height: 32,
                  borderRadius: 16
                }
              }),
              ui.Text({
                text: contact.name.charAt(0).toUpperCase(),
                style: {
                  fontSize: 14,
                  color: '#FFFFFF',
                  fontWeight: '600'
                }
              })
            )
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
            // Contact name
            ui.Text({
              text: contact.name,
              style: {
                fontSize: 12,
                fontWeight: '400',
                color: '#111827',
                marginBottom: contact.company || contact.phone ? 1 : 0
              }
            }),
            // Company/phone (conditional using UINode.if)
            ui.UINode.if(
              !!(contact.company || contact.phone),
              ui.Text({
                text: contact.company || contact.phone || '',
                style: {
                  fontSize: 10,
                  color: '#6B7280',
                  fontWeight: '400'
                }
              })
            )
          ]
        })
      ]
    });
  }

  // Public methods to access bindings
  getRealContactsBinding(): ui.Binding<Contact[]> {
    return this.realContactsBinding;
  }

  getSelectedContactIdBinding(): ui.Binding<number | null> {
    return this.selectedContactIdBinding;
  }

  updateContacts(assignedPlayer?: hz.Player): void {
    this.lastContactsUpdate = 0; // Reset throttle
    this.updateRealContacts(assignedPlayer);
  }
}
