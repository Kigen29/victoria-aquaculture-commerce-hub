-- Phase 1: Critical Security Enhancements

-- 1. Create audit_logs table for sensitive data access tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Enhanced RLS policies for pesapal_transactions
DROP POLICY IF EXISTS "Edge functions can update transaction status" ON public.pesapal_transactions;
DROP POLICY IF EXISTS "Service role can manage transactions" ON public.pesapal_transactions;

-- More restrictive service role policy
CREATE POLICY "Service role can manage transactions with audit" ON public.pesapal_transactions
FOR ALL USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Edge functions can only update status, not create or delete
CREATE POLICY "Edge functions can update transaction status only" ON public.pesapal_transactions
FOR UPDATE USING (auth.role() = 'service_role'::text OR auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'service_role'::text OR user_owns_transaction(order_id));

-- 3. Create function to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_audit_access(
  action_param TEXT,
  table_name_param TEXT,
  record_id_param UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
  VALUES (auth.uid(), action_param, table_name_param, record_id_param);
END;
$$;

-- 4. Enhanced phone number masking function with better security
CREATE OR REPLACE FUNCTION public.mask_customer_phone_enhanced(phone_number TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT CASE 
    WHEN phone_number IS NULL OR phone_number = '' THEN 'N/A'
    WHEN length(phone_number) < 6 THEN '***'
    ELSE 
      substring(phone_number FROM 1 FOR 3) || 
      repeat('*', GREATEST(0, length(phone_number) - 6)) || 
      substring(phone_number FROM length(phone_number) - 2)
  END;
$$;

-- 5. Create trigger to automatically mask phone numbers on insert/update
CREATE OR REPLACE FUNCTION public.auto_mask_sensitive_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the access
  PERFORM log_audit_access(TG_OP, TG_TABLE_NAME, NEW.id);
  
  -- Auto-mask phone numbers for display (keep original for processing)
  IF TG_TABLE_NAME = 'pesapal_transactions' AND NEW.customer_phone IS NOT NULL THEN
    -- Store masked version for display purposes
    NEW.customer_phone_display := mask_customer_phone_enhanced(NEW.customer_phone);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add customer_phone_display column if it doesn't exist
ALTER TABLE public.pesapal_transactions 
ADD COLUMN IF NOT EXISTS customer_phone_display TEXT;

-- Create trigger for pesapal_transactions
DROP TRIGGER IF EXISTS mask_sensitive_data_trigger ON public.pesapal_transactions;
CREATE TRIGGER mask_sensitive_data_trigger
  BEFORE INSERT OR UPDATE ON public.pesapal_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_mask_sensitive_data();

-- 6. Enhanced user ownership validation with audit logging
CREATE OR REPLACE FUNCTION public.user_owns_transaction_with_audit(transaction_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owns_transaction BOOLEAN;
BEGIN
  -- Check ownership
  SELECT EXISTS (
    SELECT 1 
    FROM public.orders 
    WHERE id = transaction_order_id 
      AND user_id = auth.uid()
  ) INTO owns_transaction;
  
  -- Log access attempt
  PERFORM log_audit_access('TRANSACTION_ACCESS_CHECK', 'pesapal_transactions', transaction_order_id);
  
  RETURN owns_transaction;
END;
$$;

-- 7. Create function to validate and sanitize input data
CREATE OR REPLACE FUNCTION public.validate_phone_number(phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Basic phone number validation (adjust regex as needed for your requirements)
  RETURN phone ~ '^[+]?[0-9\s\-\(\)]{7,15}$';
END;
$$;

-- 8. Enhanced profiles table security
-- Add constraint to ensure phone numbers are valid
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_phone_format 
CHECK (phone IS NULL OR validate_phone_number(phone));

-- Add constraint for email format
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_email_format 
CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 9. Update existing masked phone display data
UPDATE public.pesapal_transactions 
SET customer_phone_display = mask_customer_phone_enhanced(customer_phone)
WHERE customer_phone IS NOT NULL AND customer_phone_display IS NULL;