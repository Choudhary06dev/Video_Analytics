from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
import psutil
import random
from datetime import datetime
from app.core.database import engine
from app.models import Camera, Area, DetectionEvent

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
        
        # 3. Dynamic Sector Compliance (Real Data)
        compliance = []
        for area in areas[:6]:
            # Get cameras for this area
            area_cams_statement = select(func.count(Camera.id)).where(Camera.area_id == area.id)
            total_area_cams = session.exec(area_cams_statement).one()
            
            online_area_cams_statement = select(func.count(Camera.id)).where(Camera.area_id == area.id, Camera.status == "online")
            online_area_cams = session.exec(online_area_cams_statement).one()
            
            # Check for critical alerts in this area in last 24h
            from datetime import datetime, timedelta
            cutoff = datetime.now() - timedelta(hours=24)
            # This is a bit complex since events link to camera_id. We join through Camera.
            critical_alerts_statement = select(func.count(DetectionEvent.id)).join(Camera).where(
                Camera.area_id == area.id,
                DetectionEvent.timestamp >= cutoff,
                DetectionEvent.severity == "Critical"
            )
            critical_count = session.exec(critical_alerts_statement).one()
            
            # Calculate REAL Score
            # Base score is based on camera availability
            availability_score = (online_area_cams / total_area_cams * 100) if total_area_cams > 0 else 100
            # Deduct points for critical alerts (max deduction 30 points)
            security_deduction = min(critical_count * 10, 30)
            final_score = int(availability_score - security_deduction)
            
            compliance.append({
                "name": area.name,
                "score": final_score,
                "trend": f"-{critical_count}" if critical_count > 0 else "Stable",
                "status": "excellent" if final_score >= 90 else "good" if final_score >= 70 else "warning"
            })

    # 4. Generate Chart Data (Real-time snapshot + mock history)
    chart_data = [
        {"time": "00:00", "cpu": 35, "memory": 50, "network": 5},
        {"time": "04:00", "cpu": 42, "memory": 48, "network": 8},
        {"time": "08:00", "cpu": 55, "memory": 55, "network": 12},
        {"time": "12:00", "cpu": 70, "memory": 60, "network": 15},
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
