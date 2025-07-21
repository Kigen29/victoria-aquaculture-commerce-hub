
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag, Home, Clock, AlertCircle } from "lucide-react";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { Badge } from "@/components/ui/badge";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};

  const { orderStatus, loading, isPaymentPending, isPaymentCompleted, isPaymentFailed } = useOrderTracking({
    orderId: orderId || '',
    enablePolling: true,
    onPaymentSuccess: () => {
      // Could trigger additional success actions here
    },
    onPaymentFailure: () => {
      // Could trigger failure handling here
    }
  });

  // Redirect if accessed directly without an order ID
  useEffect(() => {
    if (!orderId) {
      navigate("/");
    }
  }, [orderId, navigate]);

  if (!orderId) {
    return null; // Don't render anything while redirecting
  }

  const getPaymentStatusIcon = () => {
    if (isPaymentCompleted) return <CheckCircle className="h-16 w-16 text-green-500" />;
    if (isPaymentFailed) return <AlertCircle className="h-16 w-16 text-red-500" />;
    return <Clock className="h-16 w-16 text-yellow-500" />;
  };

  const getPaymentStatusBadge = () => {
    if (loading) return <Badge variant="secondary">Checking...</Badge>;
    if (isPaymentCompleted) return <Badge variant="default" className="bg-green-500">Payment Completed</Badge>;
    if (isPaymentFailed) return <Badge variant="destructive">Payment Failed</Badge>;
    if (isPaymentPending) return <Badge variant="secondary">Payment Pending</Badge>;
    return <Badge variant="outline">Processing</Badge>;
  };

  const getTitle = () => {
    if (isPaymentCompleted) return "Payment Successful!";
    if (isPaymentFailed) return "Payment Failed";
    if (isPaymentPending) return "Payment Processing";
    return "Order Received";
  };

  const getDescription = () => {
    if (isPaymentCompleted) return "Your payment has been processed successfully and your order is confirmed.";
    if (isPaymentFailed) return "There was an issue processing your payment. Please try again or contact support.";
    if (isPaymentPending) return "Your payment is being processed. This page will update automatically when complete.";
    return "Thank you for your purchase. Your order has been received and is now being processed.";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex justify-center">
            {getPaymentStatusIcon()}
          </div>
          
          <div className="mb-4 flex justify-center">
            {getPaymentStatusBadge()}
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{getTitle()}</h1>
          <p className="text-muted-foreground mb-6">
            {getDescription()}
          </p>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-6 space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Order Reference</p>
              <p className="text-primary font-bold">{orderId}</p>
            </div>
            
            {orderStatus?.pesapalTrackingId && (
              <div>
                <p className="text-sm font-medium mb-1">Payment Tracking ID</p>
                <p className="text-sm font-mono text-muted-foreground">{orderStatus.pesapalTrackingId}</p>
              </div>
            )}
            
            {orderStatus?.amount && (
              <div>
                <p className="text-sm font-medium mb-1">Amount</p>
                <p className="text-sm font-semibold">{orderStatus.currency} {orderStatus.amount}</p>
              </div>
            )}
          </div>
          
          {!isPaymentFailed && (
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation email has been sent to your email address. You can track your order in the Orders section of your account.
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/shop">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
