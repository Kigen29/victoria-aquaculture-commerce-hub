import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('IPN Proxy - Method:', req.method);
    console.log('IPN Proxy - Query:', req.query);
    console.log('IPN Proxy - Body:', req.body);

    // Extract parameters (Pesapal sends as query params for GET)
    const params = req.method === 'GET' ? req.query : req.body;
    
    const orderTrackingId = params.OrderTrackingId;
    const orderMerchantReference = params.OrderMerchantReference;
    const orderNotificationType = params.OrderNotificationType;

    if (!orderTrackingId && !orderMerchantReference) {
      console.error('Missing required parameters');
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Forward to Supabase edge function
    const supabaseUrl = 'https://mdkexfslutqzwoqfyxil.supabase.co/functions/v1/pesapal-callback';
    const queryParams = new URLSearchParams({
      OrderTrackingId: orderTrackingId as string || '',
      OrderMerchantReference: orderMerchantReference as string || '',
      OrderNotificationType: orderNotificationType as string || 'IPNCHANGE',
    });

    console.log('Forwarding to Supabase:', `${supabaseUrl}?${queryParams}`);

    const response = await fetch(`${supabaseUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.text();
    console.log('Supabase response:', response.status, data);

    // Return success to Pesapal
    return res.status(200).json({ 
      status: 'success',
      message: 'IPN processed',
      supabase_status: response.status 
    });

  } catch (error) {
    console.error('IPN Proxy Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
