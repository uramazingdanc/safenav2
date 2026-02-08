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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { startCoords, endCoords, hazards, totalDistance, walkingTime } = await req.json() as RouteRequest;

    console.log('Generate route request:', { startCoords, endCoords, hazardsCount: hazards?.length, totalDistance, walkingTime });

    if (!startCoords || !endCoords) {
      return new Response(
        JSON.stringify({ error: 'Start and end coordinates are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format hazards for the prompt
    const hazardsList = hazards && hazards.length > 0
      ? hazards.map((h, i) => 
          `${i + 1}. ${h.type} (${h.severity}) at coordinates (${h.lat.toFixed(4)}, ${h.lng.toFixed(4)})${h.description ? `: ${h.description}` : ''}`
        ).join('\n')
      : 'No active hazards reported in this area.';

    const systemPrompt = `You are a navigation assistant for SafeNav, an emergency navigation app for Naval, Biliran, Philippines.

Your task is to generate realistic walking directions between two points, considering active hazards.

Known streets in Naval, Biliran include:
- Biliran Circumferential Road (main highway)
- Caneja Street
- Rizal Avenue
- Castin Street
- Padre Burgos Street
- Inocencio Street
- P. Zamora Street
- Vicentillo Street
- Del Pilar Street
- Naval-Caibiran Road
- Legazpi Street
- Bonifacio Street

Walking speed is assumed to be 5 km/h. Generate 4-8 direction steps that are realistic for the distance. Each step should have a street name and approximate distance. Flag steps that pass near reported hazards.

IMPORTANT: The total distance of all steps should approximately equal the provided total distance.`;

    const userPrompt = `Generate walking directions from (${startCoords.lat.toFixed(6)}, ${startCoords.lng.toFixed(6)}) to (${endCoords.lat.toFixed(6)}, ${endCoords.lng.toFixed(6)}).

Total straight-line distance: ${totalDistance.toFixed(2)} km
Estimated walking time: ${walkingTime} minutes

Active hazards in the area:
${hazardsList}

Generate turn-by-turn walking directions with street names and distances. If any step passes near a hazard, mark it with a warning.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_route_directions",
              description: "Generate walking route directions with street names, distances, and hazard warnings",
              parameters: {
                type: "object",
                properties: {
                  directions: {
                    type: "array",
                    description: "Array of direction steps",
                    items: {
                      type: "object",
                      properties: {
                        instruction: {
                          type: "string",
                          description: "The navigation instruction (e.g., 'Head North on Caneja Street', 'Turn right onto Biliran Circumferential Road')"
                        },
                        distance: {
                          type: "string",
                          description: "Distance for this step (e.g., '200 m', '1.2 km')"
                        },
                        hasHazard: {
                          type: "boolean",
                          description: "Whether this step passes near a hazard"
                        },
                        hazardType: {
                          type: "string",
                          description: "Type of hazard if hasHazard is true (e.g., 'Flooding', 'Landslide')"
                        },
                        hazardWarning: {
                          type: "string",
                          description: "Warning message if hasHazard is true"
                        }
                      },
                      required: ["instruction", "distance", "hasHazard"],
                      additionalProperties: false
                    }
                  },
                  summary: {
                    type: "string",
                    description: "Brief summary of the route and any hazard warnings"
                  },
                  hazardStatus: {
                    type: "string",
                    enum: ["HAZARDS_PRESENT", "ROUTE_CLEAR"],
                    description: "Overall hazard status for the route"
                  }
                },
                required: ["directions", "hazardStatus"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_route_directions" } }
      }),
    });

    if (!response.ok) {
      console.error('AI Gateway error:', response.status, await response.text());
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', fallback: true }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable', fallback: true }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error', fallback: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI response:', JSON.stringify(aiResponse, null, 2));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'generate_route_directions') {
      console.error('Unexpected AI response format:', aiResponse);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response', fallback: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const routeData = JSON.parse(toolCall.function.arguments);
    console.log('Parsed route data:', routeData);

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
