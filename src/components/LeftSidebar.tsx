import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Shield, LogOut } from 'lucide-react';
import { endSession } from '@/hooks/useActivityLogger';

interface LeftSidebarProps {
  className?: string;
  onExpandedChange?: (expanded: boolean) => void;
  isMobile?: boolean;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ className = '', onExpandedChange, isMobile = false }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInitials, setUserInitials] = useState("U");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");
      
      // Get initials from email
      const email = user.email || "";
      const initials = email.substring(0, 2).toUpperCase();
      setUserInitials(initials);
      
      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!roles);
    }
  };

  const handleLogout = async () => {
    try {
      await endSession();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Navigation will be handled by the auth state listener in Index.tsx
    } catch (error) {
      console.error('Error during logout:', error);
      // Force navigation even if there's an error
      navigate("/auth");
    }
  };

  const handleAdminPanel = () => {
    navigate("/admin");
  };

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

  // Logo design
  const LogoIcon = () => (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="47.9961" height="48.0002" rx="12.8" fill="#533546"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M19.2826 6.93752L30.3232 28.4771L28.8333 31.3977L19.2826 12.6029L10.9605 28.8747L8.06274 28.875L19.2826 6.93752Z" fill="#FF3464"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M28.728 41.1615L17.6775 19.57L19.1661 16.7014L28.728 35.4957L37.0428 19.2226L39.938 19.2223L28.728 41.1615Z" fill="#FF3464"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M16.775 21.7373L20.394 28.9315H13.0784L16.775 21.7373Z" fill="#FF3464"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M31.226 26.465L27.607 19.2709L34.9226 19.2709L31.226 26.465Z" fill="#FF3464"/>
    </svg>
  );

  const expandedMenuItems = [
    { icon: DrawShapeIcon, label: 'Draw Shape' },
    { icon: HazardIcon, label: 'Hazard Library' },
    { icon: FireIcon, label: 'Active Fires' },
    { icon: WeatherIcon, label: 'Weather' },
    { icon: ViewIcon, label: 'Current Operational View' }
  ];

  const compactMenuItems = [
    { icon: MenuIcon, label: 'Menu', onClick: toggleExpanded },
    { icon: DrawShapeIcon, label: 'Draw Shape' },
    { icon: HazardIcon, label: 'Hazard Library' },
    { icon: FireIcon, label: 'Active Fires' },
    { icon: WeatherIcon, label: 'Weather' },
    { icon: ViewIcon, label: 'Current Operational View' }
  ];

  // Mobile sidebar (full-screen sheet)
  if (isMobile) {
    return (
      <Sheet open={isExpanded} onOpenChange={toggleExpanded}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="fixed left-4 top-4 z-50 w-10 h-10 p-0 bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white rounded-lg"
          >
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full bg-slate-900 border-slate-700 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-700">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                <LogoIcon />
              </div>
              <h1 className="text-base font-medium text-gray-300">Genasys EVAC</h1>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white truncate">{userEmail}</div>
                      <div className="text-xs text-gray-500">User Account</div>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
                  <div className="px-2 py-2 text-sm text-gray-600 truncate">
                    {userEmail}
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem
                        onClick={handleAdminPanel}
                        className="flex items-center gap-2 hover:bg-gray-100 text-black cursor-pointer"
                      >
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 hover:bg-gray-100 text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  if (isExpanded) {
    return (
      <div className={`fixed left-0 top-0 bottom-0 w-80 bg-slate-900 flex flex-col z-40 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{userEmail}</div>
                  <div className="text-xs text-gray-500">User Account</div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
              <div className="px-2 py-2 text-sm text-gray-600 truncate">
                {userEmail}
              </div>
              <DropdownMenuSeparator />
              {isAdmin && (
                <>
                  <DropdownMenuItem
                    onClick={handleAdminPanel}
                    className="flex items-center gap-2 hover:bg-gray-100 text-black cursor-pointer"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-gray-100 text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed left-0 top-0 bottom-0 w-16 bg-slate-900 flex flex-col items-center py-4 z-40 ${className}`}>
      {/* Logo */}
      <div className="mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 bg-slate-700 rounded-full text-white hover:bg-slate-600"
            >
              <span className="text-xs font-medium">{userInitials}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg">
            <div className="px-2 py-2 text-sm text-gray-600 truncate">
              {userEmail}
            </div>
            <DropdownMenuSeparator />
            {isAdmin && (
              <>
                <DropdownMenuItem
                  onClick={handleAdminPanel}
                  className="flex items-center gap-2 hover:bg-gray-100 text-black cursor-pointer"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 hover:bg-gray-100 text-red-600 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default LeftSidebar;
