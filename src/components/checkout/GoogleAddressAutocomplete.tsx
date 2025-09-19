import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GoogleAddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (coordinates: { lat: number; lng: number }) => void;
  onAddressSelect?: (addressData: {
    address: string;
    coordinates: { lat: number; lng: number };
    placeId: string;
    addressComponents: any[];
  }) => void;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types?: string[];
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  // Fetch autocomplete predictions
  const fetchPredictions = async (inputText: string) => {
    if (!inputText.trim() || inputText.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
        body: { 
          action: 'autocomplete',
          input: inputText,
          sessionToken: sessionTokenRef.current
        }
      });

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setLoading(false);

      if (error) {
        console.error('Error fetching predictions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const predictions = data?.predictions || [];
      setSuggestions(predictions);
      setShowSuggestions(predictions.length > 0);
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      setLoading(false);
      console.error('Error fetching predictions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
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

    // Debounce the API call - increased to 300ms for smoother typing
    timeoutRef.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 300);
  };

  // Get place details when a suggestion is selected
  const handleSuggestionSelect = async (suggestion: PlacePrediction) => {
    setShowSuggestions(false);
    setLoading(true);

    // Generate new session token for next search session
    sessionTokenRef.current = crypto.randomUUID();

    try {
      const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
        body: { 
          action: 'details',
          placeId: suggestion.place_id,
          sessionToken: sessionTokenRef.current
        }
      });

      setLoading(false);

      if (error) {
        console.error('Error getting place details:', error);
        toast.error('Failed to get place details');
        // Fallback to just using the suggestion description
        onChange(suggestion.description);
        return;
      }

      const { address, coordinates, addressComponents, name, types } = data;

      // Use building name if available for better specificity
      const displayAddress = name && types?.includes('establishment') ? 
        `${name}, ${address}` : address;

      onChange(displayAddress);
      
      if (coordinates && onCoordinatesChange) {
        onCoordinatesChange(coordinates);
      }

      if (onAddressSelect) {
        onAddressSelect({
          address: displayAddress,
          coordinates,
          placeId: suggestion.place_id,
          addressComponents: addressComponents || []
        });
      }

      toast.success('Address selected successfully');
    } catch (error) {
      setLoading(false);
      console.error('Error getting place details:', error);
      toast.error('Failed to get place details');
      // Fallback to just using the suggestion description
      onChange(suggestion.description);
    }
  };


  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Type your specific address: e.g., Building name, Street, Nairobi..."
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
          className="pr-10"
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
              onClick={() => handleSuggestionSelect(suggestion)}
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
                  {suggestion.types?.includes('establishment') && (
                    <span className="text-xs text-primary font-medium">Building</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}