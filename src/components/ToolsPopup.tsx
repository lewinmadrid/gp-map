import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu,
  Ruler,
  Crosshair
} from 'lucide-react';

interface ToolsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMeasure: () => void;
  onGeolocation: () => void;
  onLegend: () => void;
  measurementMode: boolean;
  isMobile?: boolean;
}

const ToolsPopup: React.FC<ToolsPopupProps> = ({ isOpen, onClose, onMeasure, onGeolocation, onLegend, measurementMode, isMobile = false }) => {
  if (!isOpen) return null;

  const tools = [
    { 
      icon: Menu, 
      label: 'Display Legend',
      onClick: () => {
        onLegend();
        onClose();
      }
    },
    { 
      icon: Ruler, 
      label: 'Measure Distance',
      onClick: () => {
        onMeasure();
        // Don't close the popup when measuring
      }
    },
    { 
      icon: Crosshair, 
      label: 'Move to Current Location',
      onClick: () => {
        onGeolocation();
        onClose();
      }
    }
  ];

  return (
    <div className={`absolute ${isMobile ? 'bottom-20 right-4' : 'bottom-[12rem] right-4'} z-50 flex flex-col gap-1`}>
      {tools.map((tool, index) => (
        <Button
          key={index}
          variant="secondary"
          size="sm"
          className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} p-0 border border-gray-200 shadow-sm ${
            index === 1 && measurementMode 
              ? 'bg-blue-100 hover:bg-blue-200 text-blue-600' 
              : 'bg-white hover:bg-gray-50 text-gray-600'
          }`}
          onClick={tool.onClick}
        >
          <tool.icon className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
        </Button>
      ))}
    </div>
  );
};

export default ToolsPopup;