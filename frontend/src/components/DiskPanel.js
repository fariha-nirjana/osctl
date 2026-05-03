// DiskPanel => disk capacity bars + I/O throughput history chart
import React, { useState, useEffect, useRef } from 'react';
import { fetchDisk } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const formatBytes = (bytes) => {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
};

const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid #2a3550',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
};

function DiskPanel() {
  const [disk, setDisk] = useState(null);
  const [ioRate, setIoRate] = useState({ read: 0, write: 0 });
  const [ioHistory, setIoHistory] = useState([]);
  const prevIo = useRef(null);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchDisk();
        setDisk(res.data);

        if (prevIo.current) {
          const readDelta = Math.max((res.data.io.read_bytes - prevIo.current.read_bytes) / 5, 0);
          const writeDelta = Math.max((res.data.io.write_bytes - prevIo.current.write_bytes) / 5, 0);

          setIoRate({ read: readDelta, write: writeDelta });

          setIoHistory(prev => {
            const next = [...prev, {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              read: +(readDelta / 1048576).toFixed(2),
              write: +(writeDelta / 1048576).toFixed(2),
            }];
            return next.slice(-30);
          });
        }
        prevIo.current = res.data.io;
      } catch (err) {
        console.error('Disk fetch error:', err);
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

  if (!disk) return <div className="panel"><h3>DISK I/O</h3><p>Loading...</p></div>;

  // Filter meaningful partitions
  const volumes = disk.partitions
    .filter(p => (p.total / 1073741824) > 1 && p.percent > 0)
    .slice(0, 3)
    .map(p => {
      let label = p.mountpoint;
      if (label === '/') label = '/';
      else if (label.includes('Data')) label = 'Data';
      else label = label.split('/').pop() || p.device.split('/').pop();
      if (label.length > 8) label = label.substring(0, 8);
      return { name: label, percent: p.percent, used: +(p.used / 1073741824).toFixed(1), total: +(p.total / 1073741824).toFixed(1) };
    });

  return (
    <div className="panel disk-panel-layout">
      <div className="disk-header">
        <div className="disk-title-row">
          <h3>DISK I/O</h3>
          <div className="disk-legend">
            <span className="disk-legend-item"><span className="legend-dot read"></span>R</span>
            <span className="disk-legend-item"><span className="legend-dot write"></span>W</span>
          </div>
        </div>
        <div className="disk-rates">
          <span className="disk-rate read">↓ R {formatBytes(ioRate.read)}/s</span>
          <span className="disk-rate write">↑ W {formatBytes(ioRate.write)}/s</span>
        </div>
      </div>

      {/* I/O Throughput Chart */}
      <div className="disk-io-chart">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={ioHistory} barGap={2}>
            <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5a6478', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => `${val} MB/s`} />
            <Bar dataKey="read" fill="#22d3ee" radius={[2, 2, 0, 0]} barSize={6} />
            <Bar dataKey="write" fill="#34d399" radius={[2, 2, 0, 0]} barSize={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Usage */}
      <div className="disk-volumes">
        <span className="disk-volumes-label">{volumes.length} volumes</span>
        {volumes.map(v => (
          <div className="disk-vol-row" key={v.name}>
            <span className="disk-vol-name">{v.name}</span>
            <div className="disk-vol-bar">
              <div
                className="disk-vol-fill"
                style={{
                  width: `${v.percent}%`,
                  background: v.percent > 90 ? 'var(--accent-red)' : v.percent > 70 ? 'var(--accent-yellow)' : 'var(--accent-cyan)',
                }}
              ></div>
            </div>
            <span className="disk-vol-info">{v.used}/{v.total} GB</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DiskPanel;