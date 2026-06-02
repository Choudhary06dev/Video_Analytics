from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import json
import httpx
import base64
import uvicorn
from config import BACKEND_URL, AI_PORT, WEBHOOK_SECRET
from pipelines.inference import InferenceEngine
from typing import Dict
from logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize persistent HTTPX client on startup
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
    app.state.http_client = httpx.AsyncClient(limits=limits, timeout=10.0)
    logger.info("Persistent HTTPX client initialized for AI webhook notifications.")
    yield
    # Shutdown & close connections cleanly
    await app.state.http_client.aclose()
    logger.info("Persistent HTTPX client shutdown successfully.")

app = FastAPI(title="AI Inference Service", lifespan=lifespan)

active_engines: Dict[int, InferenceEngine] = {}

def empty_intelligence():
    return {
        "person_count": 0,
        "objects": [],
        "stable_objects": [],
        "last_update": 0.0
    }

async def get_engine(camera_id: int, source: str) -> InferenceEngine:
    if camera_id not in active_engines:
        logger.info(f"Initializing new inference engine for camera {camera_id} with source {source}")
        active_engines[camera_id] = InferenceEngine(camera_id, source)
    return active_engines[camera_id]

async def send_events_to_backend(camera_id: int, events: list, snapshot_bytes: bytes):
    if not events: return
    
    image_base64 = base64.b64encode(snapshot_bytes).decode('utf-8')
    
    payload = []
    for ev in events:
        payload.append({
            "camera_id": camera_id,
            "scenario_key": ev["scenario_key"],
            "confidence": ev["confidence"],
            "metadata": ev["metadata"],
            "image_base64": image_base64
        })
    try:
        # Use shared persistent HTTPX AsyncClient from app state
        client = app.state.http_client
        response = await client.post(
            f"{BACKEND_URL}/webhook/events",
            json=payload,
            headers={"X-Webhook-Secret": WEBHOOK_SECRET},
        )
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Webhook connection error sending events for camera {camera_id}: {e}", exc_info=True)

@app.get("/stream/{camera_id}")
async def stream_camera(camera_id: int, source: str):
    engine = await get_engine(camera_id, source)
    
    async def frame_generator():
        while True:
            frame_bytes, events, snapshot_bytes = engine.process_frame()
            if events:
                asyncio.create_task(send_events_to_backend(camera_id, events, snapshot_bytes))
            # In a real microservice, we would send 'events' to a message broker (Redis/RabbitMQ) 
            # or provide an endpoint for the backend to poll.
            # For simplicity, we'll just stream the video for now.
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + frame_bytes
                + b"\r\n\r\n"
            )
            await asyncio.sleep(0.03) # Smoother 30FPS feel

    return StreamingResponse(frame_generator(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/intelligence/{camera_id}")
async def get_intelligence(camera_id: int):
    if camera_id not in active_engines:
        return empty_intelligence()
    return active_engines[camera_id].latest_intelligence

@app.post("/control/reload/{camera_id}")
async def reload_camera_config(camera_id: int, config: dict):
    """
    Updates the enabled scenarios for an active inference engine.
    """
    if camera_id in active_engines:
        enabled_scenarios = config.get("enabled_scenarios", [])
        scenario_configs = config.get("scenario_configs", {})
        logger.info(f"Reloading configuration for camera {camera_id}: enabled_scenarios={enabled_scenarios}")
        active_engines[camera_id].update_config(enabled_scenarios, scenario_configs)
        return {"status": "success", "reloaded": enabled_scenarios}
    return {"status": "skipped", "message": "Engine not active"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=AI_PORT)
