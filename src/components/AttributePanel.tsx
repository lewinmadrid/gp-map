import React, { useState } from 'react';
import { X, ChevronUp, ChevronDown, Copy, ZoomIn, Table } from 'lucide-react';
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

  if (!feature || !feature.properties) return null;

  // Filter out internal/geometry properties and format for display
  const attributes = Object.entries(feature.properties).filter(([key]) => {
    const excludeKeys = ['_vectorTileFeature', 'layerName'];
    return !excludeKeys.includes(key);
  });

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      // Format large numbers with commas
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
    <div className="absolute top-20 right-4 z-30 bg-white shadow-xl border border-gray-300 min-w-[380px] max-w-[450px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h3 className="font-medium text-gray-900 text-base">{layerName.replace(/_/g, '_')}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-gray-100"
            onClick={handleCopy}
            title="Copy attributes"
          >
            <Copy className="h-4 w-4 text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-gray-100"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-gray-100"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50">
            <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
              <Table className="h-4 w-4" />
              <span>Table</span>
            </button>
            <button 
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
              onClick={onZoomTo}
            >
              <ZoomIn className="h-4 w-4" />
              <span>Zoom to</span>
            </button>
          </div>

          {/* Attributes Table */}
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <tbody>
                {attributes.map(([key, value], index) => (
                  <tr 
                    key={key} 
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-700 border-r border-gray-200 w-[45%]">
                      {key}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-900">
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
