import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { AlertTriangle, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ModeToggleProps {
  mode: 'alert' | 'evac';
  onModeChange: (mode: 'alert' | 'evac') => void;
  sidebarExpanded?: boolean;
  isMobile?: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange, sidebarExpanded = false, isMobile = false }) => {
  const getLeftPosition = () => {
    if (isMobile) return 'left-4';
    if (mode === 'alert') return 'left-4';
    if (sidebarExpanded) return 'left-[336px]';
    return 'left-20';
  };

  return (
    <div className={`fixed bottom-4 z-50 transition-all duration-300 ${getLeftPosition()}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-background border border-border rounded-lg shadow-lg p-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {mode === 'alert' ? 'Alert' : 'EVAC'}
                </span>
                <Toggle
                  pressed={mode === 'evac'}
                  onPressedChange={(pressed) => onModeChange(pressed ? 'evac' : 'alert')}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8"
                >
                  {mode === 'alert' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                </Toggle>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs bg-white text-gray-700 px-4 py-3 rounded-2xl shadow-lg border border-gray-200 relative overflow-visible"
            sideOffset={12}
          >
            <p className="text-sm">Click here to switch modes. This button won't appear in the real implementation</p>
            <div className="absolute -bottom-2 left-[7rem] w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ModeToggle;