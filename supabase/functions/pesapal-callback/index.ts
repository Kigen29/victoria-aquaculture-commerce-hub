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
  BASE_URL: 'https://pay.pesapal.com/v3', // Production URL
};

class PesapalService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

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
      throw new Error(`Failed to get Pesapal token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error && data.error.message) {
      throw new Error(`Pesapal Auth Error: ${data.error.message}`);
    }

    if (!data.token) {
      throw new Error('No token received from Pesapal');
    }

    this.token = data.token;
    this.tokenExpiry = new Date(data.expiryDate);
    return this.token;
  }

  async getTransactionStatus(orderTrackingId: string, retryCount = 0): Promise<any> {
    try {
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

      console.log(`Pesapal API response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Pesapal API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw Pesapal response:', JSON.stringify(data, null, 2));

      // The response is valid even if error object is present but null
      if (data.error && data.error.message) {
        throw new Error(`Pesapal Status Error: ${data.error.message}`);
      }

      // Check if we have valid transaction data
      if (!data || (!data.status_code && !data.payment_status_code)) {
        if (retryCount < this.MAX_RETRIES) {
          console.log(`No valid status data, retrying... (${retryCount + 1}/${this.MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          return this.getTransactionStatus(orderTrackingId, retryCount + 1);
        }
        throw new Error('No valid status data from Pesapal API after retries');
      }

      return data;

    } catch (error) {
      console.error(`Error getting transaction status (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.MAX_RETRIES) {
        console.log(`Retrying in ${this.RETRY_DELAY}ms... (${retryCount + 1}/${this.MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.getTransactionStatus(orderTrackingId, retryCount + 1);
      }
      
      throw error;
    }
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

async function updateTransactionAndOrder(
  supabase: any,
  transactionId: string,
  orderId: string,
  newStatus: string,
  transactionStatus: any
) {
  console.log(`Starting atomic update: transaction ${transactionId}, order ${orderId}, status ${newStatus}`);
  
  try {
    // 1. Update pesapal_transactions table
    const { error: updateTransactionError } = await supabase
      .from('pesapal_transactions')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateTransactionError) {
      console.error('Failed to update pesapal_transactions:', updateTransactionError);
      throw updateTransactionError;
    }
    console.log('✅ Successfully updated pesapal_transactions table');

    // 2. Update orders table with payment_status and ensure transaction link
    let paymentStatus = 'pending';
    if (newStatus === 'COMPLETED') {
      paymentStatus = 'completed';
    } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED') {
      paymentStatus = 'failed';
    }

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ 
        payment_status: paymentStatus,
        pesapal_transaction_id: transactionId
      })
      .eq('id', orderId);

    if (updateOrderError) {
      console.error('Failed to update orders:', updateOrderError);
      throw updateOrderError;
    }
    console.log('✅ Successfully updated orders table');

    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to update transaction and order:', error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Log every incoming request for debugging
  console.log('🔔 Incoming request to pesapal-callback');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

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

    console.log('🔔 Pesapal callback received:', {
      orderTrackingId,
      orderMerchantReference,
      orderNotificationType,
      timestamp: new Date().toISOString()
    });

    // Handle all notification types including IPNCHANGE
    console.log(`📋 Processing notification type: ${orderNotificationType || 'UNKNOWN'}`);
    
    // IPNCHANGE is a valid notification type that indicates transaction status has changed
    const validNotificationTypes = ['IPNCHANGE', 'PAYMENT_STATUS_UPDATE', 'ORDER_STATUS_UPDATE'];
    if (orderNotificationType && !validNotificationTypes.includes(orderNotificationType)) {
      console.log(`⚠️ Received notification type: ${orderNotificationType} - processing anyway`);
    }

    // Log the callback for debugging
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
      console.error('❌ Missing OrderTrackingId in callback');
      return new Response('Missing tracking ID', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Find the transaction using the tracking ID
    console.log('🔍 Looking for transaction with tracking ID:', orderTrackingId);
    
    const { data: transaction, error: transactionError } = await supabase
      .from('pesapal_transactions')
      .select('*')
      .eq('pesapal_tracking_id', orderTrackingId)
      .single();

    if (transactionError || !transaction) {
      console.error('❌ Transaction not found in database:', transactionError);
      
      // Try to find by merchant reference as fallback
      if (orderMerchantReference) {
        console.log('🔄 Trying fallback search by merchant reference:', orderMerchantReference);
        const { data: fallbackTransaction, error: fallbackError } = await supabase
          .from('pesapal_transactions')
          .select('*')
          .eq('merchant_reference', orderMerchantReference)
          .single();
          
        if (fallbackError || !fallbackTransaction) {
          console.error('❌ Fallback transaction search also failed:', fallbackError);
          return new Response('Transaction not found', { 
            status: 404, 
            headers: corsHeaders 
          });
        }
        
        // Use the fallback transaction
        Object.assign(transaction, fallbackTransaction);
      } else {
        return new Response('Transaction not found', { 
          status: 404, 
          headers: corsHeaders 
        });
      }
    }

    console.log('✅ Found transaction:', {
      id: transaction.id,
      order_id: transaction.order_id,
      current_status: transaction.status,
      tracking_id: transaction.pesapal_tracking_id
    });

    // Get transaction status from Pesapal API
    console.log('📞 Calling Pesapal API for transaction status...');
    const pesapalService = new PesapalService();
    const transactionStatus = await pesapalService.getTransactionStatus(orderTrackingId);
    
    console.log('📋 Pesapal transaction status response:', {
      payment_status_code: transactionStatus.payment_status_code,
      status_code: transactionStatus.status_code,
      description: transactionStatus.description || transactionStatus.payment_status_description,
      message: transactionStatus.message
    });

    // Enhanced status mapping based on actual Pesapal response format
    let newStatus = 'PENDING';
    const statusCode = transactionStatus.status_code || transactionStatus.payment_status_code;
    const statusDescription = (transactionStatus.payment_status_description || transactionStatus.description || '').toLowerCase();
    
    console.log('🎯 Status mapping input:', { statusCode, statusDescription });
    
    // Map status based on status_code (which seems to be the reliable field)
    if (statusCode === 1 || statusCode === '1') {
      newStatus = 'COMPLETED';
    } else if (statusCode === 2 || statusCode === '2') {
      newStatus = 'FAILED';
    } else if (statusCode === 3 || statusCode === '3') {
      newStatus = 'CANCELLED';
    } else if (statusCode === 0 || statusCode === '0') {
      newStatus = 'PENDING';
    } else {
      // Fallback to status description
      if (statusDescription.includes('completed') || statusDescription.includes('successful')) {
        newStatus = 'COMPLETED';
      } else if (statusDescription.includes('failed') || statusDescription.includes('error')) {
        newStatus = 'FAILED';
      } else if (statusDescription.includes('cancelled')) {
        newStatus = 'CANCELLED';
      }
      console.log(`⚠️ Using fallback status mapping for code: ${statusCode}, mapped to: ${newStatus}`);
    }

    console.log(`🔄 Status mapping result: ${transaction.status} → ${newStatus}`);

    // Update transaction and order status
    console.log('💾 Updating transaction and order status...');
    
    await updateTransactionAndOrder(
      supabase,
      transaction.id,
      transaction.order_id,
      newStatus,
      transactionStatus
    );

    // Mark callback as processed
    await supabase
      .from('pesapal_callbacks')
      .update({ processed: true })
      .eq('pesapal_tracking_id', orderTrackingId)
      .eq('processed', false);

    // Send confirmation email and reduce stock if payment successful
    if (newStatus === 'COMPLETED') {
      console.log('📧 Sending confirmation email...');
      
      const { data: order } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          profiles!inner(email)
        `)
        .eq('id', transaction.order_id)
        .single();

      if (order?.profiles?.email) {
        await sendConfirmationEmail(order.profiles.email, {
          order_id: transaction.order_id,
          total_amount: transaction.amount,
          confirmation_code: transactionStatus.confirmation_code || orderTrackingId
        });
      }

      // Reduce product stock
      console.log('📦 Reducing product stock...');
      try {
        const { data: stockResult, error: stockError } = await supabase
          .rpc('reduce_product_stock', { order_id_param: transaction.order_id });

        if (stockError) {
          console.error('Error reducing stock:', stockError);
        } else {
          console.log('✅ Stock reduction completed:', stockResult);
        }
      } catch (stockError) {
        console.error('Error calling stock reduction:', stockError);
      }
    }

    console.log(`✅ Transaction ${orderTrackingId} processed successfully. Status: ${newStatus}`);

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('💥 Error in pesapal-callback:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), { 
      status: 500, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
};

serve(handler);
