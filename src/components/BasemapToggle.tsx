import React from 'react';
import { Button } from '@/components/ui/button';
import streetsImage from '@/assets/basemap-streets.png';
import satelliteImage from '@/assets/basemap-satellite.png';
import topographicImage from '@/assets/basemap-topographic.png';
import terrainImage from '@/assets/basemap-terrain.png';
import googleRoadsImage from '@/assets/basemap-google-roads.png';
import googleSatelliteImage from '@/assets/basemap-google-satellite.png';
import googleHybridImage from '@/assets/basemap-google-hybrid.png';
import googleTerrainImage from '@/assets/basemap-google-terrain.png';
interface BasemapToggleProps {
  isOpen: boolean;
  currentBasemap: string;
  onBasemapChange: (basemap: string) => void;
  onClose: () => void;
}
const BasemapToggle: React.FC<BasemapToggleProps> = ({
  isOpen,
  currentBasemap,
  onBasemapChange,
  onClose
}) => {
  if (!isOpen) return null;
  const basemaps = [{
    key: 'streets',
    name: 'Esri Streets',
    preview: 'bg-gray-100',
    image: streetsImage
  }, {
    key: 'satellite',
    name: 'Esri Satellite',
    preview: 'bg-blue-900',
    image: satelliteImage
  }, {
    key: 'topographic',
    name: 'Esri Topo',
    preview: 'bg-green-800',
    image: topographicImage
  }, {
    key: 'terrain',
    name: 'Esri Terrain',
    preview: 'bg-amber-800',
    image: terrainImage
  }, {
    key: 'google_roads',
    name: 'Google Roads',
    preview: 'bg-gray-50',
    image: googleRoadsImage
  }, {
    key: 'google_satellite',
    name: 'Google Satellite',
    preview: 'bg-blue-950',
    image: googleSatelliteImage
  }, {
    key: 'google_hybrid',
    name: 'Google Hybrid',
    preview: 'bg-slate-700',
    image: googleHybridImage
  }, {
    key: 'google_terrain',
    name: 'Google Terrain',
    preview: 'bg-emerald-700',
    image: googleTerrainImage
  }];
  return <div className="absolute top-4 right-16 border border-border shadow-lg z-50 p-4 bg-slate-50 rounded-sm">
      <div className="grid grid-cols-4 gap-3 max-w-sm">
        {basemaps.map(basemap => <div key={basemap.key} className="text-center">
            <Button variant={currentBasemap === basemap.key ? "default" : "outline"} className={`w-16 h-12 p-1 mb-1 ${basemap.preview} border ${currentBasemap === basemap.key ? 'border-primary' : 'border-border'}`} onClick={() => {
          onBasemapChange(basemap.key);
          onClose();
        }}>
              <img src={basemap.image} alt={basemap.name} className="w-full h-full rounded object-cover" />
            </Button>
            <div className="text-xs font-medium text-black">{basemap.name}</div>
          </div>)}
      </div>
    </div>;
};
export default BasemapToggle;