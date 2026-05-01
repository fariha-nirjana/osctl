// Sidebar (left navigation panel)
import React from 'react';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">⊡</span>
        <span className="logo-text">osctl</span>
      </div>
      <nav className="sidebar-nav">
        <p className="nav-section">MONITOR</p>
        <a href="#" className="nav-item active">Overview</a>
        <a href="#" className="nav-item">CPU</a>
        <a href="#" className="nav-item">Memory</a>
        <a href="#" className="nav-item">Storage</a>
        <a href="#" className="nav-item">Network</a>
        <p className="nav-section">INSPECT</p>
        <a href="#" className="nav-item">Processes</a>
        <a href="#" className="nav-item">Logs</a>
        <a href="#" className="nav-item">Alerts</a>
      </nav>
    </aside>
  );
}

export default Sidebar;