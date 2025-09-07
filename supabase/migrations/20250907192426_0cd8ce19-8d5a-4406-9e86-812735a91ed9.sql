-- Fix RLS policy for contact_numbers to allow public registration
DROP POLICY IF EXISTS "Allow public to insert contact numbers" ON public.contact_numbers;

CREATE POLICY "Allow public to register for promotions" 
ON public.contact_numbers 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);