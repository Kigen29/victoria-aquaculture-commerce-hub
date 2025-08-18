// Pesapal Configuration Constants
// Note: Consumer keys are handled securely in the backend edge functions
export const PESAPAL_CONFIG = {
  BASE_URL: 'https://pay.pesapal.com/v3', // Production URL
  IPN_URL: `${window.location.origin}/api/pesapal/callback`,
  CALLBACK_URL: `${window.location.origin}/order-success`,
} as const;

// TypeScript Types for Pesapal API
export interface PesapalTokenResponse {
  token: string;
  expiryDate: string;
  error?: {
    code: string;
    message: string;
    description: string;
  };
}

export interface PesapalIPNResponse {
  url: string;
  created_date: string;
  ipn_id: string;
  error?: {
    code: string;
    message: string;
    description: string;
  };
}

export interface PesapalOrderRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: {
    email_address: string;
    phone_number?: string;
    country_code?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

export interface PesapalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: {
    code: string;
    message: string;
    description: string;
  };
}

export interface PesapalTransactionStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: number;
  merchant_reference: string;
  payment_status_code: string;
  currency: string;
  error?: {
    code: string;
    message: string;
    description: string;
  };
}

export interface PesapalCallbackData {
  OrderTrackingId: string;
  OrderMerchantReference: string;
  OrderNotificationType: string;
}

// Payment Status Codes
export const PESAPAL_STATUS_CODES = {
  PENDING: '0',
  COMPLETED: '1',
  FAILED: '2',
  INVALID: '3',
} as const;

// Utility functions
export const getBaseHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

export const getAuthHeaders = (token: string) => ({
  ...getBaseHeaders(),
  'Authorization': `Bearer ${token}`,
});

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${PESAPAL_CONFIG.BASE_URL}${endpoint}`;
};

// Error handling helper
export const handlePesapalError = (error: any): Error => {
  if (error.error) {
    return new Error(`Pesapal API Error: ${error.error.message || error.error.description || 'Unknown error'}`);
  }
  return new Error(`Network Error: ${error.message || 'Request failed'}`);
};
