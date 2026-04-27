from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import json
import httpx
from pipelines.inference import InferenceEngine
from typing import Dict

app = FastAPI(title="AI Inference Service")

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
        active_engines[camera_id] = InferenceEngine(camera_id, source)
    return active_engines[camera_id]

async def send_events_to_backend(camera_id: int, events: list):
    if not events: return
    payload = []
    for ev in events:
        payload.append({
            "camera_id": camera_id,
            "scenario_key": ev["scenario_key"],
            "confidence": ev["confidence"],
            "metadata": ev["metadata"]
        })
    try:
        async with httpx.AsyncClient() as client:
            await client.post("http://localhost:8000/webhook/events", json=payload)
    except Exception as e:
        print("Webhook error:", e)

@app.get("/stream/{camera_id}")
async def stream_camera(camera_id: int, source: str):
    engine = await get_engine(camera_id, source)
    
    async def frame_generator():
        while True:
            frame_bytes, events = engine.process_frame()
            if events:
                asyncio.create_task(send_events_to_backend(camera_id, events))
            # In a real microservice, we would send 'events' to a message broker (Redis/RabbitMQ) 
            # or provide an endpoint for the backend to poll.
            # For simplicity, we'll just stream the video for now.
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + frame_bytes
                + b"\r\n\r\n"
            )
            await asyncio.sleep(0.1)

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
        active_engines[camera_id].update_config(enabled_scenarios)
        return {"status": "success", "reloaded": enabled_scenarios}
    return {"status": "skipped", "message": "Engine not active"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
