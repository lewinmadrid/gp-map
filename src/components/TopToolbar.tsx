import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Camera, Circle, Square, MapPin, Edit, Upload, ChevronDown, Trash2, Scissors, Navigation, Settings, Menu, Undo } from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface TopToolbarProps {
  currentMode: 'select' | 'polygon' | 'circle' | 'radius';
  onDrawTool: (tool: 'polygon' | 'circle' | 'radius') => void;
  onSelectArea: () => void;
  onUploadShapeFile: (file: File) => void;
  onEditTool: (tool: 'edit' | 'exclude' | 'delete' | 'undo') => void;
  onSnapshot: () => void;
  onLocationSelect: (location: { name: string; center: [number, number]; zoom: number; polygon?: number[][][] }) => void;
  isMobile?: boolean;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  currentMode,
  onDrawTool,
  onSelectArea,
  onUploadShapeFile,
  onEditTool,
  onSnapshot,
  onLocationSelect,
  isMobile = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logActivity } = useActivityLogger();
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setMobileMenuOpen(false);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.zip') && !fileName.endsWith('.gz')) {
        alert('Please upload a .zip or .gz file containing a shapefile.');
        return;
      }
      onUploadShapeFile(file);
    }
    event.target.value = '';
  };

  // Mobile hamburger menu
  if (isMobile) {
    return (
      <TooltipProvider>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
          {/* Primary actions always visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="secondary" 
                size="sm" 
                className={`h-10 px-3 border shadow-sm ${
                  ['polygon', 'circle', 'radius'].includes(currentMode) 
                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <Square className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-32 bg-white border border-gray-200 shadow-lg">
              <DropdownMenuItem onClick={() => { onDrawTool('polygon'); logActivity('draw_tool_selected', { tool: 'polygon' }); }} className="flex items-center gap-2 text-black">
                <Square className="h-4 w-4" />
                Polygon
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { onDrawTool('circle'); logActivity('draw_tool_selected', { tool: 'circle' }); }} className="flex items-center gap-2 text-black">
                <Circle className="h-4 w-4" />
                Circle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { onDrawTool('radius'); logActivity('draw_tool_selected', { tool: 'radius' }); }} className="flex items-center gap-2 text-black">
                <MapPin className="h-4 w-4" />
                Radius
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="secondary" 
            size="sm" 
            className={`h-10 px-3 border shadow-sm ${
              currentMode === 'select' 
                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-200 text-gray-600'
            }`}
            onClick={() => { onSelectArea(); logActivity('select_area_activated'); }}
          >
            <MapPin className="h-4 w-4" />
          </Button>

          {/* More menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white text-gray-600">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-auto">
              <div className="space-y-2 pt-4">
                <div className="text-sm font-medium mb-4">Edit Tools</div>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { onEditTool('edit'); setMobileMenuOpen(false); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Geometry
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { onEditTool('undo'); setMobileMenuOpen(false); }}>
                  <Undo className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { onEditTool('exclude'); setMobileMenuOpen(false); }}>
                  <Scissors className="h-4 w-4 mr-2" />
                  Exclude Area
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { onEditTool('delete'); setMobileMenuOpen(false); }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                <div className="text-sm font-medium mb-4 mt-6">Tools</div>
                <Button variant="ghost" className="w-full justify-start" onClick={handleUploadClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Shape
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { onSnapshot(); setMobileMenuOpen(false); }}>
                  <Camera className="h-4 w-4 mr-2" />
                  Add Map to Alert
                </Button>

                <div className="text-sm font-medium mb-4 mt-6">Locations</div>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { 
                  onLocationSelect({ name: 'San Francisco Bay Area', center: [-122.4194, 37.7749], zoom: 10, polygon: [[[-122.5, 37.6], [-122.3, 37.6], [-122.3, 37.9], [-122.5, 37.9], [-122.5, 37.6]]] }); 
                  logActivity('location_selected', { location: 'San Francisco' });
                  setMobileMenuOpen(false); 
                }}>
                  <MapPin className="h-4 w-4 mr-2" />
                  San Francisco
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { 
                  onLocationSelect({ name: 'Los Angeles', center: [-118.2437, 34.0522], zoom: 10, polygon: [[[-118.4, 33.9], [-118.1, 33.9], [-118.1, 34.2], [-118.4, 34.2], [-118.4, 33.9]]] }); 
                  logActivity('location_selected', { location: 'Los Angeles' });
                  setMobileMenuOpen(false); 
                }}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Los Angeles
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { 
                  onLocationSelect({ name: 'Miami-Dade County', center: [-80.1918, 25.7617], zoom: 10, polygon: [[[-80.4, 25.5], [-80.0, 25.5], [-80.0, 26.0], [-80.4, 26.0], [-80.4, 25.5]]] }); 
                  logActivity('location_selected', { location: 'Miami-Dade' });
                  setMobileMenuOpen(false); 
                }}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Miami-Dade
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { 
                  onLocationSelect({ name: 'New York City', center: [-74.0060, 40.7128], zoom: 11, polygon: [[[-74.2, 40.5], [-73.8, 40.5], [-73.8, 40.9], [-74.2, 40.9], [-74.2, 40.5]]] }); 
                  logActivity('location_selected', { location: 'New York City' });
                  setMobileMenuOpen(false); 
                }}>
                  <MapPin className="h-4 w-4 mr-2" />
                  New York City
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <input ref={fileInputRef} type="file" accept=".zip,.gz" onChange={handleFileChange} className="hidden" />
        </div>
      </TooltipProvider>
    );
  }

  // Desktop full toolbar
  return (
    <TooltipProvider>
      <div className="absolute top-4 right-[220px] z-50 flex gap-2">
        {/* Draw Tool Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className={`h-10 px-3 border shadow-sm flex items-center gap-1 ${['polygon', 'circle', 'radius'].includes(currentMode) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Square className="h-4 w-4" />
              <span className="text-sm">Draw</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-white border border-gray-200 shadow-lg">
            <DropdownMenuItem onClick={() => { onDrawTool('polygon'); logActivity('draw_tool_selected', { tool: 'polygon' }); }} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <Square className="h-4 w-4" />
              Polygon
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onDrawTool('circle'); logActivity('draw_tool_selected', { tool: 'circle' }); }} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <Circle className="h-4 w-4" />
              Circle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onDrawTool('radius'); logActivity('draw_tool_selected', { tool: 'radius' }); }} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <MapPin className="h-4 w-4" />
              Radius
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
              <Edit className="h-4 w-4" />
              <span className="text-sm">Edit</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-white border border-gray-200 shadow-lg">
            <DropdownMenuItem onClick={() => onEditTool('edit')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <Edit className="h-4 w-4" />
              Edit Geometry
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditTool('undo')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <Undo className="h-4 w-4" />
              Undo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditTool('exclude')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <Scissors className="h-4 w-4" />
              Exclude Area
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditTool('delete')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Select Area */}
        <Button variant="secondary" size="sm" className={`h-10 px-3 border shadow-sm flex items-center gap-1 ${currentMode === 'select' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`} onClick={() => { onSelectArea(); logActivity('select_area_activated'); }}>
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Select Area</span>
        </Button>

        {/* Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Tools</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-white border border-gray-200 shadow-lg">
            <DropdownMenuItem onClick={handleUploadClick} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <Upload className="h-4 w-4" />
              Upload Shape
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSnapshot} className="flex items-center gap-2 hover:bg-gray-100 text-black">
              <Camera className="h-4 w-4" />
              Add Map to Alert
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={fileInputRef} type="file" accept=".zip,.gz" onChange={handleFileChange} className="hidden" />

        {/* Locations Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1">
              <Navigation className="h-4 w-4" />
              <span className="text-sm">Locations</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-white border border-gray-200 shadow-lg z-50">
            <DropdownMenuItem 
              onClick={() => { onLocationSelect({ name: 'San Francisco Bay Area', center: [-122.4194, 37.7749], zoom: 10, polygon: [[[-122.5, 37.6], [-122.3, 37.6], [-122.3, 37.9], [-122.5, 37.9], [-122.5, 37.6]]] }); logActivity('location_selected', { location: 'San Francisco' }); }}
              className="flex items-center gap-2 hover:bg-gray-100 text-black"
            >
              <MapPin className="h-4 w-4" />
              San Francisco Bay Area
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { onLocationSelect({ name: 'Los Angeles', center: [-118.2437, 34.0522], zoom: 10, polygon: [[[-118.4, 33.9], [-118.1, 33.9], [-118.1, 34.2], [-118.4, 34.2], [-118.4, 33.9]]] }); logActivity('location_selected', { location: 'Los Angeles' }); }}
              className="flex items-center gap-2 hover:bg-gray-100 text-black"
            >
              <MapPin className="h-4 w-4" />
              Los Angeles
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { onLocationSelect({ name: 'Miami-Dade County', center: [-80.1918, 25.7617], zoom: 10, polygon: [[[-80.4, 25.5], [-80.0, 25.5], [-80.0, 26.0], [-80.4, 26.0], [-80.4, 25.5]]] }); logActivity('location_selected', { location: 'Miami-Dade' }); }}
              className="flex items-center gap-2 hover:bg-gray-100 text-black"
            >
              <MapPin className="h-4 w-4" />
              Miami-Dade County
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { onLocationSelect({ name: 'New York City', center: [-74.0060, 40.7128], zoom: 11, polygon: [[[-74.2, 40.5], [-73.8, 40.5], [-73.8, 40.9], [-74.2, 40.9], [-74.2, 40.5]]] }); logActivity('location_selected', { location: 'New York City' }); }}
              className="flex items-center gap-2 hover:bg-gray-100 text-black"
            >
              <MapPin className="h-4 w-4" />
              New York City
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};

export default TopToolbar;
