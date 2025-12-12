import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, ScaleControl, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import LayersPanel from './LayersPanel';
import BasemapToggle from './BasemapToggle';
import ToolsPopup from './ToolsPopup';
import Legend from './Legend';
import LeftSidebar from './LeftSidebar';
import TopToolbar from './TopToolbar';
import NewsToolbar from './NewsToolbar';
import ModeToggle from './ModeToggle';
import AttributePanel from './AttributePanel';
import CoverageAttributePanel from './CoverageAttributePanel';
import * as shp from 'shpjs';
import { Search, Layers, Map as MapIcon, ChevronUp, Home, ZoomIn, ZoomOut, ChevronDown, AlertTriangle, Ruler, Scissors, Undo, Trash2 } from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';
const MapView = () => {
  const isMobile = useIsMobile();
  const { logActivity } = useActivityLogger();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const geolocateControlRef = useRef<any>(null);
  const selectedFeaturesRef = useRef<any[]>([]);
  const selectedPolygonsRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('topographic');
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
  const [selectMode, setSelectMode] = useState(true); // Default to select mode
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempCircleCenter, setTempCircleCenter] = useState<[number, number] | null>(null);
  const [drawingMarkers, setDrawingMarkers] = useState<any[]>([]);
  const [excludeMode, setExcludeMode] = useState(false);
  const [currentPolygonHoles, setCurrentPolygonHoles] = useState<[number, number][][]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);
  const [selectedPolygons, setSelectedPolygons] = useState<any[]>([]);
  const [currentMode, setCurrentMode] = useState<'evac' | 'alert' | 'news'>('evac');
  const [drawingHistory, setDrawingHistory] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [attributePanelFeature, setAttributePanelFeature] = useState<any>(null);
  const [coveragePanelCells, setCoveragePanelCells] = useState<any[]>([]);
  const hasShownExcludeTooltipRef = useRef(false);
  const [showExcludeTooltip, setShowExcludeTooltip] = useState(false);
  const {
    toast
  } = useToast();

  // Keep refs in sync with state
  useEffect(() => {
    selectedFeaturesRef.current = selectedFeatures;
  }, [selectedFeatures]);

  useEffect(() => {
    selectedPolygonsRef.current = selectedPolygons;
  }, [selectedPolygons]);

  // Reset sidebar expanded state when switching to EVAC mode
  // This ensures the map offset matches the sidebar's initial collapsed state
  useEffect(() => {
    if (currentMode === 'evac') {
      setSidebarExpanded(false);
    }
  }, [currentMode]);

  // Hide zone layer when in NEWS mode, show cell tower layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const zoneLayers = ['evacuation-zones-fill', 'evacuation-zones-outline', 'evacuation-labels'];
    const cellTowerLayers = ['cell-tower-coverage-fill', 'cell-tower-coverage-outline', 'cell-tower-points', 'cell-tower-points-inner'];
    const isNewsMode = currentMode === 'news';
    
    // Hide zone layers in NEWS mode
    zoneLayers.forEach(layerId => {
      const layer = map.current?.getLayer(layerId);
      if (layer) {
        map.current?.setLayoutProperty(layerId, 'visibility', isNewsMode ? 'none' : (zoneLayerVisible ? 'visible' : 'none'));
      }
    });
    
    // Show cell tower layers in NEWS mode
    cellTowerLayers.forEach(layerId => {
      const layer = map.current?.getLayer(layerId);
      if (layer) {
        map.current?.setLayoutProperty(layerId, 'visibility', isNewsMode && cellTowerLayerVisible ? 'visible' : 'none');
      }
    });
  }, [currentMode, mapLoaded, zoneLayerVisible, cellTowerLayerVisible]);

  // Preserve map center/zoom when sidebar expands/collapses
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const center = map.current.getCenter();
    const zoom = map.current.getZoom();
    
    // Resize map after layout change
    setTimeout(() => {
      if (map.current) {
        map.current.resize();
        // Restore the center and zoom after resize
        map.current.jumpTo({ center, zoom });
      }
    }, 50);
  }, [sidebarExpanded, mapLoaded]);

  // Handle shapefile upload
  const handleShapeFileUpload = async (file: File) => {
    if (!map.current) return;
    try {
      toast({
        title: "Processing Shapefile",
        description: "Converting shapefile to polygon..."
      });

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Parse shapefile using shpjs
      const geojson = await shp.parseZip(arrayBuffer);
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        throw new Error('No features found in shapefile');
      }

      // Create polygons for each feature
      geojson.features.forEach((feature: any, index: number) => {
        if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
          const polygonId = `uploaded-polygon-${Date.now()}-${index}`;
          map.current?.addSource(polygonId, {
            type: 'geojson',
            data: feature
          });
          map.current?.addLayer({
            id: `${polygonId}-fill`,
            type: 'fill',
            source: polygonId,
            paint: {
              'fill-color': '#10b981',
              'fill-opacity': 0.2
            }
          });
          map.current?.addLayer({
            id: `${polygonId}-outline`,
            type: 'line',
            source: polygonId,
            paint: {
              'line-color': '#10b981',
              'line-width': 2
            }
          });
        }
      });

      // Fit map to uploaded features
      if (geojson.features.length > 0) {
        // Calculate bounds of all features
        let minLng = Infinity,
          minLat = Infinity,
          maxLng = -Infinity,
          maxLat = -Infinity;
        geojson.features.forEach((feature: any) => {
          if (feature.geometry && feature.geometry.coordinates) {
            const flattenCoordinates = (coords: any[]): void => {
              coords.forEach(coord => {
                if (Array.isArray(coord[0])) {
                  flattenCoordinates(coord);
                } else {
                  minLng = Math.min(minLng, coord[0]);
                  maxLng = Math.max(maxLng, coord[0]);
                  minLat = Math.min(minLat, coord[1]);
                  maxLat = Math.max(maxLat, coord[1]);
                }
              });
            };
            flattenCoordinates(feature.geometry.coordinates);
          }
        });
        map.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
          padding: 50
        });
      }
      toast({
        title: "Shapefile Uploaded",
        description: `Successfully created ${geojson.features.length} polygon(s) from shapefile`
      });
    } catch (error) {
      console.error('Error processing shapefile:', error);
      toast({
        title: "Upload Error",
        description: "Failed to process shapefile. Please ensure it's a valid .zip or .gz file containing a shapefile.",
        variant: "destructive"
      });
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2[1] - point1[1]) * Math.PI / 180;
    const dLon = (point2[0] - point1[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
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
    },
    google_roads: {
      name: 'Google Roads',
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: '© Google'
    },
    google_satellite: {
      name: 'Google Satellite',
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '© Google'
    },
    google_hybrid: {
      name: 'Google Hybrid',
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '© Google'
    },
    google_terrain: {
      name: 'Google Terrain',
      url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      attribution: '© Google'
    }
  };
  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Initialize MapLibre map with Esri basemap
      map.current = new Map({
      container: mapContainer.current,
      style: {
        version: 8,
        //        glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf',

        sources: {
          'esri-source': {
            type: 'raster',
            tiles: [basemaps[currentBasemap as keyof typeof basemaps].url],
            tileSize: 256,
            attribution: basemaps[currentBasemap as keyof typeof basemaps].attribution
          }
        },
        //   glyphs : 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        //   glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        layers: [{
          id: 'esri-layer',
          type: 'raster',
          source: 'esri-source'
        }]
      },
      center: [-117.1611, 32.7157],
      // San Diego, CA
      zoom: 13,
      pitch: 0,
      bearing: 0
    });

      // Initialize geolocation control but don't add to map (will be triggered programmatically)
      geolocateControlRef.current = new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      });
      map.current.addControl(geolocateControlRef.current, 'top-left');
      
      // Hide the geolocation control from view
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

    // Set map loaded state and add vector layers when style is loaded
    map.current.on('load', () => {
      if (!map.current) return;
      console.log('Map loaded successfully');
      addVectorLayers();
      setMapLoaded(true);
    });
    
    // Add error handler
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

    // Cleanup
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

  // Update cursor based on drawing mode
  useEffect(() => {
    if (!map.current) return;
    
    if (drawingMode === 'polygon' || drawingMode === 'circle' || drawingMode === 'radius') {
      map.current.getCanvas().style.cursor = 'crosshair';
    } else if (measurementMode) {
      map.current.getCanvas().style.cursor = 'crosshair';
    } else {
      map.current.getCanvas().style.cursor = '';
    }
  }, [drawingMode, measurementMode]);

  // Separate useEffect for measurement and drawing click handlers
  useEffect(() => {
    if (!map.current) return;
    const handleMapClick = (e: any) => {
      const clickPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      // Handle measurement mode
      if (measurementMode) {
        handleMeasurementClick(clickPoint);
        return;
      }

      // Handle drawing modes
      if (drawingMode === 'polygon') {
        handlePolygonClick(clickPoint);
        return;
      }
      if (drawingMode === 'circle') {
        handleCircleClick(clickPoint);
        return;
      }
      if (drawingMode === 'radius') {
        handleRadiusClick(clickPoint);
        return;
      }

      // Handle NEWS mode coverage area selection
      if (selectMode && !measurementMode && !drawingMode && currentMode === 'news') {
        // Query cell tower coverage layer
        const coverageFeatures = map.current.queryRenderedFeatures(e.point, {
          layers: ['cell-tower-coverage-fill']
        });

        if (coverageFeatures && coverageFeatures.length > 0) {
          // Generate mock cell data based on clicked features
          const mockCellData = generateMockCellData(coverageFeatures);
          setCoveragePanelCells(mockCellData);
          return;
        }
        return;
      }

      // Only allow area selection when in select mode
      if (selectMode && !measurementMode && !drawingMode) {
        // Determine which layer to query based on activeLayer selection
        const layerToQuery = (() => {
          switch (activeLayer) {
            case 'Genasys Zones':
              return 'evacuation-zones-fill';
            case 'Public Parks':
              return 'public-parks-fill';
            case 'Water District CWA':
              return 'water-district-fill';
            case 'Custom Zone Areas':
              return 'evacuation-zones-fill'; // fallback
            default:
              return 'evacuation-zones-fill';
          }
        })();

        // Handle area selection for the active layer
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: [layerToQuery]
        });

        // Also check for drawn polygons and uploaded polygons
        const allFeatures = map.current.queryRenderedFeatures(e.point);
        const drawnPolygons = allFeatures.filter(f => f.source && (f.source.includes('drawn-polygon') || f.source.includes('uploaded-polygon') || f.layer && (f.layer.id.includes('drawn-polygon') || f.layer.id.includes('uploaded-polygon'))));

        // Handle feature selection from active layer
        if (features && features.length > 0) {
          const feature = features[0];
          console.log(`🎯 ${activeLayer} feature selected:`, feature.properties);

          // Use more specific feature identification to prevent false matches
          const featureIdentifier = feature.properties?.zone_id || feature.properties?.id || feature.properties?.zone_identifier || (feature.geometry && 'coordinates' in feature.geometry ? `${feature.geometry.coordinates?.[0]?.[0]?.[0]}-${feature.geometry.coordinates?.[0]?.[0]?.[1]}` : `feature-${Date.now()}`);

          // Check if already selected using more specific matching and current ref
          const currentSelectedFeatures = selectedFeaturesRef.current;
          const isAlreadySelected = currentSelectedFeatures.some(f => {
            const selectedIdentifier = f.properties?.zone_id || f.properties?.id || f.properties?.zone_identifier || (f.geometry && 'coordinates' in f.geometry ? `${f.geometry.coordinates?.[0]?.[0]?.[0]}-${f.geometry.coordinates?.[0]?.[0]?.[1]}` : `feature-${Date.now()}`);
            return selectedIdentifier === featureIdentifier;
          });
          
          if (isAlreadySelected) {
            // Deselect the zone
            setSelectedFeatures(prev => prev.filter(f => {
              const selectedIdentifier = f.properties?.zone_id || f.properties?.id || f.properties?.zone_identifier || (f.geometry && 'coordinates' in f.geometry ? `${f.geometry.coordinates?.[0]?.[0]?.[0]}-${f.geometry.coordinates?.[0]?.[0]?.[1]}` : `feature-${Date.now()}`);
              return selectedIdentifier !== featureIdentifier;
            }));

            // Remove highlight
            clearSingleFeatureHighlight(feature);

            // Close attribute panel when deselecting
            setAttributePanelFeature(null);

            // Calculate remaining total vertices using functional update
            setSelectedFeatures(prev => prev);
            return;
          }

          // Count vertices for this zone
          const vertexCount = countPolygonVertices(feature);
          console.log('📊 New zone vertex count:', vertexCount);

          // Use functional update to access current state
          setSelectedFeatures(prev => {
            const newSelectedFeatures = [...prev, feature];
            const currentCount = prev.length;
            
            // Calculate total vertices from all selected zones including this new one
            const totalVertices = newSelectedFeatures.reduce((sum, f) => sum + countPolygonVertices(f), 0);
            
            console.log('📊 Current selected count:', currentCount);
            console.log('📊 Total vertices:', totalVertices);

            // Add selection highlight layer with unique index
            updateSelectionHighlight(feature, currentCount);
            
            return newSelectedFeatures;
          });
          
          // Show attribute panel for the selected feature (use Object.assign to preserve prototype methods)
          setAttributePanelFeature(Object.assign(feature, { _layerName: activeLayer }));
          return;
        }

        // Handle drawn polygon selection
        if (drawnPolygons.length > 0) {
          const polygon = drawnPolygons[0];
          console.log('🎯 Drawn polygon selected:', polygon);

          // Check if already selected
          const polygonId = polygon.properties?.id || polygon.source || `polygon-${Date.now()}`;
          const currentSelectedPolygons = selectedPolygonsRef.current;
          const isAlreadySelected = currentSelectedPolygons.some(p => {
            const pId = p.properties?.id || p.source;
            const newId = polygon.properties?.id || polygon.source;
            return pId === newId;
          });

          if (isAlreadySelected) {
            return;
          }

          // Use functional update to access current state
          setSelectedPolygons(prev => {
            const newSelectedPolygons = [...prev, polygon];
            const currentCount = prev.length;

            // Count vertices for this polygon
            const vertexCount = countPolygonVertices(polygon);

            // Highlight the selected polygon
            updatePolygonHighlight(polygon, currentCount);

            // Calculate total vertices from all selected polygons including this new one
            const totalVertices = newSelectedPolygons.reduce((sum, p) => sum + countPolygonVertices(p), 0);
            
            return newSelectedPolygons;
          });
          return;
        }
      }
    };
    const handleMeasurementClick = (point: [number, number]) => {
      const newPoints = [...measurementPoints, point];
      setMeasurementPoints(newPoints);

      // Calculate cumulative distance
      let cumulativeDistance = 0;
      if (newPoints.length > 1) {
        for (let i = 1; i < newPoints.length; i++) {
          cumulativeDistance += calculateDistance(newPoints[i - 1], newPoints[i]);
        }
      }

      // Create marker with distance label
      if (map.current) {
        // Create simple circle marker without positioning issues
        const markerEl = document.createElement('div');
        markerEl.className = 'w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg';
        const newMarker = new Marker({
          element: markerEl,
          anchor: 'center'
        }).setLngLat(point).addTo(map.current);
        setMeasurementMarkers(prev => [...prev, newMarker]);

        // Create separate popup for distance label
        const distanceText = newPoints.length === 1 ? '0.00 ml' : `${(cumulativeDistance * 0.621371).toFixed(2)} ml`;
        const popup = new Popup({
          closeButton: false,
          closeOnClick: false,
          anchor: 'bottom',
          offset: [0, -10],
          className: 'measurement-popup'
        }).setLngLat(point).setHTML(`<div class="text-xs font-medium text-black" style="background: transparent;">${distanceText}</div>`).addTo(map.current);

        // Store popup reference for cleanup
        (newMarker as any)._popup = popup;

        // Draw line between points
        if (newPoints.length > 1) {
          drawMeasurementLine(newPoints);
        }
      }
    };

    // Drawing mode handlers
    const handlePolygonClick = (point: [number, number]) => {
      if (!isDrawing) {
        // Start new polygon
        setIsDrawing(true);
        setDrawingPoints([point]);
        addDrawingMarker(point);
        toast({
          title: "Polygon Drawing",
          description: "Click to add points. Double-click to finish."
        });
      } else {
        // Add point to polygon
        const newPoints = [...drawingPoints, point];
        setDrawingPoints(newPoints);
        addDrawingMarker(point);
        if (newPoints.length >= 2) {
          drawTemporaryPolygon(newPoints);
        }
      }
    };
    const handleCircleClick = (point: [number, number]) => {
      if (!tempCircleCenter) {
        // Set circle center
        setTempCircleCenter(point);
        addDrawingMarker(point);
        toast({
          title: "Circle Drawing",
          description: "Click another point to set the radius."
        });
      } else {
        // Calculate radius and draw circle
        const radius = calculateDistance(tempCircleCenter, point);
        drawCircle(tempCircleCenter, radius * 1000); // Convert km to meters
        finishDrawing();
      }
    };
    const handleRadiusClick = (point: [number, number]) => {
      // Prompt for radius distance
      const radiusStr = prompt("Enter radius in miles:");
      if (!radiusStr) return;
      const radiusMiles = parseFloat(radiusStr);
      if (isNaN(radiusMiles) || radiusMiles <= 0) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid positive number for radius.",
          variant: "destructive"
        });
        return;
      }

      // Convert miles to meters (1 mile = 1609.34 meters)
      const radiusMeters = radiusMiles * 1609.34;
      drawCircle(point, radiusMeters);
      finishDrawing();
    };

    // Function to draw measurement lines
    const drawMeasurementLine = (points: [number, number][]) => {
      if (!map.current || points.length < 2) return;

      // Remove existing measurement line
      if (map.current.getSource('measurement-line')) {
        map.current.removeLayer('measurement-line');
        map.current.removeSource('measurement-line');
      }

      // Add new line
      map.current.addSource('measurement-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: points
          }
        }
      });
      map.current.addLayer({
        id: 'measurement-line',
        type: 'line',
        source: 'measurement-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#000000',
          'line-width': 3
        }
      });
    };

    // Add click listener for measurement mode, drawing modes, or select mode
    if (measurementMode || drawingMode || selectMode) {
      map.current.on('click', handleMapClick);

      // Add double-click handler for polygon completion
      if (drawingMode === 'polygon') {
        // Disable default double-click zoom during polygon drawing
        map.current.doubleClickZoom.disable();
        
        const handleDoubleClick = (e: any) => {
          e.preventDefault();
          if (isDrawing && drawingPoints.length >= 3) {
            finishPolygon();
          }
        };
        map.current.on('dblclick', handleDoubleClick);
        return () => {
          if (map.current) {
            map.current.off('click', handleMapClick);
            map.current.off('dblclick', handleDoubleClick);
            // Re-enable double-click zoom when exiting polygon mode
            map.current.doubleClickZoom.enable();
          }
        };
      }
    } else {
      map.current.off('click', handleMapClick);
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [measurementMode, measurementPoints, drawingMode, drawingPoints, isDrawing, tempCircleCenter, selectMode, excludeMode, activeLayer, toast]);

  // Show exclude tooltip only on initial page load
  useEffect(() => {
    if (!hasShownExcludeTooltipRef.current && currentMode === 'evac') {
      hasShownExcludeTooltipRef.current = true;
      setShowExcludeTooltip(true);
    }
  }, []);

  // Hide tooltip when mode changes (not on initial mount)
  const prevModeRef = useRef(currentMode);
  useEffect(() => {
    if (prevModeRef.current !== currentMode) {
      prevModeRef.current = currentMode;
      setShowExcludeTooltip(false);
    }
  }, [currentMode]);

  // Handle exclude area functionality
  const handleExcludeArea = () => {
    if (selectedPolygons.length === 0) {
      toast({
        title: "Select a Polygon First",
        description: "Click on a drawn polygon to select it, then try 'Exclude Area' to create a hole.",
        variant: "destructive"
      });
      return;
    }

    // Clear drawing markers to start fresh
    drawingMarkers.forEach(marker => {
      marker.remove();
    });
    setDrawingMarkers([]);
    setExcludeMode(true);
    setDrawingMode('polygon');
    setSelectMode(false);
    toast({
      title: "Exclude Area Mode",
      description: "Now draw a polygon inside the selected area to create a hole. Double-click to finish."
    });
  };

  // Handle edit polygon functionality
  const handleEditPolygon = () => {
    if (selectedPolygons.length === 0) {
      toast({
        title: "No Polygon Selected",
        description: "Please select a polygon first to edit it.",
        variant: "destructive"
      });
      return;
    }
    if (selectedPolygons.length > 1) {
      toast({
        title: "Multiple Polygons Selected",
        description: "Please select only one polygon to edit.",
        variant: "destructive"
      });
      return;
    }
    const polygonToEdit = selectedPolygons[0];
    setEditMode(true);
    setEditingPolygonId(polygonToEdit.properties?.id || polygonToEdit.source);
    setSelectMode(false);

    // Extract coordinates from the polygon for editing
    if (polygonToEdit.geometry && polygonToEdit.geometry.coordinates) {
      const coords = polygonToEdit.geometry.coordinates[0];
      // Remove the last coordinate (which closes the polygon)
      const editableCoords = coords.slice(0, -1);
      setDrawingPoints(editableCoords);

      // Add markers for each vertex
      editableCoords.forEach(coord => {
        addDrawingMarker(coord);
      });
    }
    toast({
      title: "Edit Mode",
      description: "Click on vertices to move them, or double-click to finish editing."
    });
  };

  // Generate mock cell data for NEWS mode coverage panel
  const generateMockCellData = (features: any[]) => {
    // Get unique cell_ids from the clicked features
    const uniqueCellIds = new Set<string>();
    features.forEach(f => {
      if (f.properties?.cell_id) {
        uniqueCellIds.add(f.properties.cell_id);
      }
    });

    // Generate mock cell data - simulate overlapping cells
    const mockCells: any[] = [];
    const techs = ['3G', '4G', 'LTE', '5G'];
    const bands = ['700', '850', '999', '1900', '2100'];
    const zones = ['30', '31', '49', '50', '51'];
    const bsMcOptions = ['BS', 'MC'];
    const rfRegions = ['R1', 'R2', 'R3'];

    // For each unique cell_id, generate 3-8 overlapping cell entries
    uniqueCellIds.forEach(cellId => {
      const numCells = Math.floor(Math.random() * 6) + 3; // 3-8 cells
      for (let i = 0; i < numCells; i++) {
        const tech = techs[Math.floor(Math.random() * techs.length)];
        const band = bands[Math.floor(Math.random() * bands.length)];
        const zone = zones[Math.floor(Math.random() * zones.length)];
        
        // Generate cell ID format: 234-10-21090-XXXXX-XXXXX
        const cellIdPart1 = 21090;
        const cellIdPart2 = Math.floor(Math.random() * 50000) + 10000;
        const cellIdPart3 = Math.floor(Math.random() * 50000) + 10000;
        const fullCellId = `234-10-${cellIdPart1}-${cellIdPart2}-${cellIdPart3}`;

        mockCells.push({
          tech,
          band,
          cellId: fullCellId,
          name: '',
          zone,
          bsMc: bsMcOptions[Math.floor(Math.random() * bsMcOptions.length)],
          rfRegion: rfRegions[Math.floor(Math.random() * rfRegions.length)]
        });
      }
    });

    // If no cells found, still generate some mock data
    if (mockCells.length === 0) {
      for (let i = 0; i < 8; i++) {
        const tech = '3G';
        const band = '999';
        const cellIdPart1 = 21090;
        const cellIdPart2 = Math.floor(Math.random() * 50000) + 10000;
        const cellIdPart3 = Math.floor(Math.random() * 50000) + 10000;
        const fullCellId = `234-10-${cellIdPart1}-${cellIdPart2}-${cellIdPart3}`;

        mockCells.push({
          tech,
          band,
          cellId: fullCellId,
          name: '',
          zone: '30',
          bsMc: '',
          rfRegion: ''
        });
      }
    }

    return mockCells;
  };

  // Count vertices in a polygon
  const countPolygonVertices = (feature: any): number => {
    // Try to convert vector tile feature to GeoJSON if needed
    let geometry = feature.geometry;
    if (!geometry || !geometry.coordinates) {
      if (typeof feature.toGeoJSON === 'function') {
        try {
          const geoJSON = feature.toGeoJSON();
          geometry = geoJSON.geometry;
        } catch (e) {
          console.error('Error converting to GeoJSON:', e);
          return 0;
        }
      } else {
        return 0;
      }
    }

    if (!geometry || !geometry.coordinates) {
      return 0;
    }

    if (geometry.type === 'Polygon') {
      // Count vertices from outer ring and all holes
      return geometry.coordinates.reduce((sum: number, ring: any) => {
        return sum + Math.max(0, ring.length - 1);
      }, 0);
    }
    
    if (geometry.type === 'MultiPolygon') {
      // Sum vertices from all polygons (outer rings + holes) in the MultiPolygon
      return geometry.coordinates.reduce((sum: number, polygon: any) => {
        // Each polygon can have multiple rings (outer + holes)
        return sum + polygon.reduce((ringSum: number, ring: any) => {
          return ringSum + Math.max(0, ring.length - 1);
        }, 0);
      }, 0);
    }

    return 0;
  };

  // Update polygon highlight for drawn polygons
  const updatePolygonHighlight = (polygon: any, index: number = 0) => {
    if (!map.current || !polygon) return;

    // Create unique layer IDs based on polygon properties
    const polygonId = polygon.properties?.id || polygon.source || `polygon-${Date.now()}-${index}`;
    const layerId = `selected-polygon-${polygonId}`;
    const sourceId = `selected-polygon-source-${polygonId}`;

    // Remove existing selection layer with this ID if it exists
    if (map.current.getLayer(`${layerId}-highlight`)) {
      map.current.removeLayer(`${layerId}-highlight`);
    }
    if (map.current.getLayer(`${layerId}-outline`)) {
      map.current.removeLayer(`${layerId}-outline`);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Add source for selected polygon
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: polygon
    });

    // Add semi-transparent fill layer (90% transparent)
    map.current.addLayer({
      id: `${layerId}-highlight`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#1e3a8a',
        // Dark blue color
        'fill-opacity': 0.1 // 90% transparent (10% opacity)
      }
    });

    // Add thick dark grey outline
    map.current.addLayer({
      id: `${layerId}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#374151',
        // Dark grey color
        'line-width': 4,
        // Thick outline
        'line-opacity': 1
      }
    });
  };

  // Handle delete all functionality
  const handleDeleteAll = () => {
    if (!map.current) return;

    // Clear selection highlight
    if (map.current.getSource('selected-feature')) {
      if (map.current.getLayer('selected-feature-fill')) {
        map.current.removeLayer('selected-feature-fill');
      }
      if (map.current.getLayer('selected-feature-outline')) {
        map.current.removeLayer('selected-feature-outline');
      }
      map.current.removeSource('selected-feature');
    }

    // Clear all selection highlights
    clearSelection();

    // Remove all drawn polygons and circles
    const style = map.current.getStyle();
    if (style && style.layers) {
      const layersToRemove = style.layers.map(layer => layer.id).filter(id => id.includes('drawn-polygon') || id.includes('drawn-circle') || id.includes('uploaded-polygon') || id.includes('location-polygon'));
      layersToRemove.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
      });
    }

    // Remove all drawn sources
    if (style && style.sources) {
      const sourcesToRemove = Object.keys(style.sources).filter(id => id.includes('drawn-polygon') || id.includes('drawn-circle') || id.includes('uploaded-polygon') || id.includes('location-polygon'));
      sourcesToRemove.forEach(sourceId => {
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      });
    }

    // Remove all drawing markers (blue circles)
    drawingMarkers.forEach(marker => {
      marker.remove();
    });
    setDrawingMarkers([]);

    // Remove measurement markers and lines
    measurementMarkers.forEach(marker => {
      if ((marker as any)._popup) {
        (marker as any)._popup.remove();
      }
      marker.remove();
    });
    setMeasurementMarkers([]);
    if (map.current.getSource('measurement-line')) {
      map.current.removeLayer('measurement-line');
      map.current.removeSource('measurement-line');
    }

    // Reset all states
    setSelectedFeatures([]);
    setSelectedPolygons([]);
    setDrawingPoints([]);
    setCurrentPolygonHoles([]);
    setIsDrawing(false);
    setDrawingMode(null);
    setExcludeMode(false);
    setEditMode(false);
    setEditingPolygonId(null);
    setMeasurementPoints([]);
    setDistances([]);
    setTempCircleCenter(null);
    setSelectMode(true); // Return to select mode
    setDrawingHistory([]); // Clear history
    setAttributePanelFeature(null); // Close attribute panel

    toast({
      title: "All Cleared",
      description: "All drawn shapes, selections, and markers have been removed."
    });
  };

  // Handle undo last action
  const handleUndo = () => {
    if (!map.current) return;

    // If currently drawing a polygon, remove the last vertex
    if (drawingMode === 'polygon' && drawingPoints.length > 0) {
      // Remove the last point
      const newPoints = drawingPoints.slice(0, -1);
      setDrawingPoints(newPoints);

      // Remove the last drawing marker
      const lastMarker = drawingMarkers[drawingMarkers.length - 1];
      if (lastMarker) {
        lastMarker.remove();
        setDrawingMarkers(prev => prev.slice(0, -1));
      }

      // Redraw the temporary line on the map
      if (newPoints.length >= 2) {
        // Update the line by redrawing
        drawTemporaryPolygon(newPoints);
      } else {
        // If less than 2 points, remove the line
        if (map.current.getLayer('temp-polygon-fill')) {
          map.current.removeLayer('temp-polygon-fill');
        }
        if (map.current.getLayer('temp-polygon-outline')) {
          map.current.removeLayer('temp-polygon-outline');
        }
        if (map.current.getSource('temp-polygon')) {
          map.current.removeSource('temp-polygon');
        }
      }

      toast({
        title: "Vertex Removed",
        description: `${newPoints.length} vertices remaining.`
      });
      return;
    }

    // If in select mode and zones are selected, deselect the last zone
    if (selectMode && selectedFeatures.length > 0) {
      const lastFeature = selectedFeatures[selectedFeatures.length - 1];
      
      // Remove the highlight for this feature
      clearSingleFeatureHighlight(lastFeature);
      
      // Remove from selected features
      setSelectedFeatures(prev => prev.slice(0, -1));
      
      return;
    }

    // Otherwise, remove the last completed shape from history
    if (drawingHistory.length === 0 && selectedFeatures.length === 0) {
      toast({
        title: "Nothing to Undo",
        description: "No actions to undo.",
        variant: "destructive"
      });
      return;
    }

    if (drawingHistory.length === 0) {
      return;
    }

    // Get the last action
    const lastAction = drawingHistory[drawingHistory.length - 1];
    
    // Remove the polygon/circle from map
    if (map.current.getLayer(`${lastAction.id}-fill`)) {
      map.current.removeLayer(`${lastAction.id}-fill`);
    }
    if (map.current.getLayer(`${lastAction.id}-outline`)) {
      map.current.removeLayer(`${lastAction.id}-outline`);
    }
    if (map.current.getSource(lastAction.id)) {
      map.current.removeSource(lastAction.id);
    }

    // Remove from selected polygons
    setSelectedPolygons(prev => prev.filter(p => {
      const pId = p.properties?.id || p.source;
      return pId !== lastAction.id;
    }));

    // Remove highlight layers
    const sourceId = `selected-polygon-source-${lastAction.id}`;
    const layerId = `selected-polygon-${lastAction.id}`;
    if (map.current.getLayer(`${layerId}-highlight`)) {
      map.current.removeLayer(`${layerId}-highlight`);
    }
    if (map.current.getLayer(`${layerId}-outline`)) {
      map.current.removeLayer(`${layerId}-outline`);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Remove from history
    setDrawingHistory(prev => prev.slice(0, -1));

    // Clear any drawing markers that might still be visible
    drawingMarkers.forEach(marker => marker.remove());
    setDrawingMarkers([]);

    toast({
      title: "Undo Successful",
      description: `Removed last ${lastAction.type}.`
    });
  };

  // Drawing helper functions
  const addDrawingMarker = (point: [number, number]) => {
    if (!map.current) return;
    const markerEl = document.createElement('div');
    markerEl.className = 'w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg';
    const marker = new Marker({
      element: markerEl,
      anchor: 'center'
    }).setLngLat(point).addTo(map.current);

    // Store marker reference for cleanup
    setDrawingMarkers(prev => [...prev, marker]);
    return marker;
  };
  const drawTemporaryPolygon = (points: [number, number][]) => {
    if (!map.current) return;

    // Remove existing temporary polygon
    if (map.current.getSource('temp-polygon')) {
      map.current.removeLayer('temp-polygon-fill');
      map.current.removeLayer('temp-polygon-outline');
      map.current.removeSource('temp-polygon');
    }

    // Create temporary polygon (not closed yet)
    const coordinates = [...points];
    map.current.addSource('temp-polygon', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });
    map.current.addLayer({
      id: 'temp-polygon-outline',
      type: 'line',
      source: 'temp-polygon',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-dasharray': [5, 5]
      }
    });
  };
  const finishPolygon = () => {
    if (!map.current || drawingPoints.length < 3) return;

    // Remove temporary polygon
    if (map.current.getSource('temp-polygon')) {
      if (map.current.getLayer('temp-polygon-fill')) {
        map.current.removeLayer('temp-polygon-fill');
      }
      if (map.current.getLayer('temp-polygon-outline')) {
        map.current.removeLayer('temp-polygon-outline');
      }
      map.current.removeSource('temp-polygon');
    }

    // Create final polygon coordinates (closed)
    const coordinates = [...drawingPoints, drawingPoints[0]]; // Close the polygon

    // If in exclude mode, add as a hole to the selected polygon
    if (excludeMode && selectedPolygons.length > 0) {
      const targetPolygon = selectedPolygons[0];
      const targetSourceId = targetPolygon.properties?.id || targetPolygon.source;
      if (map.current.getSource(targetSourceId)) {
        // Get the existing polygon data
        const existingSource = map.current.getSource(targetSourceId) as any;
        if (existingSource._data) {
          const existingData = existingSource._data;

          // Add the hole to the existing polygon
          if (existingData.geometry && existingData.geometry.coordinates) {
            const newCoordinates = [...existingData.geometry.coordinates, coordinates];

            // Update the source with the new polygon that includes the hole
            const updatedPolygon = {
              ...existingData,
              geometry: {
                ...existingData.geometry,
                coordinates: newCoordinates
              }
            };

            // Update the source
            (map.current.getSource(targetSourceId) as any).setData(updatedPolygon);

            // Update selectedPolygons state with the new geometry including holes
            setSelectedPolygons(prev => {
              return prev.map(p => {
                const pId = p.properties?.id || p.source;
                if (pId === targetSourceId) {
                  return updatedPolygon;
                }
                return p;
              });
            });

            // Calculate and display updated vertex count
            const holeVertices = drawingPoints.length;
            const totalVertices = countPolygonVertices(updatedPolygon);
            
            // Stay in exclude mode for more holes, just reset drawing state
            setDrawingPoints([]);
            setIsDrawing(false);
            toast({
              title: "Hole Created",
              description: `Hole with ${holeVertices} vertices added. Polygon now has ${totalVertices} total vertices.`
            });
            return;
          }
        }
      }

      // Fallback: couldn't modify existing polygon
      toast({
        title: "Error",
        description: "Could not add hole to selected polygon.",
        variant: "destructive"
      });
      return;
    }

    // If in edit mode, update the existing polygon
    if (editMode && editingPolygonId) {
      if (map.current.getSource(editingPolygonId)) {
        const updatedPolygon = {
          type: 'Feature',
          properties: {
            id: editingPolygonId,
            type: 'drawn-polygon'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        };

        // Update the source
        (map.current.getSource(editingPolygonId) as any).setData(updatedPolygon);
        setDrawingPoints([]);
        setIsDrawing(false);
        setEditMode(false);
        setEditingPolygonId(null);
        setDrawingMode(null);
        setSelectMode(true);
        toast({
          title: "Polygon Updated",
          description: `Polygon with ${drawingPoints.length} vertices updated.`
        });
        return;
      }
    }

    // Regular polygon creation
    const polygonCoordinates = [coordinates];
    const polygonId = `drawn-polygon-${Date.now()}`;
    const newPolygon = {
      type: 'Feature' as const,
      properties: {
        id: polygonId,
        type: 'drawn-polygon'
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: polygonCoordinates
      }
    };
    map.current.addSource(polygonId, {
      type: 'geojson',
      data: newPolygon
    });
    map.current.addLayer({
      id: `${polygonId}-fill`,
      type: 'fill',
      source: polygonId,
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.2
      }
    });
    map.current.addLayer({
      id: `${polygonId}-outline`,
      type: 'line',
      source: polygonId,
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2
      }
    });

    // Automatically select the newly drawn polygon and add to existing selections
    setSelectedPolygons(prev => {
      const newSelections = [...prev, newPolygon];
      const currentCount = prev.length;
      
      // Highlight the newly drawn polygon with correct index
      updatePolygonHighlight(newPolygon, currentCount);
      
      // Calculate total vertices
      const totalVertices = newSelections.reduce((sum, p) => sum + countPolygonVertices(p), 0);
      
      return newSelections;
    });

    // Add to drawing history
    setDrawingHistory(prev => [...prev, { id: polygonId, type: 'polygon' }]);

    // Stay in drawing mode, just reset drawing state for next polygon
    setDrawingPoints([]);
    setIsDrawing(false);
    setTempCircleCenter(null);
    setExcludeMode(false);
    setEditMode(false);
    setEditingPolygonId(null);
    setCurrentPolygonHoles([]);
  };
  const drawCircle = (center: [number, number], radiusMeters: number) => {
    if (!map.current) return;

    // Create circle coordinates using turf-like calculation
    const coordinates: [number, number][] = [];
    const points = 64; // Number of points to create smooth circle

    for (let i = 0; i < points; i++) {
      const angle = i * 360 / points;
      const angleRad = angle * Math.PI / 180;

      // Calculate offset in degrees (approximate, good enough for visualization)
      const latOffset = radiusMeters / 111320 * Math.cos(angleRad);
      const lonOffset = radiusMeters / 111320 * Math.sin(angleRad) / Math.cos(center[1] * Math.PI / 180);
      coordinates.push([center[0] + lonOffset, center[1] + latOffset]);
    }

    // Close the circle
    coordinates.push(coordinates[0]);
    const circleId = `drawn-circle-${Date.now()}`;
    
    const circleFeature = {
      type: 'Feature' as const,
      properties: {
        id: circleId,
        type: 'drawn-circle'
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coordinates]
      }
    };
    
    map.current.addSource(circleId, {
      type: 'geojson',
      data: circleFeature
    });
    map.current.addLayer({
      id: `${circleId}-fill`,
      type: 'fill',
      source: circleId,
      paint: {
        'fill-color': '#10b981',
        'fill-opacity': 0.2
      }
    });
    map.current.addLayer({
      id: `${circleId}-outline`,
      type: 'line',
      source: circleId,
      paint: {
        'line-color': '#10b981',
        'line-width': 2
      }
    });
    
    // Automatically select the newly drawn circle and add to existing selections
    setSelectedPolygons(prev => {
      const newSelections = [...prev, circleFeature];
      const currentCount = prev.length;
      
      // Highlight the newly drawn circle with correct index
      updatePolygonHighlight(circleFeature, currentCount);
      
      // Calculate total vertices
      const totalVertices = newSelections.reduce((sum, p) => sum + countPolygonVertices(p), 0);
      
      return newSelections;
    });

    // Add to drawing history
    setDrawingHistory(prev => [...prev, { id: circleId, type: 'circle' }]);
  };
  const finishDrawing = () => {
    setDrawingMode(null);
    setDrawingPoints([]);
    setIsDrawing(false);
    setTempCircleCenter(null);
    setExcludeMode(false);
    setEditMode(false);
    setEditingPolygonId(null);
    setCurrentPolygonHoles([]);
  };
  const cancelDrawing = () => {
    if (!map.current) return;

    // Remove temporary polygon if exists
    if (map.current.getSource('temp-polygon')) {
      map.current.removeLayer('temp-polygon-fill');
      map.current.removeLayer('temp-polygon-outline');
      map.current.removeSource('temp-polygon');
    }
    finishDrawing();
    toast({
      title: "Drawing Cancelled",
      description: "Drawing mode has been cancelled."
    });
  };

  // Add vector layers using Supabase Edge Function proxy
  const addVectorLayers = async () => {
    if (!map.current) return;
    setLayerStatus('loading');
    try {
      console.log('🚀 Adding vector evacuation zones layer via Supabase proxy...');

      // Use Supabase Edge Function proxy for WMTS tiles
      const proxyTileUrl = 'https://lwkcovcbhdotptzphevc.supabase.co/functions/v1/wmts-proxy/{z}/{x}/{y}';
      const labelsProxyTileUrl = 'https://lwkcovcbhdotptzphevc.supabase.co/functions/v1/wmts-labels-proxy/{z}/{x}/{y}';

      // Add vector source for zones
      map.current.addSource('vector-evacuation', {
        type: 'vector',
        tiles: [proxyTileUrl],
        minzoom: 0,
        maxzoom: 18
      });

      // Add vector source for labels with debugging
      console.log('🏷️ Adding vector labels source with URL:', labelsProxyTileUrl);
      map.current.addSource('vector-labels', {
        type: 'vector',
        tiles: [labelsProxyTileUrl],
        minzoom: 0,
        maxzoom: 18
      });

      // Add debugging for source addition
      map.current.on('sourcedata', e => {
        if ((e as any).sourceId === 'vector-labels') {
          console.log('🏷️ Labels source event:', (e as any).dataType, 'isSourceLoaded:', (e as any).isSourceLoaded);
        }
      });

      // Add debugging for data loading events
      map.current.on('data', e => {
        if ((e as any).sourceId === 'vector-labels') {
          console.log('🏷️ Labels data event:', e.type, e);
        }
      });

      // Add fill layer for evacuation zones
      map.current.addLayer({
        id: 'evacuation-zones-fill',
        type: 'fill',
        source: 'vector-evacuation',
        'source-layer': 'evacuation_zone_details',
        // This may need adjustment based on actual layer name
        paint: {
          'fill-color': ['case', ['has', 'zone_type'], ['match', ['get', 'zone_type'], 'immediate', '#ff4444', 'warning', '#ff8800', 'watch', '#ffdd00', '#6366f1' // default blue
          ], '#6366f1' // fallback blue
          ],
          'fill-opacity': ['case', ['has', 'zone_type'], ['match', ['get', 'zone_type'], 'immediate', 0.3, 'warning', 0.3, 'watch', 0.3, 0 // default blue zones invisible
          ], 0 // zones without zone_type invisible
          ]
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
          'line-color': '#000000',
          'line-width': 1,
          'line-opacity': 0.8
        },
        layout: {
          visibility: 'visible'
        }
      });

      // Add visual debugging layer first to verify geometry is loading
      console.log('🏷️ Adding visual debugging fill layer for labels...');
      map.current.addLayer({
        id: 'labels-debug-fill',
        type: 'fill',
        source: 'vector-labels',
        'source-layer': 'evacuation_zone_ids',
        paint: {
          'fill-color': '#ff0000',
          'fill-opacity': 0.3
        },
        layout: {
          visibility: 'visible'
        }
      });

      // Add labels layer with system fonts (no external font server needed)
      console.log('🏷️ Adding labels layer with system fonts...');
      map.current.addLayer({
        id: 'evacuation-zone-labels',
        type: 'symbol',
        source: 'vector-labels',
        'source-layer': 'evacuation_zone_ids',
        minzoom: 0,
        layout: {
          // No text-font needed - MapLibre will use browser default
          'text-field': ['get', 'zone_id'],
          'text-offset': [0, 0],
          'text-anchor': 'center',
          'text-size': 16,
          // Fixed size for now
          'text-allow-overlap': true,
          // Allow overlap for debugging
          'text-ignore-placement': true,
          // Ignore placement for debugging
          //  'text-font': ['Open Sans'],
          visibility: 'visible'
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 3,
          'text-opacity': 1
        }
      });

      // Force immediate tile loading for labels source
      console.log('🏷️ Labels layer added, tiles should load from:', labelsProxyTileUrl);

      // Remove minzoom restriction to force immediate loading
      map.current.setLayoutProperty('evacuation-zone-labels', 'visibility', 'visible');

      // Query source to verify labels are loading (without changing zoom)
      setTimeout(() => {
        if (map.current) {
          try {
            console.log('🏷️ Attempting to query labels source features...');
            const features = map.current.querySourceFeatures('vector-labels');
            console.log('🏷️ Queried labels features result:', features);
          } catch (e) {
            console.log('🏷️ Error querying labels features:', e);
          }
        }
      }, 1000);

      // Enhanced debugging for labels layer
      map.current.on('sourcedata', e => {
        if (e.sourceId === 'vector-labels' && e.isSourceLoaded) {
          console.log('🏷️ Labels source loaded successfully');

          // Query features to see what data is available
          setTimeout(() => {
            if (map.current) {
              try {
                // Try different source layer names
                const possibleSourceLayers = ['evacuation_zone_ids', 'zones', 'labels', 'default'];
                for (const sourceLayer of possibleSourceLayers) {
                  const features = map.current.querySourceFeatures('vector-labels', {
                    sourceLayer: sourceLayer
                  });
                  console.log(`🏷️ Features in '${sourceLayer}':`, features.length);
                  if (features.length > 0) {
                    console.log(`🏷️ First feature in '${sourceLayer}':`, features[0]);
                    console.log(`🏷️ Properties:`, features[0].properties);
                    console.log(`🏷️ Geometry type:`, features[0].geometry?.type);
                    console.log(`🏷️ All property keys:`, Object.keys(features[0].properties || {}));

                    // Update the source-layer if we found features in a different layer
                    if (sourceLayer !== 'evacuation_zone_ids') {
                      console.log(`🏷️ Updating labels layer to use source-layer: ${sourceLayer}`);
                      map.current.setLayoutProperty('evacuation-zone-labels', 'source-layer', sourceLayer);
                      map.current.setLayoutProperty('labels-debug-fill', 'source-layer', sourceLayer);
                    }
                    break;
                  }
                }

                // Also try querying without specifying source layer
                const allFeatures = map.current.querySourceFeatures('vector-labels');
                console.log('🏷️ All features (no source layer specified):', allFeatures.length);
                if (allFeatures.length > 0) {
                  console.log('🏷️ First feature (no source layer):', allFeatures[0]);
                }
              } catch (e) {
                console.log('🏷️ Error during feature query:', e);
              }
            }
          }, 2000);
        }
      });

      // Add debugging for tile loading
      map.current.on('dataloading', e => {
        if ((e as any).sourceId === 'vector-labels') {
          console.log('🏷️ Labels tiles loading...', e);
        }
      });

      // Add debugging for render events
      map.current.on('render', () => {
        // Only log once every few seconds to avoid spam
        if (Date.now() % 5000 < 100) {
          const featuresInView = map.current?.queryRenderedFeatures(undefined, {
            layers: ['evacuation-zone-labels', 'labels-debug-fill']
          });
          if (featuresInView && featuresInView.length > 0) {
            console.log('🏷️ Labels rendered in view:', featuresInView.length);
          }
        }
      });

      // Add hover effects for query functionality
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
      console.log('✅ Vector evacuation zones added successfully via Supabase proxy');
      
      // Add ArcGIS Public Parks Feature Layer
      try {
        console.log('🌳 Adding Public Parks feature layer...');
        const parksResponse = await fetch(
          'https://services2.arcgis.com/9Dr0YQ6qqPzosKvr/arcgis/rest/services/Public_Parks/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
        );
        const parksData = await parksResponse.json();
        console.log('🌳 Parks data loaded:', parksData.features?.length, 'features');
        
        map.current.addSource('public-parks', {
          type: 'geojson',
          data: parksData
        });
        
        // Add fill layer for parks
        map.current.addLayer({
          id: 'public-parks-fill',
          type: 'fill',
          source: 'public-parks',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'fill-color': '#228B22',
            'fill-opacity': 0.4
          }
        });
        
        // Add outline layer for parks
        map.current.addLayer({
          id: 'public-parks-outline',
          type: 'line',
          source: 'public-parks',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'line-color': '#006400',
            'line-width': 2
          }
        });
        
        console.log('✅ Public Parks layer added successfully');
      } catch (parksError) {
        console.error('❌ Error adding Public Parks layer:', parksError);
      }
      
      // Add ArcGIS Water District CWA Feature Layer
      try {
        console.log('💧 Adding Water District CWA feature layer...');
        const waterDistrictResponse = await fetch(
          'https://services2.arcgis.com/9Dr0YQ6qqPzosKvr/arcgis/rest/services/Water_District_CWA/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson'
        );
        const waterDistrictData = await waterDistrictResponse.json();
        console.log('💧 Water District data loaded:', waterDistrictData.features?.length, 'features');
        
        map.current.addSource('water-district', {
          type: 'geojson',
          data: waterDistrictData
        });
        
        // Add fill layer for water districts
        map.current.addLayer({
          id: 'water-district-fill',
          type: 'fill',
          source: 'water-district',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'fill-color': '#1E90FF',
            'fill-opacity': 0.4
          }
        });
        
        // Add outline layer for water districts
        map.current.addLayer({
          id: 'water-district-outline',
          type: 'line',
          source: 'water-district',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'line-color': '#0000CD',
            'line-width': 2
          }
        });
        
        console.log('✅ Water District CWA layer added successfully');
      } catch (waterDistrictError) {
        console.error('❌ Error adding Water District CWA layer:', waterDistrictError);
      }
      
      // Add mock Cell Tower Coverage layer for NEWS mode
      try {
        console.log('📡 Adding Cell Tower Coverage layer...');
        
        // RF propagation-style coverage data with irregular shapes and signal strength zones
        const cellTowerData = {
          type: 'FeatureCollection',
          features: [
            // Tower 1 - Strong coverage zone (inner)
            {
              type: 'Feature',
              properties: { cell_id: 'SD-001', tech: 'LTE', band: '700', signal_strength: -65, rsrp_class: 'excellent' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.162, 32.732], [-117.158, 32.735], [-117.154, 32.734], [-117.152, 32.731],
                  [-117.153, 32.727], [-117.157, 32.725], [-117.161, 32.727], [-117.163, 32.730], [-117.162, 32.732]
                ]]
              }
            },
            // Tower 1 - Good coverage zone (middle)
            {
              type: 'Feature',
              properties: { cell_id: 'SD-001', tech: 'LTE', band: '700', signal_strength: -85, rsrp_class: 'good' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.168, 32.738], [-117.160, 32.743], [-117.150, 32.742], [-117.144, 32.736],
                  [-117.143, 32.728], [-117.146, 32.720], [-117.154, 32.716], [-117.164, 32.718],
                  [-117.170, 32.724], [-117.171, 32.732], [-117.168, 32.738]
                ]]
              }
            },
            // Tower 1 - Fair coverage zone (outer)
            {
              type: 'Feature',
              properties: { cell_id: 'SD-001', tech: 'LTE', band: '700', signal_strength: -100, rsrp_class: 'fair' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.178, 32.748], [-117.165, 32.755], [-117.148, 32.753], [-117.136, 32.744],
                  [-117.132, 32.730], [-117.135, 32.715], [-117.148, 32.705], [-117.165, 32.707],
                  [-117.178, 32.716], [-117.183, 32.730], [-117.180, 32.744], [-117.178, 32.748]
                ]]
              }
            },
            // Tower 2 - Strong coverage zone
            {
              type: 'Feature',
              properties: { cell_id: 'SD-002', tech: '5G', band: '850', signal_strength: -60, rsrp_class: 'excellent' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.122, 32.728], [-117.118, 32.732], [-117.113, 32.730], [-117.112, 32.725],
                  [-117.115, 32.721], [-117.120, 32.722], [-117.123, 32.725], [-117.122, 32.728]
                ]]
              }
            },
            // Tower 2 - Good coverage zone
            {
              type: 'Feature',
              properties: { cell_id: 'SD-002', tech: '5G', band: '850', signal_strength: -80, rsrp_class: 'good' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.130, 32.738], [-117.120, 32.742], [-117.108, 32.740], [-117.102, 32.732],
                  [-117.104, 32.720], [-117.112, 32.714], [-117.124, 32.715], [-117.132, 32.722],
                  [-117.134, 32.732], [-117.130, 32.738]
                ]]
              }
            },
            // Tower 2 - Fair coverage zone
            {
              type: 'Feature',
              properties: { cell_id: 'SD-002', tech: '5G', band: '850', signal_strength: -95, rsrp_class: 'fair' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.140, 32.750], [-117.125, 32.756], [-117.105, 32.752], [-117.094, 32.740],
                  [-117.092, 32.724], [-117.098, 32.708], [-117.115, 32.700], [-117.133, 32.704],
                  [-117.145, 32.716], [-117.148, 32.734], [-117.144, 32.746], [-117.140, 32.750]
                ]]
              }
            },
            // Tower 3 - Strong coverage zone
            {
              type: 'Feature',
              properties: { cell_id: 'SD-003', tech: 'LTE', band: '1900', signal_strength: -62, rsrp_class: 'excellent' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.175, 32.708], [-117.170, 32.712], [-117.165, 32.710], [-117.164, 32.705],
                  [-117.168, 32.701], [-117.174, 32.703], [-117.176, 32.706], [-117.175, 32.708]
                ]]
              }
            },
            // Tower 3 - Good coverage zone
            {
              type: 'Feature',
              properties: { cell_id: 'SD-003', tech: 'LTE', band: '1900', signal_strength: -82, rsrp_class: 'good' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.184, 32.716], [-117.174, 32.722], [-117.162, 32.718], [-117.158, 32.708],
                  [-117.162, 32.696], [-117.174, 32.692], [-117.184, 32.698], [-117.188, 32.708], [-117.184, 32.716]
                ]]
              }
            },
            // Tower 3 - Fair coverage zone
            {
              type: 'Feature',
              properties: { cell_id: 'SD-003', tech: 'LTE', band: '1900', signal_strength: -98, rsrp_class: 'fair' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.195, 32.725], [-117.180, 32.734], [-117.162, 32.730], [-117.152, 32.718],
                  [-117.150, 32.702], [-117.156, 32.688], [-117.172, 32.680], [-117.190, 32.684],
                  [-117.200, 32.698], [-117.202, 32.714], [-117.195, 32.725]
                ]]
              }
            },
            // Tower 4 - Weak/Poor coverage only (edge of network)
            {
              type: 'Feature',
              properties: { cell_id: 'SD-004', tech: '5G', band: '700', signal_strength: -105, rsrp_class: 'poor' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-117.205, 32.745], [-117.195, 32.752], [-117.182, 32.750], [-117.178, 32.742],
                  [-117.180, 32.732], [-117.190, 32.726], [-117.202, 32.728], [-117.210, 32.736], [-117.205, 32.745]
                ]]
              }
            }
          ]
        };
        
        // Cell tower point locations
        const cellTowerPoints = {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { cell_id: 'SD-001', tech: 'LTE', band: '700', azimuth: 120 }, geometry: { type: 'Point', coordinates: [-117.157, 32.729] } },
            { type: 'Feature', properties: { cell_id: 'SD-002', tech: '5G', band: '850', azimuth: 45 }, geometry: { type: 'Point', coordinates: [-117.117, 32.726] } },
            { type: 'Feature', properties: { cell_id: 'SD-003', tech: 'LTE', band: '1900', azimuth: 270 }, geometry: { type: 'Point', coordinates: [-117.170, 32.705] } },
            { type: 'Feature', properties: { cell_id: 'SD-004', tech: '5G', band: '700', azimuth: 0 }, geometry: { type: 'Point', coordinates: [-117.192, 32.738] } }
          ]
        };
        
        map.current.addSource('cell-tower-coverage', {
          type: 'geojson',
          data: cellTowerData as any
        });
        
        map.current.addSource('cell-tower-points-source', {
          type: 'geojson',
          data: cellTowerPoints as any
        });
        
        // Add fill layer for coverage areas - RF propagation style colors
        map.current.addLayer({
          id: 'cell-tower-coverage-fill',
          type: 'fill',
          source: 'cell-tower-coverage',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'fill-color': ['match', ['get', 'rsrp_class'],
              'excellent', '#00ff00',  // Bright green - excellent signal
              'good', '#7fff00',       // Yellow-green - good signal
              'fair', '#ffff00',       // Yellow - fair signal
              'poor', '#ff6600',       // Orange - poor signal
              '#ff0000'                // Red - no/weak signal
            ],
            'fill-opacity': ['match', ['get', 'rsrp_class'],
              'excellent', 0.6,
              'good', 0.45,
              'fair', 0.35,
              'poor', 0.25,
              0.2
            ]
          }
        });
        
        // Add outline layer for coverage areas - subtle dashed lines
        map.current.addLayer({
          id: 'cell-tower-coverage-outline',
          type: 'line',
          source: 'cell-tower-coverage',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'line-color': ['match', ['get', 'rsrp_class'],
              'excellent', '#008800',
              'good', '#558800',
              'fair', '#888800',
              'poor', '#885500',
              '#880000'
            ],
            'line-width': 1,
            'line-opacity': 0.6,
            'line-dasharray': [2, 2]
          }
        });
        
        // Add cell tower point markers - tower icons
        map.current.addLayer({
          id: 'cell-tower-points',
          type: 'circle',
          source: 'cell-tower-points-source',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'circle-radius': 10,
            'circle-color': ['match', ['get', 'tech'],
              'LTE', '#2563eb',
              '5G', '#7c3aed',
              '#6b7280'
            ],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        });
        
        // Add a second layer for tower symbol effect
        map.current.addLayer({
          id: 'cell-tower-points-inner',
          type: 'circle',
          source: 'cell-tower-points-source',
          layout: {
            'visibility': 'none'
          },
          paint: {
            'circle-radius': 4,
            'circle-color': '#ffffff'
          }
        });
        
        console.log('✅ Cell Tower Coverage layer added successfully');
      } catch (cellTowerError) {
        console.error('❌ Error adding Cell Tower Coverage layer:', cellTowerError);
      }
      
      setLayerStatus('success');
      setVectorLayerVisible(true);
    } catch (error) {
      console.error('❌ Error adding vector layers:', error);
      setLayerStatus('error');
      toast({
        variant: "destructive",
        title: "Layer Load Error",
        description: "Could not load evacuation zones. Please try again."
      });
    }
  };

  // Update selection highlight with symbology matching the user's image
  const updateSelectionHighlight = (feature: any, index: number = 0) => {
    if (!map.current || !feature) return;

    // Create unique layer IDs based on feature properties, not just index
    // Support multiple layer types: Genasys Zones (id, zone_id), Public Parks (FID), Water District (OBJECTID)
    const featureId = feature.properties?.id || feature.properties?.zone_id || feature.properties?.FID || feature.properties?.OBJECTID || `feature-${Date.now()}-${index}`;
    const layerId = `selected-area-${featureId}`;
    const sourceId = `selected-source-${featureId}`;

    // Remove existing selection layer with this ID if it exists
    if (map.current.getLayer(`${layerId}-highlight`)) {
      map.current.removeLayer(`${layerId}-highlight`);
    }
    if (map.current.getLayer(`${layerId}-outline`)) {
      map.current.removeLayer(`${layerId}-outline`);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Add source for selected feature
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: feature
    });

    // Add semi-transparent fill layer (90% transparent)
    map.current.addLayer({
      id: `${layerId}-highlight`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#1e3a8a',
        // Dark blue color
        'fill-opacity': 0.1 // 90% transparent (10% opacity)
      }
    });

    // Add thick dark grey outline
    map.current.addLayer({
      id: `${layerId}-outline`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#374151',
        // Dark grey color
        'line-width': 4,
        // Thick outline as shown in image
        'line-opacity': 1
      }
    });
  };

  // Clear single feature highlight (for deselection)
  const clearSingleFeatureHighlight = (feature: any) => {
    if (!map.current) return;
    // Support multiple layer types: Genasys Zones (id, zone_id), Public Parks (FID), Water District (OBJECTID)
    const featureId = feature.properties?.id || feature.properties?.zone_id || feature.properties?.FID || feature.properties?.OBJECTID || `feature-unknown`;
    const layerId = `selected-area-${featureId}`;
    const sourceId = `selected-source-${featureId}`;
    if (map.current?.getLayer(`${layerId}-highlight`)) {
      map.current.removeLayer(`${layerId}-highlight`);
    }
    if (map.current?.getLayer(`${layerId}-outline`)) {
      map.current.removeLayer(`${layerId}-outline`);
    }
    if (map.current?.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }
  };

  // Clear area selection
  const clearSelection = () => {
    if (!map.current) return;

    // Remove all selection layers and sources for regular features using unique IDs
    selectedFeatures.forEach(feature => {
      clearSingleFeatureHighlight(feature);
    });

    // Remove all polygon selection layers and sources
    selectedPolygons.forEach((polygon, index) => {
      const polygonId = polygon.properties?.id || polygon.source || `polygon-${index}`;
      const layerId = `selected-polygon-${polygonId}`;
      const sourceId = `selected-polygon-source-${polygonId}`;
      if (map.current?.getLayer(`${layerId}-highlight`)) {
        map.current.removeLayer(`${layerId}-highlight`);
      }
      if (map.current?.getLayer(`${layerId}-outline`)) {
        map.current.removeLayer(`${layerId}-outline`);
      }
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });
    setSelectedFeatures([]);
    setSelectedPolygons([]);
  };

  // Clear all drawn shapes
  const clearDrawnShapes = () => {
    if (!map.current) return;

    // Find and remove all drawn polygons and circles
    const layers = map.current.getStyle().layers || [];
    layers.forEach(layer => {
      if (layer.id.includes('drawn-polygon') || layer.id.includes('drawn-circle')) {
        try {
          map.current?.removeLayer(layer.id);
        } catch (e) {
          // Layer might not exist
        }
      }
    });

    // Remove sources
    const sources = map.current.getStyle().sources || {};
    Object.keys(sources).forEach(sourceId => {
      if (sourceId.includes('drawn-polygon') || sourceId.includes('drawn-circle')) {
        try {
          map.current?.removeSource(sourceId);
        } catch (e) {
          // Source might not exist
        }
      }
    });
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
    logActivity('basemap_changed', { basemap: basemapKey, name: basemap.name });
  };
  const toggleVectorLayer = () => {
    if (!map.current || !mapLoaded) return;
    const newVisibility = !vectorLayerVisible;
    const visibility = newVisibility ? 'visible' : 'none';

    // Toggle zones, outline, and labels layers
    map.current.setLayoutProperty('evacuation-zones-fill', 'visibility', visibility);
    map.current.setLayoutProperty('evacuation-zones-outline', 'visibility', visibility);
    map.current.setLayoutProperty('evacuation-zone-labels', 'visibility', visibility);
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
      if (map.current.getLayer('evacuation-zone-labels')) {
        map.current.removeLayer('evacuation-zone-labels');
      }
      if (map.current.getSource('vector-evacuation')) {
        map.current.removeSource('vector-evacuation');
      }
      if (map.current.getSource('vector-labels')) {
        map.current.removeSource('vector-labels');
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
      center: [-117.1611, 32.7157],
      zoom: 13,
      bearing: 0,
      pitch: 0
    });
  };

  // Toggle measurement mode
  const toggleMeasurement = () => {
    setMeasurementMode(!measurementMode);
    if (measurementMode) {
      // Clear measurements when exiting measurement mode
      setMeasurementPoints([]);
      setDistances([]);
      // Clear markers and popups from map
      measurementMarkers.forEach(marker => {
        // Remove popup if it exists
        if ((marker as any)._popup) {
          (marker as any)._popup.remove();
        }
        marker.remove();
      });
      setMeasurementMarkers([]);
      // Remove measurement line
      if (map.current && map.current.getSource('measurement-line')) {
        map.current.removeLayer('measurement-line');
        map.current.removeSource('measurement-line');
      }
    }
    toast({
      title: measurementMode ? "Measurement Stopped" : "Measurement Started",
      description: measurementMode ? "Click to stop measuring" : "Click on the map to start measuring distances"
    });
  };

  // Trigger geolocation
  const triggerGeolocation = () => {
    if (geolocateControlRef.current && map.current) {
      try {
        geolocateControlRef.current.trigger();
      } catch (error) {
        console.error('Error triggering geolocation:', error);
        toast({
          title: "Geolocation Error",
          description: "Unable to access your location. Please check browser permissions.",
          variant: "destructive"
        });
      }
    }
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
          description: `Navigated to ${result.display_name}`
        });
        setSearchOpen(false); // Auto-close search bar
      } else {
        toast({
          variant: "destructive",
          title: "Location Not Found",
          description: "Could not find the specified location."
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "An error occurred while searching."
      });
    }
  };

  // Toggle zone layer visibility
  const toggleZoneLayerVisibility = (visible: boolean) => {
    if (!map.current) return;
    
    const layersToToggle = ['evacuation-zones-fill', 'evacuation-zones-outline', 'evacuation-labels'];
    
    layersToToggle.forEach(layerId => {
      const layer = map.current.getLayer(layerId);
      if (layer) {
        map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });
    
    setZoneLayerVisible(visible);
    
    toast({
      title: visible ? "Zones Visible" : "Zones Hidden",
      description: `Genasys zones are now ${visible ? 'visible' : 'hidden'} on the map`
    });
  };

  // Toggle parks layer visibility
  const toggleParksLayerVisibility = (visible: boolean) => {
    if (!map.current) return;
    
    const layersToToggle = ['public-parks-fill', 'public-parks-outline'];
    
    layersToToggle.forEach(layerId => {
      const layer = map.current.getLayer(layerId);
      if (layer) {
        map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });
    
    setParksLayerVisible(visible);
  };

  // Toggle water district layer visibility
  const toggleWaterDistrictLayerVisibility = (visible: boolean) => {
    if (!map.current) return;
    
    const layersToToggle = ['water-district-fill', 'water-district-outline'];
    
    layersToToggle.forEach(layerId => {
      const layer = map.current.getLayer(layerId);
      if (layer) {
        map.current.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });
    
    setWaterDistrictLayerVisible(visible);
  };

  // Toggle cell tower layer visibility
  const toggleCellTowerLayerVisibility = (visible: boolean) => {
    if (!map.current) return;
    
    const layersToToggle = ['cell-tower-coverage-fill', 'cell-tower-coverage-outline', 'cell-tower-points'];
    
    layersToToggle.forEach(layerId => {
      const layer = map.current?.getLayer(layerId);
      if (layer) {
        map.current?.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });
    
    setCellTowerLayerVisible(visible);
  };

  return <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Left Sidebar - only show in EVAC mode */}
      {currentMode === 'evac' && <LeftSidebar onExpandedChange={setSidebarExpanded} isMobile={isMobile} />}
      
      {/* News Toolbar - only show in News mode */}
      {currentMode === 'news' && <NewsToolbar isMobile={isMobile} />}
      
      {/* Top Toolbar - only show in Alert mode */}
      {currentMode === 'alert' && <TopToolbar isMobile={isMobile} currentMode={selectMode ? 'select' : drawingMode || 'select'} onDrawTool={tool => {
      // Clear any existing drawings but KEEP selections
      clearDrawnShapes();

      // Clear drawing markers (blue vertices)
      drawingMarkers.forEach(marker => {
        marker.remove();
      });
      setDrawingMarkers([]);

      // Cancel any existing drawing
      if (drawingMode) {
        cancelDrawing();
      }

      // Switch to drawing mode
      setSelectMode(false);
      setDrawingMode(tool);
    }} onSelectArea={() => {
      // Clear any existing drawings
      clearDrawnShapes();

      // Clear drawing markers (blue vertices)
      drawingMarkers.forEach(marker => {
        marker.remove();
      });
      setDrawingMarkers([]);

      // Cancel any active drawing
      if (drawingMode) {
        cancelDrawing();
      }

      // Switch to select mode
      setSelectMode(true);
      setDrawingMode(null);
    }} onUploadShapeFile={handleShapeFileUpload} onEditTool={tool => {
      console.log('Edit tool selected:', tool);
      if (tool === 'exclude') {
        handleExcludeArea();
      } else if (tool === 'edit') {
        handleEditPolygon();
      } else if (tool === 'delete') {
        handleDeleteAll();
      } else if (tool === 'undo') {
        handleUndo();
      }
    }} onSnapshot={() => {
      console.log('Snapshot requested');
      // Add snapshot functionality here
    }} onLocationSelect={location => {
      console.log('Location selected:', location.name);
      if (map.current) {
        // Move map to location
        map.current.flyTo({
          center: location.center,
          zoom: location.zoom,
          duration: 2000
        });

        // Add polygon if provided
        if (location.polygon) {
          const polygonId = `location-polygon-${Date.now()}`;
          map.current.addSource(polygonId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: location.polygon
              }
            }
          });
          map.current.addLayer({
            id: `${polygonId}-fill`,
            type: 'fill',
            source: polygonId,
            paint: {
              'fill-color': '#ff6b6b',
              'fill-opacity': 0.3
            }
          });
          map.current.addLayer({
            id: `${polygonId}-outline`,
            type: 'line',
            source: polygonId,
            paint: {
              'line-color': '#ff6b6b',
              'line-width': 2
            }
          });
          toast({
            title: "Location Selected",
            description: `Moved to ${location.name} with sample polygon`
          });
        } else {
          toast({
            title: "Location Selected",
            description: `Moved to ${location.name}`
          });
        }
      }
    }} />}

    {/* Action Buttons Row - In line with Active Layer */}
    {currentMode === 'evac' && !isMobile && (
      <TooltipProvider>
        <Tooltip open={showExcludeTooltip} onOpenChange={setShowExcludeTooltip}>
          <TooltipTrigger asChild>
            <div className="absolute top-[18px] right-64 z-40 flex gap-2">
              {/* Exclude Area Button */}
              <Button 
                variant="secondary" 
                size="sm" 
                className={`h-10 px-4 border shadow-sm flex items-center gap-2 ${
                  excludeMode 
                    ? 'bg-gray-200 border-gray-400 text-gray-800' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={handleExcludeArea}
              >
                <Scissors className="h-4 w-4" />
                <span className="text-sm">Exclude Area</span>
              </Button>

              {/* Undo Button */}
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-10 px-4 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-2"
                onClick={handleUndo}
              >
                <Undo className="h-4 w-4" />
                <span className="text-sm">Undo</span>
              </Button>

              {/* Delete Button */}
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-10 px-4 border border-red-300 shadow-sm bg-white hover:bg-red-50 text-red-600 flex items-center gap-2"
                onClick={handleDeleteAll}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Delete</span>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs bg-black text-white border-black">
            <p>These three buttons only appear in EVAC when digitising an area.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}

    {/* Mode Toggle - Bottom Left */}
    <ModeToggle 
      mode={currentMode} 
      onModeChange={(newMode) => {
        setCurrentMode(newMode);
        logActivity('mode_changed', { mode: newMode });
      }} 
      sidebarExpanded={sidebarExpanded} 
      isMobile={isMobile} 
    />
      
      {/* Map Container - dynamically adjusted for sidebar */}
      <div ref={mapContainer} className="absolute inset-0 transition-all duration-300 ease-in-out" style={{
      left: isMobile ? '0px' : (currentMode === 'evac' ? (sidebarExpanded ? '320px' : '64px') : '0px')
    }} />
      
      {/* Active Layer Selector - Top Right Corner */}
      <div className={`absolute top-4 right-4 z-20 ${isMobile || currentMode === 'news' ? 'hidden' : ''}`}>
        <Select value={activeLayer} onValueChange={setActiveLayer}>
          <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-1 min-w-[180px] h-auto flex flex-col items-start gap-0 [&>svg]:absolute [&>svg]:right-2 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:opacity-70">
            <span className="text-[10px] text-gray-500 font-normal leading-tight">Active Layer</span>
            <div className="flex items-center gap-2 w-full pr-5">
              {activeLayer === 'Genasys Zones' && (
                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
              )}
              {activeLayer === 'Custom Zone Areas' && (
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                  </svg>
                </div>
              )}
              {activeLayer === 'Public Parks' && (
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
                </div>
              )}
              {activeLayer === 'Water District CWA' && (
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                </div>
              )}
              <span className="text-xs font-normal text-gray-900">{activeLayer}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg z-50 p-1">
            <SelectItem value="Genasys Zones" className="rounded-md px-2 py-1.5 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                <span className="text-xs font-normal text-gray-900">Genasys Zones</span>
              </div>
            </SelectItem>
            <SelectItem value="Custom Zone Areas" className="rounded-md px-2 py-1.5 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                  </svg>
                </div>
                <span className="text-xs font-normal text-gray-900">Custom Zone Areas</span>
              </div>
            </SelectItem>
            <SelectItem value="Public Parks" className="rounded-md px-2 py-1.5 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
                </div>
                <span className="text-xs font-normal text-gray-900">Public Parks</span>
              </div>
            </SelectItem>
            <SelectItem value="Water District CWA" className="rounded-md px-2 py-1.5 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-xs font-normal text-gray-900">Water District CWA</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* NEWS Mode Active Layer Selector - Top Right Corner */}
      <div className={`absolute top-4 right-4 z-20 ${currentMode !== 'news' || isMobile ? 'hidden' : ''}`}>
        <Select value={activeLayer} onValueChange={setActiveLayer}>
          <SelectTrigger className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-1 min-w-[200px] h-auto flex flex-col items-start gap-0 [&>svg]:absolute [&>svg]:right-2 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:opacity-70">
            <span className="text-[10px] text-gray-500 font-normal leading-tight">Coverage Layer</span>
            <div className="flex items-center gap-2 w-full pr-5">
              {activeLayer === 'Cell Tower Coverage' && (
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                </div>
              )}
              <span className="text-xs font-normal text-gray-900">{activeLayer === 'Cell Tower Coverage' ? 'Cell Tower Coverage' : 'Cell Tower Coverage'}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-lg z-50 p-1">
            <SelectItem value="Cell Tower Coverage" className="rounded-md px-2 py-1.5 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                </div>
                <span className="text-xs font-normal text-gray-900">Cell Tower Coverage</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ArcGIS-style Attribute Panel */}
      {attributePanelFeature && (
        <AttributePanel
          feature={attributePanelFeature}
          layerName={attributePanelFeature._layerName?.replace(/ /g, '_') || 'Feature'}
          onClose={() => setAttributePanelFeature(null)}
          onZoomTo={() => {
            if (!map.current || !attributePanelFeature) return;
            
            // Extract geometry - handle vector tile features
            let geometry = attributePanelFeature.geometry;
            if (!geometry || !geometry.coordinates) {
              if (typeof attributePanelFeature.toGeoJSON === 'function') {
                try {
                  const geoJSON = attributePanelFeature.toGeoJSON();
                  geometry = geoJSON.geometry;
                } catch (e) {
                  console.error('Error converting to GeoJSON:', e);
                  return;
                }
              } else {
                return;
              }
            }
            
            if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
              const coords = geometry.type === 'Polygon' 
                ? geometry.coordinates[0] 
                : geometry.coordinates[0][0];
              if (coords && coords.length > 0) {
                const bounds = coords.reduce(
                  (acc: any, coord: [number, number]) => ({
                    minLng: Math.min(acc.minLng, coord[0]),
                    maxLng: Math.max(acc.maxLng, coord[0]),
                    minLat: Math.min(acc.minLat, coord[1]),
                    maxLat: Math.max(acc.maxLat, coord[1]),
                  }),
                  { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
                );
                map.current.fitBounds(
                  [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
                  { padding: 50, maxZoom: 16 }
                );
              }
            } else if (geometry.type === 'Point') {
              map.current.flyTo({
                center: geometry.coordinates as [number, number],
                zoom: 15
              });
            }
          }}
        />
      )}

      {/* NEWS Mode Coverage Attribute Panel */}
      {currentMode === 'news' && coveragePanelCells.length > 0 && (
        <CoverageAttributePanel
          cells={coveragePanelCells}
          onClose={() => setCoveragePanelCells([])}
          onZoomToCell={(cellId) => {
            // Optional: zoom to cell location
            console.log('Zoom to cell:', cellId);
          }}
        />
      )}

      {/* Selection Status Display - shown when no attribute panel */}
      {!attributePanelFeature && (selectedPolygons.length > 0 || selectedFeatures.length > 0) && <div className="absolute top-20 right-4 z-20">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2">
            <div className="text-xs text-gray-600 space-y-1">
              {selectedPolygons.length > 0 && <div>
                  {selectedPolygons.length === 1 ? <span>
                      Selected Polygon: {countPolygonVertices(selectedPolygons[0])} vertices
                    </span> : <span>
                      {selectedPolygons.length} Polygons: {selectedPolygons.reduce((sum, p) => sum + countPolygonVertices(p), 0)} vertices total
                    </span>}
                </div>}
              {selectedFeatures.length > 0 && <div>
                  {selectedFeatures.length === 1 ? <span>
                      1 Zone Selected: {selectedFeatures[0].properties?.zonename_zh?.substring(10) || selectedFeatures[0].properties?.zone_identifier || selectedFeatures[0].properties?.id || 'Unknown'} ({countPolygonVertices(selectedFeatures[0])} vertices)
                    </span> : <span>
                      {selectedFeatures.length} Zones: {selectedFeatures.reduce((sum, f) => sum + countPolygonVertices(f), 0)} vertices total
                    </span>}
                </div>}
            </div>
          </div>
        </div>}

      {/* Search Bar */}
      {searchOpen && <div className="absolute top-20 left-20 right-4 z-30">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Search and Filter Zones" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }} className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={() => setSearchOpen(false)}>
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>}

      {/* Right Side Toolbar - Top buttons moved down */}
      <div className={`absolute top-36 right-4 z-20 flex flex-col gap-1 ${isMobile ? 'hidden' : ''}`}>
        {/* Search Button */}
        <Button variant="secondary" size="sm" className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm`} onClick={() => setSearchOpen(!searchOpen)}>
          <Search className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />
        </Button>

        {/* Layers Button */}
        <Button variant="secondary" size="sm" className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm`} onClick={() => setLayersPanelOpen(!layersPanelOpen)}>
          <Layers className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />
        </Button>

        {/* Basemap Toggle Button */}
        <Button variant="secondary" size="sm" className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm`} onClick={() => setBasemapToggleOpen(!basemapToggleOpen)}>
          <MapIcon className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />
        </Button>
      </div>

      {/* Bottom Right Toolbar - Adjusted for Alert/News mode */}
      <div className={`absolute right-4 z-20 flex flex-col gap-1 ${(currentMode === 'alert' || currentMode === 'news') ? 'bottom-20' : 'bottom-4'}`}>
        {/* Tools Popup Button */}
        <Button variant="secondary" size="sm" className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm`} onClick={() => setToolsPopupOpen(!toolsPopupOpen)}>
          {toolsPopupOpen ? <ChevronDown className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} /> : <ChevronUp className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />}
        </Button>

        {/* Reset Map Button */}
        <Button variant="secondary" size="sm" className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm`} onClick={resetMapView}>
          <Home className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />
        </Button>

        {/* Zoom In */}
        <Button variant="secondary" size="sm" className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm`} onClick={() => map.current?.zoomIn()}>
          <ZoomIn className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />
        </Button>

        {/* Zoom Out */}
        <Button variant="secondary" size="sm" className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm`} onClick={() => map.current?.zoomOut()}>
          <ZoomOut className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />
        </Button>
      </div>

      {/* Alert Mode Cancel/Save Buttons - only in Alert mode, not News */}
      {currentMode === 'alert' && (
        <div className="absolute bottom-4 right-4 z-30 flex gap-2">
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600" onClick={() => setCancelDialogOpen(true)}>
            Cancel
          </Button>
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setSaveDialogOpen(true)}>
            Save
          </Button>
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md" hideOverlay>
          <DialogHeader>
            <DialogTitle>Cancel</DialogTitle>
            <DialogDescription>
              This button will cancel the polygon edits and close the map window
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md" hideOverlay>
          <DialogHeader>
            <DialogTitle>Save</DialogTitle>
            <DialogDescription>
              This button will save the polygon, update the Alert targets and close the map window
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popups */}
      <LayersPanel isOpen={layersPanelOpen} onClose={() => setLayersPanelOpen(false)} onToggleZoneLayer={toggleZoneLayerVisibility} zoneLayerVisible={zoneLayerVisible} onToggleParksLayer={toggleParksLayerVisibility} parksLayerVisible={parksLayerVisible} onToggleWaterDistrictLayer={toggleWaterDistrictLayerVisibility} waterDistrictLayerVisible={waterDistrictLayerVisible} onToggleCellTowerLayer={toggleCellTowerLayerVisibility} cellTowerLayerVisible={cellTowerLayerVisible} currentMode={currentMode} isMobile={isMobile} />
      <BasemapToggle isOpen={basemapToggleOpen} currentBasemap={currentBasemap} onBasemapChange={changeBasemap} onClose={() => setBasemapToggleOpen(false)} isMobile={isMobile} />
      <ToolsPopup isOpen={toolsPopupOpen} onClose={() => setToolsPopupOpen(false)} onMeasure={toggleMeasurement} onGeolocation={triggerGeolocation} onLegend={() => setLegendOpen(true)} measurementMode={measurementMode} isMobile={isMobile} />
      <Legend isOpen={legendOpen} onClose={() => setLegendOpen(false)} />

      {/* Measurement Status */}
      {measurementMode && <div className="absolute top-20 left-20 z-30">
          <div className="bg-blue-100/95 backdrop-blur-sm border border-blue-200 rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <Ruler className="h-4 w-4" />
              <span>Measurement Mode Active</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Click on the map to measure distances
            </div>
            {distances.length > 0 && <div className="mt-2 text-xs text-blue-700">
                <div>Total segments: {distances.length}</div>
                <div>Total distance: {distances.reduce((sum, d) => sum + d, 0).toFixed(2)} km</div>
              </div>}
          </div>
        </div>}

      {/* Drawing Status - Only show for Exclude Mode */}
      {drawingMode && excludeMode && <div className="absolute top-20 left-20 z-30">
          <div className="backdrop-blur-sm border rounded-lg shadow-lg p-3 bg-red-100/95 border-red-200">
            <div className="flex items-center gap-2 text-sm text-red-800">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Exclude Area Drawing Mode</span>
            </div>
            <div className="text-xs mt-1 text-red-600">
              Drawing hole in existing polygon
            </div>
            <Button variant="outline" size="sm" onClick={cancelDrawing} className="mt-2 text-xs h-6">
              Cancel Drawing
            </Button>
          </div>
        </div>}

      {/* Hidden layer status for debugging */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
        {layerStatus === 'loading' && 'Loading layers...'}
        {layerStatus === 'success' && vectorLayerVisible && 'Layers loaded'}
        {layerStatus === 'error' && <Button variant="ghost" size="sm" onClick={retryVectorLayer} className="text-xs text-red-500 hover:text-red-600">
            Retry layer load
          </Button>}
      </div>
    </div>;
};
export default MapView;