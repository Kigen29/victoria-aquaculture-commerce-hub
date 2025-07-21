import { useAuth } from '@/context/AuthContext';
import { usePaymentNotifications } from '@/hooks/usePaymentNotifications';

export function PaymentNotificationManager() {
  const { user } = useAuth();

  usePaymentNotifications({
    userId: user?.id || '',
    enableSoundNotifications: true,
    onPaymentSuccess: () => {
      // Additional success handling if needed
      console.log('Payment notification: Success');
    },
    onPaymentFailure: () => {
      // Additional failure handling if needed
      console.log('Payment notification: Failure');
    },
  });

  // This component doesn't render anything, it just manages notifications
  return null;
}