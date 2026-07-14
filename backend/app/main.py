from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import auth, workspaces, whatsapp, webhook, workflows, analytics
from app.ws import router as ws_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS origins configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust to match frontends ports in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(workspaces.router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["workspaces"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["whatsapp"])
app.include_router(webhook.router, prefix="/webhook/meta", tags=["webhook"])
app.include_router(workflows.router, prefix=f"{settings.API_V1_STR}/workflows", tags=["workflows"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(ws_router.router, prefix="/ws", tags=["websocket"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

@app.on_event("startup")
def on_startup():
    from app.db.base import Base
    from app.db.session import engine
    from app.services.automation import automation_engine
    Base.metadata.create_all(bind=engine)
    automation_engine.start_scheduler()

@app.on_event("shutdown")
def on_shutdown():
    from app.services.automation import automation_engine
    automation_engine.stop_scheduler()
