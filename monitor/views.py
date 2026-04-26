"""
API views for real-time OS health data.
Each view queries psutil and returns JSON via Django REST Framework.
"""

import psutil
import time
from rest_framework.decorators import api_view
from rest_framework.response import Response


# Returns CPU usage, per-core breakdown, frequency, and load averages
@api_view(['GET'])
def cpu_info(request):
    cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
    freq = psutil.cpu_freq()
    load_avg = psutil.getloadavg()

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


# Returns mounted disk partitions with usage stats and I/O read/write counters
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

    return Response({
        'partitions': partitions,
        'io': {
            'read_bytes': io.read_bytes,
            'write_bytes': io.write_bytes,
            'read_count': io.read_count,
            'write_count': io.write_count,
        },
    })


# Returns network I/O counters (bytes/packets sent/received) and active connection count
@api_view(['GET'])
def network_info(request):
    io = psutil.net_io_counters()
    connections = psutil.net_connections(kind='inet')

    return Response({
        'bytes_sent': io.bytes_sent,
        'bytes_recv': io.bytes_recv,
        'packets_sent': io.packets_sent,
        'packets_recv': io.packets_recv,
        'connections': len(connections),
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