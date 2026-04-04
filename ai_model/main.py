"""Render-friendly ASGI entrypoint.

Keeps startup lightweight and exposes a stable app import path.
"""

from api import app
