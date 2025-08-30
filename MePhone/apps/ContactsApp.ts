import * as ui from 'horizon/ui';

export interface ContactsAppProps {
  onBack: () => void;
  onHome: () => void;
  onNavigateToApp?: (app: string, data?: any) => void;
}

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

/**
 * ContactsApp - Contact management interface
 * Refactored from root ContactsApp.ts
 */
export class ContactsApp {
  private static selectedContactBinding = new ui.Binding<Contact | null>(null);
  private static favoritesBinding = new ui.Binding<Set<number>>(new Set());

  // Sample contacts data
  private static contacts: Contact[] = [
    {
      id: 1,
      name: "Alice Johnson",
      phone: "(555) 123-4567",
      email: "alice.johnson@email.com",
      avatar: "👩‍💼",
      company: "Tech Solutions Inc.",
      address: "123 Main St, San Francisco, CA 94102",
      lastContact: "2 days ago"
    },
    {
      id: 2,
      name: "Bob Smith",
      phone: "(555) 234-5678",
      email: "bob.smith@email.com",
      avatar: "👨‍💻",
      company: "Digital Innovations",
      address: "456 Oak Ave, San Francisco, CA 94103",
      lastContact: "1 week ago"
    },
    {
      id: 3,
      name: "Carol Davis",
      phone: "(555) 345-6789",
      email: "carol.davis@email.com",
      avatar: "👩‍🎨",
      company: "Creative Studios",
      address: "789 Pine St, San Francisco, CA 94104",
      lastContact: "3 days ago"
    },
    {
      id: 4,
      name: "David Wilson",
      phone: "(555) 456-7890",
      email: "david.wilson@email.com",
      avatar: "👨‍🔬",
      company: "Research Labs",
      address: "321 Elm St, San Francisco, CA 94105",
      lastContact: "5 days ago"
    }
  ];

  static render(props: ContactsAppProps): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.renderHeader(props),
        // Contact List
        ui.View({
          style: {
            flex: 1,
            width: '100%'
          },
          children: [
            // Contact detail view
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                display: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                  contact ? 'flex' : 'none'
                )
              },
              children: [this.renderContactDetail(props)]
            }),
            // Contact list view
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
        })
      ]
    });
  }

  private static renderHeader(props: ContactsAppProps): ui.UINode {
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
          onPress: () => {
            // Check if viewing contact detail, if so go back to list
            this.selectedContactBinding.set(null);
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
              text: '👥',
              style: {
                fontSize: 18,
                marginRight: 8
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.selectedContactBinding], (contact) => 
                contact ? contact.name : 'Contacts'
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

  private static renderContactsList(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        padding: 8
      },
      children: [
        // Search bar placeholder
        ui.View({
          style: {
            backgroundColor: '#F3F4F6',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          },
          children: [
            ui.Text({
              text: '🔍 Search contacts...',
              style: {
                color: '#9CA3AF',
                fontSize: 16
              }
            })
          ]
        }),
        
        // Favorites section
        this.renderSectionHeader('⭐ Favorites'),
        ...this.contacts.slice(0, 2).map(contact => this.renderContactItem(contact, true)),
        
        // All contacts section  
        this.renderSectionHeader('📇 All Contacts'),
        ...this.contacts.map(contact => this.renderContactItem(contact, false))
      ]
    });
  }

  private static renderSectionHeader(title: string): ui.UINode {
    return ui.View({
      style: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginTop: 8
      },
      children: [
        ui.Text({
          text: title,
          style: {
            fontSize: 14,
            fontWeight: '600',
            color: '#6B7280'
          }
        })
      ]
    });
  }

  private static renderContactItem(contact: Contact, isFavorite: boolean): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginVertical: 2,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6'
      },
      onPress: () => this.selectedContactBinding.set(contact),
      children: [
        // Avatar
        ui.View({
          style: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#E5E7EB',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          },
          children: [
            ui.Text({
              text: contact.avatar,
              style: {
                fontSize: 24
              }
            })
          ]
        }),
        
        // Contact info
        ui.View({
          style: {
            flex: 1
          },
          children: [
            ui.Text({
              text: contact.name,
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: contact.phone,
              style: {
                fontSize: 14,
                color: '#6B7280'
              }
            })
          ]
        }),
        
        // Arrow
        ui.Text({
          text: '›',
          style: {
            fontSize: 18,
            color: '#9CA3AF'
          }
        })
      ]
    });
  }

  private static renderContactDetail(props: ContactsAppProps): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        padding: 16
      },
      children: [
        ui.Binding.derive([this.selectedContactBinding], (contact) => {
          if (!contact) return ui.View({});
          
          return ui.View({
            style: {
              flex: 1
            },
            children: [
              // Contact header
              ui.View({
                style: {
                  alignItems: 'center',
                  paddingVertical: 20,
                  borderBottomWidth: 1,
                  borderColor: '#E5E7EB',
                  marginBottom: 20
                },
                children: [
                  // Large avatar
                  ui.View({
                    style: {
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: '#E5E7EB',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 16
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
                      fontWeight: 'bold',
                      color: '#1F2937',
                      marginBottom: 4
                    }
                  }),
                  
                  // Company
                  ui.Text({
                    text: contact.company || '',
                    style: {
                      fontSize: 16,
                      color: '#6B7280'
                    }
                  })
                ]
              }),
              
              // Contact actions
              ui.View({
                style: {
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                  marginBottom: 30
                },
                children: [
                  this.renderActionButton('📞', 'Call', '#10B981', () => {
                    if (props.onNavigateToApp) {
                      props.onNavigateToApp('phone', {
                        contactId: contact.id,
                        contactName: contact.name,
                        contactPhone: contact.phone,
                        contactAvatar: contact.avatar,
                        returnTo: 'contacts'
                      });
                    }
                  }),
                  this.renderActionButton('💬', 'Message', '#3B82F6', () => {}),
                  this.renderActionButton('📧', 'Email', '#EF4444', () => {})
                ]
              }),
              
              // Contact details
              this.renderDetailItem('📞', 'Phone', contact.phone),
              this.renderDetailItem('📧', 'Email', contact.email || 'No email'),
              this.renderDetailItem('🏢', 'Company', contact.company || 'No company'),
              this.renderDetailItem('📍', 'Address', contact.address || 'No address'),
              this.renderDetailItem('🕒', 'Last Contact', contact.lastContact || 'Never')
            ]
          });
        })
      ]
    });
  }

  private static renderActionButton(icon: string, label: string, color: string, onPress: () => void): ui.UINode {
    return ui.Pressable({
      style: {
        alignItems: 'center',
        padding: 8
      },
      onPress: onPress,
      children: [
        ui.View({
          style: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: color,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8
          },
          children: [
            ui.Text({
              text: icon,
              style: {
                fontSize: 24
              }
            })
          ]
        }),
        ui.Text({
          text: label,
          style: {
            fontSize: 12,
            color: '#6B7280',
            textAlign: 'center'
          }
        })
      ]
    });
  }

  private static renderDetailItem(icon: string, label: string, value: string): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6'
      },
      children: [
        ui.Text({
          text: icon,
          style: {
            fontSize: 20,
            marginRight: 12,
            width: 30
          }
        }),
        ui.View({
          style: {
            flex: 1
          },
          children: [
            ui.Text({
              text: label,
              style: {
                fontSize: 12,
                color: '#6B7280',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: value,
              style: {
                fontSize: 16,
                color: '#1F2937'
              }
            })
          ]
        })
      ]
    });
  }
}
