import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { checkRateLimit, validateEmail, validatePhoneNumber } from '@/lib/security-utils';
import { toast } from '@/components/ui/sonner';
import { useFailedLoginTracking } from './useFailedLoginTracking';

interface SecureAuthOptions {
  requireEmailVerification?: boolean;
  enableRateLimit?: boolean;
  maxLoginAttempts?: number;
}

export function useSecureAuth(options: SecureAuthOptions = {}) {
  const { user, signIn, signOut } = useAuth();
  const { logFailedAttempt } = useFailedLoginTracking();
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const {
    requireEmailVerification = true,
    enableRateLimit = true,
    maxLoginAttempts = 5
  } = options;

  // Check for account lockout
  useEffect(() => {
    if (loginAttempts >= maxLoginAttempts) {
      setIsBlocked(true);
      toast.error("Account temporarily locked due to multiple failed attempts");
    }
  }, [loginAttempts, maxLoginAttempts]);

  const secureSignIn = async (email: string, password: string) => {
    try {
      // Input validation
      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Rate limiting check
      if (enableRateLimit && !(await checkRateLimit('login', email))) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Check if account is temporarily blocked
      if (isBlocked) {
        throw new Error('Account temporarily locked. Please try again later.');
      }

      await signIn(email, password);
      
      // Reset attempts on successful login
      setLoginAttempts(0);
      setIsBlocked(false);
      
      // Check email verification if required
      if (requireEmailVerification && user && !user.email_confirmed_at) {
        toast.warning("Please verify your email address to access all features");
      }

    } catch (error: any) {
      setLoginAttempts(prev => prev + 1);
      
      // Log failed attempt
      const result = await logFailedAttempt(email, error.message);
      if (result.blocked) {
        setIsBlocked(true);
        toast.error('Account temporarily locked due to multiple failed login attempts');
      }
      
      throw error;
    }
  };

  const secureSignOut = async () => {
    try {
      await signOut();
      
      // Clear any sensitive data from localStorage
      const sensitiveKeys = ['auth-token', 'user-data', 'payment-info'];
      sensitiveKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear session storage
      sessionStorage.clear();
      
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error('Secure sign out error:', error);
      throw error;
    }
  };

  return {
    secureSignIn,
    secureSignOut,
    loginAttempts,
    isBlocked,
    resetAttempts: () => {
      setLoginAttempts(0);
      setIsBlocked(false);
    }
  };
}