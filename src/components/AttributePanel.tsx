import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, Copy, ZoomIn, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttributePanelProps {
  feature: any;
  layerName: string;
  onClose: () => void;
  onZoomTo: () => void;
}

const AttributePanel: React.FC<AttributePanelProps> = ({
  feature,
  layerName,
  onClose,
  onZoomTo
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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

  if (!feature || !feature.properties) return null;

  // Filter out internal/geometry properties and format for display
  const attributes = Object.entries(feature.properties).filter(([key]) => {
    const excludeKeys = ['_vectorTileFeature', 'layerName'];
    return !excludeKeys.includes(key);
  });

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return String(value);
  };

  const handleCopy = () => {
    const text = attributes
      .map(([key, value]) => `${key}: ${formatValue(value)}`)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div 
      ref={panelRef}
      className="absolute z-30 bg-white shadow-lg border border-gray-300 min-w-[280px] max-w-[320px]"
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
          <h3 className="font-medium text-gray-900 text-xs">{layerName.replace(/_/g, '_')}</h3>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={handleCopy}
            title="Copy attributes"
          >
            <Copy className="h-3 w-3 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronUp className="h-3 w-3 text-gray-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={onClose}
            title="Close"
          >
            <X className="h-3 w-3 text-gray-500" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Toolbar */}
          <div className="flex items-center px-3 py-1.5 border-b border-gray-200 bg-gray-50">
            <button 
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
              onClick={onZoomTo}
            >
              <ZoomIn className="h-3 w-3" />
              <span>Zoom to</span>
            </button>
          </div>

          {/* Attributes Table */}
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <tbody>
                {attributes.map(([key, value], index) => (
                  <tr 
                    key={key} 
                    className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}
                  >
                    <td className="px-3 py-1.5 text-xs font-medium text-gray-700 border-r border-gray-200 w-[45%]">
                      {key}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-gray-900">
                      {formatValue(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AttributePanel;
