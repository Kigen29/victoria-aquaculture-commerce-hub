import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Shop location: Kogo Star Plaza, Ground floor, Nairobi West-off Maimahiu Rd
const SHOP_COORDINATES = {
  lat: -1.3162, // Approximate coordinates for Nairobi West
  lng: 36.7965
}

interface DeliveryCalculationRequest {
  address: string;
  latitude?: number;
  longitude?: number;
}

interface GoogleMapsResponse {
  rows: Array<{
    elements: Array<{
      distance?: {
        text: string;
        value: number; // in meters
      };
      duration?: {
        text: string;
        value: number; // in seconds
      };
      status: string;
    }>;
  }>;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, latitude, longitude }: DeliveryCalculationRequest = await req.json();

    if (!address && (!latitude || !longitude)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Address or coordinates are required' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Maps API not configured' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    let destination = '';
    if (latitude && longitude) {
      destination = `${latitude},${longitude}`;
    } else {
      destination = encodeURIComponent(address);
    }

    // Use Google Maps Distance Matrix API to calculate distance
    const origin = `${SHOP_COORDINATES.lat},${SHOP_COORDINATES.lng}`;
    const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=metric&key=${googleMapsApiKey}`;

    console.log('Calling Google Distance Matrix API:', distanceMatrixUrl);

    const response = await fetch(distanceMatrixUrl);
    const data: GoogleMapsResponse = await response.json();

    console.log('Google Maps response:', JSON.stringify(data, null, 2));

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      throw new Error(`No route found or geocoding failed: ${element?.status}`);
    }

    if (!element.distance) {
      throw new Error('Distance information not available');
    }

    // Distance in kilometers
    const distanceKm = element.distance.value / 1000;
    
    console.log(`Calculated distance: ${distanceKm} km`);

    // Import Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Call the database function to calculate delivery fee
    const { data: feeData, error: feeError } = await supabase
      .rpc('calculate_delivery_fee', { distance_km: distanceKm });

    if (feeError) {
      console.error('Database function error:', feeError);
      throw new Error(`Failed to calculate delivery fee: ${feeError.message}`);
    }

    console.log('Delivery fee calculation result:', feeData);

    if (!feeData.success) {
      throw new Error(feeData.error || 'Failed to calculate delivery fee');
    }

    const result = {
      success: true,
      distance_km: distanceKm,
      delivery_fee: feeData.delivery_fee,
      zone_name: feeData.zone_name,
      zone_id: feeData.zone_id,
      estimated_time_mins: feeData.estimated_time,
      formatted_distance: element.distance.text,
      formatted_duration: element.duration?.text || `${feeData.estimated_time} mins`
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Calculate delivery fee error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});