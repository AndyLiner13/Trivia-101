import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';

// Message interfaces
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'contact';
  timestamp: string;
}

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
}

interface MessageTemplate {
  category: string;
  messages: string[];
}

export class MeChatApp {
  // MeChat app state bindings
  private selectedConversationBinding = new ui.Binding<Conversation | null>(null);
  private currentMessagesViewBinding = new ui.Binding<'list' | 'chat'>('list');
  private messagesBinding = new ui.Binding<Message[]>([]);
  private selectedMessageTemplateBinding = new ui.Binding<string | null>(null);
  
  // Internal tracking for current messages
  private currentMessages: Message[] = [];
  private currentConversation: Conversation | null = null;

  // Sample conversations data
  private conversations: Conversation[] = [
    {
      id: 1,
      name: 'Mom',
      lastMessage: 'Don\'t forget dinner tonight!',
      timestamp: '2:30 PM',
      unread: 2,
      avatar: '👩'
    },
    {
      id: 2,
      name: 'Alex',
      lastMessage: 'See you at the meeting',
      timestamp: '1:15 PM',
      unread: 0,
      avatar: '👨'
    },
    {
      id: 3,
      name: 'Sarah',
      lastMessage: 'Thanks for helping!',
      timestamp: '12:45 PM',
      unread: 1,
      avatar: '👩'
    },
    {
      id: 4,
      name: 'David',
      lastMessage: 'Project update attached',
      timestamp: '11:20 AM',
      unread: 0,
      avatar: '👨'
    },
    {
      id: 5,
      name: 'Emma',
      lastMessage: 'Coffee later?',
      timestamp: '10:05 AM',
      unread: 3,
      avatar: '👩'
    },
    {
      id: 6,
      name: 'Work Group',
      lastMessage: 'Meeting moved to 3 PM',
      timestamp: 'Yesterday',
      unread: 0,
      avatar: '👥'
    }
  ];

  // Message threads for each conversation
  private messageThreads: Record<number, Message[]> = {
    1: [ // Mom
      { id: 1, text: 'Hi honey! How was your day?', sender: 'contact', timestamp: '2:25 PM' },
      { id: 2, text: 'It was good! Just finished work', sender: 'user', timestamp: '2:26 PM' },
      { id: 3, text: 'That\'s great! Don\'t forget we have dinner tonight at 7', sender: 'contact', timestamp: '2:28 PM' },
      { id: 4, text: 'Don\'t forget dinner tonight!', sender: 'contact', timestamp: '2:30 PM' }
    ],
    2: [ // Alex
      { id: 1, text: 'Hey, are you ready for tomorrow\'s presentation?', sender: 'contact', timestamp: '1:10 PM' },
      { id: 2, text: 'Yes, just finished the slides', sender: 'user', timestamp: '1:12 PM' },
      { id: 3, text: 'Awesome! See you at the meeting', sender: 'contact', timestamp: '1:15 PM' }
    ],
    3: [ // Sarah
      { id: 1, text: 'Could you help me with the design review?', sender: 'contact', timestamp: '12:40 PM' },
      { id: 2, text: 'Of course! I\'ll take a look now', sender: 'user', timestamp: '12:42 PM' },
      { id: 3, text: 'Thanks for helping!', sender: 'contact', timestamp: '12:45 PM' }
    ]
  };

  // Pre-written message templates
  private messageTemplates: MessageTemplate[] = [
    {
      category: 'Quick Responses',
      messages: ['Yes', 'No', 'Thanks!', 'You too!', 'Sounds good', 'On my way', 'Running late', 'Almost there']
    },
    {
      category: 'Greetings',
      messages: ['Hello!', 'Good morning', 'Good evening', 'How are you?', 'Hope you are well', 'Long time no see!']
    },
    {
      category: 'Plans & Meet Up',
      messages: ['What time works for you?', 'Let us meet up soon', 'See you later', 'Are you free today?', 'Rain check?', 'Can we reschedule?']
    },
    {
      category: 'Work & Business',
      messages: ['Got it, thanks', 'Will get back to you', 'In a meeting, call later', 'Checking now', 'Please send details', 'Meeting confirmed']
    }
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
        // Conversations List View
        ui.UINode.if(
          ui.Binding.derive([this.currentMessagesViewBinding], (view) => view === 'list'),
          this.renderConversationsList(onHomePress)
        ),
        // Chat View
        ui.UINode.if(
          ui.Binding.derive([this.currentMessagesViewBinding], (view) => view === 'chat'),
          this.renderChatView(onHomePress)
        )
      ]
    });
  }

  private renderConversationsList(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'MeChat',
          onHomePress: () => {
            onHomePress();
            // Reset messages state
            this.selectedConversationBinding.set(null);
            this.currentMessagesViewBinding.set('list');
            this.messagesBinding.set([]);
            this.selectedMessageTemplateBinding.set(null);
          },
          showBackButton: false
        }),
        
        // Conversations List
        ui.View({
          style: {
            flex: 1,
            backgroundColor: '#FFFFFF',
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
                    backgroundColor: '#FFFFFF'
                  },
                  children: [...this.conversations.map(conversation => this.createConversationItem(conversation))]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderChatView(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        flexDirection: 'column'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'MeChat',
          onHomePress: () => {
            onHomePress();
            this.selectedConversationBinding.set(null);
            this.currentMessagesViewBinding.set('list');
            this.messagesBinding.set([]);
          },
          onBackPress: () => {
            this.currentMessagesViewBinding.set('list');
            this.selectedConversationBinding.set(null);
            this.messagesBinding.set([]);
          },
          showBackButton: true
        }),
        
        // Messages
        ui.View({
          style: {
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 12,
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
                    flexDirection: 'column',
                    padding: 8
                  },
                  children: [
                    // Show sample messages for now
                    this.createMessageBubble({ id: 1, text: 'Hi there!', sender: 'contact', timestamp: '2:25 PM' }, 0),
                    this.createMessageBubble({ id: 2, text: 'Hello! How are you?', sender: 'user', timestamp: '2:26 PM' }, 1),
                    this.createMessageBubble({ id: 3, text: 'I\'m good, thanks for asking!', sender: 'contact', timestamp: '2:27 PM' }, 2)
                  ]
                })
              ]
            })
          ]
        }),
        
        // Message Templates Section
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            borderTopWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            maxHeight: 160
          },
          children: [
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              },
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1480228839964364"))),
                  style: {
                    width: 14,
                    height: 14,
                    tintColor: '#6B7280',
                    marginRight: 6
                  }
                }),
                ui.Text({
                  text: 'Choose a message to send:',
                  style: {
                    fontSize: 12,
                    color: '#6B7280'
                  }
                })
              ]
            }),
            ui.ScrollView({
              style: {
                flex: 1,
                maxHeight: 120
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'column'
                  },
                  children: this.messageTemplates.map((category, categoryIndex) => 
                    ui.View({
                      style: {
                        marginBottom: 8
                      },
                      children: [
                        ui.Text({
                          text: category.category,
                          style: {
                            fontSize: 10,
                            color: '#6B7280',
                            fontWeight: '500',
                            marginBottom: 4
                          }
                        }),
                        ui.View({
                          style: {
                            flexDirection: 'column'
                          },
                          children: category.messages.map((message, messageIndex) =>
                            ui.Pressable({
                              style: {
                                backgroundColor: '#FFFFFF',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 6,
                                marginBottom: 4
                              },
                              onPress: () => {
                                this.sendMessage(message);
                              },
                              children: [
                                ui.Text({
                                  text: message,
                                  style: {
                                    fontSize: 12,
                                    color: '#374151'
                                  }
                                })
                              ]
                            })
                          )
                        })
                      ]
                    })
                  )
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private createConversationItem(conversation: Conversation): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center'
      },
      onPress: () => {
        this.openChat(conversation);
      },
      children: [
        // Avatar
        ui.View({
          style: {
            width: 40,
            height: 40,
            backgroundColor: '#3B82F6',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            flexShrink: 0
          },
          children: [
            ui.Text({
              text: conversation.avatar,
              style: {
                fontSize: 18
              }
            })
          ]
        }),
        
        // Content
        ui.View({
          style: {
            flex: 1,
            flexDirection: 'column',
            marginRight: 8
          },
          children: [
            ui.Text({
              text: conversation.name,
              style: {
                fontSize: 12,
                fontWeight: '500',
                color: '#111827',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: conversation.lastMessage,
              style: {
                fontSize: 12,
                color: '#6B7280'
              }
            })
          ]
        }),
        
        // Right side info
        ui.View({
          style: {
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center'
          },
          children: [
            ...(conversation.unread > 0 ? [
              ui.View({
                style: {
                  backgroundColor: '#3B82F6',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 6
                },
                children: [
                  ui.Text({
                    text: conversation.unread.toString(),
                    style: {
                      fontSize: 10,
                      color: '#FFFFFF',
                      fontWeight: '500'
                    }
                  })
                ]
              })
            ] : [])
          ]
        })
      ]
    });
  }

  private createMessageBubble(message: Message, index: number): ui.UINode {
    const isUser = message.sender === 'user';
    
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 8,
        paddingHorizontal: 4
      },
      children: [
        ui.View({
          style: {
            backgroundColor: isUser ? '#3B82F6' : '#F3F4F6',
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            maxWidth: 140
          },
          children: [
            ui.Text({
              text: message.text,
              style: {
                fontSize: 12,
                color: isUser ? '#FFFFFF' : '#111827'
              }
            })
          ]
        })
      ]
    });
  }

  private openChat(conversation: Conversation): void {
    this.currentConversation = conversation;
    this.selectedConversationBinding.set(conversation);
    this.currentMessagesViewBinding.set('chat');
    
    // Load messages for this conversation
    const conversationMessages = this.messageThreads[conversation.id] || [];
    this.currentMessages = conversationMessages;
    this.messagesBinding.set(conversationMessages);
  }

  private sendMessage(messageText: string): void {
    if (messageText.trim() && this.currentConversation) {
      const conversationMessages = this.messageThreads[this.currentConversation.id] || [];
      const message: Message = {
        id: Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const updatedMessages = [...conversationMessages, message];
      this.messageThreads[this.currentConversation.id] = updatedMessages;
      this.currentMessages = updatedMessages;
      this.messagesBinding.set(updatedMessages);
      this.selectedMessageTemplateBinding.set(null);
    }
  }
}
