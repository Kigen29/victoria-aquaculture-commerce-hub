
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";

// Add Paystack types
declare global {
  interface Window {
    PaystackPop: {
      setup(config: PaystackConfig): {
        openIframe(): void;
      };
    };
  }
}

type PaystackConfig = {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  ref?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  label?: string;
  metadata?: Record<string, any>;
  onClose?: () => void;
  callback?: (response: any) => void;
};

// Fish and chicken images to use as fallbacks
const fishImages = [
  "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=500",
];

const chickenImages = [
  "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=500",
  "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=500",
];

// Function to get appropriate image based on product category
const getProductImage = (product: any) => {
  if (product.image_url) return product.image_url;
  
  const category = product.category?.toLowerCase();
  
  if (category === 'fish') {
    const randomIndex = Math.floor(Math.random() * fishImages.length);
    return fishImages[randomIndex];
  } else if (category === 'chicken') {
    const randomIndex = Math.floor(Math.random() * chickenImages.length);
    return chickenImages[randomIndex];
  }
  
  return fishImages[0];
};

export default function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  // Load Paystack script
  useEffect(() => {
    // Check if Paystack is already loaded
    if (window.PaystackPop) {
      setPaystackLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    
    script.onload = () => {
      setPaystackLoaded(true);
      console.log("Paystack script loaded successfully");
    };
    
    script.onerror = () => {
      console.error("Failed to load Paystack script");
      toast.error("Payment gateway failed to load. Please refresh the page.");
    };
    
    document.body.appendChild(script);

    return () => {
      // Clean up script only if we added it
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createOrder = async (reference: string) => {
    try {
      // First create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          total_amount: getCartTotal(),
          status: 'paid',
          payment_reference: reference
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Then create all the order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update customer profile information if needed
      if (profile && (
          profile.phone !== formData.phone ||
          profile.address !== formData.address ||
          profile.full_name !== formData.fullName
        )) {
        await supabase
          .from('profiles')
          .update({
            phone: formData.phone,
            address: formData.address,
            full_name: formData.fullName
          })
          .eq('id', user!.id);
      }

      return order.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const handleCheckout = () => {
    if (isProcessing || !paystackLoaded) {
      if (!paystackLoaded) {
        toast.error("Payment gateway is still loading. Please wait.");
      }
      return;
    }
    
    if (!window.PaystackPop) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      return;
    }
    
    // Validate form fields
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Initialize Paystack payment
      const reference = `order_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const amount = Math.round(getCartTotal() * 100); // Paystack amount is in kobo (cents)
      
      console.log("Initializing Paystack with:", {
        email: formData.email,
        amount,
        reference
      });
      
      // Use actual Paystack public key for your account
      // Replace this with your real Paystack public key
      const paystack = window.PaystackPop.setup({
        key: "pk_test_a256c089716ea27c62566facf11a7df853debcfb", // Replace with your Paystack public key
        email: formData.email,
        amount: amount,
        currency: "NGN",
        ref: reference,
        firstname: formData.fullName.split(' ')[0],
        lastname: formData.fullName.split(' ').slice(1).join(' '),
        phone: formData.phone,
        metadata: {
          custom_fields: [
            {
              display_name: "Address",
              variable_name: "address",
              value: formData.address,
            },
            {
              display_name: "Cart Items",
              variable_name: "cart_items",
              value: JSON.stringify(cartItems.map(item => ({
                name: item.product.name,
                quantity: item.quantity
              })))
            }
          ]
        },
        callback: async (response) => {
          try {
            console.log("Payment successful:", response);
            toast.success("Payment successful!");
            
            // Create order in database
            const orderId = await createOrder(response.reference);
            
            // Clear cart and navigate to success page
            clearCart();
            navigate("/order-success", { state: { orderId, reference: response.reference } });
          } catch (error) {
            console.error("Error processing order:", error);
            toast.error("Payment was successful but we couldn't create your order. Please contact support.");
            setIsProcessing(false);
          }
        },
        onClose: () => {
          console.log("Payment closed or canceled");
          setIsProcessing(false);
          toast.info("Payment canceled");
        }
      });
      
      // Open the Paystack payment dialog
      paystack.openIframe();
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error("Payment failed to initialize. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <PageLayout>
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="border rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-1">
                    Full Name
                  </label>
                  <Input 
                    id="fullName" 
                    name="fullName" 
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <Input 
                    id="phone" 
                    name="phone"
                    placeholder="+254 700 000 000"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-1">
                    Delivery Address
                  </label>
                  <Input 
                    id="address" 
                    name="address"
                    placeholder="123 Main St, Nairobi, Kenya"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 sticky top-20">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="max-h-80 overflow-y-auto mb-4">
                {cartItems.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-sm py-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 mr-2">
                        <img 
                          src={getProductImage(product)} 
                          alt={product.name} 
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div>
                        <span>{product.name} × {quantity}</span>
                      </div>
                    </div>
                    <span>${(Number(product.price) * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold mb-2">
                  <span>Subtotal</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-4">
                  <span>Total</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-6" 
                size="lg" 
                onClick={handleCheckout}
                disabled={isProcessing || !formData.fullName || !formData.email || !formData.phone || !formData.address}
              >
                {isProcessing ? "Processing..." : "Pay Now"}
              </Button>
              
              <div className="mt-4 text-xs text-center text-gray-500">
                <p>By placing your order, you agree to our Terms of Service and Privacy Policy.</p>
              </div>
              
              {!paystackLoaded && (
                <div className="mt-3 text-amber-500 text-center text-xs">
                  Payment gateway is loading...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}
