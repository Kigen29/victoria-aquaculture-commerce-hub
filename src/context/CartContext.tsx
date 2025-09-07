
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

// Define product type from our database schema
type Product = Tables<"products">;

// Define cart item type
export type CartItem = {
  product: Product;
  quantity: number;
};

// Define cart context type
type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
};

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cartItems]);

  // Enhanced cart clearing with localStorage cleanup
  const clearCart = useCallback(() => {
    console.log("🛒 Clearing cart - current items:", cartItems.length);
    setCartItems([]);
    
    // Explicitly clear localStorage as a backup
    try {
      localStorage.removeItem('cart');
      console.log("✅ Cart cleared from localStorage");
    } catch (error) {
      console.error("❌ Failed to clear cart from localStorage:", error);
    }
    
    // Verify clearing worked
    setTimeout(() => {
      const remainingItems = JSON.parse(localStorage.getItem('cart') || '[]');
      if (remainingItems.length > 0) {
        console.warn("⚠️ Cart still has items in localStorage after clearing, forcing removal");
        localStorage.removeItem('cart');
      }
    }, 100);
  }, [cartItems.length]);

  // Subscribe to payment completion events for cart clearing
  useEffect(() => {
    if (!user?.id) return;

    console.log(`🔔 CartContext: Setting up payment subscription for user ${user.id}`);

    const channel = supabase
      .channel(`cart-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pesapal_transactions'
        },
        async (payload) => {
          console.log("🎉 CartContext: Payment transaction update received", payload.new);
          
          try {
            if (payload.new.status === 'COMPLETED') {
              // Verify this transaction belongs to the current user
              const { data: order, error } = await supabase
                .from('orders')
                .select('user_id')
                .eq('pesapal_transaction_id', payload.new.id)
                .single();

              if (error) {
                console.error("❌ CartContext: Error fetching order:", error);
                return;
              }
                
              if (order?.user_id === user.id) {
                console.log("✅ CartContext: Clearing cart for completed payment");
                clearCart();
                toast.success("Payment completed! Cart cleared.");
              } else {
                console.log("ℹ️ CartContext: Payment belongs to different user, ignoring");
              }
            }
          } catch (error) {
            console.error("❌ CartContext: Error processing payment update:", error);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 CartContext subscription status: ${status}`);
      });

    return () => {
      console.log("🧹 CartContext: Cleaning up payment subscription");
      supabase.removeChannel(channel);
    };
  }, [user?.id, clearCart]);

  // Add item to cart
  const addToCart = (product: Product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { product, quantity }];
      }
    });
    
    toast.success(`${product.name} added to cart!`);
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  // Update quantity of an item
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Get total number of items in cart
  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Get total price of all items in cart
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartCount,
      getCartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
