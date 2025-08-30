import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

type ShopPage = 'main' | 'product' | 'checkout';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  inStock: boolean;
  category: string;
}

class MeShop extends ui.UIComponent<typeof MeShop> {
  static propsDefinition = {};

  private currentPageBinding = new ui.Binding<ShopPage>('main');
  private currentPage: ShopPage = 'main';
  private selectedProductBinding = new ui.Binding<string>('');
  private selectedProduct = '';
  private cartItemsBinding = new ui.Binding<{[key: string]: number}>({});
  private cartItems: {[key: string]: number} = {};

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
                this.renderShopContent()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderShopContent(): ui.UINode {
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
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 16,
                    height: 16,
                    tintColor: '#9CA3AF',
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
              text: 'MeShop',
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
            backgroundColor: '#FFF7ED'
          },
          children: [
            ui.View({
              style: {
                padding: 12,
                paddingTop: 16
              },
              children: [
                // Main Store Page
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
                // Product Page
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page === 'product' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    this.renderProductPage()
                  ]
                }),
                // Checkout Page
                ui.View({
                  style: {
                    display: ui.Binding.derive([this.currentPageBinding], (page) => 
                      page === 'checkout' ? 'flex' : 'none'
                    )
                  },
                  children: [
                    this.renderCheckoutPage()
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private navigateToPage(page: ShopPage, productId?: string): void {
    this.currentPage = page;
    this.currentPageBinding.set(page);
    
    if (page === 'product' && productId) {
      this.selectedProduct = productId;
      this.selectedProductBinding.set(productId);
    }
  }

  private addToCart(productId: string): void {
    const newCartItems = { ...this.cartItems };
    newCartItems[productId] = (newCartItems[productId] || 0) + 1;
    this.cartItems = newCartItems;
    this.cartItemsBinding.set(newCartItems);
  }

  private updateQuantity(productId: string, quantity: number): void {
    const newCartItems = { ...this.cartItems };
    if (quantity <= 0) {
      delete newCartItems[productId];
    } else {
      newCartItems[productId] = quantity;
    }
    this.cartItems = newCartItems;
    this.cartItemsBinding.set(newCartItems);
  }

  private removeFromCart(productId: string): void {
    const newCartItems = { ...this.cartItems };
    delete newCartItems[productId];
    this.cartItems = newCartItems;
    this.cartItemsBinding.set(newCartItems);
  }

  private getCartItemCount(): number {
    return Object.values(this.cartItems).reduce((sum, count) => sum + count, 0);
  }

  private getTotal(): number {
    const products = this.getProducts();
    return Object.entries(this.cartItems).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  }

  private renderMainPage(): ui.UINode {
    const products = this.getProducts();
    
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#EA580C',
            borderWidth: 2,
            borderColor: '#C2410C',
            borderRadius: 6,
            padding: 12,
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          },
          children: [
            ui.View({
              children: [
                ui.Text({
                  text: '🛒 MeShop',
                  style: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    marginBottom: 2
                  }
                }),
                ui.Text({
                  text: 'Online Shopping Store',
                  style: {
                    fontSize: 10,
                    color: '#FED7AA'
                  }
                })
              ]
            }),
            ui.Pressable({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#FFFFFF',
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 4
              },
              onPress: () => {
                this.navigateToPage('checkout');
              },
              children: [
                ui.Text({
                  text: ui.Binding.derive([this.cartItemsBinding], (items) => 
                    `CART (${Object.values(items).reduce((sum, count) => sum + count, 0)})`
                  ),
                  style: {
                    fontSize: 8,
                    fontWeight: '600',
                    color: '#EA580C'
                  }
                })
              ]
            })
          ]
        }),

        // Products
        ui.View({
          children: products.map(product => this.renderProductItem(product))
        })
      ]
    });
  }

  private renderProductItem(product: Product): ui.UINode {
    return ui.View({
      style: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#EA580C',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8
      },
      children: [
        ui.Pressable({
          onPress: () => {
            this.navigateToPage('product', product.id);
          },
          children: [
            ui.Text({
              text: product.name,
              style: {
                fontSize: 11,
                fontWeight: '600',
                color: '#C2410C',
                marginBottom: 4
              }
            }),
            ui.Text({
              text: product.description,
              style: {
                fontSize: 9,
                color: '#374151',
                marginBottom: 4
              }
            }),
            ui.Text({
              text: `$${Math.round(product.price)}`,
              style: {
                fontSize: 12,
                fontWeight: '700',
                color: '#059669',
                marginBottom: 6
              }
            })
          ]
        }),
        
        ui.Pressable({
          style: {
            backgroundColor: product.inStock ? '#DCFCE7' : '#F3F4F6',
            borderWidth: 2,
            borderColor: product.inStock ? '#059669' : '#9CA3AF',
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 4
          },
          onPress: () => {
            if (product.inStock) {
              this.addToCart(product.id);
            }
          },
          children: [
            ui.Text({
              text: product.inStock ? 'ADD TO CART' : 'OUT OF STOCK',
              style: {
                fontSize: 9,
                fontWeight: '600',
                color: product.inStock ? '#065F46' : '#6B7280',
                textAlign: 'center'
              }
            })
          ]
        })
      ]
    });
  }

  private renderProductPage(): ui.UINode {
    const products = this.getProducts();
    const product = products.find(p => p.id === this.selectedProduct);
    
    if (!product) {
      return ui.Text({
        text: 'Product not found',
        style: {
          fontSize: 12,
          color: '#6B7280',
          textAlign: 'center',
          padding: 20
        }
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
            backgroundColor: '#EA580C',
            borderWidth: 2,
            borderColor: '#C2410C',
            borderRadius: 6,
            padding: 12,
            marginBottom: 8
          },
          children: [
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 6
              },
              children: [
                ui.View({
                  style: {
                    flex: 1,
                    marginRight: 8
                  },
                  children: [
                    ui.Text({
                      text: product.name,
                      style: {
                        fontSize: 13,
                        fontWeight: '600',
                        color: '#FFFFFF',
                        marginBottom: 2
                      }
                    }),
                    ui.Text({
                      text: `Category: ${product.category}`,
                      style: {
                        fontSize: 9,
                        color: '#FED7AA'
                      }
                    })
                  ]
                }),
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 3
                  },
                  onPress: () => {
                    this.navigateToPage('checkout');
                  },
                  children: [
                    ui.Text({
                      text: ui.Binding.derive([this.cartItemsBinding], (items) => 
                        `CART (${Object.values(items).reduce((sum, count) => sum + count, 0)})`
                      ),
                      style: {
                        fontSize: 7,
                        fontWeight: '600',
                        color: '#EA580C'
                      }
                    })
                  ]
                })
              ]
            })
          ]
        }),

        // Product Info
        ui.View({
          children: [
            // Price
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
                  text: 'PRICE:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#065F46',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: `$${Math.round(product.price)}`,
                  style: {
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#059669'
                  }
                })
              ]
            }),

            // Description
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
                  text: 'DESCRIPTION:',
                  style: {
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#1E40AF',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: product.description,
                  style: {
                    fontSize: 9,
                    color: '#374151'
                  }
                })
              ]
            }),

            // Add to Cart
            ui.Pressable({
              style: {
                backgroundColor: product.inStock ? '#DCFCE7' : '#F3F4F6',
                borderWidth: 2,
                borderColor: product.inStock ? '#059669' : '#9CA3AF',
                borderRadius: 6,
                padding: 12
              },
              onPress: () => {
                if (product.inStock) {
                  this.addToCart(product.id);
                }
              },
              children: [
                ui.Text({
                  text: product.inStock ? 'ADD TO CART' : 'OUT OF STOCK',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: product.inStock ? '#065F46' : '#6B7280',
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

  private renderCheckoutPage(): ui.UINode {
    const products = this.getProducts();
    const cartEntries = Object.entries(this.cartItems);
    
    return ui.View({
      style: {
        flex: 1
      },
      children: [
        // Header
        ui.View({
          style: {
            backgroundColor: '#EA580C',
            borderWidth: 2,
            borderColor: '#C2410C',
            borderRadius: 6,
            padding: 12,
            marginBottom: 12
          },
          children: [
            ui.Text({
              text: '🛒 Shopping Cart',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF'
              }
            })
          ]
        }),

        // Cart Content
        ui.View({
          children: cartEntries.length === 0 ? [
            // Empty Cart
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#6B7280',
                borderRadius: 6,
                padding: 24,
                alignItems: 'center'
              },
              children: [
                ui.Text({
                  text: 'Your cart is empty',
                  style: {
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: 4
                  }
                }),
                ui.Text({
                  text: 'Add some products to get started!',
                  style: {
                    fontSize: 10,
                    color: '#6B7280'
                  }
                })
              ]
            })
          ] : [
            // Cart Items
            ui.View({
              style: {
                marginBottom: 12
              },
              children: cartEntries.map(([productId, quantity]) => 
                this.renderCartItem(productId, quantity, products)
              )
            }),

            // Order Summary
            ui.View({
              style: {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#059669',
                borderRadius: 6,
                padding: 12,
                marginBottom: 12
              },
              children: [
                ui.View({
                  style: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  },
                  children: [
                    ui.Text({
                      text: 'Total:',
                      style: {
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#065F46'
                      }
                    }),
                    ui.Text({
                      text: ui.Binding.derive([this.cartItemsBinding], (items) => {
                        const total = Object.entries(items).reduce((sum, [productId, quantity]) => {
                          const product = products.find(p => p.id === productId);
                          return sum + (product ? product.price * quantity : 0);
                        }, 0);
                        return `$${Math.round(total)}`;
                      }),
                      style: {
                        fontSize: 12,
                        fontWeight: '700',
                        color: '#059669'
                      }
                    })
                  ]
                })
              ]
            }),

            // Checkout Button
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
                  text: 'PROCEED TO CHECKOUT',
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

  private renderCartItem(productId: string, quantity: number, products: Product[]): ui.UINode {
    const product = products.find(p => p.id === productId);
    if (!product) return ui.View({});

    return ui.View({
      style: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#EA580C',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8
      },
      children: [
        ui.View({
          style: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4
          },
          children: [
            ui.Text({
              text: product.name,
              style: {
                fontSize: 11,
                fontWeight: '600',
                color: '#C2410C',
                flex: 1
              }
            }),
            ui.Pressable({
              style: {
                backgroundColor: '#FEE2E2',
                borderWidth: 1,
                borderColor: '#DC2626',
                borderRadius: 3,
                paddingHorizontal: 4,
                paddingVertical: 2
              },
              onPress: () => {
                this.removeFromCart(productId);
              },
              children: [
                ui.Text({
                  text: 'REMOVE',
                  style: {
                    fontSize: 7,
                    fontWeight: '600',
                    color: '#DC2626'
                  }
                })
              ]
            })
          ]
        }),
        ui.Text({
          text: `$${Math.round(product.price)} each`,
          style: {
            fontSize: 9,
            color: '#374151',
            marginBottom: 6
          }
        }),
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center'
          },
          children: [
            ui.Pressable({
              style: {
                backgroundColor: '#F3F4F6',
                borderWidth: 2,
                borderColor: '#6B7280',
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginRight: 6
              },
              onPress: () => {
                this.updateQuantity(productId, quantity - 1);
              },
              children: [
                ui.Text({
                  text: '-',
                  style: {
                    fontSize: 9,
                    fontWeight: '600',
                    color: '#374151'
                  }
                })
              ]
            }),
            ui.Text({
              text: `Qty: ${quantity}`,
              style: {
                fontSize: 9,
                fontWeight: '600',
                color: '#374151',
                marginRight: 6
              }
            }),
            ui.Pressable({
              style: {
                backgroundColor: '#F3F4F6',
                borderWidth: 2,
                borderColor: '#6B7280',
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 2
              },
              onPress: () => {
                this.updateQuantity(productId, quantity + 1);
              },
              children: [
                ui.Text({
                  text: '+',
                  style: {
                    fontSize: 9,
                    fontWeight: '600',
                    color: '#374151'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private getProducts(): Product[] {
    return [
      {
        id: 'quest-3',
        name: 'Meta Quest 3',
        price: 499,
        originalPrice: 549,
        rating: 4.8,
        reviews: 2847,
        description: 'Immersive mixed reality headset with breakthrough technology for gaming and productivity.',
        features: ['Mixed Reality', '4K+ Display', 'Touch Plus Controllers', '128GB Storage', 'Wireless'],
        inStock: true,
        category: 'VR/AR'
      }
    ];
  }
}

ui.UIComponent.register(MeShop);
