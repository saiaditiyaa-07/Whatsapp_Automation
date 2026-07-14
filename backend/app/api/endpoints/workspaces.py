from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, UserRole
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
    MemberInvite,
    MemberUpdateRole,
)

router = APIRouter()

@router.post("/", response_model=WorkspaceResponse)
def create_workspace(
    *,
    db: Session = Depends(deps.get_db),
    workspace_in: WorkspaceCreate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    workspace = Workspace(name=workspace_in.name)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    membership = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role=UserRole.OWNER
    )
    db.add(membership)
    db.commit()

    return workspace

@router.get("/", response_model=List[WorkspaceResponse])
def get_user_workspaces(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).all()
    workspaces = [m.workspace for m in memberships]
    return workspaces

@router.get("/{id}", response_model=WorkspaceResponse)
def get_workspace_by_id(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this workspace"
        )
    return membership.workspace

@router.get("/{id}/members", response_model=List[WorkspaceMemberResponse])
def get_workspace_members(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view members")
    
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == id).all()
    return members

@router.post("/{id}/invites", response_model=WorkspaceMemberResponse)
def invite_user(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    invite_in: MemberInvite,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(id), db=db, current_user=current_user)

    invitee = db.query(User).filter(User.email == invite_in.email).first()
    if not invitee:
        raise HTTPException(
            status_code=404,
            detail="No user found with the registered email. To test invites, register this user first."
        )

    existing_member = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == invitee.id
    ).first()
    if existing_member:
        raise HTTPException(
            status_code=400,
            detail="This user is already a member of this workspace"
        )

    membership = WorkspaceMember(
        workspace_id=id,
        user_id=invitee.id,
        role=invite_in.role
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership

@router.put("/{id}/members/{user_id}", response_model=WorkspaceMemberResponse)
def update_member_role(
    id: uuid.UUID,
    user_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    role_in: MemberUpdateRole,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER])
    checker(workspace_id=str(id), db=db, current_user=current_user)

    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Workspace membership record not found")

    if membership.role == UserRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot modify the role of the workspace OWNER")

    membership.role = role_in.role
    db.commit()
    db.refresh(membership)
    
    return membership

@router.delete("/{id}/members/{user_id}", response_model=WorkspaceMemberResponse)
def remove_member(
    id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(id), db=db, current_user=current_user)

    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == id,
        WorkspaceMember.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Workspace membership record not found")

    if membership.role == UserRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot remove the OWNER from the workspace")

    db.delete(membership)
    db.commit()
    
    return membership
