import logging
import os
from logging import Logger

# Determine log level from environment variable LOG_LEVEL (default INFO)
log_level_name = os.getenv("LOG_LEVEL", "INFO").upper()
log_level = getattr(logging, log_level_name, logging.INFO)

# Configure root logger
logging.basicConfig(
    level=log_level,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Create a reusable logger instance for the backend application
logger: Logger = logging.getLogger("video_analytics_backend")

# Optionally, add a stream handler with same formatting (already added by basicConfig)
# If you need file logging, uncomment below:
# file_handler = logging.FileHandler("backend.log")
# file_handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"))
# logger.addHandler(file_handler)

__all__ = ["logger"]
