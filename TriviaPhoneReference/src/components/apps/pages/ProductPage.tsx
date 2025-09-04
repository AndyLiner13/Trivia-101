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

interface ProductPageProps {
  product: Product;
  onGoBack: () => void;
  onAddToCart: (productId: string) => void;
  onNavigate: (url: string) => void;
  cartItemCount: number;
}

export function ProductPage({ product, onGoBack, onAddToCart, onNavigate, cartItemCount }: ProductPageProps) {
  return (
    <div className="bg-orange-50 min-h-full" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
      {/* Header */}
      <div className="bg-orange-600 text-white border-2 border-orange-800 mb-4" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
        <div className="flex justify-between items-start mb-3">
          <button onClick={onGoBack} className="border-2 border-white bg-white text-orange-600 hover:bg-orange-100" style={{ padding: "clamp(0.5rem, 3cqw, 0.75rem)", fontWeight: "600" }}>
            BACK
          </button>
          <button 
            onClick={() => onNavigate('checkout')}
            className="border-2 border-white bg-white text-orange-600 hover:bg-orange-100" 
            style={{ padding: "clamp(0.5rem, 3cqw, 0.75rem)", fontWeight: "600" }}
          >
            CART ({cartItemCount})
          </button>
        </div>
        <h1 className="text-white" style={{ fontSize: "clamp(1.25rem, 7cqw, 1.75rem)", fontWeight: "600" }}>
          {product.name}
        </h1>
        <p className="text-orange-100">Category: {product.category}</p>
      </div>

      {/* Product Info */}
      <div className="space-y-4">
        {/* Price */}
        <div className="bg-white border-2 border-green-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <h2 className="text-green-800" style={{ fontWeight: "600" }}>PRICE:</h2>
          <p className="text-green-600" style={{ fontSize: "clamp(1.5rem, 8cqw, 2rem)", fontWeight: "700" }}>
            ${product.price}
          </p>
          {product.originalPrice && (
            <p className="text-red-600">Was: ${product.originalPrice}</p>
          )}
        </div>

        {/* Rating */}
        <div className="bg-white border-2 border-yellow-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <h3 className="text-yellow-800" style={{ fontWeight: "600" }}>RATING:</h3>
          <p className="text-gray-700">{product.rating}/5 stars ({product.reviews} reviews)</p>
        </div>

        {/* Description */}
        <div className="bg-white border-2 border-blue-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <h3 className="text-blue-800" style={{ fontWeight: "600" }}>DESCRIPTION:</h3>
          <p className="text-gray-700">{product.description}</p>
        </div>

        {/* Features */}
        <div className="bg-white border-2 border-purple-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <h3 className="text-purple-800" style={{ fontWeight: "600" }}>FEATURES:</h3>
          <ul className="text-gray-700">
            {product.features.map((feature, index) => (
              <li key={index}>• {feature}</li>
            ))}
          </ul>
        </div>

        {/* Shipping Info */}
        <div className="bg-white border-2 border-gray-600" style={{ padding: "clamp(1rem, 6cqw, 1.5rem)" }}>
          <h3 className="text-gray-800" style={{ fontWeight: "600" }}>SHIPPING & RETURNS:</h3>
          <p className="text-gray-700">• Free shipping on orders over $50</p>
          <p className="text-gray-700">• 30-day return policy</p>
          <p className="text-gray-700">• 1-year warranty included</p>
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