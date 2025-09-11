-- Create delivery zones table for distance-based pricing
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_distance_km DECIMAL NOT NULL DEFAULT 0,
  max_distance_km DECIMAL NOT NULL,
  base_fee DECIMAL NOT NULL DEFAULT 0,
  per_km_rate DECIMAL NOT NULL DEFAULT 0,
  estimated_time_mins INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on delivery zones
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery zones (public read access)
CREATE POLICY "Anyone can view active delivery zones" 
ON public.delivery_zones 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage delivery zones" 
ON public.delivery_zones 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add delivery-related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_latitude DECIMAL,
ADD COLUMN delivery_longitude DECIMAL,
ADD COLUMN delivery_fee DECIMAL DEFAULT 0,
ADD COLUMN delivery_distance_km DECIMAL,
ADD COLUMN delivery_zone_id UUID REFERENCES public.delivery_zones(id),
ADD COLUMN estimated_delivery_time INTEGER DEFAULT 30;

-- Insert default delivery zones based on Kenyan market research
INSERT INTO public.delivery_zones (name, min_distance_km, max_distance_km, base_fee, per_km_rate, estimated_time_mins) VALUES
('Zone 1 - Local Area', 0, 5, 60, 5, 25),
('Zone 2 - Mid Distance', 5, 10, 120, 8, 35),
('Zone 3 - Extended Area', 10, 15, 200, 12, 45),
('Zone 4 - Far Distance', 15, 25, 300, 15, 60),
('Zone 5 - Extended Nairobi', 25, 50, 400, 20, 90);

-- Create function to calculate delivery fee based on distance
CREATE OR REPLACE FUNCTION public.calculate_delivery_fee(distance_km DECIMAL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  zone_record RECORD;
  calculated_fee DECIMAL;
  result JSON;
BEGIN
  -- Find appropriate zone based on distance
  SELECT * INTO zone_record
  FROM public.delivery_zones
  WHERE distance_km >= min_distance_km 
    AND distance_km <= max_distance_km
    AND is_active = true
  ORDER BY min_distance_km ASC
  LIMIT 1;

  -- If no zone found, use the highest zone
  IF zone_record IS NULL THEN
    SELECT * INTO zone_record
    FROM public.delivery_zones
    WHERE is_active = true
    ORDER BY max_distance_km DESC
    LIMIT 1;
  END IF;

  -- Calculate fee: base fee + (distance * per_km_rate)
  IF zone_record IS NOT NULL THEN
    calculated_fee := zone_record.base_fee + (distance_km * zone_record.per_km_rate);
    
    result := json_build_object(
      'success', true,
      'delivery_fee', calculated_fee,
      'zone_name', zone_record.name,
      'zone_id', zone_record.id,
      'estimated_time', zone_record.estimated_time_mins,
      'distance_km', distance_km
    );
  ELSE
    result := json_build_object(
      'success', false,
      'error', 'No delivery zone found for this distance'
    );
  END IF;

  RETURN result;
END;
$$;

-- Add trigger to update updated_at column for delivery_zones
CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();