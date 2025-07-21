
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePaymentStatusSync() {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncPaymentStatus = async (orderIds: string[]) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-payment-status', {
        body: { orderIds }
      });

      if (error) throw error;

      const updatedCount = data.results.filter((r: any) => r.updated).length;
      
      if (updatedCount > 0) {
        toast({
          title: "Payment Status Updated",
          description: `${updatedCount} payment(s) status synced successfully.`,
        });
      } else {
        toast({
          title: "Status Check Complete",
          description: "All payments are already up to date.",
        });
      }

      return data.results;
    } catch (error) {
      console.error('Error syncing payment status:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync payment status. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  return { syncPaymentStatus, syncing };
}
