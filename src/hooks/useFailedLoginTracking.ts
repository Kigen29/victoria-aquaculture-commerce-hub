import { supabase } from '@/integrations/supabase/client';

export function useFailedLoginTracking() {
  const logFailedAttempt = async (email: string, reason: string) => {
    try {
      // Get IP address from a service (in production, this would be server-side)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      await supabase.from('failed_login_attempts').insert({
        email,
        ip_address: ip,
        user_agent: navigator.userAgent,
        reason,
      });

      // Check if threshold exceeded
      const { data, error } = await supabase.rpc('check_failed_login_threshold', {
        user_email: email,
        ip_addr: ip,
      });

      if (error) {
        console.error('Error checking login threshold:', error);
        return { blocked: false, email_failures: 0, ip_failures: 0 };
      }

      // Parse JSON response
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      return result || { blocked: false, email_failures: 0, ip_failures: 0 };
    } catch (error) {
      console.error('Error logging failed login:', error);
      return { blocked: false };
    }
  };

  return { logFailedAttempt };
}
