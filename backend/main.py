"""MEDIA STRATEGY OS FastAPI 서버의 기존 실행 진입점."""

from fastapi import FastAPI
from ai_router import router as ai_router
from app.routers.programs import router as programs_router

app = FastAPI(title="MEDIA STRATEGY OS", version="0.2.0")
app.include_router(ai_router)
app.include_router(programs_router)
