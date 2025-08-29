import * as ui from 'horizon/ui';

type NewsPage = 'main' | 'article';

interface Article {
  id: string;
  title: string;
  preview: string;
  publishedTime: string;
  category: string;
  borderColor: string;
  content: string;
}

class MeNews extends ui.UIComponent<typeof MeNews> {
  static propsDefinition = {};

  private currentPageBinding = new ui.Binding<NewsPage>('main');
  private currentPage: NewsPage = 'main';
  private selectedArticleBinding = new ui.Binding<string>('');
  private selectedArticle = '';

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
                this.renderNewsContent()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderNewsContent(): ui.UINode {
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
                      page !== 'main' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    ui.Pressable({
                      onPress: () => {
                        this.navigateToPage('main');
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
              text: 'MeNews',
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
                // Main News Page
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page === 'main' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    this.renderMainPage()
                  ]
                }),
                // Article Page
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page === 'article' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    this.renderArticlePage()
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private navigateToPage(page: NewsPage, articleId?: string): void {
    this.currentPage = page;
    this.currentPageBinding.set(page);
    
    if (page === 'article' && articleId) {
      this.selectedArticle = articleId;
      this.selectedArticleBinding.set(articleId);
    }
  }

  private renderMainPage(): ui.UINode {
    const articles = this.getArticles();
    
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#2563EB',
            borderWidth: 2,
            borderColor: '#1E40AF',
            borderRadius: 6,
            padding: 12,
            marginBottom: 12
          },
          children: [
            ui.Text({
              text: '📰 MeNews',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: 'Breaking News & Current Events',
              style: {
                fontSize: 10,
                color: '#BFDBFE'
              }
            })
          ]
        }),

        // Articles
        ui.View({
          children: articles.map(article => this.renderArticleItem(article))
        })
      ]
    });
  }

  private renderArticleItem(article: Article): ui.UINode {
    const borderColorMap: {[key: string]: string} = {
      'green': '#059669',
      'blue': '#2563EB',
      'red': '#DC2626',
      'purple': '#7C3AED',
      'orange': '#EA580C'
    };

    const textColorMap: {[key: string]: string} = {
      'green': '#065F46',
      'blue': '#1E40AF',
      'red': '#991B1B',
      'purple': '#5B21B6',
      'orange': '#C2410C'
    };

    const borderColor = borderColorMap[article.borderColor] || '#6B7280';
    const textColor = textColorMap[article.borderColor] || '#374151';

    return ui.Pressable({
      style: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: borderColor,
        borderRadius: 6,
        padding: 12,
        marginBottom: 8
      },
      onPress: () => {
        this.navigateToPage('article', article.id);
      },
      children: [
        ui.Text({
          text: article.title,
          style: {
            fontSize: 11,
            fontWeight: '600',
            color: textColor,
            marginBottom: 4
          }
        }),
        ui.Text({
          text: article.preview,
          style: {
            fontSize: 9,
            color: '#374151',
            marginBottom: 4
          }
        }),
        ui.Text({
          text: `Published ${article.publishedTime}`,
          style: {
            fontSize: 8,
            color: '#6B7280'
          }
        })
      ]
    });
  }

  private renderArticlePage(): ui.UINode {
    const articles = this.getArticles();
    const article = articles.find(a => a.id === this.selectedArticle);
    
    if (!article) {
      return ui.View({
        style: {
          backgroundColor: '#FFFFFF',
          borderWidth: 2,
          borderColor: '#DC2626',
          borderRadius: 6,
          padding: 12
        },
        children: [
          ui.Text({
            text: 'Article Not Found',
            style: {
              fontSize: 12,
              fontWeight: '600',
              color: '#991B1B',
              marginBottom: 4
            }
          }),
          ui.Text({
            text: 'The requested article could not be found.',
            style: {
              fontSize: 10,
              color: '#374151'
            }
          })
        ]
      });
    }

    return ui.View({
      style: {
        flex: 1
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#2563EB',
            borderWidth: 2,
            borderColor: '#1E40AF',
            borderRadius: 6,
            padding: 12,
            marginBottom: 12
          },
          children: [
            ui.Text({
              text: '📰 MeNews',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
                marginBottom: 2
              }
            }),
            ui.Text({
              text: 'Breaking News & Current Events',
              style: {
                fontSize: 10,
                color: '#BFDBFE'
              }
            })
          ]
        }),

        // Article Content
        ui.View({
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 2,
            borderColor: '#D1D5DB',
            borderRadius: 6,
            padding: 16
          },
          children: [
            // Article Title
            ui.Text({
              text: article.title,
              style: {
                fontSize: 14,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 8
              }
            }),
            
            // Article Meta
            ui.Text({
              text: `Published ${article.publishedTime} | ${article.category}`,
              style: {
                fontSize: 9,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 12
              }
            }),
            
            // Article Body
            ui.Text({
              text: 'Sock Street celebrated today as major sock indices closed at all-time highs, driven by better-than-expected cotton data and strong hosiery earnings reports.',
              style: {
                fontSize: 10,
                color: '#374151',
                marginBottom: 12,
                lineHeight: 16
              }
            }),
            
            // Market Performance Section
            ui.Text({
              text: 'Market Performance',
              style: {
                fontSize: 12,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 6
              }
            }),
            
            ui.Text({
              text: '• S&P Socks: Up 2.3% to 5,847 pairs\n• Toe Jones: Up 1.8% to 39,562 pairs\n• NASDAC: Up 3.1% to 18,439 pairs',
              style: {
                fontSize: 9,
                color: '#374151',
                marginBottom: 12,
                lineHeight: 14
              }
            }),
            
            ui.Text({
              text: 'The rally was led by athletic sock stocks, with moisture-wicking companies showing particularly strong gains. Nike Dri-FIT surged 8% following positive quarterly heel results.',
              style: {
                fontSize: 10,
                color: '#374151',
                marginBottom: 12,
                lineHeight: 16
              }
            }),
            
            // Economic Indicators Section
            ui.Text({
              text: 'Economic Indicators',
              style: {
                fontSize: 12,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 6
              }
            }),
            
            ui.Text({
              text: "Today's surge was fueled by several positive sock indicators:",
              style: {
                fontSize: 10,
                color: '#374151',
                marginBottom: 6,
                lineHeight: 16
              }
            }),
            
            ui.Text({
              text: '• Hole rate dropped to 3.2%\n• Yarn growth exceeded expectations at 3.8%\n• Consumer comfort index reached 115.8',
              style: {
                fontSize: 9,
                color: '#374151',
                marginBottom: 12,
                lineHeight: 14
              }
            }),
            
            ui.Text({
              text: 'Chief Market Strategist Jennifer Walsh commented: "We\'re seeing a perfect storm of positive factors aligning. The market is really putting its best foot forward!"',
              style: {
                fontSize: 10,
                color: '#374151',
                lineHeight: 16
              }
            })
          ]
        })
      ]
    });
  }

  private getArticles(): Article[] {
    return [
      {
        id: 'sock-market',
        title: 'Sock Market Hits Record High - Investors Go Toe-to-Toe!',
        preview: 'Major sock indices close at all-time highs amid positive wool data...',
        publishedTime: '4 hours ago',
        category: 'Business',
        borderColor: 'green',
        content: 'Full article content about sock market performance and analysis.'
      }
    ];
  }
}

ui.UIComponent.register(MeNews);
