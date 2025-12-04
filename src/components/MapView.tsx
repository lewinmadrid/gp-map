import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, ScaleControl, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import LayersPanel from './LayersPanel';
import BasemapToggle from './BasemapToggle';
import ToolsPopup from './ToolsPopup';
import Legend from './Legend';
import LeftSidebar from './LeftSidebar';
import TopToolbar from './TopToolbar';
import ModeToggle from './ModeToggle';
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
  const [currentMode, setCurrentMode] = useState<'alert' | 'evac'>('evac');
  const [drawingHistory, setDrawingHistory] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
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

      // Only allow area selection when in select mode
      if (selectMode && !measurementMode && !drawingMode) {
        // Handle area selection for evacuation zones
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['evacuation-zones-fill']
        });

        // Also check for drawn polygons and uploaded polygons
        const allFeatures = map.current.queryRenderedFeatures(e.point);
        const drawnPolygons = allFeatures.filter(f => f.source && (f.source.includes('drawn-polygon') || f.source.includes('uploaded-polygon') || f.layer && (f.layer.id.includes('drawn-polygon') || f.layer.id.includes('uploaded-polygon'))));

        // Handle evacuation zone selection
        if (features && features.length > 0) {
          const feature = features[0];
          console.log('🎯 Evacuation zone selected:', feature.properties);

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
  }, [measurementMode, measurementPoints, drawingMode, drawingPoints, isDrawing, tempCircleCenter, selectMode, excludeMode, toast]);

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
      setLayerStatus('success');
      setVectorLayerVisible(true);
      toast({
        title: "Vector Layer Loaded",
        description: "Loaded via Supabase Edge Function proxy"
      });
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
    const featureId = feature.properties?.id || feature.properties?.zone_id || `feature-${Date.now()}-${index}`;
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
    const featureId = feature.properties?.id || feature.properties?.zone_id || `feature-${Date.now()}`;
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
      <div className={`absolute top-4 right-4 z-20 ${isMobile ? 'hidden' : ''}`}>
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg min-w-56 rounded-none py-0 pl-[6px]">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-600 whitespace-nowrap">Active Layer</span>
            <Select value={activeLayer} onValueChange={setActiveLayer}>
              <SelectTrigger className="flex-1 bg-white border-gray-200 text-gray-900 text-xs [&>span]:pr-4">
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
      </div>

      {/* Selection Status Display */}
      {(selectedPolygons.length > 0 || selectedFeatures.length > 0) && <div className="absolute top-20 right-4 z-20">
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

      {/* Bottom Right Toolbar - Adjusted for Alert mode */}
      <div className={`absolute right-4 z-20 flex flex-col gap-1 ${currentMode === 'alert' ? 'bottom-20' : 'bottom-4'}`}>
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

      {/* Alert Mode Cancel/Save Buttons */}
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
      <LayersPanel isOpen={layersPanelOpen} onClose={() => setLayersPanelOpen(false)} onToggleZoneLayer={toggleZoneLayerVisibility} zoneLayerVisible={zoneLayerVisible} isMobile={isMobile} />
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