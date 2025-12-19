import { useState } from 'react';
import { MapView } from '@pge/lovable-map-component';

function App() {
  const [coordinates, setCoordinates] = useState<[number, number]>([-117.1611, 32.7157]);
  const [zoom, setZoom] = useState(13);

  return (
    <div className="h-screen flex flex-col">
      {/* Title Bar */}
      <header className="h-14 bg-slate-800 text-white flex items-center justify-between px-6 shadow-lg shrink-0">
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
          onMapMove={(center, z) => {
            setCoordinates(center);
            setZoom(z);
          }}
          onActivityLog={(action, data) => {
            console.log('Map activity:', action, data);
          }}
        />
      </div>

      {/* Footer Bar */}
      <footer className="h-10 bg-slate-900 text-white flex items-center justify-between px-6 text-sm shrink-0 font-mono">
        <div className="flex gap-6">
          <span>
            Lat: <span className="text-emerald-400">{coordinates[1].toFixed(5)}</span>
          </span>
          <span>
            Lng: <span className="text-emerald-400">{coordinates[0].toFixed(5)}</span>
          </span>
        </div>
        <span>
          Zoom: <span className="text-sky-400">{zoom.toFixed(2)}</span>
        </span>
      </footer>
    </div>
  );
}

export default App;
