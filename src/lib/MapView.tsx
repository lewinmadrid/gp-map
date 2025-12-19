import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, ScaleControl, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from './hooks/use-mobile';
import LayersPanel from '@/components/LayersPanel';
import BasemapToggle from '@/components/BasemapToggle';
import ToolsPopup from '@/components/ToolsPopup';
import Legend from '@/components/Legend';
import LeftSidebar from '@/components/LeftSidebar';
import TopToolbar from '@/components/TopToolbar';
import NewsToolbar from '@/components/NewsToolbar';
import ModeToggle from '@/components/ModeToggle';
import AttributePanel from '@/components/AttributePanel';
import CoverageAttributePanel from '@/components/CoverageAttributePanel';
import * as shp from 'shpjs';
import { Search, Layers, Map as MapIcon, ChevronUp, Home, ZoomIn, ZoomOut, ChevronDown, AlertTriangle, Ruler, Scissors, Undo, Trash2 } from 'lucide-react';
import type { MapViewProps, BasemapOption, AppMode, CoverageFilters } from './types';

// Default values
const DEFAULT_CENTER: [number, number] = [-117.1611, 32.7157]; // San Diego, CA
const DEFAULT_ZOOM = 13;
const DEFAULT_BASEMAP: BasemapOption = 'topographic';
const DEFAULT_MODE: AppMode = 'evac';

const DEFAULT_UI_OPTIONS = {
  showLayersPanel: true,
  showBasemapToggle: true,
  showToolsPopup: true,
  showLegend: true,
  showModeToggle: true,
  showLeftSidebar: true,
  showTopToolbar: true,
  showNewsToolbar: true,
  showSearchBar: true,
  showZoomControls: true,
  showAttributePanel: true,
};

/**
 * MapView Component for npm package
 * 
 * A configurable map component with WMTS tile support, evacuation zones,
 * drawing tools, and multiple map modes.
 */
const MapView: React.FC<MapViewProps> = ({
  supabaseProjectUrl,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  initialBasemap = DEFAULT_BASEMAP,
  initialMode = DEFAULT_MODE,
  onActivityLog,
  onFeatureSelect,
  onModeChange,
  uiOptions = DEFAULT_UI_OPTIONS,
  className,
}) => {
  const isMobile = useIsMobile();
  
  // Activity logging helper
  const logActivity = (actionType: string, actionData?: Record<string, any>) => {
    if (onActivityLog) {
      onActivityLog(actionType, actionData);
    }
  };

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const geolocateControlRef = useRef<any>(null);
  const selectedFeaturesRef = useRef<any[]>([]);
  const selectedPolygonsRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState<BasemapOption>(initialBasemap);
  const [vectorLayerVisible, setVectorLayerVisible] = useState(false);
  const [layerStatus, setLayerStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [activeLayer, setActiveLayer] = useState('Genasys Zones');
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [zoneLayerVisible, setZoneLayerVisible] = useState(true);
  const [parksLayerVisible, setParksLayerVisible] = useState(false);
  const [waterDistrictLayerVisible, setWaterDistrictLayerVisible] = useState(false);
  const [cellTowerLayerVisible, setCellTowerLayerVisible] = useState(true);
  const [basemapToggleOpen, setBasemapToggleOpen] = useState(false);
  const [toolsPopupOpen, setToolsPopupOpen] = useState(false);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  const [distances, setDistances] = useState<number[]>([]);
  const [measurementMarkers, setMeasurementMarkers] = useState<any[]>([]);
  const [legendOpen, setLegendOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<any[]>([]);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'circle' | 'radius' | null>(null);
  const [selectMode, setSelectMode] = useState(true);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempCircleCenter, setTempCircleCenter] = useState<[number, number] | null>(null);
  const [drawingMarkers, setDrawingMarkers] = useState<any[]>([]);
  const [excludeMode, setExcludeMode] = useState(false);
  const [currentPolygonHoles, setCurrentPolygonHoles] = useState<[number, number][][]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);
  const [selectedPolygons, setSelectedPolygons] = useState<any[]>([]);
  const [currentMode, setCurrentMode] = useState<AppMode>(initialMode);
  const [drawingHistory, setDrawingHistory] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [attributePanelFeature, setAttributePanelFeature] = useState<any>(null);
  const [coveragePanelCells, setCoveragePanelCells] = useState<any[]>([]);
  const [newsInfoMode, setNewsInfoMode] = useState(false);
  const [coverageFilters, setCoverageFilters] = useState<CoverageFilters>({ tech: '', band: '', utm: '', bsMc: '' });
  const [selectedCoverageDate, setSelectedCoverageDate] = useState('09-12-2025');
  const hasShownExcludeTooltipRef = useRef(false);
  const [showExcludeTooltip, setShowExcludeTooltip] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();

  // Merge UI options with defaults
  const mergedUIOptions = { ...DEFAULT_UI_OPTIONS, ...uiOptions };

  // Keep refs in sync with state
  useEffect(() => {
    selectedFeaturesRef.current = selectedFeatures;
  }, [selectedFeatures]);

  useEffect(() => {
    selectedPolygonsRef.current = selectedPolygons;
  }, [selectedPolygons]);

  // Notify parent of mode changes
  useEffect(() => {
    if (onModeChange) {
      onModeChange(currentMode);
    }
  }, [currentMode, onModeChange]);

  // Notify parent of feature selection changes
  useEffect(() => {
    if (onFeatureSelect) {
      onFeatureSelect(selectedFeatures);
    }
  }, [selectedFeatures, onFeatureSelect]);

  // Reset sidebar expanded state when switching to EVAC mode
  useEffect(() => {
    if (currentMode === 'evac') {
      setSidebarExpanded(false);
    }
  }, [currentMode]);

  // Basemap configurations
  const basemaps = {
    satellite: {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    streets: {
      name: 'Streets',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri, HERE, Garmin'
    },
    topographic: {
      name: 'Topographic',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    terrain: {
      name: 'Terrain',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    'google-satellite': {
      name: 'Google Satellite',
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '© Google'
    },
    'google-roads': {
      name: 'Google Roads',
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: '© Google'
    },
    'google-hybrid': {
      name: 'Google Hybrid',
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '© Google'
    },
    'google-terrain': {
      name: 'Google Terrain',
      url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      attribution: '© Google'
    }
  };

  // Helper functions
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2[1] - point1[1]) * Math.PI / 180;
    const dLon = (point2[0] - point1[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const countPolygonVertices = (feature: any): number => {
    if (!feature?.geometry) return 0;
    const geometry = feature.geometry;
    if (geometry.type === 'Polygon') {
      return geometry.coordinates[0]?.length || 0;
    } else if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.reduce((total: number, polygon: any) => {
        return total + (polygon[0]?.length || 0);
      }, 0);
    }
    return 0;
  };

  // Build tile URLs using supabaseProjectUrl if provided
  const getProxyTileUrl = (functionName: string): string | null => {
    if (!supabaseProjectUrl) return null;
    return `${supabaseProjectUrl}/${functionName}/{z}/{x}/{y}`;
  };

  // Add vector layers function
  const addVectorLayers = () => {
    if (!map.current) return;

    const proxyTileUrl = getProxyTileUrl('wmts-proxy');
    const labelsProxyUrl = getProxyTileUrl('wmts-labels-proxy');

    // Only add WMTS layers if supabaseProjectUrl is configured
    if (proxyTileUrl && labelsProxyUrl) {
      try {
        // Add evacuation zones source
        map.current.addSource('evacuation-zones', {
          type: 'vector',
          tiles: [proxyTileUrl],
          minzoom: 5,
          maxzoom: 18
        });

        // Add labels source
        map.current.addSource('evacuation-labels-source', {
          type: 'vector',
          tiles: [labelsProxyUrl],
          minzoom: 5,
          maxzoom: 18
        });

        // Add fill layer
        map.current.addLayer({
          id: 'evacuation-zones-fill',
          type: 'fill',
          source: 'evacuation-zones',
          'source-layer': 'evacuation_zone_details',
          paint: {
            'fill-color': [
              'match',
              ['get', 'zonestatus'],
              'Order', '#FF4444',
              'Warning', '#FFA500',
              'Shelter-in-Place', '#FFFF00',
              'Partial Evac', '#FF69B4',
              'Normal', 'rgba(100, 149, 237, 0.3)',
              'rgba(100, 149, 237, 0.3)'
            ],
            'fill-opacity': 0.5
          }
        });

        // Add outline layer
        map.current.addLayer({
          id: 'evacuation-zones-outline',
          type: 'line',
          source: 'evacuation-zones',
          'source-layer': 'evacuation_zone_details',
          paint: {
            'line-color': '#333',
            'line-width': 1
          }
        });

        // Add labels layer
        map.current.addLayer({
          id: 'evacuation-labels',
          type: 'symbol',
          source: 'evacuation-labels-source',
          'source-layer': 'evacuation_zone_ids',
          layout: {
            'text-field': ['get', 'zone_identifier'],
            'text-size': 12,
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#000',
            'text-halo-color': '#fff',
            'text-halo-width': 1
          }
        });

        setVectorLayerVisible(true);
        setLayerStatus('success');
        logActivity('layers_loaded', { success: true });
      } catch (error) {
        console.error('Error adding vector layers:', error);
        setLayerStatus('error');
        logActivity('layers_loaded', { success: false, error: String(error) });
      }
    } else {
      // No WMTS configured, skip loading
      setLayerStatus('success');
      console.info('WMTS layers disabled - no supabaseProjectUrl provided');
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      map.current = new Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'esri-source': {
              type: 'raster',
              tiles: [basemaps[currentBasemap].url],
              tileSize: 256,
              attribution: basemaps[currentBasemap].attribution
            }
          },
          layers: [{
            id: 'esri-layer',
            type: 'raster',
            source: 'esri-source'
          }]
        },
        center: initialCenter,
        zoom: initialZoom,
        pitch: 0,
        bearing: 0
      });

      geolocateControlRef.current = new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      });
      map.current.addControl(geolocateControlRef.current, 'top-left');

      setTimeout(() => {
        const geolocateButton = document.querySelector('.maplibregl-ctrl-geolocate');
        if (geolocateButton) {
          (geolocateButton as HTMLElement).style.display = 'none';
        }
      }, 100);

      map.current.addControl(new ScaleControl({
        maxWidth: 100,
        unit: 'imperial'
      }), 'bottom-left');

      map.current.on('load', () => {
        if (!map.current) return;
        console.log('Map loaded successfully');
        addVectorLayers();
        setMapLoaded(true);
        logActivity('map_loaded', { center: initialCenter, zoom: initialZoom });
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map Initialization Error",
        description: "Failed to initialize map. Please refresh the page.",
        variant: "destructive"
      });
    }

    return () => {
      try {
        if (map.current) {
          map.current.remove();
        }
      } catch (error) {
        console.error('Error cleaning up map:', error);
      }
    };
  }, []);

  // Change basemap handler
  const changeBasemap = (newBasemap: BasemapOption) => {
    if (!map.current) return;

    const source = map.current.getSource('esri-source') as any;
    if (source) {
      source.setTiles([basemaps[newBasemap].url]);
    }
    setCurrentBasemap(newBasemap);
    setBasemapToggleOpen(false);
    logActivity('basemap_changed', { basemap: newBasemap });
  };

  // Toggle layer visibility
  const toggleZoneLayerVisibility = () => {
    setZoneLayerVisible(!zoneLayerVisible);
    if (map.current) {
      const visibility = !zoneLayerVisible ? 'visible' : 'none';
      ['evacuation-zones-fill', 'evacuation-zones-outline', 'evacuation-labels'].forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', visibility);
        }
      });
    }
    logActivity('layer_toggled', { layer: 'zones', visible: !zoneLayerVisible });
  };

  const toggleParksLayerVisibility = () => {
    setParksLayerVisible(!parksLayerVisible);
    logActivity('layer_toggled', { layer: 'parks', visible: !parksLayerVisible });
  };

  const toggleWaterDistrictLayerVisibility = () => {
    setWaterDistrictLayerVisible(!waterDistrictLayerVisible);
    logActivity('layer_toggled', { layer: 'water_district', visible: !waterDistrictLayerVisible });
  };

  const toggleCellTowerLayerVisibility = () => {
    setCellTowerLayerVisible(!cellTowerLayerVisible);
    logActivity('layer_toggled', { layer: 'cell_tower', visible: !cellTowerLayerVisible });
  };

  // Measurement toggle
  const toggleMeasurement = () => {
    if (measurementMode) {
      clearMeasurements();
    }
    setMeasurementMode(!measurementMode);
    logActivity('measurement_toggled', { active: !measurementMode });
  };

  const clearMeasurements = () => {
    measurementMarkers.forEach(marker => {
      if ((marker as any)._popup) {
        (marker as any)._popup.remove();
      }
      marker.remove();
    });
    setMeasurementMarkers([]);
    setMeasurementPoints([]);
    setDistances([]);
    if (map.current?.getSource('measurement-line')) {
      map.current.removeLayer('measurement-line');
      map.current.removeSource('measurement-line');
    }
  };

  // Geolocation trigger
  const triggerGeolocation = () => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger();
    }
    logActivity('geolocation_triggered');
  };

  // Reset map view
  const resetMapView = () => {
    if (map.current) {
      map.current.flyTo({
        center: initialCenter,
        zoom: initialZoom,
        pitch: 0,
        bearing: 0
      });
    }
    logActivity('map_reset');
  };

  // Mode change handler
  const handleModeChange = (mode: AppMode) => {
    setCurrentMode(mode);
    logActivity('mode_changed', { mode });
  };

  // Search handler
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    logActivity('search_performed', { query: searchQuery });
    toast({
      title: "Search",
      description: `Searching for: ${searchQuery}`
    });
  };

  // Retry vector layer loading
  const retryVectorLayer = () => {
    setLayerStatus('loading');
    addVectorLayers();
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className || ''}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Mode Toggle */}
      {mergedUIOptions.showModeToggle && (
        <ModeToggle
          mode={currentMode}
          onModeChange={handleModeChange}
          sidebarExpanded={sidebarExpanded}
          isMobile={isMobile}
        />
      )}

      {/* Left Sidebar */}
      {mergedUIOptions.showLeftSidebar && (
        <LeftSidebar
          onExpandedChange={setSidebarExpanded}
          isMobile={isMobile}
        />
      )}

      {/* Top Toolbar (Alert Mode) */}
      {mergedUIOptions.showTopToolbar && currentMode === 'alert' && (
        <TopToolbar
          currentMode={selectMode ? 'select' : (drawingMode || 'select')}
          onDrawTool={(tool) => {
            setDrawingMode(tool);
            setSelectMode(false);
          }}
          onSelectArea={() => {
            setDrawingMode(null);
            setSelectMode(true);
          }}
          onUploadShapeFile={() => {}}
          onEditTool={() => {}}
          onSnapshot={() => {}}
          onLocationSelect={() => {}}
          isMobile={isMobile}
        />
      )}

      {/* News Toolbar */}
      {mergedUIOptions.showNewsToolbar && currentMode === 'news' && (
        <NewsToolbar
          isMobile={isMobile}
          infoMode={newsInfoMode}
          onInfoModeChange={setNewsInfoMode}
          onFiltersChange={setCoverageFilters}
          onDateChange={setSelectedCoverageDate}
        />
      )}

      {/* Right Side Toolbar */}
      <div className={`absolute top-36 right-4 z-20 flex flex-col gap-1 ${isMobile ? 'hidden' : ''}`}>
        {mergedUIOptions.showSearchBar && (
          <Button
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-4 w-4 text-gray-600" />
          </Button>
        )}

        {mergedUIOptions.showLayersPanel && (
          <Button
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-colors"
            onClick={() => setLayersPanelOpen(!layersPanelOpen)}
          >
            <Layers className="h-4 w-4 text-gray-600" />
          </Button>
        )}

        {mergedUIOptions.showBasemapToggle && (
          <Button
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-colors"
            onClick={() => setBasemapToggleOpen(!basemapToggleOpen)}
          >
            <MapIcon className="h-4 w-4 text-gray-600" />
          </Button>
        )}
      </div>

      {/* Bottom Right Toolbar */}
      {mergedUIOptions.showZoomControls && (
        <div className={`absolute right-4 z-20 flex flex-col gap-1 ${(currentMode === 'alert' || currentMode === 'news') ? 'bottom-20' : 'bottom-4'}`}>
          {mergedUIOptions.showToolsPopup && (
            <Button
              variant="secondary"
              size="sm"
              className="w-10 h-10 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-colors"
              onClick={() => setToolsPopupOpen(!toolsPopupOpen)}
            >
              {toolsPopupOpen ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronUp className="h-4 w-4 text-gray-600" />}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-colors"
            onClick={resetMapView}
          >
            <Home className="h-4 w-4 text-gray-600" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-colors"
            onClick={() => map.current?.zoomIn()}
          >
            <ZoomIn className="h-4 w-4 text-gray-600" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="w-10 h-10 p-0 bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-colors"
            onClick={() => map.current?.zoomOut()}
          >
            <ZoomOut className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      )}

      {/* Search Bar */}
      {searchOpen && (
        <div className="absolute top-20 left-20 right-4 z-30">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search and Filter Zones"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => setSearchOpen(false)}>
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Popups */}
      <LayersPanel
        isOpen={layersPanelOpen}
        onClose={() => setLayersPanelOpen(false)}
        onToggleZoneLayer={toggleZoneLayerVisibility}
        zoneLayerVisible={zoneLayerVisible}
        onToggleParksLayer={toggleParksLayerVisibility}
        parksLayerVisible={parksLayerVisible}
        onToggleWaterDistrictLayer={toggleWaterDistrictLayerVisibility}
        waterDistrictLayerVisible={waterDistrictLayerVisible}
        onToggleCellTowerLayer={toggleCellTowerLayerVisibility}
        cellTowerLayerVisible={cellTowerLayerVisible}
        currentMode={currentMode}
        isMobile={isMobile}
      />
      
      <BasemapToggle
        isOpen={basemapToggleOpen}
        currentBasemap={currentBasemap}
        onBasemapChange={changeBasemap}
        onClose={() => setBasemapToggleOpen(false)}
        isMobile={isMobile}
      />
      
      <ToolsPopup
        isOpen={toolsPopupOpen}
        onClose={() => setToolsPopupOpen(false)}
        onMeasure={toggleMeasurement}
        onGeolocation={triggerGeolocation}
        onLegend={() => setLegendOpen(true)}
        measurementMode={measurementMode}
        isMobile={isMobile}
      />
      
      {mergedUIOptions.showLegend && (
        <Legend isOpen={legendOpen} onClose={() => setLegendOpen(false)} />
      )}

      {/* Measurement Status */}
      {measurementMode && (
        <div className="absolute top-20 left-20 z-30">
          <div className="bg-blue-100/95 backdrop-blur-sm border border-blue-200 rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <Ruler className="h-4 w-4" />
              <span>Measurement Mode Active</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Click on the map to measure distances
            </div>
            {distances.length > 0 && (
              <div className="mt-2 text-xs text-blue-700">
                <div>Total segments: {distances.length}</div>
                <div>Total distance: {distances.reduce((sum, d) => sum + d, 0).toFixed(2)} km</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layer Status */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
        {layerStatus === 'loading' && 'Loading layers...'}
        {layerStatus === 'success' && vectorLayerVisible && 'Layers loaded'}
        {layerStatus === 'error' && (
          <Button variant="ghost" size="sm" onClick={retryVectorLayer} className="text-xs text-red-500 hover:text-red-600">
            Retry layer load
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapView;
