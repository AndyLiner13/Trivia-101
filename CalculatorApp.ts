import * as ui from 'horizon/ui';
import * as hz from 'horizon/core';

export class CalculatorApp {
  // Calculator app state bindings
  private calcDisplayBinding = new ui.Binding('0');
  private calcPreviousValueBinding = new ui.Binding('');
  private calcOperationBinding = new ui.Binding('');
  private calcWaitingForOperandBinding = new ui.Binding(false);

  // Internal calculator state tracking
  private calcDisplay = '0';
  private calcPreviousValue = '';
  private calcOperation = '';
  private calcWaitingForOperand = false;

  // Callback for navigation
  private onHomePress: () => void;

  constructor(onHomePress: () => void) {
    this.onHomePress = onHomePress;
  }

  // Calculator display formatting utility
  private formatCalculatorDisplay(value: string): string {
    if (value.length > 12) {
      const num = parseFloat(value);
      if (num > 999999999999) {
        return num.toExponential(5);
      }
      return num.toFixed(8).replace(/\.?0+$/, '');
    }
    return value;
  }

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
        height: 36, // Fixed height, smaller than before
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10
      },
      children: [
        // Left side - Back button (conditionally rendered)
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1
          },
          children: [
            props.showBackButton ? ui.Pressable({
              style: {
                padding: 4,
                borderRadius: 6,
                marginRight: 8
              },
              onPress: props.onBackPress || (() => {}),
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1083116303985907"))),
                  style: {
                    width: 12,
                    height: 12,
                    tintColor: '#6B7280'
                  }
                })
              ]
            }) : ui.View({}),
          ]
        }),

        // Center - App name
        ui.View({
          style: {
            flex: 2,
            alignItems: 'center'
          },
          children: [
            ui.Text({
              text: props.appName,
              style: {
                fontSize: 11,
                fontWeight: '600',
                color: '#374151',
                textAlign: 'center'
              }
            })
          ]
        }),

        // Right side - Home button and optional right element
        ui.View({
          style: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: 1
          },
          children: [
            props.rightElement || ui.View({}),
            ui.Pressable({
              style: {
                backgroundColor: '#E5E7EB',
                borderRadius: 10,
                width: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 6
              },
              onPress: props.onHomePress,
              children: [
                ui.Image({
                  source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("1942937076558477"))),
                  style: {
                    width: 8,
                    height: 8,
                    tintColor: '#6B7280'
                  }
                })
              ]
            })
          ]
        })
      ]
    });
  }

  render(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6', // gray-100
        flexDirection: 'column'
      },
      children: [
        // Header - standardized
        this.createAppHeader({
          appName: 'Calculator',
          onHomePress: () => {
            this.onHomePress();
            // Reset calculator state
            this.calcClear();
          }
        }),
        
        // Display
        ui.View({
          style: {
            backgroundColor: '#000000',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginTop: 36, // Account for header
            minHeight: 60
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.calcDisplayBinding], (display) => 
                this.formatCalculatorDisplay(display)
              ),
              style: {
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: '300',
                textAlign: 'right'
              }
            })
          ]
        }),
        
        // Button Grid
        ui.View({
          style: {
            flex: 1,
            padding: 6,
            flexDirection: 'column',
            justifyContent: 'space-evenly'
          },
          children: [
            // Row 1: C, ±, ⌫, ÷
            this.createCalculatorRow([
              { label: 'C', type: 'function', action: () => this.calcClear(), bg: '#d1d5dc' },
              { label: '±', type: 'function', action: () => this.calcToggleSign(), bg: '#d1d5dc' },
              { label: '⌫', type: 'function', action: () => this.calcDeleteDigit(), bg: '#d1d5dc' },
              { label: '÷', type: 'operation', action: () => this.calcInputOperation('÷'), bg: '#F97316' }
            ]),
            // Row 2: 7, 8, 9, ×
            this.createCalculatorRow([
              { label: '7', type: 'number', action: () => this.calcInputNumber('7'), bg: '#FFFFFF' },
              { label: '8', type: 'number', action: () => this.calcInputNumber('8'), bg: '#FFFFFF' },
              { label: '9', type: 'number', action: () => this.calcInputNumber('9'), bg: '#FFFFFF' },
              { label: '×', type: 'operation', action: () => this.calcInputOperation('×'), bg: '#F97316' }
            ]),
            // Row 3: 4, 5, 6, -
            this.createCalculatorRow([
              { label: '4', type: 'number', action: () => this.calcInputNumber('4'), bg: '#FFFFFF' },
              { label: '5', type: 'number', action: () => this.calcInputNumber('5'), bg: '#FFFFFF' },
              { label: '6', type: 'number', action: () => this.calcInputNumber('6'), bg: '#FFFFFF' },
              { label: '-', type: 'operation', action: () => this.calcInputOperation('-'), bg: '#F97316' }
            ]),
            // Row 4: 1, 2, 3, +
            this.createCalculatorRow([
              { label: '1', type: 'number', action: () => this.calcInputNumber('1'), bg: '#FFFFFF' },
              { label: '2', type: 'number', action: () => this.calcInputNumber('2'), bg: '#FFFFFF' },
              { label: '3', type: 'number', action: () => this.calcInputNumber('3'), bg: '#FFFFFF' },
              { label: '+', type: 'operation', action: () => this.calcInputOperation('+'), bg: '#F97316' }
            ]),
            // Row 5: 0 (wide), ., =
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 0,
                marginVertical: 3
              },
              children: [
                // 0 button (double width)
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    flex: 2,
                    marginHorizontal: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcInputNumber('0'),
                  children: [
                    ui.Text({
                      text: '0',
                      style: {
                        fontSize: 22,
                        color: '#374151',
                        fontWeight: '400'
                      }
                    })
                  ]
                }),
                // . button
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    flex: 1,
                    marginHorizontal: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcInputDecimal(),
                  children: [
                    ui.Text({
                      text: '.',
                      style: {
                        fontSize: 22,
                        color: '#374151',
                        fontWeight: '400'
                      }
                    })
                  ]
                }),
                // = button
                ui.Pressable({
                  style: {
                    backgroundColor: '#F97316',
                    borderRadius: 8,
                    flex: 1,
                    marginHorizontal: 3,
                    minHeight: 46,
                    justifyContent: 'center',
                    alignItems: 'center'
                  },
                  onPress: () => this.calcPerformCalculation(),
                  children: [
                    ui.Text({
                      text: '=',
                      style: {
                        fontSize: 22,
                        color: '#FFFFFF',
                        fontWeight: '400'
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

  private createCalculatorRow(buttons: Array<{label: string, type: string, action: () => void, bg: string}>): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
        marginVertical: 3
      },
      children: buttons.map(button => 
        ui.Pressable({
          style: {
            backgroundColor: button.bg,
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 3,
            minHeight: 46,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: button.action,
          children: [
            button.label === '⌫' ? 
              ui.Image({
                source: ui.ImageSource.fromTextureAsset(new hz.TextureAsset(BigInt("645495034835211"))),
                style: {
                  width: 22,
                  height: 22,
                  tintColor: button.bg === '#FFFFFF' ? '#374151' : '#FFFFFF'
                }
              }) :
              ui.Text({
                text: button.label,
                style: {
                  fontSize: button.label === '-' ? 28 : 22, // Make minus symbol bigger
                  color: button.bg === '#FFFFFF' ? '#374151' : '#FFFFFF',
                  fontWeight: '400'
                }
              })
          ]
        })
      )
    });
  }

  // Calculator logic methods
  private calcInputNumber(num: string): void {
    if (this.calcWaitingForOperand) {
      this.calcDisplay = num;
      this.calcWaitingForOperand = false;
    } else {
      this.calcDisplay = this.calcDisplay === '0' ? num : this.calcDisplay + num;
    }
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcInputOperation(nextOperation: string): void {
    const inputValue = parseFloat(this.calcDisplay);

    if (this.calcPreviousValue === '') {
      this.calcPreviousValue = this.calcDisplay;
    } else if (this.calcOperation) {
      const currentValue = this.calcPreviousValue || '0';
      const newValue = this.calcCalculate(parseFloat(currentValue), inputValue, this.calcOperation);
      
      this.calcDisplay = String(newValue);
      this.calcPreviousValue = String(newValue);
      this.calcDisplayBinding.set(this.calcDisplay);
    }

    this.calcWaitingForOperand = true;
    this.calcOperation = nextOperation;
    this.calcPreviousValueBinding.set(this.calcPreviousValue);
    this.calcOperationBinding.set(this.calcOperation);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcCalculate(firstOperand: number, secondOperand: number, operation: string): number {
    switch (operation) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '×':
        return firstOperand * secondOperand;
      case '÷':
        return secondOperand !== 0 ? firstOperand / secondOperand : 0;
      default:
        return secondOperand;
    }
  }

  private calcPerformCalculation(): void {
    if (this.calcPreviousValue && this.calcOperation) {
      const inputValue = parseFloat(this.calcDisplay);
      const currentValue = parseFloat(this.calcPreviousValue);
      const newValue = this.calcCalculate(currentValue, inputValue, this.calcOperation);

      this.calcDisplay = String(newValue);
      this.calcPreviousValue = '';
      this.calcOperation = '';
      this.calcWaitingForOperand = true;
      
      this.calcDisplayBinding.set(this.calcDisplay);
      this.calcPreviousValueBinding.set(this.calcPreviousValue);
      this.calcOperationBinding.set(this.calcOperation);
      this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
    }
  }

  private calcClear(): void {
    this.calcDisplay = '0';
    this.calcPreviousValue = '';
    this.calcOperation = '';
    this.calcWaitingForOperand = false;
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcPreviousValueBinding.set(this.calcPreviousValue);
    this.calcOperationBinding.set(this.calcOperation);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcClearEntry(): void {
    this.calcDisplay = '0';
    this.calcWaitingForOperand = false;
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcToggleSign(): void {
    if (this.calcDisplay !== '0') {
      if (this.calcDisplay.startsWith('-')) {
        this.calcDisplay = this.calcDisplay.slice(1);
      } else {
        this.calcDisplay = '-' + this.calcDisplay;
      }
      this.calcDisplayBinding.set(this.calcDisplay);
    }
  }

  private calcInputDecimal(): void {
    if (this.calcWaitingForOperand) {
      this.calcDisplay = '0.';
      this.calcWaitingForOperand = false;
    } else if (this.calcDisplay.indexOf('.') === -1) {
      this.calcDisplay = this.calcDisplay + '.';
    }
    
    this.calcDisplayBinding.set(this.calcDisplay);
    this.calcWaitingForOperandBinding.set(this.calcWaitingForOperand);
  }

  private calcDeleteDigit(): void {
    if (this.calcDisplay.length > 1 && this.calcDisplay !== '0') {
      this.calcDisplay = this.calcDisplay.slice(0, -1);
    } else {
      this.calcDisplay = '0';
    }
    
    this.calcDisplayBinding.set(this.calcDisplay);
  }
}
