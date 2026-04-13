from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import time
from ultralytics import YOLO
import threading

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize YOLOv8 Nano model (lightweight for CPU)
# Note: On first run, this will download the 'yolov8n.pt' weight file (~6MB)
model = YOLO("yolov8n.pt")

# Global state to share detection data between video thread and API endpoints
latest_intelligence = {
    "person_count": 0,
    "last_update": time.time(),
    "objects": []
}

class VideoCamera:
    def __init__(self):
        self.video = cv2.VideoCapture(0)
        
    def __del__(self):
        self.video.release()

    def get_frame(self):
        success, frame = self.video.read()
        if not success:
            return None
        
        # --- AI INFERENCE ---
        # Run YOLOv8 on the frame
        # conf=0.5 means only objects with 50%+ confidence are shown
        results = model.predict(frame, conf=0.5, verbose=False)
        
        # Extract metadata
        person_count = 0
        objects_detected = []
        
        if results and len(results) > 0:
            # results[0].plot() draws boxes and labels on the frame automatically
            annotated_frame = results[0].plot()
            
            # Count persons specifically for the dashboard KPI
            for box in results[0].boxes:
                class_id = int(box.cls[0])
                label = results[0].names[class_id]
                objects_detected.append(label)
                if label == 'person':
                    person_count += 1
        else:
            annotated_frame = frame

        # Update global intelligence state
        global latest_intelligence
        latest_intelligence["person_count"] = person_count
        latest_intelligence["objects"] = list(set(objects_detected))
        latest_intelligence["last_update"] = time.time()
        
        # Add a custom HUD overlay
        cv2.putText(annotated_frame, f"NEURAL ENGINE ACTIVE | PERSONS: {person_count}", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Encode as JPEG
        ret, jpeg = cv2.imencode('.jpg', annotated_frame)
        return jpeg.tobytes()

def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame is None:
            time.sleep(1)
            continue
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@app.get("/")
def read_root():
    return {"status": "AI Analytics Backend Online", "ai_model": "YOLOv8 Nano"}

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(gen(VideoCamera()), 
                             media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/intelligence")
def get_intelligence():
    """Endpoint for frontend to pull real-time detection counts"""
    return latest_intelligence

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}

if __name__ == "__main__":
    import uvicorn
    # Use a single worker for AI models to avoid memory issues on CPU
    uvicorn.run(app, host="0.0.0.0", port=8000)
