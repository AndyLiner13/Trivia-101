import React, { useState } from 'react';
import { Delete, Home } from 'lucide-react';

interface CalculatorAppProps {
  onNavigateToHome?: () => void;
}

export function CalculatorApp({ onNavigateToHome }: CalculatorAppProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string>('');
  const [operation, setOperation] = useState<string>('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === '') {
      setPreviousValue(display);
    } else if (operation) {
      const currentValue = previousValue || '0';
      const newValue = calculate(parseFloat(currentValue), inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(String(newValue));
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstOperand: number, secondOperand: number, operation: string): number => {
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
  };

  const performCalculation = () => {
    if (previousValue && operation) {
      const inputValue = parseFloat(display);
      const currentValue = parseFloat(previousValue);
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue('');
      setOperation('');
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue('');
    setOperation('');
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
    setWaitingForOperand(false);
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const deleteDigit = () => {
    if (display.length > 1 && display !== '0') {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const formatDisplay = (value: string) => {
    if (value.length > 12) {
      const num = parseFloat(value);
      if (num > 999999999999) {
        return num.toExponential(5);
      }
      return num.toFixed(8).replace(/\.?0+$/, '');
    }
    return value;
  };

  const buttons = [
    [
      { label: 'C', type: 'function', action: clear, className: 'bg-gray-300 text-gray-800' },
      { label: 'CE', type: 'function', action: clearEntry, className: 'bg-gray-300 text-gray-800' },
      { label: '⌫', type: 'function', action: deleteDigit, className: 'bg-gray-300 text-gray-800', icon: Delete },
      { label: '÷', type: 'operation', action: () => inputOperation('÷'), className: 'bg-orange-500 text-white' }
    ],
    [
      { label: '7', type: 'number', action: () => inputNumber('7'), className: 'bg-white text-gray-800' },
      { label: '8', type: 'number', action: () => inputNumber('8'), className: 'bg-white text-gray-800' },
      { label: '9', type: 'number', action: () => inputNumber('9'), className: 'bg-white text-gray-800' },
      { label: '×', type: 'operation', action: () => inputOperation('×'), className: 'bg-orange-500 text-white' }
    ],
    [
      { label: '4', type: 'number', action: () => inputNumber('4'), className: 'bg-white text-gray-800' },
      { label: '5', type: 'number', action: () => inputNumber('5'), className: 'bg-white text-gray-800' },
      { label: '6', type: 'number', action: () => inputNumber('6'), className: 'bg-white text-gray-800' },
      { label: '-', type: 'operation', action: () => inputOperation('-'), className: 'bg-orange-500 text-white' }
    ],
    [
      { label: '1', type: 'number', action: () => inputNumber('1'), className: 'bg-white text-gray-800' },
      { label: '2', type: 'number', action: () => inputNumber('2'), className: 'bg-white text-gray-800' },
      { label: '3', type: 'number', action: () => inputNumber('3'), className: 'bg-white text-gray-800' },
      { label: '+', type: 'operation', action: () => inputOperation('+'), className: 'bg-orange-500 text-white' }
    ],
    [
      { label: '0', type: 'number', action: () => inputNumber('0'), className: 'bg-white text-gray-800', span: 2 },
      { label: '.', type: 'decimal', action: inputDecimal, className: 'bg-white text-gray-800' },
      { label: '=', type: 'equals', action: performCalculation, className: 'bg-orange-500 text-white' }
    ]
  ];

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      {/* Navbar */}
      <div className="bg-gray-50 flex items-center justify-between border-b absolute top-0 left-0 right-0 z-10" style={{ 
        padding: 'clamp(0.5rem, 3cqw, 0.875rem) clamp(0.75rem, 4cqw, 1.25rem)'
      }}>
        <div className="flex items-center" style={{ gap: 'clamp(0.25rem, 2cqw, 0.625rem)' }}>
          <button
            onClick={onNavigateToHome}
            className="rounded-lg" 
            style={{ padding: 'clamp(0.125rem, 1cqw, 0.375rem)' }}
          >
            <Home style={{ 
              width: 'clamp(1rem, 6cqw, 1.75rem)', 
              height: 'clamp(1rem, 6cqw, 1.75rem)' 
            }} />
          </button>
        </div>
        <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Calculator</h1>
      </div>

      {/* Display */}
      <div className="bg-black text-white text-right flex items-end justify-end flex-shrink-0" style={{ 
        padding: 'clamp(0.75rem, 4cqw, 1.25rem)',
        flex: '0 0 auto',
        minHeight: 'clamp(3rem, 10cqh, 4rem)',
        marginTop: 'clamp(2.5rem, 13.5cqw, 4rem)'
      }}>
        <div 
          className="font-light leading-none break-all"
          style={{ 
            fontSize: 'clamp(2.5rem, 12cqw, 4.5rem)',
            letterSpacing: '-0.02em'
          }}
        >
          {formatDisplay(display)}
        </div>
      </div>

      {/* Button Grid */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ 
        padding: 'clamp(0.5rem, 3cqw, 1rem)',
        gap: 'clamp(0.5rem, 3cqw, 1rem)',
        flex: '1 1 0',
        minHeight: '0'
      }}>
        {buttons.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-1" style={{ gap: 'clamp(0.5rem, 3cqw, 1rem)' }}>
            {row.map((button, buttonIndex) => {
              const Icon = button.icon;
              return (
                <button
                  key={buttonIndex}
                  onClick={button.action}
                  className={`${button.className} rounded-lg shadow-sm active:scale-95 transition-transform ${
                    button.span === 2 ? 'flex-[2]' : 'flex-1'
                  } flex items-center justify-center`}
                  style={{ 
                    fontSize: 'clamp(1.5rem, 7cqw, 2rem)',
                    minHeight: 'clamp(2.5rem, 10cqh, 4rem)'
                  }}
                >
                  {Icon ? (
                    <Icon style={{ 
                      width: 'clamp(1.5rem, 7cqw, 2rem)', 
                      height: 'clamp(1.5rem, 7cqw, 2rem)' 
                    }} />
                  ) : (
                    button.label
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}