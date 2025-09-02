
import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

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
  Map as MapIcon,
  AlertTriangle
} from 'lucide-react';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('streets');
  const [vectorLayerVisible, setVectorLayerVisible] = useState(false);
  const [layerStatus, setLayerStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  const { toast } = useToast();

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

    // Set map loaded state and add vector layers when style is loaded
    map.current.on('load', () => {
      if (!map.current) return;
      
      addVectorLayers();
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Add vector layers using Supabase Edge Function proxy
  const addVectorLayers = async () => {
    if (!map.current) return;
    
    setLayerStatus('loading');
    
    try {
      console.log('🚀 Adding vector evacuation zones layer via Supabase proxy...');
      
      // Use Supabase Edge Function proxy for WMTS tiles
      const proxyTileUrl = 'https://lwkcovcbhdotptzphevc.supabase.co/functions/v1/wmts-proxy/{z}/{x}/{y}';

      // Add vector source
      map.current.addSource('vector-evacuation', {
        type: 'vector',
        tiles: [proxyTileUrl],
        minzoom: 0,
        maxzoom: 18
      });

      // Add fill layer for evacuation zones
      map.current.addLayer({
        id: 'evacuation-zones-fill',
        type: 'fill',
        source: 'vector-evacuation',
        'source-layer': 'evacuation_zone_details', // This may need adjustment based on actual layer name
        paint: {
          'fill-color': [
            'case',
            ['has', 'zone_type'],
            [
              'match',
              ['get', 'zone_type'],
              'immediate', '#ff4444',
              'warning', '#ff8800',
              'watch', '#ffdd00',
              '#6366f1' // default blue
            ],
            '#6366f1' // fallback blue
          ],
          'fill-opacity': 0.6
        },
        layout: {
          visibility: 'visible'
        }
      });

      // Add outline layer for better visibility
      map.current.addLayer({
        id: 'evacuation-zones-outline',
        type: 'line',
        source: 'vector-evacuation',
        'source-layer': 'evacuation_zone_details',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.8
        },
        layout: {
          visibility: 'visible'
        }
      });

      // Add hover effects and click handlers for query functionality
      map.current.on('mouseenter', 'evacuation-zones-fill', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'evacuation-zones-fill', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      // Click handler for feature queries (for future functionality)
      map.current.on('click', 'evacuation-zones-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          console.log('🎯 Evacuation zone clicked:', feature.properties);
          
          // Future query functionality can be added here
          toast({
            title: "Evacuation Zone",
            description: `Zone ID: ${feature.properties?.id || 'Unknown'}`,
          });
        }
      });

      console.log('✅ Vector evacuation zones added successfully via Supabase proxy');
      setLayerStatus('success');
      setVectorLayerVisible(true);
      
      toast({
        title: "Vector Layer Loaded",
        description: "Loaded via Supabase Edge Function proxy",
      });
      
    } catch (error) {
      console.error('❌ Error adding vector layers:', error);
      setLayerStatus('error');
      toast({
        variant: "destructive",
        title: "Layer Load Error",
        description: "Could not load evacuation zones. Please try again.",
      });
    }
  };

  // Query features at a point (for future use)
  const queryFeaturesAtPoint = (lngLat: [number, number]) => {
    if (!map.current) return [];
    
    const point = map.current.project(lngLat);
    return map.current.queryRenderedFeatures(point, {
      layers: ['evacuation-zones-fill']
    });
  };

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

  const toggleVectorLayer = () => {
    if (!map.current || !mapLoaded) return;

    const newVisibility = !vectorLayerVisible;
    const visibility = newVisibility ? 'visible' : 'none';
    
    // Toggle both fill and outline layers
    map.current.setLayoutProperty('evacuation-zones-fill', 'visibility', visibility);
    map.current.setLayoutProperty('evacuation-zones-outline', 'visibility', visibility);
    
    setVectorLayerVisible(newVisibility);
  };

  const retryVectorLayer = () => {
    if (!map.current) return;
    
    // Remove existing layers if they exist
    try {
      if (map.current.getLayer('evacuation-zones-fill')) {
        map.current.removeLayer('evacuation-zones-fill');
      }
      if (map.current.getLayer('evacuation-zones-outline')) {
        map.current.removeLayer('evacuation-zones-outline');
      }
      if (map.current.getSource('vector-evacuation')) {
        map.current.removeSource('vector-evacuation');
      }
    } catch (error) {
      console.log('No existing layers to remove');
    }
    
    // Reset states and retry
    setLayerStatus('loading');
    addVectorLayers();
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
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vectorLayerVisible}
                    onChange={toggleVectorLayer}
                    disabled={layerStatus === 'loading'}
                    className="w-3 h-3 rounded border border-map-border bg-map-control checked:bg-map-accent disabled:opacity-50"
                  />
                  <span className="text-xs text-map-text">Evacuation Zones</span>
                </label>
                
                {/* Status indicator */}
                <div className="flex items-center gap-1">
                  {layerStatus === 'loading' && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  )}
                  {layerStatus === 'success' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                  {layerStatus === 'error' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={retryVectorLayer}
                      className="w-4 h-4 p-0 hover:bg-map-control"
                    >
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Status text */}
              <div className="text-xs text-map-text-muted">
                {layerStatus === 'loading' && 'Loading vector tiles...'}
                {layerStatus === 'success' && 'Vector tiles loaded via proxy'}
                {layerStatus === 'error' && 'Failed to load - click to retry'}
              </div>
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
