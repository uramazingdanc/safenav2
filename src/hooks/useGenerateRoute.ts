import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RouteDirection {
  instruction: string;
  distance: string;
  hasHazard: boolean;
  hazardType?: string;
  hazardWarning?: string;
}

export interface AlternativeRoute {
  directions: RouteDirection[];
  summary: string;
  routeGeometry: [number, number][];
  distance: number;
  duration: number;
  hazardCount: number;
}

export interface RouteResponse {
  directions: RouteDirection[];
  summary?: string;
  hazardStatus: 'ROUTE_CLEAR' | 'ALTERNATIVE_ROUTE_USED' | 'HAZARDS_PRESENT_NO_ALTERNATIVE';
  routeGeometry?: [number, number][];
  distance?: number;
  duration?: number;
  hazardCount?: number;
  alternativeRoute?: AlternativeRoute;
  safetyReminders?: string[];
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

      if (data?.fallback || data?.error) {
        throw new Error(data.error || 'AI service unavailable');
      }

      return data as RouteResponse;
    },
    onError: (error) => {
      console.error('Route generation failed:', error);
    },
  });
}
