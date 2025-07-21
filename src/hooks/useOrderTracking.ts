import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderStatus {
  orderId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  pesapalStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  pesapalTrackingId?: string;
  amount?: number;
  currency?: string;
  lastUpdated: Date;
}

export interface UseOrderTrackingOptions {
  orderId: string;
  enablePolling?: boolean;
  pollingInterval?: number;
  onStatusChange?: (status: OrderStatus) => void;
  onPaymentSuccess?: (orderStatus: OrderStatus) => void;
  onPaymentFailure?: (orderStatus: OrderStatus) => void;
}

export function useOrderTracking({
  orderId,
  enablePolling = true,
  pollingInterval = 5000,
  onStatusChange,
  onPaymentSuccess,
  onPaymentFailure,
}: UseOrderTrackingOptions) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrderStatus = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch order with associated Pesapal transaction
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          created_at,
          pesapal_transaction_id
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw new Error(`Failed to fetch order: ${orderError.message}`);
      }

      if (!order) {
        throw new Error('Order not found');
      }

      let pesapalTransaction = null;
      if (order.pesapal_transaction_id) {
        const { data: transaction } = await supabase
          .from('pesapal_transactions')
          .select('pesapal_tracking_id, status, amount, currency, updated_at')
          .eq('id', order.pesapal_transaction_id)
          .single();
        
        pesapalTransaction = transaction;
      }
      
      const status: OrderStatus = {
        orderId: order.id,
        status: order.status as OrderStatus['status'],
        pesapalStatus: pesapalTransaction?.status as OrderStatus['pesapalStatus'],
        pesapalTrackingId: pesapalTransaction?.pesapal_tracking_id,
        amount: pesapalTransaction?.amount || order.total_amount,
        currency: pesapalTransaction?.currency || 'KES',
        lastUpdated: new Date(pesapalTransaction?.updated_at || order.created_at),
      };

      setOrderStatus(status);
      onStatusChange?.(status);

      // Handle status changes
      if (status.pesapalStatus === 'COMPLETED' && status.status !== 'completed') {
        onPaymentSuccess?.(status);
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
      } else if (status.pesapalStatus === 'FAILED' && status.status !== 'failed') {
        onPaymentFailure?.(status);
        toast({
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          variant: "destructive",
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Order tracking error:', err);
      
      toast({
        title: "Error",
        description: "Failed to update order status. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, onStatusChange, onPaymentSuccess, onPaymentFailure, toast]);

  // Set up real-time subscription
  useEffect(() => {
    let orderChannel: any;
    let transactionChannel: any;

    const setupRealtimeSubscriptions = () => {
      // Subscribe to order changes
      orderChannel = supabase
        .channel(`order-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`
          },
          (payload) => {
            console.log('Order updated via realtime:', payload);
            fetchOrderStatus();
          }
        )
        .subscribe();

      // Subscribe to pesapal transaction changes
      transactionChannel = supabase
        .channel(`pesapal-transactions`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pesapal_transactions'
          },
          (payload) => {
            console.log('Pesapal transaction updated via realtime:', payload);
            fetchOrderStatus();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscriptions();

    return () => {
      if (orderChannel) supabase.removeChannel(orderChannel);
      if (transactionChannel) supabase.removeChannel(transactionChannel);
    };
  }, [orderId, fetchOrderStatus]);

  // Set up polling
  useEffect(() => {
    if (!enablePolling) return;

    const interval = setInterval(() => {
      if (orderStatus?.pesapalStatus === 'PENDING') {
        fetchOrderStatus();
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enablePolling, pollingInterval, orderStatus?.pesapalStatus, fetchOrderStatus]);

  // Initial fetch
  useEffect(() => {
    fetchOrderStatus();
  }, [fetchOrderStatus]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchOrderStatus();
  }, [fetchOrderStatus]);

  return {
    orderStatus,
    loading,
    error,
    refetch,
    isPaymentPending: orderStatus?.pesapalStatus === 'PENDING',
    isPaymentCompleted: orderStatus?.pesapalStatus === 'COMPLETED',
    isPaymentFailed: orderStatus?.pesapalStatus === 'FAILED',
  };
}