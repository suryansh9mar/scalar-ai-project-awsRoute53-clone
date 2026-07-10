"""Authentication endpoints (mocked)."""
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session as DbSession

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: DbSession = Depends(get_db)):
    """Authenticate a user and return a bearer token.

    Mocked behaviour: an existing seeded user is matched by email + password.
    Any other email that does not yet exist is auto-provisioned (still requiring
    a non-empty password), keeping the demo friction-free.
    """
    email = payload.email.lower()
    user = db.query(models.User).filter(models.User.email == email).first()

    if user is None:
        # Auto-provision a mocked account for unknown emails.
        from ..ids import new_user_id

        user = models.User(
            id=new_user_id(),
            email=email,
            name=email.split("@")[0].title(),
            password=payload.password,
            account_id="123456789012",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.password != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = auth.create_session(db, user)
    return schemas.LoginResponse(token=token, user=schemas.UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    authorization: str | None = Header(default=None),
    db: DbSession = Depends(get_db),
):
    """Invalidate the current session token."""
    if authorization and authorization.lower().startswith("bearer "):
        auth.delete_session(db, authorization.split(" ", 1)[1].strip())
    return None


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    """Return the currently authenticated user (used to restore sessions)."""
    return current_user
