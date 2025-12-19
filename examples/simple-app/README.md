# Simple Map App

A minimal example demonstrating how to use the `@pge/lovable-map-component` package.

## Setup

1. **Configure npm for GitHub Packages**

   Create a `.npmrc` file in this directory:

   ```
   @pge:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
   ```

   Replace `YOUR_GITHUB_PAT` with a GitHub Personal Access Token that has `read:packages` scope.

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

## Features

- Clean title bar at the top
- Full-screen MapView component
- Minimal UI configuration (layers panel, basemap toggle, zoom controls only)
- Activity logging to console

## Customization

You can customize the MapView by modifying the props in `src/App.tsx`:

- `initialCenter` - Starting map center [longitude, latitude]
- `initialZoom` - Starting zoom level
- `initialBasemap` - Starting basemap ('satellite', 'streets', 'topographic', 'terrain')
- `uiOptions` - Control which UI elements are visible
- `onActivityLog` - Callback for user activity events
