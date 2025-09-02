/**
 * CORS Proxy utilities for handling cross-origin requests
 */

export interface ProxyOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Attempts to fetch a resource directly, falls back to CORS proxy if needed
 */
export async function fetchWithCorsProxy(
  url: string, 
  options: ProxyOptions = {}
): Promise<Response> {
  const { headers = {}, timeout = 10000 } = options;

  // First attempt: Direct fetch
  try {
    console.log(`🌐 Attempting direct fetch: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      mode: 'cors'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ Direct fetch successful: ${url}`);
      return response;
    }
    
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
  } catch (error) {
    console.log(`❌ Direct fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Second attempt: CORS proxy fallback
    return fetchViaProxy(url, options);
  }
}

/**
 * Fetches via CORS proxy services
 */
async function fetchViaProxy(url: string, options: ProxyOptions = {}): Promise<Response> {
  const { headers = {}, timeout = 15000 } = options;
  
  // List of CORS proxy services to try
  const proxyServices = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`
  ];

  for (const proxyUrl of proxyServices) {
    try {
      console.log(`🔄 Trying proxy: ${proxyUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(proxyUrl, {
        ...options,
        headers: {
          ...headers,
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Proxy fetch successful via: ${proxyUrl}`);
        return response;
      }
      
      console.log(`❌ Proxy failed with status: ${response.status}`);
      
    } catch (error) {
      console.log(`❌ Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      continue;
    }
  }
  
  throw new Error('All CORS proxy attempts failed');
}

/**
 * Creates a vector tile URL with CORS proxy fallback
 */
export function createVectorTileUrl(baseUrl: string, useProxy = false): string {
  if (!useProxy) {
    return baseUrl;
  }
  
  // Use allorigins as it's most reliable for tile requests
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;
}

/**
 * Validates if a URL supports vector tiles
 */
export async function validateVectorTileEndpoint(url: string): Promise<boolean> {
  try {
    // Test with a sample tile request
    const testUrl = url
      .replace('{z}', '10')
      .replace('{x}', '163')
      .replace('{y}', '395');
    
    const response = await fetchWithCorsProxy(testUrl, {
      timeout: 5000,
      headers: {
        'Accept': 'application/vnd.mapbox-vector-tile,application/x-protobuf'
      }
    });
    
    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('application/vnd.mapbox-vector-tile') || 
           contentType.includes('application/x-protobuf');
           
  } catch (error) {
    console.error('Vector tile validation failed:', error);
    return false;
  }
}