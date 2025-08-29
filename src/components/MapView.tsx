import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Layers, Search, Settings } from 'lucide-react';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('terrain');

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
      center: [-74.006, 40.7128], // New York City
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

    // Set map loaded state
    map.current.on('load', () => {
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

  return (
    <div className="relative w-full h-screen bg-map-surface">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 rounded-none"
        style={{ 
          background: 'hsl(var(--map-surface))'
        }}
      />
      
      {/* Top Control Panel */}
      <Card className="absolute top-4 left-4 bg-map-overlay/95 backdrop-blur-sm border-map-border shadow-elegant z-10">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-map-text">
            <MapPin className="h-5 w-5 text-map-accent" />
            <span className="font-semibold">MapLibre GIS</span>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-map-text-muted">Basemap</label>
            <Select value={currentBasemap} onValueChange={changeBasemap}>
              <SelectTrigger className="w-[180px] bg-map-control border-map-border text-map-text">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-map-overlay border-map-border">
                {Object.entries(basemaps).map(([key, basemap]) => (
                  <SelectItem key={key} value={key} className="text-map-text hover:bg-map-control">
                    {basemap.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Search Panel */}
      <Card className="absolute top-4 right-4 bg-map-overlay/95 backdrop-blur-sm border-map-border shadow-elegant z-10">
        <div className="p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-map-text-muted hover:text-map-text hover:bg-map-control"
          >
            <Search className="h-4 w-4 mr-2" />
            Search locations...
          </Button>
        </div>
      </Card>

      {/* Bottom Status Bar */}
      <Card className="absolute bottom-4 right-4 bg-map-overlay/95 backdrop-blur-sm border-map-border shadow-elegant z-10">
        <div className="px-4 py-2 flex items-center gap-4 text-sm text-map-text-muted">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-map-accent animate-pulse" />
            <span>Connected</span>
          </div>
          <div className="text-xs">
            MapLibre GL JS • Esri Services
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MapView;