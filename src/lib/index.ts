// Main component export
export { default as MapView } from './MapView';

// Type exports
export type { 
  MapViewProps, 
  MapUIOptions, 
  BasemapOption, 
  AppMode,
  CoverageFilters 
} from './types';

// Re-export supporting components for advanced customization
export { default as LayersPanel } from '../components/LayersPanel';
export { default as BasemapToggle } from '../components/BasemapToggle';
export { default as Legend } from '../components/Legend';
export { default as LeftSidebar } from '../components/LeftSidebar';
export { default as TopToolbar } from '../components/TopToolbar';
export { default as NewsToolbar } from '../components/NewsToolbar';
export { default as ModeToggle } from '../components/ModeToggle';
export { default as AttributePanel } from '../components/AttributePanel';
export { default as CoverageAttributePanel } from '../components/CoverageAttributePanel';
export { default as ToolsPopup } from '../components/ToolsPopup';
export { default as WelcomeDialog } from '../components/WelcomeDialog';
export { default as ErrorBoundary } from '../components/ErrorBoundary';

// Hooks
export { useActivityLogger } from './hooks/useActivityLogger';
export { useIsMobile } from './hooks/use-mobile';
