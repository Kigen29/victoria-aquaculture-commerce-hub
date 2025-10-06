-- Add explicit protection against anonymous access to profiles table
-- This creates a defense-in-depth layer to ensure no unauthorized access

-- Create a RESTRICTIVE policy that requires authentication for any access to profiles
-- RESTRICTIVE policies must ALL pass (unlike PERMISSIVE which only needs one to pass)
CREATE POLICY "Require authentication for all profile access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Add comment explaining the security measure
COMMENT ON POLICY "Require authentication for all profile access" ON public.profiles IS 
'Defense-in-depth: Explicitly blocks all anonymous access to customer PII. This RESTRICTIVE policy ensures auth.uid() is never NULL when accessing profiles, preventing any potential bypass of the PERMISSIVE policies.';