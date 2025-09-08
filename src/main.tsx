import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecurity } from '@/lib/security-headers'

// Initialize security measures
initializeSecurity({
  enableCSP: true,
  enableHSTS: true,
  enableXFrameOptions: true,
  allowedDomains: [
    'https://www.pesapal.com', // For payment processing
    'https://pay.pesapal.com'
  ]
});

createRoot(document.getElementById("root")!).render(<App />);
