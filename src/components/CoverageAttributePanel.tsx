import React, { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface CellData {
  tech: string;
  band: string;
  cellId: string;
  name: string;
  zone: string;
  bsMc: string;
  rfRegion: string;
}

interface CoverageAttributePanelProps {
  cells: CellData[];
  onClose: () => void;
  onZoomToCell?: (cellId: string) => void;
  onHighlightCell?: (cellId: string) => void;
}

const CoverageAttributePanel: React.FC<CoverageAttributePanelProps> = ({
  cells,
  onClose,
  onZoomToCell,
  onHighlightCell
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoomToCell, setZoomToCell] = useState(false);
  const [plotType, setPlotType] = useState('simplified');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleRowClick = (index: number, cellId: string) => {
    setSelectedRow(index);
    // Always highlight the cell
    if (onHighlightCell) {
      onHighlightCell(cellId);
    }
    // Only zoom if zoomToCell is enabled
    if (zoomToCell && onZoomToCell) {
      onZoomToCell(cellId);
    }
  };

  if (!cells || cells.length === 0) return null;

  return (
    <div 
      ref={panelRef}
      className="absolute z-30 bg-white shadow-lg border border-gray-300 min-w-[560px]"
      style={{ 
        top: `calc(5rem + ${position.y}px)`, 
        right: `calc(1rem - ${position.x}px)`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header - Draggable */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-100 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal className="h-3 w-3 text-gray-400" />
          <h3 className="font-medium text-gray-900 text-sm">Query results</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-200"
          onClick={onClose}
          title="Close"
        >
          <X className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Checkbox 
            id="zoom-to-cell" 
            checked={zoomToCell}
            onCheckedChange={(checked) => setZoomToCell(checked === true)}
          />
          <Label htmlFor="zoom-to-cell" className="text-sm text-gray-700">Zoom to Cell</Label>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">Plot Type</span>
          <RadioGroup 
            value={plotType} 
            onValueChange={setPlotType}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-1">
              <RadioGroupItem value="raw" id="raw" />
              <Label htmlFor="raw" className="text-sm text-gray-700">Raw</Label>
            </div>
            <div className="flex items-center gap-1">
              <RadioGroupItem value="trimmed" id="trimmed" />
              <Label htmlFor="trimmed" className="text-sm text-gray-700">Trimmed</Label>
            </div>
            <div className="flex items-center gap-1">
              <RadioGroupItem value="simplified" id="simplified" />
              <Label htmlFor="simplified" className="text-sm text-gray-700">Simplified</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b border-gray-300 bg-blue-100">
        <div className="grid text-sm font-medium text-black" style={{ gridTemplateColumns: '50px 55px 70px 45px 50px 1fr' }}>
          <div className="px-2 py-2 border-r border-gray-300">Tech</div>
          <div className="px-2 py-2 border-r border-gray-300">Band</div>
          <div className="px-2 py-2 border-r border-gray-300">Cell Id</div>
          <div className="px-2 py-2 border-r border-gray-300">Zone</div>
          <div className="px-2 py-2 border-r border-gray-300">bs/mc</div>
          <div className="px-2 py-2">Rf Region</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="max-h-[350px] overflow-y-auto">
        {cells.map((cell, index) => (
          <div 
            key={index}
            className={`grid text-sm text-black border-b border-gray-200 cursor-pointer transition-colors ${
              selectedRow === index 
                ? 'bg-blue-100' 
                : index % 2 === 0 
                  ? 'bg-white hover:bg-gray-50' 
                  : 'bg-gray-50 hover:bg-gray-100'
            }`}
            style={{ gridTemplateColumns: '50px 55px 70px 45px 50px 1fr' }}
            onClick={() => handleRowClick(index, cell.cellId)}
          >
            <div className="px-2 py-2 border-r border-gray-200">{cell.tech}</div>
            <div className="px-2 py-2 border-r border-gray-200">{cell.band}</div>
            <div className="px-2 py-2 border-r border-gray-200 font-mono text-xs">{cell.cellId}</div>
            <div className="px-2 py-2 border-r border-gray-200">{cell.zone}</div>
            <div className="px-2 py-2 border-r border-gray-200">{cell.bsMc}</div>
            <div className="px-2 py-2">{cell.rfRegion}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoverageAttributePanel;
