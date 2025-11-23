"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, users, meetings, rooms, admin

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Multilingual Meeting Platform API",
    description="API for managing multilingual meetings with AI avatars",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(meetings.router, prefix="/api/v1/meetings", tags=["meetings"])
app.include_router(rooms.router, prefix="/api/v1/rooms", tags=["rooms"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/")
async def root():
    return {"message": "Multilingual Meeting Platform API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

