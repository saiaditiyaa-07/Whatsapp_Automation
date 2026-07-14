import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.models.workspace import UserRole
from app.schemas.user import UserResponse

class WorkspaceBase(BaseModel):
    name: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceResponse(WorkspaceBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

class WorkspaceMemberResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    role: UserRole
    user: UserResponse

    class Config:
        from_attributes = True

class MemberInvite(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.MEMBER

class MemberUpdateRole(BaseModel):
    role: UserRole
