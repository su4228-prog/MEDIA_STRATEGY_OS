"""기존 ai_router.router import를 유지하는 호환 진입점."""

from app.routers.ai import router

__all__ = ["router"]
