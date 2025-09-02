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
}

const ToolsPopup: React.FC<ToolsPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const tools = [
    { icon: Menu, label: 'Display Legend' },
    { icon: Ruler, label: 'Measure Distance' },
    { icon: Crosshair, label: 'Move to Current Location' }
  ];

  return (
    <div className="absolute bottom-[12rem] right-4 z-50 flex flex-col gap-1">
      {tools.map((tool, index) => (
        <Button
          key={index}
          variant="secondary"
          size="sm"
          className="w-10 h-10 p-0 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          onClick={onClose}
        >
          <tool.icon className="h-4 w-4 text-gray-600" />
        </Button>
      ))}
    </div>
  );
};

export default ToolsPopup;