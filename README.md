

# ⊡ osctl — OS Health Dashboard

**Real-time system monitoring + OS concepts simulator, built from scratch.**

osctl is a full-stack web application that reads live operating system data such as CPU, memory, disk, network, processes, and visualizes it through an interactive dashboard. It also includes a Deadlock Simulator that implements the Banker's Algorithm with step-by-step tracing, bridging the gap between textbook OS theory and real system behavior.

Built as a solo project for CSE 323 (Operating Systems Design), Spring 2026.

---

## What does it actually do?

Open the dashboard, and you're looking at your machine's internals in real time. CPU ticks updating every few seconds. Memory pressure shifting as you open and close apps. Disk I/O spiking when you download a file. Network throughput climbing when you stream something. Processes appearing, disappearing, running, sleeping, occasionally going zombie.

It's like Activity Monitor if you ripped it apart and rebuilt it yourself that fetches every number it shows on screen from the kernel.

Then switch to Learn Mode, and you've got an interactive Deadlock Simulator where you can define processes and resources, tweak allocation and max matrices, and watch the Banker's Algorithm walk through each step, finding a safe sequence or catching a deadlock in real time.

---

## Hero Features

**The Overview Dashboard =>** One screen, six live-updating panels, all pulling real OS data through psutil. CPU with stacked user/system charts, memory with a donut breakdown, disk I/O with throughput bars, network with in/out area charts, and a full process table with search, sort, and click-to-expand detail cards. A metric strip across the top shows sparklines and delta indicators, reminiscent of a professional monitoring tool.

**Per-Core CPU Heatmap =>** The dedicated CPU page shows a color-coded heatmap of every core on your machine, updated live. Cores shift from cool blue to yellow to red as load increases. Below that, a per-core history view tracks the last 30 samples as tiny stacked bars. You can literally watch work moving between cores as the OS scheduler distributes load.

**Deadlock Simulator =>** Not just a static visualization. You edit the Allocation and Max matrices directly, the Need matrix and Available vector compute automatically, and when you run the Banker's Algorithm, it doesn't just give you the answer; it walks through every step. "P1: Need [1, 1, 0] ≤ Available [1, 1, 1] → CAN execute. P1 finishes → releases [2, 0, 0] → Available now [3, 1, 1]." You can step through forward and backward, or show all at once. The four necessary conditions (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait) are displayed as cards that update based on your input.

**Process Termination =>** Click any process, see its full details, and hit Terminate. The backend sends SIGTERM. Try it on a system process and you'll get "Permission denied," which is the OS protection model in action. Try it on a Chrome tab and watch it vanish from the table on the next refresh.

**Alert System with Live Badge =>** The sidebar shows a pulsing red badge when alerts are active. CPU above 60% triggers a warning. Above 80%, it's critical. Memory above 70% gets flagged. Zombie processes get called out immediately. Every alert is logged with a timestamp, and you can export the full event history as a CSV.

---

## All Features

**Monitor Mode**
- Overview dashboard with MetricStrip (sparklines, deltas, live stats)
- CPU panel => stacked/per-core/load-avg chart tabs, usage split (user/system/iowait), peak tracking
- Memory panel => donut chart, App/Wired/Cached/Free breakdown, swap usage
- Disk I/O panel => read/write throughput chart, volume usage bars
- Network panel => in/out area chart, connection count, transfer rates
- Process panel => sortable by CPU/memory, filterable, expandable detail rows, kill support
- System Event Logger => timestamped JSON logs, threshold alerts, CSV export

**Dedicated Detail Pages**
- CPU Monitor => per-core heatmap, usage breakdown donut, load average cards, per-core history bars
- Memory Monitor => pressure gauge with thresholds, composition chart, swap detail, top memory consumers
- Storage Monitor => I/O throughput timeline, per-volume ring charts with filesystem info, I/O operation stats
- Network Monitor => throughput chart, packet history, session totals (bytes and packets sent/received)
- Process Manager => state distribution donut, top CPU/memory consumers, state history, full table with status badges
- Logs => event table with filtering, CPU/memory history from log data, CSV export
- Alerts => active alert cards, threshold configuration display, alert history timeline, sidebar badge counter

**Learn Mode**
- Deadlock Simulator => Banker's Algorithm implementation
- Editable Allocation, Max matrices with auto-computed Need and Available
- Step-by-step algorithm trace with prev/next navigation
- Four necessary conditions display
- Safe sequence detection or deadlock identification

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Django, Django REST Framework |
| OS Data | psutil (reads CPU, memory, disk, network, process data via macOS Mach kernel APIs) |
| Frontend | React, Recharts, Axios |
| Styling | Custom CSS, dark theme, JetBrains Mono + Inter fonts |
| Version Control | Git + GitHub |

---

## How It Maps to the Course

| Course Topic | Where It Shows Up |
|---|---|
| Process Management | Process table, state tracking (running/sleeping/zombie), process termination via SIGTERM |
| CPU Scheduling | CPU usage over time, per-core load visualization, load averages (scheduler run queue depth) |
| Memory Management | RAM breakdown (app/wired/cached/free), virtual memory stats, swap monitoring, memory pressure |
| Storage Management | Disk partitions, read/write throughput, volume capacity, filesystem types |
| I/O Subsystem | Network I/O (bytes/packets), disk I/O counters, system event logging to file |
| OS Structure | psutil calls macOS Mach kernel APIs (host_processor_info, host_statistics64, proc_pidinfo) under the hood |
| Deadlocks | Banker's Algorithm, Resource Allocation Graph concepts, four necessary conditions, safe sequence detection |
| Protection & Security | Process permissions — root vs user, SIGTERM access control, AccessDenied handling |

---

## Running It Locally

**Prerequisites:** Python 3, Node.js, npm

**Backend:**
```bash
cd osctl
python3 -m venv venv
source venv/bin/activate
pip install django djangorestframework psutil django-cors-headers
python3 manage.py runserver
```

**Frontend (in a separate terminal):**
```bash
cd osctl/frontend
npm install
npm start
```

Open `http://localhost:3000` and you're in.

---

## macOS Notes

This was built and tested on an Apple Silicon Mac. A couple of things to know:

- `sensors_temperatures()` and `sensors_fans()` are not available on macOS. Apple doesn't expose thermal data through standard interfaces. Temperature and fan speed fields are handled gracefully (they just don't render).
- `psutil.net_connections()` requires root access on macOS, so the connection count displays as "—" unless you run the backend with sudo.
- Disk partitions include macOS system volumes (Preboot, Recovery, VM, etc.); the dashboard filters these out to show only meaningful volumes.

---

## Screenshots

<img width="1918" height="965" alt="osctl 1" src="https://github.com/user-attachments/assets/7036c280-c7d7-4e3b-ba81-4fea99605274" />


---

<div align="center">

**Built by Fariha Tasnim**

North South University · CSE 323 · Spring 2026

[![GitHub](https://img.shields.io/badge/GitHub-osctl-22d3ee?style=flat&logo=github)](https://github.com/YOUR_USERNAME/osctl)
![Python](https://img.shields.io/badge/Python-3.x-blue?style=flat&logo=python)
![Django](https://img.shields.io/badge/Django-REST-green?style=flat&logo=django)
![React](https://img.shields.io/badge/React-Recharts-61dafb?style=flat&logo=react)

</div>
