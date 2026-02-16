import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RouteDirection {
  instruction: string;
  distance: string;
  hasHazard: boolean;
  hazardType?: string;
  hazardWarning?: string;
}

export interface RouteResponse {
  directions: RouteDirection[];
  summary?: string;
  hazardStatus: 'HAZARDS_PRESENT' | 'ROUTE_CLEAR';
  routeGeometry?: [number, number][]; // [lng, lat] pairs from OSRM
}

interface Hazard {
  type: string;
  severity: string;
  lat: number;
  lng: number;
  description?: string;
}

interface GenerateRouteParams {
  startCoords: { lat: number; lng: number };
  endCoords: { lat: number; lng: number };
  hazards: Hazard[];
  totalDistance: number;
  walkingTime: number;
}

export function useGenerateRoute() {
  return useMutation({
    mutationFn: async (params: GenerateRouteParams): Promise<RouteResponse> => {
      const { data, error } = await supabase.functions.invoke('generate-route', {
        body: params,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate route');
      }

      // Check if the response indicates a fallback is needed
      if (data?.fallback || data?.error) {
        throw new Error(data.error || 'AI service unavailable');
      }

      return data as RouteResponse;
    },
    onError: (error) => {
      console.error('Route generation failed:', error);
      // Don't show toast here - let the component handle fallback
    },
  });
}
