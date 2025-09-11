import { useState, useEffect } from 'react';

interface GoogleMapsLoaderOptions {
  apiKey?: string;
  libraries?: string[];
}

export const useGoogleMapsLoader = (options: GoogleMapsLoaderOptions = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for the existing script to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      
      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(checkLoaded), 10000);
      return;
    }

    const script = document.createElement('script');
    const { apiKey = 'YOUR_API_KEY_PLACEHOLDER', libraries = ['places'] } = options;
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      setLoadError(null);
    };
    
    script.onerror = () => {
      setLoadError('Failed to load Google Maps API');
      setIsLoaded(false);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts before loading
      if (!isLoaded && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return { isLoaded, loadError };
};