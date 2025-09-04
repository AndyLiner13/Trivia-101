import React from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  inStock: boolean;
  category: string;
}

interface CheckoutPageProps {
  cartItems: {[key: string]: number};
  products: Product[];
  onGoBack: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  getTotal: () => number;
}

export function CheckoutPage({ 
  cartItems, 
  products, 
  onGoBack, 
  onUpdateQuantity, 
  onRemoveItem, 
  getTotal 
}: CheckoutPageProps) {
  const cartProducts = Object.entries(cartItems).map(([productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    return product ? { product, quantity } : null;
  }).filter(Boolean) as Array<{ product: Product; quantity: number }>;

  if (cartProducts.length === 0) {
    return (
      <div className="bg-orange-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <div className="bg-orange-600 text-white border-2 border-orange-800 mb-4" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <button onClick={onGoBack} className="border-2 border-white bg-white text-orange-600 mb-2 hover:bg-orange-100" style={{ padding: "clamp(0.5rem, 3cqw, 0.75rem)", fontWeight: "600" }}>
            BACK
          </button>
          <h1 className="text-white" style={{ fontWeight: "600" }}>Shopping Cart</h1>
        </div>
        
        <div className="text-center bg-white border-2 border-orange-600" style={{ padding: "clamp(2rem, 10cqw, 3rem)" }}>
          <h2 className="text-orange-800 mb-2" style={{ fontWeight: "600" }}>YOUR CART IS EMPTY</h2>
          <p className="text-gray-700">Add some products to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
      {/* Header */}
      <div className="bg-orange-600 text-white border-2 border-orange-800 mb-4" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <button onClick={onGoBack} className="border-2 border-white bg-white text-orange-600 mb-2 hover:bg-orange-100" style={{ padding: "clamp(0.5rem, 3cqw, 0.75rem)", fontWeight: "600" }}>
          BACK
        </button>
        <h1 className="text-white" style={{ fontWeight: "600" }}>Shopping Cart ({cartProducts.length} items)</h1>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cartProducts.map(({ product, quantity }) => (
          <div key={product.id} className="bg-white border-2 border-orange-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
            <h3 className="text-orange-800 mb-2" style={{ fontWeight: "600" }}>{product.name}</h3>
            <p className="text-gray-700">Price: <span className="text-green-600" style={{ fontWeight: "600" }}>${product.price}</span></p>
            <p className="text-gray-700">Quantity: <span className="text-blue-600" style={{ fontWeight: "600" }}>{quantity}</span></p>
            <p className="text-gray-700">Subtotal: <span className="text-green-600" style={{ fontWeight: "600" }}>${(product.price * quantity).toFixed(2)}</span></p>
            
            <div className="mt-3 space-x-2">
              <button 
                onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                className="border-2 border-blue-600 bg-blue-100 text-blue-800 hover:bg-blue-200"
                style={{ padding: "clamp(0.25rem, 2cqw, 0.5rem)", fontWeight: "600" }}
              >
                -
              </button>
              <button 
                onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                className="border-2 border-blue-600 bg-blue-100 text-blue-800 hover:bg-blue-200"
                style={{ padding: "clamp(0.25rem, 2cqw, 0.5rem)", fontWeight: "600" }}
              >
                +
              </button>
              <button 
                onClick={() => onRemoveItem(product.id)}
                className="border-2 border-red-600 bg-red-100 text-red-800 hover:bg-red-200"
                style={{ padding: "clamp(0.25rem, 2cqw, 0.5rem)", fontWeight: "600" }}
              >
                REMOVE
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-white border-2 border-green-600 mb-6" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <h3 className="text-green-800 mb-3" style={{ fontWeight: "600" }}>ORDER SUMMARY:</h3>
        
        <div className="space-y-1 mb-4">
          {cartProducts.map(({ product, quantity }) => (
            <div key={product.id} className="text-gray-700">
              {product.name} × {quantity}: <span className="text-green-600" style={{ fontWeight: "600" }}>${(product.price * quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-1 pt-3 border-t-2 border-green-600">
          <p className="text-gray-700">Subtotal: <span className="text-green-600" style={{ fontWeight: "600" }}>${getTotal().toFixed(2)}</span></p>
          <p className="text-gray-700">Shipping: <span className="text-green-600" style={{ fontWeight: "600" }}>FREE</span></p>
          <p className="text-gray-700">Tax: <span className="text-green-600" style={{ fontWeight: "600" }}>${(getTotal() * 0.08).toFixed(2)}</span></p>
          <div className="border-t-2 border-green-600 pt-2 mt-2">
            <p className="text-green-800" style={{ fontSize: "clamp(1.125rem, 6cqw, 1.375rem)", fontWeight: "700" }}>TOTAL: ${(getTotal() * 1.08).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <button 
        className="w-full border-2 border-green-600 bg-green-100 text-green-800 hover:bg-green-200"
        style={{ padding: "clamp(1rem, 6cqw, 1.5rem)", fontWeight: "600" }}
      >
        PROCEED TO CHECKOUT
      </button>

      {/* Security Info */}
      <div className="mt-4 text-center bg-white border-2 border-gray-600" style={{ padding: "clamp(0.75rem, 4cqw, 1rem)" }}>
        <p className="text-gray-700">Secure SSL encryption enabled</p>
      </div>
    </div>
  );
}