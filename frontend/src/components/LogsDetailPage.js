// LogsDetailPage => full system event log with filtering and export
import React, { useState, useEffect } from 'react';
import { fetchLogs, clearLogs } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid #2a3550',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
};

const formatTime = (iso) => new Date(iso).toLocaleTimeString();
const formatDate = (iso) => new Date(iso).toLocaleDateString();

function LogsDetailPage() {
  const [data, setData] = useState({ logs: [], alerts: [] });
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memHistory, setMemHistory] = useState([]);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchLogs();
        setData(res.data);

        // Build history from logs
        const logs = res.data.logs || [];
        setCpuHistory(logs.slice().reverse().map(l => ({
          time: formatTime(l.timestamp),
          cpu: l.cpu_percent,
        })));
        setMemHistory(logs.slice().reverse().map(l => ({
          time: formatTime(l.timestamp),
          mem: l.memory_percent,
        })));
      } catch (err) {
        console.error('Logs detail fetch error:', err);
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    try {
      await clearLogs();
      setData({ logs: [], alerts: [] });
      setCpuHistory([]);
      setMemHistory([]);
    } catch (err) {
      console.error('Clear logs error:', err);
    }
  };

  const handleExportCSV = () => {
    if (!data.logs.length) return;
    const headers = 'Timestamp,CPU %,Memory %,Disk Read MB,Disk Write MB,Net Recv MB,Net Sent MB,Zombies,Alert\n';
    const rows = data.logs.map(l =>
      `${l.timestamp},${l.cpu_percent},${l.memory_percent},${l.disk_read_mb},${l.disk_write_mb},${l.net_recv_mb},${l.net_sent_mb},${l.zombie_count || 0},${l.alert || ''}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osctl_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter logs
  const filteredLogs = data.logs.filter(log => {
    const matchesText = !filter ||
      log.timestamp.includes(filter) ||
      (log.alert && log.alert.toLowerCase().includes(filter.toLowerCase()));

    const matchesLevel = levelFilter === 'all' ||
      (levelFilter === 'alerts' && (log.alert || log.alert_mem)) ||
      (levelFilter === 'normal' && !log.alert && !log.alert_mem);

    return matchesText && matchesLevel;
  });

  const alertLogs = data.logs.filter(l => l.alert || l.alert_mem);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div>
          <h2 className="detail-title">System Event Log</h2>
          <p className="detail-subtitle">{data.logs.length} entries · {alertLogs.length} alerts triggered</p>
        </div>
        <div className="logs-detail-actions">
          <button className="export-btn" onClick={handleExportCSV}>↓ Export CSV</button>
          <button className="clear-btn" onClick={handleClear}>Clear All</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* CPU History from Logs */}
        <div className="detail-card span-2">
          <h4>CPU Usage (from logs)</h4>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={cpuHistory}>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="cpu" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Memory History from Logs */}
        <div className="detail-card">
          <h4>Memory Usage (from logs)</h4>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={memHistory}>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="mem" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Full Log Table */}
        <div className="detail-card span-3">
          <div className="proc-table-header">
            <h4>Event Log</h4>
            <div className="proc-table-controls">
              <div className="state-filters">
                <button className={`state-filter-btn ${levelFilter === 'all' ? 'active' : ''}`} onClick={() => setLevelFilter('all')}>
                  All
                </button>
                <button className={`state-filter-btn ${levelFilter === 'alerts' ? 'active' : ''}`} onClick={() => setLevelFilter('alerts')}>
                  Alerts Only
                  <span className="state-count">{alertLogs.length}</span>
                </button>
                <button className={`state-filter-btn ${levelFilter === 'normal' ? 'active' : ''}`} onClick={() => setLevelFilter('normal')}>
                  Normal
                </button>
              </div>
              <input
                type="text"
                className="process-filter proc-detail-filter"
                placeholder="Search logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="logs-detail-table">
            <div className="logs-detail-thead">
              <span className="log-col time">TIME</span>
              <span className="log-col cpu">CPU</span>
              <span className="log-col mem">MEM</span>
              <span className="log-col disk">DISK R/W</span>
              <span className="log-col net">NET R/S</span>
              <span className="log-col zombie">ZOMBIE</span>
              <span className="log-col alert-col">ALERT</span>
            </div>
            <div className="logs-detail-tbody">
              {filteredLogs.map((log, i) => (
                <div className={`logs-detail-row ${log.alert || log.alert_mem ? 'has-alert' : ''}`} key={i}>
                  <span className="log-col time">
                    <span className="log-time-main">{formatTime(log.timestamp)}</span>
                    <span className="log-time-date">{formatDate(log.timestamp)}</span>
                  </span>
                  <span className={`log-col cpu ${log.cpu_percent > 80 ? 'critical' : log.cpu_percent > 60 ? 'warning' : ''}`}>
                    {log.cpu_percent}%
                  </span>
                  <span className={`log-col mem ${log.memory_percent > 85 ? 'critical' : log.memory_percent > 70 ? 'warning' : ''}`}>
                    {log.memory_percent}%
                  </span>
                  <span className="log-col disk">{log.disk_read_mb} / {log.disk_write_mb}</span>
                  <span className="log-col net">{log.net_recv_mb} / {log.net_sent_mb}</span>
                  <span className={`log-col zombie ${log.zombie_count > 0 ? 'warning' : ''}`}>
                    {log.zombie_count || 0}
                  </span>
                  <span className="log-col alert-col">
                    {(log.alert || log.alert_mem) ? (
                      <span className="alert-tag">{log.alert || log.alert_mem}</span>
                    ) : (
                      <span className="no-alert">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogsDetailPage;