import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';

interface LayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleZoneLayer: (visible: boolean) => void;
  zoneLayerVisible: boolean;
  onToggleParksLayer: (visible: boolean) => void;
  parksLayerVisible: boolean;
  onToggleWaterDistrictLayer: (visible: boolean) => void;
  waterDistrictLayerVisible: boolean;
  onToggleCellTowerLayer?: (visible: boolean) => void;
  cellTowerLayerVisible?: boolean;
  currentMode?: 'evac' | 'alert' | 'news';
  isMobile?: boolean;
}

const LayersPanel: React.FC<LayersPanelProps> = ({ 
  isOpen, 
  onClose, 
  onToggleZoneLayer, 
  zoneLayerVisible, 
  onToggleParksLayer, 
  parksLayerVisible, 
  onToggleWaterDistrictLayer, 
  waterDistrictLayerVisible, 
  onToggleCellTowerLayer,
  cellTowerLayerVisible = true,
  currentMode = 'evac',
  isMobile = false 
}) => {
  const [trafficExpanded, setTrafficExpanded] = React.useState(false);
  const [evacuationExpanded, setEvacuationExpanded] = React.useState(true);
  const [fireExpanded, setFireExpanded] = React.useState(true);
  const [customExpanded, setCustomExpanded] = React.useState(true);
  const [coverageExpanded, setCoverageExpanded] = React.useState(true);
  

  if (!isOpen) return null;

  return (
    <div className={`absolute ${isMobile ? 'inset-x-4 top-20 max-h-[80vh] overflow-y-auto' : 'top-4 right-16 w-80'} bg-white border border-gray-200 rounded-lg shadow-lg z-50`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Layers</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-black hover:bg-gray-100">
            ×
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search Layers" 
            className="pl-10 pr-10 bg-white text-black border-gray-200"
          />
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>

        {/* Layer Groups */}
        <div className="space-y-2">
          {/* Traffic */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => setTrafficExpanded(!trafficExpanded)}
            >
              <div className="flex items-center gap-2">
                {trafficExpanded ? <ChevronDown className="h-4 w-4 text-black" /> : <ChevronUp className="h-4 w-4 text-black" />}
                <span className="font-medium text-black">Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            
            {trafficExpanded && (
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-red-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-black">Road Closure</span>
                  </div>
                  <EyeOff className="h-4 w-4 text-gray-500" />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-blue-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">A</span>
                    </div>
                    <span className="text-sm text-black">Traffic Control Point</span>
                  </div>
                  <EyeOff className="h-4 w-4 text-gray-500" />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-green-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-black">Live Traffic</span>
                  </div>
                  <EyeOff className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            )}
          </div>

          {/* Evacuation */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => setEvacuationExpanded(!evacuationExpanded)}
            >
              <div className="flex items-center gap-2">
                {evacuationExpanded ? <ChevronDown className="h-4 w-4 text-black" /> : <ChevronUp className="h-4 w-4 text-black" />}
                <span className="font-medium text-black">Evacuation</span>
              </div>
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </div>
            
            {evacuationExpanded && (
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-blue-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-black">Genasys Zones</span>
                  </div>
                  <button 
                    onClick={() => onToggleZoneLayer(!zoneLayerVisible)}
                    className="hover:bg-gray-100 rounded p-1"
                  >
                    {zoneLayerVisible ? (
                      <Eye className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fire */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => setFireExpanded(!fireExpanded)}
            >
              <div className="flex items-center gap-2">
                {fireExpanded ? <ChevronDown className="h-4 w-4 text-black" /> : <ChevronUp className="h-4 w-4 text-black" />}
                <span className="font-medium text-black">Fire</span>
              </div>
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </div>
          </div>

          {/* Custom Layers */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => setCustomExpanded(!customExpanded)}
            >
              <div className="flex items-center gap-2">
                {customExpanded ? <ChevronDown className="h-4 w-4 text-black" /> : <ChevronUp className="h-4 w-4 text-black" />}
                <span className="font-medium text-black">Custom Layers</span>
              </div>
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </div>
            
            {customExpanded && (
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-green-600">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                    <span className="text-sm text-black">Public Parks</span>
                  </div>
                  <button 
                    onClick={() => onToggleParksLayer(!parksLayerVisible)}
                    className="hover:bg-gray-100 rounded p-1"
                  >
                    {parksLayerVisible ? (
                      <Eye className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-black">Water District CWA</span>
                  </div>
                  <button 
                    onClick={() => onToggleWaterDistrictLayer(!waterDistrictLayerVisible)}
                    className="hover:bg-gray-100 rounded p-1"
                  >
                    {waterDistrictLayerVisible ? (
                      <Eye className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coverage Layers - NEWS Mode Only */}
          {currentMode === 'news' && (
            <div className="border border-gray-200 rounded-lg bg-white">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
                onClick={() => setCoverageExpanded(!coverageExpanded)}
              >
                <div className="flex items-center gap-2">
                  {coverageExpanded ? <ChevronDown className="h-4 w-4 text-black" /> : <ChevronUp className="h-4 w-4 text-black" />}
                  <span className="font-medium text-black">Coverage Layers</span>
                </div>
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </div>
              
              {coverageExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-purple-500">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      </div>
                      <span className="text-sm text-black">Cell Tower Coverage</span>
                    </div>
                    <button 
                      onClick={() => onToggleCellTowerLayer?.(!cellTowerLayerVisible)}
                      className="hover:bg-gray-100 rounded p-1"
                    >
                      {cellTowerLayerVisible ? (
                        <Eye className="h-4 w-4 text-gray-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white text-black border-gray-200 hover:bg-gray-50">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;