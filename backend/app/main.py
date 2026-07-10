"""FastAPI application entrypoint for the Route53 clone backend."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import auth, records, zones
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed demo data on startup.
    Base.metadata.create_all(bind=engine)
    if settings.seed_on_startup:
        db = SessionLocal()
        try:
            seed(db)
        finally:
            db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="A mocked clone of the AWS Route53 API.",
    lifespan=lifespan,
)

origins = [
    "http://localhost:3000",
    "https://scalar-ai-project-aws-route53-clone.vercel.app", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins + settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
