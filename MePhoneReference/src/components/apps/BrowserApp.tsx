import React, { useState } from "react";
import {
  Search,
  Home,
  ArrowLeft,
} from "lucide-react";

// Import page components
import { SearchPage } from "./pages/SearchPage";
import { MeBankWebsite } from "../websites/MeBankWebsite";
import { MeNewsWebsite } from "../websites/MeNewsWebsite";
import { MeShopWebsite } from "../websites/MeShopWebsite";

interface BrowserAppProps {
  onNavigateToHome?: () => void;
  onNavigateBack?: () => void;
}

export function BrowserApp({ onNavigateToHome, onNavigateBack }: BrowserAppProps) {
  const [currentUrl, setCurrentUrl] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cartItems, setCartItems] = useState<{[key: string]: number}>({});

  const navigate = (url: string) => {
    if (url !== currentUrl) {
      // Add current URL to history before navigating
      const newHistory = [...history.slice(0, historyIndex + 1), currentUrl];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length);
      setCurrentUrl(url);
      
      // Reset scroll position to top when navigating
      setTimeout(() => {
        const scrollContainer = document.querySelector('.browser-content');
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }, 0);
    }
  };

  const navigateBack = () => {
    if (history.length > 0 && historyIndex >= 0) {
      const previousUrl = history[historyIndex - 1] || 'search';
      setCurrentUrl(previousUrl);
      setHistoryIndex(historyIndex - 1);
    } else {
      setCurrentUrl('search');
    }
  };

  const getDisplayUrl = (url: string) => {
    if (url === 'search') {
      return 'https://www.browser.com';
    }
    if (url === 'mebank.com') {
      return 'https://www.mebank.com';
    }
    if (url === 'mebank-send') {
      return 'https://www.mebank.com/send';
    }
    if (url === 'mebank-request') {
      return 'https://www.mebank.com/request';
    }
    if (url === 'mebank-bills') {
      return 'https://www.mebank.com/bills';
    }
    if (url === 'meshop.com') {
      return 'https://www.meshop.com';
    }
    if (url === 'menews.com') {
      return 'https://www.menews.com';
    }
    if (url.startsWith('article-')) {
      return `https://www.menews.com/article/${url.replace('article-', '')}`;
    }
    if (url === 'checkout') {
      return 'https://www.meshop.com/cart';
    }
    if (url.startsWith('product-')) {
      return `https://www.meshop.com/product/${url.replace('product-', '')}`;
    }
    return `https://www.${url}`;
  };

  const addToCart = (productId: string) => {
    setCartItems(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      });
    } else {
      setCartItems(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const getCartItemCount = () => {
    return Object.values(cartItems).reduce((sum, count) => sum + count, 0);
  };

  const getTotal = () => {
    // Product data from MeShopWebsite
    const products = [
      { id: 'quest-3', price: 499 }
    ];
    
    return Object.entries(cartItems).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const renderContent = () => {
    if (currentUrl === 'search') {
      return <SearchPage onNavigate={navigate} />;
    }
    
    if (currentUrl === 'mebank.com' || currentUrl.startsWith('mebank-')) {
      return <MeBankWebsite onNavigate={navigate} currentUrl={currentUrl} />;
    }
    
    if (currentUrl === 'menews.com' || currentUrl.startsWith('article-')) {
      return <MeNewsWebsite currentPage={currentUrl} onNavigate={navigate} />;
    }
    
    if (currentUrl === 'meshop.com' || currentUrl.startsWith('product-') || currentUrl === 'checkout') {
      return (
        <MeShopWebsite 
          currentPage={currentUrl}
          onNavigate={navigate}
          onAddToCart={addToCart}
          cartItemCount={getCartItemCount()}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          getTotal={getTotal}
        />
      );
    }
    
    return <div className="p-8 text-center text-gray-500">Page not found</div>;
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Browser Header */}
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
          {currentUrl !== 'search' && (
            <button
              onClick={navigateBack}
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
        <h1 className="font-medium capitalize" style={{ fontSize: 'clamp(1.125rem, 5cqw, 1.375rem)' }}>Browser</h1>
      </div>

      {/* Address Bar */}
      <div className="border-b bg-gray-50" style={{ 
        padding: "clamp(0.75rem, 4cqw, 1.25rem)",
        marginTop: "54px"
      }}>
        <div className="w-full flex items-center gap-3 bg-white rounded border px-4 py-3">
          <Search className="text-gray-400" style={{ width: "clamp(1rem, 5cqw, 1.25rem)", height: "clamp(1rem, 5cqw, 1.25rem)" }} />
          <input
            type="text"
            value={currentUrl === "search" ? (searchQuery || getDisplayUrl(currentUrl)) : getDisplayUrl(currentUrl)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent"
            placeholder="https://www.browser.com"
            style={{ fontSize: "clamp(1rem, 4.5cqw, 1.125rem)" }}
          />
        </div>
      </div>

      {/* Browser Content */}
      <div className="flex-1 overflow-auto browser-content">
        {renderContent()}
      </div>
    </div>
  );
}