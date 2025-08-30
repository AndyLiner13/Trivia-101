import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
}

class MeMailApp extends ui.UIComponent<typeof MeMailApp> {
  static propsDefinition = {};

  private selectedEmailBinding = new ui.Binding<Email | null>(null);
  private isComposingBinding = new ui.Binding<boolean>(false);
  private composeToBinding = new ui.Binding<string>('');
  private composeSubjectBinding = new ui.Binding<string>('');
  private composeBodyBinding = new ui.Binding<string>('');

  private emails: Email[] = [
    {
      id: '1',
      from: 'Sarah Wilson',
      subject: 'Project Update - Q4 Review',
      preview: 'Hi team, I wanted to share the latest updates on our Q4 review process...',
      timestamp: '10:30 AM',
      isRead: false
    },
    {
      id: '2',
      from: 'Alex Chen',
      subject: 'Design System Documentation',
      preview: 'Hey! I have finished updating the design system docs. The new components...',
      timestamp: '9:15 AM',
      isRead: false
    },
    {
      id: '3',
      from: 'Netflix',
      subject: 'New shows added to your list',
      preview: 'Check out the latest additions to Netflix. We think you will love these...',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: '4',
      from: 'Mom',
      subject: 'Dinner this Sunday?',
      preview: 'Hi honey! Are you free for dinner this Sunday? Dad and I were thinking...',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: '5',
      from: 'GitHub',
      subject: '[Security] New sign-in from MacBook Pro',
      preview: 'We noticed a new sign-in to your account from a MacBook Pro...',
      timestamp: '2 days ago',
      isRead: false
    },
    {
      id: '6',
      from: 'John Davis',
      subject: 'Meeting Rescheduled',
      preview: 'Hope you are doing well! I need to reschedule our meeting...',
      timestamp: '3 days ago',
      isRead: true
    }
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
                this.renderMailApp()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderMailApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%'
      },
      children: [
        // Inbox View
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.selectedEmailBinding, this.isComposingBinding], (email, composing) => 
              !email && !composing ? 'flex' : 'none'
            )
          },
          children: [this.renderInbox()]
        }),
        // Email Detail View
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.selectedEmailBinding], (email) => 
              email ? 'flex' : 'none'
            )
          },
          children: [this.renderEmailDetail()]
        }),
        // Compose View
        ui.View({
          style: {
            width: '100%',
            height: '100%',
            display: ui.Binding.derive([this.isComposingBinding], (composing) => 
              composing ? 'flex' : 'none'
            )
          },
          children: [this.renderCompose()]
        })
      ]
    });
  }

  private renderInbox(): ui.UINode {
    const unreadCount = this.emails.filter(e => !e.isRead).length;
    
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
              text: 'MeMail',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),
        
        // Section Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            paddingHorizontal: 12,
            paddingVertical: 3,
            marginTop: 36,
            borderBottomWidth: 1
          },
          children: [
            ui.Text({
              text: `${unreadCount} Unread MeMails`,
              style: {
                fontSize: 10,
                color: '#6B7280',
                fontWeight: '500'
              }
            })
          ]
        }),
        
        // Email List
        ui.View({
          style: {
            flex: 1,
            backgroundColor: '#FFFFFF'
          },
          children: [
            ui.ScrollView({
              style: {
                flex: 1
              },
              children: [
                ui.View({
                  style: {
                    backgroundColor: '#FFFFFF'
                  },
                  children: this.emails.map(email => this.createEmailItem(email))
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderEmailDetail(): ui.UINode {
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
                    this.selectedEmailBinding.set(null);
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
              text: 'Email',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),
        
        // Email Content
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginTop: 36
          },
          children: [
            // From
            ui.Text({
              text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                email ? `From: ${email.from}` : ''
              ),
              style: {
                fontSize: 9,
                color: '#6B7280',
                marginBottom: 6
              }
            }),
            // Subject
            ui.Text({
              text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                email ? email.subject : ''
              ),
              style: {
                fontSize: 12,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 12
              }
            }),
            // Body
            ui.Text({
              text: ui.Binding.derive([this.selectedEmailBinding], (email) => 
                email ? `${email.preview}\n\nThis is the full email content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.` : ''
              ),
              style: {
                fontSize: 10,
                color: '#374151',
                lineHeight: 14
              }
            })
          ]
        })
      ]
    });
  }

  private renderCompose(): ui.UINode {
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
                    this.isComposingBinding.set(false);
                    this.composeToBinding.set('');
                    this.composeSubjectBinding.set('');
                    this.composeBodyBinding.set('');
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
              text: 'Compose',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            }),
            ui.Pressable({
              style: {
                backgroundColor: '#10B981',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4
              },
              onPress: () => {
                console.log('Email sent!');
                this.isComposingBinding.set(false);
                this.composeToBinding.set('');
                this.composeSubjectBinding.set('');
                this.composeBodyBinding.set('');
              },
              children: [
                ui.Text({
                  text: 'Send',
                  style: {
                    fontSize: 12,
                    color: '#FFFFFF',
                    fontWeight: '500'
                  }
                })
              ]
            })
          ]
        }),
        
        // Compose Form
        ui.View({
          style: {
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginTop: 36
          },
          children: [
            // To field
            ui.View({
              style: {
                marginBottom: 12
              },
              children: [
                ui.Text({
                  text: 'To:',
                  style: {
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 4
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8
                  },
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.composeToBinding], (to) => 
                        to || 'recipient@example.com'
                      ),
                      style: {
                        fontSize: 14,
                        color: ui.Binding.derive([this.composeToBinding], (to) => 
                          to ? '#111827' : '#9CA3AF'
                        )
                      }
                    })
                  ]
                })
              ]
            }),
            // Subject field
            ui.View({
              style: {
                marginBottom: 12
              },
              children: [
                ui.Text({
                  text: 'Subject:',
                  style: {
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 4
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8
                  },
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.composeSubjectBinding], (subject) => 
                        subject || 'Enter subject...'
                      ),
                      style: {
                        fontSize: 14,
                        color: ui.Binding.derive([this.composeSubjectBinding], (subject) => 
                          subject ? '#111827' : '#9CA3AF'
                        )
                      }
                    })
                  ]
                })
              ]
            }),
            // Body field
            ui.View({
              style: {
                flex: 1
              },
              children: [
                ui.Text({
                  text: 'Message:',
                  style: {
                    fontSize: 12,
                    color: '#6B7280',
                    marginBottom: 4
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flex: 1,
                    minHeight: 100
                  },
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.composeBodyBinding], (body) => 
                        body || 'Type your message here...'
                      ),
                      style: {
                        fontSize: 14,
                        color: ui.Binding.derive([this.composeBodyBinding], (body) => 
                          body ? '#111827' : '#9CA3AF'
                        )
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

  private createEmailItem(email: Email): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 48
      },
      onPress: () => {
        this.selectedEmailBinding.set(email);
      },
      children: [
        // Avatar
        ui.View({
          style: {
            width: 24,
            height: 24,
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            flexShrink: 0
          },
          children: [
            ui.Text({
              text: email.from.charAt(0),
              style: {
                fontSize: 10,
                color: '#FFFFFF',
                fontWeight: '500'
              }
            })
          ]
        }),
        
        // Content - Fixed width area
        ui.View({
          style: {
            flex: 1,
            justifyContent: 'center',
            paddingRight: 8
          },
          children: [
            // Sender row with consistent spacing
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 2,
                height: 14
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexShrink: 0
                  },
                  children: [
                    ui.Text({
                      text: email.from,
                      style: {
                        fontSize: 11,
                        fontWeight: email.isRead ? '400' : '600',
                        color: '#111827'
                      }
                    }),
                    // Fixed space for unread dot
                    ui.View({
                      style: {
                        width: 10,
                        height: 14,
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        paddingLeft: 4
                      },
                      children: [
                        ui.View({
                          style: {
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: email.isRead ? 'transparent' : '#3B82F6'
                          }
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            // Subject row
            ui.View({
              style: {
                height: 12,
                justifyContent: 'center'
              },
              children: [
                ui.Text({
                  text: email.subject,
                  style: {
                    fontSize: 9,
                    color: '#6B7280',
                    fontWeight: '400'
                  }
                })
              ]
            })
          ]
        }),
        
        // Star button - Fixed width
        ui.View({
          style: {
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0
          },
          children: [
            ui.Pressable({
              style: {
                width: 24,
                height: 24,
                justifyContent: 'center',
                alignItems: 'center'
              },
              onPress: (e) => {
                console.log(`Toggle star for email ${email.id}`);
              },
              children: [
                ui.Text({
                  text: '⭐',
                  style: {
                    fontSize: 12,
                    color: '#D1D5DB'
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

ui.UIComponent.register(MeMailApp);
