import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function PaymentStatusIndicator() {
  const { user } = useAuth();
  const [pendingPayments, setPendingPayments] = useState(0);
  const [processingPayments, setProcessingPayments] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchPendingPayments = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          pesapal_transactions!inner(status)
        `)
        .eq('user_id', user.id)
        .eq('pesapal_transactions.status', 'PENDING');

      setPendingPayments(orders?.length || 0);
    };

    // Initial fetch
    fetchPendingPayments();

    // Real-time subscription for payment status changes
    const channel = supabase
      .channel(`payment-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pesapal_transactions'
        },
        (payload) => {
          console.log('Payment status change detected:', payload);
          fetchPendingPayments();
          
          // Show processing animation temporarily
          if (payload.new && 'status' in payload.new && payload.new.status === 'PENDING') {
            setProcessingPayments(prev => prev + 1);
            setTimeout(() => setProcessingPayments(prev => Math.max(0, prev - 1)), 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (!user || (pendingPayments === 0 && processingPayments === 0)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {processingPayments > 0 && (
        <Badge variant="secondary" className="animate-pulse">
          <CreditCard className="h-3 w-3 mr-1" />
          Processing
        </Badge>
      )}
      {pendingPayments > 0 && (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          {pendingPayments} Pending
        </Badge>
      )}
    </div>
  );
}