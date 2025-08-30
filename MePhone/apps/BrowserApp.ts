import * as ui from 'horizon/ui';

export interface BrowserAppProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * BrowserApp - Web browser interface with integrated MeBank, MeShop, MeNews
 * Refactored from root BrowserApp.ts
 */
export class BrowserApp {
  private static currentUrlBinding = new ui.Binding<string>('search');
  private static historyBinding = new ui.Binding<string[]>([]);

  static render(props: BrowserAppProps): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF'
      },
      children: [
        // Header
        this.renderHeader(props),
        // Browser content
        this.renderBrowserContent()
      ]
    });
  }

  private static renderHeader(props: BrowserAppProps): ui.UINode {
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
          onPress: props.onBack,
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
              text: '🌐',
              style: {
                fontSize: 18,
                marginRight: 8
              }
            }),
            ui.Text({
              text: 'Browser',
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

  private static renderBrowserContent(): ui.UINode {
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        // Address bar
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: '#F9FAFB',
            borderBottomWidth: 1,
            borderColor: '#E5E7EB'
          },
          children: [
            // Back button
            ui.Pressable({
              style: {
                padding: 8,
                marginRight: 8,
                borderRadius: 4,
                backgroundColor: '#E5E7EB'
              },
              onPress: () => this.navigateBack(),
              children: [
                ui.Text({
                  text: '←',
                  style: {
                    fontSize: 14,
                    color: '#6B7280'
                  }
                })
              ]
            }),
            // Address bar
            ui.View({
              style: {
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                padding: 8,
                borderWidth: 1,
                borderColor: '#D1D5DB'
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.currentUrlBinding], (url) => 
                    this.getDisplayUrl(url)
                  ),
                  style: {
                    fontSize: 14,
                    color: '#374151'
                  }
                })
              ]
            })
          ]
        }),
        
        // Content area
        ui.View({
          style: {
            flex: 1
          },
          children: [
            // Search page
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                display: ui.Binding.derive([this.currentUrlBinding], (url) => 
                  url === 'search' ? 'flex' : 'none'
                )
              },
              children: [this.renderSearchPage()]
            }),
            // MeBank page
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                display: ui.Binding.derive([this.currentUrlBinding], (url) => 
                  url === 'mebank.com' ? 'flex' : 'none'
                )
              },
              children: [this.renderMeBank()]
            }),
            // MeShop page
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                display: ui.Binding.derive([this.currentUrlBinding], (url) => 
                  url === 'meshop.com' ? 'flex' : 'none'
                )
              },
              children: [this.renderMeShop()]
            }),
            // MeNews page
            ui.View({
              style: {
                width: '100%',
                height: '100%',
                display: ui.Binding.derive([this.currentUrlBinding], (url) => 
                  url === 'menews.com' ? 'flex' : 'none'
                )
              },
              children: [this.renderMeNews()]
            })
          ]
        })
      ]
    });
  }

  private static renderSearchPage(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        padding: 20,
        alignItems: 'center'
      },
      children: [
        // Search logo/title
        ui.View({
          style: {
            alignItems: 'center',
            marginTop: 40,
            marginBottom: 40
          },
          children: [
            ui.Text({
              text: '🔍',
              style: {
                fontSize: 48,
                marginBottom: 16
              }
            }),
            ui.Text({
              text: 'MeSearch',
              style: {
                fontSize: 28,
                fontWeight: 'bold',
                color: '#1F2937'
              }
            })
          ]
        }),
        
        // Search input
        ui.View({
          style: {
            width: '100%',
            backgroundColor: '#F3F4F6',
            borderRadius: 25,
            padding: 12,
            marginBottom: 30,
            borderWidth: 1,
            borderColor: '#D1D5DB'
          },
          children: [
            ui.Text({
              text: '🔍 Search the web...',
              style: {
                fontSize: 16,
                color: '#9CA3AF'
              }
            })
          ]
        }),
        
        // Quick links
        ui.View({
          style: {
            width: '100%'
          },
          children: [
            ui.Text({
              text: 'Quick Links',
              style: {
                fontSize: 18,
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: 16
              }
            }),
            
            // Website shortcuts
            this.renderWebsiteShortcut('🏦', 'MeBank', 'Your trusted banking partner', 'mebank.com'),
            this.renderWebsiteShortcut('🛍️', 'MeShop', 'Shop the latest trends', 'meshop.com'),
            this.renderWebsiteShortcut('📰', 'MeNews', 'Stay informed with latest news', 'menews.com')
          ]
        })
      ]
    });
  }

  private static renderWebsiteShortcut(icon: string, title: string, description: string, url: string): ui.UINode {
    return ui.Pressable({
      style: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
      },
      onPress: () => this.navigate(url),
      children: [
        ui.View({
          style: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#F3F4F6',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12
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
        ui.View({
          style: {
            flex: 1
          },
          children: [
            ui.Text({
              text: title,
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: description,
              style: {
                fontSize: 14,
                color: '#6B7280'
              }
            })
          ]
        }),
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

  private static renderMeBank(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        backgroundColor: '#F8FAFC'
      },
      children: [
        // Bank header
        ui.View({
          style: {
            backgroundColor: '#059669',
            padding: 20,
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: '🏦 MeBank',
              style: {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 8
              }
            }),
            ui.Text({
              text: 'Your trusted banking partner',
              style: {
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.8)'
              }
            })
          ]
        }),
        
        // Account summary
        ui.View({
          style: {
            padding: 20
          },
          children: [
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#000000',
                shadowOffset: [0, 2],
                shadowOpacity: 0.1,
                shadowRadius: 4
              },
              children: [
                ui.Text({
                  text: 'Account Balance',
                  style: {
                    fontSize: 14,
                    color: '#6B7280',
                    marginBottom: 8
                  }
                }),
                ui.Text({
                  text: '$12,345.67',
                  style: {
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: '#059669'
                  }
                })
              ]
            }),
            
            // Quick actions
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between'
              },
              children: [
                this.renderBankAction('💸', 'Transfer'),
                this.renderBankAction('💰', 'Deposit'),
                this.renderBankAction('📊', 'History')
              ]
            })
          ]
        })
      ]
    });
  }

  private static renderBankAction(icon: string, label: string): ui.UINode {
    return ui.Pressable({
      style: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        flex: 1,
        marginHorizontal: 4
      },
      onPress: () => {},
      children: [
        ui.Text({
          text: icon,
          style: {
            fontSize: 24,
            marginBottom: 8
          }
        }),
        ui.Text({
          text: label,
          style: {
            fontSize: 12,
            color: '#6B7280'
          }
        })
      ]
    });
  }

  private static renderMeShop(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        backgroundColor: '#FEFEFE'
      },
      children: [
        // Shop header
        ui.View({
          style: {
            backgroundColor: '#EC4899',
            padding: 20,
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: '🛍️ MeShop',
              style: {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 8
              }
            }),
            ui.Text({
              text: 'Shop the latest trends',
              style: {
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.8)'
              }
            })
          ]
        }),
        
        // Featured products
        ui.View({
          style: {
            padding: 16
          },
          children: [
            ui.Text({
              text: 'Featured Products',
              style: {
                fontSize: 18,
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: 16
              }
            }),
            
            // Product grid placeholder
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between'
              },
              children: [
                this.renderProductItem('👔', 'Shirt', '$29.99'),
                this.renderProductItem('👟', 'Shoes', '$79.99')
              ]
            })
          ]
        })
      ]
    });
  }

  private static renderProductItem(icon: string, name: string, price: string): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        flex: 1,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
      },
      children: [
        ui.Text({
          text: icon,
          style: {
            fontSize: 32,
            marginBottom: 8
          }
        }),
        ui.Text({
          text: name,
          style: {
            fontSize: 14,
            fontWeight: '600',
            color: '#1F2937',
            marginBottom: 4
          }
        }),
        ui.Text({
          text: price,
          style: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#EC4899'
          }
        })
      ]
    });
  }

  private static renderMeNews(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        backgroundColor: '#FFFFFF'
      },
      children: [
        // News header
        ui.View({
          style: {
            backgroundColor: '#DC2626',
            padding: 20,
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: '📰 MeNews',
              style: {
                fontSize: 24,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 8
              }
            }),
            ui.Text({
              text: 'Stay informed with latest news',
              style: {
                fontSize: 14,
                color: 'rgba(255, 255, 255, 0.8)'
              }
            })
          ]
        }),
        
        // News articles
        ui.View({
          style: {
            padding: 16
          },
          children: [
            this.renderNewsItem('🌍', 'World News', 'Breaking: Major developments in technology...'),
            this.renderNewsItem('💼', 'Business', 'Market update: Stocks reach new highs...'),
            this.renderNewsItem('⚽', 'Sports', 'Championship finals this weekend...')
          ]
        })
      ]
    });
  }

  private static renderNewsItem(icon: string, category: string, headline: string): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderColor: '#DC2626'
      },
      children: [
        ui.Text({
          text: icon,
          style: {
            fontSize: 24,
            marginRight: 12
          }
        }),
        ui.View({
          style: {
            flex: 1
          },
          children: [
            ui.Text({
              text: category,
              style: {
                fontSize: 12,
                color: '#DC2626',
                fontWeight: '600',
                marginBottom: 4
              }
            }),
            ui.Text({
              text: headline,
              style: {
                fontSize: 14,
                color: '#1F2937'
              }
            })
          ]
        })
      ]
    });
  }

  private static getDisplayUrl(url: string): string {
    switch (url) {
      case 'search': return 'mesearch.com';
      case 'mebank.com': return 'mebank.com';
      case 'meshop.com': return 'meshop.com';
      case 'menews.com': return 'menews.com';
      default: return url;
    }
  }

  private static navigate(url: string): void {
    this.currentUrlBinding.set(url);
  }

  private static navigateBack(): void {
    this.currentUrlBinding.set('search');
  }
}
