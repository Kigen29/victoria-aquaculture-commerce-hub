// Security utilities for handling sensitive data
import { supabase } from "@/integrations/supabase/client";

/**
 * Masks a phone number for display purposes
 * Only shows first 3 and last 3 digits, masks the rest
 */
export const maskPhoneNumber = (phoneNumber: string | null): string => {
  if (!phoneNumber) return 'N/A';
  
  if (phoneNumber.length < 6) {
    return '***';
  }
  
  const firstPart = phoneNumber.substring(0, 3);
  const lastPart = phoneNumber.substring(phoneNumber.length - 3);
  const maskedMiddle = '*'.repeat(Math.max(0, phoneNumber.length - 6));
  
  return `${firstPart}${maskedMiddle}${lastPart}`;
};

/**
 * Validates that the current user owns a transaction before displaying sensitive data
 */
export const validateTransactionOwnership = async (orderId: string): Promise<boolean> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();
    
    if (error || !order) return false;
    
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id === order.user_id;
  } catch (error) {
    console.error('Error validating transaction ownership:', error);
    return false;
  }
};

/**
 * Securely fetch transaction data with enhanced audit logging
 */
export const fetchSecureTransactionData = async (orderId: string) => {
  const isOwner = await validateTransactionOwnership(orderId);
  
  if (!isOwner) {
    await logSensitiveDataAccess('UNAUTHORIZED_TRANSACTION_ACCESS', orderId);
    throw new Error('Unauthorized access to transaction data');
  }
  
  // Log the authorized access
  await logSensitiveDataAccess('TRANSACTION_DATA_ACCESS', orderId);
  
  const { data, error } = await supabase
    .from('pesapal_transactions')
    .select('*, customer_phone_display')
    .eq('order_id', orderId)
    .single();
  
  if (error) throw error;
  
  // Use the pre-masked display field and remove original sensitive data
  const secureData: any = { ...data };
  if (data?.customer_phone) {
    // Use the automatically masked display field
    secureData.customer_phone_masked = data.customer_phone_display || maskPhoneNumber(data.customer_phone);
    // Remove the original phone number completely
    delete secureData.customer_phone;
  }
  
  // Also remove the display field as we've already copied it to masked
  delete secureData.customer_phone_display;
  
  return secureData;
};

/**
 * Enhanced audit log for sensitive data access - now logs to database
 */
export const logSensitiveDataAccess = async (action: string, resourceId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Log to database using the new audit_logs table
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        action,
        table_name: 'pesapal_transactions',
        record_id: resourceId
      });
    
    if (error) {
      console.error('Failed to log audit entry:', error);
    }
    
    // Still log to console for development
    console.log(`[AUDIT] ${action} - Resource: ${resourceId} - User: ${user?.id} - Time: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error logging sensitive data access:', error);
  }
};

/**
 * Sanitize customer data for display with enhanced security
 */
export const sanitizeCustomerData = (customerData: any) => {
  if (!customerData) return customerData;
  
  const sanitized = { ...customerData };
  
  // Use pre-masked phone display field if available, otherwise mask it
  if (sanitized.customer_phone) {
    sanitized.customer_phone_masked = sanitized.customer_phone_display || maskPhoneNumber(sanitized.customer_phone);
    delete sanitized.customer_phone;
    delete sanitized.customer_phone_display;
  }
  
  // Mask email partially with improved logic
  if (sanitized.email) {
    const [localPart, domain] = sanitized.email.split('@');
    if (localPart && domain) {
      const maskedLocal = localPart.length > 3 
        ? localPart.substring(0, 2) + '*'.repeat(Math.max(1, localPart.length - 2))
        : '***';
      sanitized.email_masked = `${maskedLocal}@${domain}`;
      delete sanitized.email;
    }
  }
  
  // Remove other potential sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'api_key'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
};

/**
 * Validate and sanitize user input to prevent XSS and injection attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Validate phone number format with enhanced security
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Enhanced phone validation (international format support)
  const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
};

/**
 * Validate email format with enhanced security
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
};

/**
 * Rate limiting helper for sensitive operations
 */
export const checkRateLimit = async (action: string, userId?: string): Promise<boolean> => {
  try {
    const key = `${action}_${userId || 'anonymous'}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;
    
    // In a real implementation, you'd use Redis or similar
    // For now, we'll use a simple in-memory store
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    const recentAttempts = attempts.filter((time: number) => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    recentAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(recentAttempts));
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }
};