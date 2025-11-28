import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecurity } from '@/lib/security-headers'
import ErrorBoundary from '@/components/ErrorBoundary'

// Initialize security measures with defensive error handling for iOS compatibility
try {
  initializeSecurity({
    enableCSP: false, // CSP is already set in index.html - prevent duplicate
    enableHSTS: true,
    enableXFrameOptions: false, // X-Frame-Options only works as HTTP header, not meta tag
    allowedDomains: [
      'https://www.pesapal.com', // For payment processing
      'https://pay.pesapal.com',
      'https://*.pesapal.com', // All Pesapal subdomains
      'https://cdn.gpteng.co', // Lovable badge
      'https://maps.googleapis.com' // Google Maps API
    ]
  });
} catch (error) {
  console.warn('Security initialization failed (non-critical):', error);
  // App will still load even if security initialization fails
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
