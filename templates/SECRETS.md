# Required Supabase Secrets

To use the WMTS proxy edge functions, you need to configure the following secrets in your Supabase project.

## Setting Secrets

Go to your Supabase Dashboard > Project Settings > Edge Functions > Secrets

Or use the Supabase CLI:

```bash
supabase secrets set WMTS_BASE_URL="https://your-geoserver.com/geoserver/gwc/service/wmts"
supabase secrets set WMTS_LAYER="namespace:evacuation_zone_details"
supabase secrets set WMTS_LABELS_LAYER="namespace:evacuation_zone_ids"
supabase secrets set WMTS_AUTH_HEADER="Basic your-base64-encoded-credentials"
```

## Required Secrets

### WMTS_BASE_URL
Base URL of your WMTS/GeoWebCache server.

**Example:** `https://geoserver.example.com/geoserver/gwc/service/wmts`

### WMTS_LAYER
The main layer name for evacuation zone polygons.

**Example:** `zonehaven:evacuation_zone_details`

### WMTS_LABELS_LAYER
The layer name for evacuation zone labels/IDs.

**Example:** `zonehaven:evacuation_zone_ids`

### WMTS_AUTH_HEADER
Basic authentication header for the WMTS server.

To create this:
1. Combine username and password: `username:password`
2. Base64 encode it: `echo -n "username:password" | base64`
3. Prefix with "Basic ": `Basic dXNlcm5hbWU6cGFzc3dvcmQ=`

**Example:** `Basic dXNlcm5hbWU6cGFzc3dvcmQ=`

## Testing

After setting up secrets, test your edge functions:

```bash
curl https://your-project.supabase.co/functions/v1/wmts-proxy/13/1430/3307
```

If successful, you should receive vector tile data (binary response).
