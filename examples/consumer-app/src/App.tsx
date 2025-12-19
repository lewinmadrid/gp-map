import { useState, useCallback } from 'react';
import MapView from '@pge/lovable-map-component';
// Import styles from the package
// import '@pge/lovable-map-component/styles.css';

// Types from the package
import type { AppMode, MapUIOptions } from '@pge/lovable-map-component';

function App() {
  const [activityLogs, setActivityLogs] = useState<Array<{ action: string; data?: any; timestamp: Date }>>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<any[]>([]);
  const [currentMode, setCurrentMode] = useState<AppMode>('evac');
  const [showLogs, setShowLogs] = useState(false);

  // Custom activity logger - integrate with your own analytics/logging system
  const handleActivityLog = useCallback((action: string, data?: any) => {
    console.log('[Activity Log]', action, data);
    setActivityLogs(prev => [...prev.slice(-49), { action, data, timestamp: new Date() }]);
    
    // Example: Send to your analytics service
    // analytics.track(action, data);
  }, []);

  // Handle feature selection
  const handleFeatureSelect = useCallback((features: any[]) => {
    console.log('[Feature Selected]', features);
    setSelectedFeatures(features);
  }, []);

  // Handle mode changes
  const handleModeChange = useCallback((mode: AppMode) => {
    console.log('[Mode Changed]', mode);
    setCurrentMode(mode);
  }, []);

  // UI configuration - customize which elements to show
  const uiOptions: MapUIOptions = {
    showLayersPanel: true,
    showBasemapToggle: true,
    showToolsPopup: true,
    showLegend: true,
    showModeToggle: true,
    showLeftSidebar: true,
    showTopToolbar: true,
    showNewsToolbar: true,
    showSearchBar: true,
    showZoomControls: true,
    showAttributePanel: true,
  };

  return (
    <div className="relative w-full h-screen">
      {/* Map Component */}
      <MapView
        // Supabase project URL for WMTS tile loading
        // Replace with your own Supabase project URL
        supabaseProjectUrl="https://your-project.supabase.co/functions/v1"
        
        // Initial map state
        initialCenter={[-117.1611, 32.7157]} // San Diego
        initialZoom={13}
        initialBasemap="topographic"
        initialMode="evac"
        
        // Callbacks
        onActivityLog={handleActivityLog}
        onFeatureSelect={handleFeatureSelect}
        onModeChange={handleModeChange}
        
        // UI configuration
        uiOptions={uiOptions}
        
        // Optional custom className
        className="w-full h-full"
      />

      {/* Debug Panel - Shows activity logs and selected features */}
      <div className="absolute bottom-4 right-4 z-50">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-white transition-colors"
        >
          {showLogs ? 'Hide' : 'Show'} Debug Panel
        </button>
      </div>

      {showLogs && (
        <div className="absolute bottom-16 right-4 z-50 w-96 max-h-80 overflow-auto bg-white/95 backdrop-blur rounded-lg shadow-xl p-4">
          <div className="space-y-4">
            {/* Current State */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Current State</h3>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Mode:</span> {currentMode}</p>
                <p><span className="font-medium">Selected Features:</span> {selectedFeatures.length}</p>
              </div>
            </div>

            {/* Selected Features */}
            {selectedFeatures.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Selected Features</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(selectedFeatures, null, 2)}
                </pre>
              </div>
            )}

            {/* Activity Logs */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">
                Activity Logs ({activityLogs.length})
              </h3>
              <div className="space-y-1 max-h-32 overflow-auto">
                {activityLogs.slice().reverse().map((log, i) => (
                  <div key={i} className="text-xs bg-gray-50 p-1.5 rounded">
                    <span className="text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    {' - '}
                    <span className="font-medium">{log.action}</span>
                    {log.data && (
                      <span className="text-gray-600 ml-1">
                        {JSON.stringify(log.data).slice(0, 50)}...
                      </span>
                    )}
                  </div>
                ))}
                {activityLogs.length === 0 && (
                  <p className="text-gray-400 text-xs">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
