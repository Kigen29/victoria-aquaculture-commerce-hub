-- Create function to get user order history including deleted products
CREATE OR REPLACE FUNCTION public.get_user_order_history(requesting_user_id uuid)
RETURNS TABLE (
  order_id uuid,
  order_status text,
  total_amount numeric,
  order_created_at timestamptz,
  item_id uuid,
  quantity integer,
  unit_price numeric,
  product_name text,
  product_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Security check: only return data for the requesting user
  IF requesting_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users order history';
  END IF;
  
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.status as order_status,
    o.total_amount,
    o.created_at as order_created_at,
    oi.id as item_id,
    oi.quantity,
    oi.unit_price,
    p.name as product_name,
    p.image_url as product_image_url
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  LEFT JOIN public.products p ON p.id = oi.product_id  -- Bypasses RLS, sees deleted products
  WHERE o.user_id = requesting_user_id
    AND o.status IN ('completed', 'failed', 'cancelled')
  ORDER BY o.created_at DESC, oi.id;
END;
$$;