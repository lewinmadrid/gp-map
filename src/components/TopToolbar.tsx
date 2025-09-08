import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Camera, Circle, Square, MapPin, Edit, Upload, ChevronDown, Trash2, Minus } from 'lucide-react';
interface TopToolbarProps {
  currentMode: 'select' | 'polygon' | 'circle' | 'radius';
  onDrawTool: (tool: 'polygon' | 'circle' | 'radius') => void;
  onSelectArea: () => void;
  onUploadShapeFile: (file: File) => void;
  onEditTool: (tool: 'edit' | 'exclude' | 'delete') => void;
  onSnapshot: () => void;
}
const TopToolbar: React.FC<TopToolbarProps> = ({
  currentMode,
  onDrawTool,
  onSelectArea,
  onUploadShapeFile,
  onEditTool,
  onSnapshot
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.zip') && !fileName.endsWith('.gz')) {
        alert('Please upload a .zip or .gz file containing a shapefile.');
        return;
      }
      onUploadShapeFile(file);
    }
    // Reset input to allow re-upload of same file
    event.target.value = '';
  };
  return <TooltipProvider>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
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
          <DropdownMenuItem onClick={() => onDrawTool('polygon')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
            <Square className="h-4 w-4" />
            Polygon
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDrawTool('circle')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
            <Circle className="h-4 w-4" />
            Circle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDrawTool('radius')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
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
          <DropdownMenuItem onClick={() => onEditTool('exclude')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
            <Minus className="h-4 w-4" />
            Exclude Area
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEditTool('delete')} className="flex items-center gap-2 hover:bg-gray-100 text-black">
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Select Area */}
      <Button variant="secondary" size="sm" className={`h-10 px-3 border shadow-sm flex items-center gap-1 ${currentMode === 'select' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`} onClick={onSelectArea}>
        <MapPin className="h-4 w-4" />
        <span className="text-sm">Select Area</span>
      </Button>

      {/* Upload Shape File */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size="sm" className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1" onClick={handleUploadClick}>
            <Upload className="h-4 w-4" />
            <span className="text-sm">Upload</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Upload a zipped shape file to create the alert area</p>
        </TooltipContent>
      </Tooltip>
      <input ref={fileInputRef} type="file" accept=".zip,.gz" onChange={handleFileChange} className="hidden" />

      {/* Snapshot */}
      <Button variant="secondary" size="sm" onClick={onSnapshot} className="h-10 px-3 border border-gray-200 shadow-sm bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-1 rounded-sm">
        <Camera className="h-4 w-4" />
        <span className="text-sm">Snapshot</span>
      </Button>
    </div>
    </TooltipProvider>;
};
export default TopToolbar;