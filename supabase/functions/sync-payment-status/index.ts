
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pesapal Configuration
const PESAPAL_CONFIG = {
  CONSUMER_KEY: Deno.env.get('PESAPAL_CONSUMER_KEY') || '',
  CONSUMER_SECRET: Deno.env.get('PESAPAL_CONSUMER_SECRET') || '',
  BASE_URL: 'https://cybqa.pesapal.com/pesapalv3',
};

class PesapalService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  async getPesapalToken(): Promise<string> {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONFIG.CONSUMER_KEY,
        consumer_secret: PESAPAL_CONFIG.CONSUMER_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Pesapal token: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Pesapal Auth Error: ${data.error.message}`);
    }

    this.token = data.token;
    this.tokenExpiry = new Date(data.expiryDate);
    return this.token;
  }

  async getTransactionStatus(orderTrackingId: string): Promise<any> {
    const token = await this.getPesapalToken();
    const response = await fetch(
      `${PESAPAL_CONFIG.BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get transaction status: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderIds } = await req.json();
    console.log('Syncing payment status for orders:', orderIds);

    const pesapalService = new PesapalService();
    const results = [];

    for (const orderId of orderIds) {
      try {
        // Get the transaction for this order
        const { data: transaction } = await supabase
          .from('pesapal_transactions')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (!transaction) {
          console.log(`No transaction found for order ${orderId}`);
          continue;
        }

        // Get status from Pesapal
        const transactionStatus = await pesapalService.getTransactionStatus(
          transaction.pesapal_tracking_id
        );

        // Determine new status
        let newStatus = 'PENDING';
        const statusCode = String(transactionStatus.payment_status_code || transactionStatus.status_code);
        
        switch (statusCode) {
          case '1':
            newStatus = 'COMPLETED';
            break;
          case '2':
            newStatus = 'FAILED';
            break;
          case '3':
            newStatus = 'CANCELLED';
            break;
          default:
            newStatus = 'PENDING';
            break;
        }

        // Update if status changed
        if (transaction.status !== newStatus) {
          // Update pesapal_transactions
          await supabase
            .from('pesapal_transactions')
            .update({ status: newStatus })
            .eq('id', transaction.id);

          // Update orders
          const orderStatus = newStatus === 'COMPLETED' ? 'completed' : 
                            (newStatus === 'FAILED' || newStatus === 'CANCELLED') ? 'failed' : 'pending';

          await supabase
            .from('orders')
            .update({ 
              status: orderStatus,
              pesapal_transaction_id: transaction.id
            })
            .eq('id', orderId);

          results.push({
            orderId,
            oldStatus: transaction.status,
            newStatus,
            updated: true
          });
        } else {
          results.push({
            orderId,
            status: newStatus,
            updated: false
          });
        }
      } catch (error) {
        console.error(`Error syncing order ${orderId}:`, error);
        results.push({
          orderId,
          error: error.message,
          updated: false
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sync-payment-status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
