// AlertsDetailPage => dedicated alerts view with active alerts, thresholds, and alert history
import React, { useState, useEffect } from 'react';
import { fetchLogs } from '../api';
import { useAlerts } from './AlertContext';

function AlertsDetailPage() {
  const { alertData } = useAlerts();
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchLogs();
        setAlerts(res.data.alerts || []);
        // Filter logs that had alerts
        const alertLogs = (res.data.logs || []).filter(l => l.alert || l.alert_mem || l.zombie_count > 0);
        setLogs(alertLogs);
      } catch (err) {
        console.error('Alerts fetch error:', err);
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 10000);
    return () => clearInterval(interval);
  }, []);

  const thresholds = [
    { metric: 'CPU', warning: '60%', critical: '80%', desc: 'Triggers when CPU usage exceeds threshold' },
    { metric: 'Memory', warning: '70%', critical: '85%', desc: 'Triggers when RAM usage exceeds threshold' },
    { metric: 'Zombie Procs', warning: '> 0', critical: '—', desc: 'Triggers when zombie processes are detected' },
  ];

  const formatTime = (iso) => new Date(iso).toLocaleTimeString();
  const formatDate = (iso) => new Date(iso).toLocaleDateString();

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div>
          <h2 className="detail-title">Alerts</h2>
          <p className="detail-subtitle">
            {alerts.length > 0
              ? `${alerts.length} active alert(s) right now`
              : 'All systems nominal — no active alerts'}
          </p>
        </div>
        <div className="detail-stats-row">
          <div className="detail-stat">
            <span className="detail-stat-label">ACTIVE</span>
            <span className="detail-stat-value" style={{ color: alerts.length > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
              {alerts.length}
            </span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">HISTORY</span>
            <span className="detail-stat-value">{logs.length}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Active Alerts */}
        <div className="detail-card span-2">
          <h4>Active Alerts</h4>
          {alerts.length === 0 ? (
            <div className="no-alerts-display">
              <span className="no-alerts-icon">✓</span>
              <span className="no-alerts-text">All systems nominal</span>
            </div>
          ) : (
            <div className="active-alerts-list">
              {alerts.map((alert, i) => (
                <div className={`active-alert-card ${alert.level}`} key={i}>
                  <div className="active-alert-header">
                    <span className={`active-alert-level ${alert.level}`}>
                      {alert.level === 'critical' ? '🔴' : '🟡'} {alert.level.toUpperCase()}
                    </span>
                  </div>
                  <span className="active-alert-message">{alert.message}</span>
                  <span className="active-alert-threshold">Threshold: {alert.threshold}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Thresholds */}
        <div className="detail-card">
          <h4>Alert Thresholds</h4>
          <div className="thresholds-list">
            {thresholds.map((t, i) => (
              <div className="threshold-card" key={i}>
                <div className="threshold-header">
                  <span className="threshold-icon">{t.icon}</span>
                  <span className="threshold-metric">{t.metric}</span>
                </div>
                <div className="threshold-levels">
                  <div className="threshold-level">
                    <span className="threshold-level-label warning-label">Warning</span>
                    <span className="threshold-level-value">{t.warning}</span>
                  </div>
                  <div className="threshold-level">
                    <span className="threshold-level-label critical-label">Critical</span>
                    <span className="threshold-level-value">{t.critical}</span>
                  </div>
                </div>
                <span className="threshold-desc">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert History */}
        <div className="detail-card span-3">
          <h4>Alert History ({logs.length} events)</h4>
          <div className="alert-history-list">
            {logs.length === 0 ? (
              <p className="no-history-text">No alerts have been triggered yet.</p>
            ) : (
              logs.map((log, i) => (
                <div className="alert-history-row" key={i}>
                  <div className="alert-history-time">
                    <span className="alert-history-timestamp">{formatTime(log.timestamp)}</span>
                    <span className="alert-history-date">{formatDate(log.timestamp)}</span>
                  </div>
                  <div className="alert-history-details">
                    {log.alert && (
                      <span className={`alert-history-tag ${log.alert.includes('HIGH') ? 'critical' : 'warning'}`}>
                        {log.alert}
                      </span>
                    )}
                    {log.alert_mem && (
                      <span className="alert-history-tag critical">{log.alert_mem}</span>
                    )}
                    {log.zombie_count > 0 && (
                      <span className="alert-history-tag warning">{log.zombie_count} zombie(s)</span>
                    )}
                  </div>
                  <div className="alert-history-metrics">
                    <span>CPU: {log.cpu_percent}%</span>
                    <span>MEM: {log.memory_percent}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertsDetailPage;