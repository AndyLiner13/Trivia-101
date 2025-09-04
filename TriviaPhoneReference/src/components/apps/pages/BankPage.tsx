import React from 'react';

interface BankPageProps {
  onSendMoney: () => void;
  onReceiveMoney: () => void;
}

export function BankPage({ onSendMoney, onReceiveMoney }: BankPageProps) {
  return (
    <div className="bg-blue-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
      {/* Header */}
      <div className="bg-blue-600 text-white border-2 border-blue-800 mb-4" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <h1 className="text-white" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "600" }}>MeBank</h1>
        <p className="text-blue-100">Online Banking Portal</p>
      </div>
      
      {/* Balance Display */}
      <div className="bg-white border-2 border-blue-600 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <p className="text-blue-800">Account Balance:</p>
        <h2 className="text-green-600" style={{ fontSize: "clamp(1.75rem, 9cqw, 2.5rem)", fontWeight: "700" }}>$12,543.89</h2>
        <p className="text-green-700">Status: ACTIVE</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={onSendMoney}
          className="border-2 border-red-600 bg-red-100 text-red-800 w-full hover:bg-red-200" 
          style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}
        >
          SEND MONEY
        </button>
        
        <button
          onClick={onReceiveMoney}
          className="border-2 border-green-600 bg-green-100 text-green-800 w-full hover:bg-green-200" 
          style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}
        >
          RECEIVE MONEY
        </button>
      </div>

      {/* Account Info */}
      <div className="mt-6 bg-white border-2 border-blue-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <h3 className="text-blue-800" style={{ fontWeight: "600" }}>Account Information</h3>
        <p className="text-gray-700">Account Number: ****1234</p>
        <p className="text-gray-700">Routing Number: 123456789</p>
        <p className="text-gray-700">Account Type: Checking</p>
      </div>
    </div>
  );
}