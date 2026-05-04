// NetworkDetailPage => dedicated network page with throughput, packets, and connections
import React, { useState, useEffect, useRef } from 'react';
import { fetchNetwork } from '../api';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const formatBytes = (bytes) => {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
};

const formatRate = (bytesPerSec) => {
  if (bytesPerSec >= 1048576) return (bytesPerSec / 1048576).toFixed(1) + ' MB/s';
  if (bytesPerSec >= 1024) return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
  return bytesPerSec.toFixed(0) + ' B/s';
};

const TOOLTIP_STYLE = {
  background: '#1a2235',
  border: '1px solid #2a3550',
  borderRadius: '6px',
  color: '#e2e8f0',
  fontSize: '12px',
};

function NetworkDetailPage() {
  const [current, setCurrent] = useState({ inRate: 0, outRate: 0, connections: 0 });
  const [raw, setRaw] = useState(null);
  const [throughputHistory, setThroughputHistory] = useState([]);
  const [packetHistory, setPacketHistory] = useState([]);
  const [peakIn, setPeakIn] = useState(0);
  const [peakOut, setPeakOut] = useState(0);
  const prevData = useRef(null);
  const prevPackets = useRef(null);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetchNetwork();
        const data = res.data;
        setRaw(data);

        const timeLabel = new Date().toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        if (prevData.current) {
          const elapsed = 3;
          const inDelta = Math.max((data.bytes_recv - prevData.current.bytes_recv) / elapsed, 0);
          const outDelta = Math.max((data.bytes_sent - prevData.current.bytes_sent) / elapsed, 0);

          setCurrent({ inRate: inDelta, outRate: outDelta, connections: data.connections });
          setPeakIn(prev => Math.max(prev, inDelta));
          setPeakOut(prev => Math.max(prev, outDelta));

          setThroughputHistory(prev => [...prev, {
            time: timeLabel,
            in: +(inDelta / 1024).toFixed(1),
            out: +(outDelta / 1024).toFixed(1),
          }].slice(-120));
        }

        if (prevPackets.current) {
          const pktInDelta = data.packets_recv - prevPackets.current.packets_recv;
          const pktOutDelta = data.packets_sent - prevPackets.current.packets_sent;

          setPacketHistory(prev => [...prev, {
            time: timeLabel,
            recv: pktInDelta,
            sent: pktOutDelta,
          }].slice(-120));
        }

        prevData.current = data;
        prevPackets.current = data;
      } catch (err) {
        console.error('Network detail fetch error:', err);
      }
    };

    doFetch();
    const kickstart = setTimeout(doFetch, 1500);
    const interval = setInterval(doFetch, 3000);
    return () => {
      clearTimeout(kickstart);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div>
          <h2 className="detail-title">Network Monitor</h2>
          <p className="detail-subtitle">
            {current.connections === -1 ? 'Connections require root' : `${current.connections} active connections`}
          </p>
        </div>
        <div className="detail-stats-row">
          <div className="detail-stat">
            <span className="detail-stat-label">↓ IN</span>
            <span className="detail-stat-value">{formatRate(current.inRate)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">↑ OUT</span>
            <span className="detail-stat-value">{formatRate(current.outRate)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">PEAK IN</span>
            <span className="detail-stat-value peak">{formatRate(peakIn)}</span>
          </div>
          <div className="detail-stat">
            <span className="detail-stat-label">PEAK OUT</span>
            <span className="detail-stat-value peak">{formatRate(peakOut)}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Throughput Chart */}
        <div className="detail-card span-3">
          <h4>Network Throughput (KB/s)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={throughputHistory}>
              <defs>
                <linearGradient id="netDetailInGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netDetailOutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(val) => `${val} KB/s`} />
              <Area type="monotone" dataKey="in" stroke="#22d3ee" strokeWidth={2} fill="url(#netDetailInGrad)" name="Download" />
              <Area type="monotone" dataKey="out" stroke="#34d399" strokeWidth={2} fill="url(#netDetailOutGrad)" name="Upload" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Packet Chart */}
        <div className="detail-card span-2">
          <h4>Packets Per Interval</h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={packetHistory}>
              <XAxis dataKey="time" tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a6478', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="recv" stroke="#22d3ee" strokeWidth={2} dot={false} name="Received" />
              <Line type="monotone" dataKey="sent" stroke="#34d399" strokeWidth={2} dot={false} name="Sent" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transfer Totals */}
        <div className="detail-card">
          <h4>Session Totals</h4>
          {raw && (
            <div className="transfer-totals">
              <div className="transfer-stat">
                <span className="transfer-icon">↓</span>
                <div className="transfer-info">
                  <span className="transfer-label">Total Received</span>
                  <span className="transfer-value">{formatBytes(raw.bytes_recv)}</span>
                </div>
              </div>
              <div className="transfer-stat">
                <span className="transfer-icon">↑</span>
                <div className="transfer-info">
                  <span className="transfer-label">Total Sent</span>
                  <span className="transfer-value">{formatBytes(raw.bytes_sent)}</span>
                </div>
              </div>
              <div className="transfer-divider"></div>
              <div className="transfer-stat">
                <div className="transfer-info">
                  <span className="transfer-label">Packets Received</span>
                  <span className="transfer-value">{raw.packets_recv.toLocaleString()}</span>
                </div>
              </div>
              <div className="transfer-stat">
                <div className="transfer-info">
                  <span className="transfer-label">Packets Sent</span>
                  <span className="transfer-value">{raw.packets_sent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NetworkDetailPage;