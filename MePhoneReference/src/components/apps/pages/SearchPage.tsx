import React from 'react';

interface SearchPageProps {
  onNavigate: (url: string) => void;
}

export function SearchPage({ onNavigate }: SearchPageProps) {
  return (
    <div className="bg-purple-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>

      
      <div className="space-y-4">
        <div 
          className="bg-white border-2 border-blue-600 cursor-pointer hover:bg-blue-50" 
          style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }} 
          onClick={() => onNavigate("mebank.com")}
        >
          <h3 className="text-blue-800 mb-2" style={{ fontWeight: "600" }}>🏦 MeBank - Secure Banking</h3>
          <p className="text-green-600 mb-2" style={{ fontWeight: "600" }}>https://www.mebank.com</p>
          <p className="text-gray-700">Manage accounts, transfer money, and pay bills securely online.</p>
        </div>

        <div 
          className="bg-white border-2 border-orange-600 cursor-pointer hover:bg-orange-50" 
          style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }} 
          onClick={() => onNavigate("meshop.com")}
        >
          <h3 className="text-orange-800 mb-2" style={{ fontWeight: "600" }}>🛒 MeShop - Electronics Store</h3>
          <p className="text-green-600 mb-2" style={{ fontWeight: "600" }}>https://www.meshop.com</p>
          <p className="text-gray-700">Latest electronics and accessories with fast shipping.</p>
        </div>

        <div 
          className="bg-white border-2 border-blue-600 cursor-pointer hover:bg-blue-50" 
          style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }} 
          onClick={() => onNavigate("menews.com")}
        >
          <h3 className="text-blue-800 mb-2" style={{ fontWeight: "600" }}>📰 MeNews - Breaking News</h3>
          <p className="text-green-600 mb-2" style={{ fontWeight: "600" }}>https://www.menews.com</p>
          <p className="text-gray-700">Latest breaking news and current events from around the world.</p>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-500">that's all folks! 😳</p>
        </div>
      </div>
    </div>
  );
}