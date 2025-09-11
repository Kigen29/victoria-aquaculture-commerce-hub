import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import "@/types/google-maps";

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  onAddressSelect?: (addressData: {
    formatted_address: string;
    lat: number;
    lng: number;
    components: any;
  }) => void;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function GoogleAddressAutocomplete({ 
  value, 
  onChange, 
  onCoordinatesChange,
  onAddressSelect 
}: GoogleAddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const { isLoaded: mapsLoaded, loadError } = useGoogleMapsLoader();

  // Show error if Google Maps failed to load
  useEffect(() => {
    if (loadError) {
      toast.error('Failed to load Google Maps. Please refresh the page.');
    }
  }, [loadError]);

  // Fetch autocomplete predictions
  const fetchPredictions = async (inputText: string) => {
    if (!inputText.trim() || inputText.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!window.google || !window.google.maps || !mapsLoaded) {
      console.warn('Google Maps API not loaded yet');
      return;
    }

    setLoading(true);

    try {
      const service = new window.google.maps.places.AutocompleteService();
      
      service.getPlacePredictions({
        input: inputText,
        componentRestrictions: { country: 'ke' }, // Restrict to Kenya
        location: new window.google.maps.LatLng(-1.2921, 36.8219), // Nairobi center
        radius: 50000, // 50km radius around Nairobi
        types: ['establishment', 'geocode'] // Include both businesses and addresses
      }, (predictions, status) => {
        setLoading(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      setLoading(false);
      console.error('Error fetching predictions:', error);
    }
  };

  // Handle input changes with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the API call
    timeoutRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  // Get place details when a suggestion is selected
  const handleSuggestionSelect = async (placeId: string, description: string) => {
    if (!window.google || !window.google.maps || !mapsLoaded) {
      return;
    }

    setLoading(true);
    setShowSuggestions(false);

    try {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.getDetails({
        placeId: placeId,
        fields: ['formatted_address', 'geometry', 'address_components', 'name']
      }, (place, status) => {
        setLoading(false);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();

          if (lat && lng) {
            onChange(place.formatted_address || description);
            onCoordinatesChange?.(lat, lng);
            onAddressSelect?.({
              formatted_address: place.formatted_address || description,
              lat,
              lng,
              components: place.address_components
            });

            toast.success('Address selected successfully');
          } else {
            toast.error('Could not get coordinates for this address');
          }
        } else {
          toast.error('Failed to get address details');
        }
      });
    } catch (error) {
      setLoading(false);
      console.error('Error getting place details:', error);
      toast.error('Error getting address details');
    }
  };

  // Get current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setLoadingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (!window.google || !window.google.maps) {
          setLoadingCurrentLocation(false);
          toast.error('Google Maps not loaded');
          return;
        }

        try {
          const geocoder = new window.google.maps.Geocoder();
          
          geocoder.geocode({
            location: new window.google.maps.LatLng(latitude, longitude)
          }, (results, status) => {
            setLoadingCurrentLocation(false);

            if (status === 'OK' && results && results[0]) {
              const address = results[0].formatted_address;
              onChange(address);
              onCoordinatesChange?.(latitude, longitude);
              onAddressSelect?.({
                formatted_address: address,
                lat: latitude,
                lng: longitude,
                components: results[0].address_components
              });

              toast.success('Current location detected');
            } else {
              toast.error('Could not get address for current location');
            }
          });
        } catch (error) {
          setLoadingCurrentLocation(false);
          console.error('Geocoding error:', error);
          toast.error('Failed to get address for current location');
        }
      },
      (error) => {
        setLoadingCurrentLocation(false);
        console.error('Geolocation error:', error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out.');
            break;
          default:
            toast.error('An unknown error occurred while getting location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder="Enter your delivery address (e.g., Westlands, Karen, CBD...)"
            value={value}
            onChange={handleInputChange}
            onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
            className="pr-10"
            disabled={loading}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
          disabled={loadingCurrentLocation}
          className="px-3"
          title="Use current location"
        >
          {loadingCurrentLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors"
              onClick={() => handleSuggestionSelect(suggestion.place_id, suggestion.description)}
            >
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {suggestion.structured_formatting.main_text}
                </span>
                <span className="text-xs text-muted-foreground">
                  {suggestion.structured_formatting.secondary_text}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}