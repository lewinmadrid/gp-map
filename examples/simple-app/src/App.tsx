import { MapView } from '@pge/lovable-map-component';

function App() {
  return (
    <div className="h-screen flex flex-col">
      {/* Title Bar */}
      <header className="h-16 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg shrink-0">
        <h1 className="text-xl font-bold">My Map Application</h1>
        <span className="text-sm text-slate-400">Simple Example</span>
      </header>

      {/* Map - takes remaining height */}
      <div className="flex-1">
        <MapView
          initialCenter={[-117.1611, 32.7157]}
          initialZoom={13}
          initialBasemap="topographic"
          uiOptions={{
            showLayersPanel: true,
            showBasemapToggle: true,
            showZoomControls: true,
            showModeToggle: false,
            showToolsPopup: false,
            showLegend: false,
            showLeftSidebar: false,
            showTopToolbar: false,
            showNewsToolbar: false,
          }}
          onActivityLog={(action, data) => {
            console.log('Map activity:', action, data);
          }}
        />
      </div>
    </div>
  );
}

export default App;
