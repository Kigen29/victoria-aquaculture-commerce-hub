-- Drop unused views that reference SECURITY DEFINER functions
-- These views are not used in the application and are flagged by the security linter

DROP VIEW IF EXISTS public.recent_audit_summary;
DROP VIEW IF EXISTS public.suspicious_activity_summary;

COMMENT ON TABLE public.audit_logs IS 'Security views removed - query audit_logs table directly with appropriate filters instead';