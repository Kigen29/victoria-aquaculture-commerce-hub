
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Trash, 
  MinusCircle, 
  PlusCircle, 
  ShoppingBasket, 
  ArrowLeft, 
  ShoppingCart 
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

// Fish and chicken images to use as fallbacks
const fishImages = [
  "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&q=80&w=500", // Fish 1
  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=500", // Fish 2
];

const chickenImages = [
  "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=500", // Chicken 1
  "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=500", // Chicken 2
];

// Function to get appropriate image based on product category
const getProductImage = (product: any) => {
  if (product.image_url) return product.image_url;
  
  const category = product.category?.toLowerCase();
  
  // Select random image based on category
  if (category === 'fish') {
    const randomIndex = Math.floor(Math.random() * fishImages.length);
    return fishImages[randomIndex];
  } else if (category === 'chicken') {
    const randomIndex = Math.floor(Math.random() * chickenImages.length);
    return chickenImages[randomIndex];
  }
  
  // Default image if no category or unknown
  return fishImages[0];
};

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  // Handle quantity updates with debounce effect
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setIsUpdating(prev => ({ ...prev, [productId]: true }));
    updateQuantity(productId, newQuantity);
    setTimeout(() => {
      setIsUpdating(prev => ({ ...prev, [productId]: false }));
    }, 300);
  };

  // Navigate to checkout
  const handleCheckout = () => {
    if (user) {
      navigate("/checkout");
    } else {
      navigate("/auth", { state: { redirectTo: "/checkout" } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(({ product, quantity }) => (
                <div 
                  key={product.id}
                  className="flex flex-col sm:flex-row border rounded-lg p-4 gap-4 animate-fade-in"
                >
                  <div className="sm:w-24 h-24 w-full">
                    <img 
                      src={getProductImage(product)} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-aqua-700 font-bold">${Number(product.price).toFixed(2)}</p>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{product.description}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleQuantityChange(product.id, quantity - 1)}
                        disabled={isUpdating[product.id]}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      
                      <span className="w-8 text-center">{quantity}</span>
                      
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleQuantityChange(product.id, quantity + 1)}
                        disabled={isUpdating[product.id] || quantity >= product.stock}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeFromCart(product.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="border rounded-lg p-6 sticky top-20">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span>{product.name} × {quantity}</span>
                      <span>${(Number(product.price) * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  <ShoppingBasket className="mr-2 h-5 w-5" />
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added any products to your cart yet.</p>
            <Button asChild>
              <Link to="/shop">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
