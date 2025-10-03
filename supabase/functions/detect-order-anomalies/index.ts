import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnomalyCheck {
  userId: string;
  orderId: string;
  totalAmount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { userId, orderId, totalAmount }: AnomalyCheck = await req.json();

    if (userId !== user.id) {
      throw new Error('Unauthorized: User mismatch');
    }

    const anomalies: string[] = [];

    // Check 1: Unusual order frequency (more than 5 orders in 1 hour)
    const { data: recentOrders, error: recentError } = await supabaseClient
      .from('orders')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if (recentError) throw recentError;

    if (recentOrders && recentOrders.length > 5) {
      anomalies.push('High order frequency detected');
      console.log(`Anomaly: User ${userId} placed ${recentOrders.length} orders in 1 hour`);
    }

    // Check 2: Unusually high order amount (3x average)
    const { data: userOrders, error: avgError } = await supabaseClient
      .from('orders')
      .select('total_amount')
      .eq('user_id', userId)
      .neq('id', orderId);

    if (avgError) throw avgError;

    if (userOrders && userOrders.length > 0) {
      const avgAmount = userOrders.reduce((sum, order) => sum + Number(order.total_amount), 0) / userOrders.length;
      if (totalAmount > avgAmount * 3) {
        anomalies.push('Unusually high order amount');
        console.log(`Anomaly: Order ${orderId} amount ${totalAmount} is 3x average ${avgAmount}`);
      }
    }

    // Check 3: Multiple failed payment attempts
    const { data: failedTransactions, error: failedError } = await supabaseClient
      .from('pesapal_transactions')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', ['FAILED', 'INVALID']);

    if (failedError) throw failedError;

    if (failedTransactions && failedTransactions.length > 3) {
      anomalies.push('Multiple failed payment attempts');
      console.log(`Anomaly: Order ${orderId} has ${failedTransactions.length} failed payments`);
    }

    // Check 4: Order from new location (significant distance change)
    const { data: lastOrder, error: locationError } = await supabaseClient
      .from('orders')
      .select('delivery_latitude, delivery_longitude')
      .eq('user_id', userId)
      .not('delivery_latitude', 'is', null)
      .not('delivery_longitude', 'is', null)
      .neq('id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!locationError && lastOrder) {
      const { data: currentOrder } = await supabaseClient
        .from('orders')
        .select('delivery_latitude, delivery_longitude')
        .eq('id', orderId)
        .single();

      if (currentOrder?.delivery_latitude && currentOrder?.delivery_longitude) {
        const distance = calculateDistance(
          Number(lastOrder.delivery_latitude),
          Number(lastOrder.delivery_longitude),
          Number(currentOrder.delivery_latitude),
          Number(currentOrder.delivery_longitude)
        );

        if (distance > 100) {
          anomalies.push('Order from significantly different location');
          console.log(`Anomaly: Order ${orderId} location is ${distance}km from previous order`);
        }
      }
    }

    // Log anomalies to audit_logs
    if (anomalies.length > 0) {
      await supabaseClient.from('audit_logs').insert({
        user_id: userId,
        action: 'ANOMALY_DETECTED',
        table_name: 'orders',
        record_id: orderId,
        user_agent: req.headers.get('user-agent'),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        anomalies,
        severity: anomalies.length > 2 ? 'high' : anomalies.length > 0 ? 'medium' : 'low',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
