-- Phase 3: Enhanced Data Protection - Profile change notifications
-- Create a trigger to log profile changes and notify users

-- Add a notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_change_alerts BOOLEAN DEFAULT true,
  suspicious_activity_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changes_detected TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Detect what changed
  IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
    changes_detected := array_append(changes_detected, 'full_name');
  END IF;
  
  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    changes_detected := array_append(changes_detected, 'phone');
  END IF;
  
  IF OLD.address IS DISTINCT FROM NEW.address THEN
    changes_detected := array_append(changes_detected, 'address');
  END IF;
  
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    changes_detected := array_append(changes_detected, 'email');
  END IF;

  -- Log to audit_logs if changes detected
  IF array_length(changes_detected, 1) > 0 THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
    VALUES (
      NEW.id,
      'PROFILE_UPDATE: ' || array_to_string(changes_detected, ', '),
      'profiles',
      NEW.id
    );
    
    RAISE LOG 'Profile updated for user %: %', NEW.id, array_to_string(changes_detected, ', ');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for profile changes
DROP TRIGGER IF EXISTS profile_changes_trigger ON public.profiles;
CREATE TRIGGER profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();

-- Phase 4: Monitoring & Auditing - Failed login tracking
-- Create a table to track failed login attempts
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT
);

ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage failed login attempts"
  ON public.failed_login_attempts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view failed login attempts"
  ON public.failed_login_attempts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Function to check for suspicious login patterns
CREATE OR REPLACE FUNCTION public.check_failed_login_threshold(user_email TEXT, ip_addr INET)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures INTEGER;
  ip_failures INTEGER;
  result JSON;
BEGIN
  -- Count failures for this email in last 15 minutes
  SELECT COUNT(*) INTO recent_failures
  FROM public.failed_login_attempts
  WHERE email = user_email
    AND attempted_at > now() - interval '15 minutes';

  -- Count failures from this IP in last 15 minutes
  SELECT COUNT(*) INTO ip_failures
  FROM public.failed_login_attempts
  WHERE ip_address = ip_addr
    AND attempted_at > now() - interval '15 minutes';

  -- Log if threshold exceeded
  IF recent_failures >= 5 OR ip_failures >= 10 THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, ip_address)
    VALUES (
      NULL,
      'SUSPICIOUS_LOGIN_ACTIVITY: ' || recent_failures || ' attempts for ' || user_email,
      'auth',
      ip_addr
    );
    
    RAISE LOG 'Suspicious login activity: % failures for %, % from IP %', 
      recent_failures, user_email, ip_failures, ip_addr;
  END IF;

  result := json_build_object(
    'email_failures', recent_failures,
    'ip_failures', ip_failures,
    'blocked', recent_failures >= 5 OR ip_failures >= 10
  );

  RETURN result;
END;
$$;

-- Create helpful views for monitoring
CREATE OR REPLACE VIEW public.recent_audit_summary AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  action,
  COUNT(*) as event_count
FROM public.audit_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), action
ORDER BY hour DESC, event_count DESC;

CREATE OR REPLACE VIEW public.suspicious_activity_summary AS
SELECT 
  user_id,
  action,
  COUNT(*) as occurrence_count,
  MAX(created_at) as last_occurrence
FROM public.audit_logs
WHERE action LIKE '%ANOMALY%' OR action LIKE '%SUSPICIOUS%'
  AND created_at > now() - interval '7 days'
GROUP BY user_id, action
ORDER BY occurrence_count DESC, last_occurrence DESC;

-- Grant access to views
GRANT SELECT ON public.recent_audit_summary TO authenticated;
GRANT SELECT ON public.suspicious_activity_summary TO authenticated;

-- Add RLS to views
ALTER VIEW public.recent_audit_summary SET (security_barrier = true);
ALTER VIEW public.suspicious_activity_summary SET (security_barrier = true);
