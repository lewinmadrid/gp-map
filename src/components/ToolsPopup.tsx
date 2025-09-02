import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu,
  Ruler,
  Navigation,
  MapPin
} from 'lucide-react';

interface ToolsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ToolsPopup: React.FC<ToolsPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const tools = [
    { icon: Menu, label: 'Menu' },
    { icon: Ruler, label: 'Measure' },
    { icon: Navigation, label: 'Navigation' },
    { icon: MapPin, label: 'Pin' }
  ];

  return (
    <div className="absolute bottom-16 right-4 bg-background border border-border rounded-lg shadow-lg z-50">
      <div className="flex flex-col">
        {tools.map((tool, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="w-12 h-12 p-0 rounded-none first:rounded-t-lg last:rounded-b-lg hover:bg-accent"
            onClick={onClose}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ToolsPopup;