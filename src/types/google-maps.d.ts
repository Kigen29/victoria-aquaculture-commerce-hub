// Google Maps JavaScript API type declarations

declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[], status: GeocoderStatus) => void
      ): void;
    }

    interface GeocoderRequest {
      location?: LatLng;
      address?: string;
    }

    interface GeocoderResult {
      formatted_address: string;
      address_components: GeocoderAddressComponent[];
      geometry: {
        location: LatLng;
      };
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';

    namespace places {
      class AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (predictions: QueryAutocompletePrediction[], status: PlacesServiceStatus) => void
        ): void;
      }

      class PlacesService {
        constructor(attrContainer: HTMLDivElement);
        getDetails(
          request: PlaceDetailsRequest,
          callback: (place: PlaceResult, status: PlacesServiceStatus) => void
        ): void;
      }

      interface AutocompletionRequest {
        input: string;
        componentRestrictions?: ComponentRestrictions;
        location?: LatLng;
        radius?: number;
        types?: string[];
      }

      interface ComponentRestrictions {
        country: string | string[];
      }

      interface QueryAutocompletePrediction {
        place_id: string;
        description: string;
        structured_formatting: {
          main_text: string;
          secondary_text: string;
        };
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields: string[];
      }

      interface PlaceResult {
        formatted_address?: string;
        name?: string;
        geometry?: {
          location?: LatLng;
        };
        address_components?: GeocoderAddressComponent[];
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        NOT_FOUND = 'NOT_FOUND',
        INVALID_REQUEST = 'INVALID_REQUEST',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
      }
    }
  }
}

export {};