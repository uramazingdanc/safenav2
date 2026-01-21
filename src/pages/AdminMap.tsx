import { useRef, useEffect, useState } from 'react';
import { Map, Layers, AlertTriangle, Building2, Users, Filter, Plus, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import HazardModal from '@/components/admin/HazardModal';
import { useHazards } from '@/hooks/useHazards';
import { useEvacuationCenters } from '@/hooks/useEvacuationCenters';
import { MOCK_HAZARDS, MOCK_EVAC_CENTERS, getSeverityColors } from '@/data/mockAdminData';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Circle, Fill, Stroke, Text as OLText, Icon } from 'ol/style';
import Overlay from 'ol/Overlay';
import { Modify } from 'ol/interaction';

const AdminMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<OLMap | null>(null);
  const hazardSourceRef = useRef<VectorSource | null>(null);
  const centerSourceRef = useRef<VectorSource | null>(null);

  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [addMode, setAddMode] = useState(false);

  // Filter toggles
  const [showHazards, setShowHazards] = useState(true);
  const [showCenters, setShowCenters] = useState(true);
  const [showUsers, setShowUsers] = useState(false);

  // Data from hooks (with fallback to mock)
  const { data: dbHazards } = useHazards();
  const { data: dbCenters } = useEvacuationCenters();

  const hazards = dbHazards?.length ? dbHazards : MOCK_HAZARDS;
  const centers = dbCenters?.length ? dbCenters : MOCK_EVAC_CENTERS;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Hazard layer
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
            fill: new Fill({ color: severity === 'critical' ? '#e11d48' : severity === 'high' ? '#f97316' : severity === 'medium' ? '#eab308' : '#10b981' }),
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

    // Evacuation center layer
    const centerSource = new VectorSource();
    centerSourceRef.current = centerSource;
    const centerLayer = new VectorLayer({
      source: centerSource,
      style: new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: '#3b82f6' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: new OLText({
          text: '🏢',
          font: '14px sans-serif',
          offsetY: -18,
        }),
      }),
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
          setIsHazardModalOpen(true);
          setAddMode(false);
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

    if (showHazards) {
      hazards.forEach((h: any) => {
        if (h.latitude && h.longitude) {
          const feature = new Feature({
            geometry: new Point(fromLonLat([h.longitude, h.latitude])),
            id: h.id,
            type: 'hazard',
            name: h.type,
            severity: h.severity,
            location: h.location,
            status: h.status,
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

    if (showCenters) {
      centers.forEach((c: any) => {
        if (c.latitude && c.longitude) {
          const feature = new Feature({
            geometry: new Point(fromLonLat([c.longitude, c.latitude])),
            id: c.id,
            type: 'center',
            name: c.name,
            capacity: c.capacity,
            occupancy: c.current_occupancy,
            status: c.status,
          });
          centerSourceRef.current!.addFeature(feature);
        }
      });
    }
  }, [centers, showCenters]);

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen flex bg-[#0f172a]">
      {/* Sidebar Controls */}
      <aside className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 space-y-4 overflow-y-auto hidden md:block">
        <div className="flex items-center gap-2 text-white mb-4">
          <Map className="w-5 h-5 text-blue-400" />
          <h2 className="font-bold">Admin Map</h2>
        </div>

        {/* Add Hazard Mode */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <Button
              className={`w-full ${addMode ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              onClick={() => setAddMode(!addMode)}
            >
              {addMode ? (
                <>
                  <Move className="w-4 h-4 mr-2" />
                  Click Map to Place
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hazard
                </>
              )}
            </Button>
            {addMode && (
              <p className="text-xs text-slate-400 mt-2 text-center">
                Click anywhere on the map to add a hazard marker
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
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <Label className="text-slate-300 text-sm">Hazards</Label>
              </div>
              <Switch checked={showHazards} onCheckedChange={setShowHazards} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <Label className="text-slate-300 text-sm">Evac Centers</Label>
              </div>
              <Switch checked={showCenters} onCheckedChange={setShowCenters} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                <Label className="text-slate-300 text-sm">Users</Label>
              </div>
              <Switch checked={showUsers} onCheckedChange={setShowUsers} />
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
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
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
              <Badge className="bg-orange-500/20 text-orange-400">{hazards.filter((h: any) => h.status === 'active').length}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Evac Centers</span>
              <Badge className="bg-blue-500/20 text-blue-400">{centers.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Mobile Add Button */}
        <Button
          className={`md:hidden absolute bottom-20 right-4 z-10 rounded-full w-14 h-14 shadow-lg ${addMode ? 'bg-rose-600' : 'bg-emerald-600'}`}
          onClick={() => setAddMode(!addMode)}
        >
          {addMode ? <Move className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </Button>

        {/* Popup Element */}
        <div ref={popupRef} className="absolute bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl min-w-[200px] z-50">
          {selectedFeature && (
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                {selectedFeature.type === 'hazard' ? (
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                ) : (
                  <Building2 className="w-4 h-4 text-blue-400" />
                )}
                <span className="font-semibold">{selectedFeature.name}</span>
              </div>
              {selectedFeature.severity && (
                <Badge className={`text-xs ${getSeverityColors(selectedFeature.severity).bg} ${getSeverityColors(selectedFeature.severity).text}`}>
                  {selectedFeature.severity}
                </Badge>
              )}
              {selectedFeature.location && (
                <p className="text-xs text-slate-400 mt-1">{selectedFeature.location}</p>
              )}
              {selectedFeature.capacity && (
                <p className="text-xs text-slate-400 mt-1">
                  Capacity: {selectedFeature.occupancy}/{selectedFeature.capacity}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hazard Modal */}
      <HazardModal 
        open={isHazardModalOpen} 
        onClose={() => {
          setIsHazardModalOpen(false);
          setClickedCoords(null);
        }}
        initialCoords={clickedCoords}
      />
    </div>
  );
};

export default AdminMap;
