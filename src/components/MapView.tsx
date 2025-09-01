import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Layers, 
  Search, 
  Navigation, 
  Ruler, 
  Home, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  ChevronDown,
  Map as MapIcon
} from 'lucide-react';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('streets');
  const [wmtsLayerVisible, setWmtsLayerVisible] = useState(false);

  const basemaps = {
    satellite: {
      name: 'Satellite',
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    streets: {
      name: 'Streets',
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    topographic: {
      name: 'Topographic',
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    terrain: {
      name: 'Terrain',
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize MapLibre map with Esri basemap
    map.current = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'esri-source': {
            type: 'raster',
            tiles: [basemaps[currentBasemap as keyof typeof basemaps].url],
            tileSize: 256,
            attribution: basemaps[currentBasemap as keyof typeof basemaps].attribution
          }
        },
        layers: [
          {
            id: 'esri-layer',
            type: 'raster',
            source: 'esri-source'
          }
        ]
      },
      center: [-116.4, 33.7], // Riverside County, CA
      zoom: 10,
      pitch: 0,
      bearing: 0
    });

    // Add controls
    map.current.addControl(new NavigationControl({
      visualizePitch: true,
      showZoom: true,
      showCompass: true
    }), 'top-right');

    map.current.addControl(new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');

    map.current.addControl(new ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Set map loaded state and add layers when style is loaded
    map.current.on('load', () => {
      if (!map.current) return;
      
      // Add WMTS source
      map.current.addSource('wmts-evacuation', {
        type: 'vector',
        tiles: ['https://geospatialemp.demo.zonehaven.com/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=zonehaven:evacuation_zone_details&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}&cacheVersion=1756736987'],
        minzoom: 0,
        maxzoom: 18
      });

      // Add WMTS layer (initially hidden)
      map.current.addLayer({
        id: 'evacuation-zones',
        type: 'fill',
        source: 'wmts-evacuation',
        'source-layer': 'evacuation_zone_details',
        paint: {
          'fill-color': 'hsl(var(--map-accent))',
          'fill-opacity': 0.3
        },
        layout: {
          visibility: 'none'
        }
      });

      // Add WMTS layer outline
      map.current.addLayer({
        id: 'evacuation-zones-outline',
        type: 'line',
        source: 'wmts-evacuation',
        'source-layer': 'evacuation_zone_details',
        paint: {
          'line-color': 'hsl(var(--map-accent))',
          'line-width': 2,
          'line-opacity': 0.8
        },
        layout: {
          visibility: 'none'
        }
      });
      
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const changeBasemap = (basemapKey: string) => {
    if (!map.current || !mapLoaded) return;

    const basemap = basemaps[basemapKey as keyof typeof basemaps];
    const source = map.current.getSource('esri-source') as any;
    
    if (source) {
      source.tiles = [basemap.url];
      map.current.style.sourceCaches['esri-source'].reload();
    }
    
    setCurrentBasemap(basemapKey);
  };

  const toggleWmtsLayer = () => {
    if (!map.current || !mapLoaded) return;

    const newVisibility = !wmtsLayerVisible;
    const visibility = newVisibility ? 'visible' : 'none';
    
    map.current.setLayoutProperty('evacuation-zones', 'visibility', visibility);
    map.current.setLayoutProperty('evacuation-zones-outline', 'visibility', visibility);
    
    setWmtsLayerVisible(newVisibility);
  };

  return (
    <div className="relative w-full h-screen bg-map-surface overflow-hidden">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ 
          background: 'hsl(var(--map-surface))'
        }}
      />
      
      {/* Right Side Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
        {/* Basemap Panel */}
        <div className="bg-map-overlay/95 backdrop-blur-sm border border-map-border rounded-lg shadow-elegant">
          <div className="p-3 border-b border-map-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-map-accent" />
                <span className="text-sm font-medium text-map-text">Basemap</span>
              </div>
              <ChevronDown className="h-4 w-4 text-map-text-muted" />
            </div>
            <Select value={currentBasemap} onValueChange={changeBasemap}>
              <SelectTrigger className="w-full mt-2 bg-map-control border-map-border text-map-text text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-map-overlay border-map-border z-50">
                {Object.entries(basemaps).map(([key, basemap]) => (
                  <SelectItem key={key} value={key} className="text-map-text hover:bg-map-control">
                    {basemap.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* WMTS Layers Panel */}
        <div className="bg-map-overlay/95 backdrop-blur-sm border border-map-border rounded-lg shadow-elegant">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-map-accent" />
                <span className="text-sm font-medium text-map-text">Data Layers</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wmtsLayerVisible}
                  onChange={toggleWmtsLayer}
                  className="w-3 h-3 rounded border border-map-border bg-map-control checked:bg-map-accent"
                />
                <span className="text-xs text-map-text">Evacuation Zones</span>
              </label>
            </div>
          </div>
        </div>

        {/* Search Tool */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-map-overlay/95 hover:bg-map-control border-map-border shadow-elegant"
        >
          <Search className="h-4 w-4 text-map-text" />
        </Button>

        {/* Layers Tool */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-map-overlay/95 hover:bg-map-control border-map-border shadow-elegant"
        >
          <Layers className="h-4 w-4 text-map-text" />
        </Button>

        {/* Measure Tool */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-map-overlay/95 hover:bg-map-control border-map-border shadow-elegant"
        >
          <Ruler className="h-4 w-4 text-map-text" />
        </Button>

        {/* Navigation Tool */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-map-overlay/95 hover:bg-map-control border-map-border shadow-elegant"
        >
          <Navigation className="h-4 w-4 text-map-text" />
        </Button>

        {/* Home/Extent Tool */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-map-overlay/95 hover:bg-map-control border-map-border shadow-elegant"
        >
          <Home className="h-4 w-4 text-map-text" />
        </Button>

        {/* Zoom In */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-map-overlay/95 hover:bg-map-control border-map-border shadow-elegant"
          onClick={() => map.current?.zoomIn()}
        >
          <ZoomIn className="h-4 w-4 text-map-text" />
        </Button>

        {/* Zoom Out */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-map-overlay/95 hover:bg-map-control border-map-border shadow-elegant"
          onClick={() => map.current?.zoomOut()}
        >
          <ZoomOut className="h-4 w-4 text-map-text" />
        </Button>

        {/* Reset Rotation */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-map-overlay/95 hover:bg-map-control border-map-border shadow-elegant"
          onClick={() => map.current?.easeTo({ bearing: 0, pitch: 0 })}
        >
          <RotateCcw className="h-4 w-4 text-map-text" />
        </Button>
      </div>

      {/* Scale Bar */}
      <div className="absolute bottom-4 left-4 text-xs text-map-text-muted">
        MapLibre GL JS • Esri Services
      </div>
    </div>
  );
};

export default MapView;