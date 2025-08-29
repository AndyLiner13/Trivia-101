import * as ui from 'horizon/ui';
import { ScreenType } from '../index';
import { Contact, sampleContacts, groupContactsByLetter } from '../utils/contactsUtils';
import { ListItem } from '../components/shared/ListItem';
import { SectionHeader } from '../components/shared/SectionHeader';

interface ContactsAppProps {
  onNavigateToScreen: (screen: ScreenType) => void;
  onNavigateToPhone?: (contactData: { name: string; phone: string; avatar: string }) => void;
}

export class ContactsApp {
  // Internal state
  private contacts = sampleContacts;
  private selectedContact: Contact | null = null;
  private favorites = new Set<number>(); // Simple favorites tracking

  constructor(private props: ContactsAppProps) {}

  render(): ui.UINode {
    if (this.selectedContact) {
      return this.renderContactDetail();
    }
    return this.renderContactsList();
  }

  private renderContactDetail(): ui.UINode {
    const contact = this.selectedContact!;
    
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
            paddingHorizontal: 16,
            paddingVertical: 12,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.Pressable({
              style: {
                padding: 4,
                borderRadius: 8
              },
              onPress: () => {
                this.props.onNavigateToScreen('home');
              },
              children: [
                ui.Text({
                  text: '🏠',
                  style: {
                    fontSize: 20
                  }
                })
              ]
            }),
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
                padding: 4,
                borderRadius: 8
              },
              onPress: () => {
                this.selectedContact = null;
                // Note: In a real implementation, we'd need to trigger a re-render
                // For now, we'll need to navigate back to contacts list differently
                this.props.onNavigateToScreen('contacts');
              },
              children: [
                ui.Text({
                  text: '← Back',
                  style: {
                    fontSize: 16,
                    color: '#3B82F6'
                  }
                })
              ]
            })
          ]
        }),
        
        // Contact Info - Centered
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 54,
            paddingHorizontal: 20
          },
          children: [
            // Avatar
            ui.View({
              style: {
                width: 100,
                height: 100,
                backgroundColor: '#3B82F6',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20
              },
              children: [
                ui.Text({
                  text: contact.avatar,
                  style: {
                    fontSize: 48
                  }
                })
              ]
            }),
            
            // Name
            ui.Text({
              text: contact.name,
              style: {
                fontSize: 24,
                fontWeight: '500',
                color: '#111827',
                textAlign: 'center',
                marginBottom: 24
              }
            }),
            
            // Action buttons row
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 30
              },
              children: [
                // Call button
                ui.Pressable({
                  style: {
                    backgroundColor: '#10B981',
                    borderRadius: 20,
                    width: 60,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 10
                  },
                  onPress: () => {
                    // Navigate to phone app with contact data
                    this.props.onNavigateToPhone?.({
                      name: contact.name,
                      phone: contact.phone,
                      avatar: contact.avatar
                    });
                  },
                  children: [
                    ui.Text({
                      text: '📞',
                      style: {
                        fontSize: 24
                      }
                    })
                  ]
                }),
                
                // Email button
                ui.Pressable({
                  style: {
                    backgroundColor: '#3B82F6',
                    borderRadius: 20,
                    width: 60,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 10
                  },
                  onPress: () => {
                    console.log(`Send email to ${contact.email}`);
                  },
                  children: [
                    ui.Text({
                      text: '📧',
                      style: {
                        fontSize: 24
                      }
                    })
                  ]
                }),
                
                // Favorite button
                ui.Pressable({
                  style: {
                    backgroundColor: this.favorites.has(contact.id) ? '#F59E0B' : '#E5E7EB',
                    borderRadius: 20,
                    width: 60,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 10
                  },
                  onPress: () => {
                    if (this.favorites.has(contact.id)) {
                      this.favorites.delete(contact.id);
                    } else {
                      this.favorites.add(contact.id);
                    }
                    // In a real implementation, we'd trigger a re-render here
                  },
                  children: [
                    ui.Text({
                      text: this.favorites.has(contact.id) ? '⭐' : '☆',
                      style: {
                        fontSize: 24,
                        color: this.favorites.has(contact.id) ? '#FFFFFF' : '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),
            
            // Contact details
            ui.View({
              style: {
                width: '100%',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 16
              },
              children: [
                ui.Text({
                  text: `Phone: ${contact.phone}`,
                  style: {
                    fontSize: 16,
                    color: '#111827',
                    marginBottom: 8
                  }
                }),
                ...(contact.email ? [
                  ui.Text({
                    text: `Email: ${contact.email}`,
                    style: {
                      fontSize: 16,
                      color: '#111827',
                      marginBottom: 8
                    }
                  })
                ] : []),
                ...(contact.company ? [
                  ui.Text({
                    text: `Company: ${contact.company}`,
                    style: {
                      fontSize: 16,
                      color: '#111827',
                      marginBottom: 8
                    }
                  })
                ] : []),
                ...(contact.lastContact ? [
                  ui.Text({
                    text: `Last contact: ${contact.lastContact}`,
                    style: {
                      fontSize: 14,
                      color: '#6B7280'
                    }
                  })
                ] : [])
              ]
            })
          ]
        })
      ]
    });
  }

  private renderContactsList(): ui.UINode {
    const groupedContacts = groupContactsByLetter(this.contacts);
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
            paddingHorizontal: 16,
            paddingVertical: 12,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          },
          children: [
            ui.Pressable({
              style: {
                padding: 4,
                borderRadius: 8
              },
              onPress: () => {
                this.props.onNavigateToScreen('home');
              },
              children: [
                ui.Text({
                  text: '🏠',
                  style: {
                    fontSize: 20
                  }
                })
              ]
            }),
            ui.Text({
              text: 'Contacts',
              style: {
                fontSize: 18,
                fontWeight: '500',
                color: '#111827'
              }
            }),
            ui.View({ style: { width: 28 } }) // Spacer
          ]
        }),
        
        // Contacts List
        ui.View({
          style: {
            flex: 1,
            marginTop: 54,
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
                    new SectionHeader({ title: letter }).render(),
                    
                    // Contacts in this section
                    ...groupedContacts[letter].map(contact =>
                      new ListItem({
                        leftContent: contact.avatar,
                        title: contact.name,
                        subtitle: contact.company || contact.phone,
                        rightContent: ui.Pressable({
                          style: {
                            padding: 8,
                            borderRadius: 8
                          },
                          onPress: () => {
                            if (this.favorites.has(contact.id)) {
                              this.favorites.delete(contact.id);
                            } else {
                              this.favorites.add(contact.id);
                            }
                          },
                          children: [
                            ui.Text({
                              text: this.favorites.has(contact.id) ? '⭐' : '☆',
                              style: {
                                fontSize: 20,
                                color: this.favorites.has(contact.id) ? '#F59E0B' : '#9CA3AF'
                              }
                            })
                          ]
                        }),
                        onClick: () => {
                          this.selectedContact = contact;
                          // Note: In a real reactive system, this would trigger a re-render
                          // For now, we'll work with the current navigation system
                        }
                      }).render()
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
}
