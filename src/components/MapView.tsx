
import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, ScaleControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import LayersPanel from './LayersPanel';
import BasemapToggle from './BasemapToggle';
import ToolsPopup from './ToolsPopup';

import { 
  Search, 
  Layers, 
  Map as MapIcon, 
  ChevronUp, 
  Home, 
  ZoomIn, 
  ZoomOut,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('streets');
  const [vectorLayerVisible, setVectorLayerVisible] = useState(false);
  const [layerStatus, setLayerStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [activeLayer, setActiveLayer] = useState('Genasys Zones');
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [basemapToggleOpen, setBasemapToggleOpen] = useState(false);
  const [toolsPopupOpen, setToolsPopupOpen] = useState(false);
  
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
    map.current.addControl(new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-left');

    map.current.addControl(new ScaleControl({
      maxWidth: 100,
      unit: 'imperial'
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

  const resetMapView = () => {
    if (!map.current) return;
    map.current.easeTo({
      center: [-116.4, 33.7],
      zoom: 10,
      bearing: 0,
      pitch: 0
    });
  };

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle geographic search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !map.current) return;
    
    try {
      // Use a simple geocoding service (you could replace with a more robust solution)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const results = await response.json();
      
      if (results.length > 0) {
        const result = results[0];
        map.current.flyTo({
          center: [parseFloat(result.lon), parseFloat(result.lat)],
          zoom: 12
        });
        
        toast({
          title: "Location Found",
          description: `Navigated to ${result.display_name}`,
        });
        setSearchOpen(false); // Auto-close search bar
      } else {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Could not find the specified location.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "An error occurred while searching.",
      });
    }
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
      />
      
      {/* Active Layer Selector - Top Right Corner */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 min-w-56">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">Active Layer</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
          <Select value={activeLayer} onValueChange={setActiveLayer}>
            <SelectTrigger className="w-full bg-white border-gray-200 text-gray-900 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 z-50">
              <SelectItem value="Genasys Zones" className="text-xs text-black">Genasys Zones</SelectItem>
              <SelectItem value="Custom Zone Areas" className="text-xs text-black">Custom Zone Areas</SelectItem>
              <SelectItem value="Custom Layer 1" className="text-xs text-black">Custom Layer 1</SelectItem>
              <SelectItem value="Custom Layer 2" className="text-xs text-black">Custom Layer 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="absolute top-20 left-4 right-4 z-30">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search and Filter Zones"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setSearchOpen(false)}
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Right Side Toolbar - Top buttons moved down */}
      <div className="absolute top-28 right-4 z-20 flex flex-col gap-1">
        {/* Search Button */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Layers Button */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          onClick={() => setLayersPanelOpen(!layersPanelOpen)}
        >
          <Layers className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Basemap Toggle Button */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          onClick={() => setBasemapToggleOpen(!basemapToggleOpen)}
        >
          <MapIcon className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Bottom Right Toolbar - Bottom 4 buttons */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1">
        {/* Tools Popup */}
        <ToolsPopup 
          isOpen={toolsPopupOpen}
          onClose={() => setToolsPopupOpen(false)}
        />
        
        {/* Tools Popup Button */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          onClick={() => setToolsPopupOpen(!toolsPopupOpen)}
        >
          {toolsPopupOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          )}
        </Button>

        {/* Reset Map Button */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          onClick={resetMapView}
        >
          <Home className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Zoom In */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          onClick={() => map.current?.zoomIn()}
        >
          <ZoomIn className="h-4 w-4 text-gray-600" />
        </Button>

        {/* Zoom Out */}
        <Button 
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          onClick={() => map.current?.zoomOut()}
        >
          <ZoomOut className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Popups */}
      <LayersPanel 
        isOpen={layersPanelOpen} 
        onClose={() => setLayersPanelOpen(false)} 
      />
      <BasemapToggle 
        isOpen={basemapToggleOpen}
        currentBasemap={currentBasemap}
        onBasemapChange={changeBasemap}
        onClose={() => setBasemapToggleOpen(false)}
      />

      {/* Hidden layer status for debugging */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
        {layerStatus === 'loading' && 'Loading layers...'}
        {layerStatus === 'success' && vectorLayerVisible && 'Layers loaded'}
        {layerStatus === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={retryVectorLayer}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Retry layer load
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapView;
