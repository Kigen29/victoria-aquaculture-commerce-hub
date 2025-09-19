import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface PlaceDetails {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  name?: string;
  types: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      console.error('GOOGLE_MAPS_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, input, placeId, sessionToken } = await req.json();

    if (action === 'autocomplete') {
      if (!input || input.length < 2) {
        return new Response(JSON.stringify({ predictions: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fetching autocomplete for: "${input}"`);

      // Nairobi coordinates for location bias
      const nairobiLat = -1.2921;
      const nairobiLng = 36.8219;
      const radius = 50000; // 50km radius around Nairobi

      // Enhanced autocomplete with specific types and location bias
      const autocompleteUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      autocompleteUrl.searchParams.set('input', input);
      autocompleteUrl.searchParams.set('key', googleMapsApiKey);
      autocompleteUrl.searchParams.set('components', 'country:ke');
      autocompleteUrl.searchParams.set('location', `${nairobiLat},${nairobiLng}`);
      autocompleteUrl.searchParams.set('radius', radius.toString());
      autocompleteUrl.searchParams.set('strictbounds', 'true');
      autocompleteUrl.searchParams.set('types', 'establishment|premise|subpremise_level_1|street_address');
      if (sessionToken) {
        autocompleteUrl.searchParams.set('sessiontoken', sessionToken);
      }
      
      const response = await fetch(autocompleteUrl.toString());
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status, data.error_message);
        return new Response(
          JSON.stringify({ error: `Google Places API error: ${data.status}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const predictions: PlacePrediction[] = data.predictions || [];
      console.log(`Found ${predictions.length} predictions`);

      return new Response(
        JSON.stringify({ predictions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'details') {
      // Get place details for selected prediction
      if (!placeId) {
        return new Response(
          JSON.stringify({ error: 'Place ID is required for details action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Fetching details for place ID: ${placeId}`);
      
      const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      detailsUrl.searchParams.set('place_id', placeId);
      detailsUrl.searchParams.set('key', googleMapsApiKey);
      detailsUrl.searchParams.set('fields', 'geometry,formatted_address,address_components,name,types');
      if (sessionToken) {
        detailsUrl.searchParams.set('sessiontoken', sessionToken);
      }
      
      const response = await fetch(detailsUrl.toString());
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error('Google Places Details API error:', data.status, data.error_message);
        return new Response(
          JSON.stringify({ error: `Google Places Details API error: ${data.status}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const placeDetails: PlaceDetails = data.result;
      console.log(`Retrieved details for: ${placeDetails.formatted_address}`);

      return new Response(
        JSON.stringify({ 
          address: placeDetails.formatted_address,
          coordinates: {
            lat: placeDetails.geometry.location.lat,
            lng: placeDetails.geometry.location.lng
          },
          addressComponents: placeDetails.address_components,
          name: placeDetails.name,
          types: placeDetails.types
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "autocomplete" or "details"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in google-places-autocomplete function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});