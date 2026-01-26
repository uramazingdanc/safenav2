import { useRef, useEffect, useState } from 'react';
import { Map, Layers, AlertTriangle, Building2, Users, Filter, Plus, Move, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import HazardModal from '@/components/admin/HazardModal';
import EvacCenterModal from '@/components/admin/EvacCenterModal';
import { useRealtimeHazards, useVerifiedHazards } from '@/hooks/useRealtimeHazards';
import { useRealtimeEvacuationCenters } from '@/hooks/useRealtimeEvacuationCenters';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Circle, Fill, Stroke, Text as OLText } from 'ol/style';
import Overlay from 'ol/Overlay';
import { Modify } from 'ol/interaction';

const getSeverityColors = (severity: string) => {
  switch (severity) {
    case 'critical': return { bg: 'bg-rose-500', text: 'text-rose-400', fill: '#e11d48' };
    case 'high': return { bg: 'bg-orange-500', text: 'text-orange-400', fill: '#f97316' };
    case 'medium': return { bg: 'bg-amber-500', text: 'text-amber-400', fill: '#eab308' };
    default: return { bg: 'bg-emerald-500', text: 'text-emerald-400', fill: '#10b981' };
  }
};

const AdminMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const hazardSourceRef = useRef<VectorSource | null>(null);
  const centerSourceRef = useRef<VectorSource | null>(null);

  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);
  const [isEvacModalOpen, setIsEvacModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [addMode, setAddMode] = useState<'hazard' | 'evac' | null>(null);

  // Filter toggles
  const [showHazards, setShowHazards] = useState(true);
  const [showCenters, setShowCenters] = useState(true);

  // Real-time data from Supabase
  const { data: hazards } = useVerifiedHazards();
  const { data: centers } = useRealtimeEvacuationCenters();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Hazard layer (Red markers)
    const hazardSource = new VectorSource();
    hazardSourceRef.current = hazardSource;
    const hazardLayer = new VectorLayer({
      source: hazardSource,
      style: (feature) => {
        const severity = feature.get('severity');
        const colors = getSeverityColors(severity);
        return new Style({
          image: new Circle({
            radius: 12,
            fill: new Fill({ color: colors.fill }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
          text: new OLText({
            text: '⚠️',
            font: '16px sans-serif',
            offsetY: -20,
          }),
        });
      },
    });

    // Evacuation center layer (Green markers)
    const centerSource = new VectorSource();
    centerSourceRef.current = centerSource;
    const centerLayer = new VectorLayer({
      source: centerSource,
      style: (feature) => {
        const status = feature.get('status');
        const fillColor = status === 'open' ? '#10b981' : status === 'full' ? '#ef4444' : '#f59e0b';
        return new Style({
          image: new Circle({
            radius: 10,
            fill: new Fill({ color: fillColor }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
          text: new OLText({
            text: '🏢',
            font: '14px sans-serif',
            offsetY: -18,
          }),
        });
      },
    });

    // Popup overlay
    const popup = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -20],
      autoPan: true,
    });

    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        hazardLayer,
        centerLayer,
      ],
      overlays: [popup],
      view: new View({
        center: fromLonLat([124.3949, 11.5601]),
        zoom: 13,
      }),
    });

    // Drag interaction for hazards
    const modify = new Modify({ source: hazardSource });
    map.addInteraction(modify);

    // Click handler
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      
      if (feature) {
        setSelectedFeature(feature.getProperties());
        popup.setPosition(evt.coordinate);
      } else {
        popup.setPosition(undefined);
        setSelectedFeature(null);
        
        if (addMode) {
          const coords = toLonLat(evt.coordinate);
          setClickedCoords({ lat: coords[1], lng: coords[0] });
          if (addMode === 'hazard') {
            setIsHazardModalOpen(true);
          } else {
            setIsEvacModalOpen(true);
          }
          setAddMode(null);
        }
      }
    });

    // Cursor change on hover
    map.on('pointermove', (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel);
      map.getTargetElement().style.cursor = addMode ? 'crosshair' : (hit ? 'pointer' : '');
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update hazard markers
  useEffect(() => {
    if (!hazardSourceRef.current) return;
    hazardSourceRef.current.clear();

    if (showHazards && hazards) {
      hazards.forEach((h) => {
        if (h.latitude && h.longitude) {
          const feature = new Feature({
            geometry: new Point(fromLonLat([h.longitude, h.latitude])),
            id: h.id,
            type: 'hazard',
            name: h.type,
            severity: h.severity,
            location: h.location,
            status: h.status,
            description: h.description,
          });
          hazardSourceRef.current!.addFeature(feature);
        }
      });
    }
  }, [hazards, showHazards]);

  // Update center markers
  useEffect(() => {
    if (!centerSourceRef.current) return;
    centerSourceRef.current.clear();

    if (showCenters && centers) {
      centers.forEach((c) => {
        if (c.latitude && c.longitude) {
          const feature = new Feature({
            geometry: new Point(fromLonLat([c.longitude, c.latitude])),
            id: c.id,
            type: 'center',
            name: c.name,
            capacity: c.capacity,
            occupancy: c.current_occupancy,
            status: c.status,
            contact: c.contact_number,
          });
          centerSourceRef.current!.addFeature(feature);
        }
      });
    }
  }, [centers, showCenters]);

  const activeHazards = hazards?.filter(h => h.status === 'active').length || 0;
  const openCenters = centers?.filter(c => c.status === 'open').length || 0;

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex bg-command">
      {/* Sidebar Controls */}
      <aside className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 space-y-4 overflow-y-auto hidden md:block">
        <div className="flex items-center gap-2 text-white mb-4">
          <Map className="w-5 h-5 text-ocean" />
          <h2 className="font-bold">War Room Map</h2>
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse ml-auto" />
        </div>

        {/* Add Mode Buttons */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4 space-y-2">
            <Button
              className={`w-full ${addMode === 'hazard' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              onClick={() => setAddMode(addMode === 'hazard' ? null : 'hazard')}
            >
              {addMode === 'hazard' ? (
                <>
                  <Move className="w-4 h-4 mr-2" />
                  Click to Place Hazard
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Add Hazard
                </>
              )}
            </Button>
            <Button
              className={`w-full ${addMode === 'evac' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              onClick={() => setAddMode(addMode === 'evac' ? null : 'evac')}
            >
              {addMode === 'evac' ? (
                <>
                  <Move className="w-4 h-4 mr-2" />
                  Click to Place Center
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Evac Center
                </>
              )}
            </Button>
            {addMode && (
              <p className="text-xs text-slate-400 text-center">
                Click anywhere on the map to add a marker
              </p>
            )}
          </CardContent>
        </Card>

        {/* Layer Filters */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Layer Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <Label className="text-slate-300 text-sm">Hazards</Label>
              </div>
              <Switch checked={showHazards} onCheckedChange={setShowHazards} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <Label className="text-slate-300 text-sm">Evac Centers</Label>
              </div>
              <Switch checked={showCenters} onCheckedChange={setShowCenters} />
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Severity Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-slate-400">Critical</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-slate-400">High</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-400">Medium</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Low</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Active Hazards</span>
              <Badge className="bg-rose-500/20 text-rose-400">{activeHazards}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Open Centers</span>
              <Badge className="bg-emerald-500/20 text-emerald-400">{openCenters}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Centers</span>
              <Badge className="bg-ocean/20 text-ocean">{centers?.length || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Mobile Add Buttons */}
        <div className="md:hidden absolute bottom-20 right-4 z-10 flex flex-col gap-2">
          <Button
            className={`rounded-full w-14 h-14 shadow-lg ${addMode === 'evac' ? 'bg-teal-600' : 'bg-emerald-600'}`}
            onClick={() => setAddMode(addMode === 'evac' ? null : 'evac')}
          >
            {addMode === 'evac' ? <Move className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </Button>
          <Button
            className={`rounded-full w-14 h-14 shadow-lg ${addMode === 'hazard' ? 'bg-rose-600' : 'bg-orange-600'}`}
            onClick={() => setAddMode(addMode === 'hazard' ? null : 'hazard')}
          >
            {addMode === 'hazard' ? <Move className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </Button>
        </div>

        {/* Popup Element */}
        <div ref={popupRef} className="absolute bg-command border border-slate-700 rounded-lg p-3 shadow-xl min-w-[220px] z-50">
          {selectedFeature && (
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                {selectedFeature.type === 'hazard' ? (
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                ) : (
                  <Building2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-semibold">{selectedFeature.name}</span>
              </div>
              {selectedFeature.severity && (
                <Badge className={`text-xs ${getSeverityColors(selectedFeature.severity).bg} text-white mb-1`}>
                  {selectedFeature.severity}
                </Badge>
              )}
              {selectedFeature.location && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Map className="w-3 h-3" />
                  {selectedFeature.location}
                </p>
              )}
              {selectedFeature.capacity && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Capacity: {selectedFeature.occupancy}/{selectedFeature.capacity}
                </p>
              )}
              {selectedFeature.status && (
                <Badge className={`text-xs mt-2 ${
                  selectedFeature.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedFeature.status === 'active' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  {selectedFeature.status}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <HazardModal 
        open={isHazardModalOpen} 
        onClose={() => {
          setIsHazardModalOpen(false);
          setClickedCoords(null);
        }}
        initialCoords={clickedCoords}
      />
      <EvacCenterModal
        open={isEvacModalOpen}
        onClose={() => {
          setIsEvacModalOpen(false);
          setClickedCoords(null);
        }}
        initialCoords={clickedCoords}
      />
    </div>
  );
};

export default AdminMap;
