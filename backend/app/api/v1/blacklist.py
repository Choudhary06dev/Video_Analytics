from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from app.core.database import get_session
from app.models.blacklist import BlacklistPerson
from datetime import datetime

router = APIRouter()

@router.get("")
@router.get("/", response_model=List[BlacklistPerson])
async def get_blacklist(session: Session = Depends(get_session)):
    """
    Get all blacklisted individuals.
    """
    statement = select(BlacklistPerson).order_by(BlacklistPerson.id)
    results = session.exec(statement).all()
    return results

@router.post("")
@router.post("/", response_model=BlacklistPerson)
async def create_blacklist_entry(entry: BlacklistPerson, session: Session = Depends(get_session)):
    """
    Register a new blacklisted person.
    """
    # Ensure ID is not set manually
    entry.id = None
    entry.created_at = datetime.now()
    entry.updated_at = datetime.now()
    
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry

@router.put("/{entry_id}")
@router.put("/{entry_id}/", response_model=BlacklistPerson)
async def update_blacklist_entry(entry_id: int, updated_entry: BlacklistPerson, session: Session = Depends(get_session)):
    """
    Update a blacklisted person's profile.
    """
    db_entry = session.get(BlacklistPerson, entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    entry_data = updated_entry.dict(exclude_unset=True)
    for key, value in entry_data.items():
        if key != "id":
            setattr(db_entry, key, value)
    
    db_entry.updated_at = datetime.now()
    session.add(db_entry)
    session.commit()
    session.refresh(db_entry)
    return db_entry

@router.delete("/{entry_id}")
@router.delete("/{entry_id}/")
async def delete_blacklist_entry(entry_id: int, session: Session = Depends(get_session)):
    """
    Remove a person from the blacklist.
    """
    db_entry = session.get(BlacklistPerson, entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    session.delete(db_entry)
    session.commit()
    return {"message": "Entry deleted successfully"}
