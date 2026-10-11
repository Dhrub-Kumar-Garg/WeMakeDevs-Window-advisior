# 🪟 Window-Open Advisor

> **An intelligent, physically grounded ventilation advisor for real-world rooms.**  
> Combines indoor CO₂ differential mass-balance modeling, outdoor air quality forecasting (Open-Meteo), and real-time IoT telemetry from an ESP32 to tell you exactly **when** and **why** to open your window.

---

## 🌟 Overview & Core Philosophy

Opening a window seems simple, but in real environments it is a multi-variable tradeoff:
- **Indoor CO₂ accumulation**: Human respiration in closed rooms rapidly drives CO₂ above recommended limits (1,000 ppm), causing fatigue, cognitive decline, and stuffiness.
- **Sensor limitations**: Inexpensive consumer sensors (e.g. MOx sensors like the MQ135) drift drastically over time and output analog mV, not reliable absolute ppm. True calibrated NDIR sensors are costly.
- **Outdoor hazards**: Opening a window when outdoor air quality (PM2.5, AQI) is poor invites particulate pollution into your living space.

**Window-Open Advisor** solves this dilemma through **data honesty and mathematical modeling**:
1. It runs a **first-principles mass-balance physics model** to calculate estimated indoor CO₂ accumulation.
2. It cross-checks trends using an **MQ135** relative trend index (not absolute ppm) to confirm model agreement.
3. It integrates real-time **Open-Meteo AQI forecasts** to compute optimal ventilation windows.
4. It presents advice inside a **real-time 3D interactive room** with realistic procedural lighting, physical sash movement, and simulation tools.

---

## 📐 Mathematical Model & Decision Engine

### Single-Zone Mass-Balance Differential Equation

Indoor CO₂ concentration is calculated continuously via the classic mass-balance differential equation:

$$\frac{dC}{dt} = \frac{N \cdot G}{V} - \frac{\text{ACH}}{3600} \cdot (C - C_{\text{out}})$$

Where:
- $C$: Current indoor estimated $\text{CO}_2$ concentration ($\text{ppm}$).
- $C_{\text{out}}$: Outdoor ambient $\text{CO}_2$ baseline ($\approx 420\text{ ppm}$).
- $N$: Number of assumed room occupants (derived from PIR presence detection).
- $G$: $\text{CO}_2$ generation rate per occupant ($\approx 0.0052\text{ L/s}$ or metabolic equivalent).
- $V$: Room volume in cubic meters ($m^3$, default $36\text{ m}^3$).
- $\text{ACH}$: Air Changes per Hour (e.g., $0.4\text{ h}^{-1}$ closed, $2.0 - 6.0\text{ h}^{-1}$ open).

### Tri-State Decision Matrix

The frontend evaluates indoor estimated $\text{CO}_2$ against the user's $\text{CO}_2$ threshold ($1,000\text{ ppm}$) and outdoor AQI against the outdoor limit ($100$):

| Verdict | Condition | Visual Indicator | Recommended Action |
| :--- | :--- | :--- | :--- |
| **`OPEN WINDOW`** | $\text{CO}_2 > 1000\text{ ppm}$ AND $\text{Outdoor AQI} \le 100$ | Teal (`#00d4aa`) | Open the window now to flush $\text{CO}_2$ quickly with clean outdoor air. |
| **`WAIT FOR BETTER AIR`** | $\text{CO}_2 > 1000\text{ ppm}$ AND $\text{Outdoor AQI} > 100$ | Amber (`#eab308`) | Keep the window closed. Displays the earliest projected clean air window from Open-Meteo. |
| **`KEEP CLOSED`** | $\text{CO}_2 \le 1000\text{ ppm}$ | Coral Red (`#ff5f1f`) | Indoor air is clean and within thresholds. Retain indoor thermal comfort. |

---

## 🛠️ Hardware & Sensor Architecture

The physical system runs on an **ESP32** microcontroller feeding telemetry over WiFi / AWS IoT Core:

```
 ┌────────────────────────────────────────────────────────┐
 │                   ESP32 Microcontroller                │
 └──────┬────────────┬────────────┬───────────┬───────────┘
        │            │            │           │
   ┌────┴───┐   ┌────┴────┐  ┌────┴────┐ ┌────┴─────┐
   │ DHT11  │   │  MQ135  │  │   PIR   │ │ HC-SR04  │
   │ Temp & │   │ Voltage │  │HC-SR501 │ │Ultrasonic│
   │Humidity│   │ Divider │  │Presence │ │ Distance │
   └────────┘   └─────────┘  └─────────┘ └──────────┘
```

- **ESP32**: Telemetry aggregator, sensor sampler, and MQTT publisher.
- **DHT11**: Measures indoor temperature ($\pm 2^\circ\text{C}$) and relative humidity ($\pm 5\%$). Labeled in UI as `measured (DHT11)`.
- **MQ135 (via voltage divider)**: Reads raw millivolts ($\text{mV}$) and relative trend index. Labeled in UI as `relative trend, not ppm`.
- **PIR HC-SR501**: Detects human presence (`presence (assumed occupants N)` — never a headcount).
- **HC-SR04 Ultrasonic**: Distance measurement in centimeters (`distance (HC-SR04)`).
- **Push Button**: Hardware toggle for window open/closed state.
- **LEDs**: Physical state indicators (green, red, off).
- *(Note: LM35 and analog servo were intentionally excluded to eliminate thermal drift and uncalibrated actuators).*

---

## 📡 Live Telemetry API Contract

The Next.js frontend fetches `${NEXT_PUBLIC_API_URL}/latest` every **10 seconds** with `cache: 'no-store'` and an **8-second timeout** via `AbortController`.

### TypeScript Interface (`src/lib/types.ts`)

```typescript
export interface LatestReading {
  deviceId: string;       // Unique device identifier (e.g. "esp32-advisor-01")
  ts: number;             // Timestamp in epoch SECONDS
  tempC?: number;         // Temperature in °C (DHT11)
  humidity?: number;      // Relative humidity in % (DHT11)
  pir: boolean;           // Motion presence (assumed occupants, not headcount)
  windowOpen: boolean;    // Physical sash state (true = open, false = closed)
  distanceCm?: number;    // Distance in cm (HC-SR04)
  mq135Mv: number;        // Raw analog reading in mV (never ppm)
  mq135Idx?: number;      // Relative trend index (0 - 100)
  co2Est: number;         // Physics-based indoor CO₂ ESTIMATE in ppm
  people: number;         // Assumed number of occupants N
  ach: number;            // Assumed Air Changes per Hour
  volumeM3: number;       // Room volume in m³
  aqiOut: number;         // Outdoor AQI fallback
  aqiSrc: string;         // AQI data source attribution
  led: 'green' | 'red' | 'off'; // Hardware LED indicator status
  timeScale: number;      // Simulation multiplier (1 = realtime, >1 = accelerated)
}
```

### Single Status Selector Behavior

| State | Condition | Visual Badge |
| :--- | :--- | :--- |
| **`LIVE`** | Telemetry age $\le 60\text{ s}$ ($\text{now} - \text{ts} \cdot 1000$) | Bold Teal badge: `LIVE (last reading Xs ago)` |
| **`STALE`** | Telemetry age $> 60\text{ s}$ OR connection drop | Bold Amber badge: `STALE (last reading Xm ago)` (retains last reading) |
| **`DEMO`** | Activated strictly with `?demo=1` | Outlined badge: `DEMO` |
| **`NO DEVICE CONFIGURED`** | `NEXT_PUBLIC_API_URL` environment variable unset | Outlined badge: `NO DEVICE CONFIGURED` |
| **`NO DEVICE DATA YET`** | API endpoint returns HTTP 404 | Outlined badge: `NO DEVICE DATA YET` |
| **`ACCELERATED DEMO xN`** | `timeScale > 1` | Orange badge alongside status badge |

---

## 🎨 User Interface & Aesthetic Design

The web application uses a **tactile editorial aesthetic** that pairs a physically rendered 3D scene with precise typographic data overlays:

1. **Realistic 3D Interior** (`Three.js` / `@react-three/fiber` / `@react-three/drei`):
   - Procedural geometry for room corner, window frame, and animated sash.
   - Solar altitude lighting calculated dynamically via `SunCalc` (Day, Twilight, Night regimes).
   - Dust motes and illustrative airflow whose animation speed scales with effective ACH.
   - Window sash angle reflects real hardware `windowOpen` telemetry.
2. **Interactive "What If I..." Controls**:
   - Preview future $\text{CO}_2$ curves under hypothetical "Keep Closed" or "Open Now" choices.
   - Automatically returns to real device telemetry state after 20 seconds.
3. **Scientific Evidence Section**:
   - **Rolling Live Trend Strip**: Renders the in-memory history of the last 60 live device readings (`co2Est` and `mq135Idx`).
   - Separate dual axes: Left axis for $\text{CO}_2$ ($\text{ppm}$), right axis dedicated to `relative trend, not ppm`.
   - Labeled with caption `"since page load"`.
   - Side-by-side Experiment 01 & 02 benchmark curves labeled `"illustrative model run, not recorded data"`.
4. **24-Hour Outdoor AQI Skyline**:
   - Step-function skyline showing hourly outdoor air quality forecasts from Open-Meteo.
   - Highlights the optimal clearing window for low-AQI ventilation.
5. **Interactive Model Configuration**:
   - Fine-tune assumptions: Room volume ($m^3$), occupants ($N$), baseline closed ACH, open ACH range, and target thresholds.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or Node.js 22
- npm

### 1. Installation

```bash
cd window-advisor
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in `window-advisor/`:

```env
# URL of device API endpoint returning /latest JSON
NEXT_PUBLIC_API_URL=http://localhost:3001

# Latitude and Longitude for SunCalc solar lighting and Open-Meteo AQI
NEXT_PUBLIC_LAT=12.9692
NEXT_PUBLIC_LON=79.1559
```

> **Note**: If `NEXT_PUBLIC_API_URL` is omitted, the application runs without inventing fake data and cleanly indicates `NO DEVICE CONFIGURED`. Append `?demo=1` to the URL to run the fast physics simulation demo.

### 3. Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing & Verification

The project includes an end-to-end **Playwright** verification suite that launches a mock device server and validates all requirements:

```bash
# Run the live device API verification script
node scripts/verify-device-api.mjs

# Run the edge cases verification script (?demo=1, 404, etc.)
node scripts/verify-edge-cases.mjs
```

### Verified Criteria:
- ✅ `LIVE` status badge appears when telemetry age $\le 60\text{ s}$.
- ✅ Window sash dynamically follows `windowOpen: true` / `false`.
- ✅ Status automatically flips to `STALE` when the device server stops, retaining last valid values.
- ✅ Hardware items are tagged `LIVE` only if the payload contains their respective data fields.
- ✅ **0 console errors** during live browser runtime.
- ✅ Visual screenshots captured in test artifacts.

---

## ☁️ Production Build & Deployment

### Static Export Build

The application builds as an optimized static export:

```bash
npm run build
```

This generates static HTML/CSS/JS artifacts in the `./out` directory, which can be served by any static host (AWS Amplify, Vercel, S3/CloudFront, Cloudflare Pages).

### AWS Amplify Hosting (`amplify.yml`)

The repository includes a production-ready `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: out
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

To configure environment variables in AWS Amplify Console:
1. Go to **App settings** > **Environment variables**.
2. Add `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_LAT`, and `NEXT_PUBLIC_LON`.
3. Save and trigger a build.

---

## 📜 Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack static export)
- **Language**: TypeScript 5
- **3D Engine**: [Three.js](https://threejs.org/) with [@react-three/fiber](https://r3f.docs.pmnd.rs/) & [@react-three/drei](https://github.com/pmndrs/drei)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) & [Maath](https://github.com/pmndrs/maath)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Astronomy / Solar Calculation**: [SunCalc](https://github.com/mourner/suncalc)
- **Weather / AQI Data**: [Open-Meteo Air Quality & Weather API](https://open-meteo.com/)
- **End-to-End Testing**: [Playwright](https://playwright.dev/)

---

## 📄 License & Credits

- HDRI sky assets provided by [Poly Haven](https://polyhaven.com/) (CC0).
- Open-Meteo weather data provided under [CC BY 4.0](https://open-meteo.com/en/license).
