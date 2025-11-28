/**
 * Generate a UUID v4 with fallback for older browsers
 * crypto.randomUUID() is not supported on iOS Safari < 15.4
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID first with full error handling
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    // iOS Safari may throw "Operation is insecure" even when just accessing crypto properties
    console.warn('crypto.randomUUID not available, using fallback');
  }
  
  // Fallback for older browsers (iOS Safari < 15.4, etc.)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
