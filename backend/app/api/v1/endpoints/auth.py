from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import UserLogin, Token, UserCreate, UserResponse

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


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado a partir do token Bearer"""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        tenant_id=current_user.tenant_id,
        tenant_name=current_user.tenant.name if current_user.tenant else None,
        is_active=current_user.is_active
    )


@router.get("/users", response_model=List[UserResponse])
def list_tenant_users(
    tenant_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista os usuários da operação do armazém logístico"""
    target_tenant_id = tenant_id or current_user.tenant_id
    if current_user.role != "super_admin":
        if not target_tenant_id or target_tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito ao próprio armazém.")

    query = db.query(User)
    if target_tenant_id:
        query = query.filter(User.tenant_id == target_tenant_id)
    
    users = query.order_by(User.name.asc()).all()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            tenant_id=u.tenant_id,
            tenant_name=u.tenant.name if u.tenant else None,
            is_active=u.is_active
        )
        for u in users
    ]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_tenant_user(
    user_in: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cria um operador, porteiro ou gerente vinculado a um armazém"""
    target_tenant_id = user_in.tenant_id or current_user.tenant_id
    if current_user.role != "super_admin":
        if not target_tenant_id or target_tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão negada.")

    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado.")

    user = User(
        tenant_id=target_tenant_id,
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        tenant_id=user.tenant_id,
        tenant_name=user.tenant.name if user.tenant else None,
        is_active=user.is_active
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exclui um colaborador da equipe do armazém"""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    
    if current_user.role != "super_admin":
        if target.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão negada.")
    
    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode excluir o seu próprio usuário.")
        
    db.delete(target)
    db.commit()
    return None


class PasswordResetRequest(BaseModel):
    new_password: str


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: UUID,
    reset_data: PasswordResetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permite ao Super Admin ou Gerente resetar a senha de qualquer usuário"""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    
    if current_user.role != "super_admin":
        if target.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão negada.")
    
    if len(reset_data.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A senha deve conter no mínimo 6 caracteres.")

    target.hashed_password = get_password_hash(reset_data.new_password)
    db.commit()
    return {"success": True, "message": f"Senha do usuário {target.email} redefinida com sucesso."}


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

