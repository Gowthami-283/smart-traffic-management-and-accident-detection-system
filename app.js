/**
 * Smart Traffic Management and Accident Detection System
 * Main Application Orchestrator & UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canvas Visualizer
  if (typeof window.initIntersectionCanvas === 'function') {
    window.intersectionCanvas = window.initIntersectionCanvas('intersection-canvas');
  }

  // 2. Real-time Digital Date & Clock
  initLiveClock();

  // 3. Audio Context Unlocker on first user interaction
  const unlockAudio = () => {
    if (window.soundSynthesizer) {
      window.soundSynthesizer.initContext();
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);

  // 4. Bind Control Buttons & Handlers
  bindDashboardControls();

  // 5. Setup Signal UI Watcher
  setupSignalUIWatcher();

  // 6. Setup Audio State Watcher for Visual Alarm Indicator
  setupAlarmStateWatcher();

  // 7. Initial History Render
  if (window.accidentManager) {
    window.accidentManager.renderHistoryTable();
  }

  // 8. Initial Analytics Render
  if (window.trafficAnalytics) {
    window.trafficAnalytics.renderAll();
  }

  // 9. Attach Keyboard Shortcuts for smooth presentation
  setupKeyboardShortcuts();
});

/**
 * Live Digital Date & Clock (HH:MM:SS format with date)
 */
function initLiveClock() {
  const clockEl = document.getElementById('digital-clock');
  const dateEl = document.getElementById('digital-date');

  function update() {
    const now = new Date();
    
    // Time: HH:MM:SS
    const pad = (n) => String(n).padStart(2, '0');
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    if (clockEl) {
      clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    }

    // Date: e.g. Friday, Oct 30, 2026
    if (dateEl) {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  update();
  setInterval(update, 1000);
}

/**
 * Connect all UI buttons to their backend managers
 */
function bindDashboardControls() {
  // Simulate Accident Button (Header & Panel)
  const simAccidentBtn = document.getElementById('btn-simulate-accident');
  if (simAccidentBtn) {
    simAccidentBtn.addEventListener('click', () => {
      if (window.soundSynthesizer) window.soundSynthesizer.initContext();
      if (window.accidentManager) {
        window.accidentManager.triggerAccident();
      }
    });
  }

  // Test Alarm Button
  const testAlarmBtn = document.getElementById('btn-test-alarm');
  if (testAlarmBtn) {
    testAlarmBtn.addEventListener('click', () => {
      if (window.soundSynthesizer) {
        const isRunning = window.soundSynthesizer.testEmergencyAlarm(4);
        testAlarmBtn.textContent = isRunning ? '🔊 Testing Alarm...' : '🔊 Test Alarm';
        setTimeout(() => {
          testAlarmBtn.textContent = '🔊 Test Alarm';
        }, 4200);
      }
    });
  }

  // Stop Alarm Button (Header & Floating)
  const stopAlarmBtn = document.getElementById('btn-stop-alarm');
  if (stopAlarmBtn) {
    stopAlarmBtn.addEventListener('click', () => {
      if (window.soundSynthesizer) {
        window.soundSynthesizer.stopEmergencyAlarm();
      }
      if (window.accidentManager) {
        window.accidentManager.silenceAlarm();
      }
    });
  }

  // Modal Buttons
  const modalSilenceBtn = document.getElementById('modal-btn-silence');
  if (modalSilenceBtn) {
    modalSilenceBtn.addEventListener('click', () => {
      if (window.accidentManager) {
        window.accidentManager.silenceAlarm();
      }
    });
  }

  const modalResolveBtn = document.getElementById('modal-btn-resolve');
  if (modalResolveBtn) {
    modalResolveBtn.addEventListener('click', () => {
      if (window.accidentManager) {
        window.accidentManager.resolveAccident();
      }
    });
  }

  const modalCloseBtn = document.getElementById('modal-btn-close');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      if (window.accidentManager) {
        window.accidentManager.closeEmergencyModal();
      }
    });
  }

  // History Controls
  const clearHistoryBtn = document.getElementById('btn-clear-history');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (window.accidentManager) {
        window.accidentManager.clearHistory();
      }
    });
  }

  const exportCsvBtn = document.getElementById('btn-export-csv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (window.accidentManager) {
        window.accidentManager.exportHistoryCSV();
      }
    });
  }

  // Filter Dropdowns
  const filterLaneSelect = document.getElementById('filter-history-lane');
  const filterStatusSelect = document.getElementById('filter-history-status');
  const applyFilters = () => {
    const lane = filterLaneSelect ? filterLaneSelect.value : 'all';
    const status = filterStatusSelect ? filterStatusSelect.value : 'all';
    if (window.accidentManager) {
      window.accidentManager.renderHistoryTable(lane, status);
    }
  };
  if (filterLaneSelect) filterLaneSelect.addEventListener('change', applyFilters);
  if (filterStatusSelect) filterStatusSelect.addEventListener('change', applyFilters);

  // Pause / Resume Traffic Cycle Button
  const pauseCycleBtn = document.getElementById('btn-pause-cycle');
  if (pauseCycleBtn) {
    pauseCycleBtn.addEventListener('click', () => {
      if (window.trafficManager) {
        const isPaused = window.trafficManager.togglePause();
        pauseCycleBtn.textContent = isPaused ? '▶ Resume Cycle' : '⏸ Pause Cycle';
        pauseCycleBtn.classList.toggle('btn-warning', isPaused);
      }
    });
  }

  // Auto-Incident Detection Toggle Switch
  const autoDetectToggle = document.getElementById('toggle-auto-detect');
  if (autoDetectToggle) {
    autoDetectToggle.addEventListener('change', (e) => {
      if (window.accidentManager) {
        window.accidentManager.toggleAutoDetection();
      }
    });
  }

  // Direction Lane Cards: Density Switchers & Force Green
  ['north', 'east', 'south', 'west'].forEach(dir => {
    // Density buttons
    ['low', 'medium', 'high'].forEach(dens => {
      const btn = document.getElementById(`btn-dens-${dir}-${dens}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (window.trafficManager) {
            window.trafficManager.setLaneDensity(dir, dens);
            if (window.soundSynthesizer) window.soundSynthesizer.playUiBeep(800, 0.04);
          }
        });
      }
    });

    // Priority Green button
    const forceBtn = document.getElementById(`btn-force-${dir}`);
    if (forceBtn) {
      forceBtn.addEventListener('click', () => {
        if (window.trafficManager) {
          window.trafficManager.forceGreen(dir);
        }
      });
    }

    // Trigger accident for specific lane button
    const accBtn = document.getElementById(`btn-acc-${dir}`);
    if (accBtn) {
      accBtn.addEventListener('click', () => {
        if (window.accidentManager) {
          window.accidentManager.triggerAccident(dir);
        }
      });
    }
  });
}

/**
 * Update HTML signal cards whenever traffic state changes
 */
function setupSignalUIWatcher() {
  window.addEventListener('traffic-state-changed', (e) => {
    const { lanes } = e.detail;
    if (!lanes) return;

    ['north', 'east', 'south', 'west'].forEach(key => {
      const lane = lanes[key];
      if (!lane) return;

      // Card container
      const card = document.getElementById(`lane-card-${key}`);
      if (card) {
        card.classList.remove('lane-active-green', 'lane-active-yellow', 'lane-active-red', 'lane-blocked');
        if (lane.isBlocked) {
          card.classList.add('lane-blocked');
        } else {
          card.classList.add(`lane-active-${lane.signalState}`);
        }
      }

      // Signal Lights (Red, Yellow, Green)
      const redLamp = document.getElementById(`lamp-${key}-red`);
      const yelLamp = document.getElementById(`lamp-${key}-yellow`);
      const grnLamp = document.getElementById(`lamp-${key}-green`);

      if (redLamp) redLamp.classList.toggle('active', lane.signalState === 'red');
      if (yelLamp) yelLamp.classList.toggle('active', lane.signalState === 'yellow');
      if (grnLamp) grnLamp.classList.toggle('active', lane.signalState === 'green');

      // Countdown Timer Display
      const timerEl = document.getElementById(`timer-${key}`);
      if (timerEl) {
        timerEl.textContent = `${String(Math.max(0, lane.countdown)).padStart(2, '0')}s`;
        timerEl.className = `signal-timer timer-${lane.signalState}`;
      }

      // Status Badge
      const statusEl = document.getElementById(`status-${key}`);
      if (statusEl) {
        if (lane.isBlocked) {
          statusEl.textContent = 'BLOCKED (ACCIDENT)';
          statusEl.className = 'signal-status-badge badge-blocked';
        } else if (lane.signalState === 'green') {
          statusEl.textContent = 'GO';
          statusEl.className = 'signal-status-badge badge-green';
        } else if (lane.signalState === 'yellow') {
          statusEl.textContent = 'SLOW / WAIT';
          statusEl.className = 'signal-status-badge badge-yellow';
        } else {
          statusEl.textContent = 'STOP';
          statusEl.className = 'signal-status-badge badge-red';
        }
      }

      // Vehicle Queue Count
      const queueEl = document.getElementById(`queue-${key}`);
      if (queueEl) {
        queueEl.textContent = `${lane.vehicles} veh`;
      }

      // Density Active Button Highlight
      ['low', 'medium', 'high'].forEach(dens => {
        const btn = document.getElementById(`btn-dens-${key}-${dens}`);
        if (btn) {
          btn.classList.toggle('active', lane.density === dens);
        }
      });
    });
  });
}

/**
 * Keep top alarm banner and indicators synced with audio siren state
 */
function setupAlarmStateWatcher() {
  window.addEventListener('alarm-state-changed', (e) => {
    const { active } = e.detail;
    const sirenIndicator = document.getElementById('header-siren-indicator');
    const stopAlarmBtn = document.getElementById('btn-stop-alarm');

    if (sirenIndicator) {
      if (active) {
        sirenIndicator.textContent = '🚨 SIREN ACTIVE';
        sirenIndicator.className = 'system-badge badge-danger-pulse';
      } else {
        sirenIndicator.textContent = 'SIREN QUIET';
        sirenIndicator.className = 'system-badge badge-normal';
      }
    }

    if (stopAlarmBtn) {
      stopAlarmBtn.classList.toggle('btn-blinking', active);
    }
  });
}

/**
 * Keyboard shortcuts for demo presentation:
 * [A] - Simulate Accident
 * [S] - Stop Alarm
 * [T] - Test Alarm
 * [Space] - Pause / Resume Cycle
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (e.key === 'a' || e.key === 'A') {
      if (window.accidentManager) window.accidentManager.triggerAccident();
    } else if (e.key === 's' || e.key === 'S') {
      if (window.soundSynthesizer) window.soundSynthesizer.stopEmergencyAlarm();
      if (window.accidentManager) window.accidentManager.silenceAlarm();
    } else if (e.key === 't' || e.key === 'T') {
      if (window.soundSynthesizer) window.soundSynthesizer.testEmergencyAlarm(4);
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (window.trafficManager) {
        const isPaused = window.trafficManager.togglePause();
        const pauseBtn = document.getElementById('btn-pause-cycle');
        if (pauseBtn) {
          pauseBtn.textContent = isPaused ? '▶ Resume Cycle' : '⏸ Pause Cycle';
          pauseBtn.classList.toggle('btn-warning', isPaused);
        }
      }
    }
  });
}
