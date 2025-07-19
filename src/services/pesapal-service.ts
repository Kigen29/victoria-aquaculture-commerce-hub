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
   */
  async getPesapalToken(): Promise<string> {
    if (this.isTokenValid() && this.token) {
      return this.token;
    }

    const url = buildApiUrl('/api/Auth/RequestToken');
    const body = {
      consumer_key: PESAPAL_CONFIG.CONSUMER_KEY,
      consumer_secret: PESAPAL_CONFIG.CONSUMER_SECRET,
    };

    try {
      const response = await this.makeRequest<PesapalTokenResponse>(url, {
        method: 'POST',
        headers: getBaseHeaders(),
        body: JSON.stringify(body),
      });

      this.token = response.token;
      this.tokenExpiry = new Date(response.expiryDate);

      return this.token;
    } catch (error) {
      console.error('Failed to get Pesapal token:', error);
      throw new Error('Failed to authenticate with Pesapal');
    }
  }

  /**
   * Registers the IPN (callback) URL with Pesapal
   */
  async registerIPN(ipnUrl?: string): Promise<string> {
    if (this.ipnId) {
      return this.ipnId;
    }

    const token = await this.getPesapalToken();
    const url = buildApiUrl('/api/URLSetup/RegisterIPN');
    const body = {
      url: ipnUrl || PESAPAL_CONFIG.IPN_URL,
      ipn_notification_type: 'GET',
    };

    try {
      const response = await this.makeRequest<PesapalIPNResponse>(url, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
      });

      this.ipnId = response.ipn_id;
      return this.ipnId;
    } catch (error) {
      console.error('Failed to register IPN:', error);
      throw new Error('Failed to register callback URL with Pesapal');
    }
  }

  /**
   * Creates a payment order and returns iframe URL
   */
  async createPaymentOrder(orderData: PesapalOrderRequest): Promise<PesapalOrderResponse> {
    const token = await this.getPesapalToken();
    const ipnId = await this.registerIPN();

    const url = buildApiUrl('/api/Transactions/SubmitOrderRequest');
    const body = {
      ...orderData,
      notification_id: ipnId,
    };

    try {
      const response = await this.makeRequest<PesapalOrderResponse>(url, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
      });

      return response;
    } catch (error) {
      console.error('Failed to create payment order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Checks payment status using order tracking ID
   */
  async getTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
    const token = await this.getPesapalToken();
    const url = buildApiUrl(`/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`);

    try {
      const response = await this.makeRequest<PesapalTransactionStatus>(url, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });

      return response;
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw new Error('Failed to get transaction status');
    }
  }

  /**
   * Verifies and processes payment callbacks
   */
  async verifyCallback(callbackData: PesapalCallbackData): Promise<PesapalTransactionStatus> {
    const { OrderTrackingId } = callbackData;

    try {
      // Get the transaction status to verify the callback
      const transactionStatus = await this.getTransactionStatus(OrderTrackingId);
      
      // Additional verification logic can be added here
      // For example, checking if the merchant reference matches our records
      
      return transactionStatus;
    } catch (error) {
      console.error('Failed to verify callback:', error);
      throw new Error('Failed to verify payment callback');
    }
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