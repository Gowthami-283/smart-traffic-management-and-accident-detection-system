# Smart Traffic Management and Accident Detection System

An interactive, responsive, and modern web application dashboard designed for real-time urban traffic control, density-based adaptive signal scheduling, automated accident detection simulation, and instant emergency response dispatching.

---

## Key Features

### 1. Central Operational Dashboard
- **Live Digital Date & Clock:** Precision digital display updating in real-time (`HH:MM:SS` + Day & Date).
- **KPI Metrics Cards:**
  - **Total Vehicles Processed:** Dynamic live counter updating as vehicles cross junctions.
  - **Network Traffic Density:** Color-coded status badge (**Low**, **Medium**, **High**) with adaptive recommendations.
  - **Active Traffic Signals:** Directional health status indicator (`4 / 4 Normal`).
  - **Detected Accidents:** Incident telemetry count synced with persistent storage.

### 2. Smart Traffic Signal Management
- **4-Phase Directional Control:** Separate approaches for **North**, **East**, **South**, and **West**.
- **Digital Traffic Lights:** Realistic housing shrouds with illuminated **Red**, **Yellow**, and **Green** LED lenses and ambient halo glow effects.
- **Adaptive Green Time Logic:**
  - **Low Density:** 8s Green light window
  - **Medium Density:** 15s Green light window
  - **High Density:** 24s Green light window
- **Yellow Transition Warning:** 3-second amber caution phase accompanied by an audible warning beep synthesized via the Web Audio API.
- **Live Countdown Timers:** Dedicated digital countdown clocks for each lane indicating seconds remaining until state transition.
- **Interactive Lane Controls:**
  - Manual density toggle buttons (`Low`, `Med`, `High`) per lane.
  - **Priority Green** override button to clear any corridor instantly.
  - Dedicated **Crash Simulation** trigger per road approach.

### 3. Interactive 2D 4-Way Intersection Simulator (Canvas Engine)
- Crisp high-DPI Canvas crossroad with asphalt surfaces, yellow dashed center lines, solid white stop lines, and zebra crosswalks.
- Autonomous vehicle models (Sedans, SUVs, Buses, Delivery Trucks, Two-wheelers).
- Realistic physics with decelerating behind stop lines on Red, smooth queueing, and acceleration on Green.
- Interactive road approaches: clicking on any road triggers a collision or priority clearance at that exact quadrant.
- Animated collision effects: crash sparks, debris particles, pulsating red hazard rings, and dispatched emergency ambulance with flashing blue/red strobes.

### 4. Accident Detection & Emergency Alert System
- **Real-Time Detection Engine:** Detects simulated vehicular collisions with estimated impact force, involved vehicle registrations, and AI confidence telemetry.
- **Loud Emergency Siren (Web Audio API):**
  - **Zero external audio files required.**
  - Generates an authentic alternating dual-tone emergency siren (High: 960 Hz, Low: 620 Hz) with acoustic micro-glides.
  - Automatically engages upon accident detection and loops until explicitly dismissed.
  - Dedicated **Stop Alarm** and **Test Alarm** buttons.
- **Visual Emergency Strobe:** Perimeter flashing alert and sticky top notification banner.
- **Emergency Popup Modal:**
  - Prominent alert: *"EMERGENCY! Accident Detected. Please Contact Emergency Services."*
  - Comprehensive crash telemetry: Incident ID, Direction, Timestamp, Severity, Impact Force, and Lane Diversion Action.
  - 4-Stage Response Workflow Tracker (Collision Detected &rarr; Siren Active &rarr; EMS Dispatched &rarr; Corridor Cleared) with live ETA countdown.
  - One-click actions to silence alarm or resolve incident and reopen lanes.

### 5. Persistent Incident History & Data Management
- Stored reliably in browser `localStorage`.
- Pre-populated with realistic demonstration records.
- Filterable by Direction (North, East, South, West) and Status (Active vs Resolved).
- **Export to CSV:** Download historical incident records for documentation.
- One-click incident resolution and history clearing.

### 6. Real-Time Traffic Analytics
- High-performance, self-contained HTML5 Canvas charts styled in glowing neon accents:
  1. **Directional Queue & Density Bar Chart:** Compares real-time vehicle queues against maximum lane capacities.
  2. **Vehicle Fleet Breakdown Donut Chart:** Visualizes distribution across passenger cars, two-wheelers, commercial trucks, and public transit.
  3. **24-Hour Traffic Flow Trend Chart:** Area chart displaying diurnal rush hour patterns overlaid with collision frequency spikes.

---

## Project Structure

```
smart traffic management and accident detection system/
├── index.html                  # Main responsive HTML5 dashboard
├── css/
│   └── styles.css              # Cyber/Smart City dark theme & animations
├── js/
│   ├── audio.js                # Web Audio API siren & warning sound synthesizer
│   ├── traffic.js              # 4-way traffic controller & density adaptive timers
│   ├── accident.js             # Collision detection, response workflow & localStorage
│   ├── intersection-canvas.js  # 2D Canvas crossroad visualizer & crash animations
│   ├── analytics.js            # Real-time Canvas charts & KPI calculations
│   └── app.js                  # Master application orchestrator & live clock
└── README.md                   # Documentation & usage manual
```

---

## How to Run

1. **Direct Launch:**
   - Double-click or open [index.html](file:///c:/Users/slava/OneDrive/Documents/smart%20traffic%20management%20and%20accident%20detection%20system/index.html) in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
   - No installation, server configuration, or backend database is required.

2. **Using a Local Development Server (Optional):**
   ```bash
   python -m http.server 8080 --bind 127.0.0.1
   ```
   Open `http://127.0.0.1:8080` in your web browser.

---

## Presentation & Demo Controls

| Action | Control | Description |
| :--- | :--- | :--- |
| **Simulate Accident** | <kbd>A</kbd> or 🚨 **Simulate Accident** button | Simulates collision, plays siren, shows modal |
| **Stop Alarm** | <kbd>S</kbd> or 🛑 **Stop Alarm** button | Immediately stops the Web Audio emergency siren |
| **Test Siren** | <kbd>T</kbd> or 🔊 **Test Alarm** button | Auditions emergency siren for 4 seconds |
| **Pause / Resume** | <kbd>Space</kbd> or ⏸ **Pause Cycle** | Pauses signal timer countdowns and movement |
| **Lane Density** | `Low`, `Med`, `High` buttons | Adjusts queue volume and next Green light duration |
| **Priority Green** | `⚡ Priority Green` button | Instantly forces Green light for the selected lane |
| **Canvas Click** | Left-click any approach on 2D map | Triggers collision or highlights lane telemetry |

---

## Technical Specifications
- **Frontend Stack:** Semantic HTML5, CSS3 (CSS Grid, Flexbox, Glassmorphism, CSS Custom Properties), Vanilla JavaScript (ES6+ Classes).
- **Audio Engine:** Pure Web Audio API (`AudioContext`, `createOscillator`, `createGain`, frequency modulation).
- **Storage:** Client-side `localStorage` with JSON serialization.
- **Security:** DOM manipulation using `textContent` and `createElement` preventing XSS vulnerabilities.
