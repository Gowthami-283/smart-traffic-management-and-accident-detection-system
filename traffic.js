/**
 * Smart Traffic Management and Accident Detection System
 * Traffic Signal Controller & Adaptive Timing Engine
 * 
 * Features:
 * - 4-Phase Directional Management: North, East, South, West
 * - Dynamic Density Calculation (Low, Medium, High)
 * - Adaptive Green Light Timing:
 *     * Low: 8s
 *     * Medium: 15s
 *     * High: 24s
 * - 3s Yellow Transition with Audible Warning Beep
 * - Live Countdown Timers for all lanes
 * - Manual & Autonomous Traffic Density Adjustment
 * - Emergency Corridor Clearance Mode
 */

class TrafficManager {
  constructor() {
    this.lanes = {
      north: {
        id: 'north',
        name: 'North Approach',
        short: 'N',
        density: 'medium',
        vehicles: 26,
        signalState: 'red',
        countdown: 0,
        isBlocked: false,
        emergencyPriority: false
      },
      east: {
        id: 'east',
        name: 'East Approach',
        short: 'E',
        density: 'high',
        vehicles: 48,
        signalState: 'red',
        countdown: 0,
        isBlocked: false,
        emergencyPriority: false
      },
      south: {
        id: 'south',
        name: 'South Approach',
        short: 'S',
        density: 'low',
        vehicles: 12,
        signalState: 'red',
        countdown: 0,
        isBlocked: false,
        emergencyPriority: false
      },
      west: {
        id: 'west',
        name: 'West Approach',
        short: 'W',
        density: 'medium',
        vehicles: 31,
        signalState: 'red',
        countdown: 0,
        isBlocked: false,
        emergencyPriority: false
      }
    };

    this.cycleSequence = ['north', 'east', 'south', 'west'];
    this.currentCycleIndex = 0;
    this.phase = 'green'; // 'green' or 'yellow'
    this.timerInterval = null;
    this.simulationInterval = null;
    this.isPaused = false;
    this.totalVehiclesProcessed = 1420;

    // Timing config based on density (seconds)
    this.timingMap = {
      low: 8,
      medium: 15,
      high: 24
    };
    this.yellowDuration = 3;

    // Start with the first lane
    this.init();
  }

  init() {
    const activeLaneKey = this.cycleSequence[this.currentCycleIndex];
    const initialLane = this.lanes[activeLaneKey];
    initialLane.signalState = 'green';
    initialLane.countdown = this.timingMap[initialLane.density];

    // Set other lanes to red with calculated wait countdowns
    this.calculateRedCountdowns();

    this.startCycleTimer();
    this.startTrafficSimulation();
  }

  /**
   * Returns current active lane key
   */
  getActiveLaneKey() {
    return this.cycleSequence[this.currentCycleIndex];
  }

  /**
   * Main 1-second countdown clock for signals
   */
  startCycleTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.isPaused) return;

      const activeKey = this.getActiveLaneKey();
      const activeLane = this.lanes[activeKey];

      // Process vehicles moving through green light
      if (activeLane.signalState === 'green') {
        const vehiclesFlowing = Math.min(activeLane.vehicles, Math.floor(Math.random() * 2) + 1);
        activeLane.vehicles = Math.max(0, activeLane.vehicles - vehiclesFlowing);
        this.totalVehiclesProcessed += vehiclesFlowing;
      }

      // Decrement countdown
      activeLane.countdown--;

      // Transition from Green to Yellow
      if (activeLane.signalState === 'green' && activeLane.countdown <= 0) {
        activeLane.signalState = 'yellow';
        activeLane.countdown = this.yellowDuration;

        // Play warning beep via Web Audio API
        if (window.soundSynthesizer) {
          window.soundSynthesizer.playSignalWarningBeep();
        }
      } 
      // Transition from Yellow to Red -> Next Lane
      else if (activeLane.signalState === 'yellow' && activeLane.countdown <= 0) {
        activeLane.signalState = 'red';
        
        // Move to next lane in sequence (skip permanently blocked lanes if accident)
        this.advanceToNextLane();
      }

      // Update red countdowns for waiting lanes
      this.calculateRedCountdowns();

      // Trigger UI and canvas updates
      this.notifyUpdate();
    }, 1000);
  }

  /**
   * Calculate wait times for lanes on Red
   */
  calculateRedCountdowns() {
    const activeKey = this.getActiveLaneKey();
    const activeLane = this.lanes[activeKey];
    let runningWait = activeLane.countdown;

    for (let i = 1; i < this.cycleSequence.length; i++) {
      const nextIndex = (this.currentCycleIndex + i) % this.cycleSequence.length;
      const nextKey = this.cycleSequence[nextIndex];
      const nextLane = this.lanes[nextKey];

      if (nextLane.signalState === 'red') {
        nextLane.countdown = runningWait;
      }

      // Add this lane's upcoming green + yellow time for the lanes after it
      runningWait += this.timingMap[nextLane.density] + this.yellowDuration;
    }
  }

  /**
   * Advances signal to the next lane
   */
  advanceToNextLane() {
    let attempts = 0;
    do {
      this.currentCycleIndex = (this.currentCycleIndex + 1) % this.cycleSequence.length;
      attempts++;
    } while (this.lanes[this.cycleSequence[this.currentCycleIndex]].isBlocked && attempts < this.cycleSequence.length);

    const newActiveKey = this.cycleSequence[this.currentCycleIndex];
    const newActiveLane = this.lanes[newActiveKey];

    // If all are blocked or normal
    newActiveLane.signalState = 'green';
    newActiveLane.countdown = this.timingMap[newActiveLane.density];

    // Audio cue for signal change
    if (window.soundSynthesizer) {
      window.soundSynthesizer.playUiBeep(700, 0.05);
    }
  }

  /**
   * Change lane density manually or programmatically
   */
  setLaneDensity(laneKey, density) {
    if (!this.lanes[laneKey]) return;
    this.lanes[laneKey].density = density;

    // Adjust realistic vehicle queue count based on density
    if (density === 'low') {
      this.lanes[laneKey].vehicles = Math.floor(Math.random() * 8) + 8; // 8 - 15
    } else if (density === 'medium') {
      this.lanes[laneKey].vehicles = Math.floor(Math.random() * 15) + 20; // 20 - 35
    } else if (density === 'high') {
      this.lanes[laneKey].vehicles = Math.floor(Math.random() * 20) + 45; // 45 - 65
    }

    // If currently green, adjust countdown proportionally if desired
    if (this.lanes[laneKey].signalState === 'green') {
      const maxTime = this.timingMap[density];
      if (this.lanes[laneKey].countdown > maxTime) {
        this.lanes[laneKey].countdown = maxTime;
      }
    }

    this.calculateRedCountdowns();
    this.notifyUpdate();
  }

  /**
   * Force a specific lane to get Green immediately (Manual Priority or Emergency Override)
   */
  forceGreen(laneKey) {
    if (!this.lanes[laneKey]) return;

    // Set all other lanes to red immediately
    Object.keys(this.lanes).forEach(key => {
      this.lanes[key].signalState = 'red';
    });

    const targetIndex = this.cycleSequence.indexOf(laneKey);
    if (targetIndex !== -1) {
      this.currentCycleIndex = targetIndex;
    }

    const targetLane = this.lanes[laneKey];
    targetLane.signalState = 'green';
    targetLane.countdown = this.timingMap[targetLane.density];

    if (window.soundSynthesizer) {
      window.soundSynthesizer.playSignalWarningBeep();
    }

    this.calculateRedCountdowns();
    this.notifyUpdate();
  }

  /**
   * Mark a lane as blocked due to accident (traffic diversion)
   */
  setLaneBlocked(laneKey, isBlocked = true) {
    if (this.lanes[laneKey]) {
      this.lanes[laneKey].isBlocked = isBlocked;
      if (isBlocked && this.getActiveLaneKey() === laneKey) {
        // If the accident happened in current green lane, switch safely
        this.advanceToNextLane();
      }
      this.notifyUpdate();
    }
  }

  /**
   * Autonomous traffic fluctuation simulator to mimic real city road flow
   */
  startTrafficSimulation() {
    if (this.simulationInterval) clearInterval(this.simulationInterval);

    this.simulationInterval = setInterval(() => {
      if (this.isPaused) return;

      // Random incoming vehicles into waiting lanes
      Object.keys(this.lanes).forEach(key => {
        const lane = this.lanes[key];
        if (lane.signalState === 'red' && !lane.isBlocked) {
          const incoming = Math.random() > 0.4 ? (Math.random() > 0.7 ? 2 : 1) : 0;
          lane.vehicles = Math.min(80, lane.vehicles + incoming);

          // Dynamic density shifting based on queue length
          if (lane.vehicles > 40 && lane.density !== 'high') {
            lane.density = 'high';
          } else if (lane.vehicles <= 40 && lane.vehicles >= 18 && lane.density !== 'medium') {
            lane.density = 'medium';
          } else if (lane.vehicles < 18 && lane.density !== 'low') {
            lane.density = 'low';
          }
        }
      });

      this.notifyUpdate();
    }, 3500);
  }

  /**
   * Toggle pause for simulation
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * Get overall network traffic density summary
   */
  getOverallDensity() {
    const densities = Object.values(this.lanes).map(l => l.density);
    const highCount = densities.filter(d => d === 'high').length;
    const medCount = densities.filter(d => d === 'medium').length;

    if (highCount >= 2) return { label: 'High', class: 'density-high', score: 85 };
    if (highCount === 1 || medCount >= 2) return { label: 'Medium', class: 'density-medium', score: 62 };
    return { label: 'Low', class: 'density-low', score: 28 };
  }

  /**
   * Broadcast change event
   */
  notifyUpdate() {
    window.dispatchEvent(new CustomEvent('traffic-state-changed', {
      detail: {
        lanes: this.lanes,
        activeLaneKey: this.getActiveLaneKey(),
        totalProcessed: this.totalVehiclesProcessed,
        overallDensity: this.getOverallDensity()
      }
    }));
  }
}

// Export singleton instance
window.trafficManager = new TrafficManager();
