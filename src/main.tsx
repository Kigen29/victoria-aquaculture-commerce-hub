import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecurity } from '@/lib/security-headers'

// Initialize security measures
initializeSecurity({
  enableCSP: true,
  enableHSTS: true,
  enableXFrameOptions: false, // X-Frame-Options can't be set via meta tags
  allowedDomains: [
    'https://www.pesapal.com', // For payment processing
    'https://pay.pesapal.com',
    'https://storage.googleapis.com', // For file uploads
    'https://cdn.gpteng.co' // For Lovable analytics
  ]
});

createRoot(document.getElementById("root")!).render(<App />);
