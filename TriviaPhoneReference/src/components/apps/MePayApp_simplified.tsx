import React, { useState } from 'react';
import {
  Home,
  ArrowLeft,
  Send,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Check,
  Delete,
  X,
  CheckCircle
} from 'lucide-react';
import { SectionHeader } from '../shared/SectionHeader';

type PayAppPage = 'home' | 'send' | 'request' | 'sent' | 'requested';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'bill' | 'deposit';
  description: string;
  amount: number;
  date: string;
  recipient?: string;
  category: string;
}

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  company?: string;
}

const sampleContacts: Contact[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    phone: '(555) 123-4567',
    email: 'alice.johnson@email.com',
    avatar: '👩‍💼',
    company: 'Tech Corp'
  },
  {
    id: 2,
    name: 'Bob Smith',
    phone: '(555) 234-5678',
    email: 'bob.smith@email.com',
    avatar: '👨‍💻',
    company: 'Design Studio'
  },
  {
    id: 3,
    name: 'Carol Davis',
    phone: '(555) 345-6789',
    email: 'carol.davis@email.com',
    avatar: '👩‍🎨',
    company: 'Art Gallery'
  },
  {
    id: 4,
    name: 'David Wilson',
    phone: '(555) 456-7890',
    avatar: '👨‍🔬',
    company: 'Research Lab'
  },
  {
    id: 5,
    name: 'Emma Brown',
    phone: '(555) 567-8901',
    email: 'emma.brown@email.com',
    avatar: '👩‍🏫',
    company: 'University'
  },
  {
    id: 6,
    name: 'Frank Miller',
    phone: '(555) 678-9012',
    avatar: '👨‍🍳',
    company: 'Restaurant'
  }
];

const noteReasons = [
  'Lunch',
  'Coffee',
  'Rent',
  'Utilities',
  'Gas money',
  'Groceries',
  'Movie tickets',
  'Dinner',
  'Birthday gift',
  'Thank you',
  'Freelance work',
  'Invoice payment',
  'Other'
];

interface MePayAppProps {
  onNavigateToHome?: () => void;
  onNavigateBack?: () => void;
}

export function MePayApp({ onNavigateToHome, onNavigateBack }: MePayAppProps) {
  const [currentPage, setCurrentPage] = useState<PayAppPage>('home');
  const [balance, setBalance] = useState(12847.92);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const [selectedRequestContact, setSelectedRequestContact] = useState<Contact | null>(null);
  const [isRequestContactDropdownOpen, setIsRequestContactDropdownOpen] = useState(false);
  
  // Amount and numpad state for Send page
  const [sendAmount, setSendAmount] = useState('');
  const [showSendNumpad, setShowSendNumpad] = useState(false);
  const [selectedSendNote, setSelectedSendNote] = useState('');
  const [isSendNoteDropdownOpen, setIsSendNoteDropdownOpen] = useState(false);
  
  // Amount and numpad state for Request page
  const [requestAmount, setRequestAmount] = useState('');
  const [showRequestNumpad, setShowRequestNumpad] = useState(false);
  const [selectedRequestNote, setSelectedRequestNote] = useState('');
  const [isRequestNoteDropdownOpen, setIsRequestNoteDropdownOpen] = useState(false);

  // Transaction confirmation state
  const [lastTransaction, setLastTransaction] = useState<{
    type: 'sent' | 'requested';
    amount: string;
    contact: Contact | null;
    note: string;
  } | null>(null);

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'sent',
      description: 'Coffee with Sarah',
      amount: -12.50,
      date: 'Today',
      recipient: 'Sarah',
      category: 'Food & Drink'
    },
    // ... all other transactions remain the same
  ];

  const navigateToPage = (page: PayAppPage) => {
    setCurrentPage(page);
    // Reset dropdowns when navigating between pages
    setIsContactDropdownOpen(false);
    setIsRequestContactDropdownOpen(false);
    setIsSendNoteDropdownOpen(false);
    setIsRequestNoteDropdownOpen(false);
    setShowSendNumpad(false);
    setShowRequestNumpad(false);
  };

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'], 
    ['7', '8', '9'],
    ['clear', '0', 'del']
  ];

  const handleNumpadPress = (key: string, isRequest: boolean = false) => {
    const currentAmount = isRequest ? requestAmount : sendAmount;
    const setAmount = isRequest ? setRequestAmount : setSendAmount;
    
    if (key === 'del') {
      setAmount(currentAmount.slice(0, -1));
    } else if (key === 'clear') {
      setAmount('');
    } else if (key && key.length > 0) {
      // Limit total length
      if (currentAmount.length < 10) {
        setAmount(currentAmount + key);
      }
    }
  };

  const formatAmount = (amount: string) => {
    if (!amount) return '0';
    const num = parseInt(amount);
    if (isNaN(num)) return '0';
    return num.toString();
  };

  const handleSendMoney = () => {
    setLastTransaction({
      type: 'sent',
      amount: sendAmount,
      contact: selectedContact,
      note: selectedSendNote
    });
    setCurrentPage('sent');
  };

  const handleRequestMoney = () => {
    setLastTransaction({
      type: 'requested',
      amount: requestAmount,
      contact: selectedRequestContact,
      note: selectedRequestNote
    });
    setCurrentPage('requested');
  };

  const renderHeader = () => {
    const getHeaderTitle = () => {
      switch (currentPage) {
        case 'send':
          return 'Send Money';
        case 'request':
          return 'Request Money';
        case 'sent':
          return 'Payment Sent';
        case 'requested':
          return 'Request Sent';
        default:
          return 'MePay';
      }
    };

    return (
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
          {currentPage !== 'home' && (
            <button
              onClick={() => navigateToPage('home')}
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
        <h1 className="font-medium" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>{getHeaderTitle()}</h1>
      </div>
    );
  };

  // SIMPLIFIED SUCCESS SCREENS - NO TRANSACTION DETAILS, SINGLE BUTTON

  // Payment Sent Success Screen - SIMPLIFIED (No Alice Johnson details, no Back to Home)
  if (currentPage === 'sent' && lastTransaction) {
    return (
      <div className="h-full bg-green-500 flex flex-col items-center justify-center text-white" style={{ 
        padding: 'clamp(1rem, 8cqw, 2rem)',
        gap: 'clamp(1rem, 8cqw, 2rem)' 
      }}>
        {/* Success Icon */}
        <div className="bg-white bg-opacity-20 rounded-full flex items-center justify-center" style={{
          width: 'clamp(6rem, 30cqw, 8rem)',
          height: 'clamp(6rem, 30cqw, 8rem)',
        }}>
          <CheckCircle className="text-green-600" style={{ 
            width: 'clamp(3rem, 18cqw, 4.5rem)', 
            height: 'clamp(3rem, 18cqw, 4.5rem)' 
          }} />
        </div>

        {/* Success Message - NO TRANSACTION DETAILS */}
        <div className="text-center">
          <h2 className="text-white" style={{ 
            fontSize: 'clamp(1.5rem, 8cqw, 2rem)',
            marginBottom: 'clamp(1.5rem, 8cqw, 2rem)'
          }}>
            Payment Sent Successfully!
          </h2>
        </div>

        {/* Single Action Button - NO BACK TO HOME BUTTON */}
        <div className="w-full">
          <button 
            onClick={() => navigateToPage('home')}
            className="w-full bg-green-600 text-white rounded-xl font-medium" 
            style={{ 
              padding: 'clamp(0.75rem, 4cqw, 1rem)',
              fontSize: 'clamp(1rem, 5cqw, 1.25rem)'
            }}
          >
            Okay
          </button>
        </div>
      </div>
    );
  }

  // Request Sent Success Screen - SIMPLIFIED
  if (currentPage === 'requested' && lastTransaction) {
    return (
      <div className="h-full bg-blue-500 flex flex-col items-center justify-center text-white" style={{ 
        padding: 'clamp(1rem, 8cqw, 2rem)',
        gap: 'clamp(1rem, 8cqw, 2rem)' 
      }}>
        {/* Success Icon */}
        <div className="bg-white bg-opacity-20 rounded-full flex items-center justify-center" style={{
          width: 'clamp(6rem, 30cqw, 8rem)',
          height: 'clamp(6rem, 30cqw, 8rem)',
        }}>
          <CheckCircle className="text-blue-600" style={{ 
            width: 'clamp(3rem, 18cqw, 4.5rem)', 
            height: 'clamp(3rem, 18cqw, 4.5rem)' 
          }} />
        </div>

        {/* Success Message */}
        <div className="text-center">
          <h2 className="text-white" style={{ 
            fontSize: 'clamp(1.5rem, 8cqw, 2rem)',
            marginBottom: 'clamp(1.5rem, 8cqw, 2rem)'
          }}>
            Request Sent Successfully!
          </h2>
        </div>

        {/* Single Action Button */}
        <div className="w-full">
          <button 
            onClick={() => navigateToPage('home')}
            className="w-full bg-blue-600 text-white rounded-xl font-medium" 
            style={{ 
              padding: 'clamp(0.75rem, 4cqw, 1rem)',
              fontSize: 'clamp(1rem, 5cqw, 1.25rem)'
            }}
          >
            Okay
          </button>
        </div>
      </div>
    );
  }

  // Rest of the component remains the same...
  if (currentPage === 'home') {
    return (
      <div className="h-full bg-white flex flex-col">
        {renderHeader()}
        <div className="p-4 pt-16">
          <p>Home screen content...</p>
        </div>
      </div>
    );
  }

  return <div>Other pages...</div>;
}