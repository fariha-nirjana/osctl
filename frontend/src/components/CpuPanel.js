// CpuPanel (hero CPU display with real-time usage chart)
import React, { useState, useEffect } from 'react';
import { fetchCpu } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function CpuPanel() {
  const [cpu, setCpu] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchCpu();
        setCpu(res.data);

        setHistory(prev => {
          const next = [...prev, {
            time: new Date().toLocaleTimeString(),
            usage: res.data.overall,
          }];
          // Keep last 60 data points (5 minutes at 5s intervals)
          return next.slice(-60);
        });
      } catch (err) {
        console.error('CPU fetch error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!cpu) return <div className="panel"><p>Loading CPU data...</p></div>;

  return (
    <div className="panel">
      <div className="cpu-header">
        <h3>CPU USAGE</h3>
        <div className="cpu-badges">
          <span className="badge">{cpu.physical_cores}c / {cpu.core_count}t</span>
          {cpu.frequency.current && (
            <span className="badge">{cpu.frequency.current} MHz</span>
          )}
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
      </div>

      <div className="cpu-chart">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fill: '#5a6478', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#5a6478', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: '#1a2235',
                border: '1px solid #2a3550',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="usage"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#cpuGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CpuPanel;