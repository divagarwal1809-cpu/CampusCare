from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.seed_data import seed_database

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/reset-demo")
def reset_demo_scenario(db: Session = Depends(get_db)):
    """
    Resets the database back to the exact 10:32 PM scenario:
    Incident #101, #102, #103, #104 assigned, and Incident #105 arriving
    with zero available medical teams, triggering the reallocation dilemma!
    """
    seed_database(db, force_reset=True)
    return {
        "success": True,
        "message": "CampusCare Emergency Operations Center reset to 10:32 PM Multi-Incident Crisis scenario."
    }
