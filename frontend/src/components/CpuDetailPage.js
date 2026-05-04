// CpuDetailPage => dedicated CPU page with per-core heatmap, usage breakdown, and history
import React, { useState, useEffect } from 'react';
import { fetchCpu } from '../api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid #2a3550',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
};

const coreColor = (val) => {
  if (val > 80) return '#f87171';
  if (val > 60) return '#fbbf24';
  if (val > 30) return '#22d3ee';
  return '#1e3a5f';
};

function CpuDetailPage() {
  const [cpu, setCpu] = useState(null);
  const [history, setHistory] = useState([]);
  const [coreHistory, setCoreHistory] = useState([]);
  const [peak, setPeak] = useState(0);
  const [avg, setAvg] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchCpu();
        setCpu(res.data);
        setPeak(prev => Math.max(prev, res.data.overall));
        setSampleCount(prev => prev + 1);
        setAvg(prev => {
          const newCount = sampleCount + 1;
          return +((prev * sampleCount + res.data.overall) / newCount).toFixed(1);
        });

        const timeLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        setHistory(prev => [...prev, {
          time: timeLabel,
          overall: res.data.overall,
          user: res.data.usage_split.user,
          system: res.data.usage_split.system,
          idle: res.data.usage_split.idle,
        }].slice(-120));

        setCoreHistory(prev => [...prev, {
          time: timeLabel,
          cores: res.data.per_core,
        }].slice(-30));

      } catch (err) {
        console.error('CPU detail fetch error:', err);
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 3000);
    return () => clearInterval(interval);
  }, [sampleCount]);

  if (!cpu) return <div className="detail-page"><p>Loading CPU data...</p></div>;

  const usagePieData = [
    { name: 'User', value: cpu.usage_split.user, color: '#22d3ee' },
    { name: 'System', value: cpu.usage_split.system, color: '#a78bfa' },
    { name: 'I/O Wait', value: cpu.usage_split.iowait, color: '#fbbf24' },
    { name: 'Idle', value: cpu.usage_split.idle, color: '#1e3a5f' },
  ];

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="detail-header">
        <div>
          <h2 className="detail-title">CPU Monitor</h2>
          <p className="detail-subtitle">
            {cpu.physical_cores} cores / {cpu.core_count} threads · {cpu.frequency.current ? `${cpu.frequency.current} MHz` : 'Frequency N/A'}
          </p>
        </div>
        <div className="detail-stats-row">
          <div className="detail-stat">
            <span className="detail-stat-label">CURRENT</span>
            <span className="detail-stat-value">{cpu.overall}%</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">PEAK</span>
            <span className="detail-stat-value peak">{peak}%</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">AVERAGE</span>
            <span className="detail-stat-value">{avg}%</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">SAMPLES</span>
            <span className="detail-stat-value">{sampleCount}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main Usage Chart */}
        <div className="detail-card span-2">
          <h4>CPU Usage Over Time</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="detailUserGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="detailSysGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="system" stroke="#a78bfa" strokeWidth={1.5} fill="url(#detailSysGrad)" stackId="1" name="System" />
              <Area type="monotone" dataKey="user" stroke="#22d3ee" strokeWidth={1.5} fill="url(#detailUserGrad)" stackId="1" name="User" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Core Heatmap */}
        <div className="detail-card">
          <h4>Per-Core Usage</h4>
          <div className="core-heatmap">
            {cpu.per_core.map((val, i) => (
              <div className="core-cell" key={i} style={{ background: coreColor(val) }}>
                <span className="core-id">C{i}</span>
                <span className="core-pct">{val}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Split Donut */}
        <div className="detail-card">
          <h4>Usage Breakdown</h4>
          <div className="usage-split-chart">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={usagePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {usagePieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="usage-split-legend">
              {usagePieData.map(item => (
                <div className="usage-legend-row" key={item.name}>
                  <span className="usage-legend-dot" style={{ background: item.color }}></span>
                  <span className="usage-legend-label">{item.name}</span>
                  <span className="usage-legend-value">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Load Averages Chart */}
        <div className="detail-card span-2">
          <h4>Load Averages</h4>
          <div className="load-avg-detail">
            <div className="load-avg-cards">
              <div className="load-avg-card">
                <span className="load-avg-period">1 min</span>
                <span className="load-avg-num">{cpu.load_avg['1min']}</span>
              </div>
              <div className="load-avg-card">
                <span className="load-avg-period">5 min</span>
                <span className="load-avg-num">{cpu.load_avg['5min']}</span>
              </div>
              <div className="load-avg-card">
                <span className="load-avg-period">15 min</span>
                <span className="load-avg-num">{cpu.load_avg['15min']}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={history}>
                <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="overall" stroke="#22d3ee" strokeWidth={2} dot={false} name="Overall %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Core History Bars */}
        <div className="detail-card span-3">
          <h4>Per-Core History (Last 30 samples)</h4>
          <div className="core-history">
            {cpu.per_core.map((_, coreIdx) => (
              <div className="core-history-row" key={coreIdx}>
                <span className="core-history-label">C{coreIdx}</span>
                <div className="core-history-bars">
                  {coreHistory.map((sample, sIdx) => (
                    <div
                      className="core-history-bar"
                      key={sIdx}
                      style={{
                        height: `${sample.cores[coreIdx] || 0}%`,
                        background: coreColor(sample.cores[coreIdx] || 0),
                      }}
                      title={`${sample.time}: ${sample.cores[coreIdx]}%`}
                    ></div>
                  ))}
                </div>
                <span className="core-history-current">{cpu.per_core[coreIdx]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CpuDetailPage;