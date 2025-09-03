import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { usePaymentNotifications } from '@/hooks/usePaymentNotifications';

export function PaymentNotificationManager() {
  const { user } = useAuth();
  const { clearCart } = useCart();

  usePaymentNotifications({
    userId: user?.id || '',
    enableSoundNotifications: true,
    onPaymentSuccess: () => {
      // Additional success handling - clear cart as backup mechanism
      console.log('PaymentNotificationManager: Payment success, clearing cart');
      clearCart();
    },
    onPaymentFailure: () => {
      // Additional failure handling if needed
      console.log('PaymentNotificationManager: Payment failure');
    },
  });

  // This component doesn't render anything, it just manages notifications
  return null;
}