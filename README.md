# Window-Open Advisor

Intelligent ventilation advisor for real-world rooms. Combines indoor CO₂ physics estimation, outdoor air quality forecasting (Open-Meteo), and occupancy sensing to tell you exactly when to open your window.

## Environment Variables (Build Time)

Because the application is configured for static export (`output: 'export'`) to host on AWS Amplify or any static CDN, all environment variables prefixed with `NEXT_PUBLIC_` are read and inlined into the client bundle **at build time**:

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API serving live sensor readings (`/latest`). If omitted or unreachable, the application runs seamlessly in DEMO mode. | `""` (Demo mode) |
| `NEXT_PUBLIC_LAT` | Latitude used for celestial solar calculations (sun altitude/lighting) and Open-Meteo AQI/weather forecasts. | `12.9692` / `51.5074` |
| `NEXT_PUBLIC_LON` | Longitude used for celestial solar calculations (sun altitude/lighting) and Open-Meteo AQI/weather forecasts. | `79.1559` / `-0.1278` |

### Setting Environment Variables in AWS Amplify
In the AWS Amplify Console:
1. Navigate to **App settings** > **Environment variables**.
2. Add `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_LAT`, and `NEXT_PUBLIC_LON`.
3. Trigger a redeploy so the build phase bakes the variables into the static export (`./out`).

## Static Build & Local Serving

```bash
# 1. Install dependencies
npm ci

# 2. Build static export (generates ./out directory)
npm run build

# 3. Serve static export locally
npx serve out
```

## AWS Amplify Hosting

The repository includes `amplify.yml` configured for Amplify Hosting:
- Node.js 22 runtime
- Clean `npm ci` and `npm run build`
- Artifact directory pointed to `out`
- Cache for `node_modules` and `.next/cache`
