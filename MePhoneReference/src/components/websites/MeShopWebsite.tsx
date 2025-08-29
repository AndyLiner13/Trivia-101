import React from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  inStock: boolean;
  category: string;
}

const products: Product[] = [
  {
    id: 'quest-3',
    name: 'Meta Quest 3',
    price: 499,
    originalPrice: 549,
    image: 'bg-gradient-to-br from-blue-400 to-blue-600',
    rating: 4.8,
    reviews: 2847,
    description: 'Immersive mixed reality headset with breakthrough technology for gaming and productivity.',
    features: ['Mixed Reality', '4K+ Display', 'Touch Plus Controllers', '128GB Storage', 'Wireless'],
    inStock: true,
    category: 'VR/AR'
  }
];

interface MeShopWebsiteProps {
  currentPage: string;
  onNavigate: (url: string) => void;
  onAddToCart: (productId: string) => void;
  cartItemCount: number;
  cartItems: {[key: string]: number};
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  getTotal: () => number;
}

export function MeShopWebsite({ 
  currentPage,
  onNavigate, 
  onAddToCart, 
  cartItemCount, 
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  getTotal
}: MeShopWebsiteProps) {
  
  // Main retail page
  if (currentPage === 'meshop.com') {
    return (
      <div className="bg-orange-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
        {/* Header */}
        <div className="bg-orange-600 text-white border-2 border-orange-800 mb-6 flex justify-between items-center" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <div>
            <h1 className="text-white" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "600" }}>🛒 MeShop</h1>
            <p className="text-orange-100">Online Shopping Store</p>
          </div>
          <button 
            onClick={() => onNavigate('checkout')}
            className="border-2 border-white bg-white text-orange-600 hover:bg-orange-100" 
            style={{ padding: "clamp(0.5rem, 3cqw, 0.75rem)", fontWeight: "600" }}
          >
            CART ({cartItemCount})
          </button>
        </div>

        {/* Products */}
        <div className="space-y-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white border-2 border-orange-600 hover:bg-orange-50" 
              style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}
            >
              <div 
                className="cursor-pointer"
                onClick={() => onNavigate(`product-${product.id}`)}
              >
                <h3 className="text-orange-800" style={{ fontSize: "clamp(1rem, 6cqw, 1.25rem)", fontWeight: "600" }}>{product.name}</h3>
                <p className="text-gray-700">{product.description}</p>
                <p className="text-green-600" style={{ fontSize: "clamp(1.125rem, 6cqw, 1.375rem)", fontWeight: "700" }}>${Math.round(product.price)}</p>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product.id);
                }}
                className={`border-2 mt-3 ${product.inStock ? 'border-green-600 bg-green-100 text-green-800 hover:bg-green-200' : 'border-gray-400 bg-gray-300 text-gray-600'}`}
                style={{ padding: "clamp(0.5rem, 3cqw, 0.75rem)", fontWeight: "600" }}
                disabled={!product.inStock}
              >
                {product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
              </button>
            </div>
          ))}
        </div>

      </div>
    );
  }

  // Product page
  if (currentPage.startsWith('product-')) {
    const productId = currentPage.replace('product-', '');
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return <div className="p-8 text-center text-gray-500">Product not found</div>;
    }

    return (
      <div className="bg-orange-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
        {/* Header */}
        <div className="bg-orange-600 text-white border-2 border-orange-800 mb-4" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-white break-words" style={{ fontSize: "clamp(1.25rem, 7cqw, 1.75rem)", fontWeight: "600" }}>
                {product.name}
              </h1>
              <p className="text-orange-100">Category: {product.category}</p>
            </div>
            <button 
              onClick={() => onNavigate('checkout')}
              className="border-2 border-white bg-white text-orange-600 hover:bg-orange-100 flex-shrink-0" 
              style={{ padding: "clamp(0.5rem, 3cqw, 0.75rem)", fontWeight: "600" }}
            >
              CART ({cartItemCount})
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          {/* Price */}
          <div className="bg-white border-2 border-green-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h2 className="text-green-800" style={{ fontWeight: "600" }}>PRICE:</h2>
            <p className="text-green-600" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "700" }}>
              ${Math.round(product.price)}
            </p>
          </div>

          {/* Description */}
          <div className="bg-white border-2 border-blue-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h3 className="text-blue-800" style={{ fontWeight: "600" }}>DESCRIPTION:</h3>
            <p className="text-gray-700">{product.description}</p>
          </div>

          {/* Add to Cart */}
          <button 
            onClick={() => onAddToCart(product.id)}
            disabled={!product.inStock}
            className={`w-full border-2 ${product.inStock ? 'border-green-600 bg-green-100 text-green-800 hover:bg-green-200' : 'border-gray-400 bg-gray-300 text-gray-600'}`}
            style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}
          >
            {product.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
          </button>
        </div>
      </div>
    );
  }

  // Checkout page
  if (currentPage === 'checkout') {
    return (
      <div className="bg-orange-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", paddingTop: "clamp(2rem, 8cqw, 2.5rem)" }}>
        {/* Header */}
        <div className="bg-orange-600 text-white border-2 border-orange-800 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <h1 className="text-white" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "600" }}>🛒 Shopping Cart</h1>
        </div>

        {Object.keys(cartItems).length === 0 ? (
          <div className="bg-white border-2 border-gray-600 text-center" style={{ padding: "clamp(2rem, 10cqw, 3rem)" }}>
            <h2 className="text-gray-800 mb-2" style={{ fontWeight: "600" }}>Your cart is empty</h2>
            <p className="text-gray-600">Add some products to get started!</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {Object.entries(cartItems).map(([productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                if (!product) return null;

                return (
                  <div key={productId} className="bg-white border-2 border-orange-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-orange-800" style={{ fontWeight: "600" }}>{product.name}</h3>
                      <button 
                        onClick={() => onRemoveItem(productId)}
                        className="text-red-600 hover:bg-red-50 border border-red-600"
                        style={{ padding: "clamp(0.25rem, 1cqw, 0.5rem)", fontWeight: "600" }}
                      >
                        REMOVE
                      </button>
                    </div>
                    <p className="text-gray-700 mb-2">${Math.round(product.price)} each</p>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateQuantity(productId, quantity - 1)}
                        className="border-2 border-gray-600 bg-gray-100 text-gray-800 hover:bg-gray-200"
                        style={{ padding: "clamp(0.25rem, 1cqw, 0.5rem)", fontWeight: "600" }}
                      >
                        -
                      </button>
                      <span className="text-gray-800" style={{ fontWeight: "600" }}>Qty: {quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(productId, quantity + 1)}
                        className="border-2 border-gray-600 bg-gray-100 text-gray-800 hover:bg-gray-200"
                        style={{ padding: "clamp(0.25rem, 1cqw, 0.5rem)", fontWeight: "600" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="bg-white border-2 border-green-600 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
              <div className="flex justify-between">
                <span className="text-green-800" style={{ fontSize: "clamp(1.125rem, 6cqw, 1.375rem)", fontWeight: "600" }}>Total:</span>
                <span className="text-green-600" style={{ fontSize: "clamp(1.125rem, 6cqw, 1.375rem)", fontWeight: "700" }}>
                  ${Math.round(getTotal())}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button className="w-full bg-green-600 text-white border-2 border-green-800 hover:bg-green-700" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}>
              PROCEED TO CHECKOUT
            </button>
          </>
        )}
      </div>
    );
  }

  return <div className="p-8 text-center text-gray-500">Page not found</div>;
}