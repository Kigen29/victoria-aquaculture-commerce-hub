-- Create stock movements table for audit trail
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('reduction', 'restoration', 'adjustment')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view stock movements
CREATE POLICY "Admins can view all stock movements" 
ON public.stock_movements 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to reduce product stock
CREATE OR REPLACE FUNCTION public.reduce_product_stock(order_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item_record RECORD;
  current_stock INTEGER;
  new_stock INTEGER;
  stock_reduced BOOLEAN := FALSE;
BEGIN
  -- Check if stock has already been reduced for this order
  IF EXISTS (
    SELECT 1 FROM stock_movements 
    WHERE order_id = order_id_param AND movement_type = 'reduction'
  ) THEN
    RAISE LOG 'Stock already reduced for order %', order_id_param;
    RETURN TRUE;
  END IF;

  -- Loop through all items in the order
  FOR item_record IN 
    SELECT oi.product_id, oi.quantity, p.name as product_name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = order_id_param
  LOOP
    -- Get current stock
    SELECT stock INTO current_stock
    FROM products
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
    UPDATE products 
    SET stock = new_stock
    WHERE id = item_record.product_id;

    -- Log the stock movement
    INSERT INTO stock_movements (
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

-- Create function to handle order status changes
CREATE OR REPLACE FUNCTION public.handle_order_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Reduce stock for this order
    PERFORM reduce_product_stock(NEW.id);
    RAISE LOG 'Stock reduction triggered for order %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically reduce stock when order is completed
CREATE TRIGGER trigger_reduce_stock_on_completion
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_completion();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION reduce_product_stock(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_order_completion() TO authenticated;