export type BasemapOption = 
  | 'satellite' 
  | 'streets' 
  | 'topographic' 
  | 'terrain'
  | 'google-satellite'
  | 'google-roads'
  | 'google-hybrid'
  | 'google-terrain';

export type AppMode = 'evac' | 'alert' | 'news';

export interface MapUIOptions {
  showLayersPanel?: boolean;
  showBasemapToggle?: boolean;
  showToolsPopup?: boolean;
  showLegend?: boolean;
  showModeToggle?: boolean;
  showLeftSidebar?: boolean;
  showTopToolbar?: boolean;
  showNewsToolbar?: boolean;
  showSearchBar?: boolean;
  showZoomControls?: boolean;
  showAttributePanel?: boolean;
}

export interface CoverageFilters {
  tech: string;
  band: string;
  utm: string;
  bsMc: string;
}

/**
 * Default Supabase project URL for the zonehaven-map edge functions.
 * Consumers can use this or provide their own Supabase project URL.
 */
export const DEFAULT_SUPABASE_PROJECT_URL = 'https://lwkcovcbhdotptzphevc.supabase.co/functions/v1';

export interface MapViewProps {
  /**
   * Base URL for Supabase edge functions (e.g., "https://xxx.supabase.co/functions/v1")
   * If not provided, defaults to the zonehaven-map project's edge functions.
   * Set to null/undefined to explicitly disable WMTS layers.
   * @default 'https://lwkcovcbhdotptzphevc.supabase.co/functions/v1'
   */
  supabaseProjectUrl?: string | null;
  
  /**
   * Initial map center [longitude, latitude]
   * @default [-117.1611, 32.7157] (San Diego)
   */
  initialCenter?: [number, number];
  
  /**
   * Initial zoom level
   * @default 13
   */
  initialZoom?: number;
  
  /**
   * Initial basemap
   * @default 'topographic'
   */
  initialBasemap?: BasemapOption;
  
  /**
   * Initial mode
   * @default 'evac'
   */
  initialMode?: AppMode;
  
  /**
   * Callback for activity logging
   * Called when user performs actions like selecting features, changing basemap, etc.
   */
  onActivityLog?: (actionType: string, actionData?: Record<string, any>) => void;
  
  /**
   * Callback when features are selected on the map
   */
  onFeatureSelect?: (features: any[]) => void;
  
  /**
   * Callback when mode changes
   */
  onModeChange?: (mode: AppMode) => void;
  
  /**
   * Callback when map moves (pan, zoom)
   * Returns center coordinates and zoom level
   */
  onMapMove?: (center: [number, number], zoom: number) => void;
  
  /**
   * UI options to show/hide various map controls
   */
  uiOptions?: MapUIOptions;
  
  /**
   * Additional CSS class for the map container
   */
  className?: string;
}
