from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid

from app.api import deps
from app.models.user import User
from app.models.workspace import WorkspaceMember, UserRole
from app.models.workflow import (
    Workflow,
    WorkflowTrigger,
    WorkflowCondition,
    WorkflowAction,
    WorkflowExecutionLog,
    WorkflowNode,
    WorkflowEdge,
    WorkflowVersion,
    TriggerType
)
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowExecutionLogResponse,
    CanvasSave
)

router = APIRouter()

def _check_membership(workspace_id: uuid.UUID, user_id: uuid.UUID, db: Session) -> WorkspaceMember:
    membership = db.query(WorkspaceMember).filter(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workspace"
        )
    return membership

@router.post("/", response_model=WorkflowResponse)
def create_workflow(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    workflow_in: WorkflowCreate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Create a new automation workflow.
    Enforces Admin or Owner role permissions.
    """
    # Enforce RBAC (Owner/Admin roles)
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    try:
        # 1. Create Workflow
        db_workflow = Workflow(
            workspace_id=workspace_id,
            name=workflow_in.name,
            description=workflow_in.description,
            is_active=workflow_in.is_active
        )
        db.add(db_workflow)
        db.flush()  # Populate workflow ID

        # 2. Add Triggers
        for trig in workflow_in.triggers:
            db_trig = WorkflowTrigger(
                workflow_id=db_workflow.id,
                trigger_type=trig.trigger_type,
                config=trig.config
            )
            db.add(db_trig)

        # 3. Add Conditions
        for cond in workflow_in.conditions:
            db_cond = WorkflowCondition(
                workflow_id=db_workflow.id,
                condition_type=cond.condition_type,
                config=cond.config
            )
            db.add(db_cond)

        # 4. Add Actions
        for act in workflow_in.actions:
            db_act = WorkflowAction(
                workflow_id=db_workflow.id,
                action_type=act.action_type,
                config=act.config,
                sequence=act.sequence
            )
            db.add(db_act)

        db.commit()
        db.refresh(db_workflow)
        return db_workflow
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create workflow: {str(e)}"
        )

@router.get("/", response_model=List[WorkflowResponse])
def list_workflows(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List all workflows configured for the workspace.
    Enforces workspace membership.
    """
    _check_membership(workspace_id, current_user.id, db)
    return db.query(Workflow).filter(Workflow.workspace_id == workspace_id).all()

@router.get("/{id}", response_model=WorkflowResponse)
def get_workflow(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Get workflow details by ID.
    Enforces workspace membership.
    """
    _check_membership(workspace_id, current_user.id, db)
    workflow = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    return workflow

@router.put("/{id}", response_model=WorkflowResponse)
def update_workflow(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    workflow_in: WorkflowUpdate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Update workflow configuration.
    Enforces Admin or Owner workspace roles.
    """
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    workflow = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    try:
        # Update metadata fields if provided
        if workflow_in.name is not None:
            workflow.name = workflow_in.name
        if workflow_in.description is not None:
            workflow.description = workflow_in.description
        if workflow_in.is_active is not None:
            workflow.is_active = workflow_in.is_active

        # Replace Triggers if provided
        if workflow_in.triggers is not None:
            db.query(WorkflowTrigger).filter(WorkflowTrigger.workflow_id == id).delete()
            for trig in workflow_in.triggers:
                db_trig = WorkflowTrigger(
                    workflow_id=id,
                    trigger_type=trig.trigger_type,
                    config=trig.config
                )
                db.add(db_trig)

        # Replace Conditions if provided
        if workflow_in.conditions is not None:
            db.query(WorkflowCondition).filter(WorkflowCondition.workflow_id == id).delete()
            for cond in workflow_in.conditions:
                db_cond = WorkflowCondition(
                    workflow_id=id,
                    condition_type=cond.condition_type,
                    config=cond.config
                )
                db.add(db_cond)

        # Replace Actions if provided
        if workflow_in.actions is not None:
            db.query(WorkflowAction).filter(WorkflowAction.workflow_id == id).delete()
            for act in workflow_in.actions:
                db_act = WorkflowAction(
                    workflow_id=id,
                    action_type=act.action_type,
                    config=act.config,
                    sequence=act.sequence
                )
                db.add(db_act)

        db.commit()
        db.refresh(workflow)
        return workflow
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update workflow: {str(e)}"
        )

@router.delete("/{id}")
def delete_workflow(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Delete a workflow configuration.
    Enforces Admin or Owner roles.
    """
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    workflow = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    db.delete(workflow)
    db.commit()
    return {"message": "Workflow deleted successfully"}

@router.post("/{id}/toggle", response_model=WorkflowResponse)
def toggle_workflow(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Toggle workflow active state.
    Enforces Admin or Owner roles.
    """
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    workflow = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

    workflow.is_active = not workflow.is_active
    db.commit()
    db.refresh(workflow)

    # Broadcast toggle active status change to update UI clients dynamically
    try:
        from app.services.websocket import broadcaster
        import asyncio
        asyncio.create_task(
            broadcaster.broadcast_json({
                "event": "workflow_enabled" if workflow.is_active else "workflow_disabled",
                "workspace_id": str(workspace_id),
                "workflow_id": str(id),
                "name": workflow.name
            })
        )
    except Exception as ws_err:
        logger.warning(f"Failed WS broadcast: {ws_err}")

    return workflow

@router.get("/history/logs", response_model=List[WorkflowExecutionLogResponse])
def get_execution_history(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    workflow_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List workflow execution history logs for auditing.
    Enforces workspace membership.
    """
    _check_membership(workspace_id, current_user.id, db)
    query = db.query(WorkflowExecutionLog).filter(
        WorkflowExecutionLog.workspace_id == workspace_id
    )
    if workflow_id:
        query = query.filter(WorkflowExecutionLog.workflow_id == workflow_id)
    
    return query.order_by(WorkflowExecutionLog.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/{id}/canvas")
def get_workflow_canvas(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Load the React Flow visual canvas JSON for a workflow.
    Enforces workspace membership.
    """
    _check_membership(workspace_id, current_user.id, db)
    workflow = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflow.canvas or {"nodes": [], "edges": []}

@router.post("/{id}/canvas")
def save_workflow_canvas(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    canvas: CanvasSave,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Validate and save the React Flow visual canvas JSON.
    Enforces Owner/Admin RBAC and checks graph structural integrity.
    """
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    workflow = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    canvas_dict = canvas.dict()

    # Verify structural integrity (exactly one trigger, cycles, reachability)
    from app.services.workflow_interpreter import WorkflowValidator
    errors = WorkflowValidator.validate_canvas(canvas_dict)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Workflow validation failed", "errors": errors}
        )

    try:
        # 1. Update workflow canvas JSON
        workflow.canvas = canvas_dict

        # 2. Sync Workflow Nodes relationally
        db.query(WorkflowNode).filter(WorkflowNode.workflow_id == id).delete()
        for node in canvas_dict.get("nodes", []):
            db_node = WorkflowNode(
                workflow_id=id,
                node_id=node.get("id"),
                type=node.get("type"),
                config=node.get("data", {}).get("config", {}),
                position_x=float(node.get("position", {}).get("x", 0)),
                position_y=float(node.get("position", {}).get("y", 0))
            )
            db.add(db_node)

        # 3. Sync Workflow Edges relationally
        db.query(WorkflowEdge).filter(WorkflowEdge.workflow_id == id).delete()
        for edge in canvas_dict.get("edges", []):
            db_edge = WorkflowEdge(
                workflow_id=id,
                edge_id=edge.get("id"),
                source=edge.get("source"),
                target=edge.get("target")
            )
            db.add(db_edge)

        # 4. Insert new version entry
        current_version_count = db.query(WorkflowVersion).filter(WorkflowVersion.workflow_id == id).count()
        db_version = WorkflowVersion(
            workflow_id=id,
            version=current_version_count + 1,
            canvas=canvas_dict
        )
        db.add(db_version)

        db.commit()
        db.refresh(workflow)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database save error: {str(e)}")

    # Broadcast websocket notification to update connected dashboards
    try:
        from app.services.websocket import broadcaster
        import asyncio
        asyncio.create_task(
            broadcaster.broadcast_json({
                "event": "workflow_updated",
                "workspace_id": str(workspace_id),
                "workflow_id": str(id),
                "name": workflow.name
            })
        )
    except Exception as ws_err:
        logger.warning(f"Failed WS broadcast: {ws_err}")

    return {"message": "Canvas saved and validated successfully", "canvas": workflow.canvas}

@router.post("/{id}/validate")
def validate_workflow_canvas(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Expose validation checks results for canvas.
    Enforces workspace membership.
    """
    _check_membership(workspace_id, current_user.id, db)
    workflow = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    from app.services.workflow_interpreter import WorkflowValidator
    errors = WorkflowValidator.validate_canvas(workflow.canvas or {})
    return {"valid": len(errors) == 0, "errors": errors}

@router.post("/{id}/duplicate", response_model=WorkflowResponse)
def duplicate_workflow(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Duplicate workflow metadata and canvas content.
    Enforces Admin/Owner workspace roles.
    """
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    original = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not original:
        raise HTTPException(status_code=404, detail="Workflow not found")

    try:
        duplicated = Workflow(
            workspace_id=workspace_id,
            name=f"Copy of {original.name}",
            description=original.description,
            is_active=False,
            canvas=original.canvas
        )
        db.add(duplicated)
        db.commit()
        db.refresh(duplicated)
        return duplicated
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Duplication failed: {str(e)}")

@router.post("/{id}/preview")
def preview_workflow_execution(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    message_text: str = Query("hello"),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Simulate workflow execution logs trace based on mockup input.
    Does not run actual side-effects (e.g. Meta messages sending are skipped).
    """
    _check_membership(workspace_id, current_user.id, db)
    workflow = db.query(Workflow).filter(
        Workflow.id == id,
        Workflow.workspace_id == workspace_id
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if not workflow.canvas or "nodes" not in workflow.canvas:
        return {"success": False, "detail": "Workflow contains no layout nodes to preview."}

    from app.services.workflow_interpreter import WorkflowValidator, WorkflowInterpreter
    errors = WorkflowValidator.validate_canvas(workflow.canvas)
    if errors:
        return {"success": False, "detail": "Workflow contains validation errors.", "errors": errors}

    triggers, conditions, actions = WorkflowInterpreter.compile_canvas_to_elements(workflow.canvas)

    # Simulated trace log
    trace = {"trigger_match": False, "conditions_pass": True, "actions_simulated": []}
    
    # Check trigger
    for t in triggers:
        if t.trigger_type == TriggerType.INCOMING_MESSAGE:
            trace["trigger_match"] = True
        elif t.trigger_type == TriggerType.KEYWORD_MATCH:
            kws = t.config.get("keywords", [])
            trace["trigger_match"] = any(k.strip().lower() in message_text.lower() for k in kws)

    if trace["trigger_match"]:
        # Simulate actions sequence
        for act in actions:
            trace["actions_simulated"].append({
                "action_type": act.action_type.value,
                "sequence": act.sequence,
                "config": act.config,
                "status": "simulated_success"
            })

    return {"success": True, "trace": trace}
