// DiskPanel (disk I/O read/write bars with partition info)
import React, { useState, useEffect, useRef } from 'react';
import { fetchDisk } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Convert bytes to readable format
const formatBytes = (bytes) => {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
};

function DiskPanel() {
  const [disk, setDisk] = useState(null);
  const [ioRate, setIoRate] = useState({ read: 0, write: 0 });
  const prevIo = useRef(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetchDisk();
        setDisk(res.data);

        // Calculate read/write speed from delta between samples
        if (prevIo.current) {
          const readDelta = res.data.io.read_bytes - prevIo.current.read_bytes;
          const writeDelta = res.data.io.write_bytes - prevIo.current.write_bytes;
          setIoRate({
            read: Math.max(readDelta / 5, 0),   // bytes per second (5s interval)
            write: Math.max(writeDelta / 5, 0),
          });
        }
        prevIo.current = res.data.io;
      } catch (err) {
        console.error('Disk fetch error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!disk) return <div className="panel"><h3>DISK I/O</h3><p>Loading...</p></div>;

  const chartData = disk.partitions.map(p => ({
    name: p.mountpoint === '/' ? '/' : p.mountpoint.split('/').pop(),
    used: +(p.used / 1073741824).toFixed(1),
    free: +(p.free / 1073741824).toFixed(1),
  }));

  return (
    <div className="panel">
      <div className="disk-header">
        <h3>DISK I/O</h3>
        <div className="disk-rates">
          <span className="disk-rate read">↓ R {formatBytes(ioRate.read)}/s</span>
          <span className="disk-rate write">↑ W {formatBytes(ioRate.write)}/s</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#8892a5', fontSize: 12, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: '#1a2235',
              border: '1px solid #2a3550',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '12px',
            }}
            formatter={(value) => `${value} GB`}
          />
          <Bar dataKey="used" fill="#22d3ee" stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="free" fill="#2a3550" stackId="a" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DiskPanel;