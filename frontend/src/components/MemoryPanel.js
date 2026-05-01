// MemoryPanel (RAM donut chart with usage breakdown)
import React, { useState, useEffect } from 'react';
import { fetchMemory } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Convert bytes to GB
const toGB = (bytes) => (bytes / 1073741824).toFixed(1);

const COLORS = ['#22d3ee', '#3b82f6', '#a78bfa', '#34d399'];

function MemoryPanel() {
  const [mem, setMem] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchMemory();
        setMem(res.data);
      } catch (err) {
        console.error('Memory fetch error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!mem) return <div className="panel"><h3>MEMORY</h3><p>Loading...</p></div>;

  const app = mem.used - (mem.wired || 0) - (mem.cached || 0);
  const chartData = [
    { name: 'App', value: Math.max(app, 0) },
    { name: 'Wired', value: mem.wired || 0 },
    { name: 'Cached', value: mem.cached || 0 },
    { name: 'Free', value: mem.available },
  ];

  const breakdown = [
    { label: 'App', value: toGB(Math.max(app, 0)), color: COLORS[0] },
    { label: 'Wired', value: toGB(mem.wired || 0), color: COLORS[1] },
    { label: 'Cached', value: toGB(mem.cached || 0), color: COLORS[2] },
    { label: 'Free', value: toGB(mem.available), color: COLORS[3] },
  ];

  return (
    <div className="panel">
      <div className="memory-header">
        <h3>MEMORY</h3>
        <span className="memory-total">{toGB(mem.used)} / {toGB(mem.total)} GB</span>
      </div>

      <div className="memory-content">
        <div className="memory-donut">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <span className="donut-percent">{mem.percent}</span>
            <span className="donut-label">% USED</span>
          </div>
        </div>

        <div className="memory-breakdown">
          {breakdown.map(item => (
            <div className="breakdown-row" key={item.label}>
              <span className="breakdown-dot" style={{ background: item.color }}></span>
              <span className="breakdown-label">{item.label}</span>
              <span className="breakdown-value">{item.value} GB</span>
            </div>
          ))}
          <div className="breakdown-row swap-row">
            <span className="breakdown-label">Swap</span>
            <span className="breakdown-value">{toGB(mem.swap.used)} / {toGB(mem.swap.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryPanel;