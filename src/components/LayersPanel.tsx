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
}

const LayersPanel: React.FC<LayersPanelProps> = ({ isOpen, onClose }) => {
  const [trafficExpanded, setTrafficExpanded] = React.useState(false);
  const [evacuationExpanded, setEvacuationExpanded] = React.useState(true);
  const [fireExpanded, setFireExpanded] = React.useState(true);
  const [customExpanded, setCustomExpanded] = React.useState(true);

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-16 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Layers</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Layers" 
            className="pl-10 pr-10"
          />
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Layer Groups */}
        <div className="space-y-2">
          {/* Traffic */}
          <div className="border rounded-lg">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent"
              onClick={() => setTrafficExpanded(!trafficExpanded)}
            >
              <div className="flex items-center gap-2">
                {trafficExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="font-medium">Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            {trafficExpanded && (
              <div className="px-3 pb-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-red-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Road Closure</span>
                  </div>
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-blue-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">A</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Traffic Control Point</span>
                  </div>
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded border-l-4 border-l-green-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Live Traffic</span>
                  </div>
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Evacuation */}
          <div className="border rounded-lg">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent"
              onClick={() => setEvacuationExpanded(!evacuationExpanded)}
            >
              <div className="flex items-center gap-2">
                {evacuationExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="font-medium">Evacuation</span>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Fire */}
          <div className="border rounded-lg">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent"
              onClick={() => setFireExpanded(!fireExpanded)}
            >
              <div className="flex items-center gap-2">
                {fireExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="font-medium">Fire</span>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Custom Layers */}
          <div className="border rounded-lg">
            <div 
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent"
              onClick={() => setCustomExpanded(!customExpanded)}
            >
              <div className="flex items-center gap-2">
                {customExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="font-medium">Custom Layers</span>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;