// MetricStrip (top summary cards with live data)
import React, { useState, useEffect } from 'react';
import { fetchCpu, fetchMemory, fetchDisk, fetchNetwork, fetchProcesses } from '../api';

function MetricStrip() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [cpu, mem, disk, net, procs] = await Promise.all([
          fetchCpu(),
          fetchMemory(),
          fetchDisk(),
          fetchNetwork(),
          fetchProcesses(),
        ]);

        setMetrics({
          cpu: cpu.data.overall,
          memUsed: (mem.data.used / 1073741824).toFixed(1),
          memTotal: (mem.data.total / 1073741824).toFixed(1),
          memPercent: mem.data.percent,
          diskRead: (disk.data.io.read_bytes / 1048576).toFixed(0),
          diskWrite: (disk.data.io.write_bytes / 1048576).toFixed(0),
          netIn: (net.data.bytes_recv / 1048576).toFixed(1),
          connections: net.data.connections,
          procCount: procs.data.length,
        });
      } catch (err) {
        console.error('MetricStrip fetch error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="metric-strip">
        {['CPU', 'MEMORY', 'DISK', 'NETWORK', 'PROCS'].map(label => (
          <div className="metric-card" key={label}>
            <span className="metric-label">{label}</span>
            <span className="metric-value">—</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="metric-strip">
      <div className="metric-card">
        <span className="metric-label">CPU</span>
        <span className="metric-value">{metrics.cpu}<span className="metric-unit">%</span></span>
      </div>
      <div className="metric-card">
        <span className="metric-label">MEMORY</span>
        <span className="metric-value">
          {metrics.memUsed}<span className="metric-unit"> / {metrics.memTotal} GB</span>
        </span>
      </div>
      <div className="metric-card">
        <span className="metric-label">DISK</span>
        <span className="metric-value">{metrics.diskRead}<span className="metric-unit"> MB/s</span></span>
      </div>
      <div className="metric-card">
        <span className="metric-label">NETWORK</span>
        <span className="metric-value">{metrics.netIn}<span className="metric-unit"> MB/s</span></span>
        <span className="metric-sub">{metrics.connections} conn</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">PROCS</span>
        <span className="metric-value">{metrics.procCount}</span>
      </div>
    </div>
  );
}

export default MetricStrip;