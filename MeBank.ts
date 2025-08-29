import * as ui from 'horizon/ui';

type BankPage = 'home' | 'send-money' | 'request-money' | 'pay-bills';

interface Bill {
  id: string;
  name: string;
  amount: number;
  emoji: string;
  description: string;
}

class MeBank extends ui.UIComponent<typeof MeBank> {
  static propsDefinition = {};

  private currentPageBinding = new ui.Binding<BankPage>('home');
  private currentPage: BankPage = 'home';
  private selectedBillBinding = new ui.Binding<string>('');
  private selectedBill = '';
  private paidBillsBinding = new ui.Binding<string[]>([]);
  private paidBills: string[] = [];

  initializeUI(): ui.UINode {
    return this.renderPhoneFrame();
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
                this.renderBankContent()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderBankContent(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        flexDirection: 'column'
      },
      children: [
        // Header with back button and title
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1
          },
          children: [
            ui.View({
              style: {
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: '🏠',
                  style: {
                    fontSize: 16,
                    color: '#9CA3AF',
                    marginRight: 8
                  }
                }),
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page !== 'home' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    ui.Pressable({
                      onPress: () => {
                        this.navigateToPage('home');
                      },
                      children: [
                        ui.Text({
                          text: '⬅️',
                          style: {
                            fontSize: 16,
                            color: '#3B82F6'
                          }
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            ui.Text({
              text: 'MeBank',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),

        // Content area with scrolling
        ui.ScrollView({
          style: {
            flex: 1,
            backgroundColor: '#DBEAFE'
          },
          children: [
            ui.View({
              style: {
                padding: 12,
                paddingTop: 16
              },
              children: [
                // Home Page
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page === 'home' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    this.renderHomePage()
                  ]
                }),
                // Send Money Page
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page === 'send-money' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    this.renderSendMoneyPage()
                  ]
                }),
                // Request Money Page
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page === 'request-money' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    this.renderRequestMoneyPage()
                  ]
                }),
                // Pay Bills Page
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page === 'pay-bills' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    this.renderPayBillsPage()
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private navigateToPage(page: BankPage): void {
    // Reset pay-bills state when navigating away from that page
    if (this.currentPage === 'pay-bills' && page !== 'pay-bills') {
      this.selectedBill = '';
      this.selectedBillBinding.set('');
      this.paidBills = [];
      this.paidBillsBinding.set([]);
    }
    
    this.currentPage = page;
    this.currentPageBinding.set(page);
  }

  private renderHeader(): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#2563EB',
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#1E40AF'
      },
      children: [
        ui.Text({
          text: '🏦 MeBank',
          style: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: 2
          }
        }),
        ui.Text({
          text: 'Secure Online Banking',
          style: {
            fontSize: 10,
            color: '#BFDBFE'
          }
        })
      ]
    });
  }

  private renderAccountBalance(): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#059669'
      },
      children: [
        ui.Text({
          text: 'Account Balance:',
          style: {
            fontSize: 11,
            fontWeight: '600',
            color: '#065F46',
            marginBottom: 4
          }
        }),
        ui.Text({
          text: '$12,847.92',
          style: {
            fontSize: 18,
            fontWeight: '700',
            color: '#059669'
          }
        })
      ]
    });
  }

  private renderHomePage(): ui.UINode {
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        this.renderHeader(),
        this.renderAccountBalance(),
        
        // Quick Actions
        ui.View({
          style: {
            marginBottom: 12
          },
          children: [
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              onPress: () => {
                this.navigateToPage('send-money');
              },
              children: [
                ui.Text({
                  text: 'SEND MONEY',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#1E40AF',
                    textAlign: 'center'
                  }
                })
              ]
            }),
            
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#059669',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              onPress: () => {
                this.navigateToPage('request-money');
              },
              children: [
                ui.Text({
                  text: 'REQUEST MONEY',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#065F46',
                    textAlign: 'center'
                  }
                })
              ]
            }),
            
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#7C3AED',
                borderRadius: 6,
                padding: 12
              },
              onPress: () => {
                this.navigateToPage('pay-bills');
              },
              children: [
                ui.Text({
                  text: 'PAY BILLS',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#5B21B6',
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

  private renderSendMoneyPage(): ui.UINode {
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        this.renderHeader(),
        this.renderAccountBalance(),
        
        // Send Money Form
        ui.View({
          children: [
            // Recipient
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'TO:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1E40AF',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8
                  },
                  children: [
                    ui.Text({
                      text: "Enter recipient's email or phone",
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Amount
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#059669',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'AMOUNT:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#065F46',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8
                  },
                  children: [
                    ui.Text({
                      text: '$0.00',
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Note
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#7C3AED',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'NOTE (Optional):',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#5B21B6',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8,
                    minHeight: 40
                  },
                  children: [
                    ui.Text({
                      text: "What's this for?",
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Send Button
            ui.Pressable({
              style: {
                backgroundColor: '#2563EB',
                borderWidth: 2,
                borderColor: '#1E40AF',
                borderRadius: 6,
                padding: 12
              },
              children: [
                ui.Text({
                  text: 'SEND MONEY',
                  style: {
                    fontSize: 12,
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

  private renderRequestMoneyPage(): ui.UINode {
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        this.renderHeader(),
        this.renderAccountBalance(),
        
        // Request Money Form
        ui.View({
          children: [
            // From
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#059669',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'FROM:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#065F46',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8
                  },
                  children: [
                    ui.Text({
                      text: "Enter sender's email or phone",
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Amount
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'AMOUNT:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1E40AF',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8
                  },
                  children: [
                    ui.Text({
                      text: '$0.00',
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Note
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#7C3AED',
                borderRadius: 6,
                padding: 12,
                marginBottom: 8
              },
              children: [
                ui.Text({
                  text: 'NOTE (Optional):',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#5B21B6',
                    marginBottom: 6
                  }
                }),
                ui.View({
                  style: {
                    backgroundColor: '#F3F4F6',
                    borderWidth: 2,
                    borderColor: '#9CA3AF',
                    borderRadius: 4,
                    padding: 8,
                    minHeight: 40
                  },
                  children: [
                    ui.Text({
                      text: "What's this for?",
                      style: {
                        fontSize: 9,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),

            // Request Button
            ui.Pressable({
              style: {
                backgroundColor: '#059669',
                borderWidth: 2,
                borderColor: '#065F46',
                borderRadius: 6,
                padding: 12
              },
              children: [
                ui.Text({
                  text: 'REQUEST MONEY',
                  style: {
                    fontSize: 12,
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

  private renderPayBillsPage(): ui.UINode {
    const bills = this.getBills();
    
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        this.renderHeader(),
        this.renderAccountBalance(),
        
        // Bills List
        ui.View({
          children: [
            ...bills.map(bill => this.renderBillItem(bill)),
            
            // Pay Button
            ui.Pressable({
              style: {
                backgroundColor: ui.Binding.derive([this.selectedBillBinding], (selected) => 
                  selected ? '#7C3AED' : '#9CA3AF'
                ),
                borderWidth: 2,
                borderColor: ui.Binding.derive([this.selectedBillBinding], (selected) => 
                  selected ? '#5B21B6' : '#6B7280'
                ),
                borderRadius: 6,
                padding: 12,
                marginTop: 8
              },
              onPress: () => {
                this.handlePayBill();
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.selectedBillBinding], (selected) => {
                    if (selected) {
                      const bill = bills.find(b => b.id === selected);
                      return bill ? `PAY ${bill.name.toUpperCase()} - $${bill.amount.toFixed(2)}` : 'SELECT A BILL TO PAY';
                    }
                    return 'SELECT A BILL TO PAY';
                  }),
                  style: {
                    fontSize: 10,
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

  private renderBillItem(bill: Bill): ui.UINode {
    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: ui.Binding.derive([this.selectedBillBinding, this.paidBillsBinding], (selected, paid) => {
          if (paid.includes(bill.id)) return '#059669';
          if (selected === bill.id) return '#7C3AED';
          return '#D1D5DB';
        }),
        borderRadius: 6,
        padding: 12,
        marginBottom: 6
      },
      onPress: () => {
        if (!this.paidBills.includes(bill.id)) {
          this.selectedBill = this.selectedBill === bill.id ? '' : bill.id;
          this.selectedBillBinding.set(this.selectedBill);
        }
      },
      children: [
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
                alignItems: 'center',
                flex: 1
              },
              children: [
                ui.Text({
                  text: bill.emoji,
                  style: {
                    fontSize: 14,
                    marginRight: 8
                  }
                }),
                ui.View({
                  style: {
                    flex: 1
                  },
                  children: [
                    ui.Text({
                      text: bill.name,
                      style: {
                        fontSize: 10,
                        fontWeight: '600',
                        color: ui.Binding.derive([this.selectedBillBinding, this.paidBillsBinding], (selected, paid) => {
                          if (paid.includes(bill.id)) return '#065F46';
                          if (selected === bill.id) return '#5B21B6';
                          return '#374151';
                        }),
                        marginBottom: 2
                      }
                    }),
                    ui.Text({
                      text: bill.description,
                      style: {
                        fontSize: 8,
                        color: '#6B7280'
                      }
                    })
                  ]
                })
              ]
            }),
            ui.View({
              style: {
                alignItems: 'flex-end'
              },
              children: [
                ui.Text({
                  text: `$${bill.amount.toFixed(2)}`,
                  style: {
                    fontSize: 11,
                    fontWeight: '700',
                    color: ui.Binding.derive([this.selectedBillBinding, this.paidBillsBinding], (selected, paid) => {
                      if (paid.includes(bill.id)) return '#059669';
                      if (selected === bill.id) return '#7C3AED';
                      return '#DC2626';
                    })
                  }
                }),
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.paidBillsBinding], (paid) => 
                      paid.includes(bill.id) ? 'flex' : 'none'
                    )
                  },
                  children: [
                    ui.Text({
                      text: 'PAID ✓',
                      style: {
                        fontSize: 7,
                        fontWeight: '600',
                        color: '#059669'
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

  private handlePayBill(): void {
    if (this.selectedBill && !this.paidBills.includes(this.selectedBill)) {
      this.paidBills.push(this.selectedBill);
      this.paidBillsBinding.set([...this.paidBills]);
      this.selectedBill = '';
      this.selectedBillBinding.set('');
    }
  }

  private getBills(): Bill[] {
    return [
      { id: 'electric', name: 'Electric Company', amount: 89.47, emoji: '⚡', description: 'Monthly electricity usage' },
      { id: 'gas', name: 'Gas Company', amount: 156.23, emoji: '🔥', description: 'Natural gas service' },
      { id: 'water', name: 'Water Utility', amount: 67.89, emoji: '💧', description: 'Water & sewer services' },
      { id: 'internet', name: 'Internet Provider', amount: 79.99, emoji: '🌐', description: 'High-speed internet' },
      { id: 'credit-card', name: 'Credit Card Payment', amount: 324.56, emoji: '💳', description: 'Monthly minimum payment' },
      { id: 'phone', name: 'Phone Service', amount: 45.00, emoji: '📱', description: 'Mobile phone plan' }
    ];
  }
}

ui.UIComponent.register(MeBank);
