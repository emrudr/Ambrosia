import logging
from typing import Optional, Callable
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

CACHE_KEY_TOTAL_WISHES = "birthday:total_wishes"


class RedisService:
    def __init__(self):
        self._client: Optional[redis.Redis] = None

    @property
    def client(self) -> Optional[redis.Redis]:
        if self._client is None:
            try:
                self._client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD or None,
                    ssl=settings.REDIS_SSL,
                    decode_responses=True,
                    socket_timeout=2.0,
                    socket_connect_timeout=2.0,
                )
            except Exception as exc:
                logger.warning(f"Failed to initialize Redis client: {exc}")
                self._client = None
        return self._client

    def ping(self) -> bool:
        """Check if Redis connection is active and healthy."""
        try:
            r = self.client
            if r:
                return bool(r.ping())
        except Exception as exc:
            logger.debug(f"Redis ping failed: {exc}")
        return False

    def get_total_wishes(self, fallback_fn: Optional[Callable[[], int]] = None) -> int:
        """Get total wishes count from Redis, falling back to database if needed."""
        try:
            r = self.client
            if r:
                val = r.get(CACHE_KEY_TOTAL_WISHES)
                if val is not None:
                    return int(val)
                # Cache miss: populate from DB fallback
                if fallback_fn:
                    count = fallback_fn()
                    r.set(CACHE_KEY_TOTAL_WISHES, count)
                    return count
        except Exception as exc:
            logger.warning(f"Redis read error (falling back to DB): {exc}")
        
        # Fallback to DB count
        return fallback_fn() if fallback_fn else 0

    def increment_wishes(self, fallback_fn: Optional[Callable[[], int]] = None) -> int:
        """Atomically increment the wish counter in Redis."""
        try:
            r = self.client
            if r:
                # If key doesn't exist, initialize with DB count first
                if not r.exists(CACHE_KEY_TOTAL_WISHES) and fallback_fn:
                    db_count = fallback_fn()
                    r.set(CACHE_KEY_TOTAL_WISHES, db_count)
                    return db_count
                return int(r.incr(CACHE_KEY_TOTAL_WISHES))
        except Exception as exc:
            logger.warning(f"Redis increment error (falling back to DB): {exc}")

        return fallback_fn() if fallback_fn else 0


redis_service = RedisService()
