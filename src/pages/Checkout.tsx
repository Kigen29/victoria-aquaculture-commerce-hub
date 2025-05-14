
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

export default function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
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
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
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
          status: 'paid'
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

      return order.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  const handleCheckout = () => {
    if (isProcessing) return;
    
    if (!window.PaystackPop) {
      toast.error("Payment gateway not loaded. Please try again.");
      return;
    }
    
    setIsProcessing(true);

    try {
      const paystack = window.PaystackPop.setup({
        key: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // Replace with your Paystack public key
        email: formData.email,
        amount: Math.round(getCartTotal() * 100), // Paystack amount is in kobo, so multiply by 100
        currency: "NGN",
        ref: `order_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        firstname: formData.fullName.split(' ')[0],
        lastname: formData.fullName.split(' ').slice(1).join(' '),
        phone: formData.phone,
        metadata: {
          custom_fields: [
            {
              display_name: "Address",
              variable_name: "address",
              value: formData.address,
            }
          ]
        },
        callback: async (response) => {
          try {
            const orderId = await createOrder(response.reference);
            clearCart();
            navigate("/order-success", { state: { orderId } });
          } catch (error) {
            toast.error("Payment was successful but we couldn't create your order. Please contact support.");
            setIsProcessing(false);
          }
        },
        onClose: () => {
          setIsProcessing(false);
          toast.info("Payment canceled");
        }
      });
      paystack.openIframe();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container py-8">
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
                          src={product.image_url || "/placeholder.svg"} 
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
