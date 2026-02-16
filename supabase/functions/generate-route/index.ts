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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { startCoords, endCoords, hazards, totalDistance, walkingTime } = await req.json() as RouteRequest;

    console.log('Generate route request:', { startCoords, endCoords, hazardsCount: hazards?.length });

    if (!startCoords || !endCoords) {
      return new Response(
        JSON.stringify({ error: 'Start and end coordinates are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Get real route from OSRM (free, no API key needed)
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?steps=true&overview=full&geometries=geojson`;
    
    console.log('Fetching OSRM route:', osrmUrl);
    const osrmResponse = await fetch(osrmUrl);

    if (!osrmResponse.ok) {
      console.error('OSRM error:', osrmResponse.status);
      return fallbackAIRoute(req, startCoords, endCoords, hazards, totalDistance, walkingTime);
    }

    const osrmData = await osrmResponse.json();
    
    if (osrmData.code !== 'Ok' || !osrmData.routes?.[0]) {
      console.error('OSRM no route found:', osrmData.code);
      return fallbackAIRoute(req, startCoords, endCoords, hazards, totalDistance, walkingTime);
    }

    const route = osrmData.routes[0];
    const steps: OSRMStep[] = route.legs[0].steps;

    // Step 2: Convert OSRM steps to our direction format, checking hazards
    const directions = steps
      .filter((step) => step.maneuver.type !== 'arrive' || step.distance > 0)
      .map((step) => {
        const instruction = formatManeuver(step);
        const distance = formatDistance(step.distance);
        const [lng, lat] = step.maneuver.location;

        // Check if any hazard is within 200m of this step
        let hasHazard = false;
        let hazardType = '';
        let hazardWarning = '';

        if (hazards && hazards.length > 0) {
          for (const h of hazards) {
            const dist = distanceBetween(lat, lng, h.lat, h.lng);
            if (dist < 200) {
              hasHazard = true;
              hazardType = h.type;
              hazardWarning = `⚠️ ${h.type} (${h.severity}) reported ${Math.round(dist)}m from this point${h.description ? ': ' + h.description : ''}. Stay on the right side of the road and proceed with caution.`;
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
      .filter((d) => d.distance !== '0 m'); // Remove zero-distance steps

    const hasAnyHazard = directions.some((d) => d.hasHazard);
    const routeDistanceKm = (route.distance / 1000).toFixed(2);
    const routeTimeMin = Math.round(route.duration / 60);

    const summary = hasAnyHazard
      ? `Route is ${routeDistanceKm} km (~${routeTimeMin} min walk). ⚠️ Hazards detected along the route. Follow right-hand traffic rules and proceed with caution near flagged areas.`
      : `Route is ${routeDistanceKm} km (~${routeTimeMin} min walk). Route is clear of reported hazards. Stay on the right side of the road.`;

    // Extract the actual road geometry from OSRM response
    const routeGeometry = route.geometry?.coordinates?.map((coord: [number, number]) => [coord[0], coord[1]]) || [];

    const routeData = {
      directions,
      summary,
      hazardStatus: hasAnyHazard ? 'HAZARDS_PRESENT' : 'ROUTE_CLEAR',
      routeGeometry,
    };

    console.log('Route generated with', directions.length, 'steps from real OSRM data');

    return new Response(
      JSON.stringify(routeData),
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

// Fallback to AI-generated route if OSRM fails
async function fallbackAIRoute(
  _req: Request,
  startCoords: { lat: number; lng: number },
  endCoords: { lat: number; lng: number },
  hazards: Hazard[],
  totalDistance: number,
  walkingTime: number
) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured', fallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const hazardsList = hazards && hazards.length > 0
    ? hazards.map((h, i) =>
        `${i + 1}. ${h.type} (${h.severity}) at (${h.lat.toFixed(4)}, ${h.lng.toFixed(4)})${h.description ? ': ' + h.description : ''}`
      ).join('\n')
    : 'No active hazards reported.';

  const systemPrompt = `You are a navigation assistant for Naval, Biliran, Philippines. Generate realistic walking directions using REAL street names. The Philippines follows right-hand traffic — always instruct pedestrians to stay on the right side. Key streets: Biliran Circumferential Road, Caneja Street, Rizal Avenue, Castin Street, P. Zamora Street, Vicentillo Street, Naval-Caibiran Road. Generate 4-8 steps.`;

  const userPrompt = `Directions from (${startCoords.lat.toFixed(6)}, ${startCoords.lng.toFixed(6)}) to (${endCoords.lat.toFixed(6)}, ${endCoords.lng.toFixed(6)}). Distance: ${totalDistance.toFixed(2)} km, ~${walkingTime} min. Hazards:\n${hazardsList}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [{
        type: "function",
        function: {
          name: "generate_route_directions",
          description: "Generate walking directions",
          parameters: {
            type: "object",
            properties: {
              directions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    instruction: { type: "string" },
                    distance: { type: "string" },
                    hasHazard: { type: "boolean" },
                    hazardType: { type: "string" },
                    hazardWarning: { type: "string" }
                  },
                  required: ["instruction", "distance", "hasHazard"],
                  additionalProperties: false
                }
              },
              summary: { type: "string" },
              hazardStatus: { type: "string", enum: ["HAZARDS_PRESENT", "ROUTE_CLEAR"] }
            },
            required: ["directions", "hazardStatus"],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "generate_route_directions" } }
    }),
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: 'AI service error', fallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const aiResponse = await response.json();
  const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    return new Response(
      JSON.stringify({ error: 'Invalid AI response', fallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const routeData = JSON.parse(toolCall.function.arguments);
  return new Response(
    JSON.stringify(routeData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
