import React from 'react';
import { Button } from '@/components/ui/button';

interface LeftSidebarProps {
  className?: string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ className = '' }) => {
  // Custom SVG icons matching the reference image style
  const AnalysisIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 15L8 10L12 14L17 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 6V9H14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const MenuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 6H17M3 12H17M3 18H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const LocationIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M10 7V3M10 17V13M13 10H17M3 10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const ResetIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 12A9 9 0 1 0 6 4.64" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M3 8V12H7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ViewIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3C14.5 3 18 7.5 18 10C18 12.5 14.5 17 10 17C5.5 17 2 12.5 2 10C2 7.5 5.5 3 10 3Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12.5 1.5L11.5 4.5L8.5 4.5L7.5 1.5M12.5 18.5L11.5 15.5L8.5 15.5L7.5 18.5M18.5 7.5L15.5 8.5L15.5 11.5L18.5 12.5M1.5 7.5L4.5 8.5L4.5 11.5L1.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  const HelpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M7.5 7.5C7.5 6.5 8.5 5.5 10 5.5S12.5 6.5 12.5 7.5C12.5 8.5 10 9.5 10 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="10" cy="15" r="0.5" fill="currentColor"/>
    </svg>
  );

  const menuItems = [
    { icon: AnalysisIcon, label: 'Analysis', active: true },
    { icon: MenuIcon, label: 'Menu' },
    { icon: LocationIcon, label: 'Location' },
    { icon: ResetIcon, label: 'Reset' },
    { icon: ViewIcon, label: 'View' },
    { icon: SettingsIcon, label: 'Settings' },
    { icon: HelpIcon, label: 'Help' }
  ];

  return (
    <div className={`fixed left-0 top-0 bottom-0 w-16 bg-gray-900 flex flex-col items-center py-4 z-40 ${className}`}>
      {/* Logo/Brand area */}
      <div className="mb-6">
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeWidth="2" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" strokeWidth="2" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" strokeWidth="2" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-2 flex-1">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
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
              <IconComponent />
            </Button>
          );
        })}
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