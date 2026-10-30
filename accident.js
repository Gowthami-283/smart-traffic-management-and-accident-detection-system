/**
 * Smart Traffic Management and Accident Detection System
 * Accident Detection Engine, Emergency Alert & Incident Response Manager
 * 
 * Features:
 * - Simulated Accident Triggering (Interactive & Automated)
 * - Web Audio Siren Synchronization
 * - Emergency Modal Notification & Perimeter Visual Strobe
 * - Dynamic Response Status Workflow (Detection -> Alert -> Dispatch -> Clearance)
 * - Persistent Incident History in localStorage
 * - CSV Export & Incident Resolution
 * - Safe DOM updates (XSS-safe textContent & element creation)
 */

class AccidentManager {
  constructor() {
    this.storageKey = 'smart_traffic_accident_history_v1';
    this.activeAccident = null;
    this.incidentHistory = [];
    this.responseTimer = null;
    this.autoIncidentInterval = null;
    this.isAutoDetectionEnabled = false;

    this.initHistory();
  }

  /**
   * Initialize and seed history from localStorage or defaults
   */
  initHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.incidentHistory = JSON.parse(stored);
      } else {
        // Pre-populate with realistic demo records so table isn't empty
        this.incidentHistory = [
          {
            id: 'INC-7092',
            timestamp: this.formatDate(new Date(Date.now() - 3600000 * 2.5)),
            lane: 'North',
            laneKey: 'north',
            severity: 'Moderate',
            impactForce: '28.4 g',
            vehicles: 'Sedan #KA-03-MB-4102 & Hatchback #MH-02-DZ-8910',
            status: 'Resolved',
            responseTime: '4m 12s',
            operatorNote: 'Ambulance cleared scene. Normal traffic resumed.'
          },
          {
            id: 'INC-7088',
            timestamp: this.formatDate(new Date(Date.now() - 3600000 * 6.8)),
            lane: 'West',
            laneKey: 'west',
            severity: 'Minor',
            impactForce: '14.1 g',
            vehicles: 'Motorcycle & Compact SUV',
            status: 'Resolved',
            responseTime: '3m 20s',
            operatorNote: 'Minor bumper contact. Both vehicles moved to shoulder.'
          }
        ];
        this.saveHistory();
      }
    } catch (e) {
      this.incidentHistory = [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.incidentHistory));
    } catch (e) {
      console.warn('Unable to persist to localStorage', e);
    }
  }

  formatDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    const YYYY = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const DD = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
  }

  /**
   * Simulate or detect an accident
   */
  triggerAccident(selectedLaneKey = null, severity = null) {
    const lanes = ['north', 'east', 'south', 'west'];
    const laneKey = selectedLaneKey || lanes[Math.floor(Math.random() * lanes.length)];
    const laneNames = {
      north: 'North Approach (Main Arterial 4A)',
      east: 'East Approach (Express Highway 12)',
      south: 'South Approach (Commercial Blvd)',
      west: 'West Approach (Transit Parkway)'
    };

    const severities = ['Minor', 'Moderate', 'Critical'];
    const selectedSeverity = severity || severities[Math.floor(Math.random() * severities.length)];

    const vehiclePairs = [
      'Transit Bus #BL-99 & Sedan #TS-09-EA-3101',
      'Delivery Truck #DL-01-TK-9022 & SUV #KA-05-MM-7721',
      'Two-Wheeler #MH-12-PQ-4412 & Cab #DL-02-TY-1084',
      'Compact Car #WB-04-AX-5544 & Pickup #KA-04-TR-6632'
    ];
    const vehiclesInvolved = vehiclePairs[Math.floor(Math.random() * vehiclePairs.length)];

    const impactForce = (Math.random() * 25 + 15).toFixed(1) + ' g';
    const incidentId = 'INC-' + Math.floor(1000 + Math.random() * 9000);
    const timestamp = this.formatDate(new Date());

    const incident = {
      id: incidentId,
      timestamp: timestamp,
      lane: laneKey.toUpperCase(),
      laneKey: laneKey,
      laneFull: laneNames[laneKey],
      severity: selectedSeverity,
      impactForce: impactForce,
      vehicles: vehiclesInvolved,
      status: 'Active Emergency',
      responseStage: 1, // 1: Detected, 2: EMS Alerted, 3: Responders En-Route, 4: Clear
      etaSeconds: 240, // 4 mins initial ETA
      responseTime: 'In Progress'
    };

    this.activeAccident = incident;

    // Add to history top
    this.incidentHistory.unshift(incident);
    this.saveHistory();

    // 1. Start loud emergency siren
    if (window.soundSynthesizer) {
      window.soundSynthesizer.startEmergencyAlarm();
    }

    // 2. Mark lane in traffic manager to divert incoming traffic
    if (window.trafficManager) {
      window.trafficManager.setLaneBlocked(laneKey, true);
    }

    // 3. Dispatch visual notifications
    this.displayEmergencyPopup(incident);
    this.renderEmergencyBanner(true, incident);
    this.renderHistoryTable();

    // 4. Start automatic progression of emergency response stages
    this.startResponseWorkflow();

    // Notify listeners
    window.dispatchEvent(new CustomEvent('accident-detected', { detail: incident }));

    return incident;
  }

  /**
   * Emergency response progression simulator
   */
  startResponseWorkflow() {
    if (this.responseTimer) clearInterval(this.responseTimer);

    this.responseTimer = setInterval(() => {
      if (!this.activeAccident) {
        clearInterval(this.responseTimer);
        return;
      }

      // Decrement ETA
      if (this.activeAccident.etaSeconds > 0) {
        this.activeAccident.etaSeconds = Math.max(0, this.activeAccident.etaSeconds - 10);
      }

      // Transition stages
      if (this.activeAccident.responseStage === 1 && this.activeAccident.etaSeconds <= 210) {
        this.activeAccident.responseStage = 2; // EMS Alerted
        this.activeAccident.status = 'EMS Dispatched';
        this.updateResponseStatusUI();
      } else if (this.activeAccident.responseStage === 2 && this.activeAccident.etaSeconds <= 120) {
        this.activeAccident.responseStage = 3; // Responders On-Scene
        this.activeAccident.status = 'Units On-Scene';
        this.updateResponseStatusUI();
      }

      this.updateEtaDisplay();
    }, 1000);
  }

  /**
   * Stop alarm and acknowledge
   */
  silenceAlarm() {
    if (window.soundSynthesizer) {
      window.soundSynthesizer.stopEmergencyAlarm();
    }
  }

  /**
   * Resolve an active or past incident
   */
  resolveAccident(incidentId = null) {
    const idToResolve = incidentId || (this.activeAccident ? this.activeAccident.id : null);
    if (!idToResolve) return;

    // Stop siren
    this.silenceAlarm();

    // Find and update in history
    const target = this.incidentHistory.find(i => i.id === idToResolve);
    if (target) {
      target.status = 'Resolved';
      target.responseStage = 4;
      target.responseTime = 'Completed';
    }

    // If active accident was resolved
    if (this.activeAccident && this.activeAccident.id === idToResolve) {
      // Unblock lane
      if (window.trafficManager) {
        window.trafficManager.setLaneBlocked(this.activeAccident.laneKey, false);
      }
      this.activeAccident = null;
      if (this.responseTimer) {
        clearInterval(this.responseTimer);
        this.responseTimer = null;
      }
      this.renderEmergencyBanner(false);
      this.closeEmergencyModal();
    }

    this.saveHistory();
    this.renderHistoryTable();

    window.dispatchEvent(new CustomEvent('accident-resolved', { detail: { id: idToResolve } }));
  }

  /**
   * Clear all incident history with confirmation
   */
  clearHistory() {
    this.incidentHistory = [];
    this.saveHistory();
    this.renderHistoryTable();
  }

  /**
   * Export incident log to CSV format
   */
  exportHistoryCSV() {
    if (this.incidentHistory.length === 0) {
      return false;
    }

    const headers = ['Incident ID', 'Timestamp', 'Lane', 'Severity', 'Impact Force', 'Vehicles Involved', 'Status', 'Response Time'];
    const rows = this.incidentHistory.map(inc => [
      `"${inc.id}"`,
      `"${inc.timestamp}"`,
      `"${inc.lane}"`,
      `"${inc.severity}"`,
      `"${inc.impactForce}"`,
      `"${(inc.vehicles || '').replace(/"/g, '""')}"`,
      `"${inc.status}"`,
      `"${inc.responseTime || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `traffic_incidents_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  /**
   * Toggle autonomous background incident detection
   */
  toggleAutoDetection() {
    this.isAutoDetectionEnabled = !this.isAutoDetectionEnabled;
    if (this.isAutoDetectionEnabled) {
      this.autoIncidentInterval = setInterval(() => {
        // Trigger simulated accident randomly if no active accident exists
        if (!this.activeAccident && Math.random() > 0.4) {
          this.triggerAccident();
        }
      }, 45000); // Check every 45s
    } else {
      if (this.autoIncidentInterval) {
        clearInterval(this.autoIncidentInterval);
        this.autoIncidentInterval = null;
      }
    }
    return this.isAutoDetectionEnabled;
  }

  /**
   * Display modal popup notification
   */
  displayEmergencyPopup(incident) {
    const modal = document.getElementById('emergency-modal');
    if (!modal) return;

    // Update details safely via textContent
    const laneEl = document.getElementById('modal-incident-lane');
    const timeEl = document.getElementById('modal-incident-time');
    const severityEl = document.getElementById('modal-incident-severity');
    const vehiclesEl = document.getElementById('modal-incident-vehicles');
    const forceEl = document.getElementById('modal-incident-force');
    const idEl = document.getElementById('modal-incident-id');

    if (laneEl) laneEl.textContent = incident.laneFull || `${incident.lane} Approach`;
    if (timeEl) timeEl.textContent = incident.timestamp;
    if (severityEl) {
      severityEl.textContent = incident.severity;
      severityEl.className = `badge badge-${incident.severity.toLowerCase()}`;
    }
    if (vehiclesEl) vehiclesEl.textContent = incident.vehicles;
    if (forceEl) forceEl.textContent = incident.impactForce;
    if (idEl) idEl.textContent = incident.id;

    this.updateResponseStatusUI();
    this.updateEtaDisplay();

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Update stage progress UI in modal and card
   */
  updateResponseStatusUI() {
    const stage = this.activeAccident ? this.activeAccident.responseStage : 0;
    const stages = document.querySelectorAll('.response-workflow .step');

    stages.forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');
      if (stepNum < stage) {
        step.classList.add('completed');
      } else if (stepNum === stage) {
        step.classList.add('active');
      }
    });

    const statusBadge = document.getElementById('live-response-status');
    if (statusBadge && this.activeAccident) {
      statusBadge.textContent = this.activeAccident.status;
    }
  }

  updateEtaDisplay() {
    const etaEl = document.getElementById('modal-ems-eta');
    if (etaEl && this.activeAccident) {
      const mins = Math.floor(this.activeAccident.etaSeconds / 60);
      const secs = this.activeAccident.etaSeconds % 60;
      etaEl.textContent = `${mins}m ${String(secs).padStart(2, '0')}s`;
    }
  }

  /**
   * Render or hide top blinking emergency warning bar
   */
  renderEmergencyBanner(show, incident = null) {
    const banner = document.getElementById('global-emergency-banner');
    const body = document.body;

    if (!banner) return;

    if (show && incident) {
      banner.classList.add('active');
      body.classList.add('emergency-strobe-active');

      const textEl = document.getElementById('banner-emergency-text');
      if (textEl) {
        textEl.textContent = `CRITICAL ALERT: Collision Detected on ${incident.lane} Approach! Emergency protocol engaged.`;
      }
    } else {
      banner.classList.remove('active');
      body.classList.remove('emergency-strobe-active');
    }
  }

  /**
   * Render incident history table safely using DOM methods
   */
  renderHistoryTable(filterLane = 'all', filterStatus = 'all') {
    const tbody = document.getElementById('accident-history-tbody');
    const countEl = document.getElementById('history-count-badge');
    const emptyState = document.getElementById('history-empty-state');
    if (!tbody) return;

    tbody.replaceChildren();

    const filtered = this.incidentHistory.filter(inc => {
      const matchLane = filterLane === 'all' || inc.laneKey === filterLane.toLowerCase();
      const matchStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && inc.status !== 'Resolved') ||
        (filterStatus === 'resolved' && inc.status === 'Resolved');
      return matchLane && matchStatus;
    });

    if (countEl) {
      countEl.textContent = `${this.incidentHistory.length} Recorded`;
    }

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }

    filtered.forEach(inc => {
      const tr = document.createElement('tr');
      if (inc.status === 'Active Emergency') {
        tr.classList.add('row-danger-highlight');
      }

      // ID cell
      const tdId = document.createElement('td');
      const idSpan = document.createElement('span');
      idSpan.className = 'incident-id-tag';
      idSpan.textContent = inc.id;
      tdId.appendChild(idSpan);

      // Timestamp cell
      const tdTime = document.createElement('td');
      tdTime.className = 'font-mono text-muted';
      tdTime.textContent = inc.timestamp;

      // Lane cell
      const tdLane = document.createElement('td');
      const laneBadge = document.createElement('span');
      laneBadge.className = 'lane-pill';
      laneBadge.textContent = `${inc.lane} Lane`;
      tdLane.appendChild(laneBadge);

      // Severity cell
      const tdSeverity = document.createElement('td');
      const sevBadge = document.createElement('span');
      sevBadge.className = `badge badge-${inc.severity.toLowerCase()}`;
      sevBadge.textContent = inc.severity;
      tdSeverity.appendChild(sevBadge);

      // Vehicles involved cell
      const tdVehicles = document.createElement('td');
      tdVehicles.className = 'text-truncate';
      tdVehicles.textContent = inc.vehicles || '2 Vehicles Collision';

      // Status cell
      const tdStatus = document.createElement('td');
      const statusBadge = document.createElement('span');
      const isResolved = inc.status === 'Resolved';
      statusBadge.className = `status-chip ${isResolved ? 'chip-success' : 'chip-danger pulse-dot'}`;
      statusBadge.textContent = inc.status;
      tdStatus.appendChild(statusBadge);

      // Actions cell
      const tdActions = document.createElement('td');
      tdActions.className = 'table-actions';

      if (!isResolved) {
        const resolveBtn = document.createElement('button');
        resolveBtn.className = 'btn-sm btn-outline-success';
        resolveBtn.textContent = 'Resolve';
        resolveBtn.title = 'Mark incident as cleared';
        resolveBtn.addEventListener('click', () => {
          this.resolveAccident(inc.id);
        });
        tdActions.appendChild(resolveBtn);
      }

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn-sm btn-outline-info';
      viewBtn.textContent = 'Telemetry';
      viewBtn.title = 'View collision telemetry';
      viewBtn.addEventListener('click', () => {
        this.displayEmergencyPopup(inc);
      });
      tdActions.appendChild(viewBtn);

      tr.appendChild(tdId);
      tr.appendChild(tdTime);
      tr.appendChild(tdLane);
      tr.appendChild(tdSeverity);
      tr.appendChild(tdVehicles);
      tr.appendChild(tdStatus);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
  }
}

// Export singleton instance
window.accidentManager = new AccidentManager();
