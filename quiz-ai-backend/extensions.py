import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

redis_storage = os.getenv("REDIS_URL") or os.getenv("RATELIMIT_STORAGE_URI") or "memory://"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["500 per day", "100 per hour"],
    storage_uri=redis_storage,
)
