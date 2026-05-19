"""
Security middleware for the application.
- Rate limiting on authentication endpoints
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- Request size limiting
"""

import time
import hashlib
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


# ─── Rate Limiter State ───────────────────────────────────────────────────────
_login_attempts: dict[str, list[float]] = defaultdict(list)

# Configuration
RATE_LIMIT_WINDOW = 300       # 5-minute window
MAX_LOGIN_ATTEMPTS = 10       # max attempts per window
LOCKOUT_DURATION = 600        # 10-minute lockout after exceeded
MAX_REQUEST_BODY_SIZE = 10 * 1024 * 1024  # 10 MB max body


def _get_client_fingerprint(request: Request) -> str:
    """Generate a fingerprint from IP + User-Agent for rate limiting."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    raw = f"{client_ip}:{user_agent}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _cleanup_old_attempts(fingerprint: str, now: float):
    """Remove expired entries from the rate limiter."""
    _login_attempts[fingerprint] = [
        t for t in _login_attempts[fingerprint]
        if now - t < RATE_LIMIT_WINDOW + LOCKOUT_DURATION
    ]


# ─── Rate Limiting Paths ─────────────────────────────────────────────────────
RATE_LIMITED_PATHS = {"/auth/login", "/auth/login/", "/auth/register", "/auth/register/"}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to every response:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: restrictive defaults
    - Cache-Control: no-store for API responses
    """

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )

        # Prevent caching of API responses
        if request.url.path.startswith("/auth") or request.url.path.startswith("/admin"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"

        # Remove server identification header
        if "server" in response.headers:
            del response.headers["server"]

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate-limits authentication endpoints to prevent brute-force attacks.
    Tracks attempts per client fingerprint (IP + User-Agent).
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method.upper()

        # Only rate-limit POST requests to auth endpoints
        if method == "POST" and path in RATE_LIMITED_PATHS:
            fingerprint = _get_client_fingerprint(request)
            now = time.time()
            _cleanup_old_attempts(fingerprint, now)

            attempts = _login_attempts[fingerprint]

            # Check if client is in lockout
            if len(attempts) >= MAX_LOGIN_ATTEMPTS:
                last_attempt = attempts[-1]
                lockout_remaining = LOCKOUT_DURATION - (now - last_attempt)
                if lockout_remaining > 0:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": f"Too many attempts. Please try again in {int(lockout_remaining)} seconds.",
                            "retry_after": int(lockout_remaining),
                        },
                        headers={"Retry-After": str(int(lockout_remaining))},
                    )
                else:
                    # Lockout expired, reset
                    _login_attempts[fingerprint] = []

            # Record this attempt
            _login_attempts[fingerprint].append(now)

        # Request body size check for all POST/PUT/PATCH
        if method in ("POST", "PUT", "PATCH"):
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > MAX_REQUEST_BODY_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={"detail": "Request body too large"},
                )

        return await call_next(request)
