// MemoryDetailPage => dedicated memory page with detailed breakdown, swap, and top consumers
import React, { useState, useEffect } from 'react';
import { fetchMemory, fetchProcesses } from '../api';
import {
  PieChart, Pie, Cell, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const toGB = (bytes) => (bytes / 1073741824).toFixed(1);
const toMB = (bytes) => (bytes / 1048576).toFixed(0);

const COLORS = ['#22d3ee', '#3b82f6', '#a78bfa', '#34d399'];
const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid #2a3550',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
};

function MemoryDetailPage() {
  const [mem, setMem] = useState(null);
  const [history, setHistory] = useState([]);
  const [topProcs, setTopProcs] = useState([]);
  const [peak, setPeak] = useState(0);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchMemory();
        setMem(res.data);
        setPeak(prev => Math.max(prev, res.data.percent));

        const timeLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        setHistory(prev => [...prev, {
          time: timeLabel,
          used: +(res.data.used / 1073741824).toFixed(2),
          cached: +(( res.data.cached || 0) / 1073741824).toFixed(2),
          wired: +((res.data.wired || 0) / 1073741824).toFixed(2),
          free: +(res.data.available / 1073741824).toFixed(2),
          swap: +(res.data.swap.used / 1073741824).toFixed(2),
          percent: res.data.percent,
        }].slice(-120));

        const procsRes = await fetchProcesses();
        const sorted = procsRes.data
          .sort((a, b) => b.memory - a.memory)
          .slice(0, 10);
        setTopProcs(sorted);
      } catch (err) {
        console.error('Memory detail fetch error:', err);
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!mem) return <div className="detail-page"><p>Loading memory data...</p></div>;

  const app = mem.used - (mem.wired || 0) - (mem.cached || 0);
  const pieData = [
    { name: 'App', value: Math.max(app, 0) },
    { name: 'Wired', value: mem.wired || 0 },
    { name: 'Cached', value: mem.cached || 0 },
    { name: 'Free', value: mem.available },
  ];

  const pressureLevel = mem.percent > 85 ? 'critical' : mem.percent > 70 ? 'warning' : 'normal';
  const pressureLabel = mem.percent > 85 ? 'HIGH PRESSURE' : mem.percent > 70 ? 'MODERATE' : 'NORMAL';

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div>
          <h2 className="detail-title">Memory Monitor</h2>
          <p className="detail-subtitle">
            {toGB(mem.total)} GB Total · Swap {toGB(mem.swap.total)} GB
          </p>
        </div>
        <div className="detail-stats-row">
          <div className="detail-stat">
            <span className="detail-stat-label">USED</span>
            <span className="detail-stat-value">{toGB(mem.used)} GB</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">FREE</span>
            <span className="detail-stat-value">{toGB(mem.available)} GB</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">USAGE</span>
            <span className="detail-stat-value">{mem.percent}%</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">PEAK</span>
            <span className="detail-stat-value peak">{peak}%</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Memory Pressure Indicator */}
        <div className="detail-card">
          <h4>Memory Pressure</h4>
          <div className="pressure-display">
            <div className={`pressure-gauge ${pressureLevel}`}>
              <span className="pressure-pct">{mem.percent}%</span>
              <span className="pressure-label">{pressureLabel}</span>
            </div>
            <div className="pressure-bar-container">
              <div className="pressure-bar">
                <div className={`pressure-fill ${pressureLevel}`} style={{ width: `${mem.percent}%` }}></div>
              </div>
              <div className="pressure-markers">
                <span>0%</span>
                <span className="marker-70">70%</span>
                <span className="marker-85">85%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Donut + Breakdown */}
        <div className="detail-card">
          <h4>Memory Composition</h4>
          <div className="usage-split-chart">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={68} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="usage-split-legend">
              {[
                { label: 'App', value: toGB(Math.max(app, 0)), color: COLORS[0] },
                { label: 'Wired', value: toGB(mem.wired || 0), color: COLORS[1] },
                { label: 'Cached', value: toGB(mem.cached || 0), color: COLORS[2] },
                { label: 'Free', value: toGB(mem.available), color: COLORS[3] },
              ].map(item => (
                <div className="usage-legend-row" key={item.label}>
                  <span className="usage-legend-dot" style={{ background: item.color }}></span>
                  <span className="usage-legend-label">{item.label}</span>
                  <span className="usage-legend-value">{item.value} GB</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Swap Usage */}
        <div className="detail-card">
          <h4>Swap Usage</h4>
          <div className="swap-detail">
            <div className="swap-numbers">
              <div className="swap-stat">
                <span className="swap-stat-label">Used</span>
                <span className="swap-stat-value">{toGB(mem.swap.used)} GB</span>
              </div>
              <div className="swap-stat">
                <span className="swap-stat-label">Total</span>
                <span className="swap-stat-value">{toGB(mem.swap.total)} GB</span>
              </div>
              <div className="swap-stat">
                <span className="swap-stat-label">Usage</span>
                <span className="swap-stat-value">{mem.swap.percent}%</span>
              </div>
            </div>
            <div className="pressure-bar-container">
              <div className="pressure-bar">
                <div className="pressure-fill swap-fill" style={{ width: `${mem.swap.percent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Usage Over Time */}
        <div className="detail-card span-2">
          <h4>Memory Usage Over Time</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="memUsedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="memSwapGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} unit=" GB" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="used" stroke="#22d3ee" strokeWidth={2} fill="url(#memUsedGrad)" name="Used" />
              <Area type="monotone" dataKey="swap" stroke="#fbbf24" strokeWidth={1.5} fill="url(#memSwapGrad)" name="Swap" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Memory Consumers */}
        <div className="detail-card">
          <h4>Top Memory Consumers</h4>
          <div className="top-consumers">
            {topProcs.map(proc => (
              <div className="consumer-row" key={proc.pid}>
                <span className="consumer-name">{proc.name}</span>
                <div className="consumer-bar-container">
                  <div className="consumer-bar" style={{ width: `${Math.min(proc.memory * 5, 100)}%` }}></div>
                </div>
                <span className="consumer-pct">{proc.memory}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryDetailPage;