
import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, GeolocateControl, ScaleControl, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import LayersPanel from './LayersPanel';
import BasemapToggle from './BasemapToggle';
import ToolsPopup from './ToolsPopup';
import Legend from './Legend';
import LeftSidebar from './LeftSidebar';
import TopToolbar from './TopToolbar';

import { 
  Search, 
  Layers, 
  Map as MapIcon, 
  ChevronUp, 
  Home, 
  ZoomIn, 
  ZoomOut,
  ChevronDown,
  AlertTriangle,
  Ruler
} from 'lucide-react';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const geolocateControlRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('streets');
  const [vectorLayerVisible, setVectorLayerVisible] = useState(false);
  const [layerStatus, setLayerStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [activeLayer, setActiveLayer] = useState('Genasys Zones');
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [basemapToggleOpen, setBasemapToggleOpen] = useState(false);
  const [toolsPopupOpen, setToolsPopupOpen] = useState(false);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<[number, number][]>([]);
  const [distances, setDistances] = useState<number[]>([]);
  const [measurementMarkers, setMeasurementMarkers] = useState<any[]>([]);
  const [legendOpen, setLegendOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'circle' | 'radius' | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempCircleCenter, setTempCircleCenter] = useState<[number, number] | null>(null);
  
  const { toast } = useToast();

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2[1] - point1[1]) * Math.PI / 180;
    const dLon = (point2[0] - point1[0]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

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

    // Initialize geolocation control but don't add to map (will be triggered programmatically)
    geolocateControlRef.current = new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });
    map.current.addControl(geolocateControlRef.current, 'top-left');
    // Hide the geolocation control from view
    const geolocateButton = document.querySelector('.maplibregl-ctrl-geolocate');
    if (geolocateButton) {
      (geolocateButton as HTMLElement).style.display = 'none';
    }

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
    };

    const handleMeasurementClick = (point: [number, number]) => {
      
      const newPoints = [...measurementPoints, point];
      setMeasurementPoints(newPoints);
      
      // Calculate cumulative distance
      let cumulativeDistance = 0;
      if (newPoints.length > 1) {
        for (let i = 1; i < newPoints.length; i++) {
          cumulativeDistance += calculateDistance(newPoints[i-1], newPoints[i]);
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
        })
          .setLngLat(point)
          .addTo(map.current);
        
        setMeasurementMarkers(prev => [...prev, newMarker]);
        
        // Create separate popup for distance label
        const distanceText = newPoints.length === 1 ? 
          '0.00 ml' : 
          `${(cumulativeDistance * 0.621371).toFixed(2)} ml`;
        
        const popup = new Popup({
          closeButton: false,
          closeOnClick: false,
          anchor: 'bottom',
          offset: [0, -10],
          className: 'measurement-popup'
        })
          .setLngLat(point)
          .setHTML(`<div class="text-xs font-medium text-black" style="background: transparent;">${distanceText}</div>`)
          .addTo(map.current);
        
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
        toast({ title: "Polygon Drawing", description: "Click to add points. Double-click to finish." });
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
        toast({ title: "Circle Drawing", description: "Click another point to set the radius." });
      } else {
        // Calculate radius and draw circle
        const radius = calculateDistance(tempCircleCenter, point);
        drawCircle(tempCircleCenter, radius * 1000); // Convert km to meters
        finishDrawing();
        toast({ title: "Circle Created", description: `Radius: ${(radius * 0.621371).toFixed(2)} miles` });
      }
    };

    const handleRadiusClick = (point: [number, number]) => {
      // Prompt for radius distance
      const radiusStr = prompt("Enter radius in miles:");
      if (!radiusStr) return;
      
      const radiusMiles = parseFloat(radiusStr);
      if (isNaN(radiusMiles) || radiusMiles <= 0) {
        toast({ title: "Invalid Input", description: "Please enter a valid positive number for radius.", variant: "destructive" });
        return;
      }
      
      // Convert miles to meters (1 mile = 1609.34 meters)
      const radiusMeters = radiusMiles * 1609.34;
      drawCircle(point, radiusMeters);
      finishDrawing();
      toast({ title: "Circle Created", description: `Radius: ${radiusMiles} miles` });
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

    // Add click listener for measurement mode or drawing modes
    if (measurementMode || drawingMode) {
      map.current.on('click', handleMapClick);
      
      // Add double-click handler for polygon completion
      if (drawingMode === 'polygon') {
        const handleDoubleClick = () => {
          if (isDrawing && drawingPoints.length >= 3) {
            finishPolygon();
          }
        };
        
        map.current.on('dblclick', handleDoubleClick);
        
        return () => {
          if (map.current) {
            map.current.off('click', handleMapClick);
            map.current.off('dblclick', handleDoubleClick);
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
  }, [measurementMode, measurementPoints, drawingMode, drawingPoints, isDrawing, tempCircleCenter, toast]);

  // Drawing helper functions
  const addDrawingMarker = (point: [number, number]) => {
    if (!map.current) return;
    
    const markerEl = document.createElement('div');
    markerEl.className = 'w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg';
    
    new Marker({ element: markerEl, anchor: 'center' })
      .setLngLat(point)
      .addTo(map.current);
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
      map.current.removeLayer('temp-polygon-fill');
      map.current.removeLayer('temp-polygon-outline');
      map.current.removeSource('temp-polygon');
    }
    
    // Create final polygon (closed)
    const coordinates = [...drawingPoints, drawingPoints[0]]; // Close the polygon
    
    const polygonId = `drawn-polygon-${Date.now()}`;
    map.current.addSource(polygonId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: { id: polygonId, type: 'drawn-polygon' },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
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
    
    finishDrawing();
    toast({ title: "Polygon Created", description: `Polygon with ${drawingPoints.length} points created.` });
  };

  const drawCircle = (center: [number, number], radiusMeters: number) => {
    if (!map.current) return;
    
    // Create circle coordinates using turf-like calculation
    const coordinates: [number, number][] = [];
    const points = 64; // Number of points to create smooth circle
    
    for (let i = 0; i < points; i++) {
      const angle = (i * 360) / points;
      const angleRad = (angle * Math.PI) / 180;
      
      // Calculate offset in degrees (approximate, good enough for visualization)
      const latOffset = (radiusMeters / 111320) * Math.cos(angleRad);
      const lonOffset = (radiusMeters / 111320) * Math.sin(angleRad) / Math.cos((center[1] * Math.PI) / 180);
      
      coordinates.push([
        center[0] + lonOffset,
        center[1] + latOffset
      ]);
    }
    
    // Close the circle
    coordinates.push(coordinates[0]);
    
    const circleId = `drawn-circle-${Date.now()}`;
    map.current.addSource(circleId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: { id: circleId, type: 'drawn-circle' },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
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
  };

  const finishDrawing = () => {
    setDrawingMode(null);
    setDrawingPoints([]);
    setIsDrawing(false);
    setTempCircleCenter(null);
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
    toast({ title: "Drawing Cancelled", description: "Drawing mode has been cancelled." });
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
      map.current.on('sourcedata', (e) => {
        if ((e as any).sourceId === 'vector-labels') {
          console.log('🏷️ Labels source event:', (e as any).dataType, 'isSourceLoaded:', (e as any).isSourceLoaded);
        }
      });

      // Add debugging for data loading events
      map.current.on('data', (e) => {
        if ((e as any).sourceId === 'vector-labels') {
          console.log('🏷️ Labels data event:', e.type, e);
        }
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
          'fill-opacity': 0
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
          'text-size': 16, // Fixed size for now
          'text-allow-overlap': true, // Allow overlap for debugging
          'text-ignore-placement': true, // Ignore placement for debugging
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
      
      // Force map to request labels tiles immediately
      setTimeout(() => {
        if (map.current) {
          const zoom = map.current.getZoom();
          console.log('🏷️ Current zoom level:', zoom);
          console.log('🏷️ Forcing zoom to 10 to trigger label tile requests...');
          map.current.setZoom(10);
          
          // Also try to query the source directly to force loading
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
        }
      }, 1000);

      // Enhanced debugging for labels layer
      map.current.on('sourcedata', (e) => {
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
      map.current.on('dataloading', (e) => {
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

      // Click handler for area selection and highlighting
      map.current.on('click', 'evacuation-zones-fill', (e) => {
        if (measurementMode || drawingMode) return; // Don't select areas when in measurement or drawing mode
        
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          console.log('🎯 Evacuation zone clicked:', feature.properties);
          
          // Update selected feature state
          setSelectedFeature(feature);
          
          // Add or update selection highlight layer
          updateSelectionHighlight(feature);
          
          toast({
            title: "Area Selected",
            description: `Zone ID: ${feature.properties?.id || feature.properties?.zone_id || 'Unknown'}`,
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

  // Update selection highlight with symbology matching the user's image
  const updateSelectionHighlight = (feature: any) => {
    if (!map.current || !feature) return;
    
    // Remove existing selection layer if it exists
    if (map.current.getLayer('selected-area-highlight')) {
      map.current.removeLayer('selected-area-highlight');
    }
    if (map.current.getLayer('selected-area-outline')) {
      map.current.removeLayer('selected-area-outline');
    }
    if (map.current.getSource('selected-area')) {
      map.current.removeSource('selected-area');
    }
    
    // Add source for selected feature
    map.current.addSource('selected-area', {
      type: 'geojson',
      data: feature
    });
    
    // Add semi-transparent fill layer (90% transparent)
    map.current.addLayer({
      id: 'selected-area-highlight',
      type: 'fill',
      source: 'selected-area',
      paint: {
        'fill-color': '#1e3a8a', // Dark blue color
        'fill-opacity': 0.1 // 90% transparent (10% opacity)
      }
    });
    
    // Add thick dark grey outline
    map.current.addLayer({
      id: 'selected-area-outline',
      type: 'line',
      source: 'selected-area',
      paint: {
        'line-color': '#374151', // Dark grey color
        'line-width': 4, // Thick outline as shown in image
        'line-opacity': 1
      }
    });
  };

  // Clear area selection
  const clearSelection = () => {
    if (!map.current) return;
    
    // Remove selection layers
    if (map.current.getLayer('selected-area-highlight')) {
      map.current.removeLayer('selected-area-highlight');
    }
    if (map.current.getLayer('selected-area-outline')) {
      map.current.removeLayer('selected-area-outline');
    }
    if (map.current.getSource('selected-area')) {
      map.current.removeSource('selected-area');
    }
    
    setSelectedFeature(null);
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
      center: [-116.4, 33.7],
      zoom: 10,
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
      description: measurementMode ? "Click to stop measuring" : "Click on the map to start measuring distances",
    });
  };

  // Trigger geolocation
  const triggerGeolocation = () => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger();
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
      {/* Left Sidebar */}
      <LeftSidebar onExpandedChange={setSidebarExpanded} />
      
      {/* Top Toolbar */}
      <TopToolbar 
        onDrawTool={(tool) => {
          // Cancel any existing drawing
          if (drawingMode) {
            cancelDrawing();
          }
          
          // Start new drawing mode
          setDrawingMode(tool);
          
          // Show appropriate instructions
          const instructions = {
            polygon: "Click to add points. Double-click to finish polygon.",
            circle: "Click to set center, then click to set radius.",
            radius: "Click to set center. You'll be prompted for radius distance."
          };
          
          toast({ 
            title: `${tool.charAt(0).toUpperCase() + tool.slice(1)} Drawing Mode`, 
            description: instructions[tool] 
          });
        }}
        onSelectArea={() => {
          console.log('Select area activated');
          clearSelection(); // Clear any existing selection
        }}
        onUploadShapeFile={() => {
          console.log('Shape file upload requested');
          // Add shape file upload functionality here
        }}
        onEditTool={(tool) => {
          console.log('Edit tool selected:', tool);
          // Add edit tool functionality here
        }}
        onSnapshot={() => {
          console.log('Snapshot requested');
          // Add snapshot functionality here
        }}
      />
      
      {/* Map Container - dynamically adjusted for sidebar */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 transition-all duration-300 ease-in-out"
        style={{ left: sidebarExpanded ? '320px' : '64px' }}
      />
      
      {/* Active Layer Selector - Top Right Corner */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 min-w-56">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600 whitespace-nowrap">Active Layer</span>
            <Select value={activeLayer} onValueChange={setActiveLayer}>
              <SelectTrigger className="flex-1 bg-white border-gray-200 text-gray-900 text-xs [&>span]:pr-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 z-50">
                <SelectItem value="Genasys Zones" className="text-xs text-black">Genasys Zones</SelectItem>
                <SelectItem value="Zone Labels" className="text-xs text-black">Zone Labels</SelectItem>
                <SelectItem value="Custom Zone Areas" className="text-xs text-black">Custom Zone Areas</SelectItem>
                <SelectItem value="Custom Layer 1" className="text-xs text-black">Custom Layer 1</SelectItem>
                <SelectItem value="Custom Layer 2" className="text-xs text-black">Custom Layer 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="absolute top-20 left-20 right-4 z-30">
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
      <ToolsPopup 
        isOpen={toolsPopupOpen}
        onClose={() => setToolsPopupOpen(false)}
        onMeasure={toggleMeasurement}
        onGeolocation={triggerGeolocation}
        onLegend={() => setLegendOpen(true)}
        measurementMode={measurementMode}
      />
      <Legend 
        isOpen={legendOpen}
        onClose={() => setLegendOpen(false)}
      />

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

      {/* Drawing Status */}
      {drawingMode && (
        <div className="absolute top-20 left-20 z-30">
          <div className="bg-green-100/95 backdrop-blur-sm border border-green-200 rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-2 text-green-800 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{drawingMode.charAt(0).toUpperCase() + drawingMode.slice(1)} Drawing Mode</span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              {drawingMode === 'polygon' && `Points: ${drawingPoints.length}${isDrawing ? ' (click to add, double-click to finish)' : ''}`}
              {drawingMode === 'circle' && (tempCircleCenter ? 'Click to set radius' : 'Click to set center')}
              {drawingMode === 'radius' && 'Click to set center (radius will be prompted)'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={cancelDrawing}
              className="mt-2 text-xs h-6"
            >
              Cancel Drawing
            </Button>
          </div>
        </div>
      )}

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
