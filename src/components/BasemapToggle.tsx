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

  const basemaps = [
    { key: 'streets', name: 'Default', preview: 'bg-gray-100' },
    { key: 'satellite', name: 'Satellite', preview: 'bg-blue-900' }
  ];

  return (
    <div className="absolute top-4 right-16 bg-background border border-border rounded-lg shadow-lg z-50 p-4">
      <div className="flex gap-3">
        {basemaps.map((basemap) => (
          <div key={basemap.key} className="text-center">
            <Button
              variant={currentBasemap === basemap.key ? "default" : "outline"}
              className={`w-20 h-16 p-1 mb-2 ${basemap.preview} border-2 ${
                currentBasemap === basemap.key ? 'border-primary' : 'border-border'
              }`}
              onClick={() => {
                onBasemapChange(basemap.key);
                onClose();
              }}
            >
              <div className="w-full h-full rounded bg-gradient-to-br from-gray-200 to-gray-400"></div>
            </Button>
            <div className="text-xs font-medium">{basemap.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BasemapToggle;