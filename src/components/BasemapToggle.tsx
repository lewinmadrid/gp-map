import React from 'react';
import { Button } from '@/components/ui/button';
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
    preview: 'bg-gray-100'
  }, {
    key: 'satellite',
    name: 'Esri Satellite',
    preview: 'bg-blue-900'
  }, {
    key: 'topographic',
    name: 'Esri Topo',
    preview: 'bg-green-800'
  }, {
    key: 'terrain',
    name: 'Esri Terrain',
    preview: 'bg-amber-800'
  }, {
    key: 'google_roads',
    name: 'Google Roads',
    preview: 'bg-gray-50'
  }, {
    key: 'google_satellite',
    name: 'Google Satellite',
    preview: 'bg-blue-950'
  }, {
    key: 'google_hybrid',
    name: 'Google Hybrid',
    preview: 'bg-slate-700'
  }, {
    key: 'google_terrain',
    name: 'Google Terrain',
    preview: 'bg-emerald-700'
  }];
  return <div className="absolute top-4 right-16 border border-border rounded-lg shadow-lg z-50 p-4 bg-slate-50">
      <div className="grid grid-cols-4 gap-3 max-w-sm">
        {basemaps.map(basemap => <div key={basemap.key} className="text-center">
            <Button variant={currentBasemap === basemap.key ? "default" : "outline"} className={`w-16 h-12 p-1 mb-1 ${basemap.preview} border-2 ${currentBasemap === basemap.key ? 'border-primary' : 'border-border'}`} onClick={() => {
          onBasemapChange(basemap.key);
          onClose();
        }}>
              <div className="w-full h-full rounded bg-gradient-to-br from-gray-200 to-gray-400"></div>
            </Button>
            <div className="text-xs font-medium text-black">{basemap.name}</div>
          </div>)}
      </div>
    </div>;
};
export default BasemapToggle;