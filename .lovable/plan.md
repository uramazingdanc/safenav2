
# AI-Powered Route Generation for SafeNav

## Overview

This plan implements AI-powered route generation using Lovable AI (Google Gemini) to provide realistic, detailed turn-by-turn navigation with street names, distances, and hazard warnings for the Find Safe Route feature.

## Current State Analysis

The current `FindRoutePage.tsx` uses hardcoded, randomly shuffled local street names (lines 377-393) and distributes distance arbitrarily across segments. This produces unrealistic, generic directions that don't reflect actual road networks.

**Current limitations:**
- Street names are randomly shuffled from a static list
- Directions don't follow real-world road layouts
- Hazard placement on segments is arbitrary (always middle segment)
- No intelligent routing around hazards

## Proposed Solution

Use Lovable AI (via an Edge Function) to generate contextual, realistic route directions based on:
- Start and end coordinates
- Known hazards along the route
- Local geography (Naval, Biliran area)
- Evacuation center locations

---

## Implementation Steps

### Step 1: Create the Edge Function

**New file: `supabase/functions/generate-route/index.ts`**

The edge function will:
1. Accept start coordinates, end coordinates, and nearby hazard data
2. Call Lovable AI Gateway with a specialized routing prompt
3. Use structured output (tool calling) to get consistent JSON format
4. Return detailed route segments with street names, distances, and hazard flags

**Edge Function Logic:**
```text
Input:
- startCoords: {lat, lng}
- endCoords: {lat, lng}  
- hazards: array of {type, severity, lat, lng, description}
- totalDistance: calculated distance in km
- walkingTime: estimated walking time

AI Prompt Context:
- Location: Naval, Biliran, Philippines
- Local street knowledge: major roads like Biliran Circumferential Road, 
  Caneja Street, Rizal Avenue, etc.
- Task: Generate realistic walking directions

Output (via tool calling):
{
  directions: [
    { instruction: "Head North on Caneja Street", distance: "200 m", hasHazard: false },
    { instruction: "Turn right onto Biliran Circumferential Road", distance: "1.2 km", hasHazard: true, hazardType: "Flooding", hazardWarning: "Flood zone ahead - proceed with caution" },
    ...
  ],
  summary: "Route passes through 1 hazard zone. Consider alternative if water level is high.",
  hazardStatus: "HAZARDS_PRESENT" | "ROUTE_CLEAR"
}
```

### Step 2: Update supabase/config.toml

Add the edge function configuration:
```toml
[functions.generate-route]
enabled = true
verify_jwt = false
```

### Step 3: Update FindRoutePage.tsx

**Modifications:**

1. **Add loading state for AI generation:**
   - Show spinner with "Generating safe route..." message
   - Handle error states gracefully with fallback

2. **Replace `handleGenerateRoute` logic:**
   - Keep distance/time calculation (Haversine formula)
   - Add call to edge function with coordinates and hazard data
   - Parse AI response and set `routeInfo` state

3. **Enhanced directions display:**
   - Show turn-by-turn instructions from AI
   - Display hazard warnings inline with amber highlighting
   - Show specific hazard types and warnings

4. **Fallback mechanism:**
   - If AI call fails, fall back to current simulated directions
   - Show toast indicating "Using estimated directions"

### Step 4: Create Custom Hook

**New file: `src/hooks/useGenerateRoute.ts`**

A React Query mutation hook that:
- Calls the edge function
- Handles loading/error states
- Provides typed response

---

## Technical Details

### Edge Function Structure

```text
supabase/functions/generate-route/index.ts
├── CORS headers handling
├── Request validation (start, end coords required)
├── Lovable AI Gateway call
│   ├── System prompt with Naval/Biliran context
│   ├── User prompt with coordinates + hazards
│   └── Tool definition for structured output
├── Response parsing
└── Error handling (429/402 rate limits)
```

### AI Prompt Design

The system prompt will include:
- Geographic context (Naval, Biliran, Philippines)
- Known local streets and landmarks
- Walking speed assumption (5 km/h)
- Safety-first routing principles

The user prompt will contain:
- Exact coordinates
- Total straight-line distance
- List of active hazards with locations
- Request for 4-8 direction steps

### Response Schema (Tool Calling)

```json
{
  "type": "object",
  "properties": {
    "directions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "instruction": { "type": "string" },
          "distance": { "type": "string" },
          "hasHazard": { "type": "boolean" },
          "hazardType": { "type": "string" },
          "hazardWarning": { "type": "string" }
        },
        "required": ["instruction", "distance", "hasHazard"]
      }
    },
    "summary": { "type": "string" },
    "hazardStatus": { "type": "string", "enum": ["HAZARDS_PRESENT", "ROUTE_CLEAR"] }
  },
  "required": ["directions", "hazardStatus"]
}
```

---

## UI Enhancements

### Route Result Display (matching reference image)

```text
┌────────────────────────────────────────┐
│ Distance:    Duration:    ┌──────────┐ │
│   2.75 km      3 min      │HAZARDS_  │ │
│                           │PRESENT   │ │
│                           └──────────┘ │
├────────────────────────────────────────┤
│ (Start)                                │
│ Head North-East                        │
│                                        │
│ (0.18 km)                              │
│ on Biliran Circumferential Road        │
│                                        │
│ (2.04 km)                              │
│ on Caneja Street ⚠️ Flooding           │
│                                        │
│ (0.29 km)                              │
│ on Castin Street                       │
│ ...                                    │
├────────────────────────────────────────┤
│ ⚠️ Route has hazards nearby. Proceed  │
│    with caution and be prepared for    │
│    detours.                            │
├────────────────────────────────────────┤
│ Naval, Biliran • 4 hazards •           │
│ 1 evacuation center                    │
└────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-route/index.ts` | Create | Edge function calling Lovable AI |
| `supabase/config.toml` | Modify | Add function configuration |
| `src/hooks/useGenerateRoute.ts` | Create | React Query hook for route generation |
| `src/pages/FindRoutePage.tsx` | Modify | Integrate AI generation, add loading states |

---

## Error Handling

1. **Rate limiting (429):** Show toast "AI service busy, using estimated route"
2. **Payment required (402):** Show toast "Service temporarily unavailable"
3. **Network error:** Fall back to current simulated logic
4. **Invalid AI response:** Parse error, use fallback

---

## Testing Checklist

After implementation:
1. Set start point using "Pick on Map"
2. Set destination to an evacuation center
3. Click "Generate Safe Route"
4. Verify AI-generated directions appear
5. Check hazard warnings display inline
6. Verify HAZARDS_PRESENT/ROUTE_CLEAR badge
7. Test fallback when offline
