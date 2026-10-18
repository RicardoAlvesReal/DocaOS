from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import UserLogin, Token, UserCreate

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais de acesso incorretas."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Contate o administrador."
        )

    tenant_name = user.tenant.name if user.tenant else None

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None
    })

    return Token(
        access_token=token,
        token_type="bearer",
        user_name=user.name,
        user_email=user.email,
        role=user.role,
        tenant_id=user.tenant_id,
        tenant_name=tenant_name
    )


@router.post("/register-admin", response_model=Token)
def register_initial_super_admin(user_in: UserCreate, db: Session = Depends(get_db)):
    """Cria o Super Admin inicial da RAOS caso não exista nenhum cadastrado"""
    existing_admin = db.query(User).filter(User.role == "super_admin").first()
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super Admin já configurado no sistema."
        )

    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role="super_admin",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return Token(
        access_token=token,
        token_type="bearer",
        user_name=user.name,
        user_email=user.email,
        role=user.role
    )
