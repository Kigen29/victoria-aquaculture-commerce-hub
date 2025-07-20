import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface CreateOrderRequest {
  user_id: string;
  items: OrderItem[];
  customer_info: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
  };
  total_amount: number;
}

// Pesapal Configuration
const PESAPAL_CONFIG = {
  CONSUMER_KEY: Deno.env.get('PESAPAL_CONSUMER_KEY') || '',
  CONSUMER_SECRET: Deno.env.get('PESAPAL_CONSUMER_SECRET') || '',
  BASE_URL: 'https://cybqa.pesapal.com/pesapalv3', // Sandbox
  IPN_URL: `${Deno.env.get('SUPABASE_URL')}/functions/v1/pesapal-callback`,
  CALLBACK_URL: `${Deno.env.get('SITE_URL') || 'https://50943c0f-e074-4ea1-abdd-3e28af151c6c.lovableproject.com'}/order-success`,
};

class PesapalService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private ipnId: string | null = null;

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

  async registerIPN(): Promise<string> {
    if (this.ipnId) return this.ipnId;

    const token = await this.getPesapalToken();
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: PESAPAL_CONFIG.IPN_URL,
        ipn_notification_type: 'GET',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register IPN: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Pesapal IPN Error: ${data.error.message}`);
    }

    this.ipnId = data.ipn_id;
    return this.ipnId;
  }

  async createPaymentOrder(orderData: any): Promise<any> {
    const token = await this.getPesapalToken();
    const ipnId = await this.registerIPN();

    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...orderData,
        notification_id: ipnId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create payment order: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Pesapal Order Error: ${data.error.message}`);
    }

    return data;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: CreateOrderRequest = await req.json();
    console.log('Creating Pesapal order:', requestData);

    // Validate request data
    if (!requestData.user_id || !requestData.items || !requestData.customer_info) {
      throw new Error('Missing required order data');
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: requestData.user_id,
        total_amount: requestData.total_amount,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Database error creating order:', orderError);
      throw new Error('Failed to create order in database');
    }

    console.log('Order created in database:', order);

    // Create order items
    const orderItems = requestData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Database error creating order items:', itemsError);
      throw new Error('Failed to create order items');
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: requestData.customer_info.full_name,
        phone: requestData.customer_info.phone,
        address: requestData.customer_info.address,
        email: requestData.customer_info.email
      })
      .eq('id', requestData.user_id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't throw error for profile update failure
    }

    // Create Pesapal payment order
    const pesapalService = new PesapalService();
    const merchantReference = `ORDER-${order.id}`;
    
    const pesapalOrderData = {
      id: merchantReference,
      currency: 'KES',
      amount: requestData.total_amount,
      description: `Order ${order.id} - ${requestData.items.length} items`,
      callback_url: PESAPAL_CONFIG.CALLBACK_URL,
      billing_address: {
        email_address: requestData.customer_info.email,
        phone_number: requestData.customer_info.phone,
        country_code: 'KE',
        first_name: requestData.customer_info.full_name.split(' ')[0],
        last_name: requestData.customer_info.full_name.split(' ').slice(1).join(' ') || '',
        line_1: requestData.customer_info.address,
        city: 'Nairobi',
        state: 'Nairobi',
        postal_code: '00100',
        zip_code: '00100'
      }
    };

    const pesapalResponse = await pesapalService.createPaymentOrder(pesapalOrderData);
    console.log('Pesapal order created:', pesapalResponse);

    // Store transaction details
    const { error: transactionError } = await supabase
      .from('pesapal_transactions')
      .insert({
        order_id: order.id,
        pesapal_tracking_id: pesapalResponse.order_tracking_id,
        merchant_reference: merchantReference,
        iframe_url: pesapalResponse.redirect_url,
        status: 'PENDING',
        amount: requestData.total_amount,
        currency: 'KES',
        customer_phone: requestData.customer_info.phone
      });

    if (transactionError) {
      console.error('Transaction storage error:', transactionError);
      throw new Error('Failed to store transaction details');
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        iframe_url: pesapalResponse.redirect_url,
        tracking_id: pesapalResponse.order_tracking_id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in create-pesapal-order:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);