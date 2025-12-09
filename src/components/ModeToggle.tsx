import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import evacIcon from '@/assets/evac-icon.svg';
import alertIcon from '@/assets/alert-icon.svg';
import { Newspaper } from 'lucide-react';

export type AppMode = 'evac' | 'alert' | 'news';

interface ModeToggleProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  sidebarExpanded?: boolean;
  isMobile?: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange, sidebarExpanded = false, isMobile = false }) => {
  const modes: AppMode[] = ['evac', 'alert', 'news'];
  
  const getLeftPosition = () => {
    if (isMobile) return 'left-4';
    if (mode === 'alert' || mode === 'news') return 'left-4';
    if (sidebarExpanded) return 'left-[336px]';
    return 'left-20';
  };

  const getModeLabel = (m: AppMode) => {
    return m.toUpperCase();
  };

  const getModeIcon = (m: AppMode) => {
    switch (m) {
      case 'evac':
        return <img src={evacIcon} alt="EVAC" className="h-6 w-6 rounded" />;
      case 'alert':
        return <img src={alertIcon} alt="Alert" className="h-6 w-6 rounded" />;
      case 'news':
        return <Newspaper className="h-6 w-6" />;
    }
  };

  const cycleMode = () => {
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onModeChange(modes[nextIndex]);
  };

  return (
    <div className={`fixed bottom-4 z-50 transition-all duration-300 ${getLeftPosition()}`}>
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button
              onClick={cycleMode}
              className="bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-2 hover:bg-accent transition-colors"
            >
              {getModeIcon(mode)}
              <span className="text-sm font-medium text-foreground">
                {getModeLabel(mode)}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs bg-black text-white px-4 py-3 rounded-2xl shadow-lg border-black relative overflow-visible"
            sideOffset={12}
          >
            <p className="text-sm">Click here to switch modes. This button won't appear in the real implementation</p>
            <div className="absolute -bottom-2 left-12 w-4 h-4 bg-black rotate-45" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ModeToggle;