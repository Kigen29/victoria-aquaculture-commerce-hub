-- Create enum for pesapal transaction status
CREATE TYPE pesapal_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- Create pesapal_transactions table
CREATE TABLE public.pesapal_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    pesapal_tracking_id TEXT UNIQUE NOT NULL,
    merchant_reference TEXT UNIQUE NOT NULL,
    iframe_url TEXT,
    status pesapal_status NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KES',
    customer_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Create pesapal_callbacks table
CREATE TABLE public.pesapal_callbacks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pesapal_tracking_id TEXT NOT NULL,
    callback_type TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add pesapal_transaction_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN pesapal_transaction_id UUID REFERENCES public.pesapal_transactions(id);

-- Enable RLS on both tables
ALTER TABLE public.pesapal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesapal_callbacks ENABLE ROW LEVEL SECURITY;

-- RLS policies for pesapal_transactions
CREATE POLICY "Users can view their own pesapal transactions" 
ON public.pesapal_transactions 
FOR SELECT 
USING (
    order_id IN (
        SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own pesapal transactions" 
ON public.pesapal_transactions 
FOR INSERT 
WITH CHECK (
    order_id IN (
        SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own pesapal transactions" 
ON public.pesapal_transactions 
FOR UPDATE 
USING (
    order_id IN (
        SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
);

-- RLS policies for pesapal_callbacks (admin/system access only for now)
CREATE POLICY "Service role can manage pesapal callbacks" 
ON public.pesapal_callbacks 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pesapal_transactions updated_at
CREATE TRIGGER update_pesapal_transactions_updated_at
    BEFORE UPDATE ON public.pesapal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_pesapal_transactions_order_id ON public.pesapal_transactions(order_id);
CREATE INDEX idx_pesapal_transactions_tracking_id ON public.pesapal_transactions(pesapal_tracking_id);
CREATE INDEX idx_pesapal_callbacks_tracking_id ON public.pesapal_callbacks(pesapal_tracking_id);
CREATE INDEX idx_pesapal_callbacks_processed ON public.pesapal_callbacks(processed);
CREATE INDEX idx_orders_pesapal_transaction_id ON public.orders(pesapal_transaction_id);