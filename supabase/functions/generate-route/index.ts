import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Hazard {
  type: string;
  severity: string;
  lat: number;
  lng: number;
  description?: string;
}

interface RouteRequest {
  startCoords: { lat: number; lng: number };
  endCoords: { lat: number; lng: number };
  hazards: Hazard[];
  totalDistance: number;
  walkingTime: number;
}

interface OSRMStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

interface OSRMRoute {
  distance: number;
  duration: number;
  legs: { steps: OSRMStep[] }[];
  geometry?: { coordinates: [number, number][] };
}

const SEVERITY_SCORE: Record<string, number> = {
  low: 1,
  medium: 3,
  high: 7,
  critical: 15,
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatManeuver(step: OSRMStep): string {
  const streetName = step.name || 'the road';
  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier;

  if (type === 'depart') return `Head ${modifier || 'forward'} on ${streetName}`;
  if (type === 'arrive') return `Arrive at your destination on ${streetName}`;
  if (type === 'turn') return `Turn ${modifier || ''} onto ${streetName}`.trim();
  if (type === 'new name') return `Continue onto ${streetName}`;
  if (type === 'merge') return `Merge onto ${streetName}`;
  if (type === 'fork') return `Take the ${modifier || ''} fork onto ${streetName}`.trim();
  if (type === 'roundabout') return `At the roundabout, take the exit onto ${streetName}`;
  if (type === 'end of road') return `At the end of the road, turn ${modifier || ''} onto ${streetName}`.trim();
  if (type === 'continue') return `Continue ${modifier ? modifier + ' ' : ''}on ${streetName}`;

  return `Continue on ${streetName}`;
}

function distanceBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreRoute(route: OSRMRoute, hazards: Hazard[]): { score: number; hazardCount: number; hazardDetails: { type: string; severity: string; dist: number }[] } {
  if (!hazards || hazards.length === 0) return { score: 0, hazardCount: 0, hazardDetails: [] };

  const geometry = route.geometry?.coordinates || [];
  const hazardDetails: { type: string; severity: string; dist: number }[] = [];
  const foundHazards = new Set<number>();

  for (const coord of geometry) {
    const [lng, lat] = coord;
    for (let i = 0; i < hazards.length; i++) {
      if (foundHazards.has(i)) continue;
      const dist = distanceBetween(lat, lng, hazards[i].lat, hazards[i].lng);
      if (dist < 200) {
        foundHazards.add(i);
        hazardDetails.push({ type: hazards[i].type, severity: hazards[i].severity, dist: Math.round(dist) });
      }
    }
  }

  const score = hazardDetails.reduce((sum, h) => sum + (SEVERITY_SCORE[h.severity] || 3), 0);
  return { score, hazardCount: hazardDetails.length, hazardDetails };
}

function buildDirections(steps: OSRMStep[], hazards: Hazard[]) {
  return steps
    .filter((step) => step.maneuver.type !== 'arrive' || step.distance > 0)
    .map((step) => {
      const instruction = formatManeuver(step);
      const distance = formatDistance(step.distance);
      const [lng, lat] = step.maneuver.location;

      let hasHazard = false;
      let hazardType = '';
      let hazardWarning = '';

      if (hazards && hazards.length > 0) {
        for (const h of hazards) {
          const dist = distanceBetween(lat, lng, h.lat, h.lng);
          if (dist < 200) {
            hasHazard = true;
            hazardType = h.type;
            hazardWarning = `⚠️ ${h.type} (${h.severity}) reported ${Math.round(dist)}m from this point${h.description ? ': ' + h.description : ''}. Reduce speed and proceed with caution.`;
            break;
          }
        }
      }

      return {
        instruction: instruction + '. Keep to the right side of the road.',
        distance,
        hasHazard,
        ...(hasHazard && { hazardType, hazardWarning }),
      };
    })
    .filter((d) => d.distance !== '0 m');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { startCoords, endCoords, hazards } = await req.json() as RouteRequest;

    console.log('Generate route request:', { startCoords, endCoords, hazardsCount: hazards?.length });

    if (!startCoords || !endCoords) {
      return new Response(
        JSON.stringify({ error: 'Start and end coordinates are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use driving profile (motorcycle) with alternatives
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?steps=true&overview=full&geometries=geojson&alternatives=true`;

    console.log('Fetching OSRM route:', osrmUrl);
    const osrmResponse = await fetch(osrmUrl);

    if (!osrmResponse.ok) {
      console.error('OSRM error:', osrmResponse.status);
      return fallbackResponse(startCoords, endCoords, hazards);
    }

    const osrmData = await osrmResponse.json();

    if (osrmData.code !== 'Ok' || !osrmData.routes?.[0]) {
      console.error('OSRM no route found:', osrmData.code);
      return fallbackResponse(startCoords, endCoords, hazards);
    }

    const routes: OSRMRoute[] = osrmData.routes;

    // Score all routes by hazard proximity
    const scored = routes.map((route, idx) => {
      const { score, hazardCount, hazardDetails } = scoreRoute(route, hazards);
      return { route, score, hazardCount, hazardDetails, index: idx };
    });

    // Sort by score (lowest = safest)
    scored.sort((a, b) => a.score - b.score);

    const primary = scored[0];
    const alternative = scored.length > 1 ? scored[1] : null;

    // Build primary route response
    const primarySteps = primary.route.legs[0].steps;
    const primaryDirections = buildDirections(primarySteps, hazards);
    const primaryDistKm = (primary.route.distance / 1000).toFixed(2);
    const primaryTimeMin = Math.round(primary.route.duration / 60);
    const primaryGeometry = primary.route.geometry?.coordinates?.map((c: [number, number]) => [c[0], c[1]]) || [];

    // Determine route status
    let routeStatus: string;
    let summary: string;

    if (primary.hazardCount === 0) {
      routeStatus = 'ROUTE_CLEAR';
      summary = `Route is ${primaryDistKm} km (~${primaryTimeMin} min by motorcycle). Route is clear of reported hazards.`;
    } else if (alternative && alternative.score < primary.score) {
      // This shouldn't happen since we sorted, but just in case
      routeStatus = 'ALTERNATIVE_ROUTE_USED';
      summary = `A safer alternative route was selected to avoid hazards. Distance: ${primaryDistKm} km (~${primaryTimeMin} min).`;
    } else if (alternative) {
      routeStatus = 'ALTERNATIVE_ROUTE_USED';
      summary = `Route is ${primaryDistKm} km (~${primaryTimeMin} min). Primary route selected as safest option. An alternative route is also available.`;
    } else {
      routeStatus = 'HAZARDS_PRESENT_NO_ALTERNATIVE';
      summary = `No hazard-free route available. Route is ${primaryDistKm} km (~${primaryTimeMin} min). Proceed with caution.`;
    }

    // If primary has hazards but is the only/best option
    if (primary.hazardCount > 0 && !alternative) {
      routeStatus = 'HAZARDS_PRESENT_NO_ALTERNATIVE';
      summary = `No hazard-free route available. Route is ${primaryDistKm} km (~${primaryTimeMin} min). Proceed with caution.`;
    }

    const responseData: Record<string, unknown> = {
      directions: primaryDirections,
      summary,
      hazardStatus: routeStatus,
      routeGeometry: primaryGeometry,
      distance: primary.route.distance,
      duration: primary.route.duration,
      hazardCount: primary.hazardCount,
    };

    // Build alternative route if available
    if (alternative) {
      const altSteps = alternative.route.legs[0].steps;
      const altDirections = buildDirections(altSteps, hazards);
      const altDistKm = (alternative.route.distance / 1000).toFixed(2);
      const altTimeMin = Math.round(alternative.route.duration / 60);
      const altGeometry = alternative.route.geometry?.coordinates?.map((c: [number, number]) => [c[0], c[1]]) || [];

      responseData.alternativeRoute = {
        directions: altDirections,
        summary: `Alternative route: ${altDistKm} km (~${altTimeMin} min). ${alternative.hazardCount > 0 ? alternative.hazardCount + ' hazard(s) detected.' : 'Clear of hazards.'}`,
        routeGeometry: altGeometry,
        distance: alternative.route.distance,
        duration: alternative.route.duration,
        hazardCount: alternative.hazardCount,
      };
    }

    // Add safety reminders if hazards present
    if (primary.hazardCount > 0) {
      responseData.safetyReminders = [
        'Proceed with caution near hazard areas.',
        'Avoid flooded or damaged roads.',
        'Reduce speed and stay alert.',
        'Stop travel if conditions worsen.',
        'Proceed to nearest evacuation center if necessary.',
      ];
    }

    console.log('Route generated:', scored.length, 'routes evaluated. Primary score:', primary.score, 'Alt score:', alternative?.score);

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('generate-route error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', fallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function fallbackResponse(
  startCoords: { lat: number; lng: number },
  endCoords: { lat: number; lng: number },
  hazards: Hazard[]
) {
  const dist = distanceBetween(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
  const distKm = (dist / 1000).toFixed(2);
  const timeMin = Math.round(dist / 1000 / 40 * 60); // ~40km/h motorcycle

  return new Response(
    JSON.stringify({
      error: 'OSRM unavailable',
      fallback: true,
      distance: dist,
      duration: timeMin * 60,
      summary: `Estimated ${distKm} km (~${timeMin} min). Route data temporarily unavailable.`,
    }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
