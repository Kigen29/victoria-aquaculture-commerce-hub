-- Add explicit admin policies for critical tables (corrected)

-- Policies for products table (admin operations)
CREATE POLICY "Admin can manage products" 
ON public.products 
FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE has_role(id, 'admin')
));

-- Policies for categories table (admin operations)  
CREATE POLICY "Admin can manage categories"
ON public.categories
FOR ALL
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE has_role(id, 'admin')
));

-- Policies for audit_logs table (admin read access)
CREATE POLICY "Admin can view audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE has_role(id, 'admin')
));

-- Enhanced order policies for admin management
CREATE POLICY "Admin can manage all orders"
ON public.orders
FOR ALL
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE has_role(id, 'admin')
));

-- Enhanced transaction policies for admin oversight
CREATE POLICY "Admin can view all transactions"
ON public.pesapal_transactions
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE has_role(id, 'admin')
));

-- Ensure user_roles table has proper admin management
CREATE POLICY "Admin can manage user roles"
ON public.user_roles
FOR ALL
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE has_role(id, 'admin')
));