// CpuPanel (hero CPU display with usage chart)
import React from 'react';

function CpuPanel() {
  return (
    <div className="panel">
      <h3>CPU USAGE</h3>
      <p className="hero-number">—%</p>
      <p>Loading CPU data...</p>
    </div>
  );
}

export default CpuPanel;