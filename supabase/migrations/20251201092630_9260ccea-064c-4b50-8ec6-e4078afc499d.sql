-- Update handle_new_user function to support Google OAuth metadata
-- Google OAuth provides 'name' field instead of 'full_name'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert into profiles with data from user metadata
  -- Handle both email/password signup (full_name) and Google OAuth (name)
  INSERT INTO public.profiles (id, full_name, phone, address, email)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'user_name'
    ),
    NEW.raw_user_meta_data ->> 'phone', 
    NEW.raw_user_meta_data ->> 'address',
    NEW.email
  );
  RETURN NEW;
END;
$$;