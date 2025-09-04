import React from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
}

const products: Product[] = [
  {
    id: 'laptop-pro',
    name: 'UltraBook Pro 15"',
    price: 1299.99,
    description: 'Professional laptop computer',
    inStock: true
  },
  {
    id: 'smart-watch',
    name: 'FitTrack Pro Series 8',
    price: 399.99,
    description: 'Fitness tracking watch',
    inStock: true
  },
  {
    id: 'headphones',
    name: 'AirSound Pro Max',
    price: 279.99,
    description: 'Wireless headphones',
    inStock: true
  },
  {
    id: 'phone-case',
    name: 'Guardian Case Pro',
    price: 39.99,
    description: 'Phone protection case',
    inStock: true
  },
  {
    id: 'tablet',
    name: 'CreativeTab Pro 12.9"',
    price: 899.99,
    description: 'Digital tablet device',
    inStock: false
  },
  {
    id: 'speaker',
    name: 'SoundWave 360',
    price: 199.99,
    description: 'Wireless speaker',
    inStock: true
  }
];

interface RetailPageProps {
  onNavigate: (url: string) => void;
  onAddToCart: (productId: string) => void;
  cartItemCount: number;
}

export function RetailPage({ onNavigate, onAddToCart, cartItemCount }: RetailPageProps) {
  return (
    <div className="bg-orange-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
      {/* Header */}
      <div className="bg-orange-600 text-white border-2 border-orange-800 mb-6 flex justify-between items-center" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <div>
          <h1 className="text-white" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "600" }}>MeShop</h1>
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
      <h2 className="text-orange-800 mb-4" style={{ fontWeight: "600" }}>Products:</h2>
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
              <p className="text-green-600" style={{ fontSize: "clamp(1.125rem, 6cqw, 1.375rem)", fontWeight: "700" }}>${product.price}</p>
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

      {/* Footer */}
      <div className="mt-6 border-t-2 border-orange-600 bg-white" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <p className="text-gray-600">© 2024 MeShop. All rights reserved.</p>
      </div>
    </div>
  );
}