import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MetricStrip from './components/MetricStrip';
import CpuPanel from './components/CpuPanel';
import MemoryPanel from './components/MemoryPanel';
import ProcessPanel from './components/ProcessPanel';
import DiskPanel from './components/DiskPanel';
import NetworkPanel from './components/NetworkPanel';
import LogsPanel from './components/LogsPanel';
import DeadlockSimulator from './components/DeadlockSimulator';
import './App.css';

function App() {
  const [view, setView] = useState('monitor');

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} />
      <div className="main-content">
        {view === 'monitor' && (
          <>
            <MetricStrip />
            <div className="dashboard-grid">
              <div className="panel-large" id="cpu-panel">
                <CpuPanel />
              </div>
              <div className="panel-side" id="process-panel">
                <ProcessPanel />
              </div>
              <div className="panel-half-row">
                <div id="memory-panel"><MemoryPanel /></div>
                <div id="disk-panel"><DiskPanel /></div>
              </div>
              <div className="panel-full" id="network-panel">
                <NetworkPanel />
              </div>
              <div className="panel-logs" id="logs-panel">
                <LogsPanel />
              </div>
            </div>
          </>
        )}
        {view === 'deadlock' && <DeadlockSimulator />}
      </div>
    </div>
  );
}

export default App;