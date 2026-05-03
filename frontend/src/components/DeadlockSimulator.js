// DeadlockSimulator => interactive deadlock detection using Resource Allocation Graph + Banker's Algorithm
// Covers OS course topics: deadlock characterization, RAG, safe sequences, Banker's Algorithm
import React, { useState } from 'react';

// Default example: classic deadlock scenario
const DEFAULT_PROCESSES = ['P0', 'P1', 'P2'];
const DEFAULT_RESOURCES = [
  { name: 'R0', instances: 3 },
  { name: 'R1', instances: 2 },
  { name: 'R2', instances: 2 },
];
const DEFAULT_ALLOCATION = [
  [0, 1, 0],  // P0 holds 0 R0, 1 R1, 0 R2
  [2, 0, 0],  // P1 holds 2 R0, 0 R1, 0 R2
  [0, 0, 1],  // P2 holds 0 R0, 0 R1, 1 R2
];
const DEFAULT_MAX = [
  [2, 1, 1],  // P0 max need
  [3, 1, 0],  // P1 max need
  [1, 0, 2],  // P2 max need
];

function DeadlockSimulator() {
  const [processes] = useState(DEFAULT_PROCESSES);
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [allocation, setAllocation] = useState(DEFAULT_ALLOCATION);
  const [max, setMax] = useState(DEFAULT_MAX);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(-1);
  const [steps, setSteps] = useState([]);

  // Calculate need matrix: Need = Max - Allocation
  const getNeed = () => {
    return max.map((row, i) =>
      row.map((val, j) => val - allocation[i][j])
    );
  };

  // Calculate available vector: Available = Total - sum(Allocation)
  const getAvailable = () => {
    return resources.map((r, j) => {
      const totalAllocated = allocation.reduce((sum, row) => sum + row[j], 0);
      return r.instances - totalAllocated;
    });
  };

  // Banker's Algorithm — returns safe sequence or deadlock info
  const runBankers = () => {
    const n = processes.length;
    const m = resources.length;
    const need = getNeed();
    const available = [...getAvailable()];
    const finish = new Array(n).fill(false);
    const sequence = [];
    const traceSteps = [];

    traceSteps.push({
      type: 'init',
      message: `Starting Banker's Algorithm with ${n} processes and ${m} resources`,
      available: [...available],
      need: need.map(r => [...r]),
      finish: [...finish],
    });

    let found = true;
    while (found) {
      found = false;
      for (let i = 0; i < n; i++) {
        if (!finish[i]) {
          // Check if Need[i] <= Available
          const canRun = need[i].every((val, j) => val <= available[j]);

          if (canRun) {
            traceSteps.push({
              type: 'check_pass',
              process: processes[i],
              message: `${processes[i]}: Need [${need[i].join(', ')}] ≤ Available [${available.join(', ')}] → CAN execute`,
              available: [...available],
              finish: [...finish],
            });

            // Process can finish — release its resources
            for (let j = 0; j < m; j++) {
              available[j] += allocation[i][j];
            }
            finish[i] = true;
            sequence.push(processes[i]);
            found = true;

            traceSteps.push({
              type: 'release',
              process: processes[i],
              message: `${processes[i]} finishes → releases [${allocation[i].join(', ')}] → Available now [${available.join(', ')}]`,
              available: [...available],
              finish: [...finish],
              sequence: [...sequence],
            });
          } else {
            traceSteps.push({
              type: 'check_fail',
              process: processes[i],
              message: `${processes[i]}: Need [${need[i].join(', ')}] > Available [${available.join(', ')}] → must wait`,
              available: [...available],
              finish: [...finish],
            });
          }
        }
      }
    }

    const isSafe = finish.every(f => f);

    if (isSafe) {
      traceSteps.push({
        type: 'result',
        safe: true,
        message: `SAFE STATE — Safe sequence: < ${sequence.join(' → ')} >`,
        sequence: [...sequence],
      });
    } else {
      const deadlocked = processes.filter((_, i) => !finish[i]);
      traceSteps.push({
        type: 'result',
        safe: false,
        message: `DEADLOCK DETECTED — Processes ${deadlocked.join(', ')} cannot complete`,
        deadlocked,
      });
    }

    setSteps(traceSteps);
    setStep(0);
    setResult({
      safe: isSafe,
      sequence: isSafe ? sequence : null,
      deadlocked: isSafe ? null : processes.filter((_, i) => !finish[i]),
    });
  };

  // Update allocation or max matrix values
  const updateMatrix = (matrix, setMatrix, i, j, value) => {
    const newMatrix = matrix.map(row => [...row]);
    newMatrix[i][j] = Math.max(0, parseInt(value) || 0);
    setMatrix(newMatrix);
    setResult(null);
    setStep(-1);
  };

  const updateInstances = (j, value) => {
    const newResources = resources.map((r, idx) =>
      idx === j ? { ...r, instances: Math.max(1, parseInt(value) || 1) } : r
    );
    setResources(newResources);
    setResult(null);
    setStep(-1);
  };

  const need = getNeed();
  const available = getAvailable();

  // Check for four necessary conditions
  const checkConditions = () => {
    const hasAllocation = allocation.some(row => row.some(v => v > 0));
    const hasWaiting = need.some(row => row.some(v => v > 0));
    const hasLimitedResources = resources.some(r => r.instances < processes.length);

    return [
      {
        name: 'Mutual Exclusion',
        met: true,
        desc: 'Resources can only be held by one process at a time',
      },
      {
        name: 'Hold and Wait',
        met: hasAllocation && hasWaiting,
        desc: 'Processes hold resources while waiting for others',
      },
      {
        name: 'No Preemption',
        met: true,
        desc: 'Resources cannot be forcibly taken from processes',
      },
      {
        name: 'Circular Wait',
        met: result ? !result.safe : false,
        desc: result ? (result.safe ? 'No circular dependency found' : 'Circular dependency detected!') : 'Run the algorithm to check',
      },
    ];
  };

  const conditions = checkConditions();

  return (
    <div className="deadlock-sim">
      <div className="deadlock-header">
        <div>
          <h2 className="deadlock-title">Deadlock Simulator</h2>
          <p className="deadlock-subtitle">Resource Allocation Graph & Banker's Algorithm</p>
        </div>
        <button className="run-btn" onClick={runBankers}>
          Run Banker's Algorithm
        </button>
      </div>

      {/* Four Necessary Conditions */}
      <div className="conditions-strip">
        {conditions.map((c, i) => (
          <div className={`condition-card ${c.met ? 'met' : 'not-met'}`} key={i}>
            <span className="condition-indicator">{c.met ? '●' : '○'}</span>
            <div className="condition-info">
              <span className="condition-name">{c.name}</span>
              <span className="condition-desc">{c.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="deadlock-content">
        {/* Left: Matrices */}
        <div className="matrices-section">
          {/* Resource Instances */}
          <div className="matrix-block">
            <h4>Total Resource Instances</h4>
            <div className="matrix-grid header-only">
              <div className="matrix-corner"></div>
              {resources.map((r, j) => (
                <div className="matrix-header" key={j}>{r.name}</div>
              ))}
              <div className="matrix-row-label">Total</div>
              {resources.map((r, j) => (
                <input
                  key={j}
                  type="number"
                  className="matrix-input"
                  value={r.instances}
                  min={1}
                  onChange={(e) => updateInstances(j, e.target.value)}
                />
              ))}
            </div>
          </div>

          {/* Allocation Matrix */}
          <div className="matrix-block">
            <h4>Allocation Matrix <span className="matrix-hint">Currently held</span></h4>
            <div className="matrix-grid" style={{ gridTemplateColumns: `60px repeat(${resources.length}, 1fr)` }}>
              <div className="matrix-corner"></div>
              {resources.map((r, j) => (
                <div className="matrix-header" key={j}>{r.name}</div>
              ))}
              {processes.map((p, i) => (
                <React.Fragment key={i}>
                  <div className="matrix-row-label">{p}</div>
                  {resources.map((_, j) => (
                    <input
                      key={j}
                      type="number"
                      className="matrix-input"
                      value={allocation[i][j]}
                      min={0}
                      onChange={(e) => updateMatrix(allocation, setAllocation, i, j, e.target.value)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Max Matrix */}
          <div className="matrix-block">
            <h4>Max Matrix <span className="matrix-hint">Maximum need</span></h4>
            <div className="matrix-grid" style={{ gridTemplateColumns: `60px repeat(${resources.length}, 1fr)` }}>
              <div className="matrix-corner"></div>
              {resources.map((r, j) => (
                <div className="matrix-header" key={j}>{r.name}</div>
              ))}
              {processes.map((p, i) => (
                <React.Fragment key={i}>
                  <div className="matrix-row-label">{p}</div>
                  {resources.map((_, j) => (
                    <input
                      key={j}
                      type="number"
                      className="matrix-input"
                      value={max[i][j]}
                      min={0}
                      onChange={(e) => updateMatrix(max, setMax, i, j, e.target.value)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Need Matrix (computed, read-only) */}
          <div className="matrix-block">
            <h4>Need Matrix <span className="matrix-hint">Max − Allocation (computed)</span></h4>
            <div className="matrix-grid" style={{ gridTemplateColumns: `60px repeat(${resources.length}, 1fr)` }}>
              <div className="matrix-corner"></div>
              {resources.map((r, j) => (
                <div className="matrix-header" key={j}>{r.name}</div>
              ))}
              {processes.map((p, i) => (
                <React.Fragment key={i}>
                  <div className="matrix-row-label">{p}</div>
                  {resources.map((_, j) => (
                    <div className={`matrix-cell ${need[i][j] < 0 ? 'invalid' : ''}`} key={j}>
                      {need[i][j]}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Available Vector */}
          <div className="matrix-block">
            <h4>Available Vector <span className="matrix-hint">Total − Σ Allocation</span></h4>
            <div className="matrix-grid header-only">
              <div className="matrix-corner"></div>
              {resources.map((r, j) => (
                <div className="matrix-header" key={j}>{r.name}</div>
              ))}
              <div className="matrix-row-label">Avail</div>
              {available.map((val, j) => (
                <div className={`matrix-cell ${val < 0 ? 'invalid' : ''}`} key={j}>{val}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Algorithm Trace */}
        <div className="trace-section">
          <h4>Algorithm Trace</h4>

          {result && (
            <div className={`result-banner ${result.safe ? 'safe' : 'unsafe'}`}>
              {result.safe ? (
                <>
                  <span className="result-icon">✓</span>
                  <div>
                    <span className="result-title">SAFE STATE</span>
                    <span className="result-detail">Safe sequence: &lt; {result.sequence.join(' → ')} &gt;</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="result-icon">✕</span>
                  <div>
                    <span className="result-title">DEADLOCK DETECTED</span>
                    <span className="result-detail">Deadlocked: {result.deadlocked.join(', ')}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {steps.length > 0 && (
            <div className="trace-controls">
              <button
                className="trace-btn"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step <= 0}
              >← Prev</button>
              <span className="trace-counter">Step {step + 1} / {steps.length}</span>
              <button
                className="trace-btn"
                onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                disabled={step >= steps.length - 1}
              >Next →</button>
              <button
                className="trace-btn show-all"
                onClick={() => setStep(steps.length - 1)}
              >Show All</button>
            </div>
          )}

          <div className="trace-list">
            {steps.slice(0, step + 1).map((s, i) => (
              <div className={`trace-entry ${s.type}`} key={i}>
                <span className="trace-step-num">{i + 1}</span>
                <span className="trace-message">{s.message}</span>
                {s.available && (
                  <span className="trace-available">Available: [{s.available.join(', ')}]</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeadlockSimulator;