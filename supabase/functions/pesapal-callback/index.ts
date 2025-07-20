import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pesapal Configuration
const PESAPAL_CONFIG = {
  CONSUMER_KEY: Deno.env.get('PESAPAL_CONSUMER_KEY') || '',
  CONSUMER_SECRET: Deno.env.get('PESAPAL_CONSUMER_SECRET') || '',
  BASE_URL: 'https://cybqa.pesapal.com/pesapalv3', // Sandbox
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
    if (data.error) {
      throw new Error(`Pesapal Status Error: ${data.error.message}`);
    }

    return data;
  }
}

async function sendConfirmationEmail(email: string, orderDetails: any) {
  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    await resend.emails.send({
      from: 'Lake Victoria Aquaculture <onboarding@resend.dev>',
      to: [email],
      subject: 'Payment Confirmation - Order Successful',
      html: `
        <h1>Payment Successful!</h1>
        <p>Thank you for your order. Your payment has been processed successfully.</p>
        <p><strong>Order ID:</strong> ${orderDetails.order_id}</p>
        <p><strong>Amount:</strong> KES ${orderDetails.total_amount}</p>
        <p><strong>Transaction ID:</strong> ${orderDetails.confirmation_code}</p>
        <p>We will process your order and contact you soon.</p>
        <p>Best regards,<br>Lake Victoria Aquaculture Team</p>
      `,
    });
    console.log('Confirmation email sent successfully');
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
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

    const url = new URL(req.url);
    const orderTrackingId = url.searchParams.get('OrderTrackingId');
    const orderMerchantReference = url.searchParams.get('OrderMerchantReference');
    const orderNotificationType = url.searchParams.get('OrderNotificationType');

    console.log('Pesapal callback received:', {
      orderTrackingId,
      orderMerchantReference,
      orderNotificationType
    });

    // Log the callback
    const callbackData = {
      pesapal_tracking_id: orderTrackingId,
      callback_type: orderNotificationType || 'UNKNOWN',
      raw_payload: {
        OrderTrackingId: orderTrackingId,
        OrderMerchantReference: orderMerchantReference,
        OrderNotificationType: orderNotificationType,
        full_url: req.url
      },
      processed: false
    };

    const { error: callbackLogError } = await supabase
      .from('pesapal_callbacks')
      .insert(callbackData);

    if (callbackLogError) {
      console.error('Failed to log callback:', callbackLogError);
    }

    if (!orderTrackingId) {
      console.error('Missing OrderTrackingId in callback');
      return new Response('Missing tracking ID', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Get transaction status from Pesapal
    const pesapalService = new PesapalService();
    const transactionStatus = await pesapalService.getTransactionStatus(orderTrackingId);
    console.log('Transaction status from Pesapal:', transactionStatus);

    // Find the transaction in our database
    const { data: transaction, error: transactionError } = await supabase
      .from('pesapal_transactions')
      .select('*, orders(*)')
      .eq('pesapal_tracking_id', orderTrackingId)
      .single();

    if (transactionError || !transaction) {
      console.error('Transaction not found:', transactionError);
      return new Response('Transaction not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Determine status based on Pesapal response
    let newStatus = 'PENDING';
    if (transactionStatus.payment_status_code === '1') {
      newStatus = 'COMPLETED';
    } else if (transactionStatus.payment_status_code === '2') {
      newStatus = 'FAILED';
    } else if (transactionStatus.payment_status_code === '3') {
      newStatus = 'CANCELLED';
    }

    // Update transaction status
    const { error: updateTransactionError } = await supabase
      .from('pesapal_transactions')
      .update({ status: newStatus })
      .eq('id', transaction.id);

    if (updateTransactionError) {
      console.error('Failed to update transaction:', updateTransactionError);
    }

    // Update order status
    let orderStatus = 'pending';
    if (newStatus === 'COMPLETED') {
      orderStatus = 'completed';
    } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
      orderStatus = 'failed';
    }

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ 
        status: orderStatus,
        pesapal_transaction_id: transaction.id 
      })
      .eq('id', transaction.order_id);

    if (updateOrderError) {
      console.error('Failed to update order:', updateOrderError);
    }

    // Mark callback as processed
    await supabase
      .from('pesapal_callbacks')
      .update({ processed: true })
      .eq('pesapal_tracking_id', orderTrackingId)
      .eq('processed', false);

    // Send confirmation email if payment successful
    if (newStatus === 'COMPLETED') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', transaction.orders.user_id)
        .single();

      if (profile?.email) {
        await sendConfirmationEmail(profile.email, {
          order_id: transaction.order_id,
          total_amount: transaction.amount,
          confirmation_code: transactionStatus.confirmation_code || orderTrackingId
        });
      }
    }

    console.log(`Transaction ${orderTrackingId} processed successfully. Status: ${newStatus}`);

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('Error in pesapal-callback:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
};

serve(handler);