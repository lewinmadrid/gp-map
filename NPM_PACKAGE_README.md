# @your-org/gp-map-component

A configurable React map component with WMTS tile support, evacuation zones, drawing tools, and multiple map modes.

## Installation

```bash
npm install @your-org/gp-map-component
```

### Peer Dependencies

```bash
npm install react react-dom maplibre-gl shpjs lucide-react
```

## Quick Start

```tsx
import MapView from '@your-org/gp-map-component';
import '@your-org/gp-map-component/styles.css';

function App() {
  return (
    <MapView
      supabaseProjectUrl="https://your-project.supabase.co/functions/v1"
      initialCenter={[-117.1611, 32.7157]}
      initialZoom={13}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `supabaseProjectUrl` | `string` | - | Base URL for edge functions |
| `initialCenter` | `[number, number]` | `[-117.1611, 32.7157]` | Initial map center |
| `initialZoom` | `number` | `13` | Initial zoom level |
| `initialBasemap` | `BasemapOption` | `'topographic'` | Initial basemap |
| `initialMode` | `AppMode` | `'evac'` | Initial mode |
| `onActivityLog` | `(action, data) => void` | - | Activity logging callback |
| `onFeatureSelect` | `(features) => void` | - | Feature selection callback |
| `onModeChange` | `(mode) => void` | - | Mode change callback |
| `uiOptions` | `MapUIOptions` | - | UI visibility options |

## Edge Function Setup

Copy the templates from `templates/edge-functions/` to your Supabase project's `supabase/functions/` directory.

Set these secrets in Supabase:
- `WMTS_BASE_URL`
- `WMTS_LAYER`
- `WMTS_LABELS_LAYER`
- `WMTS_AUTH_HEADER`

See `templates/SECRETS.md` for details.

## Build for npm

```bash
npm run build:lib
```

Output will be in `dist/` directory.
