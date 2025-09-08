-- Fix remaining security warnings from linter

-- 1. Fix search path for functions that don't have it set properly
CREATE OR REPLACE FUNCTION public.validate_phone_number(phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Basic phone number validation (adjust regex as needed for your requirements)
  RETURN phone ~ '^[+]?[0-9\s\-\(\)]{7,15}$';
END;
$$;

-- 2. Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.auto_mask_sensitive_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log the access
  PERFORM public.log_audit_access(TG_OP, TG_TABLE_NAME, NEW.id);
  
  -- Auto-mask phone numbers for display (keep original for processing)
  IF TG_TABLE_NAME = 'pesapal_transactions' AND NEW.customer_phone IS NOT NULL THEN
    -- Store masked version for display purposes
    NEW.customer_phone_display := public.mask_customer_phone_enhanced(NEW.customer_phone);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit_access(
  action_param TEXT,
  table_name_param TEXT,
  record_id_param UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
  VALUES (auth.uid(), action_param, table_name_param, record_id_param);
END;
$$;

CREATE OR REPLACE FUNCTION public.user_owns_transaction_with_audit(transaction_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
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
  PERFORM public.log_audit_access('TRANSACTION_ACCESS_CHECK', 'pesapal_transactions', transaction_order_id);
  
  RETURN owns_transaction;
END;
$$;

-- Make sure all existing functions have proper search_path
CREATE OR REPLACE FUNCTION public.reduce_product_stock(order_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $$
DECLARE
  item_record RECORD;
  current_stock INTEGER;
  new_stock INTEGER;
  stock_reduced BOOLEAN := FALSE;
BEGIN
  -- Check if stock has already been reduced for this order
  IF EXISTS (
    SELECT 1 FROM public.stock_movements 
    WHERE order_id = order_id_param AND movement_type = 'reduction'
  ) THEN
    RAISE LOG 'Stock already reduced for order %', order_id_param;
    RETURN TRUE;
  END IF;

  -- Loop through all items in the order
  FOR item_record IN 
    SELECT oi.product_id, oi.quantity, p.name as product_name
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = order_id_param
  LOOP
    -- Get current stock
    SELECT stock INTO current_stock
    FROM public.products
    WHERE id = item_record.product_id;

    -- Calculate new stock
    new_stock := current_stock - item_record.quantity;

    -- Prevent negative stock
    IF new_stock < 0 THEN
      RAISE LOG 'Insufficient stock for product % (ID: %). Current: %, Requested: %', 
        item_record.product_name, item_record.product_id, current_stock, item_record.quantity;
      new_stock := 0;
    END IF;

    -- Update product stock
    UPDATE public.products 
    SET stock = new_stock
    WHERE id = item_record.product_id;

    -- Log the stock movement
    INSERT INTO public.stock_movements (
      product_id, order_id, movement_type, quantity, 
      previous_stock, new_stock, reason
    ) VALUES (
      item_record.product_id, order_id_param, 'reduction', item_record.quantity,
      current_stock, new_stock, 'Order completion'
    );

    stock_reduced := TRUE;
    
    RAISE LOG 'Reduced stock for product % (ID: %) from % to % (quantity: %)', 
      item_record.product_name, item_record.product_id, current_stock, new_stock, item_record.quantity;
  END LOOP;

  RETURN stock_reduced;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_order_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $$
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Reduce stock for this order
    PERFORM public.reduce_product_stock(NEW.id);
    RAISE LOG 'Stock reduction triggered for order %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;