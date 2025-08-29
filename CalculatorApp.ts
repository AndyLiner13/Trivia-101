import * as hz from 'horizon/core';
import * as ui from 'horizon/ui';

class CalculatorApp extends ui.UIComponent<typeof CalculatorApp> {
  static propsDefinition = {};
  
  private calcDisplayBinding = new ui.Binding('0');
  private calcPreviousValueBinding = new ui.Binding('');
  private calcOperationBinding = new ui.Binding('');
  private calcWaitingForOperandBinding = new ui.Binding(false);

  // Internal state tracking
  private calcDisplay = '0';
  private calcPreviousValue = '';
  private calcOperation = '';
  private calcWaitingForOperand = false;

  initializeUI(): ui.UINode {
    return this.renderPhoneFrame();
  }

  start() {
    super.start();
  }

  // Utility function from MePhone/utils/calculatorUtils.ts
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
                this.renderCalculatorApp()
              ]
            })
          ]
        })
      ]
    });
  }

  private renderCalculatorApp(): ui.UINode {
    return ui.View({
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6', // gray-100
        flexDirection: 'column'
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
            ui.Text({
              text: '🏠',
              style: {
                fontSize: 16,
                color: '#9CA3AF'
              }
            }),
            ui.Text({
              text: 'Calculator',
              style: {
                fontSize: 14,
                fontWeight: '500',
                color: '#111827'
              }
            })
          ]
        }),
        
        // Display
        ui.View({
          style: {
            backgroundColor: '#000000',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginTop: 36, // Account for header
            minHeight: 80
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
            padding: 8,
            flexDirection: 'column',
            justifyContent: 'space-evenly'
          },
          children: [
            // Row 1: C, CE, ⌫, ÷
            this.createCalculatorRow([
              { label: 'C', type: 'function', action: () => this.calcClear(), bg: '#D1D5DB' },
              { label: 'CE', type: 'function', action: () => this.calcClearEntry(), bg: '#D1D5DB' },
              { label: '⌫', type: 'function', action: () => this.calcDeleteDigit(), bg: '#D1D5DB' },
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
                paddingHorizontal: 4,
                marginVertical: 1
              },
              children: [
                // 0 button (double width)
                ui.Pressable({
                  style: {
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    flex: 2,
                    marginHorizontal: 1,
                    minHeight: 45,
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
                    marginHorizontal: 1,
                    minHeight: 45,
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
                    backgroundColor: '#F97316', // orange-500
                    borderRadius: 8,
                    flex: 1,
                    marginHorizontal: 1,
                    minHeight: 45,
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
        paddingHorizontal: 4,
        marginVertical: 1
      },
      children: buttons.map(button => 
        ui.Pressable({
          style: {
            backgroundColor: button.bg,
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 1,
            minHeight: 45,
            justifyContent: 'center',
            alignItems: 'center'
          },
          onPress: button.action,
          children: [
            ui.Text({
              text: button.label,
              style: {
                fontSize: 22,
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

hz.Component.register(CalculatorApp);
