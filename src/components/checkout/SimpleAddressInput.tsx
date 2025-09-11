import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";

// Fallback component when Google Maps is not available
const nairobiLocations = [
  "Westlands, Nairobi", "Kilimani, Nairobi", "Kileleshwa, Nairobi", "Lavington, Nairobi",
  "Karen, Nairobi", "Parklands, Nairobi", "Gigiri, Nairobi", "South B, Nairobi",
  "South C, Nairobi", "Eastleigh, Nairobi", "Umoja, Nairobi", "Kasarani, Nairobi",
  "Roysambu, Nairobi", "Kitisuru, Nairobi", "Runda, Nairobi", "Muthaiga, Nairobi",
  "Langata, Nairobi", "Embakasi, Nairobi", "Donholm, Nairobi", "Buruburu, Nairobi",
  "CBD, Nairobi", "Hurlingham, Nairobi", "Dagoretti, Nairobi", "Pipeline, Nairobi"
];

interface SimpleAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (addressData: {
    formatted_address: string;
    lat?: number;
    lng?: number;
  }) => void;
}

export function SimpleAddressInput({ 
  value, 
  onChange, 
  onAddressSelect 
}: SimpleAddressInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Filter locations based on input
    if (newValue && newValue.length >= 2) {
      const filtered = nairobiLocations.filter(location =>
        location.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (address: string) => {
    onChange(address);
    setShowSuggestions(false);
    onAddressSelect?.({
      formatted_address: address
    });
    toast.success('Address selected. Delivery fee will be calculated automatically.');
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const approximateAddress = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        onChange(approximateAddress);
        onAddressSelect?.({
          formatted_address: approximateAddress,
          lat: latitude,
          lng: longitude
        });
        toast.success('Current location detected');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not get current location. Please enter address manually.');
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
          />
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
          className="px-3"
          title="Use current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Simple Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-colors text-sm"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}