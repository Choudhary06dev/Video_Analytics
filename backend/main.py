from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import time

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoCamera:
    def __init__(self):
        # Try to open the default camera (index 0)
        self.video = cv2.VideoCapture(0)
        
    def __del__(self):
        self.video.release()

    def get_frame(self):
        success, image = self.video.read()
        if not success:
            # If camera fails, return a black frame or error
            return None
        
        # Add basic overlay for "Real-time" effect
        cv2.putText(image, f"LIVE - {time.strftime('%H:%M:%S')}", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Encode as JPEG
        ret, jpeg = cv2.imencode('.jpg', image)
        return jpeg.tobytes()

def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame is None:
            # Wait a bit if frame capture fails
            time.sleep(1)
            continue
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@app.get("/")
def read_root():
    return {"status": "AI Analytics Backend Online", "version": "1.0.0"}

@app.get("/video_feed")
def video_feed():
    # Note: For production use a dedicated stream manager
    return StreamingResponse(gen(VideoCamera()), 
                             media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
