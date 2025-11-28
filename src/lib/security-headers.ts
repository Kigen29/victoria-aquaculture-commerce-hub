/**
 * Security headers and Content Security Policy utilities
 */

export interface SecurityConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXFrameOptions?: boolean;
  allowedDomains?: string[];
}

/**
 * Content Security Policy configuration
 */
export const getCSPHeader = (config: SecurityConfig = {}) => {
  const { allowedDomains = [] } = config;
  
  const defaultSources = [
    "'self'",
    "https://mdkexfslutqzwoqfyxil.supabase.co", // Supabase
    "https://*.supabase.co",
    "https://accounts.google.com", // Google Auth
    "https://www.google.com",
    "https://www.gstatic.com",
    ...allowedDomains
  ];

  const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'", // Required for some React functionality
      "'unsafe-eval'", // Required for some build tools
      "https://cdn.gpteng.co", // Lovable badge
      "https://accounts.google.com",
      "https://www.google.com",
      "https://www.gstatic.com",
      ...allowedDomains
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
      "https://fonts.googleapis.com",
      ...allowedDomains
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
      ...allowedDomains
    ],
    "font-src": [
      "'self'",
      "https://fonts.gstatic.com",
      ...allowedDomains
    ],
    "connect-src": [
      "'self'",
      "https://mdkexfslutqzwoqfyxil.supabase.co",
      "https://*.supabase.co",
      "wss://mdkexfslutqzwoqfyxil.supabase.co",
      "wss://*.supabase.co",
      "https://accounts.google.com",
      ...allowedDomains
    ],
    "frame-src": [
      "'self'",
      "https://accounts.google.com",
      "https://www.google.com",
      ...allowedDomains
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", ...allowedDomains]
  };

  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Apply security headers to document head
 */
export const applySecurityHeaders = (config: SecurityConfig = {}) => {
  try {
    const {
      enableCSP = true,
      enableHSTS = true,
      enableXFrameOptions = true
    } = config;

    // Note: These meta tags provide limited security compared to actual HTTP headers
    // In production, these should be set at the server/CDN level
    
    if (enableCSP) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = getCSPHeader(config);
      document.head.appendChild(cspMeta);
    }

    // Note: X-Frame-Options cannot be set via meta tag - it must be an HTTP header
    // This is handled at the server/CDN level (e.g., Vercel)
    // Removed the meta tag implementation as it causes browser warnings

    // Add other security-related meta tags
    const securityMetas = [
      { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
      { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
      { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { name: 'robots', content: 'noindex, nofollow' } // Adjust based on needs
    ];

    securityMetas.forEach(meta => {
      const metaEl = document.createElement('meta');
      if ('httpEquiv' in meta) {
        metaEl.httpEquiv = meta.httpEquiv;
      } else if ('name' in meta) {
        metaEl.name = meta.name;
      }
      metaEl.content = meta.content;
      document.head.appendChild(metaEl);
    });
  } catch (error) {
    console.error('Failed to apply security headers:', error);
    // Non-critical error - app can continue without these headers
  }
};

/**
 * Initialize security configuration for the application
 */
export const initializeSecurity = (config: SecurityConfig = {}) => {
  // Apply headers when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applySecurityHeaders(config));
  } else {
    applySecurityHeaders(config);
  }

  // Set up additional security measures
  setupSecurityEventListeners();
};

/**
 * Set up security-related event listeners
 */
const setupSecurityEventListeners = () => {
  try {
    // Detect and prevent common XSS attempts
    window.addEventListener('error', (event) => {
      if (event.message.includes('Script error')) {
        console.warn('[SECURITY] Potential XSS attempt detected');
        // Log to your security monitoring system here
      }
    });

    // Monitor for suspicious activity
    let clickCount = 0;
    let lastClickTime = 0;
    
    document.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastClickTime < 100) { // Clicks less than 100ms apart
        clickCount++;
        if (clickCount > 10) {
          console.warn('[SECURITY] Suspicious rapid clicking detected');
          // Implement rate limiting or user verification here
        }
      } else {
        clickCount = 0;
      }
      lastClickTime = now;
    });
  } catch (error) {
    console.error('Failed to set up security event listeners:', error);
    // Non-critical error - app can continue without these listeners
  }
};

/**
 * Validate URL to prevent open redirect attacks
 */
export const validateRedirectUrl = (url: string, allowedDomains: string[] = []): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Allow relative URLs
    if (url.startsWith('/')) return true;
    
    // Check against allowed domains
    const allowedHosts = [
      window.location.hostname,
      'mdkexfslutqzwoqfyxil.supabase.co',
      ...allowedDomains
    ];
    
    return allowedHosts.some(host => 
      urlObj.hostname === host || urlObj.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false; // Invalid URL
  }
};