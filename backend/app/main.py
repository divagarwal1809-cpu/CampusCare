from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database

# Import routers
from app.api.incidents import router as incidents_router
from app.api.responders import router as responders_router
from app.api.decisions import router as decisions_router
from app.api.simulation import router as simulation_router
from app.api.analytics import router as analytics_router
from app.api.audit import router as audit_router
from app.api.notifications import router as notifications_router
from app.api.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial EOC crisis scenario
    db = SessionLocal()
    try:
        seed_database(db, force_reset=False)
    finally:
        db.close()

    yield

app = FastAPI(
    title="CampusCare Emergency Operations Platform",
    description="Campus-wide incident-response and decision-support command platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(incidents_router, prefix=settings.API_V1_STR)
app.include_router(responders_router, prefix=settings.API_V1_STR)
app.include_router(decisions_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "CampusCare Emergency Operations Center",
        "status": "OPERATIONAL",
        "api_docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
