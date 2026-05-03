// Sidebar => left navigation with Monitor/Learn mode switching and section scrolling
import React from 'react';

function Sidebar({ view, setView }) {

  const scrollTo = (id) => {
    setView('monitor');
    // Small delay to let monitor view render first if switching from deadlock
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

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
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); scrollTo('cpu-panel'); }}>
          CPU
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); scrollTo('memory-panel'); }}>
          Memory
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); scrollTo('disk-panel'); }}>
          Storage
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); scrollTo('network-panel'); }}>
          Network
        </a>

        <p className="nav-section">INSPECT</p>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); scrollTo('process-panel'); }}>
          Processes
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); scrollTo('logs-panel'); }}>
          Logs
        </a>
        <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); scrollTo('logs-panel'); }}>
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