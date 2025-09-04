import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';

interface MePayContact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  company?: string;
}

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'bill' | 'deposit';
  description: string;
  amount: number;
  date: string;
  recipient?: string;
  category: string;
}

export class MePayApp {
  // MePay app state bindings
  private currentMePayPageBinding = new ui.Binding<'home' | 'send' | 'request' | 'sent' | 'requested'>('home');
  private mePayBalanceBinding = new ui.Binding(12847.92);
  private selectedMePayContactBinding = new ui.Binding<MePayContact | null>(null);
  private selectedRequestContactBinding = new ui.Binding<MePayContact | null>(null);
  private sendAmountBinding = new ui.Binding('');
  private requestAmountBinding = new ui.Binding('');
  private showSendNumpadBinding = new ui.Binding(false);
  private showRequestNumpadBinding = new ui.Binding(false);
  private selectedSendNoteBinding = new ui.Binding('');
  private selectedRequestNoteBinding = new ui.Binding('');
  private lastTransactionBinding = new ui.Binding<{
    type: 'sent' | 'requested';
    amount: string;
    contact: MePayContact | null;
    note: string;
  } | null>(null);

  // Internal MePay state tracking
  private currentMePayPage: 'home' | 'send' | 'request' | 'sent' | 'requested' = 'home';
  private mePayBalance = 12847.92;
  private selectedMePayContact: MePayContact | null = null;
  private selectedRequestContact: MePayContact | null = null;
  private sendAmount = '';
  private requestAmount = '';
  private showSendNumpad = false;
  private showRequestNumpad = false;
  private selectedSendNote = '';
  private selectedRequestNote = '';
  
  // Dropdown states
  private isContactDropdownOpen = false;
  private isRequestContactDropdownOpen = false;
  private isSendNoteDropdownOpen = false;
  private isRequestNoteDropdownOpen = false;

  private lastTransaction: {
    type: 'sent' | 'requested';
    amount: string;
    contact: MePayContact | null;
    note: string;
  } | null = null;

  // MePay data
  private mePayContacts: MePayContact[] = [
    {
      id: 1,
      name: 'Alice Johnson',
      phone: '(555) 123-4567',
      email: 'alice.johnson@email.com',
      avatar: '👩‍💼',
      company: 'Tech Corp'
    },
    {
      id: 2,
      name: 'Bob Smith',
      phone: '(555) 234-5678',
      email: 'bob.smith@email.com',
      avatar: '👨‍💻',
      company: 'Design Studio'
    },
    {
      id: 3,
      name: 'Carol Davis',
      phone: '(555) 345-6789',
      email: 'carol.davis@email.com',
      avatar: '👩‍🎨',
      company: 'Art Gallery'
    },
    {
      id: 4,
      name: 'David Wilson',
      phone: '(555) 456-7890',
      avatar: '👨‍🔬',
      company: 'Research Lab'
    },
    {
      id: 5,
      name: 'Emma Brown',
      phone: '(555) 567-8901',
      email: 'emma.brown@email.com',
      avatar: '👩‍🏫',
      company: 'University'
    },
    {
      id: 6,
      name: 'Frank Miller',
      phone: '(555) 678-9012',
      avatar: '👨‍🍳',
      company: 'Restaurant'
    }
  ];

  private mePayNoteReasons = [
    'Lunch',
    'Coffee',
    'Rent',
    'Utilities',
    'Gas money',
    'Groceries',
    'Movie tickets',
    'Dinner',
    'Birthday gift',
    'Thank you',
    'Freelance work',
    'Invoice payment',
    'Other'
  ];

  private recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'sent',
      description: 'Coffee with Sarah',
      amount: -12.50,
      date: 'Today',
      recipient: 'Sarah',
      category: 'Food & Drink'
    },
    {
      id: '2',
      type: 'received',
      description: 'Payment from Alex',
      amount: 45.00,
      date: 'Today',
      recipient: 'Alex',
      category: 'Personal'
    },
    {
      id: '3',
      type: 'sent',
      description: 'Lunch Split',
      amount: -28.75,
      date: 'Today',
      recipient: 'Mike',
      category: 'Food & Drink'
    },
    {
      id: '4',
      type: 'bill',
      description: 'Electric Company',
      amount: -89.47,
      date: 'Yesterday',
      category: 'Utilities'
    },
    {
      id: '5',
      type: 'received',
      description: 'Rent Split from Jake',
      amount: 425.00,
      date: 'Yesterday',
      recipient: 'Jake',
      category: 'Personal'
    },
    {
      id: '6',
      type: 'sent',
      description: 'Gas Station',
      amount: -45.20,
      date: 'Dec 2',
      category: 'Transportation'
    },
    {
      id: '7',
      type: 'deposit',
      description: 'Salary Deposit',
      amount: 2850.00,
      date: 'Dec 1',
      category: 'Income'
    },
    {
      id: '8',
      type: 'sent',
      description: 'Online Shopping',
      amount: -156.99,
      date: 'Nov 30',
      category: 'Shopping'
    },
    {
      id: '9',
      type: 'received',
      description: 'Freelance Payment',
      amount: 350.00,
      date: 'Nov 29',
      category: 'Income'
    },
    {
      id: '10',
      type: 'sent',
      description: 'Grocery Store',
      amount: -87.43,
      date: 'Nov 28',
      category: 'Shopping'
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
      style: { width: '100%', height: '100%' },
      children: [
        ui.UINode.if(
          ui.Binding.derive([this.currentMePayPageBinding], (currentPage) => currentPage === 'sent' && this.lastTransaction != null),
          this.renderPaymentSentScreen(onHomePress)
        ),
        ui.UINode.if(
          ui.Binding.derive([this.currentMePayPageBinding], (currentPage) => currentPage === 'requested' && this.lastTransaction != null),
          this.renderRequestSentScreen(onHomePress)
        ),
        ui.UINode.if(
          ui.Binding.derive([this.currentMePayPageBinding], (currentPage) => currentPage === 'home'),
          this.renderMePayHome(onHomePress)
        ),
        ui.UINode.if(
          ui.Binding.derive([this.currentMePayPageBinding], (currentPage) => currentPage === 'send'),
          this.renderMePaySend(onHomePress)
        ),
        ui.UINode.if(
          ui.Binding.derive([this.currentMePayPageBinding], (currentPage) => currentPage === 'request'),
          this.renderMePayRequest(onHomePress)
        )
      ]
    });
  }

  private renderMePayHome(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'MePay',
          onHomePress: () => {
            onHomePress();
            this.resetMePayState();
          }
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            marginTop: 12,
            padding: 12
          },
          children: [
            // Balance Card
            ui.View({
              style: {
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
              },
              children: [
                ui.Text({
                  text: 'Account Balance',
                  style: {
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: 6
                  }
                }),
                ui.Text({
                  text: ui.Binding.derive([this.mePayBalanceBinding], (balance) => 
                    `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ),
                  style: {
                    fontSize: 22,
                    fontWeight: '700',
                    color: '#FFFFFF'
                  }
                })
              ]
            }),

            // Quick Actions
            ui.View({
              style: {
                flexDirection: 'row',
                marginBottom: 16
              },
              children: [
                // Send Button
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#3B82F6',
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginRight: 8
                  },
                  onPress: () => {
                    this.navigateToMePayPage('send');
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("2808780245977101"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#FFFFFF',
                        marginBottom: 6
                      }
                    }),
                    ui.Text({
                      text: 'Send',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#FFFFFF'
                      }
                    })
                  ]
                }),

                // Request Button
                ui.Pressable({
                  style: {
                    flex: 1,
                    backgroundColor: '#10B981',
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginLeft: 8
                  },
                  onPress: () => {
                    this.navigateToMePayPage('request');
                  },
                  children: [
                    ui.Image({
                      source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("2521912731541281"))),
                      style: {
                        width: 16,
                        height: 16,
                        tintColor: '#FFFFFF',
                        marginBottom: 6
                      }
                    }),
                    ui.Text({
                      text: 'Request',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
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
    });
  }

  private renderMePaySend(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Send Money',
          onHomePress: () => {
            onHomePress();
            this.resetMePayState();
          },
          onBackPress: () => {
            this.navigateToMePayPage('home');
          },
          showBackButton: true
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            marginTop: 12,
            padding: this.showSendNumpad ? 0 : 12
          },
          children: [
            // Form Fields
            ui.View({
              style: {
                padding: this.showSendNumpad ? 12 : 0,
                paddingBottom: this.showSendNumpad ? 8 : 0
              },
              children: [
                // Recipient Field
                this.createMePayContactField(
                  'To',
                  this.selectedMePayContact,
                  this.mePayContacts,
                  (contact) => {
                    this.selectedMePayContact = contact;
                    this.selectedMePayContactBinding.set(contact);
                  },
                  this.isContactDropdownOpen,
                  () => {
                    this.isContactDropdownOpen = !this.isContactDropdownOpen;
                  }
                ),

                // Amount Field
                ui.View({
                  style: {
                    backgroundColor: '#F9FAFB',
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 12
                  },
                  children: [
                    ui.Text({
                      text: 'Amount',
                      style: {
                        fontSize: 12,
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: 6
                      }
                    }),
                    ui.Pressable({
                      style: {
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 8,
                        padding: 10,
                        minHeight: 36
                      },
                      onPress: () => {
                        this.showSendNumpad = true;
                        this.showSendNumpadBinding.set(true);
                      },
                      children: [
                        ui.Text({
                          text: ui.Binding.derive([this.sendAmountBinding], (amount) => 
                            amount ? `$${this.formatMePayAmount(amount)}` : '$0'
                          ),
                          style: {
                            fontSize: 20,
                            fontWeight: '600',
                            color: '#111827',
                            textAlign: 'center'
                          }
                        })
                      ]
                    })
                  ]
                }),

                // Note Field (only when numpad is not shown)
                ...(this.showSendNumpad ? [] : [
                  this.createMePayNoteField(
                    'Note (Optional)',
                    this.selectedSendNote,
                    (note) => {
                      this.selectedSendNote = note;
                      this.selectedSendNoteBinding.set(note);
                    },
                    this.isSendNoteDropdownOpen,
                    () => {
                      this.isSendNoteDropdownOpen = !this.isSendNoteDropdownOpen;
                    }
                  )
                ])
              ]
            }),

            // Send Button (only when numpad is not shown)
            ...(this.showSendNumpad ? [] : [
              ui.Pressable({
                style: {
                  backgroundColor: this.selectedMePayContact && this.sendAmount ? '#3B82F6' : '#9CA3AF',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 'auto'
                },
                onPress: () => {
                  if (this.selectedMePayContact && this.sendAmount) {
                    this.handleSendMoney();
                  }
                },
                children: [
                  ui.Text({
                    text: 'Send Money',
                    style: {
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ])
          ]
        }),

        // Numpad (when active)
        ...(this.showSendNumpad ? [this.renderMePayNumpad(false)] : [])
      ]
    });
  }

  private renderMePayRequest(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.createAppHeader({
          appName: 'Request Money',
          onHomePress: () => {
            onHomePress();
            this.resetMePayState();
          },
          onBackPress: () => {
            this.navigateToMePayPage('home');
          },
          showBackButton: true
        }),

        // Content
        ui.View({
          style: {
            flex: 1,
            marginTop: 12,
            padding: this.showRequestNumpad ? 0 : 16
          },
          children: [
            // Form Fields
            ui.View({
              style: {
                padding: this.showRequestNumpad ? 16 : 0,
                paddingBottom: this.showRequestNumpad ? 12 : 0
              },
              children: [
                // Recipient Field
                this.createMePayContactField(
                  'From',
                  this.selectedRequestContact,
                  this.mePayContacts,
                  (contact) => {
                    this.selectedRequestContact = contact;
                    this.selectedRequestContactBinding.set(contact);
                  },
                  this.isRequestContactDropdownOpen,
                  () => {
                    this.isRequestContactDropdownOpen = !this.isRequestContactDropdownOpen;
                  }
                ),

                // Amount Field
                ui.View({
                  style: {
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 16
                  },
                  children: [
                    ui.Text({
                      text: 'Amount',
                      style: {
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: 8
                      }
                    }),
                    ui.Pressable({
                      style: {
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#D1D5DB',
                        borderRadius: 8,
                        padding: 12,
                        minHeight: 44
                      },
                      onPress: () => {
                        this.showRequestNumpad = true;
                        this.showRequestNumpadBinding.set(true);
                      },
                      children: [
                        ui.Text({
                          text: ui.Binding.derive([this.requestAmountBinding], (amount) => 
                            amount ? `$${this.formatMePayAmount(amount)}` : '$0'
                          ),
                          style: {
                            fontSize: 24,
                            fontWeight: '600',
                            color: '#111827',
                            textAlign: 'center'
                          }
                        })
                      ]
                    })
                  ]
                }),

                // Note Field (only when numpad is not shown)
                ...(this.showRequestNumpad ? [] : [
                  this.createMePayNoteField(
                    'Note (Optional)',
                    this.selectedRequestNote,
                    (note) => {
                      this.selectedRequestNote = note;
                      this.selectedRequestNoteBinding.set(note);
                    },
                    this.isRequestNoteDropdownOpen,
                    () => {
                      this.isRequestNoteDropdownOpen = !this.isRequestNoteDropdownOpen;
                    }
                  )
                ])
              ]
            }),

            // Request Button (only when numpad is not shown)
            ...(this.showRequestNumpad ? [] : [
              ui.Pressable({
                style: {
                  backgroundColor: this.selectedRequestContact && this.requestAmount ? '#10B981' : '#9CA3AF',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 'auto'
                },
                onPress: () => {
                  if (this.selectedRequestContact && this.requestAmount) {
                    this.handleRequestMoney();
                  }
                },
                children: [
                  ui.Text({
                    text: 'Send Request',
                    style: {
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#FFFFFF',
                      textAlign: 'center'
                    }
                  })
                ]
              })
            ])
          ]
        }),

        // Numpad (when active)
        ...(this.showRequestNumpad ? [this.renderMePayNumpad(true)] : [])
      ]
    });
  }

  // MePay helper methods
  private navigateToMePayPage(page: 'home' | 'send' | 'request' | 'sent' | 'requested'): void {
    this.currentMePayPage = page;
    this.currentMePayPageBinding.set(page);
  }

  private resetMePayState(): void {
    this.currentMePayPage = 'home';
    this.currentMePayPageBinding.set('home');
    this.selectedMePayContact = null;
    this.selectedMePayContactBinding.set(null);
    this.selectedRequestContact = null;
    this.selectedRequestContactBinding.set(null);
    this.sendAmount = '';
    this.sendAmountBinding.set('');
    this.requestAmount = '';
    this.requestAmountBinding.set('');
    this.showSendNumpad = false;
    this.showSendNumpadBinding.set(false);
    this.showRequestNumpad = false;
    this.showRequestNumpadBinding.set(false);
    this.selectedSendNote = '';
    this.selectedSendNoteBinding.set('');
    this.selectedRequestNote = '';
    this.selectedRequestNoteBinding.set('');
    this.lastTransaction = null;
    this.lastTransactionBinding.set(null);
    
    // Reset dropdown states
    this.isContactDropdownOpen = false;
    this.isRequestContactDropdownOpen = false;
    this.isSendNoteDropdownOpen = false;
    this.isRequestNoteDropdownOpen = false;
  }

  private formatMePayAmount(amount: string): string {
    if (!amount) return '0';
    const num = parseInt(amount);
    if (isNaN(num)) return '0';
    return num.toString();
  }

  private createTransactionItem(transaction: Transaction): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center'
      },
      children: [
        // Transaction icon
        ui.View({
          style: {
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 
              transaction.type === 'sent' ? '#FEE2E2' :
              transaction.type === 'received' ? '#DCFCE7' :
              transaction.type === 'bill' ? '#F3E8FF' : '#DBEAFE',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt(
                transaction.type === 'sent' ? "2808780245977101" :
                transaction.type === 'received' ? "2521912731541281" :
                "769107079414002"
              ))),
              style: {
                width: 16,
                height: 16,
                tintColor: 
                  transaction.type === 'sent' ? '#DC2626' :
                  transaction.type === 'received' ? '#16A34A' :
                  transaction.type === 'bill' ? '#7C3AED' : '#2563EB'
              }
            })
          ]
        }),

        // Transaction details
        ui.View({
          style: {
            flex: 1
          },
          children: [
            ui.Text({
              text: transaction.description,
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: `${transaction.date} • ${transaction.category}`,
              style: {
                fontSize: 12,
                color: '#6B7280'
              }
            })
          ]
        }),

        // Amount
        ui.Text({
          text: `${transaction.amount > 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}`,
          style: {
            fontSize: 14,
            fontWeight: '500',
            color: transaction.amount > 0 ? '#16A34A' : '#111827'
          }
        })
      ]
    });
  }

  private createMePayContactField(
    label: string,
    selectedContact: MePayContact | null,
    contacts: MePayContact[],
    onSelect: (contact: MePayContact | null) => void,
    isOpen: boolean,
    onToggle: () => void
  ): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12
      },
      children: [
        ui.Text({
          text: label,
          style: {
            fontSize: 12,
            fontWeight: '500',
            color: '#374151',
            marginBottom: 6
          }
        }),
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 8,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          },
          onPress: onToggle,
          children: [
            selectedContact ? ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: selectedContact.avatar,
                  style: {
                    fontSize: 14,
                    marginRight: 6
                  }
                }),
                ui.View({
                  children: [
                    ui.Text({
                      text: selectedContact.name,
                      style: {
                        fontSize: 12,
                        fontWeight: '500',
                        color: '#111827'
                      }
                    }),
                    ui.Text({
                      text: selectedContact.phone,
                      style: {
                        fontSize: 10,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }) : ui.Text({
              text: 'Select a contact',
              style: {
                fontSize: 12,
                color: '#9CA3AF'
              }
            }),
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1162937905665096"))),
              style: {
                width: 16,
                height: 16,
                tintColor: '#9CA3AF'
              }
            })
          ]
        }),
        
        // Dropdown list
        ...(isOpen ? [ui.ScrollView({
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 200
          },
          children: contacts.map((contact, index) => 
            ui.Pressable({
              style: {
                padding: 12,
                borderBottomWidth: index < contacts.length - 1 ? 1 : 0,
                borderColor: '#F3F4F6',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              },
              onPress: () => {
                onSelect(contact);
                onToggle();
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center'
                  },
                  children: [
                    ui.Text({
                      text: contact.avatar,
                      style: {
                        fontSize: 16,
                        marginRight: 8
                      }
                    }),
                    ui.View({
                      children: [
                        ui.Text({
                          text: contact.name,
                          style: {
                            fontSize: 14,
                            fontWeight: '500',
                            color: '#111827'
                          }
                        }),
                        ui.Text({
                          text: contact.phone,
                          style: {
                            fontSize: 12,
                            color: '#6B7280'
                          }
                        })
                      ]
                    })
                  ]
                }),
                ...(selectedContact?.id === contact.id ? [ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24270584229301990"))),
                  style: {
                    width: 16,
                    height: 16,
                    tintColor: '#10B981'
                  }
                })] : [])
              ]
            })
          )
        })] : [])
      ]
    });
  }

  private createMePayNoteField(
    label: string,
    selectedNote: string,
    onSelect: (note: string) => void,
    isOpen: boolean,
    onToggle: () => void
  ): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12
      },
      children: [
        ui.Text({
          text: label,
          style: {
            fontSize: 12,
            fontWeight: '500',
            color: '#374151',
            marginBottom: 6
          }
        }),
        ui.Pressable({
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 8,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          },
          onPress: onToggle,
          children: [
            ui.Text({
              text: selectedNote || 'Select a reason',
              style: {
                fontSize: 14,
                color: selectedNote ? '#111827' : '#9CA3AF'
              }
            }),
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1162937905665096"))),
              style: {
                width: 16,
                height: 16,
                tintColor: '#9CA3AF'
              }
            })
          ]
        }),
        
        // Dropdown list
        ...(isOpen ? [ui.ScrollView({
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 160
          },
          children: this.mePayNoteReasons.map((reason, index) => 
            ui.Pressable({
              style: {
                padding: 12,
                borderBottomWidth: index < this.mePayNoteReasons.length - 1 ? 1 : 0,
                borderColor: '#F3F4F6',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              },
              onPress: () => {
                onSelect(reason);
                onToggle();
              },
              children: [
                ui.Text({
                  text: reason,
                  style: {
                    fontSize: 14,
                    color: '#111827'
                  }
                }),
                ...(selectedNote === reason ? [ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("24270584229301990"))),
                  style: {
                    width: 16,
                    height: 16,
                    tintColor: '#10B981'
                  }
                })] : [])
              ]
            })
          )
        })] : [])
      ]
    });
  }

  private renderMePayNumpad(isRequest: boolean): ui.UINode {
    const numpadKeys = [
      ['1', '2', '3'],
      ['4', '5', '6'], 
      ['7', '8', '9'],
      ['clear', '0', 'del']
    ];

    return ui.View({
      style: {
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderColor: '#E5E7EB'
      },
      children: [
        ui.View({
          style: {
            padding: 12
          },
          children: [
            // Numpad Grid
            ...numpadKeys.map((row, rowIndex) => 
              ui.View({
                style: {
                  flexDirection: 'row',
                  marginBottom: 6
                },
                children: row.map((key, keyIndex) => 
                  ui.Pressable({
                    style: {
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 6,
                      padding: 12,
                      marginHorizontal: 3,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 40
                    },
                    onPress: () => {
                      this.handleMePayNumpadPress(key, isRequest);
                    },
                    children: [
                      key === 'del' ? ui.Image({
                        source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("802575082453612"))),
                        style: {
                          width: 16,
                          height: 16,
                          tintColor: '#374151'
                        }
                      }) : ui.Text({
                        text: key === 'clear' ? 'Clear' : key,
                        style: {
                          fontSize: key === 'clear' ? 12 : 18,
                          fontWeight: '600',
                          color: '#374151'
                        }
                      })
                    ]
                  })
                )
              })
            ),

            // Confirm Button
            ui.Pressable({
              style: {
                backgroundColor: isRequest ? '#10B981' : '#3B82F6',
                borderRadius: 12,
                padding: 16,
                marginTop: 16
              },
              onPress: () => {
                if (isRequest) {
                  this.showRequestNumpad = false;
                  this.showRequestNumpadBinding.set(false);
                } else {
                  this.showSendNumpad = false;
                  this.showSendNumpadBinding.set(false);
                }
              },
              children: [
                ui.Text({
                  text: 'Confirm',
                  style: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        }),

        // Continue Button
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderColor: '#E5E7EB',
            padding: 16
          },
          children: [
            ui.Pressable({
              style: {
                backgroundColor: isRequest ? '#10B981' : '#3B82F6',
                borderRadius: 12,
                padding: 16
              },
              onPress: () => {
                if (isRequest) {
                  this.handleRequestMoney();
                } else {
                  this.handleSendMoney();
                }
              },
              children: [
                ui.Text({
                  text: isRequest ? 'Send Request' : 'Send Payment',
                  style: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private handleMePayNumpadPress(key: string, isRequest: boolean): void {
    const currentAmount = isRequest ? this.requestAmount : this.sendAmount;
    const setAmount = isRequest ? 
      (amount: string) => {
        this.requestAmount = amount;
        this.requestAmountBinding.set(amount);
      } : 
      (amount: string) => {
        this.sendAmount = amount;
        this.sendAmountBinding.set(amount);
      };
    
    if (key === 'del') {
      setAmount(currentAmount.slice(0, -1));
    } else if (key === 'clear') {
      setAmount('');
    } else if (key && key.length > 0) {
      // Limit total length
      if (currentAmount.length < 10) {
        setAmount(currentAmount + key);
      }
    }
  }

  private handleSendMoney(): void {
    this.lastTransaction = {
      type: 'sent',
      amount: this.sendAmount,
      contact: this.selectedMePayContact,
      note: this.selectedSendNote
    };
    this.lastTransactionBinding.set(this.lastTransaction);
    this.navigateToMePayPage('sent');
  }

  private handleRequestMoney(): void {
    this.lastTransaction = {
      type: 'requested',
      amount: this.requestAmount,
      contact: this.selectedRequestContact,
      note: this.selectedRequestNote
    };
    this.lastTransactionBinding.set(this.lastTransaction);
    this.navigateToMePayPage('requested');
  }

  private renderPaymentSentScreen(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
      },
      children: [
        // Success Icon
        ui.View({
          style: {
            width: 80,
            height: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("4106264752923610"))),
              style: {
                width: 40,
                height: 40,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Success Message
        ui.Text({
          text: 'Payment Sent Successfully!',
          style: {
            fontSize: 20,
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 32
          }
        }),

        // Action Button
        ui.Pressable({
          style: {
            backgroundColor: '#059669',
            borderRadius: 12,
            padding: 16,
            width: '100%'
          },
          onPress: () => {
            this.navigateToMePayPage('home');
          },
          children: [
            ui.Text({
              text: 'Okay',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
                textAlign: 'center'
              }
            })
          ]
        })
      ]
    });
  }

  private renderRequestSentScreen(onHomePress: () => void): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
      },
      children: [
        // Success Icon
        ui.View({
          style: {
            width: 80,
            height: 80,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24
          },
          children: [
            ui.Image({
              source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("4106264752923610"))),
              style: {
                width: 40,
                height: 40,
                tintColor: '#FFFFFF'
              }
            })
          ]
        }),

        // Success Message
        ui.Text({
          text: 'Request Sent Successfully!',
          style: {
            fontSize: 20,
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
            marginBottom: 32
          }
        }),

        // Action Button
        ui.Pressable({
          style: {
            backgroundColor: '#2563EB',
            borderRadius: 12,
            padding: 16,
            width: '100%'
          },
          onPress: () => {
            this.navigateToMePayPage('home');
          },
          children: [
            ui.Text({
              text: 'Okay',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
                textAlign: 'center'
              }
            })
          ]
        })
      ]
    });
  }
}
