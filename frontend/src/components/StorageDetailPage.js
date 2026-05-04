// StorageDetailPage => dedicated storage page with volume details and I/O history
import React, { useState, useEffect, useRef } from 'react';
import { fetchDisk } from '../api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const formatBytes = (bytes) => {
  if (bytes >= 1099511627776) return (bytes / 1099511627776).toFixed(1) + ' TB';
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
};

const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid #2a3550',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
};

function StorageDetailPage() {
  const [disk, setDisk] = useState(null);
  const [ioHistory, setIoHistory] = useState([]);
  const [ioRate, setIoRate] = useState({ read: 0, write: 0 });
  const [totalRead, setTotalRead] = useState(0);
  const [totalWrite, setTotalWrite] = useState(0);
  const prevIo = useRef(null);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchDisk();
        setDisk(res.data);
        setTotalRead(res.data.io.read_bytes);
        setTotalWrite(res.data.io.write_bytes);

        if (prevIo.current) {
          const readDelta = Math.max((res.data.io.read_bytes - prevIo.current.read_bytes) / 5, 0);
          const writeDelta = Math.max((res.data.io.write_bytes - prevIo.current.write_bytes) / 5, 0);

          setIoRate({ read: readDelta, write: writeDelta });

          const timeLabel = new Date().toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });

          setIoHistory(prev => [...prev, {
            time: timeLabel,
            read: +(readDelta / 1048576).toFixed(2),
            write: +(writeDelta / 1048576).toFixed(2),
          }].slice(-60));
        }
        prevIo.current = res.data.io;
      } catch (err) {
        console.error('Storage detail fetch error:', err);
      }
    };

    doFetch();
    const kickstart = setTimeout(doFetch, 2000);
    const interval = setInterval(doFetch, 5000);
    return () => {
      clearTimeout(kickstart);
      clearInterval(interval);
    };
  }, []);

  if (!disk) return <div className="detail-page"><p>Loading storage data...</p></div>;

  const volumes = disk.partitions
    .filter(p => (p.total / 1073741824) > 1)
    .slice(0, 6);

  const volumeColor = (pct) => {
    if (pct > 90) return 'var(--accent-red)';
    if (pct > 70) return 'var(--accent-yellow)';
    return 'var(--accent-cyan)';
  };

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div>
          <h2 className="detail-title">Storage Monitor</h2>
          <p className="detail-subtitle">{volumes.length} volumes detected</p>
        </div>
        <div className="detail-stats-row">
          <div className="detail-stat">
            <span className="detail-stat-label">READ</span>
            <span className="detail-stat-value">{formatBytes(ioRate.read)}/s</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">WRITE</span>
            <span className="detail-stat-value">{formatBytes(ioRate.write)}/s</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">TOTAL READ</span>
            <span className="detail-stat-value">{formatBytes(totalRead)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">TOTAL WRITTEN</span>
            <span className="detail-stat-value">{formatBytes(totalWrite)}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* I/O Throughput */}
        <div className="detail-card span-2">
          <h4>I/O Throughput (MB/s)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ioHistory}>
              <defs>
                <linearGradient id="storReadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="storWriteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => `${val} MB/s`} />
              <Area type="monotone" dataKey="read" stroke="#22d3ee" strokeWidth={2} fill="url(#storReadGrad)" name="Read" />
              <Area type="monotone" dataKey="write" stroke="#34d399" strokeWidth={2} fill="url(#storWriteGrad)" name="Write" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* I/O Operations */}
        <div className="detail-card">
          <h4>I/O Operations</h4>
          <div className="io-ops">
            <div className="io-op-stat">
              <span className="io-op-label">Read Operations</span>
              <span className="io-op-value">{disk.io.read_count.toLocaleString()}</span>
            </div>
            <div className="io-op-stat">
              <span className="io-op-label">Write Operations</span>
              <span className="io-op-value">{disk.io.write_count.toLocaleString()}</span>
            </div>
            <div className="io-op-stat">
              <span className="io-op-label">Read/Write Ratio</span>
              <span className="io-op-value">{(disk.io.read_count / Math.max(disk.io.write_count, 1)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Volume Cards */}
        {volumes.map((vol, i) => {
          let label = vol.mountpoint;
          if (label === '/') label = 'Root (/)';
          else if (label.includes('Data')) label = 'Data';
          else label = label.split('/').pop() || vol.device.split('/').pop();

          return (
            <div className="detail-card" key={i}>
              <h4>{label}</h4>
              <div className="volume-detail">
                <div className="volume-usage-ring">
                  <ResponsiveContainer width={100} height={100}>
                    <PieChart>
                      <Pie
                        data={[
                          { value: vol.used },
                          { value: vol.free },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={32} outerRadius={44}
                        dataKey="value" strokeWidth={0}
                      >
                        <Cell fill={volumeColor(vol.percent)} />
                        <Cell fill="#1e2d45" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="volume-ring-center">
                    <span className="volume-ring-pct">{vol.percent}%</span>
                  </div>
                </div>
                <div className="volume-info">
                  <div className="volume-info-row">
                    <span className="volume-info-label">Used</span>
                    <span className="volume-info-value">{formatBytes(vol.used)}</span>
                  </div>
                  <div className="volume-info-row">
                    <span className="volume-info-label">Free</span>
                    <span className="volume-info-value">{formatBytes(vol.free)}</span>
                  </div>
                  <div className="volume-info-row">
                    <span className="volume-info-label">Total</span>
                    <span className="volume-info-value">{formatBytes(vol.total)}</span>
                  </div>
                  <div className="volume-info-row">
                    <span className="volume-info-label">FS</span>
                    <span className="volume-info-value">{vol.fstype}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StorageDetailPage;