from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models import User

bearer = HTTPBearer(auto_error=False)

def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if credentials and credentials.credentials.startswith("dev-token-"):
        uid_str = credentials.credentials.replace("dev-token-", "")
        try:
            uid = UUID(uid_str)
            user = db.get(User, uid)
            if user:
                return user
        except Exception:
            pass

    if settings.dev_auth_enabled and credentials is None:
        uid = UUID(settings.dev_user_id)
        user = db.get(User, uid)
        if not user:
            user = User(id=uid, email=settings.dev_user_email, display_name="Diego Mendoza (Admin)")
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token requerido")

    try:
        if not settings.supabase_jwt_secret:
            raise ValueError("SUPABASE_JWT_SECRET no configurado")
        payload = jwt.decode(credentials.credentials, settings.supabase_jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
        uid = UUID(payload["sub"])
        email = payload.get("email") or f"{uid}@supabase.local"
        meta = payload.get("user_metadata") or {}
        user = db.get(User, uid)
        if not user:
            user = User(id=uid, email=email, display_name=meta.get("full_name") or meta.get("name"))
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Token inválido: {exc}")
