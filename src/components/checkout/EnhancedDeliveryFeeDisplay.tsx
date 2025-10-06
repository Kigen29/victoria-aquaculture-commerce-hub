import React from 'react';
import { Loader2, Truck, Clock, MapPin, AlertCircle, CheckCircle, Star } from 'lucide-react';

interface EnhancedDeliveryFeeDisplayProps {
  isCalculating: boolean;
  deliveryFee: number;
  deliveryZone: string;
  estimatedTime: number;
  distance?: string;
  formattedDistance?: string;
  isFreeDelivery?: boolean;
  freeDeliveryThreshold?: number;
  cartTotal?: number;
}

export function EnhancedDeliveryFeeDisplay({
  isCalculating,
  deliveryFee,
  deliveryZone,
  estimatedTime,
  distance,
  formattedDistance,
  isFreeDelivery = false,
  freeDeliveryThreshold = 2000,
  cartTotal = 0
}: EnhancedDeliveryFeeDisplayProps) {
  if (isCalculating) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex items-center text-blue-600">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Calculating delivery fee and time...</span>
        </div>
      </div>
    );
  }

  if (!deliveryZone || deliveryFee === 0) {
    return null;
  }

  const amountNeededForFreeDelivery = freeDeliveryThreshold - cartTotal;
  const showFreeDeliveryPromo = !isFreeDelivery && amountNeededForFreeDelivery > 0 && amountNeededForFreeDelivery <= 1000;

  return (
    <div className="space-y-3 mt-4">
      {/* Main Delivery Info */}
      <div className={`${isFreeDelivery ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 space-y-3`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isFreeDelivery ? 'text-green-600' : 'text-blue-600'}`}>
            <Truck className="mr-1 h-4 w-4" />
            <span className="text-sm font-medium">Delivery Fee</span>
          </div>
          <span className={`font-bold ${isFreeDelivery ? 'text-green-800 line-through' : 'text-blue-800'}`}>
            KES {deliveryFee.toFixed(2)}
          </span>
        </div>
        
        <div className={`text-xs ${isFreeDelivery ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'} rounded px-2 py-1 mt-2`}>
          📍 From Kogo Star Plaza, Nairobi West
        </div>
      </div>

      {/* Free Delivery Promotion */}
      {showFreeDeliveryPromo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center text-yellow-700">
            <Star className="mr-2 h-4 w-4" />
            <span className="text-sm font-medium">
              Add KES {amountNeededForFreeDelivery.toFixed(2)} more for FREE delivery!
            </span>
          </div>
        </div>
      )}

      {/* Delivery Features */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center">
            <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
            <span>Fresh fish in insulated packaging</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
            <span>Cold chain maintained throughout delivery</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
            <span>Real-time delivery tracking</span>
          </div>
        </div>
      </div>

      {/* Peak Hours Notice */}
      {isCurrentlyPeakHours() && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center text-orange-700">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span className="text-xs">
              Peak hours: Delivery may take 10-15 minutes longer due to high demand
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to check if it's currently peak hours
function isCurrentlyPeakHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
  
  // Peak hours: 11AM-2PM and 6PM-9PM on weekdays, 12PM-3PM and 6PM-9PM on weekends
  if (isWeekday) {
    return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
  } else {
    return (hour >= 12 && hour <= 15) || (hour >= 18 && hour <= 21);
  }
}