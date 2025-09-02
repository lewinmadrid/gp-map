import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface LeftSidebarProps {
  className?: string;
  onExpandedChange?: (expanded: boolean) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ className = '', onExpandedChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandedChange?.(newState);
  };

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

  const DrawShapeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4L16 4L12 16Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const HazardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const FireIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M8.5 17.5C6 17.5 4 15.5 4 13C4 10.5 6 8.5 8.5 8.5C9.5 6.5 11.5 5.5 13.5 6.5C15.5 7.5 16.5 9.5 15.5 11.5C17.5 12.5 17.5 15.5 15.5 16.5C13.5 17.5 11 17.5 8.5 17.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  );

  const WeatherIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6 12C4.5 12 3 10.5 3 9C3 7.5 4.5 6 6 6C7 4 9 3 11 4C13 5 14 7 13 9H15C16.5 9 17.5 10.5 17 12C16.5 13.5 15 14 13.5 13.5H6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="6" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  );

  const ViewIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="2" y="4" width="4" height="4" stroke="currentColor" strokeWidth="2" fill="none" rx="1"/>
      <rect x="8" y="4" width="4" height="4" stroke="currentColor" strokeWidth="2" fill="none" rx="1"/>
      <rect x="14" y="4" width="4" height="4" stroke="currentColor" strokeWidth="2" fill="none" rx="1"/>
      <rect x="2" y="10" width="4" height="4" stroke="currentColor" strokeWidth="2" fill="none" rx="1"/>
      <rect x="8" y="10" width="4" height="4" stroke="currentColor" strokeWidth="2" fill="none" rx="1"/>
    </svg>
  );

  const HelpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M7.5 7.5C7.5 6.5 8.5 5.5 10 5.5S12.5 6.5 12.5 7.5C12.5 8.5 10 9.5 10 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="10" cy="15" r="0.5" fill="currentColor"/>
    </svg>
  );

  // Correct logo design based on reference image
  const LogoIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="50%" stopColor="#FF5252" />
          <stop offset="100%" stopColor="#D32F2F" />
        </linearGradient>
      </defs>
      {/* Stylized A */}
      <path d="M8 22L14 8L20 22" stroke="url(#logoGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 17H17" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Stylized Y */}
      <path d="M6 6L10 12L6 18" stroke="url(#logoGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 6L18 12L22 18" stroke="url(#logoGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const compactMenuItems = [
    { icon: MenuIcon, label: 'Menu', onClick: toggleExpanded },
    { icon: DrawShapeIcon, label: 'Draw Shape' },
    { icon: HazardIcon, label: 'Hazard Library' },
    { icon: FireIcon, label: 'Active Fires' },
    { icon: WeatherIcon, label: 'Weather' },
    { icon: ViewIcon, label: 'Current Operational View' }
  ];

  const expandedMenuItems = [
    { icon: DrawShapeIcon, label: 'Draw Shape' },
    { icon: HazardIcon, label: 'Hazard Library' },
    { icon: FireIcon, label: 'Active Fires' },
    { icon: WeatherIcon, label: 'Weather' },
    { icon: ViewIcon, label: 'Current Operational View' }
  ];

  if (isExpanded) {
    return (
      <div className={`fixed left-0 top-0 bottom-0 w-80 bg-slate-900 flex flex-col z-40 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <LogoIcon />
            </div>
            <h1 className="text-base font-medium text-gray-300">Genasys EVAC</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 text-gray-400 hover:text-white hover:bg-slate-800"
            onClick={toggleExpanded}
          >
            <MenuIcon />
          </Button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 p-4 space-y-2">
          {expandedMenuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
              >
                <IconComponent />
                <span className="text-xs">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
            <HelpIcon />
            <div>
              <div className="text-xs">Help and Support</div>
              <div className="text-xs text-gray-500">For Critical Issues: 1-619-431-3710</div>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              ZC
            </div>
            <div>
              <div className="text-xs">Genasys</div>
              <div className="text-xs text-gray-500">lclark@genasys.com</div>
            </div>
            <div className="ml-auto">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed left-0 top-0 bottom-0 w-16 bg-slate-900 flex flex-col items-center py-4 z-40 ${className}`}>
      {/* Logo */}
      <div className="mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-400 via-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
          <LogoIcon />
        </div>
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-2 flex-1">
        {compactMenuItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-slate-800"
              title={item.label}
              onClick={item.onClick}
            >
              <IconComponent />
            </Button>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="mt-auto">
        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-medium">
          ZC
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;