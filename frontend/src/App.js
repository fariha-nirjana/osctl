import React from 'react';
import Sidebar from './components/Sidebar';
import MetricStrip from './components/MetricStrip';
import CpuPanel from './components/CpuPanel';
import MemoryPanel from './components/MemoryPanel';
import ProcessPanel from './components/ProcessPanel';
import DiskPanel from './components/DiskPanel';
import NetworkPanel from './components/NetworkPanel';
import LogsPanel from './components/LogsPanel';
import './App.css';

function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <MetricStrip />
        <div className="dashboard-grid">
          <div className="panel-large">
            <CpuPanel />
          </div>
          <div className="panel-side">
            <ProcessPanel />
          </div>
          <div className="panel-half-row">
            <MemoryPanel />
            <DiskPanel />
          </div>
          <div className="panel-full">
            <NetworkPanel />
          </div>
          <div className="panel-logs">
            <LogsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;