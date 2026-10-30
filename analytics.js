/**
 * Smart Traffic Management and Accident Detection System
 * Traffic Analytics Engine & Real-Time Canvas Charts
 * 
 * Features:
 * - Real-time Directional Density Comparison Bar Chart
 * - Vehicle Composition / Fleet Distribution Donut Chart
 * - 24-Hour Traffic Volume & Incident Trend Area Chart
 * - Dynamic stat calculations (Throughput, Congestion Index, Incident Rate)
 * - Self-contained high-performance Canvas charts (Zero external library dependencies)
 */

class TrafficAnalytics {
  constructor() {
    this.densityCanvas = document.getElementById('density-bar-chart');
    this.donutCanvas = document.getElementById('vehicle-donut-chart');
    this.trendCanvas = document.getElementById('hourly-trend-chart');

    this.dpr = window.devicePixelRatio || 1;

    // 24-hour baseline hourly traffic volume (vehicles / hr)
    this.hourlyData = [
      { hour: '00:00', volume: 180, incidents: 0 },
      { hour: '02:00', volume: 90, incidents: 0 },
      { hour: '04:00', volume: 120, incidents: 0 },
      { hour: '06:00', volume: 460, incidents: 1 },
      { hour: '08:00', volume: 1240, incidents: 2 },
      { hour: '10:00', volume: 980, incidents: 1 },
      { hour: '12:00', volume: 820, incidents: 0 },
      { hour: '14:00', volume: 780, incidents: 1 },
      { hour: '16:00', volume: 1100, incidents: 2 },
      { hour: '18:00', volume: 1450, incidents: 3 },
      { hour: '20:00', volume: 890, incidents: 1 },
      { hour: '22:00', volume: 410, incidents: 0 }
    ];

    // Vehicle fleet distribution
    this.fleetData = [
      { type: 'Passenger Cars', percentage: 54, color: '#38bdf8' },
      { type: 'Two-Wheelers', percentage: 22, color: '#a855f7' },
      { type: 'Commercial Trucks', percentage: 14, color: '#f59e0b' },
      { type: 'Buses / Emergency', percentage: 10, color: '#10b981' }
    ];

    this.init();
    this.bindEvents();
  }

  init() {
    this.setupCanvases();
    this.renderAll();
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.setupCanvases();
      this.renderAll();
    });

    // Refresh charts on traffic changes
    window.addEventListener('traffic-state-changed', () => {
      this.renderDensityBarChart();
      this.updateKPICounters();
    });

    window.addEventListener('accident-detected', () => {
      this.renderHourlyTrendChart();
      this.updateKPICounters();
    });

    window.addEventListener('accident-resolved', () => {
      this.updateKPICounters();
    });
  }

  setupCanvases() {
    [this.densityCanvas, this.donutCanvas, this.trendCanvas].forEach(canvas => {
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width - 20;
      const h = canvas.getAttribute('data-height') ? parseInt(canvas.getAttribute('data-height')) : 220;

      canvas.width = w * this.dpr;
      canvas.height = h * this.dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      ctx.resetTransform?.();
      ctx.scale(this.dpr, this.dpr);
    });
  }

  renderAll() {
    this.renderDensityBarChart();
    this.renderVehicleDonutChart();
    this.renderHourlyTrendChart();
    this.updateKPICounters();
  }

  /**
   * Directional Traffic Density & Queue Bar Chart
   */
  renderDensityBarChart() {
    if (!this.densityCanvas) return;
    const ctx = this.densityCanvas.getContext('2d');
    const w = parseFloat(this.densityCanvas.style.width) || 300;
    const h = parseFloat(this.densityCanvas.style.height) || 220;

    ctx.clearRect(0, 0, w, h);

    const lanes = window.trafficManager ? window.trafficManager.lanes : {
      north: { short: 'N', name: 'North', vehicles: 24, density: 'medium' },
      east: { short: 'E', name: 'East', vehicles: 45, density: 'high' },
      south: { short: 'S', name: 'South', vehicles: 12, density: 'low' },
      west: { short: 'W', name: 'West', vehicles: 32, density: 'medium' }
    };

    const keys = ['north', 'east', 'south', 'west'];
    const maxCapacity = 70;
    const paddingLeft = 40;
    const paddingBottom = 35;
    const chartW = w - paddingLeft - 20;
    const chartH = h - paddingBottom - 25;
    const barWidth = Math.min(38, chartW / 5);
    const spacing = chartW / 4;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 3; i++) {
      const yVal = Math.round((maxCapacity / 3) * i);
      const yPos = h - paddingBottom - (chartH / 3) * i;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(w - 20, yPos);
      ctx.stroke();

      ctx.fillText(String(yVal), paddingLeft - 8, yPos + 3);
    }

    // Draw bars
    keys.forEach((key, index) => {
      const lane = lanes[key];
      const count = lane ? lane.vehicles : 0;
      const barH = (count / maxCapacity) * chartH;
      const xPos = paddingLeft + spacing * index + (spacing - barWidth) / 2;
      const yPos = h - paddingBottom - barH;

      // Color based on density
      let gradColorStart = '#38bdf8';
      let gradColorEnd = '#0284c7';
      if (lane && lane.density === 'high') {
        gradColorStart = '#ef4444';
        gradColorEnd = '#b91c1c';
      } else if (lane && lane.density === 'medium') {
        gradColorStart = '#f59e0b';
        gradColorEnd = '#d97706';
      } else {
        gradColorStart = '#10b981';
        gradColorEnd = '#059669';
      }

      // Bar gradient
      const grad = ctx.createLinearGradient(0, yPos, 0, h - paddingBottom);
      grad.addColorStop(0, gradColorStart);
      grad.addColorStop(1, gradColorEnd);

      ctx.fillStyle = grad;
      this.drawRoundedBar(ctx, xPos, yPos, barWidth, barH, 4);

      // Value text on top
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(count), xPos + barWidth / 2, yPos - 6);

      // Label below bar
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`${key.toUpperCase()}`, xPos + barWidth / 2, h - paddingBottom + 16);

      // Density badge dot below
      ctx.beginPath();
      ctx.arc(xPos + barWidth / 2, h - paddingBottom + 26, 3, 0, Math.PI * 2);
      ctx.fillStyle = gradColorStart;
      ctx.fill();
    });
  }

  /**
   * Vehicle Fleet Mix Donut Chart
   */
  renderVehicleDonutChart() {
    if (!this.donutCanvas) return;
    const ctx = this.donutCanvas.getContext('2d');
    const w = parseFloat(this.donutCanvas.style.width) || 300;
    const h = parseFloat(this.donutCanvas.style.height) || 220;

    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.38;
    const cy = h / 2;
    const outerRadius = Math.min(cx - 20, cy - 20);
    const innerRadius = outerRadius * 0.62;

    let startAngle = -Math.PI / 2;

    this.fleetData.forEach(item => {
      const sliceAngle = (item.percentage / 100) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = item.color;
      ctx.fill();

      startAngle = endAngle;
    });

    // Donut hole text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('100%', cx, cy - 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('FLEET MIX', cx, cy + 10);

    // Legend on the right side
    const legendX = cx + outerRadius + 24;
    let legendY = cy - 42;

    this.fleetData.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.type}`, legendX + 12, legendY + 3);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(`${item.percentage}%`, legendX + 130, legendY + 3);

      legendY += 24;
    });
  }

  /**
   * 24-Hour Traffic Flow & Incident Trend Area Chart
   */
  renderHourlyTrendChart() {
    if (!this.trendCanvas) return;
    const ctx = this.trendCanvas.getContext('2d');
    const w = parseFloat(this.trendCanvas.style.width) || 300;
    const h = parseFloat(this.trendCanvas.style.height) || 220;

    ctx.clearRect(0, 0, w, h);

    const paddingLeft = 45;
    const paddingBottom = 30;
    const chartW = w - paddingLeft - 20;
    const chartH = h - paddingBottom - 25;
    const maxVal = 1600;

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';

    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = (maxVal / steps) * i;
      const y = h - paddingBottom - (chartH / steps) * i;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();

      ctx.fillText(String(val), paddingLeft - 8, y + 3);
    }

    const points = this.hourlyData.map((d, index) => {
      const x = paddingLeft + (chartW / (this.hourlyData.length - 1)) * index;
      const y = h - paddingBottom - (d.volume / maxVal) * chartH;
      return { x, y, ...d };
    });

    // Fill smooth area under curve
    const areaGrad = ctx.createLinearGradient(0, 20, 0, h - paddingBottom);
    areaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    areaGrad.addColorStop(1, 'rgba(56, 189, 248, 0.01)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - paddingBottom);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, h - paddingBottom);
    ctx.closePath();
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Stroke the trend line
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw points & X-axis labels
    points.forEach((pt, idx) => {
      // Glow point
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Show incidents as red highlight
      if (pt.incidents > 0) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y - 10, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        ctx.fillStyle = '#fca5a5';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`!`, pt.x, pt.y - 7);
      }

      // Time label on X-axis (every 2nd label to prevent crowding)
      if (idx % 2 === 0 || idx === points.length - 1) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pt.hour, pt.x, h - paddingBottom + 18);
      }
    });
  }

  /**
   * Update Key Performance Indicators in the dashboard
   */
  updateKPICounters() {
    const totalVehiclesEl = document.getElementById('kpi-total-vehicles');
    const totalAccidentsEl = document.getElementById('kpi-total-accidents');
    const avgDensityEl = document.getElementById('kpi-avg-density');
    const activeSignalsEl = document.getElementById('kpi-active-signals');

    if (totalVehiclesEl && window.trafficManager) {
      totalVehiclesEl.textContent = window.trafficManager.totalVehiclesProcessed.toLocaleString();
    }

    if (totalAccidentsEl && window.accidentManager) {
      const count = window.accidentManager.incidentHistory.length;
      totalAccidentsEl.textContent = String(count);
    }

    if (avgDensityEl && window.trafficManager) {
      const overall = window.trafficManager.getOverallDensity();
      avgDensityEl.textContent = overall.label;
      avgDensityEl.className = `kpi-density-badge ${overall.class}`;
    }

    if (activeSignalsEl && window.trafficManager) {
      activeSignalsEl.textContent = '4 / 4 Normal';
    }
  }

  drawRoundedBar(ctx, x, y, width, height, radius) {
    if (height <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
  }
}

// Export singleton instance
window.trafficAnalytics = new TrafficAnalytics();
