import os
import logging
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Security, APIRouter
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from pydantic import BaseModel
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

from database import init_db, get_db, Showtime, Favorite, AppSettings
from scraper import scrape_all

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Scheduler ─────────────────────────────────────────────────────────────────
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    scheduler.add_job(scrape_all, "cron", hour=7, minute=0)
    scheduler.start()
    logger.info("Scheduler started. Scraping job set for 7:00 AM daily.")
    yield
    scheduler.shutdown()


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="WhatToCinema API",
    description="API for movie showtimes. Requires 'X-API-Key' header.",
    version="1.0.0",
    swagger_ui_parameters={"defaultModelsExpandDepth": -1},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Key Security ──────────────────────────────────────────────────────────
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)


def get_api_key(api_key: str = Security(api_key_header)):
    env_api_key = os.getenv("API_KEY")
    if not env_api_key:
        logger.error("API_KEY environment variable not set!")
        raise HTTPException(status_code=500, detail="Server configuration error")
    if api_key != env_api_key:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return api_key


# ── Router (all endpoints share the API key dependency) ───────────────────────
router = APIRouter(dependencies=[Depends(get_api_key)])


# ── Pydantic Models ───────────────────────────────────────────────────────────
class ShowtimeSchema(BaseModel):
    id: int
    cinema_name: str
    movie_title: str
    start_time: datetime
    date_str: str
    ticket_url: Optional[str]
    movie_url: Optional[str]
    poster_url: Optional[str]
    genre: Optional[str]
    age_restriction: Optional[str]
    details_type: Optional[str]
    age_restriction_url: Optional[str]

    class Config:
        from_attributes = True


class FavoriteSchema(BaseModel):
    movie_title: str
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteCreate(BaseModel):
    movie_title: str


class StatusSchema(BaseModel):
    last_scrape_time: Optional[datetime]


# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("/api/movies", response_model=List[ShowtimeSchema])
def get_movies(db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    return (
        db.query(Showtime)
        .filter(Showtime.date_str >= today)
        .order_by(Showtime.start_time)
        .all()
    )


@router.post("/api/scrape")
def trigger_scrape(background_tasks: BackgroundTasks):
    background_tasks.add_task(scrape_all)
    return {"message": "Scraping triggered in background"}


@router.get("/api/status", response_model=StatusSchema)
def get_status(db: Session = Depends(get_db)):
    last_scrape = db.query(AppSettings).filter(AppSettings.key == "last_scrape_time").first()
    return {
        "last_scrape_time": datetime.fromisoformat(last_scrape.value) if last_scrape else None
    }


@router.get("/api/favorites", response_model=List[FavoriteSchema])
def get_favorites(db: Session = Depends(get_db)):
    return db.query(Favorite).all()


@router.post("/api/favorites")
def add_favorite(fav: FavoriteCreate, db: Session = Depends(get_db)):
    existing = db.query(Favorite).filter(Favorite.movie_title == fav.movie_title).first()
    if existing:
        return existing
    new_fav = Favorite(movie_title=fav.movie_title)
    db.add(new_fav)
    db.commit()
    db.refresh(new_fav)
    return new_fav


@router.delete("/api/favorites/{movie_title}")
def remove_favorite(movie_title: str, db: Session = Depends(get_db)):
    db.query(Favorite).filter(Favorite.movie_title == movie_title).delete()
    db.commit()
    return {"message": "Favorite removed"}


app.include_router(router)


# ── Development Server ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
