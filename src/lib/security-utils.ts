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
 * Securely fetch transaction data with masked phone numbers
 */
export const fetchSecureTransactionData = async (orderId: string) => {
  const isOwner = await validateTransactionOwnership(orderId);
  
  if (!isOwner) {
    throw new Error('Unauthorized access to transaction data');
  }
  
  const { data, error } = await supabase
    .from('pesapal_transactions')
    .select('*')
    .eq('order_id', orderId)
    .single();
  
  if (error) throw error;
  
  // Create a new object with masked phone number
  const maskedData = { ...data };
  if (data?.customer_phone) {
    (maskedData as any).customer_phone_masked = maskPhoneNumber(data.customer_phone);
    // Remove the original phone number from the response for extra security
    delete (maskedData as any).customer_phone;
  }
  
  return maskedData;
};

/**
 * Audit log for sensitive data access
 */
export const logSensitiveDataAccess = async (action: string, resourceId: string) => {
  try {
    // In a production environment, you might want to log this to a secure audit table
    console.log(`[AUDIT] ${action} - Resource: ${resourceId} - User: ${(await supabase.auth.getUser()).data.user?.id} - Time: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error logging sensitive data access:', error);
  }
};

/**
 * Sanitize customer data for display
 */
export const sanitizeCustomerData = (customerData: any) => {
  if (!customerData) return customerData;
  
  const sanitized = { ...customerData };
  
  // Mask phone numbers
  if (sanitized.customer_phone) {
    sanitized.customer_phone_masked = maskPhoneNumber(sanitized.customer_phone);
    delete sanitized.customer_phone;
  }
  
  // Mask email partially
  if (sanitized.email) {
    const [localPart, domain] = sanitized.email.split('@');
    if (localPart && domain) {
      const maskedLocal = localPart.length > 3 
        ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2) 
        : '***';
      sanitized.email_masked = `${maskedLocal}@${domain}`;
      delete sanitized.email;
    }
  }
  
  return sanitized;
};