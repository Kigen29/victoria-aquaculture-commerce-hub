import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/layout/PageLayout";
import { GoogleAddressAutocomplete } from "@/components/checkout/GoogleAddressAutocomplete";
import { SimpleAddressInput } from "@/components/checkout/SimpleAddressInput";
import { EnhancedDeliveryFeeDisplay } from "@/components/checkout/EnhancedDeliveryFeeDisplay";
import PesapalPaymentFrame from "@/components/checkout/PesapalPaymentFrame";
import { Loader2 } from "lucide-react";

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
  
  // Pesapal-specific states
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showPaymentFrame, setShowPaymentFrame] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  // Delivery-related states
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryZone, setDeliveryZone] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<number>(30);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [formattedDistance, setFormattedDistance] = useState<string>('');

  // Free delivery threshold (similar to market competitors)
  const FREE_DELIVERY_THRESHOLD = 2000;
  
  // VAT rate for Kenya
  const VAT_RATE = 0.16; // 16%

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Populate form data from profile when component loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile, user]);

  // Auto-calculate delivery fee when address is pre-populated from profile
  useEffect(() => {
    if (formData.address && !deliveryZone && !calculatingDelivery) {
      calculateDeliveryFee(formData.address);
    }
  }, [formData.address]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate delivery fee when address changes
  const calculateDeliveryFee = async (address: string, coordinates?: {lat: number, lng: number}) => {
    if (!address.trim()) {
      setDeliveryFee(0);
      setDeliveryZone('');
      setEstimatedTime(30);
      return;
    }

    setCalculatingDelivery(true);

    try {
      const requestData = coordinates 
        ? { address, latitude: coordinates.lat, longitude: coordinates.lng }
        : { address };

      const { data, error } = await supabase.functions.invoke('calculate-delivery-fee', {
        body: requestData
      });

      if (error) {
        console.error('Delivery calculation error:', error);
        toast.error('Failed to calculate delivery fee');
        return;
      }

      if (data.success) {
        const cartTotal = getCartTotal();
        const finalDeliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : data.delivery_fee;
        
        setDeliveryFee(finalDeliveryFee);
        setDeliveryZone(data.zone_name);
        setEstimatedTime(data.estimated_time_mins);
        setFormattedDistance(data.formatted_distance || '');
        
        if (cartTotal >= FREE_DELIVERY_THRESHOLD) {
          toast.success(`Free delivery! (Order above KES ${FREE_DELIVERY_THRESHOLD})`);
        } else {
          toast.success(`Delivery fee: KES ${finalDeliveryFee} (${data.zone_name})`);
        }
      } else {
        toast.error(data.error || 'Failed to calculate delivery fee');
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      toast.error('Error calculating delivery fee');
    } finally {
      setCalculatingDelivery(false);
    }
  };

  const handleAddressSelect = (addressData: any) => {
    setDeliveryCoordinates({ lat: addressData.coordinates.lat, lng: addressData.coordinates.lng });
    calculateDeliveryFee(addressData.address, { lat: addressData.coordinates.lat, lng: addressData.coordinates.lng });
  };


  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please log in to continue with checkout.");
      navigate('/auth');
      return;
    }

    // Validate form fields
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setPaymentProcessing(true);

    try {
      // Prepare order data for Pesapal
      const orderData = {
        user_id: user.id,
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price
        })),
        customer_info: {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        },
        delivery_info: {
          address: formData.address,
          coordinates: deliveryCoordinates,
          fee: deliveryFee,
          zone: deliveryZone,
          estimated_time: estimatedTime
        },
        total_amount: getCartTotal() * (1 + VAT_RATE) + deliveryFee
      };

      console.log('Creating Pesapal order:', orderData);

      // Call Pesapal edge function
      const { data, error } = await supabase.functions.invoke('create-pesapal-order', {
        body: orderData
      });

      // Handle errors with enhanced user-friendly messages
      if (error) {
        console.error('Edge function error:', error);
        
        // Try to extract custom error info from error context
        const errorContext = (error as any).context;
        let errorData = null;
        
        // Parse error body if available
        if (errorContext?.body) {
          try {
            errorData = typeof errorContext.body === 'string' 
              ? JSON.parse(errorContext.body) 
              : errorContext.body;
          } catch (e) {
            console.error('Failed to parse error body:', e);
          }
        }
        
        // Display custom error message if available
        if (errorData && errorData.user_message) {
          const errorMessage = errorData.user_message;
          const errorCode = errorData.error_code || 'UNKNOWN_ERROR';
          
          console.error(`Payment error [${errorCode}]:`, errorData.error);
          
          toast.error(errorMessage, { duration: 8000 });
          
          // Show support contact for critical errors
          if (errorCode === 'TEST_LIMIT_EXCEEDED' || errorCode === 'PAYMENT_GATEWAY_CONFIG_ERROR') {
            setTimeout(() => {
              toast.info(`Need help? Contact us: ${errorData.support_contact || 'support@victoriaaquaculture.com'}`, { 
                duration: 10000 
              });
            }, 1000);
          }
          
          return; // Exit without throwing
        }
        
        // Fallback to generic error
        throw new Error(error.message);
      }

      if (!data.success) {
        // Handle data.success === false case
        const errorMessage = data.user_message || data.error || 'Failed to create payment order';
        const errorCode = data.error_code || 'UNKNOWN_ERROR';
        
        console.error(`Payment error [${errorCode}]:`, data.error);
        toast.error(errorMessage, { duration: 8000 });
        
        if (errorCode === 'TEST_LIMIT_EXCEEDED' || errorCode === 'PAYMENT_GATEWAY_CONFIG_ERROR') {
          setTimeout(() => {
            toast.info(`Need help? Contact us: ${data.support_contact || 'support@victoriaaquaculture.com'}`, { 
              duration: 10000 
            });
          }, 1000);
        }
        
        return; // Exit without throwing
      }

      console.log('Pesapal order created successfully:', data);
      toast.success("Order created! Redirecting to payment...");

      // Set iframe URL and show payment frame
      setIframeUrl(data.iframe_url);
      setOrderId(data.order_id);
      setShowPaymentFrame(true);

    } catch (error) {
      console.error('Checkout error:', error);
      // Error toast already shown above for data.success === false
      // Only show generic error if it's a different type of error
      if (error instanceof Error && !error.message.includes('payment gateway') && !error.message.includes('contact support')) {
        toast.error(error.message || "There was an error processing your checkout. Please try again.");
      }
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentFrame(false);
    setIframeUrl(null);
    setOrderId('');
    toast.error("Payment cancelled. You can try again when ready.");
  };

  const handlePaymentSuccess = () => {
    clearCart();
    toast.success("Payment successful! Thank you for your order.");
    navigate("/order-success", { 
      state: { 
        orderId, 
        message: "Your payment has been processed successfully!" 
      } 
    });
  };

  return (
    <>
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
                      Full Name *
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
                      Email *
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
                      Phone Number *
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
                      Delivery Address *
                    </label>
                    <GoogleAddressAutocomplete
                      value={formData.address}
                      onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                      onAddressSelect={handleAddressSelect}
                    />
                    <EnhancedDeliveryFeeDisplay
                      isCalculating={calculatingDelivery}
                      deliveryFee={deliveryFee}
                      deliveryZone={deliveryZone}
                      estimatedTime={estimatedTime}
                      formattedDistance={formattedDistance}
                      isFreeDelivery={getCartTotal() >= FREE_DELIVERY_THRESHOLD}
                      freeDeliveryThreshold={FREE_DELIVERY_THRESHOLD}
                      cartTotal={getCartTotal()}
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
                      <span>KES {(Number(product.price) * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold mb-2">
                    <span>Subtotal</span>
                    <span>KES {getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>VAT (16%)</span>
                    <span>KES {(getCartTotal() * VAT_RATE).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee > 0 ? "text-orange-600 font-medium" : getCartTotal() >= FREE_DELIVERY_THRESHOLD ? "text-green-600 font-medium line-through" : ""}>
                      {deliveryFee === 0 && deliveryZone && getCartTotal() >= FREE_DELIVERY_THRESHOLD ? (
                        <>
                          <span className="line-through text-gray-400 mr-2">KES {deliveryFee > 0 ? deliveryFee.toFixed(2) : '60.00'}</span>
                          <span className="text-green-600 font-medium">FREE</span>
                        </>
                      ) : deliveryFee > 0 ? (
                        `KES ${deliveryFee.toFixed(2)}`
                      ) : (
                        'Calculating...'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-4">
                    <span>Total</span>
                    <span>KES {(getCartTotal() * (1 + VAT_RATE) + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-6" 
                  size="lg" 
                  onClick={handleCheckout}
                  disabled={paymentProcessing || !formData.fullName || !formData.email || !formData.phone || !formData.address}
                >
                  {paymentProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    "Pay with Pesapal"
                  )}
                </Button>
                
                <div className="mt-4 text-xs text-center text-gray-500">
                  <p>Secure payment powered by Pesapal</p>
                  <p className="mt-1">By placing your order, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </PageLayout>

      {/* Pesapal Payment Frame Modal */}
      {showPaymentFrame && iframeUrl && (
        <PesapalPaymentFrame
          iframeUrl={iframeUrl}
          onCancel={handlePaymentCancel}
          orderId={orderId}
          amount={getCartTotal() * (1 + VAT_RATE) + deliveryFee}
        />
      )}
    </>
  );
}