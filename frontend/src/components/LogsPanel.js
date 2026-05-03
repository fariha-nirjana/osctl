// LogsPanel (system event logger with timestamped entries and alert highlighting)
import React, { useState, useEffect } from 'react';
import { fetchLogs, clearLogs } from '../api';

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString();
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString();
};

function LogsPanel() {
  const [data, setData] = useState({ logs: [], alerts: [], alert_count: 0 });

  useEffect(() => {
    // Fetch immediately on mount
    fetchLogs().then(res => setData(res.data)).catch(console.error);

    const interval = setInterval(async () => {
      try {
        const res = await fetchLogs();
        setData(res.data);
      } catch (err) {
        console.error('Logs fetch error:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    try {
      await clearLogs();
      setData({ logs: [], alerts: [], alert_count: 0 });
    } catch (err) {
      console.error('Clear logs error:', err);
    }
  };

  return (
    <div className="panel logs-panel">
      <div className="logs-header">
        <h3>SYSTEM EVENT LOG</h3>
        <div className="logs-actions">
          <span className="log-count">{data.logs.length} entries</span>
          <button className="clear-btn" onClick={handleClear}>Clear</button>
        </div>
      </div>

      {data.alerts.length > 0 && (
        <div className="alerts-banner">
          <span className="alerts-icon">⚠</span>
          <span className="alerts-text">{data.alert_count} active alert(s)</span>
        </div>
      )}

      <div className="alerts-section">
        {data.alerts.map((alert, i) => (
          <div className={`alert-item ${alert.level}`} key={i}>
            <span className="alert-dot"></span>
            <span className="alert-message">{alert.message}</span>
            <span className="alert-threshold">threshold: {alert.threshold}%</span>
          </div>
        ))}
      </div>

      <div className="logs-list">
        {data.logs.map((log, i) => (
          <div className={`log-entry ${log.alert ? 'has-alert' : ''}`} key={i}>
            <div className="log-time">
              <span className="log-timestamp">{formatTime(log.timestamp)}</span>
              <span className="log-date">{formatDate(log.timestamp)}</span>
            </div>
            <div className="log-metrics">
              <span className={`log-metric ${log.cpu_percent > 80 ? 'critical' : log.cpu_percent > 60 ? 'warning' : ''}`}>
                CPU {log.cpu_percent}%
              </span>
              <span className={`log-metric ${log.memory_percent > 85 ? 'critical' : log.memory_percent > 70 ? 'warning' : ''}`}>
                MEM {log.memory_percent}%
              </span>
              <span className="log-metric">DISK R:{log.disk_read_mb} W:{log.disk_write_mb} MB</span>
              <span className="log-metric">NET ↓{log.net_recv_mb} ↑{log.net_sent_mb} MB</span>
              {log.zombie_count > 0 && (
                <span className="log-metric warning">ZOMBIE ×{log.zombie_count}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogsPanel;