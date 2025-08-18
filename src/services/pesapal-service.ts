import {
  PESAPAL_CONFIG,
  PesapalTokenResponse,
  PesapalIPNResponse,
  PesapalOrderRequest,
  PesapalOrderResponse,
  PesapalTransactionStatus,
  PesapalCallbackData,
  getBaseHeaders,
  getAuthHeaders,
  buildApiUrl,
  handlePesapalError,
} from '@/lib/pesapal-config';

class PesapalService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private ipnId: string | null = null;

  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Makes an HTTP request with retry logic
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    retries = this.MAX_RETRIES
  ): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw handlePesapalError(data);
      }

      return data;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.makeRequest(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Checks if the current token is valid and not expired
   */
  private isTokenValid(): boolean {
    return this.token !== null && 
           this.tokenExpiry !== null && 
           new Date() < this.tokenExpiry;
  }

  /**
   * Gets OAuth access token from Pesapal
   * Note: This service is deprecated for frontend use. 
   * All Pesapal operations should go through backend edge functions.
   */
  async getPesapalToken(): Promise<string> {
    throw new Error('Pesapal operations should be handled by backend edge functions for security. Use the create-pesapal-order edge function instead.');
  }

  /**
   * Registers the IPN (callback) URL with Pesapal
   * Note: This service is deprecated for frontend use.
   */
  async registerIPN(ipnUrl?: string): Promise<string> {
    throw new Error('Pesapal operations should be handled by backend edge functions for security. Use the create-pesapal-order edge function instead.');
  }

  /**
   * Creates a payment order and returns iframe URL
   * Note: This service is deprecated for frontend use.
   */
  async createPaymentOrder(orderData: PesapalOrderRequest): Promise<PesapalOrderResponse> {
    throw new Error('Pesapal operations should be handled by backend edge functions for security. Use the create-pesapal-order edge function instead.');
  }

  /**
   * Checks payment status using order tracking ID
   * Note: This service is deprecated for frontend use.
   */
  async getTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
    throw new Error('Pesapal operations should be handled by backend edge functions for security. Use the sync-payment-status edge function instead.');
  }

  /**
   * Verifies and processes payment callbacks
   * Note: This service is deprecated for frontend use.
   */
  async verifyCallback(callbackData: PesapalCallbackData): Promise<PesapalTransactionStatus> {
    throw new Error('Pesapal operations should be handled by backend edge functions for security. Use the pesapal-callback edge function instead.');
  }

  /**
   * Utility method to clear cached token (useful for testing or force refresh)
   */
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Utility method to clear cached IPN ID
   */
  clearIPN(): void {
    this.ipnId = null;
  }
}

// Export a singleton instance
export const pesapalService = new PesapalService();

// Export the class for testing purposes
export { PesapalService };