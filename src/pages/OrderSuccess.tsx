
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};

  // Redirect if accessed directly without an order ID
  useEffect(() => {
    if (!orderId) {
      navigate("/");
    }
  }, [orderId, navigate]);

  if (!orderId) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Order Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. Your order has been received and is now being processed.
          </p>
          
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <p className="text-sm font-medium mb-1">Order Reference</p>
            <p className="text-aqua-700 font-bold">{orderId}</p>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            A confirmation email has been sent to your email address. You can track your order in the Orders section of your account.
          </p>
          
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
