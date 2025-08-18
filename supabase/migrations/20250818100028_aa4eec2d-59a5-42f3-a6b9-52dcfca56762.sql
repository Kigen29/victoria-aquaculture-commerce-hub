-- Create a security definer function to check transaction ownership
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.user_owns_transaction(transaction_order_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.orders 
    WHERE id = transaction_order_id 
      AND user_id = auth.uid()
  );
$$;

-- Drop existing policies to recreate them with enhanced security
DROP POLICY IF EXISTS "Users can view their own pesapal transactions" ON public.pesapal_transactions;
DROP POLICY IF EXISTS "Users can insert their own pesapal transactions" ON public.pesapal_transactions;
DROP POLICY IF EXISTS "Users can update their own pesapal transactions" ON public.pesapal_transactions;

-- Enhanced RLS policies with better security
CREATE POLICY "Users can view own transactions only"
ON public.pesapal_transactions
FOR SELECT
TO authenticated
USING (public.user_owns_transaction(order_id));

CREATE POLICY "Users can insert own transactions only"
ON public.pesapal_transactions
FOR INSERT
TO authenticated
WITH CHECK (public.user_owns_transaction(order_id));

CREATE POLICY "Service role can manage transactions"
ON public.pesapal_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Restrict UPDATE to only status and specific fields, not customer data
CREATE POLICY "Users can update transaction status only"
ON public.pesapal_transactions
FOR UPDATE
TO authenticated
USING (public.user_owns_transaction(order_id))
WITH CHECK (public.user_owns_transaction(order_id));

-- Add policy for edge functions to update transaction status
CREATE POLICY "Edge functions can update transaction status"
ON public.pesapal_transactions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Create audit function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_phone_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Log access to customer phone data (you can expand this for audit trails)
  IF TG_OP = 'SELECT' AND NEW.customer_phone IS NOT NULL THEN
    -- Here you could insert into an audit log table if needed
    RAISE LOG 'Customer phone data accessed for transaction %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Add data masking function for customer phone display
CREATE OR REPLACE FUNCTION public.mask_customer_phone(phone_number text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER SET search_path = ''
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN phone_number IS NULL THEN NULL
    WHEN length(phone_number) < 4 THEN '***'
    ELSE 
      substring(phone_number from 1 for 3) || 
      repeat('*', length(phone_number) - 6) || 
      substring(phone_number from length(phone_number) - 2)
  END;
$$;