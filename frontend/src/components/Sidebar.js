// Sidebar => navigation with alert badge counter
import React from 'react';
import { useAlerts } from './AlertContext';

function Sidebar({ view, setView }) {
  const { alertCount } = useAlerts();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">⊡</span>
        <span className="logo-text">osctl</span>
      </div>
      <nav className="sidebar-nav">
        <p className="nav-section">MONITOR</p>
        <a href="#" className={`nav-item ${view === 'monitor' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('monitor'); }}>
          Overview
        </a>
        <a href="#" className={`nav-item ${view === 'cpu' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('cpu'); }}>
          CPU
        </a>
        <a href="#" className={`nav-item ${view === 'memory' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('memory'); }}>
          Memory
        </a>
        <a href="#" className={`nav-item ${view === 'storage' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('storage'); }}>
          Storage
        </a>
        <a href="#" className={`nav-item ${view === 'network' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('network'); }}>
          Network
        </a>

        <p className="nav-section">INSPECT</p>
        <a href="#" className={`nav-item ${view === 'processes' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('processes'); }}>
          Processes
        </a>
        <a href="#" className={`nav-item ${view === 'logs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('logs'); }}>
          Logs
        </a>
        <a href="#" className={`nav-item ${view === 'alerts' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('alerts'); }}>
          Alerts
          {alertCount > 0 && (
            <span className="alert-badge">{alertCount}</span>
          )}
        </a>

        <p className="nav-section">LEARN</p>
        <a href="#" className={`nav-item ${view === 'deadlock' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('deadlock'); }}>
          Deadlock Sim
        </a>
      </nav>
    </aside>
  );
}

export default Sidebar;