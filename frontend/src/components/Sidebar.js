// Sidebar => left navigation with Monitor/Learn mode switching and detail pages
import React from 'react';

function Sidebar({ view, setView }) {
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
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setView('monitor'); setTimeout(() => { const el = document.getElementById('process-panel'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>
          Processes
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setView('monitor'); setTimeout(() => { const el = document.getElementById('logs-panel'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>
          Logs
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); setView('monitor'); setTimeout(() => { const el = document.getElementById('logs-panel'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>
          Alerts
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