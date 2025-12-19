/**
 * WMTS Proxy Edge Function
 * 
 * This edge function proxies WMTS tile requests to your GeoServer/GeoWebCache instance.
 * 
 * Required Supabase Secrets:
 * - WMTS_BASE_URL: Base URL of your WMTS server (e.g., "https://your-geoserver.com/geoserver/gwc/service/wmts")
 * - WMTS_LAYER: Layer name (e.g., "namespace:layer_name")
 * - WMTS_AUTH_HEADER: Basic auth header (e.g., "Basic base64encodedcredentials")
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected path: /wmts-proxy/{z}/{x}/{y}
    const zIndex = pathParts.indexOf('wmts-proxy') + 1;
    if (zIndex === 0 || pathParts.length < zIndex + 3) {
      return new Response('Invalid path. Expected: /wmts-proxy/{z}/{x}/{y}', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const z = parseInt(pathParts[zIndex]);
    const x = parseInt(pathParts[zIndex + 1]);
    const y = parseInt(pathParts[zIndex + 2]);

    console.info(`Fetching WMTS tile: z=${z}, x=${x}, y=${y}`);

    // Get configuration from environment
    const wmtsBaseUrl = Deno.env.get('WMTS_BASE_URL') || 'https://your-geoserver.com/geoserver/gwc/service/wmts';
    const wmtsLayer = Deno.env.get('WMTS_LAYER') || 'namespace:evacuation_zone_details';
    const wmtsAuthHeader = Deno.env.get('WMTS_AUTH_HEADER') || '';

    // Build WMTS URL
    const wmtsUrl = new URL(wmtsBaseUrl);
    wmtsUrl.searchParams.set('REQUEST', 'GetTile');
    wmtsUrl.searchParams.set('SERVICE', 'WMTS');
    wmtsUrl.searchParams.set('VERSION', '1.0.0');
    wmtsUrl.searchParams.set('LAYER', wmtsLayer);
    wmtsUrl.searchParams.set('STYLE', '');
    wmtsUrl.searchParams.set('TILEMATRIX', `EPSG:900913:${z}`);
    wmtsUrl.searchParams.set('TILEMATRIXSET', 'EPSG:900913');
    wmtsUrl.searchParams.set('FORMAT', 'application/vnd.mapbox-vector-tile');
    wmtsUrl.searchParams.set('TILECOL', x.toString());
    wmtsUrl.searchParams.set('TILEROW', y.toString());
    wmtsUrl.searchParams.set('cacheVersion', Date.now().toString());

    console.info(`Requesting: ${wmtsUrl.toString()}`);

    const headers: Record<string, string> = {};
    if (wmtsAuthHeader) {
      headers['Authorization'] = wmtsAuthHeader;
    }

    const response = await fetch(wmtsUrl.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error(`WMTS request failed: ${response.status} ${response.statusText}`);
      return new Response(`WMTS request failed: ${response.status}`, {
        status: response.status,
        headers: corsHeaders,
      });
    }

    const tileData = await response.arrayBuffer();
    console.info(`Successfully fetched tile: ${tileData.byteLength} bytes`);

    return new Response(tileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.mapbox-vector-tile',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching WMTS tile:', error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
