
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
  BASE_URL: 'https://pay.pesapal.com/v3', // Production URL
  IPN_URL: 'https://mdkexfslutqzwoqfyxil.supabase.co/functions/v1/pesapal-callback',
  REDIRECT_URL: 'https://victoria-aquaculture-commerce-hub.lovable.app/order-success',
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

  async registerIPN(): Promise<string> {
    if (this.ipnId) {
      return this.ipnId;
    }

    const token = await this.getPesapalToken();
    const response = await fetch(`${PESAPAL_CONFIG.BASE_URL}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: PESAPAL_CONFIG.IPN_URL,
        ipn_notification_type: 'GET',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register IPN: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error && data.error.message) {
      throw new Error(`IPN Registration Error: ${data.error.message}`);
    }

    if (!data.ipn_id) {
      throw new Error('No IPN ID received from Pesapal');
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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        notification_id: ipnId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create payment order: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error && data.error.message) {
      throw new Error(`Payment Order Error: ${data.error.message}`);
    }

    return data;
  }
}

// Input validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Distance calculation utility (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

const validatePhoneNumber = (phone: string): boolean => {
  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Accept formats:
  // - Kenyan local: 0715089768 (10 digits starting with 0)
  // - International with +: +254715089768
  // - International without +: 254715089768
  const kenyanLocalRegex = /^0[17]\d{8}$/; // Kenyan format: 07xx or 01xx
  const internationalRegex = /^\+?[1-9]\d{1,14}$/; // International E.164 format
  
  return kenyanLocalRegex.test(cleaned) || internationalRegex.test(cleaned);
};

const normalizePhoneNumber = (phone: string): string => {
  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If it's a Kenyan local number (starts with 0), convert to international
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return '+254' + cleaned.substring(1);
  }
  
  // If it starts with 254 but no +, add it
  if (/^254[17]\d{8}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  
  // If it already has +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Otherwise, assume it's already in international format without +
  return '+' + cleaned;
};

const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.trim().slice(0, 500)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '');
};

const validateOrderData = (orderData: any): string[] => {
  const errors: string[] = [];
  
  if (!orderData.user_id) errors.push('User ID is required');
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Items are required');
  }
  if (!orderData.customer_info) errors.push('Customer info is required');
  if (!orderData.total_amount || orderData.total_amount <= 0) {
    errors.push('Valid total amount is required');
  }
  
  if (orderData.customer_info) {
    if (!validateEmail(orderData.customer_info.email)) {
      errors.push('Valid email is required');
    }
    if (!validatePhoneNumber(orderData.customer_info.phone)) {
      errors.push('Valid phone number is required');
    }
    if (!orderData.customer_info.full_name || orderData.customer_info.full_name.trim().length < 2) {
      errors.push('Valid full name is required');
    }
    if (!orderData.customer_info.address || orderData.customer_info.address.trim().length < 5) {
      errors.push('Valid address is required');
    }
  }
  
  return errors;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    console.log('Creating Pesapal order:', requestData);

    // Validate input data
    const validationErrors = validateOrderData(requestData);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed: ' + validationErrors.join(', ')
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { user_id, items, customer_info, delivery_info, total_amount } = requestData;

    // Sanitize customer data
    const sanitizedCustomerInfo = {
      email: customer_info.email.toLowerCase().trim(),
      phone: normalizePhoneNumber(sanitizeInput(customer_info.phone)),
      full_name: sanitizeInput(customer_info.full_name),
      address: sanitizeInput(customer_info.address)
    };

    // Create order in database first
    const orderId = crypto.randomUUID();
    const merchantReference = `ORDER-${orderId}`;

    // Prepare order data with delivery information
    const orderData: any = {
      id: orderId,
      user_id,
      total_amount,
      status: 'pending'
    };

    // Add delivery information if provided
    if (delivery_info) {
      orderData.delivery_address = delivery_info.address;
      orderData.delivery_fee = delivery_info.fee || 0;
      orderData.estimated_delivery_time = delivery_info.estimated_time || 30;
      
      if (delivery_info.coordinates) {
        orderData.delivery_latitude = delivery_info.coordinates.lat;
        orderData.delivery_longitude = delivery_info.coordinates.lng;
      }
      
      // Calculate distance if coordinates are available
      if (delivery_info.coordinates) {
        const shopLat = -1.3162; // Kogo Star Plaza coordinates
        const shopLng = 36.7965;
        const distanceKm = calculateDistance(
          shopLat, shopLng,
          delivery_info.coordinates.lat, delivery_info.coordinates.lng
        );
        orderData.delivery_distance_km = distanceKm;
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log('Order created in database:', order);

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Prepare Pesapal order data
    const pesapalOrderData = {
      id: merchantReference,
      currency: 'KES',
      amount: total_amount,
      description: `Payment for Order ${orderId}`,
      callback_url: `${PESAPAL_CONFIG.REDIRECT_URL}?OrderTrackingId={OrderTrackingId}&OrderMerchantReference=${merchantReference}`,
      billing_address: {
        email_address: sanitizedCustomerInfo.email,
        phone_number: sanitizedCustomerInfo.phone,
        first_name: sanitizedCustomerInfo.full_name.split(' ')[0],
        last_name: sanitizedCustomerInfo.full_name.split(' ').slice(1).join(' ') || sanitizedCustomerInfo.full_name.split(' ')[0],
        line_1: sanitizedCustomerInfo.address,
        country_code: 'KE',
      },
    };

    // Create payment order with Pesapal
    const pesapalService = new PesapalService();
    const pesapalOrder = await pesapalService.createPaymentOrder(pesapalOrderData);
    
    console.log('Pesapal order created:', pesapalOrder);

    if (!pesapalOrder.order_tracking_id || !pesapalOrder.redirect_url) {
      throw new Error('Invalid response from Pesapal: missing tracking ID or redirect URL');
    }

    // Create transaction record with proper linking
    const { data: transaction, error: transactionError } = await supabase
      .from('pesapal_transactions')
      .insert({
        order_id: orderId,
        pesapal_tracking_id: pesapalOrder.order_tracking_id,
        merchant_reference: merchantReference,
        amount: total_amount,
        currency: 'KES',
        status: 'PENDING',
        iframe_url: pesapalOrder.redirect_url,
        customer_phone: sanitizedCustomerInfo.phone,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Failed to create transaction:', transactionError);
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }

    // Update order with transaction ID to establish the link
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ pesapal_transaction_id: transaction.id })
      .eq('id', orderId);

    if (updateOrderError) {
      console.error('Failed to link order to transaction:', updateOrderError);
      // Don't throw here as the payment can still proceed
    }

    console.log('Transaction created and linked:', transaction);

    return new Response(JSON.stringify({
      success: true,
      order_id: orderId,
      tracking_id: pesapalOrder.order_tracking_id,
      iframe_url: pesapalOrder.redirect_url,
      merchant_reference: merchantReference,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error: any) {
    console.error('Error in create-pesapal-order:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
};

serve(handler);
