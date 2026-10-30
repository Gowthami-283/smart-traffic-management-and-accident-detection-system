/**
 * Smart Traffic Management and Accident Detection System
 * 2D Interactive 4-Way Intersection Simulator (Canvas Engine)
 * 
 * Features:
 * - High-DPI crisp Canvas rendering
 * - 4-Way Junction with asphalt, markings, zebra crossings, stop lines
 * - Real-time traffic signal light heads synchronized with TrafficManager
 * - Vehicle simulation with realistic braking, queueing on red, accelerating on green
 * - Vehicle varieties (Sedans, SUVs, Buses, Delivery Trucks, Two-wheelers)
 * - Collision & accident simulation with animated sparks, smoke particles, and flashing hazard beacon
 * - Dispatched Emergency Response Ambulance with dual flashing red/blue strobe lights
 * - Interactive canvas: click any road approach to trigger an accident or force priority!
 */

class IntersectionCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.vehicles = [];
    this.particles = [];
    this.ambulance = null;
    this.animationFrameId = null;

    // Dimensions
    this.width = 600;
    this.height = 600;
    this.roadWidth = 140; // width of intersection road
    this.laneWidth = 70;  // two lanes per road (inbound, outbound)

    this.activeAccident = null;

    this.initCanvasSize();
    this.seedVehicles();
    this.attachEventListeners();
    this.startLoop();

    // Listen for system events
    window.addEventListener('accident-detected', (e) => {
      this.handleAccidentTriggered(e.detail);
    });

    window.addEventListener('accident-resolved', () => {
      this.handleAccidentResolved();
    });

    window.addEventListener('resize', () => {
      this.initCanvasSize();
    });
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, 560);
    this.width = size;
    this.height = size;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
    this.roadWidth = this.width * 0.28;
    this.laneWidth = this.roadWidth / 2;
  }

  seedVehicles() {
    this.vehicles = [];
    const directions = ['north', 'east', 'south', 'west'];
    directions.forEach(dir => {
      for (let i = 0; i < 4; i++) {
        this.spawnVehicle(dir, i * 70 + 40);
      }
    });
  }

  spawnVehicle(direction, offset = null) {
    const types = [
      { type: 'sedan', length: 28, width: 14, color: '#38bdf8', maxSpeed: 2.2 },
      { type: 'suv', length: 32, width: 16, color: '#818cf8', maxSpeed: 2.0 },
      { type: 'truck', length: 44, width: 18, color: '#f59e0b', maxSpeed: 1.5 },
      { type: 'bus', length: 48, width: 18, color: '#10b981', maxSpeed: 1.4 },
      { type: 'bike', length: 18, width: 8, color: '#ec4899', maxSpeed: 2.5 }
    ];

    const model = types[Math.floor(Math.random() * types.length)];
    const cx = this.width / 2;
    const cy = this.height / 2;

    let x, y, speed, targetAngle;
    const initialDist = offset !== null ? offset : Math.random() * 80 + 260;

    switch (direction) {
      case 'north': // Coming from top heading South
        x = cx - this.laneWidth / 2;
        y = cy - this.roadWidth / 2 - initialDist;
        speed = model.maxSpeed;
        targetAngle = Math.PI / 2;
        break;
      case 'south': // Coming from bottom heading North
        x = cx + this.laneWidth / 2;
        y = cy + this.roadWidth / 2 + initialDist;
        speed = model.maxSpeed;
        targetAngle = -Math.PI / 2;
        break;
      case 'east': // Coming from right heading West
        x = cx + this.roadWidth / 2 + initialDist;
        y = cy - this.laneWidth / 2;
        speed = model.maxSpeed;
        targetAngle = Math.PI;
        break;
      case 'west': // Coming from left heading East
        x = cx - this.roadWidth / 2 - initialDist;
        y = cy + this.laneWidth / 2;
        speed = model.maxSpeed;
        targetAngle = 0;
        break;
    }

    this.vehicles.push({
      ...model,
      id: Math.random().toString(36).substring(2, 9),
      direction,
      x,
      y,
      speed: 0,
      targetSpeed: speed,
      targetAngle,
      stopped: false,
      crashed: false
    });
  }

  handleAccidentTriggered(incident) {
    this.activeAccident = incident;
    const dir = incident.laneKey;

    // Find two vehicles in that lane to trigger collision animation
    const candidates = this.vehicles.filter(v => v.direction === dir);
    if (candidates.length >= 2) {
      candidates[0].crashed = true;
      candidates[1].crashed = true;
      candidates[1].x = candidates[0].x + (dir === 'east' || dir === 'west' ? (dir === 'east' ? 22 : -22) : 0);
      candidates[1].y = candidates[0].y + (dir === 'north' || dir === 'south' ? (dir === 'north' ? -22 : 22) : 0);
    }

    // Spawn sparks
    this.createCrashParticles(dir);

    // Spawn emergency ambulance approaching the crash
    this.dispatchAmbulance(dir);
  }

  handleAccidentResolved() {
    this.activeAccident = null;
    this.ambulance = null;
    this.vehicles.forEach(v => {
      v.crashed = false;
    });
  }

  createCrashParticles(direction) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    let px = cx, py = cy;

    if (direction === 'north') { px = cx - this.laneWidth / 2; py = cy - this.roadWidth / 2 - 40; }
    if (direction === 'south') { px = cx + this.laneWidth / 2; py = cy + this.roadWidth / 2 + 40; }
    if (direction === 'east') { px = cx + this.roadWidth / 2 + 40; py = cy - this.laneWidth / 2; }
    if (direction === 'west') { px = cx - this.roadWidth / 2 - 40; py = cy + this.laneWidth / 2; }

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.015,
        color: Math.random() > 0.4 ? '#ef4444' : (Math.random() > 0.5 ? '#f59e0b' : '#ffffff'),
        size: Math.random() * 4 + 2
      });
    }
  }

  dispatchAmbulance(targetLaneKey) {
    const cx = this.width / 2;
    const cy = this.height / 2;

    // Ambulance enters from opposite or adjacent free approach
    this.ambulance = {
      x: cx - this.width * 0.45,
      y: cy - this.laneWidth / 2,
      targetX: cx,
      targetY: cy,
      angle: 0,
      strobe: true,
      color: '#ffffff',
      lightsTimer: 0
    };
  }

  attachEventListeners() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const cx = this.width / 2;
      const cy = this.height / 2;

      // Identify clicked approach quadrant
      let clickedDir = 'north';
      const dx = clickX - cx;
      const dy = clickY - cy;

      if (Math.abs(dx) > Math.abs(dy)) {
        clickedDir = dx > 0 ? 'east' : 'west';
      } else {
        clickedDir = dy > 0 ? 'south' : 'north';
      }

      // If accident is active, clicking canvas prompts resolution or details
      if (this.activeAccident) {
        if (window.accidentManager) {
          window.accidentManager.displayEmergencyPopup(this.activeAccident);
        }
      } else {
        // Trigger simulated accident on clicked approach!
        if (window.accidentManager) {
          window.accidentManager.triggerAccident(clickedDir);
        }
      }
    });
  }

  startLoop() {
    const render = () => {
      this.update();
      this.draw();
      this.animationFrameId = requestAnimationFrame(render);
    };
    this.animationFrameId = requestAnimationFrame(render);
  }

  update() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const stopOffset = this.roadWidth / 2 + 15;

    const lanesState = window.trafficManager ? window.trafficManager.lanes : {};

    // Update vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      if (v.crashed) continue;

      const lane = lanesState[v.direction] || { signalState: 'red' };
      let mustStop = false;

      // Check traffic signal stop line rule
      if (v.direction === 'north') {
        const distToStop = (cy - stopOffset) - v.y;
        if (lane.signalState === 'red' && distToStop > 0 && distToStop < 45) mustStop = true;
        if (lane.signalState === 'yellow' && distToStop > 10 && distToStop < 35) mustStop = true;
      } else if (v.direction === 'south') {
        const distToStop = v.y - (cy + stopOffset);
        if (lane.signalState === 'red' && distToStop > 0 && distToStop < 45) mustStop = true;
        if (lane.signalState === 'yellow' && distToStop > 10 && distToStop < 35) mustStop = true;
      } else if (v.direction === 'east') {
        const distToStop = v.x - (cx + stopOffset);
        if (lane.signalState === 'red' && distToStop > 0 && distToStop < 45) mustStop = true;
        if (lane.signalState === 'yellow' && distToStop > 10 && distToStop < 35) mustStop = true;
      } else if (v.direction === 'west') {
        const distToStop = (cx - stopOffset) - v.x;
        if (lane.signalState === 'red' && distToStop > 0 && distToStop < 45) mustStop = true;
        if (lane.signalState === 'yellow' && distToStop > 10 && distToStop < 35) mustStop = true;
      }

      // Check distance to car in front (anti-collision logic)
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const front = this.vehicles[j];
        if (front.direction === v.direction) {
          let distFront = 999;
          if (v.direction === 'north' && front.y > v.y) distFront = front.y - v.y;
          if (v.direction === 'south' && front.y < v.y) distFront = v.y - front.y;
          if (v.direction === 'east' && front.x < v.x) distFront = v.x - front.x;
          if (v.direction === 'west' && front.x > v.x) distFront = front.x - v.x;

          if (distFront > 0 && distFront < v.length + 18) {
            mustStop = true;
            break;
          }
        }
      }

      // Smooth acceleration / braking
      if (mustStop) {
        v.speed = Math.max(0, v.speed - 0.15);
      } else {
        v.speed = Math.min(v.targetSpeed, v.speed + 0.08);
      }

      // Move vehicle
      if (v.direction === 'north') v.y += v.speed;
      if (v.direction === 'south') v.y -= v.speed;
      if (v.direction === 'east') v.x -= v.speed;
      if (v.direction === 'west') v.x += v.speed;

      // Wrap around when vehicle leaves screen
      const margin = 50;
      if (v.y > this.height + margin || v.y < -margin || v.x > this.width + margin || v.x < -margin) {
        this.vehicles.splice(i, 1);
        this.spawnVehicle(v.direction, Math.random() * 40 + 200);
      }
    }

    // Update particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      const pt = this.particles[p];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) {
        this.particles.splice(p, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawTerrain();
    this.drawRoads();
    this.drawCrosswalksAndLines();
    this.drawTrafficLights();
    this.drawVehicles();
    this.drawParticles();
    this.drawAccidentOverlay();
    this.drawCompassHUD();
  }

  drawTerrain() {
    // Dark modern pavement / city background
    this.ctx.fillStyle = '#090e1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle ambient city grid
    this.ctx.strokeStyle = 'rgba(30, 58, 138, 0.12)';
    this.ctx.lineWidth = 1;
    const step = 30;
    for (let x = 0; x < this.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  drawRoads() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const halfRoad = this.roadWidth / 2;

    // Asphalt surface
    this.ctx.fillStyle = '#171f30';
    // Vertical road (North - South)
    this.ctx.fillRect(cx - halfRoad, 0, this.roadWidth, this.height);
    // Horizontal road (East - West)
    this.ctx.fillRect(0, cy - halfRoad, this.width, this.roadWidth);

    // Road borders / curbs with sleek cyan edge glow
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    this.ctx.lineWidth = 2;

    // Top-Left corner
    this.ctx.beginPath();
    this.ctx.moveTo(0, cy - halfRoad);
    this.ctx.lineTo(cx - halfRoad, cy - halfRoad);
    this.ctx.lineTo(cx - halfRoad, 0);
    this.ctx.stroke();

    // Top-Right corner
    this.ctx.beginPath();
    this.ctx.moveTo(this.width, cy - halfRoad);
    this.ctx.lineTo(cx + halfRoad, cy - halfRoad);
    this.ctx.lineTo(cx + halfRoad, 0);
    this.ctx.stroke();

    // Bottom-Left corner
    this.ctx.beginPath();
    this.ctx.moveTo(0, cy + halfRoad);
    this.ctx.lineTo(cx - halfRoad, cy + halfRoad);
    this.ctx.lineTo(cx - halfRoad, this.height);
    this.ctx.stroke();

    // Bottom-Right corner
    this.ctx.beginPath();
    this.ctx.moveTo(this.width, cy + halfRoad);
    this.ctx.lineTo(cx + halfRoad, cy + halfRoad);
    this.ctx.lineTo(cx + halfRoad, this.height);
    this.ctx.stroke();
  }

  drawCrosswalksAndLines() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const halfRoad = this.roadWidth / 2;

    // Dashed center divider lines (Yellow)
    this.ctx.strokeStyle = '#eab308';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 8]);

    // North center line
    this.ctx.beginPath();
    this.ctx.moveTo(cx, 0);
    this.ctx.lineTo(cx, cy - halfRoad);
    this.ctx.stroke();

    // South center line
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy + halfRoad);
    this.ctx.lineTo(cx, this.height);
    this.ctx.stroke();

    // East center line
    this.ctx.beginPath();
    this.ctx.moveTo(cx + halfRoad, cy);
    this.ctx.lineTo(this.width, cy);
    this.ctx.stroke();

    // West center line
    this.ctx.beginPath();
    this.ctx.moveTo(0, cy);
    this.ctx.lineTo(cx - halfRoad, cy);
    this.ctx.stroke();

    this.ctx.setLineDash([]); // Reset line dash

    // Solid Stop lines (White)
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;

    // North stop line (inbound left lane)
    this.ctx.beginPath();
    this.ctx.moveTo(cx - halfRoad, cy - halfRoad - 6);
    this.ctx.lineTo(cx, cy - halfRoad - 6);
    this.ctx.stroke();

    // South stop line (inbound right lane)
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy + halfRoad + 6);
    this.ctx.lineTo(cx + halfRoad, cy + halfRoad + 6);
    this.ctx.stroke();

    // East stop line (inbound top lane)
    this.ctx.beginPath();
    this.ctx.moveTo(cx + halfRoad + 6, cy - halfRoad);
    this.ctx.lineTo(cx + halfRoad + 6, cy);
    this.ctx.stroke();

    // West stop line (inbound bottom lane)
    this.ctx.beginPath();
    this.ctx.moveTo(cx - halfRoad - 6, cy);
    this.ctx.lineTo(cx - halfRoad - 6, cy + halfRoad);
    this.ctx.stroke();

    // Zebra crosswalk stripes
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const zebraCount = 6;
    const stripeW = 4;
    const stripeL = 14;

    for (let k = 0; k < zebraCount; k++) {
      const pos = cx - halfRoad + 8 + k * 20;
      // North crosswalk
      this.ctx.fillRect(pos, cy - halfRoad - 24, stripeW, stripeL);
      // South crosswalk
      this.ctx.fillRect(pos, cy + halfRoad + 10, stripeW, stripeL);
    }

    for (let k = 0; k < zebraCount; k++) {
      const pos = cy - halfRoad + 8 + k * 20;
      // West crosswalk
      this.ctx.fillRect(cx - halfRoad - 24, pos, stripeL, stripeW);
      // East crosswalk
      this.ctx.fillRect(cx + halfRoad + 10, pos, stripeL, stripeW);
    }
  }

  drawTrafficLights() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const halfRoad = this.roadWidth / 2;
    const lanes = window.trafficManager ? window.trafficManager.lanes : {};

    // 4 Signal posts at corners
    const signals = [
      { key: 'north', x: cx - halfRoad - 18, y: cy - halfRoad - 18, state: lanes.north?.signalState || 'red' },
      { key: 'east', x: cx + halfRoad + 18, y: cy - halfRoad - 18, state: lanes.east?.signalState || 'red' },
      { key: 'south', x: cx + halfRoad + 18, y: cy + halfRoad + 18, state: lanes.south?.signalState || 'red' },
      { key: 'west', x: cx - halfRoad - 18, y: cy + halfRoad + 18, state: lanes.west?.signalState || 'red' }
    ];

    signals.forEach(sig => {
      this.drawTrafficLightHead(sig.x, sig.y, sig.state, sig.key.toUpperCase());
    });
  }

  drawTrafficLightHead(x, y, state, label) {
    const boxW = 22;
    const boxH = 46;

    // Housing box
    this.ctx.fillStyle = '#0b0f19';
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.5;
    this.roundRect(this.ctx, x - boxW / 2, y - boxH / 2, boxW, boxH, 5, true, true);

    const radius = 4.5;
    const colors = [
      { name: 'red', y: y - 14, activeColor: '#ef4444', dimColor: '#3a1114', glow: 'rgba(239, 68, 68, 0.7)' },
      { name: 'yellow', y: y, activeColor: '#eab308', dimColor: '#3a2d0b', glow: 'rgba(234, 179, 8, 0.7)' },
      { name: 'green', y: y + 14, activeColor: '#10b981', dimColor: '#0b2b1e', glow: 'rgba(16, 185, 129, 0.7)' }
    ];

    colors.forEach(lamp => {
      const isActive = lamp.name === state;
      this.ctx.beginPath();
      this.ctx.arc(x, lamp.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = isActive ? lamp.activeColor : lamp.dimColor;
      this.ctx.fill();

      if (isActive) {
        // Glowing halo
        this.ctx.shadowColor = lamp.activeColor;
        this.ctx.shadowBlur = 10;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // reset
      }
    });

    // Label
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '9px JetBrains Mono, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x, y + boxH / 2 + 10);
  }

  drawVehicles() {
    this.vehicles.forEach(v => {
      this.ctx.save();
      this.ctx.translate(v.x, v.y);
      this.ctx.rotate(v.targetAngle);

      // Vehicle body shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.roundRect(this.ctx, -v.length / 2 + 2, -v.width / 2 + 2, v.length, v.width, 3, true, false);

      // Vehicle main chassis
      this.ctx.fillStyle = v.crashed ? '#ef4444' : v.color;
      this.roundRect(this.ctx, -v.length / 2, -v.width / 2, v.length, v.width, 3, true, false);

      // Windshield & roof
      this.ctx.fillStyle = '#1e293b';
      this.roundRect(this.ctx, -v.length * 0.2, -v.width * 0.35, v.length * 0.4, v.width * 0.7, 2, true, false);

      // Headlights
      this.ctx.fillStyle = '#fef08a';
      this.ctx.fillRect(v.length / 2 - 2, -v.width / 2 + 2, 2, 3);
      this.ctx.fillRect(v.length / 2 - 2, v.width / 2 - 5, 2, 3);

      // Taillights
      this.ctx.fillStyle = v.speed === 0 ? '#ef4444' : '#991b1b';
      this.ctx.fillRect(-v.length / 2, -v.width / 2 + 2, 2, 3);
      this.ctx.fillRect(-v.length / 2, v.width / 2 - 5, 2, 3);

      this.ctx.restore();
    });
  }

  drawParticles() {
    this.particles.forEach(pt => {
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      this.ctx.fillStyle = pt.color;
      this.ctx.globalAlpha = Math.max(0, pt.life);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });
  }

  drawAccidentOverlay() {
    if (!this.activeAccident) return;

    const cx = this.width / 2;
    const cy = this.height / 2;
    let ax = cx, ay = cy;
    const dir = this.activeAccident.laneKey;

    if (dir === 'north') { ax = cx - this.laneWidth / 2; ay = cy - this.roadWidth / 2 - 40; }
    if (dir === 'south') { ax = cx + this.laneWidth / 2; ay = cy + this.roadWidth / 2 + 40; }
    if (dir === 'east') { ax = cx + this.roadWidth / 2 + 40; ay = cy - this.laneWidth / 2; }
    if (dir === 'west') { ax = cx - this.roadWidth / 2 - 40; ay = cy + this.laneWidth / 2; }

    const now = Date.now();
    const pulse = Math.sin(now / 150) * 8 + 26;

    // Red pulsating emergency collision ring
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(ax, ay, pulse, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    this.ctx.fill();

    // Hazard Symbol & Label
    this.ctx.fillStyle = '#fee2e2';
    this.ctx.font = 'bold 12px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚠️ ACCIDENT', ax, ay - 35);

    this.ctx.fillStyle = '#fca5a5';
    this.ctx.font = '10px JetBrains Mono, monospace';
    this.ctx.fillText(`${this.activeAccident.id} [${this.activeAccident.severity}]`, ax, ay + 42);
    this.ctx.restore();
  }

  drawCompassHUD() {
    // Subtle compass markings
    this.ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    this.ctx.font = 'bold 11px Inter, sans-serif';
    this.ctx.textAlign = 'center';

    this.ctx.fillText('NORTH [N]', this.width / 2, 22);
    this.ctx.fillText('SOUTH [S]', this.width / 2, this.height - 12);
    this.ctx.fillText('EAST [E]', this.width - 32, this.height / 2 + 4);
    this.ctx.fillText('WEST [W]', 32, this.height / 2 + 4);
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'undefined') radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}

// Export initialization function
window.initIntersectionCanvas = (id) => {
  return new IntersectionCanvas(id);
};
