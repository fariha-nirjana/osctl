"""
API views for real-time OS health data.
Each view queries psutil and returns JSON via Django REST Framework.
"""

import psutil
import time
from rest_framework.decorators import api_view
from rest_framework.response import Response
import os
import json
from datetime import datetime
from django.conf import settings


# Returns CPU usage, per-core breakdown, frequency, load averages, usage split, and temperature
@api_view(['GET'])
def cpu_info(request):
    cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
    freq = psutil.cpu_freq()
    load_avg = psutil.getloadavg()
    cpu_times = psutil.cpu_times_percent(interval=0)

    # Fan speed (if available)
    temp = None
    try:
        temps = psutil.sensors_temperatures()
        if temps:
            for name, entries in temps.items():
                if entries:
                    temp = round(entries[0].current, 1)
                    break
    except (AttributeError, Exception):
        pass

    # Fan speed (if available)
    fan = None
    try:
        fans = psutil.sensors_fans()
        if fans:
            for name, entries in fans.items():
                if entries:
                    fan = entries[0].current
                    break
    except (AttributeError, Exception):
        pass

    return Response({
        'overall': psutil.cpu_percent(interval=0),
        'per_core': cpu_percent,
        'core_count': psutil.cpu_count(logical=True),
        'physical_cores': psutil.cpu_count(logical=False),
        'frequency': {
            'current': round(freq.current, 1) if freq else None,
            'max': round(freq.max, 1) if freq else None,
        },
        'load_avg': {
            '1min': round(load_avg[0], 2),
            '5min': round(load_avg[1], 2),
            '15min': round(load_avg[2], 2),
        },
        'usage_split': {
            'user': round(cpu_times.user, 1),
            'system': round(cpu_times.system, 1),
            'idle': round(cpu_times.idle, 1),
            'iowait': round(getattr(cpu_times, 'iowait', 0), 1),
        },
        'temp': temp,
        'fan': fan,
    })


# Returns RAM usage breakdown (total, used, available, cached, wired) and swap stats
@api_view(['GET'])
def memory_info(request):
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()

    return Response({
        'total': mem.total,
        'used': mem.used,
        'available': mem.available,
        'percent': mem.percent,
        'cached': getattr(mem, 'cached', 0),
        'wired': getattr(mem, 'wired', 0),
        'swap': {
            'total': swap.total,
            'used': swap.used,
            'percent': swap.percent,
        },
    })


# Returns mounted disk partitions with usage stats, I/O counters, and per-disk I/O
@api_view(['GET'])
def disk_info(request):
    partitions = []
    for part in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(part.mountpoint)
            partitions.append({
                'device': part.device,
                'mountpoint': part.mountpoint,
                'fstype': part.fstype,
                'total': usage.total,
                'used': usage.used,
                'free': usage.free,
                'percent': usage.percent,
            })
        except PermissionError:
            continue

    io = psutil.disk_io_counters()

    # Per-disk I/O counters (if available)
    per_disk = {}
    try:
        per_disk_raw = psutil.disk_io_counters(perdisk=True)
        for name, counters in per_disk_raw.items():
            per_disk[name] = {
                'read_bytes': counters.read_bytes,
                'write_bytes': counters.write_bytes,
            }
    except Exception:
        pass

    return Response({
        'partitions': partitions,
        'io': {
            'read_bytes': io.read_bytes,
            'write_bytes': io.write_bytes,
            'read_count': io.read_count,
            'write_count': io.write_count,
        },
        'per_disk': per_disk,
    })

# Returns network I/O counters (bytes/packets sent/received) and active connection count
@api_view(['GET'])
def network_info(request):
    io = psutil.net_io_counters()

    # net_connections could require root on macOS/ contingency
    try:
        connections = len(psutil.net_connections(kind='inet'))
    except psutil.AccessDenied:
        connections = -1

    return Response({
        'bytes_sent': io.bytes_sent,
        'bytes_recv': io.bytes_recv,
        'packets_sent': io.packets_sent,
        'packets_recv': io.packets_recv,
        'connections': connections,
    })


# Returns all running processes sorted by CPU usage (descending)
@api_view(['GET'])
def process_list(request):
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'status']):
        try:
            info = proc.info
            processes.append({
                'pid': info['pid'],
                'name': info['name'],
                'user': info['username'] or '—',
                'cpu': round(info['cpu_percent'] or 0, 1),
                'memory': round(info['memory_percent'] or 0, 1),
                'status': info['status'],
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    processes.sort(key=lambda p: p['cpu'], reverse=True)
    return Response(processes)


# Log file path; stores timestamped system events as JSON lines
LOG_FILE = os.path.join(settings.BASE_DIR, 'system_events.log')


@api_view(['GET'])
def system_logs(request):
    """Returns recent system events and logs new snapshot each call."""
    # Capture current system snapshot
    cpu = psutil.cpu_percent(interval=0)
    mem = psutil.virtual_memory()
    disk = psutil.disk_io_counters()
    net = psutil.net_io_counters()

    entry = {
        'timestamp': datetime.now().isoformat(),
        'cpu_percent': cpu,
        'memory_percent': mem.percent,
        'memory_used_gb': round(mem.used / 1073741824, 2),
        'disk_read_mb': round(disk.read_bytes / 1048576, 1),
        'disk_write_mb': round(disk.write_bytes / 1048576, 1),
        'net_sent_mb': round(net.bytes_sent / 1048576, 1),
        'net_recv_mb': round(net.bytes_recv / 1048576, 1),
    }

    # Check for alert-worthy conditions
    alerts = []
    if cpu > 80:
        entry['alert'] = f'HIGH CPU: {cpu}%'
        alerts.append({'level': 'critical', 'message': f'CPU usage at {cpu}%', 'threshold': 80})
    elif cpu > 60:
        entry['alert'] = f'ELEVATED CPU: {cpu}%'
        alerts.append({'level': 'warning', 'message': f'CPU usage at {cpu}%', 'threshold': 60})

    if mem.percent > 85:
        entry['alert_mem'] = f'HIGH MEMORY: {mem.percent}%'
        alerts.append({'level': 'critical', 'message': f'Memory usage at {mem.percent}%', 'threshold': 85})
    elif mem.percent > 70:
        entry['alert_mem'] = f'ELEVATED MEMORY: {mem.percent}%'
        alerts.append({'level': 'warning', 'message': f'Memory usage at {mem.percent}%', 'threshold': 70})

    # Count zombie processes
    zombie_count = 0
    for proc in psutil.process_iter(['status']):
        try:
            if proc.info['status'] == 'zombie':
                zombie_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    if zombie_count > 0:
        alerts.append({
            'level': 'warning',
            'message': f'{zombie_count} zombie process(es) detected',
            'threshold': 0,
        })

    entry['zombie_count'] = zombie_count

    # Append to log file (I/O subsystem concept — file writing)
    with open(LOG_FILE, 'a') as f:
        f.write(json.dumps(entry) + '\n')

    # Read last 50 log entries
    logs = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r') as f:
            lines = f.readlines()
            for line in lines[-50:]:
                try:
                    logs.append(json.loads(line.strip()))
                except json.JSONDecodeError:
                    continue

    logs.reverse()  # newest first

    return Response({
        'current': entry,
        'alerts': alerts,
        'alert_count': len(alerts),
        'logs': logs,
    })


@api_view(['DELETE'])
def clear_logs(request):
    """Clears the system event log file."""
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    return Response({'status': 'cleared'})