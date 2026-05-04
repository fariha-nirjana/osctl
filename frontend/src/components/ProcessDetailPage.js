// ProcessDetailPage => full process view with state distribution, top consumers, and detailed table
import React, { useState, useEffect } from 'react';
import { fetchProcesses } from '../api';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid #2a3550',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
};

const STATE_COLORS = {
  running: '#34d399',
  sleeping: '#22d3ee',
  stopped: '#f87171',
  zombie: '#fbbf24',
  idle: '#5a6478',
  other: '#a78bfa',
};

function ProcessDetailPage() {
  const [processes, setProcesses] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('cpu');
  const [sortDir, setSortDir] = useState('desc');
  const [stateFilter, setStateFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [countHistory, setCountHistory] = useState([]);
  const [stateHistory, setStateHistory] = useState([]);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchProcesses();
        setProcesses(res.data);

        const timeLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        // Count by state
        const counts = {};
        res.data.forEach(p => {
          const state = p.status || 'other';
          counts[state] = (counts[state] || 0) + 1;
        });

        setCountHistory(prev => [...prev, {
          time: timeLabel,
          total: res.data.length,
        }].slice(-60));

        setStateHistory(prev => [...prev, {
          time: timeLabel,
          running: counts.running || 0,
          sleeping: counts.sleeping || 0,
          stopped: counts.stopped || 0,
          zombie: counts.zombie || 0,
        }].slice(-60));

      } catch (err) {
        console.error('Process detail fetch error:', err);
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 5000);
    return () => clearInterval(interval);
  }, []);

  // State distribution for pie chart
  const stateCounts = {};
  processes.forEach(p => {
    const state = p.status || 'other';
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  });

  const stateData = Object.entries(stateCounts).map(([name, value]) => ({
    name,
    value,
    color: STATE_COLORS[name] || STATE_COLORS.other,
  }));

  // Top consumers
  const topCpu = [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 5);
  const topMem = [...processes].sort((a, b) => b.memory - a.memory).slice(0, 5);

  // Filtered and sorted list
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const filtered = processes
    .filter(p => {
      const matchesText = p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.user.toLowerCase().includes(filter.toLowerCase()) ||
        String(p.pid).includes(filter);
      const matchesState = stateFilter === 'all' || p.status === stateFilter;
      return matchesText && matchesState;
    })
    .sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      if (typeof aVal === 'string') {
        return sortDir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

  const statusColor = (status) => STATE_COLORS[status] || STATE_COLORS.other;

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div>
          <h2 className="detail-title">Process Manager</h2>
          <p className="detail-subtitle">{processes.length} total processes</p>
        </div>
        <div className="detail-stats-row">
          {stateData.map(s => (
            <div className="detail-stat" key={s.name}>
              <span className="detail-stat-label" style={{ color: s.color }}>
                {s.name.toUpperCase()}
              </span>
              <span className="detail-stat-value">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-grid">
        {/* Process State Distribution */}
        <div className="detail-card">
          <h4>State Distribution</h4>
          <div className="usage-split-chart">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={68}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {stateData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="usage-split-legend">
              {stateData.map(item => (
                <div className="usage-legend-row" key={item.name}>
                  <span className="usage-legend-dot" style={{ background: item.color }}></span>
                  <span className="usage-legend-label">{item.name}</span>
                  <span className="usage-legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top CPU Consumers */}
        <div className="detail-card">
          <h4>Top CPU Consumers</h4>
          <div className="top-consumers">
            {topCpu.map(proc => (
              <div className="consumer-row" key={proc.pid}>
                <span className="consumer-name">{proc.name}</span>
                <div className="consumer-bar-container">
                  <div className="consumer-bar" style={{
                    width: `${Math.min(proc.cpu, 100)}%`,
                    background: proc.cpu > 50 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                  }}></div>
                </div>
                <span className="consumer-pct">{proc.cpu}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Memory Consumers */}
        <div className="detail-card">
          <h4>Top Memory Consumers</h4>
          <div className="top-consumers">
            {topMem.map(proc => (
              <div className="consumer-row" key={proc.pid}>
                <span className="consumer-name">{proc.name}</span>
                <div className="consumer-bar-container">
                  <div className="consumer-bar" style={{
                    width: `${Math.min(proc.memory * 5, 100)}%`,
                    background: 'var(--accent-purple)',
                  }}></div>
                </div>
                <span className="consumer-pct">{proc.memory}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Process Count Over Time */}
        <div className="detail-card span-2">
          <h4>Process Count Over Time</h4>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={countHistory}>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="total" stroke="#22d3ee" strokeWidth={2} dot={false} name="Total Processes" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* State History */}
        <div className="detail-card">
          <h4>State History</h4>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={stateHistory}>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="running" stroke={STATE_COLORS.running} strokeWidth={1.5} dot={false} name="Running" />
              <Line type="monotone" dataKey="sleeping" stroke={STATE_COLORS.sleeping} strokeWidth={1.5} dot={false} name="Sleeping" />
              <Line type="monotone" dataKey="zombie" stroke={STATE_COLORS.zombie} strokeWidth={1.5} dot={false} name="Zombie" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Full Process Table */}
        <div className="detail-card span-3">
          <div className="proc-table-header">
            <h4>All Processes</h4>
            <div className="proc-table-controls">
              <div className="state-filters">
                {['all', 'running', 'sleeping', 'stopped', 'zombie'].map(state => (
                  <button
                    key={state}
                    className={`state-filter-btn ${stateFilter === state ? 'active' : ''}`}
                    style={stateFilter === state && state !== 'all' ? { background: STATE_COLORS[state], color: '#0a0f1e' } : {}}
                    onClick={() => setStateFilter(state)}
                  >
                    {state === 'all' ? 'all' : state}
                    {state !== 'all' && (
                      <span className="state-count">{stateCounts[state] || 0}</span>
                    )}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="process-filter proc-detail-filter"
                placeholder="Search by name, user, or PID..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="proc-detail-table">
            <div className="proc-detail-thead">
              <span className="proc-col pid" onClick={() => handleSort('pid')}>
                PID {sortBy === 'pid' && (sortDir === 'desc' ? '↓' : '↑')}
              </span>
              <span className="proc-col name" onClick={() => handleSort('name')}>
                NAME {sortBy === 'name' && (sortDir === 'desc' ? '↓' : '↑')}
              </span>
              <span className="proc-col user">USER</span>
              <span className="proc-col cpu-col" onClick={() => handleSort('cpu')}>
                CPU % {sortBy === 'cpu' && (sortDir === 'desc' ? '↓' : '↑')}
              </span>
              <span className="proc-col mem-col" onClick={() => handleSort('memory')}>
                MEM % {sortBy === 'memory' && (sortDir === 'desc' ? '↓' : '↑')}
              </span>
              <span className="proc-col status-col">STATUS</span>
            </div>

            <div className="proc-detail-tbody">
              {filtered.map(proc => (
                <React.Fragment key={proc.pid}>
                  <div
                    className={`proc-detail-row ${expanded === proc.pid ? 'expanded' : ''}`}
                    onClick={() => setExpanded(expanded === proc.pid ? null : proc.pid)}
                  >
                    <span className="proc-col pid">{proc.pid}</span>
                    <span className="proc-col name">
                      <span className="proc-status-dot" style={{ background: statusColor(proc.status) }}></span>
                      {proc.name}
                    </span>
                    <span className="proc-col user">{proc.user}</span>
                    <span className="proc-col cpu-col">
                      <span className={proc.cpu > 50 ? 'val-high' : ''}>{proc.cpu}</span>
                      <div className="mini-bar">
                        <div className="mini-bar-fill" style={{
                          width: `${Math.min(proc.cpu, 100)}%`,
                          background: proc.cpu > 50 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                        }}></div>
                      </div>
                    </span>
                    <span className="proc-col mem-col">
                      <span>{proc.memory}</span>
                      <div className="mini-bar">
                        <div className="mini-bar-fill" style={{
                          width: `${Math.min(proc.memory * 5, 100)}%`,
                          background: 'var(--accent-purple)',
                        }}></div>
                      </div>
                    </span>
                    <span className="proc-col status-col">
                      <span className="status-badge" style={{
                        color: statusColor(proc.status),
                        background: `${statusColor(proc.status)}15`,
                      }}>
                        {proc.status}
                      </span>
                    </span>
                  </div>

                  {expanded === proc.pid && (
                    <div className="proc-detail-expanded">
                      <div className="proc-detail-info">
                        <div className="proc-info-item">
                          <span className="proc-info-label">Process ID</span>
                          <span className="proc-info-value">{proc.pid}</span>
                        </div>
                        <div className="proc-info-item">
                          <span className="proc-info-label">Full Name</span>
                          <span className="proc-info-value">{proc.name}</span>
                        </div>
                        <div className="proc-info-item">
                          <span className="proc-info-label">User</span>
                          <span className="proc-info-value">{proc.user}</span>
                        </div>
                        <div className="proc-info-item">
                          <span className="proc-info-label">Status</span>
                          <span className="proc-info-value" style={{ color: statusColor(proc.status) }}>{proc.status}</span>
                        </div>
                        <div className="proc-info-item">
                          <span className="proc-info-label">CPU Usage</span>
                          <span className="proc-info-value">{proc.cpu}%</span>
                        </div>
                        <div className="proc-info-item">
                          <span className="proc-info-label">Memory Usage</span>
                          <span className="proc-info-value">{proc.memory}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="proc-table-footer">
            <span>Showing {filtered.length} of {processes.length} processes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessDetailPage;