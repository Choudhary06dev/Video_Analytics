import os
import threading
import torch
from ultralytics import YOLO
from logger import logger
import numpy as np

# Select device automatically
device = "cuda" if torch.cuda.is_available() else "cpu"

class ModelManager:
    _models = {}
    _camera_models = {}  # camera_id -> set of required model names
    _lock = threading.Lock()

    @classmethod
    def get_model(cls, model_name: str) -> YOLO:
        """
        Get the loaded model instance. If not loaded, load and warm it up.
        """
        with cls._lock:
            if model_name not in cls._models:
                MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
                model_path = os.path.join(MODELS_DIR, model_name)
                
                # Check if file exists, if not, we can fall back to standard path
                if not os.path.exists(model_path):
                    logger.warning(f"Model file {model_name} not found in models directory ({model_path}). "
                                   f"Falling back to loading via Ultralytics resolver.")
                    resolved_path = model_name
                else:
                    resolved_path = model_path
                
                logger.info(f"Loading model '{model_name}' on device '{device}'...")
                model = YOLO(resolved_path)
                model.to(device)
                
                # Warm up the model
                try:
                    dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
                    model.predict(dummy_img, verbose=False, device=device)
                    logger.info(f"Model '{model_name}' warmed up successfully.")
                except Exception as e:
                    logger.error(f"Failed to warm up model '{model_name}': {e}")
                
                cls._models[model_name] = model
            return cls._models[model_name]

    _face_models = {}

    @classmethod
    def get_face_models(cls):
        """
        Lazily load and return the MTCNN and InceptionResnetV1 face models.
        """
        with cls._lock:
            if "mtcnn" not in cls._face_models or "resnet" not in cls._face_models:
                from facenet_pytorch import MTCNN, InceptionResnetV1
                logger.info(f"Loading Face Recognition models (MTCNN & InceptionResnetV1) on device: {device}...")
                cls._face_models["mtcnn"] = MTCNN(keep_all=True, device=device)
                cls._face_models["resnet"] = InceptionResnetV1(pretrained='vggface2').eval().to(device)
                logger.info("Face Recognition models loaded successfully.")
            return cls._face_models["mtcnn"], cls._face_models["resnet"]

    @classmethod
    def register_camera_models(cls, camera_id: int, required_models: set):
        """
        Register the models required by a camera. Automatically unloads unused models.
        """
        with cls._lock:
            cls._camera_models[camera_id] = required_models
            cls._reconcile_models()

    @classmethod
    def unregister_camera(cls, camera_id: int):
        """
        Unregister a camera when its engine shuts down.
        """
        with cls._lock:
            if camera_id in cls._camera_models:
                del cls._camera_models[camera_id]
                cls._reconcile_models()

    @classmethod
    def _reconcile_models(cls):
        """
        Determines the union of all required models across active cameras,
        loads any missing ones, and unloads any models that are no longer needed.
        Note: Must be called while holding _lock.
        """
        # Determine all unique models required by all cameras
        union_required = set()
        for models_set in cls._camera_models.values():
            union_required.update(models_set)

        # Unload models that are currently loaded but not in the required union
        loaded_models = list(cls._models.keys())
        for model_name in loaded_models:
            if model_name not in union_required:
                logger.info(f"Unloading model '{model_name}' (no longer required by any active stream)...")
                del cls._models[model_name]

        # Trigger PyTorch garbage collection if using CUDA
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info(f"Active models in memory: {list(cls._models.keys())}")
