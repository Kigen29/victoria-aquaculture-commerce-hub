import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const { isLoaded: mapsLoaded, loadError } = useGoogleMapsLoader({
    libraries: ['places']
  });

  // Log warning if Google Maps failed to load (don't show user-facing error)
  useEffect(() => {
    if (loadError) {
      console.warn('Address autocomplete unavailable:', loadError);
    }
  }, [loadError]);

  // Fetch autocomplete predictions
  const fetchPredictions = async (inputText: string) => {
    if (!inputText.trim() || inputText.length < 2) {
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
        radius: 15000, // 15km radius for more specific results
        types: ['address'], // Focus on specific addresses
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
    }, 200);
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
        fields: ['formatted_address', 'geometry', 'address_components', 'name', 'vicinity', 'place_id'],
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


  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Type your specific address: e.g., Kilimani Road, Nairobi..."
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

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors border-b border-border last:border-b-0"
              onClick={() => handleSuggestionSelect(suggestion.place_id, suggestion.description)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-sm truncate">
                    {suggestion.structured_formatting.main_text}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}