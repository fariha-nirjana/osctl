// MetricStrip (top summary cards)
import React from 'react';

function MetricStrip() {
  return (
    <div className="metric-strip">
      <div className="metric-card">
        <span className="metric-label">CPU</span>
        <span className="metric-value">—%</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">MEMORY</span>
        <span className="metric-value">— GB</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">DISK</span>
        <span className="metric-value">— MB/s</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">NETWORK</span>
        <span className="metric-value">— MB/s</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">PROCS</span>
        <span className="metric-value">—</span>
      </div>
    </div>
  );
}

export default MetricStrip;