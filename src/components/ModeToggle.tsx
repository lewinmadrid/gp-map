import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import evacIcon from '@/assets/evac-icon.svg';
import alertIcon from '@/assets/alert-icon.svg';

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
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <div className="bg-background border border-border rounded-lg shadow-lg p-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {mode === 'alert' ? 'ALERT' : 'EVAC'}
                </span>
                <Toggle
                  pressed={mode === 'evac'}
                  onPressedChange={(pressed) => onModeChange(pressed ? 'evac' : 'alert')}
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                >
                  {mode === 'alert' ? (
                    <img src={alertIcon} alt="Alert" className="h-10 w-10 rounded" />
                  ) : (
                    <img src={evacIcon} alt="EVAC" className="h-10 w-10 rounded" />
                  )}
                </Toggle>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs bg-black text-white px-4 py-3 rounded-2xl shadow-lg border-black relative overflow-visible"
            sideOffset={12}
          >
            <p className="text-sm">Click here to switch modes. This button won't appear in the real implementation</p>
            <div className={`absolute -bottom-2 w-4 h-4 bg-black rotate-45 ${mode === 'alert' ? 'left-[5rem]' : 'left-[8.75rem]'}`} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ModeToggle;