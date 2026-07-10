"""Mocked authentication: opaque bearer tokens backed by the sessions table."""
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session as DbSession

from . import models
from .database import get_db
from .ids import new_token


def create_session(db: DbSession, user: models.User) -> str:
    """Issue a new session token for the given user."""
    token = new_token()
    db.add(models.Session(token=token, user_id=user.id))
    db.commit()
    return token


def delete_session(db: DbSession, token: str) -> None:
    db.query(models.Session).filter(models.Session.token == token).delete()
    db.commit()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: DbSession = Depends(get_db),
) -> models.User:
    """Resolve the authenticated user from an `Authorization: Bearer <token>` header."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization or not authorization.lower().startswith("bearer "):
        raise unauthorized

    token = authorization.split(" ", 1)[1].strip()
    session = db.get(models.Session, token)
    if session is None:
        raise unauthorized
    return session.user
