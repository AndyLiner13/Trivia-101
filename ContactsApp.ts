import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

// Contact interface from MePhone/utils/contactsUtils.ts
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

class ContactsApp extends ui.UIComponent<typeof ContactsApp> {
  static propsDefinition = {};
  
  private selectedContactBinding = new ui.Binding<Contact | null>(null);
  private favoritesBinding = new ui.Binding<Set<number>>(new Set());

  // Sample contacts data (from MePhone/utils/contactsUtils.ts)
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

  initializeUI(): ui.UINode {
    return this.renderPhoneFrame();
  }

  start() {
    super.start();
  }

  // Utility function from MePhone/utils/contactsUtils.ts
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
                this.renderContactsApp()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderContactsApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Contact Detail View
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.selectedContactBinding], (contact) => 
              contact ? 'flex' : 'none'
            )
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
                paddingVertical: 8
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
                  text: 'Contact',
                  style: {
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#111827'
                  }
                })
              ]
            }),
            
            // Contact Info - Centered
            ui.View({
              style: {
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10
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
                        console.log('Call button pressed');
                      },
                      children: [
                        ui.Text({
                          text: '📞',
                          style: {
                            fontSize: 16
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
                        console.log('Favorite button pressed');
                      },
                      children: [
                        ui.Text({
                          text: '⭐',
                          style: {
                            fontSize: 16,
                            color: '#6B7280'
                          }
                        })
                      ]
                    })
                  ]
                }),
                
                // Uber button (replacing contact details)
                ui.Pressable({
                  style: {
                    width: '100%',
                    backgroundColor: '#000000',
                    borderRadius: 8,
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => {
                    console.log('Uber button pressed');
                  },
                  children: [
                    ui.Text({
                      text: '🚗',
                      style: {
                        fontSize: 16,
                        marginRight: 8
                      }
                    }),
                    ui.Text({
                      text: 'Request Uber',
                      style: {
                        fontSize: 14,
                        color: '#FFFFFF',
                        fontWeight: '500'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        }),
        // Contacts List View
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.selectedContactBinding], (contact) => 
              !contact ? 'flex' : 'none'
            )
          },
          children: [this.renderContactsList()]
        })
      ]
    });
  }

  private renderContactDetail(contact: Contact): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        padding: 20
      },
      children: [
        // Header with back button
        ui.View({
          style: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          },
          children: [
            ui.Text({
              text: 'Contact',
              style: {
                fontSize: 18,
                fontWeight: '500',
                color: '#111827'
              }
            }),
            ui.Pressable({
              style: {
                padding: 8,
                borderRadius: 8,
                backgroundColor: '#3B82F6'
              },
              onPress: () => {
                this.selectedContactBinding.set(null);
              },
              children: [
                ui.Text({
                  text: 'Back',
                  style: {
                    fontSize: 16,
                    color: '#FFFFFF'
                  }
                })
              ]
            })
          ]
        }),
        
        // Contact Info
        ui.View({
          style: {
            alignItems: 'center',
            marginBottom: 30
          },
          children: [
            // Avatar
            ui.View({
              style: {
                width: 80,
                height: 80,
                backgroundColor: '#3B82F6',
                borderRadius: 15,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 15
              },
              children: [
                ui.Text({
                  text: contact.avatar,
                  style: {
                    fontSize: 36
                  }
                })
              ]
            }),
            
            // Name
            ui.Text({
              text: contact.name,
              style: {
                fontSize: 20,
                fontWeight: '500',
                color: '#111827',
                marginBottom: 5
              }
            }),
            
            // Phone
            ui.Text({
              text: contact.phone,
              style: {
                fontSize: 16,
                color: '#6B7280',
                marginBottom: 15
              }
            })
          ]
        }),
        
        // Simple contact details
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            padding: 16
          },
          children: this.buildContactDetailsList(contact)
        })
      ]
    });
  }

  private buildContactDetailsList(contact: Contact): ui.UINode[] {
    const details: ui.UINode[] = [];
    
    // Always add phone
    details.push(ui.Text({
      text: `Phone: ${contact.phone}`,
      style: {
        fontSize: 16,
        color: '#111827',
        marginBottom: 8
      }
    }));
    
    // Add email if present
    if (contact.email) {
      details.push(ui.Text({
        text: `Email: ${contact.email}`,
        style: {
          fontSize: 16,
          color: '#111827',
          marginBottom: 8
        }
      }));
    }
    
    // Add company if present
    if (contact.company) {
      details.push(ui.Text({
        text: `Company: ${contact.company}`,
        style: {
          fontSize: 16,
          color: '#111827',
          marginBottom: 8
        }
      }));
    }
    
    // Add last contact if present
    if (contact.lastContact) {
      details.push(ui.Text({
        text: `Last contact: ${contact.lastContact}`,
        style: {
          fontSize: 14,
          color: '#6B7280'
        }
      }));
    }
    
    return details;
  }

  private buildListItemContent(contact: Contact): ui.UINode[] {
    const content: ui.UINode[] = [];
    
    // Always add name
    content.push(ui.Text({
      text: contact.name,
      style: {
        fontSize: 12,
        fontWeight: '400',
        color: '#111827',
        marginBottom: contact.company || contact.phone ? 1 : 0
      }
    }));
    
    // Add company or phone if available
    if (contact.company || contact.phone) {
      content.push(ui.Text({
        text: contact.company || contact.phone,
        style: {
          fontSize: 10,
          color: '#6B7280',
          fontWeight: '400'
        }
      }));
    }
    
    return content;
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
            ui.Text({
              text: '🏠',
              style: {
                fontSize: 16,
                color: '#9CA3AF'
              }
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
            marginTop: 32,
            backgroundColor: '#FFFFFF'
          },
          children: [
            // Use a simple scrollable view approach
            ui.View({
              style: {
                flex: 1,
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
                      this.createListItem(contact)
                    )
                  ]
                })
              )
            })
          ]
        })
      ]
    });
  }

  // Section Header component (from MePhone/components/shared/SectionHeader.ts)
  private createSectionHeader(title: string): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB', // gray-50
        paddingHorizontal: 16,
        paddingVertical: 8,
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

  // List Item component (from MePhone/components/shared/ListItem.ts)
  private createListItem(contact: Contact): ui.UINode {
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
          children: this.buildListItemContent(contact)
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
            ui.Text({
              text: '⭐',
              style: {
                fontSize: 14,
                color: ui.Binding.derive([this.favoritesBinding], (favorites) => 
                  favorites.has(contact.id) ? '#F59E0B' : '#9CA3AF'
                )
              }
            })
          ]
        })
      ]
    });
  }
}

hz.Component.register(ContactsApp);
