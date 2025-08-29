import React, { useState, useEffect } from 'react';

type BankPage = 'home' | 'send-money' | 'request-money' | 'pay-bills';

interface MeBankWebsiteProps {
  onNavigate?: (url: string) => void;
  currentUrl?: string;
}

export function MeBankWebsite({ onNavigate, currentUrl }: MeBankWebsiteProps = {}) {
  // Determine initial page based on current URL
  const getPageFromUrl = (url?: string): BankPage => {
    if (!url) return 'home';
    if (url === 'mebank-send') return 'send-money';
    if (url === 'mebank-request') return 'request-money';
    if (url === 'mebank-bills') return 'pay-bills';
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState<BankPage>(getPageFromUrl(currentUrl));
  
  // State for pay-bills page - these must be at the top level to avoid hooks rule violations
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [paidBills, setPaidBills] = useState<Set<string>>(new Set());

  // Update current page when URL changes externally (browser navigation)
  useEffect(() => {
    const newPage = getPageFromUrl(currentUrl);
    if (newPage !== currentPage) {
      // Reset pay-bills state when navigating away from that page
      if (currentPage === 'pay-bills' && newPage !== 'pay-bills') {
        setSelectedBill(null);
        setPaidBills(new Set());
      }
      setCurrentPage(newPage);
    }
  }, [currentUrl, currentPage]);

  const navigateToPage = (page: BankPage) => {
    // Reset pay-bills state when navigating away from that page
    if (currentPage === 'pay-bills' && page !== 'pay-bills') {
      setSelectedBill(null);
      setPaidBills(new Set());
    }
    
    setCurrentPage(page);
    // Update browser URL based on page
    if (onNavigate) {
      switch (page) {
        case 'home':
          onNavigate('mebank.com');
          break;
        case 'send-money':
          onNavigate('mebank-send');
          break;
        case 'request-money':
          onNavigate('mebank-request');
          break;
        case 'pay-bills':
          onNavigate('mebank-bills');
          break;
      }
    }
  };

  const renderHeader = () => (
    <div className="bg-blue-600 text-white border-2 border-blue-800 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
      <h1 className="text-white" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "600" }}>🏦 MeBank</h1>
      <p className="text-blue-100">Secure Online Banking</p>
    </div>
  );

  const renderAccountBalance = () => (
    <div className="bg-white border-2 border-green-600 mb-4" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
      <h2 className="text-green-800 mb-2" style={{ fontWeight: "600" }}>Account Balance:</h2>
      <p className="text-green-600" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "700" }}>$12,847.92</p>
    </div>
  );

  if (currentPage === 'home') {
    return (
      <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
        {renderHeader()}
        {renderAccountBalance()}

        {/* Quick Actions */}
        <div className="space-y-4 mb-6">
          
          <button 
            onClick={() => navigateToPage('send-money')}
            className="w-full bg-white border-2 border-blue-600 text-blue-800 hover:bg-blue-50" 
            style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}
          >
            SEND MONEY
          </button>
          
          <button 
            onClick={() => navigateToPage('request-money')}
            className="w-full bg-white border-2 border-green-600 text-green-800 hover:bg-green-50" 
            style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}
          >
            REQUEST MONEY
          </button>
          
          <button 
            onClick={() => navigateToPage('pay-bills')}
            className="w-full bg-white border-2 border-purple-600 text-purple-800 hover:bg-purple-50" 
            style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}
          >
            PAY BILLS
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'send-money') {
    return (
      <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
        {renderHeader()}
        {renderAccountBalance()}

        {/* Send Money Form */}
        <div className="space-y-4">
          {/* Recipient */}
          <div className="bg-white border-2 border-blue-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h4 className="text-blue-800 mb-3" style={{ fontWeight: "600" }}>TO:</h4>
            <input 
              type="text" 
              placeholder="Enter recipient's email or phone"
              className="w-full border-2 border-gray-400 bg-gray-50 text-gray-800"
              style={{ padding: "clamp(0.75rem, 4cqw, 1rem)" }}
            />
          </div>

          {/* Amount */}
          <div className="bg-white border-2 border-green-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h4 className="text-green-800 mb-3" style={{ fontWeight: "600" }}>AMOUNT:</h4>
            <input 
              type="text" 
              placeholder="$0.00"
              className="w-full border-2 border-gray-400 bg-gray-50 text-gray-800"
              style={{ padding: "clamp(0.75rem, 4cqw, 1rem)" }}
            />
          </div>

          {/* Note */}
          <div className="bg-white border-2 border-purple-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h4 className="text-purple-800 mb-3" style={{ fontWeight: "600" }}>NOTE (Optional):</h4>
            <textarea 
              placeholder="What's this for?"
              className="w-full border-2 border-gray-400 bg-gray-50 text-gray-800 h-20 resize-none"
              style={{ padding: "clamp(0.75rem, 4cqw, 1rem)" }}
            />
          </div>

          {/* Send Button */}
          <button className="w-full bg-blue-600 text-white border-2 border-blue-800 hover:bg-blue-700" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}>
            SEND MONEY
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'request-money') {
    return (
      <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
        {renderHeader()}
        {renderAccountBalance()}

        {/* Request Money Form */}
        <div className="space-y-4">
          {/* From */}
          <div className="bg-white border-2 border-green-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h4 className="text-green-800 mb-3" style={{ fontWeight: "600" }}>FROM:</h4>
            <input 
              type="text" 
              placeholder="Enter sender's email or phone"
              className="w-full border-2 border-gray-400 bg-gray-50 text-gray-800"
              style={{ padding: "clamp(0.75rem, 4cqw, 1rem)" }}
            />
          </div>

          {/* Amount */}
          <div className="bg-white border-2 border-blue-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h4 className="text-blue-800 mb-3" style={{ fontWeight: "600" }}>AMOUNT:</h4>
            <input 
              type="text" 
              placeholder="$0.00"
              className="w-full border-2 border-gray-400 bg-gray-50 text-gray-800"
              style={{ padding: "clamp(0.75rem, 4cqw, 1rem)" }}
            />
          </div>

          {/* Note */}
          <div className="bg-white border-2 border-purple-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h4 className="text-purple-800 mb-3" style={{ fontWeight: "600" }}>NOTE (Optional):</h4>
            <textarea 
              placeholder="What's this for?"
              className="w-full border-2 border-gray-400 bg-gray-50 text-gray-800 h-20 resize-none"
              style={{ padding: "clamp(0.75rem, 4cqw, 1rem)" }}
            />
          </div>

          {/* Request Button */}
          <button className="w-full bg-green-600 text-white border-2 border-green-800 hover:bg-green-700" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}>
            REQUEST MONEY
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'pay-bills') {
    const bills = [
      { id: 'electric', name: 'Electric Company', amount: 89.47, emoji: '⚡', description: 'Monthly electricity usage' },
      { id: 'gas', name: 'Gas Company', amount: 156.23, emoji: '🔥', description: 'Natural gas service' },
      { id: 'water', name: 'Water Utility', amount: 67.89, emoji: '💧', description: 'Water & sewer services' },
      { id: 'internet', name: 'Internet Provider', amount: 79.99, emoji: '🌐', description: 'High-speed internet' },
      { id: 'credit-card', name: 'Credit Card Payment', amount: 324.56, emoji: '💳', description: 'Monthly minimum payment' },
      { id: 'phone', name: 'Phone Service', amount: 45.00, emoji: '📱', description: 'Mobile phone plan' },
    ];

    const handlePayBill = () => {
      if (selectedBill) {
        setPaidBills(prev => new Set([...prev, selectedBill]));
        setSelectedBill(null);
      }
    };

    return (
      <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
        {renderHeader()}
        {renderAccountBalance()}

        {/* Pay Bills */}
        <div className="space-y-4">
          {/* Bills List */}
          <div className="space-y-3">
            {bills.map((bill) => {
              const isPaid = paidBills.has(bill.id);
              const isSelected = selectedBill === bill.id;
              
              return (
                <div 
                  key={bill.id}
                  onClick={() => !isPaid && setSelectedBill(isSelected ? null : bill.id)}
                  className={`bg-white border-2 cursor-pointer ${
                    isPaid 
                      ? 'border-green-600 bg-green-50' 
                      : isSelected 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-25'
                  }`}
                  style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center" style={{ gap: "clamp(0.75rem, 4cqw, 1rem)" }}>
                      <span style={{ fontSize: "clamp(1.5rem, 6cqw, 2rem)" }}>{bill.emoji}</span>
                      <div>
                        <h4 className={`${isPaid ? 'text-green-800' : isSelected ? 'text-purple-800' : 'text-gray-800'}`} style={{ fontWeight: "600" }}>
                          {bill.name}
                        </h4>
                        <p className="text-gray-600" style={{ fontSize: "clamp(0.875rem, 4cqw, 1rem)" }}>
                          {bill.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`${isPaid ? 'text-green-600' : isSelected ? 'text-purple-600' : 'text-red-600'}`} style={{ fontSize: "clamp(1.125rem, 6cqw, 1.375rem)", fontWeight: "700" }}>
                        ${bill.amount.toFixed(2)}
                      </p>
                      {isPaid && (
                        <p className="text-green-600" style={{ fontSize: "clamp(0.75rem, 3.5cqw, 0.875rem)", fontWeight: "600" }}>
                          PAID ✓
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pay Button */}
          <button 
            onClick={handlePayBill}
            disabled={!selectedBill}
            className={`w-full border-2 ${
              selectedBill 
                ? 'bg-purple-600 text-white border-purple-800 hover:bg-purple-700' 
                : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
            }`}
            style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}
          >
            {selectedBill 
              ? `PAY ${bills.find(b => b.id === selectedBill)?.name.toUpperCase()} - ${bills.find(b => b.id === selectedBill)?.amount.toFixed(2)}`
              : 'SELECT A BILL TO PAY'
            }
          </button>
        </div>
      </div>
    );
  }

  return null;
}