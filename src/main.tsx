import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from '@/components/ErrorBoundary'

// NOTE: Security headers are now defined statically in index.html
// Dynamic security initialization removed for iOS Safari compatibility
// iOS Safari throws "Operation is insecure" when JavaScript manipulates httpEquiv meta tags

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
