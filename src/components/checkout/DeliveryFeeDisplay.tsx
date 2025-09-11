import React from 'react';
import { Loader2, Truck, Clock, MapPin } from 'lucide-react';

interface DeliveryFeeDisplayProps {
  isCalculating: boolean;
  deliveryFee: number;
  deliveryZone: string;
  estimatedTime: number;
  distance?: string;
}

export function DeliveryFeeDisplay({
  isCalculating,
  deliveryFee,
  deliveryZone,
  estimatedTime,
  distance
}: DeliveryFeeDisplayProps) {
  if (isCalculating) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex items-center text-blue-600">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Calculating delivery fee...</span>
        </div>
      </div>
    );
  }

  if (!deliveryZone || deliveryFee === 0) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-green-700">
          <Truck className="mr-2 h-4 w-4" />
          <span className="font-medium text-sm">Delivery Available</span>
        </div>
        <span className="font-bold text-green-800">KES {deliveryFee.toFixed(2)}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-green-600">
        <div className="flex items-center">
          <MapPin className="mr-1 h-3 w-3" />
          <span>{deliveryZone}</span>
        </div>
        <div className="flex items-center">
          <Clock className="mr-1 h-3 w-3" />
          <span>{estimatedTime} mins</span>
        </div>
      </div>
      
      {distance && (
        <div className="text-xs text-green-600">
          Distance: {distance}
        </div>
      )}
      
      <div className="text-xs text-green-600 bg-green-100 rounded px-2 py-1 mt-2">
        💡 Delivery fee is calculated based on distance from our Nairobi West location
      </div>
    </div>
  );
}