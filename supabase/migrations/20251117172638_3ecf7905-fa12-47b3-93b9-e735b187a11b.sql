-- Fix the handle_order_completion() function to check the correct column
CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process when status transitions to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Reduce stock for this order
    PERFORM public.reduce_product_stock(NEW.id);
    RAISE LOG 'Stock reduction triggered for order %', NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_order_completion ON public.orders;
CREATE TRIGGER on_order_completion
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_completion();