import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
AI_PORT = int(os.getenv("AI_PORT", "8001"))
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
