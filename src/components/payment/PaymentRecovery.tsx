
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePaymentStatusSync } from '@/hooks/usePaymentStatusSync';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentRecoveryProps {
  orderId: string;
  onStatusUpdated?: () => void;
}

export function PaymentRecovery({ orderId, onStatusUpdated }: PaymentRecoveryProps) {
  const [isChecking, setIsChecking] = useState(false);
  const { syncPaymentStatus } = usePaymentStatusSync();
  const { toast } = useToast();

  const handleSyncStatus = async () => {
    setIsChecking(true);
    try {
      const results = await syncPaymentStatus([orderId]);
      const orderResult = results.find((r: any) => r.orderId === orderId);
      
      if (orderResult?.updated) {
        toast({
          title: "Payment Status Updated",
          description: `Payment status has been updated to: ${orderResult.newStatus}`,
          duration: 5000,
        });
        onStatusUpdated?.();
      } else if (orderResult?.error) {
        toast({
          title: "Sync Failed",
          description: orderResult.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Status Check Complete",
          description: "Payment status is already up to date.",
        });
      }
    } catch (error) {
      console.error('Failed to sync payment status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          Payment Status Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-yellow-700 mb-4">
          If your payment was successful but the status hasn't updated, you can manually check the payment status.
        </p>
        <Button 
          onClick={handleSyncStatus}
          disabled={isChecking}
          variant="outline"
          className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
        >
          {isChecking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Checking Status...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Check Payment Status
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
