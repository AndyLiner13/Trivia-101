import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, Delete, Home, ArrowLeft } from 'lucide-react';

interface PhoneAppProps {
  navigationData?: {
    contactId?: number;
    contactName?: string;
    contactPhone?: string;
    contactAvatar?: string;
    returnTo?: string;
  } | null;
  onNavigateToHome?: () => void;
  onNavigateBack?: () => void;
  onCallStateChange?: (isCallActive: boolean) => void;
}

export function PhoneApp({ navigationData, onNavigateToHome, onNavigateBack, onCallStateChange }: PhoneAppProps) {
  const [number, setNumber] = useState('');
  const [isDialing, setIsDialing] = useState(false);
  
  // If we have contact data, start calling that contact immediately
  useEffect(() => {
    if (navigationData?.contactPhone) {
      setNumber(navigationData.contactPhone.replace(/[^\d]/g, '')); // Remove formatting
      setIsDialing(true);
    }
  }, [navigationData]);

  // Notify parent component when call state changes
  useEffect(() => {
    onCallStateChange?.(isDialing);
  }, [isDialing, onCallStateChange]);

  // Cleanup call state when component unmounts or navigation data changes
  useEffect(() => {
    return () => {
      onCallStateChange?.(false);
    };
  }, [onCallStateChange]);

  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  const handleNumberPress = (digit: string) => {
    if (number.length < 15) {
      setNumber(prev => prev + digit);
    }
  };

  const handleEndCall = () => {
    setIsDialing(false);
    if (!navigationData?.contactPhone) {
      setNumber('');
    } else if (navigationData && onNavigateBack) {
      // If we have navigation data (came from contacts), go back there
      onNavigateBack();
    }
  };

  const handleCall = () => {
    if (number) {
      setIsDialing(true);
      setTimeout(() => {
        handleEndCall();
      }, 3000);
    }
  };

  const handleDelete = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const formatNumber = (num: string) => {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
  };

  if (isDialing) {
    const displayName = navigationData?.contactName || formatNumber(number);
    const displayNumber = navigationData?.contactPhone || formatNumber(number);
    
    return (
      <div className="h-full bg-green-500 flex flex-col items-center justify-center text-white" style={{ 
        padding: 'clamp(1rem, 8cqw, 2rem)',
        gap: 'clamp(1rem, 8cqw, 2rem)' 
      }}>
        <div className="text-center" style={{ gap: 'clamp(0.5rem, 4cqw, 1rem)' }}>
          {navigationData?.contactAvatar && (
            <div className="bg-white bg-opacity-20 rounded-xl flex items-center justify-center" style={{
              width: 'clamp(4rem, 25cqw, 6rem)',
              height: 'clamp(4rem, 25cqw, 6rem)',
              fontSize: 'clamp(2rem, 12cqw, 3rem)',
              margin: '0 auto',
              marginBottom: 'clamp(0.5rem, 4cqw, 1rem)'
            }}>
              {navigationData.contactAvatar}
            </div>
          )}
          {!navigationData?.contactAvatar && (
            <PhoneCall style={{ 
              width: 'clamp(3rem, 20cqw, 4rem)', 
              height: 'clamp(3rem, 20cqw, 4rem)',
              margin: '0 auto',
              marginBottom: 'clamp(0.5rem, 4cqw, 1rem)'
            }} />
          )}
          <p style={{ fontSize: 'clamp(1.25rem, 8cqw, 1.5rem)', marginBottom: 'clamp(0.25rem, 2cqw, 0.5rem)' }}>
            {navigationData?.contactName ? displayName : 'Calling...'}
          </p>
          {!navigationData?.contactName && (
            <p style={{ fontSize: 'clamp(1rem, 6cqw, 1.25rem)', opacity: '0.9' }}>{displayNumber}</p>
          )}
        </div>
        <button
          onClick={handleEndCall}
          className="bg-red-500 rounded-xl flex items-center justify-center"
          style={{ 
            width: 'clamp(2.5rem, 16cqw, 4rem)', 
            height: 'clamp(2.5rem, 16cqw, 4rem)' 
          }}
        >
          <Phone style={{ 
            width: 'clamp(1.25rem, 8cqw, 2rem)', 
            height: 'clamp(1.25rem, 8cqw, 2rem)',
            transform: 'rotate(135deg)' 
          }} />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100 flex flex-col">
      {/* Navbar */}
      <div className="bg-gray-50 flex items-center justify-between border-b absolute top-0 left-0 right-0 z-10" style={{ 
        padding: '12px 16px'
      }}>
        <div className="flex items-center" style={{ gap: '8px' }}>
          <button
            onClick={onNavigateToHome}
            className="rounded-lg" 
            style={{ padding: '4px' }}
          >
            <Home style={{ 
              width: '24px', 
              height: '24px' 
            }} />
          </button>
          {navigationData?.returnTo && (
            <button
              onClick={onNavigateBack}
              className="rounded-lg" 
              style={{ padding: '4px' }}
            >
              <ArrowLeft style={{ 
                width: '24px', 
                height: '24px' 
              }} />
            </button>
          )}
        </div>
        <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Phone</h1>
      </div>

      {/* Number Display */}
      <div className="bg-black text-white text-center flex items-center justify-center flex-shrink-0" style={{ 
        padding: 'clamp(0.75rem, 4cqw, 1.25rem)',
        flex: '0 0 auto',
        minHeight: 'clamp(3rem, 10cqh, 4rem)',
        marginTop: '54px'
      }}>
        <div className="font-light leading-none break-all" style={{ 
          fontSize: 'clamp(1.5rem, 8cqw, 2.5rem)',
          letterSpacing: '-0.02em'
        }}>
          {number ? formatNumber(number) : 'Enter phone number'}
        </div>
      </div>

      {/* Dial Pad */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ 
        padding: 'clamp(0.5rem, 3cqw, 1rem)',
        gap: 'clamp(0.5rem, 3cqw, 1rem)',
        flex: '1 1 0',
        minHeight: '0'
      }}>
        {dialPad.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-1" style={{ gap: 'clamp(0.5rem, 3cqw, 1rem)' }}>
            {row.map((digit) => (
              <button
                key={digit}
                onClick={() => handleNumberPress(digit)}
                className="bg-white text-gray-800 rounded-lg shadow-sm active:scale-95 transition-transform flex-1 flex items-center justify-center"
                style={{ 
                  fontSize: 'clamp(1.5rem, 7cqw, 2rem)',
                  minHeight: 'clamp(2.5rem, 10cqh, 4rem)'
                }}
              >
                {digit}
              </button>
            ))}
          </div>
        ))}

        {/* Action Buttons Row */}
        <div className="flex flex-1" style={{ gap: 'clamp(0.5rem, 3cqw, 1rem)' }}>
          <button
            onClick={handleDelete}
            disabled={!number}
            className="bg-gray-300 text-gray-800 rounded-lg shadow-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center"
            style={{ 
              fontSize: 'clamp(1.5rem, 7cqw, 2rem)',
              minHeight: 'clamp(2.5rem, 10cqh, 4rem)'
            }}
          >
            <Delete style={{ 
              width: 'clamp(1.5rem, 7cqw, 2rem)', 
              height: 'clamp(1.5rem, 7cqw, 2rem)' 
            }} />
          </button>
          
          <button
            onClick={handleCall}
            disabled={!number}
            className="bg-green-500 text-white rounded-lg shadow-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center"
            style={{ 
              fontSize: 'clamp(1.5rem, 7cqw, 2rem)',
              minHeight: 'clamp(2.5rem, 10cqh, 4rem)'
            }}
          >
            <Phone style={{ 
              width: 'clamp(1.5rem, 7cqw, 2rem)', 
              height: 'clamp(1.5rem, 7cqw, 2rem)' 
            }} />
          </button>
        </div>
      </div>
    </div>
  );
}