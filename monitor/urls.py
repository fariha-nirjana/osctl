"""
API route definitions for the monitor app.
All endpoints are prefixed with /api/ via backend/urls.py.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('cpu/', views.cpu_info),
    path('memory/', views.memory_info),
    path('disk/', views.disk_info),
    path('network/', views.network_info),
    path('processes/', views.process_list),
    path('logs/', views.system_logs),
    path('logs/clear/', views.clear_logs),
    path('kill/', views.kill_process),
]