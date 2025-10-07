
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, X, Shield, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrderTracking } from '@/hooks/useOrderTracking';

interface PesapalPaymentFrameProps {
  iframeUrl: string;
  onCancel: () => void;
  orderId: string;
  amount: number;
}

const PesapalPaymentFrame = ({ 
  iframeUrl, 
  onCancel, 
  orderId, 
  amount 
}: PesapalPaymentFrameProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showManualCheck, setShowManualCheck] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();

  // Track order status in real-time
  const { orderStatus, isPaymentCompleted, isPaymentFailed } = useOrderTracking({
    orderId,
    enablePolling: true,
    pollingInterval: 2000, // Check every 2 seconds for faster detection
    onPaymentSuccess: (status) => {
      console.log('✅ Payment successful detected via tracking:', status);
      if (!paymentCompleted) {
        setPaymentCompleted(true);
        // Immediate redirect for better UX
        setTimeout(() => {
          navigate(`/order-success`, { state: { orderId } });
        }, 1500);
      }
    },
    onPaymentFailure: (status) => {
      console.log('❌ Payment failed detected via tracking:', status);
      setError('Payment failed. Please try again.');
    }
  });

  // Monitor iframe for payment completion indicators
  useEffect(() => {
    const checkPaymentCompletion = () => {
      try {
        if (iframeRef.current?.contentWindow) {
          const iframeLocation = iframeRef.current.contentWindow.location;
          const url = iframeLocation.href;
          
          // Enhanced detection patterns for Pesapal success indicators
          const successIndicators = [
            'OrderTrackingId',
            'payment-successful',
            'transaction-complete',
            'payment-receipt',
            'success',
            'completed'
          ];
          
          const hasSuccessIndicator = successIndicators.some(indicator => 
            url.toLowerCase().includes(indicator.toLowerCase())
          );
          
          if (hasSuccessIndicator && !paymentCompleted) {
            console.log('🎉 Payment completion detected in iframe URL:', url);
            setPaymentCompleted(true);
            
            // Quick redirect with minimal delay
            setTimeout(() => {
              navigate(`/order-success`, { state: { orderId } });
            }, 1000);
          }
        }
      } catch (error) {
        // Cross-origin restrictions are expected - this is normal
        console.log('Iframe URL check blocked by CORS (expected)');
      }
    };

    // Check more frequently for faster detection
    const interval = setInterval(checkPaymentCompletion, 1500);
    return () => clearInterval(interval);
  }, [orderId, navigate, paymentCompleted]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check - only accept messages from Pesapal domain
      if (!event.origin.includes('pesapal.com')) return;

      console.log('Received message from iframe:', event.data);

      // Handle payment completion messages
      if (event.data?.status === 'completed' || event.data?.type === 'payment_completed') {
        setPaymentCompleted(true);
        setTimeout(() => {
          navigate(`/order-success`, { state: { orderId } });
        }, 2000);
      } else if (event.data?.status === 'failed' || event.data?.type === 'payment_failed') {
        setError('Payment failed. Please try again.');
      } else if (event.data?.status === 'cancelled' || event.data?.type === 'payment_cancelled') {
        onCancel();
      }
    };

    // Listen for messages from the iframe
    window.addEventListener('message', handleMessage);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [orderId, navigate, onCancel]);

  // Auto-redirect on successful payment detection from order tracking
  useEffect(() => {
    if (isPaymentCompleted && !paymentCompleted) {
      console.log('🚀 Auto-redirecting due to payment completion');
      setPaymentCompleted(true);
      setTimeout(() => {
        navigate(`/order-success`, { state: { orderId } });
      }, 1000); // Faster redirect
    }
  }, [isPaymentCompleted, orderId, navigate, paymentCompleted]);

  // Enhanced backup redirect mechanism
  useEffect(() => {
    if (orderStatus?.pesapalStatus === 'COMPLETED' && !paymentCompleted) {
      console.log('🎯 Backup redirect triggered by order status');
      setPaymentCompleted(true);
      setTimeout(() => {
        navigate(`/order-success`, { state: { orderId } });
      }, 500);
    }
  }, [orderStatus, orderId, navigate, paymentCompleted]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load payment page. Please try again.');
  };

  // Show manual check button after 30 seconds if payment not completed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!paymentCompleted && !isPaymentCompleted) {
        setShowManualCheck(true);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [paymentCompleted, isPaymentCompleted]);

  const handleManualStatusCheck = async () => {
    setIsCheckingStatus(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('sync-payment-status', {
        body: { orderIds: [orderId] }
      });

      if (error) throw error;

      const result = data?.results?.[0];
      if (result?.updated && result?.newStatus === 'COMPLETED') {
        setPaymentCompleted(true);
        setTimeout(() => {
          navigate(`/order-success`, { state: { orderId } });
        }, 1000);
      } else if (result?.status === 'COMPLETED' || result?.newStatus === 'COMPLETED') {
        setPaymentCompleted(true);
        setTimeout(() => {
          navigate(`/order-success`, { state: { orderId } });
        }, 1000);
      } else {
        setError('Payment is still pending. Please complete the payment or try again.');
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setError('Failed to check payment status. Please try again.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  if (paymentCompleted || isPaymentCompleted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">
              Payment Successful!
            </h3>
            <p className="text-muted-foreground mb-4">
              Your payment has been processed successfully. Redirecting...
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Redirecting to confirmation page...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">Secure Payment</h3>
              <p className="text-sm opacity-90">Order #{orderId} - KES {amount.toLocaleString()}</p>
              {orderStatus && (
                <p className="text-xs opacity-75">
                  Status: {orderStatus.pesapalStatus || 'PENDING'}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                <p className="text-sm text-muted-foreground">Loading secure payment page...</p>
              </div>
            </div>
          )}

          {(error || isPaymentFailed) && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">Payment Error</h3>
                <p className="text-muted-foreground mb-4">{error || 'Payment processing failed'}</p>
                <div className="flex space-x-3 justify-center">
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-[70vh] border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Pesapal Payment"
            sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation allow-popups"
          />

          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secured by Pesapal</span>
              </div>
              <div className="flex items-center space-x-2">
                {showManualCheck && !paymentCompleted && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleManualStatusCheck}
                    disabled={isCheckingStatus}
                  >
                    {isCheckingStatus ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Payment Complete?'
                    )}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  Cancel Payment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PesapalPaymentFrame;
