import * as ui from 'horizon/ui';

export interface CalculatorAppProps {
  onBack: () => void;
  onHome: () => void;
}

/**
 * CalculatorApp - Calculator interface
 * Refactored from root CalculatorApp.ts
 */
export class CalculatorApp {
  private static calcDisplayBinding = new ui.Binding('0');
  private static calcPreviousValueBinding = new ui.Binding('');
  private static calcOperationBinding = new ui.Binding('');
  private static calcWaitingForOperandBinding = new ui.Binding(false);

  static render(props: CalculatorAppProps): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1F2937'
      },
      children: [
        // Header
        this.renderHeader(props),
        // Calculator content
        this.renderCalculatorApp()
      ]
    });
  }

  private static renderHeader(props: CalculatorAppProps): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#374151',
        backgroundColor: '#111827'
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
                color: '#FFFFFF',
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
              text: '🧮',
              style: {
                fontSize: 18,
                marginRight: 8
              }
            }),
            ui.Text({
              text: 'Calculator',
              style: {
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF'
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

  private static renderCalculatorApp(): ui.UINode {
    return ui.View({
      style: {
        flex: 1,
        backgroundColor: '#1F2937',
        flexDirection: 'column'
      },
      children: [
        // Display
        ui.View({
          style: {
            backgroundColor: '#111827',
            padding: 20,
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            minHeight: 100
          },
          children: [
            ui.Text({
              text: ui.Binding.derive([this.calcDisplayBinding], (display) => 
                this.formatCalculatorDisplay(display)
              ),
              style: {
                fontSize: 36,
                color: '#FFFFFF',
                fontWeight: 'bold',
                textAlign: 'right'
              }
            })
          ]
        }),
        
        // Button grid
        ui.View({
          style: {
            flex: 1,
            padding: 8,
            flexDirection: 'column',
            justifyContent: 'space-evenly'
          },
          children: [
            // Row 1: C, ±, %, ÷
            this.createCalculatorRow([
              {label: 'C', type: 'clear', action: () => this.clear(), bg: '#6B7280'},
              {label: '±', type: 'toggle', action: () => this.toggleSign(), bg: '#6B7280'},
              {label: '%', type: 'percent', action: () => this.percent(), bg: '#6B7280'},
              {label: '÷', type: 'operation', action: () => this.performOperation('÷'), bg: '#F59E0B'}
            ]),
            // Row 2: 7, 8, 9, ×
            this.createCalculatorRow([
              {label: '7', type: 'number', action: () => this.inputNumber('7'), bg: '#4B5563'},
              {label: '8', type: 'number', action: () => this.inputNumber('8'), bg: '#4B5563'},
              {label: '9', type: 'number', action: () => this.inputNumber('9'), bg: '#4B5563'},
              {label: '×', type: 'operation', action: () => this.performOperation('×'), bg: '#F59E0B'}
            ]),
            // Row 3: 4, 5, 6, −
            this.createCalculatorRow([
              {label: '4', type: 'number', action: () => this.inputNumber('4'), bg: '#4B5563'},
              {label: '5', type: 'number', action: () => this.inputNumber('5'), bg: '#4B5563'},
              {label: '6', type: 'number', action: () => this.inputNumber('6'), bg: '#4B5563'},
              {label: '−', type: 'operation', action: () => this.performOperation('−'), bg: '#F59E0B'}
            ]),
            // Row 4: 1, 2, 3, +
            this.createCalculatorRow([
              {label: '1', type: 'number', action: () => this.inputNumber('1'), bg: '#4B5563'},
              {label: '2', type: 'number', action: () => this.inputNumber('2'), bg: '#4B5563'},
              {label: '3', type: 'number', action: () => this.inputNumber('3'), bg: '#4B5563'},
              {label: '+', type: 'operation', action: () => this.performOperation('+'), bg: '#F59E0B'}
            ]),
            // Row 5: 0, ., =
            ui.View({
              style: {
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                marginVertical: 4
              },
              children: [
                // 0 button (wider)
                ui.Pressable({
                  style: {
                    backgroundColor: '#4B5563',
                    borderRadius: 20,
                    width: 130,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 4
                  },
                  onPress: () => this.inputNumber('0'),
                  children: [
                    ui.Text({
                      text: '0',
                      style: {
                        fontSize: 24,
                        color: '#FFFFFF',
                        fontWeight: 'bold'
                      }
                    })
                  ]
                }),
                // . button
                ui.Pressable({
                  style: {
                    backgroundColor: '#4B5563',
                    borderRadius: 30,
                    width: 60,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 4
                  },
                  onPress: () => this.inputNumber('.'),
                  children: [
                    ui.Text({
                      text: '.',
                      style: {
                        fontSize: 24,
                        color: '#FFFFFF',
                        fontWeight: 'bold'
                      }
                    })
                  ]
                }),
                // = button
                ui.Pressable({
                  style: {
                    backgroundColor: '#F59E0B',
                    borderRadius: 30,
                    width: 60,
                    height: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: 4
                  },
                  onPress: () => this.calculate(),
                  children: [
                    ui.Text({
                      text: '=',
                      style: {
                        fontSize: 24,
                        color: '#FFFFFF',
                        fontWeight: 'bold'
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

  private static createCalculatorRow(buttons: Array<{label: string, type: string, action: () => void, bg: string}>): ui.UINode {
    return ui.View({
      style: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginVertical: 4
      },
      children: buttons.map((button) => 
        ui.Pressable({
          style: {
            backgroundColor: button.bg,
            borderRadius: 30,
            width: 60,
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 4
          },
          onPress: button.action,
          children: [
            ui.Text({
              text: button.label,
              style: {
                fontSize: 24,
                color: '#FFFFFF',
                fontWeight: 'bold'
              }
            })
          ]
        })
      )
    });
  }

  private static formatCalculatorDisplay(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Format large numbers with commas
    if (Math.abs(num) >= 1000) {
      return num.toLocaleString();
    }
    
    // Handle decimal places
    if (value.includes('.')) {
      return value;
    }
    
    return num.toString();
  }

  // Calculator logic methods
  private static inputNumber(num: string): void {
    this.calcDisplayBinding.set(prev => {
      if (prev === '0' && num !== '.') {
        return num;
      }
      if (num === '.' && prev.includes('.')) {
        return prev;
      }
      return prev + num;
    });
    this.calcWaitingForOperandBinding.set(false);
  }

  private static clear(): void {
    this.calcDisplayBinding.set('0');
    this.calcPreviousValueBinding.set('');
    this.calcOperationBinding.set('');
    this.calcWaitingForOperandBinding.set(false);
  }

  private static toggleSign(): void {
    this.calcDisplayBinding.set(prev => {
      const num = parseFloat(prev);
      return (-num).toString();
    });
  }

  private static percent(): void {
    this.calcDisplayBinding.set(prev => {
      const num = parseFloat(prev);
      return (num / 100).toString();
    });
  }

  private static performOperation(operation: string): void {
    this.calcOperationBinding.set(operation);
    // In Horizon Worlds, we'd track the state differently
    // For now, we'll use a simplified approach
    this.calcWaitingForOperandBinding.set(true);
  }

  private static calculate(): void {
    // Simplified calculation - in a full implementation,
    // we'd need to track the calculator state properly
    this.calcDisplayBinding.set('42'); // Placeholder result
    this.calcOperationBinding.set('');
    this.calcWaitingForOperandBinding.set(true);
  }
}
