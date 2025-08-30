import * as ui from 'horizon/ui';

export interface MailAppProps {
  onBack: () => void;
  onHome: () => void;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  time: string;
  isRead: boolean;
  isImportant?: boolean;
}

/**
 * MailApp - Email client interface
 * Refactored from root MeMailApp.ts
 */
export class MailApp {
  private static currentViewBinding = new ui.Binding<'inbox' | 'email'>('inbox');
  private static selectedEmailBinding = new ui.Binding<Email | null>(null);

  private static emails: Email[] = [
    {
      id: '1',
      from: 'work@company.com',
      subject: 'Project Update Required',
      body: 'Hi there,\n\nWe need an update on the current project status. Please provide a detailed report by end of day.\n\nBest regards,\nProject Manager',
      time: '10:30 AM',
      isRead: false,
      isImportant: true
    },
    {
      id: '2',
      from: 'newsletter@techworld.com',
      subject: 'Weekly Tech News',
      body: 'This week in technology:\n\n• New AI breakthrough announced\n• Latest smartphone releases\n• Cloud computing trends\n\nRead more at techworld.com',
      time: '9:15 AM',
      isRead: true
    },
    {
      id: '3',
      from: 'support@bankingapp.com',
      subject: 'Your Account Statement',
      body: 'Dear Customer,\n\nYour monthly account statement is now available. You can view it in your online banking portal.\n\nThank you for banking with us.',
      time: 'Yesterday',
      isRead: true
    },
    {
      id: '4',
      from: 'friend@email.com',
      subject: 'Dinner Plans Tonight?',
      body: 'Hey!\n\nAre we still on for dinner tonight? I was thinking we could try that new restaurant downtown.\n\nLet me know!\nSarah',
      time: 'Yesterday',
      isRead: false
    },
    {
      id: '5',
      from: 'noreply@socialmedia.com',
      subject: 'You have 3 new notifications',
      body: 'Here\'s what\'s happening:\n\n• John liked your photo\n• Sarah commented on your post\n• You have a new message\n\nOpen the app to see more.',
      time: '2 days ago',
      isRead: true
    }
  ];

  static render(props: MailAppProps): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F9FAFB'
      },
      children: [
        // Header
        this.renderHeader(props),
        // Mail content
        ui.View({
          style: {
            flex: 1
          },
          children: [
            // Inbox view
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                display: ui.Binding.derive([this.currentViewBinding], (view) => 
                  view === 'inbox' ? 'flex' : 'none'
                )
              },
              children: [this.renderInbox()]
            }),
            // Email view
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                display: ui.Binding.derive([this.currentViewBinding], (view) => 
                  view === 'email' ? 'flex' : 'none'
                )
              },
              children: [this.renderEmailView()]
            })
          ]
        })
      ]
    });
  }

  private static renderHeader(props: MailAppProps): ui.UINode {
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
            // Simple back navigation - always go back to main
            this.currentViewBinding.set('inbox');
            props.onBack();
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
              text: '✉️',
              style: {
                fontSize: 18,
                marginRight: 8
              }
            }),
            ui.Text({
              text: ui.Binding.derive([this.currentViewBinding], (view) => 
                view === 'email' ? 'Email' : 'Mail'
              ),
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#000000'
              }
            })
          ]
        }),
        // Compose button
        ui.Pressable({
          style: {
            padding: 8,
            borderRadius: 8
          },
          onPress: () => {
            // Could implement compose functionality
          },
          children: [
            ui.Text({
              text: '✏️',
              style: {
                fontSize: 16
              }
            })
          ]
        })
      ]
    });
  }

  private static renderInbox(): ui.UINode {
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        // Inbox header
        ui.View({
          style: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderColor: '#E5E7EB'
          },
          children: [
            ui.Text({
              text: 'Inbox',
              style: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#1F2937'
              }
            }),
            ui.View({
              style: {
                backgroundColor: '#EF4444',
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                minWidth: 20,
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: this.emails.filter(e => !e.isRead).length.toString(),
                  style: {
                    fontSize: 12,
                    color: '#FFFFFF',
                    fontWeight: 'bold'
                  }
                })
              ]
            })
          ]
        }),
        
        // Email list
        ui.View({
          style: {
            flex: 1,
            backgroundColor: '#FFFFFF'
          },
          children: this.emails.map((email, index) => 
            this.renderEmailItem(email, index === this.emails.length - 1)
          )
        })
      ]
    });
  }

  private static renderEmailItem(email: Email, isLast: boolean): ui.UINode {
    return ui.Pressable({
      style: {
        padding: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderColor: '#F3F4F6',
        backgroundColor: email.isRead ? '#FFFFFF' : '#F0F9FF'
      },
      onPress: () => {
        this.selectedEmailBinding.set(email);
        this.currentViewBinding.set('email');
      },
      children: [
        ui.View({
          style: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8
          },
          children: [
            ui.View({
              style: {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ...(email.isImportant ? [
                  ui.Text({
                    text: '⭐',
                    style: {
                      fontSize: 14,
                      marginRight: 8
                    }
                  })
                ] : []),
                ui.Text({
                  text: email.from,
                  style: {
                    fontSize: 14,
                    fontWeight: email.isRead ? 'normal' : 'bold',
                    color: '#1F2937',
                    flex: 1
                  }
                })
              ]
            }),
            ui.Text({
              text: email.time,
              style: {
                fontSize: 12,
                color: '#6B7280'
              }
            })
          ]
        }),
        
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            ...(email.isRead ? [] : [
              ui.View({
                style: {
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#3B82F6',
                  marginRight: 8
                }
              })
            ]),
            ui.Text({
              text: email.subject,
              style: {
                fontSize: 16,
                fontWeight: email.isRead ? 'normal' : '600',
                color: '#1F2937',
                flex: 1
              }
            })
          ]
        }),
        
        ui.Text({
          text: email.body.substring(0, 80) + (email.body.length > 80 ? '...' : ''),
          style: {
            fontSize: 14,
            color: '#6B7280',
            marginTop: 4,
            lineHeight: 18
          }
        })
      ]
    });
  }

  private static renderEmailView(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        backgroundColor: '#FFFFFF'
      },
      children: [
        ui.View({
          style: {
            padding: 16,
            borderBottomWidth: 1,
            borderColor: '#E5E7EB'
          },
          children: [
            // Subject
            ui.Text({
              text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                email?.subject || ''
              ),
              style: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#1F2937',
                marginBottom: 12
              }
            }),
            
            // From and time
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center'
                  },
                  children: [
                    ui.View({
                      style: {
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#3B82F6',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12
                      },
                      children: [
                        ui.Text({
                          text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                            email?.from.charAt(0).toUpperCase() || 'U'
                          ),
                          style: {
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#FFFFFF'
                          }
                        })
                      ]
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                        email?.from || ''
                      ),
                      style: {
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1F2937'
                      }
                    })
                  ]
                }),
                ui.Text({
                  text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                    email?.time || ''
                  ),
                  style: {
                    fontSize: 12,
                    color: '#6B7280'
                  }
                })
              ]
            })
          ]
        }),
        
        // Email body
        ui.View({
          style: {
            flex: 1,
            padding: 16
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                email?.body || ''
              ),
              style: {
                fontSize: 14,
                color: '#1F2937',
                lineHeight: 20
              }
            })
          ]
        }),
        
        // Action buttons
        ui.View({
          style: {
            flexDirection: 'row',
            padding: 16,
            borderTopWidth: 1,
            borderColor: '#E5E7EB'
          },
          children: [
            ui.Pressable({
              style: {
                flex: 1,
                backgroundColor: '#3B82F6',
                borderRadius: 8,
                padding: 12,
                marginRight: 8,
                alignItems: 'center'
              },
              onPress: () => {
                // Reply functionality
              },
              children: [
                ui.Text({
                  text: 'Reply',
                  style: {
                    color: '#FFFFFF',
                    fontWeight: '600',
                    fontSize: 16
                  }
                })
              ]
            }),
            ui.Pressable({
              style: {
                flex: 1,
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center'
              },
              onPress: () => {
                // Delete functionality
                this.currentViewBinding.set('inbox');
              },
              children: [
                ui.Text({
                  text: 'Delete',
                  style: {
                    color: '#EF4444',
                    fontWeight: '600',
                    fontSize: 16
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
