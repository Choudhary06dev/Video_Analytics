import base64
import cv2
import numpy as np
import requests
import torch
import threading
import time
from facenet_pytorch import MTCNN, InceptionResnetV1
from config import BACKEND_URL
from logger import logger

device = "cuda" if torch.cuda.is_available() else "cpu"

class BlacklistManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(BlacklistManager, cls).__new__(cls)
                    cls._instance._init_manager()
        return cls._instance

    def _init_manager(self):
        self.embeddings = []  # list of dicts: {"id": int, "name": str, "reason": str, "severity": str, "embedding": np.ndarray}
        self.running = False
        self.mtcnn = None
        self.resnet = None
        self.last_sync = 0.0
        self.sync_thread = None

    def start(self):
        with self._lock:
            if not self.running:
                self.running = True
                self.sync_thread = threading.Thread(target=self._sync_loop, daemon=True)
                self.sync_thread.start()
                logger.info("BlacklistManager sync thread started.")

    def stop(self):
        with self._lock:
            self.running = False

    def _lazy_init_models(self):
        if self.mtcnn is None or self.resnet is None:
            logger.info(f"Initializing Face Recognition models in BlacklistManager on device: {device}...")
            # keep_all=False: only detect single face for database images
            # select_largest=True: grab the main face if multiple detected
            # post_process=True: normalize face pixels to [-1, 1] range (MUST match InferenceEngine normalization)
            self.mtcnn = MTCNN(keep_all=False, select_largest=True, post_process=True, device=device)
            self.resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)
            logger.info("Face Recognition models initialized successfully in BlacklistManager.")

    def _sync_loop(self):
        while self.running:
            try:
                self.sync_now()
            except Exception as e:
                logger.error(f"Error in BlacklistManager sync loop: {e}", exc_info=True)
            
            # If we haven't successfully synced yet, retry quickly (every 5 seconds)
            if self.last_sync == 0.0:
                time.sleep(5)
            else:
                time.sleep(60)

    def sync_now(self):
        url = f"{BACKEND_URL}/api/v1/blacklist"
        try:
            response = requests.get(url, timeout=5)
            if response.status_code != 200:
                logger.error(f"Failed to fetch blacklist from backend: HTTP {response.status_code}")
                return
            data = response.json()
        except Exception as e:
            logger.error(f"Error fetching blacklist from backend: {e}")
            return

        new_embeddings = []
        if data:
            self._lazy_init_models()
        else:
            with self._lock:
                self.embeddings = []
            return

        for item in data:
            person_id = item.get("id")
            name = item.get("full_name")
            reason = item.get("reason", "")
            severity = item.get("severity", "HIGH")
            image_preview = item.get("image_preview")

            if not image_preview:
                logger.warning(f"Blacklist person {name} (ID {person_id}) has no image preview. Skipping.")
                continue

            try:
                # Handle base64 encoding prefix
                if "," in image_preview:
                    header, encoded = image_preview.split(",", 1)
                else:
                    encoded = image_preview
                
                img_bytes = base64.b64decode(encoded)
                nparr = np.frombuffer(img_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    raise ValueError("CV2 failed to decode image bytes.")
                
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                
                # Run MTCNN to crop face
                face = self.mtcnn(img_rgb)
                if face is not None:
                    face_tensor = face.unsqueeze(0).to(device)
                    with torch.no_grad():
                        embedding = self.resnet(face_tensor).cpu().numpy()[0]
                    
                    new_embeddings.append({
                        "id": person_id,
                        "name": name,
                        "reason": reason,
                        "severity": severity,
                        "embedding": embedding
                    })
                    logger.info(f"Loaded blacklist embedding for: {name} (ID {person_id})")
                else:
                    logger.warning(f"No face detected in blacklist image for {name} (ID {person_id}).")
            except Exception as e:
                logger.error(f"Failed to extract face embedding for {name} (ID {person_id}): {e}")

        with self._lock:
            self.embeddings = new_embeddings
            self.last_sync = time.time()
        logger.info(f"Blacklist synced. Cache size: {len(self.embeddings)} embeddings.")

    def get_embeddings(self):
        with self._lock:
            return list(self.embeddings)

    @staticmethod
    def calculate_similarity(v1, v2):
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        return float(dot_product / (norm_v1 * norm_v2))
