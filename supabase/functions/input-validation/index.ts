import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation utilities for server-side validation
const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
};

const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, 1000) // Limit length
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

const validateOrderData = (orderData: any) => {
  const errors: string[] = [];
  
  if (!orderData.email || !validateEmail(orderData.email)) {
    errors.push('Invalid email address');
  }
  
  if (orderData.phone && !validatePhoneNumber(orderData.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  }
  
  if (orderData.items) {
    orderData.items.forEach((item: any, index: number) => {
      if (!item.product_id || typeof item.product_id !== 'string') {
        errors.push(`Invalid product ID at item ${index + 1}`);
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 100) {
        errors.push(`Invalid quantity at item ${index + 1} (must be 1-100)`);
      }
    });
  }
  
  if (orderData.total_amount && (typeof orderData.total_amount !== 'number' || orderData.total_amount <= 0 || orderData.total_amount > 1000000)) {
    errors.push('Invalid total amount');
  }
  
  return errors;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Authentication required");
    }

    const { action, data } = await req.json();
    
    let validationResult = { valid: false, errors: [], sanitizedData: null };

    switch (action) {
      case 'validate_order':
        const orderErrors = validateOrderData(data);
        validationResult = {
          valid: orderErrors.length === 0,
          errors: orderErrors,
          sanitizedData: {
            ...data,
            email: sanitizeInput(data.email || ''),
            phone: sanitizeInput(data.phone || ''),
            address: sanitizeInput(data.address || ''),
            full_name: sanitizeInput(data.full_name || '')
          }
        };
        break;
        
      case 'validate_profile':
        const profileErrors = [];
        
        if (data.email && !validateEmail(data.email)) {
          profileErrors.push('Invalid email address');
        }
        
        if (data.phone && !validatePhoneNumber(data.phone)) {
          profileErrors.push('Invalid phone number format');
        }
        
        validationResult = {
          valid: profileErrors.length === 0,
          errors: profileErrors,
          sanitizedData: {
            full_name: sanitizeInput(data.full_name || ''),
            phone: sanitizeInput(data.phone || ''),
            address: sanitizeInput(data.address || ''),
            email: sanitizeInput(data.email || '')
          }
        };
        break;
        
      case 'sanitize_content':
        validationResult = {
          valid: true,
          errors: [],
          sanitizedData: {
            content: sanitizeInput(data.content || ''),
            title: sanitizeInput(data.title || '')
          }
        };
        break;
        
      default:
        throw new Error('Invalid validation action');
    }

    // Log validation attempt for audit
    console.log(`[VALIDATION] Action: ${action}, User: ${user.id}, Valid: ${validationResult.valid}, Errors: ${validationResult.errors.length}`);

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        errors: [error.message || 'Validation failed'],
        sanitizedData: null 
      }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});