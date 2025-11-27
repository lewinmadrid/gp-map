import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { AlertTriangle, Shield } from 'lucide-react';

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
    </div>
  );
};

export default ModeToggle;