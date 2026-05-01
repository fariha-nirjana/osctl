// NetworkPanel (network throughput area chart with live bytes in/out)
import React, { useState, useEffect, useRef } from 'react';
import { fetchNetwork } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatRate = (bytesPerSec) => {
  if (bytesPerSec >= 1048576) return (bytesPerSec / 1048576).toFixed(1) + ' MB/s';
  if (bytesPerSec >= 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
  return bytesPerSec.toFixed(0) + ' B/s';
};

function NetworkPanel() {
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState({ inRate: 0, outRate: 0, connections: 0 });
  const prevData = useRef(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchNetwork();
        const data = res.data;

        if (prevData.current) {
          const inDelta = (data.bytes_recv - prevData.current.bytes_recv) / 5;
          const outDelta = (data.bytes_sent - prevData.current.bytes_sent) / 5;

          setCurrent({
            inRate: inDelta,
            outRate: outDelta,
            connections: data.connections,
          });

          setHistory(prev => {
            const next = [...prev, {
              time: new Date().toLocaleTimeString(),
              in: +(inDelta / 1024).toFixed(1),
              out: +(outDelta / 1024).toFixed(1),
            }];
            return next.slice(-60);
          });
        }

        prevData.current = data;
      } catch (err) {
        console.error('Network fetch error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="panel">
      <div className="network-header">
        <h3>NETWORK</h3>
        <div className="network-rates">
          <span className="net-rate in">↓ IN {formatRate(current.inRate)}</span>
          <span className="net-rate out">↑ OUT {formatRate(current.outRate)}</span>
          <span className="net-conn">{current.connections} conn</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={history}>
          <defs>
            <linearGradient id="netInGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="netOutGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: '#1a2235',
              border: '1px solid #2a3550',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '12px',
            }}
            formatter={(value) => `${value} KB/s`}
          />
          <Area type="monotone" dataKey="in" stroke="#22d3ee" strokeWidth={2} fill="url(#netInGradient)" />
          <Area type="monotone" dataKey="out" stroke="#34d399" strokeWidth={2} fill="url(#netOutGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default NetworkPanel;