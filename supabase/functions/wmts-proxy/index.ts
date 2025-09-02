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
    
    // Expect path format: /functions/v1/wmts-proxy/{z}/{x}/{y}
    if (pathParts.length < 7 || pathParts[3] !== 'wmts-proxy') {
      console.log('Path parsing debug:', { pathParts, length: pathParts.length })
      return new Response('Invalid path format. Expected: /functions/v1/wmts-proxy/{z}/{x}/{y}', { 
        status: 400,
        headers: corsHeaders
      })
    }

    const z = pathParts[4]
    const x = pathParts[5]  
    const y = pathParts[6]

    console.log(`Fetching WMTS tile: z=${z}, x=${x}, y=${y}`)

    // Build the WMTS URL
    const wmtsUrl = `https://geospatialemp.demo.zonehaven.com/geoserver/gwc/service/wmts?` +
      `layer=ZoneHaven%3AEvacuationZones&` +
      `style=&` +
      `tilematrixset=EPSG%3A900913&` +
      `Service=WMTS&` +
      `Request=GetTile&` +
      `Version=1.0.0&` +
      `Format=application%2Fx-protobuf%3Btype%3Dmapbox-vector&` +
      `TileMatrix=EPSG%3A900913%3A${z}&` +
      `TileCol=${x}&` +
      `TileRow=${y}`

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