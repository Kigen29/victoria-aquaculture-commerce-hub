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
    // Use environment variable for Google Maps API key (this should be set at build time)
    const apiKey = options.apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBqKQgBVrX8FQ6hODY2bJ4w5mxRxHLb8wc'; // Fallback to a development key
    const { libraries = ['places', 'geometry'] } = options;
    
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