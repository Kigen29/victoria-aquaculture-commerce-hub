-- Fix security definer view warnings by recreating views without security_barrier
DROP VIEW IF EXISTS public.recent_audit_summary;
DROP VIEW IF EXISTS public.suspicious_activity_summary;

-- Recreate views without problematic security settings
CREATE VIEW public.recent_audit_summary AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  action,
  COUNT(*) as event_count
FROM public.audit_logs
WHERE created_at > now() - interval '24 hours'
  AND (
    has_role(auth.uid(), 'admin') 
    OR user_id = auth.uid()
  )
GROUP BY DATE_TRUNC('hour', created_at), action
ORDER BY hour DESC, event_count DESC;

CREATE VIEW public.suspicious_activity_summary AS
SELECT 
  user_id,
  action,
  COUNT(*) as occurrence_count,
  MAX(created_at) as last_occurrence
FROM public.audit_logs
WHERE (action LIKE '%ANOMALY%' OR action LIKE '%SUSPICIOUS%')
  AND created_at > now() - interval '7 days'
  AND (
    has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
  )
GROUP BY user_id, action
ORDER BY occurrence_count DESC, last_occurrence DESC;

-- Grant access
GRANT SELECT ON public.recent_audit_summary TO authenticated;
GRANT SELECT ON public.suspicious_activity_summary TO authenticated;
