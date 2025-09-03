import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    // Expect path format: /wmts-proxy/{z}/{x}/{y}
    if (pathParts.length < 4 || pathParts[0] !== 'wmts-proxy') {
      console.log('Path parsing debug:', { pathParts, length: pathParts.length })
      return new Response('Invalid path format. Expected: /wmts-proxy/{z}/{x}/{y}', { 
        status: 400,
        headers: corsHeaders
      })
    }

    const z = pathParts[1]
    const x = pathParts[2]  
    const y = pathParts[3]

    console.log(`Fetching WMTS tile: z=${z}, x=${x}, y=${y}`)

    // Build the WMTS URL - using GeoWebCache format
    const wmtsUrl = `https://geospatialemp.beta.zonehaven.com/geoserver/gwc/service/wmts?` +
      `REQUEST=GetTile&` +
      `SERVICE=WMTS&` +
      `VERSION=1.0.0&` +
      `LAYER=zonehaven:evacuation_zone_details&` +
      `STYLE=&` +
      `TILEMATRIX=EPSG:900913:${z}&` +
      `TILEMATRIXSET=EPSG:900913&` +
      `FORMAT=application/vnd.mapbox-vector-tile&` +
      `TILECOL=${x}&` +
      `TILEROW=${y}&` +
      `cacheVersion=${Date.now()}`

    console.log(`Requesting: ${wmtsUrl}`)

    // Fetch the tile from the WMTS service
    const response = await fetch(wmtsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
    })

    if (!response.ok) {
      console.error(`WMTS request failed: ${response.status} ${response.statusText}`)
      return new Response(`WMTS request failed: ${response.status}`, {
        status: response.status,
        headers: corsHeaders
      })
    }

    // Get the response as array buffer to preserve binary data
    const arrayBuffer = await response.arrayBuffer()
    
    console.log(`Successfully fetched tile: ${arrayBuffer.byteLength} bytes`)

    // Return the tile with proper headers
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/x-protobuf',
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error in wmts-proxy:', error)
    return new Response(`Internal server error: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    })
  }
})