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
    {
      id: '2',
      type: 'received',
      description: 'Payment from Alex',
      amount: 45.00,
      date: 'Today',
      recipient: 'Alex',
      category: 'Personal'
    },
    {
      id: '3',
      type: 'sent',
      description: 'Lunch Split',
      amount: -28.75,
      date: 'Today',
      recipient: 'Mike',
      category: 'Food & Drink'
    },
    {
      id: '4',
      type: 'bill',
      description: 'Electric Company',
      amount: -89.47,
      date: 'Yesterday',
      category: 'Utilities'
    },
    {
      id: '5',
      type: 'received',
      description: 'Rent Split from Jake',
      amount: 425.00,
      date: 'Yesterday',
      recipient: 'Jake',
      category: 'Personal'
    },
    {
      id: '6',
      type: 'sent',
      description: 'Gas Station',
      amount: -45.20,
      date: 'Dec 2',
      category: 'Transportation'
    },
    {
      id: '7',
      type: 'deposit',
      description: 'Salary Deposit',
      amount: 2850.00,
      date: 'Dec 1',
      category: 'Income'
    },
    {
      id: '8',
      type: 'sent',
      description: 'Online Shopping',
      amount: -156.99,
      date: 'Nov 30',
      category: 'Shopping'
    },
    {
      id: '9',
      type: 'received',
      description: 'Freelance Payment',
      amount: 350.00,
      date: 'Nov 29',
      category: 'Income'
    },
    {
      id: '10',
      type: 'sent',
      description: 'Grocery Store',
      amount: -87.43,
      date: 'Nov 28',
      category: 'Shopping'
    },
    {
      id: '11',
      type: 'bill',
      description: 'Internet Bill',
      amount: -67.99,
      date: 'Nov 27',
      category: 'Utilities'
    },
    {
      id: '12',
      type: 'received',
      description: 'Cashback Reward',
      amount: 25.00,
      date: 'Nov 26',
      category: 'Income'
    },
    {
      id: '13',
      type: 'sent',
      description: 'Movie Tickets',
      amount: -32.50,
      date: 'Nov 25',
      recipient: 'Emma',
      category: 'Entertainment'
    },
    {
      id: '14',
      type: 'deposit',
      description: 'Bank Transfer',
      amount: 500.00,
      date: 'Nov 24',
      category: 'Income'
    },
    {
      id: '15',
      type: 'sent',
      description: 'Uber Ride',
      amount: -18.75,
      date: 'Nov 23',
      category: 'Transportation'
    },
    {
      id: '16',
      type: 'received',
      description: 'Venmo from Lisa',
      amount: 75.00,
      date: 'Nov 22',
      recipient: 'Lisa',
      category: 'Personal'
    },
    {
      id: '17',
      type: 'bill',
      description: 'Phone Bill',
      amount: -95.00,
      date: 'Nov 21',
      category: 'Utilities'
    },
    {
      id: '18',
      type: 'sent',
      description: 'Pharmacy',
      amount: -23.99,
      date: 'Nov 20',
      category: 'Healthcare'
    },
    {
      id: '19',
      type: 'received',
      description: 'Client Payment',
      amount: 1200.00,
      date: 'Nov 19',
      category: 'Income'
    },
    {
      id: '20',
      type: 'sent',
      description: 'ATM Withdrawal',
      amount: -100.00,
      date: 'Nov 18',
      category: 'Cash'
    }
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

  const renderBalanceCard = () => (
    <div className="bg-blue-600 text-white rounded-xl" style={{ 
      padding: 'clamp(1.5rem, 6cqw, 2rem)',
      marginBottom: 'clamp(1.5rem, 6cqw, 2rem)'
    }}>
      <h2 className="text-white opacity-90" style={{ 
        fontSize: 'clamp(1rem, 4.5cqw, 1.125rem)',
        marginBottom: 'clamp(0.5rem, 2cqh, 0.75rem)'
      }}>
        Account Balance
      </h2>
      <p className="text-white" style={{ 
        fontSize: 'clamp(2rem, 8cqw, 2.5rem)', 
        fontWeight: '700'
      }}>
        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );

  const renderNumpad = (isRequest: boolean = false) => (
    <div className="bg-gray-50 border-t">
      <div style={{ 
        padding: '4cqw',
        paddingTop: '3cqw'
      }}>
        {/* Numpad Grid */}
        <div className="grid grid-cols-3" style={{ gap: '2cqw', marginBottom: '3cqw' }}>
          {numpadKeys.map((row, rowIndex) => (
            row.map((key, keyIndex) => (
              <button
                key={`${rowIndex}-${keyIndex}`}
                onClick={() => handleNumpadPress(key, isRequest)}
                className="bg-white border border-gray-200 rounded-lg flex items-center justify-center"
                style={{ 
                  fontSize: key === 'del' || key === 'clear' ? '3cqw' : '5cqw',
                  minHeight: '8cqh'
                }}
              >
                {key === 'del' ? <Delete style={{ width: '4cqw', height: '4cqw' }} /> : 
                 key === 'clear' ? 'Clear' : key}
              </button>
            ))
          ))}
        </div>

        {/* Confirm Button - Full Width */}
        <div style={{ marginBottom: '3cqw' }}>
          <button
            onClick={() => isRequest ? setShowRequestNumpad(false) : setShowSendNumpad(false)}
            className="w-full text-white rounded-xl font-medium"
            style={{ 
              padding: '4cqw',
              fontSize: '4cqw',
              backgroundColor: isRequest ? '#16a34a' : '#2563eb'
            }}
          >
            Confirm
          </button>
        </div>
      </div>

      {/* Continue Button - Full Width */}
      <div className="bg-white border-t border-gray-200" style={{ 
        padding: '4cqw',
        paddingBottom: '4cqw'
      }}>
        <button 
          onClick={() => {
            if (isRequest) {
              handleRequestMoney();
            } else {
              handleSendMoney();
            }
          }}
          disabled={
            isRequest 
              ? (!selectedRequestContact || !requestAmount)
              : (!selectedContact || !sendAmount)
          }
          className="w-full text-white rounded-xl font-medium disabled:bg-gray-400 disabled:cursor-not-allowed" 
          style={{ 
            padding: '4cqw',
            backgroundColor: isRequest ? '#16a34a' : '#2563eb',
            fontSize: '4cqw'
          }}
        >
          {isRequest ? 'Send Request' : 'Send Payment'}
        </button>
      </div>
    </div>
  );

  // SIMPLIFIED SUCCESS SCREENS - NO TRANSACTION DETAILS, SINGLE BUTTON

  // Payment Sent Success Screen - SIMPLIFIED
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

        {/* Success Message */}
        <div className="text-center">
          <h2 className="text-white" style={{ 
            fontSize: 'clamp(1.5rem, 8cqw, 2rem)',
            marginBottom: 'clamp(1.5rem, 8cqw, 2rem)'
          }}>
            Payment Sent Successfully!
          </h2>
        </div>

        {/* Single Action Button */}
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

  if (currentPage === 'home') {
    return (
      <div className="h-full bg-white flex flex-col">
        {renderHeader()}
        
        <div className="flex-1 flex flex-col" style={{ 
          padding: 'clamp(1rem, 5cqw, 1.5rem)',
          paddingTop: 'clamp(1.5rem, 6cqw, 2rem)',
          marginTop: '54px'
        }}>
          {renderBalanceCard()}

          {/* Quick Actions */}
          <div className="grid grid-cols-2" style={{ 
            gap: 'clamp(1rem, 5cqw, 1.5rem)',
            marginBottom: 'clamp(1.5rem, 6cqw, 2rem)'
          }}>
            <button 
              onClick={() => navigateToPage('send')}
              className="bg-blue-500 text-white rounded-xl flex flex-col items-center justify-center hover:bg-blue-600" 
              style={{ 
                padding: 'clamp(1rem, 5cqw, 1.5rem)',
                gap: 'clamp(0.5rem, 2cqw, 0.75rem)'
              }}
            >
              <Send style={{ width: 'clamp(1.5rem, 6cqw, 2rem)', height: 'clamp(1.5rem, 6cqw, 2rem)' }} />
              <span style={{ fontSize: 'clamp(0.875rem, 4cqw, 1rem)', fontWeight: '600' }}>Send</span>
            </button>
            
            <button 
              onClick={() => navigateToPage('request')}
              className="bg-green-500 text-white rounded-xl flex flex-col items-center justify-center hover:bg-green-600" 
              style={{ 
                padding: 'clamp(1rem, 5cqw, 1.5rem)',
                gap: 'clamp(0.5rem, 2cqw, 0.75rem)'
              }}
            >
              <ArrowDownLeft style={{ width: 'clamp(1.5rem, 6cqw, 2rem)', height: 'clamp(1.5rem, 6cqw, 2rem)' }} />
              <span style={{ fontSize: 'clamp(0.875rem, 4cqw, 1rem)', fontWeight: '600' }}>Request</span>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="flex-1 flex flex-col min-h-0">
            <SectionHeader title="Recent Activity" />
            <div className="flex-1 overflow-y-auto" style={{ 
              marginTop: 'clamp(0.75rem, 3cqw, 1rem)'
            }}>
              <div className="space-y-3" style={{ 
                paddingBottom: 'clamp(1rem, 4cqw, 1.5rem)'
              }}>
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 rounded-lg flex items-center justify-between" style={{ 
                    padding: 'clamp(1rem, 5cqw, 1.25rem)' 
                  }}>
                    <div className="flex items-center" style={{ gap: 'clamp(0.75rem, 4cqw, 1rem)' }}>
                      <div className={`rounded-lg flex items-center justify-center ${
                        transaction.type === 'sent' ? 'bg-red-100' :
                        transaction.type === 'received' ? 'bg-green-100' :
                        transaction.type === 'bill' ? 'bg-purple-100' : 'bg-blue-100'
                      }`} style={{ 
                        width: 'clamp(2rem, 8cqw, 2.5rem)', 
                        height: 'clamp(2rem, 8cqw, 2.5rem)' 
                      }}>
                        {transaction.type === 'sent' && <ArrowUpRight className="text-red-600" style={{ width: 'clamp(1rem, 4cqw, 1.25rem)', height: 'clamp(1rem, 4cqw, 1.25rem)' }} />}
                        {transaction.type === 'received' && <ArrowDownLeft className="text-green-600" style={{ width: 'clamp(1rem, 4cqw, 1.25rem)', height: 'clamp(1rem, 4cqw, 1.25rem)' }} />}
                        {transaction.type === 'bill' && <DollarSign className="text-purple-600" style={{ width: 'clamp(1rem, 4cqw, 1.25rem)', height: 'clamp(1rem, 4cqw, 1.25rem)' }} />}
                        {transaction.type === 'deposit' && <DollarSign className="text-blue-600" style={{ width: 'clamp(1rem, 4cqw, 1.25rem)', height: 'clamp(1rem, 4cqw, 1.25rem)' }} />}
                      </div>
                      <div>
                        <p style={{ fontSize: 'clamp(1rem, 4.5cqw, 1.125rem)', fontWeight: '500' }}>
                          {transaction.description}
                        </p>
                        <p className="text-gray-500" style={{ fontSize: 'clamp(0.875rem, 4cqw, 1rem)' }}>
                          {transaction.date} • {transaction.category}
                        </p>
                      </div>
                    </div>
                    <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'}`} style={{ 
                      fontSize: 'clamp(1rem, 4.5cqw, 1.125rem)' 
                    }}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'send') {
    return (
      <div className="h-full bg-white flex flex-col">
        {renderHeader()}
        
        <div className="flex-1 flex flex-col" style={{ 
          padding: showSendNumpad ? '0' : '4cqw',
          paddingTop: showSendNumpad ? '0' : '2cqh',
          marginTop: '54px'
        }}>
          <div className="flex-1 flex flex-col">
            {/* Form Fields */}
            <div className="space-y-3" style={{ 
              marginBottom: showSendNumpad ? '0' : '0',
              padding: showSendNumpad ? '4cqw' : '0',
              paddingBottom: showSendNumpad ? '2cqh' : '0'
            }}>
              {/* Recipient */}
              <div className="bg-gray-50 rounded-xl relative" style={{ padding: '3cqw' }}>
                <label className="block text-gray-700 font-medium" style={{ 
                  fontSize: '3.5cqw', 
                  marginBottom: '1.5cqh'
                }}>
                  To
                </label>
                <button 
                  onClick={() => setIsContactDropdownOpen(!isContactDropdownOpen)}
                  className="w-full bg-white border border-gray-200 rounded-lg text-gray-800 flex items-center justify-between" 
                  style={{ padding: '2.5cqw' }}
                >
                  <span>
                    {selectedContact ? (
                      <div className="flex items-center" style={{ gap: '2cqw' }}>
                        <span style={{ fontSize: '3.5cqw' }}>{selectedContact.avatar}</span>
                        <div className="text-left">
                          <div style={{ fontSize: '3.5cqw' }}>{selectedContact.name}</div>
                          <div className="text-gray-500" style={{ fontSize: '3cqw' }}>{selectedContact.phone}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Select a contact</span>
                    )}
                  </span>
                  <ChevronDown style={{ 
                    width: '4cqw', 
                    height: '4cqw',
                    transform: isContactDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} />
                </button>
                
                {/* Dropdown */}
                {isContactDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden" style={{ 
                    marginTop: '1cqw'
                  }}>
                    <div className="overflow-y-auto" style={{ maxHeight: '30cqh' }}>
                      {sampleContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => {
                            setSelectedContact(contact);
                            setIsContactDropdownOpen(false);
                          }}
                          className="w-full text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                          style={{ padding: '2.5cqw' }}
                        >
                          <div className="flex items-center" style={{ gap: '2cqw' }}>
                            <span style={{ fontSize: '3.5cqw' }}>{contact.avatar}</span>
                            <div>
                              <div style={{ fontSize: '3.5cqw' }}>{contact.name}</div>
                              <div className="text-gray-500" style={{ fontSize: '3cqw' }}>{contact.phone}</div>
                            </div>
                          </div>
                          {selectedContact?.id === contact.id && (
                            <Check style={{ 
                              width: '4cqw', 
                              height: '4cqw',
                              color: '#22c55e'
                            }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Input Field */}
              <div className="bg-gray-50 rounded-xl" style={{ padding: '3cqw' }}>
                <label className="block text-gray-700 font-medium" style={{ 
                  fontSize: '3.5cqw', 
                  marginBottom: '1.5cqh'
                }}>
                  Amount
                </label>
                <input
                  type="text"
                  value={sendAmount ? formatAmount(sendAmount) : ''}
                  placeholder="0"
                  onFocus={() => setShowSendNumpad(true)}
                  readOnly
                  className="w-full bg-white border border-gray-200 rounded-lg text-gray-800 text-left cursor-pointer" 
                  style={{ 
                    padding: '2.5cqw',
                    fontSize: '6cqw',
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* Note - only show when numpad is not active */}
              {!showSendNumpad && (
                <div className="bg-gray-50 rounded-xl relative" style={{ padding: '3cqw' }}>
                  <label className="block text-gray-700 font-medium" style={{ 
                    fontSize: '3.5cqw', 
                    marginBottom: '1.5cqh'
                  }}>
                    Note (Optional)
                  </label>
                  <button 
                    onClick={() => setIsSendNoteDropdownOpen(!isSendNoteDropdownOpen)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-gray-800 flex items-center justify-between text-left" 
                    style={{ padding: '2.5cqw' }}
                  >
                    <span>{selectedSendNote || 'Select a reason'}</span>
                    <ChevronDown style={{ 
                      width: '4cqw', 
                      height: '4cqw',
                      transform: isSendNoteDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} />
                  </button>
                  
                  {/* Note Dropdown */}
                  {isSendNoteDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden" style={{ 
                      marginTop: '1cqw'
                    }}>
                      <div className="overflow-y-auto" style={{ maxHeight: '25cqh' }}>
                        {noteReasons.map((reason) => (
                          <button
                            key={reason}
                            onClick={() => {
                              setSelectedSendNote(reason);
                              setIsSendNoteDropdownOpen(false);
                            }}
                            className="w-full text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                            style={{ padding: '2.5cqw' }}
                          >
                            <span style={{ fontSize: '3.5cqw' }}>{reason}</span>
                            {selectedSendNote === reason && (
                              <Check style={{ 
                                width: '4cqw', 
                                height: '4cqw',
                                color: '#22c55e'
                              }} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Send Button - only show when numpad is not active */}
            {!showSendNumpad && (
              <button 
                onClick={handleSendMoney}
                disabled={!selectedContact || !sendAmount}
                className="w-full bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" 
                style={{ 
                  padding: '3cqw',
                  marginTop: 'auto'
                }}
              >
                Send Money
              </button>
            )}

          </div>
        </div>

        {/* Numpad - positioned at bottom when active */}
        {showSendNumpad && renderNumpad(false)}
      </div>
    );
  }

  if (currentPage === 'request') {
    return (
      <div className="h-full bg-white flex flex-col">
        {renderHeader()}
        
        <div className="flex-1 flex flex-col" style={{ 
          padding: showRequestNumpad ? '0' : '4cqw',
          paddingTop: showRequestNumpad ? '0' : '2cqh',
          marginTop: '54px'
        }}>
          <div className="flex-1 flex flex-col">
            {/* Form Fields */}
            <div className="space-y-3" style={{ 
              marginBottom: showRequestNumpad ? '0' : '0',
              padding: showRequestNumpad ? '4cqw' : '0',
              paddingBottom: showRequestNumpad ? '2cqh' : '0'
            }}>
              {/* Recipient */}
              <div className="bg-gray-50 rounded-xl relative" style={{ padding: '3cqw' }}>
                <label className="block text-gray-700 font-medium" style={{ 
                  fontSize: '3.5cqw', 
                  marginBottom: '1.5cqh'
                }}>
                  From
                </label>
                <button 
                  onClick={() => setIsRequestContactDropdownOpen(!isRequestContactDropdownOpen)}
                  className="w-full bg-white border border-gray-200 rounded-lg text-gray-800 flex items-center justify-between" 
                  style={{ padding: '2.5cqw' }}
                >
                  <span>
                    {selectedRequestContact ? (
                      <div className="flex items-center" style={{ gap: '2cqw' }}>
                        <span style={{ fontSize: '3.5cqw' }}>{selectedRequestContact.avatar}</span>
                        <div className="text-left">
                          <div style={{ fontSize: '3.5cqw' }}>{selectedRequestContact.name}</div>
                          <div className="text-gray-500" style={{ fontSize: '3cqw' }}>{selectedRequestContact.phone}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Select a contact</span>
                    )}
                  </span>
                  <ChevronDown style={{ 
                    width: '4cqw', 
                    height: '4cqw',
                    transform: isRequestContactDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} />
                </button>
                
                {/* Dropdown */}
                {isRequestContactDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden" style={{ 
                    marginTop: '1cqw'
                  }}>
                    <div className="overflow-y-auto" style={{ maxHeight: '30cqh' }}>
                      {sampleContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => {
                            setSelectedRequestContact(contact);
                            setIsRequestContactDropdownOpen(false);
                          }}
                          className="w-full text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                          style={{ padding: '2.5cqw' }}
                        >
                          <div className="flex items-center" style={{ gap: '2cqw' }}>
                            <span style={{ fontSize: '3.5cqw' }}>{contact.avatar}</span>
                            <div>
                              <div style={{ fontSize: '3.5cqw' }}>{contact.name}</div>
                              <div className="text-gray-500" style={{ fontSize: '3cqw' }}>{contact.phone}</div>
                            </div>
                          </div>
                          {selectedRequestContact?.id === contact.id && (
                            <Check style={{ 
                              width: '4cqw', 
                              height: '4cqw',
                              color: '#22c55e'
                            }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Input Field */}
              <div className="bg-gray-50 rounded-xl" style={{ padding: '3cqw' }}>
                <label className="block text-gray-700 font-medium" style={{ 
                  fontSize: '3.5cqw', 
                  marginBottom: '1.5cqh'
                }}>
                  Amount
                </label>
                <input
                  type="text"
                  value={requestAmount ? formatAmount(requestAmount) : ''}
                  placeholder="0"
                  onFocus={() => setShowRequestNumpad(true)}
                  readOnly
                  className="w-full bg-white border border-gray-200 rounded-lg text-gray-800 text-left cursor-pointer" 
                  style={{ 
                    padding: '2.5cqw',
                    fontSize: '6cqw',
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* Note - only show when numpad is not active */}
              {!showRequestNumpad && (
                <div className="bg-gray-50 rounded-xl relative" style={{ padding: '3cqw' }}>
                  <label className="block text-gray-700 font-medium" style={{ 
                    fontSize: '3.5cqw', 
                    marginBottom: '1.5cqh'
                  }}>
                    Note (Optional)
                  </label>
                  <button 
                    onClick={() => setIsRequestNoteDropdownOpen(!isRequestNoteDropdownOpen)}
                    className="w-full bg-white border border-gray-200 rounded-lg text-gray-800 flex items-center justify-between text-left" 
                    style={{ padding: '2.5cqw' }}
                  >
                    <span>{selectedRequestNote || 'Select a reason'}</span>
                    <ChevronDown style={{ 
                      width: '4cqw', 
                      height: '4cqw',
                      transform: isRequestNoteDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} />
                  </button>
                  
                  {/* Note Dropdown */}
                  {isRequestNoteDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden" style={{ 
                      marginTop: '1cqw'
                    }}>
                      <div className="overflow-y-auto" style={{ maxHeight: '25cqh' }}>
                        {noteReasons.map((reason) => (
                          <button
                            key={reason}
                            onClick={() => {
                              setSelectedRequestNote(reason);
                              setIsRequestNoteDropdownOpen(false);
                            }}
                            className="w-full text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                            style={{ padding: '2.5cqw' }}
                          >
                            <span style={{ fontSize: '3.5cqw' }}>{reason}</span>
                            {selectedRequestNote === reason && (
                              <Check style={{ 
                                width: '4cqw', 
                                height: '4cqw',
                                color: '#22c55e'
                              }} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Request Button - only show when numpad is not active */}
            {!showRequestNumpad && (
              <button 
                onClick={handleRequestMoney}
                disabled={!selectedRequestContact || !requestAmount}
                className="w-full bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed" 
                style={{ 
                  padding: '3cqw',
                  marginTop: 'auto'
                }}
              >
                Send Request
              </button>
            )}

          </div>
        </div>

        {/* Numpad - positioned at bottom when active */}
        {showRequestNumpad && renderNumpad(true)}
      </div>
    );
  }

  return null;
}