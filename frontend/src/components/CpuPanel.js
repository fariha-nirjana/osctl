// CpuPanel => hero CPU display with stacked/per-core/load-avg tabs, temp, and usage split
import React, { useState, useEffect } from 'react';
import { fetchCpu } from '../api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid #2a3550',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
};

function CpuPanel() {
  const [cpu, setCpu] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadHistory, setLoadHistory] = useState([]);
  const [peak, setPeak] = useState(0);
  const [tab, setTab] = useState('stacked');

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchCpu();
        setCpu(res.data);
        setPeak(prev => Math.max(prev, res.data.overall));

        const timeLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        setHistory(prev => {
          const next = [...prev, {
            time: timeLabel,
            user: res.data.usage_split.user,
            system: res.data.usage_split.system,
          }];
          return next.slice(-60);
        });

        setLoadHistory(prev => {
          const next = [...prev, {
            time: timeLabel,
            '1min': res.data.load_avg['1min'],
            '5min': res.data.load_avg['5min'],
            '15min': res.data.load_avg['15min'],
          }];
          return next.slice(-60);
        });
      } catch (err) {
        console.error('CPU fetch error:', err);
      }
    };

    doFetch();
    const interval = setInterval(doFetch, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!cpu) return <div className="panel"><p>Loading CPU data...</p></div>;

  // Per-core bar data
  const coreData = cpu.per_core.map((val, i) => ({
    name: `${i}`,
    usage: val,
  }));

  const coreBarColor = (val) => {
    if (val > 80) return '#f87171';
    if (val > 50) return '#fbbf24';
    return '#22d3ee';
  };

  return (
    <div className="panel">
      <div className="cpu-header">
        <h3>CPU USAGE</h3>
        <div className="cpu-badges">
          <span className="badge">{cpu.physical_cores}c / {cpu.core_count}t</span>
          {cpu.frequency.current && (
            <span className="badge">{cpu.frequency.current} MHz</span>
          )}
          <span className="badge peak">⊙ peak {peak}%</span>
        </div>
      </div>

      <div className="cpu-hero-row">
        <div className="cpu-hero-left">
          <p className="hero-number">{cpu.overall}<span className="hero-unit">%</span></p>
          <p className="cpu-subtext">CURRENT</p>
        </div>

        <div className="cpu-load-avg">
          <div className="load-item">
            <span className="load-label">load 1m</span>
            <span className="load-value">{cpu.load_avg['1min']}</span>
          </div>
          <div className="load-item">
            <span className="load-label">load 5m</span>
            <span className="load-value">{cpu.load_avg['5min']}</span>
          </div>
          <div className="load-item">
            <span className="load-label">load 15m</span>
            <span className="load-value">{cpu.load_avg['15min']}</span>
          </div>
        </div>

        <div className="cpu-usage-split">
          <div className="split-item">
            <span className="split-label">user</span>
            <span className="split-value user">{cpu.usage_split.user}%</span>
          </div>
          <div className="split-item">
            <span className="split-label">system</span>
            <span className="split-value system">{cpu.usage_split.system}%</span>
          </div>
          <div className="split-item">
            <span className="split-label">iowait</span>
            <span className="split-value">{cpu.usage_split.iowait}%</span>
          </div>
        </div>

        {(cpu.temp || cpu.fan) && (
          <div className="cpu-temp">
            {cpu.temp && (
              <>
                <span className="temp-label">TEMP</span>
                <span className="temp-value">{cpu.temp}°C</span>
              </>
            )}
            {cpu.fan && (
              <span className="fan-value">fan {cpu.fan}rpm</span>
            )}
          </div>
        )}
      </div>

      <div className="cpu-chart-tabs">
        <button className={`chart-tab ${tab === 'stacked' ? 'active' : ''}`} onClick={() => setTab('stacked')}>stacked</button>
        <button className={`chart-tab ${tab === 'per-core' ? 'active' : ''}`} onClick={() => setTab('per-core')}>per-core</button>
        <button className={`chart-tab ${tab === 'load-avg' ? 'active' : ''}`} onClick={() => setTab('load-avg')}>load-avg</button>
      </div>

      <div className="cpu-chart">
        {tab === 'stacked' && (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="cpuUserGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cpuSysGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="system" stroke="#a78bfa" strokeWidth={1.5} fill="url(#cpuSysGrad)" stackId="1" />
              <Area type="monotone" dataKey="user" stroke="#22d3ee" strokeWidth={1.5} fill="url(#cpuUserGrad)" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {tab === 'per-core' && (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={coreData}>
              <XAxis dataKey="name" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => `${val}%`} />
              <Bar dataKey="usage" radius={[4, 4, 0, 0]} barSize={20}>
                {coreData.map((entry, i) => (
                  <Cell key={i} fill={coreBarColor(entry.usage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {tab === 'load-avg' && (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={loadHistory}>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="1min" stroke="#22d3ee" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="5min" stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="15min" stroke="#a78bfa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default CpuPanel;