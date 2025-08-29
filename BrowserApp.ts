import * as ui from 'horizon/ui';

class BrowserApp extends ui.UIComponent<typeof BrowserApp> {
  static propsDefinition = {};

  private currentUrlBinding = new ui.Binding<string>('search');
  private currentUrl = 'search';
  private historyBinding = new ui.Binding<string[]>([]);
  private history: string[] = [];

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
                this.renderBrowserContent()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderBrowserContent(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        flexDirection: 'column'
      },
      children: [
        // Browser Header
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
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
                ui.Pressable({
                  style: {
                    padding: 4,
                    marginRight: 6
                  },
                  children: [
                    ui.Text({
                      text: '🏠',
                      style: {
                        fontSize: 16
                      }
                    })
                  ]
                }),
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentUrlBinding], (url) => 
                      url !== 'search' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    ui.Pressable({
                      style: {
                        padding: 4
                      },
                      onPress: () => {
                        this.navigateBack();
                      },
                      children: [
                        ui.Text({
                          text: '⬅️',
                          style: {
                            fontSize: 16
                          }
                        })
                      ]
                    })
                  ]
                })
              ]
            }),
            ui.Text({
              text: 'Browser',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),

        // Address Bar
        ui.View({
          style: {
            backgroundColor: '#F9FAFB',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderBottomWidth: 1
          },
          children: [
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                paddingHorizontal: 10,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: '🔍',
                  style: {
                    fontSize: 12,
                    color: '#9CA3AF',
                    marginRight: 8
                  }
                }),
                ui.Text({
                  text: ui.Binding.derive([this.currentUrlBinding], (url) => 
                    this.getDisplayUrl(url)
                  ),
                  style: {
                    fontSize: 9,
                    color: '#111827',
                    flex: 1
                  }
                })
              ]
            })
          ]
        }),

        // Browser Content
        ui.View({
          style: {
            flex: 1
          },
          children: [
            // Search Page
            ui.View({
              style: {
                flex: 1,
                display: ui.Binding.derive([this.currentUrlBinding], (url) => 
                  url === 'search' ? 'flex' : 'none'
                )
              },
              children: [
                this.renderSearchPage()
              ]
            }),
            // MeBank Website
            ui.View({
              style: {
                flex: 1,
                display: ui.Binding.derive([this.currentUrlBinding], (url) => 
                  url === 'mebank.com' ? 'flex' : 'none'
                )
              },
              children: [
                this.renderMeBank()
              ]
            })
          ]
        })
      ]
    });
  }

  private getDisplayUrl(url: string): string {
    if (url === 'search') {
      return 'https://www.browser.com';
    }
    if (url === 'mebank.com') {
      return 'https://www.mebank.com';
    }
    return `https://www.${url}`;
  }

  private navigate(url: string): void {
    if (url !== this.currentUrl) {
      // Add current URL to history before navigating
      this.history.push(this.currentUrl);
      this.historyBinding.set([...this.history]);
      this.currentUrl = url;
      this.currentUrlBinding.set(url);
    }
  }

  private navigateBack(): void {
    if (this.history.length > 0) {
      const previousUrl = this.history.pop() || 'search';
      this.historyBinding.set([...this.history]);
      this.currentUrl = previousUrl;
      this.currentUrlBinding.set(previousUrl);
    } else {
      this.currentUrl = 'search';
      this.currentUrlBinding.set('search');
    }
  }

  private renderSearchPage(): ui.UINode {
    return ui.ScrollView({
      style: {
        flex: 1,
        backgroundColor: '#FAF5FF'
      },
      children: [
        ui.View({
          style: {
            padding: 16,
            paddingTop: 24
          },
          children: [
            // MeBank Link
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12
              },
              onPress: () => {
                this.navigate('mebank.com');
              },
              children: [
                ui.Text({
                  text: '🏦 MeBank - Secure Banking',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1E3A8A',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: 'https://www.mebank.com',
                  style: {
                    fontSize: 9,
                    fontWeight: '600',
                    color: '#059669',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: 'Manage accounts, transfer money, and pay bills securely online.',
                  style: {
                    fontSize: 8,
                    color: '#374151'
                  }
                })
              ]
            }),

            // MeShop Link (placeholder)
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#EA580C',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                opacity: 0.6
              },
              children: [
                ui.Text({
                  text: '🛒 MeShop - Electronics Store',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#9A3412',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: 'https://www.meshop.com',
                  style: {
                    fontSize: 9,
                    fontWeight: '600',
                    color: '#059669',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: 'Latest electronics and accessories with fast shipping.',
                  style: {
                    fontSize: 8,
                    color: '#374151'
                  }
                })
              ]
            }),

            // MeNews Link (placeholder)
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#2563EB',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                opacity: 0.6
              },
              children: [
                ui.Text({
                  text: '📰 MeNews - Breaking News',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1E3A8A',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: 'https://www.menews.com',
                  style: {
                    fontSize: 9,
                    fontWeight: '600',
                    color: '#059669',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: 'Latest breaking news and current events from around the world.',
                  style: {
                    fontSize: 8,
                    color: '#374151'
                  }
                })
              ]
            }),

            // Footer
            ui.View({
              style: {
                alignItems: 'center',
                marginTop: 12
              },
              children: [
                ui.Text({
                  text: "that's all folks! 😳",
                  style: {
                    fontSize: 9,
                    color: '#6B7280'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private renderMeBank(): ui.UINode {
    return ui.ScrollView({
      style: {
        flex: 1
      },
      children: [
        // MeBank Header
        ui.View({
          style: {
            backgroundColor: '#1E40AF',
            padding: 12,
            borderRadius: 8,
            marginBottom: 12
          },
          children: [
            ui.Text({
              text: '🏦 MeBank',
              style: {
                fontSize: 14,
                fontWeight: 'bold',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 4
              }
            }),
            ui.Text({
              text: 'Your Trusted Financial Partner',
              style: {
                fontSize: 9,
                color: '#BFDBFE',
                textAlign: 'center'
              }
            })
          ]
        }),

        // Account Balance
        ui.View({
          style: {
            backgroundColor: '#F8FAFC',
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0'
          },
          children: [
            ui.Text({
              text: 'Account Balance',
              style: {
                fontSize: 10,
                color: '#64748B',
                marginBottom: 4
              }
            }),
            ui.Text({
              text: '$2,543.67',
              style: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#059669',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: 'Checking Account ****1234',
              style: {
                fontSize: 8,
                color: '#64748B'
              }
            })
          ]
        }),

        // Quick Actions
        ui.Text({
          text: 'Quick Actions',
          style: {
            fontSize: 11,
            fontWeight: '500',
            color: '#111827',
            marginBottom: 8
          }
        }),
        ui.View({
          style: {
            flexDirection: 'row',
            marginBottom: 12
          },
          children: [
            ui.Pressable({
              style: {
                flex: 1,
                backgroundColor: '#FFFFFF',
                padding: 10,
                borderRadius: 6,
                marginRight: 4,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: '💸',
                  style: {
                    fontSize: 12,
                    marginBottom: 2
                  }
                }),
                ui.Text({
                  text: 'Transfer',
                  style: {
                    fontSize: 8,
                    color: '#111827'
                  }
                })
              ]
            }),
            ui.Pressable({
              style: {
                flex: 1,
                backgroundColor: '#FFFFFF',
                padding: 10,
                borderRadius: 6,
                marginLeft: 4,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: '💳',
                  style: {
                    fontSize: 12,
                    marginBottom: 2
                  }
                }),
                ui.Text({
                  text: 'Pay Bills',
                  style: {
                    fontSize: 8,
                    color: '#111827'
                  }
                })
              ]
            })
          ]
        }),

        // Recent Transactions
        ui.Text({
          text: 'Recent Transactions',
          style: {
            fontSize: 11,
            fontWeight: '500',
            color: '#111827',
            marginBottom: 8
          }
        }),
        ...this.getTransactions().map(transaction => 
          ui.View({
            style: {
              backgroundColor: '#FFFFFF',
              padding: 10,
              borderRadius: 6,
              marginBottom: 6,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            },
            children: [
              ui.View({
                style: { flex: 1 },
                children: [
                  ui.Text({
                    text: transaction.description,
                    style: {
                      fontSize: 9,
                      color: '#111827',
                      marginBottom: 1
                    }
                  }),
                  ui.Text({
                    text: transaction.date,
                    style: {
                      fontSize: 7,
                      color: '#64748B'
                    }
                  })
                ]
              }),
              ui.Text({
                text: transaction.amount,
                style: {
                  fontSize: 9,
                  fontWeight: '500',
                  color: transaction.amount.startsWith('-') ? '#DC2626' : '#059669'
                }
              })
            ]
          })
        ),

        // Banking Services
        ui.Text({
          text: 'Banking Services',
          style: {
            fontSize: 11,
            fontWeight: '500',
            color: '#111827',
            marginBottom: 8,
            marginTop: 12
          }
        }),
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#E5E7EB'
          },
          children: [
            ui.Pressable({
              style: {
                padding: 10,
                borderBottomWidth: 1,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: '💰',
                  style: {
                    fontSize: 12,
                    marginRight: 8
                  }
                }),
                ui.Text({
                  text: 'Loans & Credit',
                  style: {
                    fontSize: 9,
                    color: '#111827',
                    flex: 1
                  }
                }),
                ui.Text({
                  text: '›',
                  style: {
                    fontSize: 12,
                    color: '#9CA3AF'
                  }
                })
              ]
            }),
            ui.Pressable({
              style: {
                padding: 10,
                borderBottomWidth: 1,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: '📊',
                  style: {
                    fontSize: 12,
                    marginRight: 8
                  }
                }),
                ui.Text({
                  text: 'Investment Services',
                  style: {
                    fontSize: 9,
                    color: '#111827',
                    flex: 1
                  }
                }),
                ui.Text({
                  text: '›',
                  style: {
                    fontSize: 12,
                    color: '#9CA3AF'
                  }
                })
              ]
            }),
            ui.Pressable({
              style: {
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: '🛡️',
                  style: {
                    fontSize: 12,
                    marginRight: 8
                  }
                }),
                ui.Text({
                  text: 'Security Center',
                  style: {
                    fontSize: 9,
                    color: '#111827',
                    flex: 1
                  }
                }),
                ui.Text({
                  text: '›',
                  style: {
                    fontSize: 12,
                    color: '#9CA3AF'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private getTransactions() {
    return [
      {
        description: 'Coffee Shop Purchase',
        date: 'Aug 27, 2025',
        amount: '-$4.50'
      },
      {
        description: 'Salary Deposit',
        date: 'Aug 26, 2025',
        amount: '+$2,500.00'
      },
      {
        description: 'Grocery Store',
        date: 'Aug 25, 2025',
        amount: '-$67.32'
      },
      {
        description: 'ATM Withdrawal',
        date: 'Aug 24, 2025',
        amount: '-$80.00'
      },
      {
        description: 'Online Transfer',
        date: 'Aug 23, 2025',
        amount: '-$200.00'
      }
    ];
  }
}

ui.UIComponent.register(BrowserApp);
