// MetricStrip => summary cards with sparklines, deltas, and sub-text
import React, { useState, useEffect, useRef } from 'react';
import { fetchCpu, fetchMemory, fetchDisk, fetchNetwork, fetchProcesses } from '../api';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Tiny sparkline component
function Sparkline({ data, dataKey, color }) {
  if (!data || data.length < 2) return null;
  return (
    <div className="sparkline">
      <ResponsiveContainer width="100%" height={30}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Delta badge component
function Delta({ current, previous }) {
  if (previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return null;

  const isUp = diff > 0;
  return (
    <span className={`metric-delta ${isUp ? 'up' : 'down'}`}>
      {isUp ? '+' : ''}{diff.toFixed(1)}
    </span>
  );
}

function MetricStrip() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState({
    cpu: [], memory: [], disk: [], network: [], procs: []
  });
  const prevMetrics = useRef(null);
  const prevDiskIo = useRef(null);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const cpu = await fetchCpu();
        const mem = await fetchMemory();
        const disk = await fetchDisk();
        const net = await fetchNetwork();
        const procs = await fetchProcesses();

        // Calculate disk throughput from delta
        let diskRate = 0;
        if (prevDiskIo.current) {
          const readDelta = disk.data.io.read_bytes - prevDiskIo.current.read_bytes;
          const writeDelta = disk.data.io.write_bytes - prevDiskIo.current.write_bytes;
          diskRate = (readDelta + writeDelta) / 10 / 1048576;  // MB/s over 10s interval
        }
        prevDiskIo.current = disk.data.io;

        // Count volumes >1GB
        const volumeCount = disk.data.partitions.filter(
          p => (p.total / 1073741824) > 1
        ).length;

        const current = {
          cpu: cpu.data.overall,
          cpuLoad: cpu.data.load_avg['1min'],
          memUsed: +(mem.data.used / 1073741824).toFixed(1),
          memTotal: +(mem.data.total / 1073741824).toFixed(1),
          memPercent: mem.data.percent,
          diskRate: +diskRate.toFixed(1),
          volumeCount: volumeCount,
          netIn: +(net.data.bytes_recv / 1048576).toFixed(1),
          connections: net.data.connections,
          procCount: procs.data.length,
        };

        // Store previous for delta calculation
        const prev = prevMetrics.current;
        prevMetrics.current = current;

        setMetrics({ current, prev });

        // Update sparkline history
        setHistory(h => ({
          cpu: [...h.cpu, { v: current.cpu }].slice(-20),
          memory: [...h.memory, { v: current.memPercent }].slice(-20),
          disk: [...h.disk, { v: current.diskRate }].slice(-20),
          network: [...h.network, { v: current.netIn }].slice(-20),
          procs: [...h.procs, { v: current.procCount }].slice(-20),
        }));
      } catch (err) {
        console.error('MetricStrip fetch error:', err);
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="metric-strip">
        {['CPU', 'MEMORY', 'DISK', 'NETWORK', 'PROCS'].map(label => (
          <div className="metric-card" key={label}>
            <span className="metric-label">{label}</span>
            <span className="metric-value loading-pulse">—</span>
          </div>
        ))}
      </div>
    );
  }

  const { current, prev } = metrics;

  return (
    <div className="metric-strip">
      <div className="metric-card">
        <div className="metric-top-row">
          <span className="metric-label">CPU</span>
          <Sparkline data={history.cpu} dataKey="v" color="#22d3ee" />
          {prev && <Delta current={current.cpu} previous={prev.cpu} />}
        </div>
        <span className="metric-value">{current.cpu}<span className="metric-unit">%</span></span>
        <span className="metric-sub">{current.cpuLoad} load</span>
      </div>

      <div className="metric-card">
        <div className="metric-top-row">
          <span className="metric-label">MEMORY</span>
          <Sparkline data={history.memory} dataKey="v" color="#22d3ee" />
          {prev && <Delta current={current.memUsed} previous={prev.memUsed} />}
        </div>
        <span className="metric-value">
          {current.memUsed}<span className="metric-unit"> / {current.memTotal} GB</span>
        </span>
        <span className="metric-sub">{current.memPercent}% used</span>
      </div>

      <div className="metric-card">
        <div className="metric-top-row">
          <span className="metric-label">DISK</span>
          <Sparkline data={history.disk} dataKey="v" color="#22d3ee" />
          {prev && <Delta current={current.diskRate} previous={prev.diskRate} />}
        </div>
        <span className="metric-value">{current.diskRate}<span className="metric-unit"> MB/s</span></span>
        <span className="metric-sub">{current.volumeCount} volumes</span>
      </div>

      <div className="metric-card">
        <div className="metric-top-row">
          <span className="metric-label">NET IN</span>
          <Sparkline data={history.network} dataKey="v" color="#22d3ee" />
          {prev && <Delta current={current.netIn} previous={prev.netIn} />}
        </div>
        <span className="metric-value">{current.netIn}<span className="metric-unit"> MB/s</span></span>
        <span className="metric-sub">{current.connections === -1 ? '—' : current.connections} conn</span>
      </div>

      <div className="metric-card">
        <div className="metric-top-row">
          <span className="metric-label">PROCS</span>
          <Sparkline data={history.procs} dataKey="v" color="#22d3ee" />
        </div>
        <span className="metric-value">{current.procCount}</span>
      </div>
    </div>
  );
}

export default MetricStrip;