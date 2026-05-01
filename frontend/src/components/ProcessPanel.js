// ProcessPanel (sortable, filterable process table with expandable rows)
import React, { useState, useEffect } from 'react';
import { fetchProcesses } from '../api';

function ProcessPanel() {
  const [processes, setProcesses] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('cpu');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchProcesses();
        setProcesses(res.data);
      } catch (err) {
        console.error('Process fetch error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statusColor = (status) => {
    switch (status) {
      case 'running': return 'var(--accent-green)';
      case 'sleeping': return 'var(--accent-cyan)';
      case 'stopped': return 'var(--accent-red)';
      case 'zombie': return 'var(--accent-yellow)';
      default: return 'var(--text-muted)';
    }
  };

  const filtered = processes
    .filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="panel process-panel">
      <div className="process-header">
        <h3>TOP PROCESSES</h3>
        <div className="sort-toggles">
          <button
            className={`sort-btn ${sortBy === 'cpu' ? 'active' : ''}`}
            onClick={() => setSortBy('cpu')}
          >CPU</button>
          <button
            className={`sort-btn ${sortBy === 'memory' ? 'active' : ''}`}
            onClick={() => setSortBy('memory')}
          >MEM</button>
        </div>
      </div>

      <input
        type="text"
        className="process-filter"
        placeholder="filter..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="process-table-header">
        <span className="col-pid">PID</span>
        <span className="col-name">NAME</span>
        <span className="col-cpu">CPU</span>
        <span className="col-mem">MEM</span>
      </div>

      <div className="process-list">
        {filtered.slice(0, 20).map(proc => (
          <div key={proc.pid}>
            <div
              className={`process-row ${expanded === proc.pid ? 'expanded' : ''}`}
              onClick={() => setExpanded(expanded === proc.pid ? null : proc.pid)}
            >
              <span className="col-pid">{proc.pid}</span>
              <div className="col-name">
                <span className="proc-status-dot" style={{ background: statusColor(proc.status) }}></span>
                <span className="proc-name">{proc.name}</span>
                <span className="proc-user">{proc.user}</span>
              </div>
              <span className="col-cpu">
                <span className={`cpu-val ${proc.cpu > 50 ? 'high' : ''}`}>{proc.cpu}</span>
                <span className="cpu-bar">
                  <span className="cpu-bar-fill" style={{ width: `${Math.min(proc.cpu, 100)}%` }}></span>
                </span>
              </span>
              <span className="col-mem">{proc.memory}</span>
            </div>

            {expanded === proc.pid && (
              <div className="process-detail">
                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{proc.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">PID</span>
                  <span className="detail-value">{proc.pid}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User</span>
                  <span className="detail-value">{proc.user}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className="detail-status" style={{ color: statusColor(proc.status) }}>
                    {proc.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">CPU</span>
                  <span className="detail-value">{proc.cpu}%</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Memory</span>
                  <span className="detail-value">{proc.memory}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProcessPanel;