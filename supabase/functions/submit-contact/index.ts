import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 5 submissions per IP per 15 minutes
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_SUBMISSIONS = 5;

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

// In-memory rate limiting store (for simple implementation)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000); // Clean every minute

const validatePhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const phoneRegex = /^(\+\d{1,4})?\d{7,14}$/;
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 15;
};

const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.trim().slice(0, 100)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

const getClientIP = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || realIP || 'unknown';
};

const checkRateLimit = (ip: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry) {
    rateLimitStore.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_SUBMISSIONS - 1 };
  }

  // Reset if window has passed
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_SUBMISSIONS - 1 };
  }

  // Check if limit exceeded
  if (entry.count >= MAX_SUBMISSIONS) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  entry.count++;
  return { allowed: true, remaining: MAX_SUBMISSIONS - entry.count };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    
    // Check rate limit
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many submissions. Please try again in 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { phone_number, opt_in_reason } = await req.json();

    // Validate inputs
    if (!phone_number || typeof phone_number !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Phone number is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sanitizedPhone = sanitizeInput(phone_number);
    const sanitizedReason = sanitizeInput(opt_in_reason || 'all');

    // Validate phone number format
    if (!validatePhoneNumber(sanitizedPhone)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid phone number format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicate phone number
    const { data: existing, error: checkError } = await supabase
      .from('contact_numbers')
      .select('id')
      .eq('phone_number', sanitizedPhone)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking duplicate:', checkError);
      throw checkError;
    }

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This phone number is already registered',
        code: 'DUPLICATE_PHONE'
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert contact number with IP logging
    const { data, error } = await supabase
      .from('contact_numbers')
      .insert({
        phone_number: sanitizedPhone,
        opt_in_reason: sanitizedReason
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting contact:', error);
      throw error;
    }

    // Log submission for monitoring
    console.log(`Contact submission: ${sanitizedPhone} from IP ${clientIP}, remaining: ${rateCheck.remaining}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully registered for promotions',
      remaining_submissions: rateCheck.remaining
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in submit-contact:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process submission. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);
