# Example Consumer App

This example demonstrates how to use the `@pge/lovable-map-component` package in a React application.

## Prerequisites

1. Build the main package first:
   ```bash
   cd ../..
   npm run build:lib
   ```

2. Set up Supabase edge functions (optional, for WMTS layers):
   - Copy templates from `templates/edge-functions/` to your Supabase project
   - Configure secrets as described in `templates/SECRETS.md`

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Usage Example

```tsx
import MapView from '@pge/lovable-map-component';
import '@pge/lovable-map-component/styles.css';

function App() {
  return (
    <MapView
      supabaseProjectUrl="https://your-project.supabase.co/functions/v1"
      initialCenter={[-117.1611, 32.7157]}
      initialZoom={13}
      initialBasemap="topographic"
      initialMode="evac"
      onActivityLog={(action, data) => console.log('Activity:', action, data)}
      onFeatureSelect={(features) => console.log('Selected:', features)}
      onModeChange={(mode) => console.log('Mode changed:', mode)}
      uiOptions={{
        showLayersPanel: true,
        showBasemapToggle: true,
        showToolsPopup: true,
        showLegend: true,
        showModeToggle: true,
        showLeftSidebar: true,
        showTopToolbar: true,
        showSearchBar: true,
        showZoomControls: true,
      }}
    />
  );
}
```

## Configuration Options

### UI Options

Control which UI elements are visible:

| Option | Default | Description |
|--------|---------|-------------|
| `showLayersPanel` | `true` | Layer control panel |
| `showBasemapToggle` | `true` | Basemap switcher |
| `showToolsPopup` | `true` | Measurement/drawing tools |
| `showLegend` | `true` | Map legend |
| `showModeToggle` | `true` | Mode switcher (evac/alert/news) |
| `showLeftSidebar` | `true` | Left sidebar with search |
| `showTopToolbar` | `true` | Top toolbar |
| `showSearchBar` | `true` | Address search |
| `showZoomControls` | `true` | Zoom in/out buttons |

### Callbacks

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onActivityLog` | `(action: string, data?: any)` | Called when user performs actions |
| `onFeatureSelect` | `(features: any[])` | Called when features are selected |
| `onModeChange` | `(mode: AppMode)` | Called when mode changes |
