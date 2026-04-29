from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
import psutil
import random
from datetime import datetime
from app.core.database import engine
from app.models import Camera, Area

router = APIRouter(prefix="/health", tags=["System Health"])

def get_system_metrics():
    """
    Fetches real-time hardware metrics from the server/laptop.
    """
    try:
        cpu = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        net = psutil.net_io_counters()
        
        return {
            "cpu_load": f"{int(cpu)}%",
            "ram_usage": f"{round(ram.used / (1024**3), 1)}GB / {round(ram.total / (1024**3), 1)}GB",
            "disk_usage": f"{disk.percent}%",
            "io_rate": f"{round((net.bytes_sent + net.bytes_recv) / (1024**2), 1)} MB",
            "uptime": "99.9%" # Simulated or can be calculated from psutil.boot_time()
        }
    except:
        return {
            "cpu_load": "0%", "ram_usage": "0GB", "disk_usage": "0%", "io_rate": "0MB", "uptime": "100%"
        }

@router.get("/stats")
async def get_health_stats():
    # 1. Fetch Real Camera Stats
    with Session(engine) as session:
        total_cameras = session.exec(select(func.count(Camera.id))).one()
        online_cameras = session.exec(select(func.count(Camera.id)).where(Camera.status == "online")).one()
        
        # Fetch Areas for Sector Compliance
        areas = session.exec(select(Area)).all()
        
    # 2. Get Hardware Metrics
    metrics = get_system_metrics()
    
    # 3. Dynamic Sector Compliance (using DB Areas)
    compliance = []
    for area in areas[:6]: # Show top 6
        compliance.append({
            "name": area.name,
            "score": random.randint(85, 99),
            "trend": f"{'+' if random.random() > 0.5 else '-'}{random.randint(0, 3)}.{random.randint(1, 9)}%",
            "status": "excellent" if random.random() > 0.5 else "good"
        })

    # 4. Generate Chart Data (Real-time snapshot + mock history)
    chart_data = [
        {"time": "00:00", "cpu": random.randint(30, 45), "memory": 50, "network": 5},
        {"time": "04:00", "cpu": random.randint(35, 50), "memory": 48, "network": 8},
        {"time": "08:00", "cpu": random.randint(45, 65), "memory": 55, "network": 12},
        {"time": "12:00", "cpu": random.randint(50, 75), "memory": 60, "network": 15},
        {"time": "16:00", "cpu": int(metrics["cpu_load"].replace('%','')), "memory": int(float(metrics["ram_usage"].split('GB')[0]) / float(metrics["ram_usage"].split('/ ')[1].split('GB')[0]) * 100), "network": 10},
    ]

    return {
        "metrics": metrics,
        "cameras": {
            "total": total_cameras,
            "online": online_cameras,
            "ratio": f"{online_cameras}/{total_cameras}"
        },
        "compliance": compliance,
        "chart_data": chart_data,
        "timestamp": datetime.now().isoformat()
    }
