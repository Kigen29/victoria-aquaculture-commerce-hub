import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentNotificationOptions {
  userId: string;
  onPaymentSuccess?: () => void;
  onPaymentFailure?: () => void;
  enableSoundNotifications?: boolean;
}

export function usePaymentNotifications({
  userId,
  onPaymentSuccess,
  onPaymentFailure,
  enableSoundNotifications = false,
}: PaymentNotificationOptions) {
  const { toast } = useToast();

  const playNotificationSound = (type: 'success' | 'error') => {
    if (!enableSoundNotifications) return;
    
    // Create audio context for notification sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for success vs error
    oscillator.frequency.setValueAtTime(type === 'success' ? 800 : 400, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  useEffect(() => {
    // Subscribe to all pesapal transaction changes for this user
    const channel = supabase
      .channel('user-payment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pesapal_transactions'
        },
        async (payload) => {
          console.log('Payment status updated:', payload);
          
          // Verify this transaction belongs to the current user
          const { data: order } = await supabase
            .from('orders')
            .select('user_id')
            .eq('pesapal_transaction_id', payload.new.id)
            .single();
            
          if (order?.user_id === userId) {
            const newStatus = payload.new.status;
            const oldStatus = payload.old?.status;
            
            // Only show notification if status actually changed
            if (newStatus !== oldStatus) {
              if (newStatus === 'COMPLETED') {
                toast({
                  title: "Payment Successful! 🎉",
                  description: "Your payment has been processed successfully.",
                  duration: 5000,
                });
                playNotificationSound('success');
                onPaymentSuccess?.();
              } else if (newStatus === 'FAILED') {
                toast({
                  title: "Payment Failed",
                  description: "Your payment could not be processed. Please try again.",
                  variant: "destructive",
                  duration: 5000,
                });
                playNotificationSound('error');
                onPaymentFailure?.();
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast, onPaymentSuccess, onPaymentFailure, enableSoundNotifications]);
}