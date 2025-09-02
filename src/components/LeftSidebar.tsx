import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Triangle,
  Menu,
  Crosshair,
  RotateCcw,
  Eye,
  Settings,
  HelpCircle
} from 'lucide-react';

interface LeftSidebarProps {
  className?: string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ className = '' }) => {
  const menuItems = [
    { icon: Triangle, label: 'Analysis', active: true },
    { icon: Menu, label: 'Menu' },
    { icon: Crosshair, label: 'Location' },
    { icon: RotateCcw, label: 'Reset' },
    { icon: Eye, label: 'View' },
    { icon: Settings, label: 'Settings' },
    { icon: HelpCircle, label: 'Help' }
  ];

  return (
    <div className={`fixed left-0 top-0 bottom-0 w-16 bg-gray-900 flex flex-col items-center py-4 z-40 ${className}`}>
      {/* Logo/Brand area */}
      <div className="mb-6">
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
          <Triangle className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-2 flex-1">
        {menuItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={`w-10 h-10 p-0 rounded-lg transition-colors ${
              item.active 
                ? 'bg-gray-700 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      {/* Bottom section */}
      <div className="mt-auto">
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs font-medium">
          7C
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;