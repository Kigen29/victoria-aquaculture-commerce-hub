import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecurity } from '@/lib/security-headers'

// Initialize security measures
initializeSecurity({
  enableCSP: true,
  enableHSTS: true,
  enableXFrameOptions: false, // X-Frame-Options only works as HTTP header, not meta tag
  allowedDomains: [
    'https://www.pesapal.com', // For payment processing
    'https://pay.pesapal.com',
    'https://cdn.gpteng.co' // Lovable badge
  ]
});

createRoot(document.getElementById("root")!).render(<App />);
