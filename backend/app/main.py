from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.models import models  # noqa
from app.api.v1.projects import router as projects_router
from app.api.v1.training import router as training_router, create_router as training_create_router
from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="NeuroLab Enterprise API — FastAPI + Supabase PostgreSQL + TensorFlow/Keras"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.cors_origins.split(",") if x.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(projects_router, prefix=settings.api_prefix)
app.include_router(training_create_router, prefix=settings.api_prefix)
app.include_router(training_router, prefix=settings.api_prefix)
app.include_router(admin_router, prefix=settings.api_prefix)

@app.get("/health")
def health():
    return {"status": "ok", "service": "neurolab-api", "database": "configured"}

@app.get(settings.api_prefix + "/health")
def api_health():
    return {"status": "ok"}

@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        print(f"[WARN] Base.metadata.create_all error (check database connectivity): {exc}")
