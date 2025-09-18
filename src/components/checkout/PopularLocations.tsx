import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface PopularLocation {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedFee: number;
  estimatedTime: number;
}

interface PopularLocationsProps {
  onLocationSelect: (location: PopularLocation) => void;
  className?: string;
}

// Popular delivery locations in Nairobi with estimated data
const popularLocations: PopularLocation[] = [
  {
    name: 'Westlands',
    address: 'Westlands, Nairobi',
    coordinates: { lat: -1.2694, lng: 36.8075 },
    estimatedFee: 200,
    estimatedTime: 25
  },
  {
    name: 'Karen',
    address: 'Karen, Nairobi',
    coordinates: { lat: -1.3194, lng: 36.6852 },
    estimatedFee: 250,
    estimatedTime: 35
  },
  {
    name: 'CBD',
    address: 'Nairobi Central Business District',
    coordinates: { lat: -1.2855, lng: 36.8233 },
    estimatedFee: 180,
    estimatedTime: 20
  },
  {
    name: 'Kilimani',
    address: 'Kilimani, Nairobi',
    coordinates: { lat: -1.2981, lng: 36.7847 },
    estimatedFee: 160,
    estimatedTime: 20
  },
  {
    name: 'Kitisuru',
    address: 'Kitisuru, Nairobi',
    coordinates: { lat: -1.2275, lng: 36.8056 },
    estimatedFee: 280,
    estimatedTime: 30
  },
  {
    name: 'Lavington',
    address: 'Lavington, Nairobi',
    coordinates: { lat: -1.2833, lng: 36.7564 },
    estimatedFee: 200,
    estimatedTime: 25
  },
  {
    name: 'Runda',
    address: 'Runda, Nairobi',
    coordinates: { lat: -1.1981, lng: 36.8100 },
    estimatedFee: 320,
    estimatedTime: 35
  },
  {
    name: 'Langata',
    address: 'Langata, Nairobi',
    coordinates: { lat: -1.3667, lng: 36.7333 },
    estimatedFee: 200,
    estimatedTime: 30
  }
];

export function PopularLocations({ onLocationSelect, className = '' }: PopularLocationsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center text-sm font-medium text-foreground">
        <MapPin className="mr-2 h-4 w-4" />
        <span>Popular delivery areas:</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {popularLocations.map((location) => (
          <Button
            key={location.name}
            variant="outline"
            size="sm"
            className="flex flex-col h-auto p-3 text-xs hover:bg-primary hover:text-primary-foreground"
            onClick={() => onLocationSelect(location)}
          >
            <span className="font-medium">{location.name}</span>
            <span className="text-muted-foreground">~KES {location.estimatedFee}</span>
            <span className="text-muted-foreground">{location.estimatedTime} mins</span>
          </Button>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground">
        💡 These are estimated fees. Final delivery cost will be calculated based on your exact address.
      </div>
    </div>
  );
}