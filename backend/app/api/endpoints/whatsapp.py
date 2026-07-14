from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from typing import Any, List, Optional
import html

from app.api import deps
from app.models.user import User
from app.models.workspace import UserRole
from app.models.whatsapp import WhatsAppConnection, Conversation, Message, MessageDirection
from app.schemas.whatsapp import (
    WhatsAppConnectionCreate,
    WhatsAppConnectionResponse,
    WhatsAppStatusResponse,
    ConversationResponse,
    MessageResponse,
    MessageSend,
    MessageLogResponse
)
from app.services import whatsapp as ws_service
from app.ws.broadcaster import broadcaster

router = APIRouter()

@router.post("/connect", response_model=WhatsAppConnectionResponse)
def connect_whatsapp(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    connection_in: WhatsAppConnectionCreate,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Establish or update a Meta WhatsApp Business account integration for the workspace.
    Enforces OWNER and ADMIN RBAC roles.
    """
    # 1. Enforce RBAC (Owner/Admin roles)
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    # 2. Escape user inputs to protect against injection/XSS
    safe_business_account_id = html.escape(connection_in.business_account_id.strip())
    safe_phone_number_id = html.escape(connection_in.phone_number_id.strip())
    safe_phone_number = html.escape(connection_in.phone_number.strip())
    safe_verify_token = html.escape(connection_in.verify_token.strip())
    safe_app_secret = html.escape(connection_in.app_secret.strip())

    # 3. Check if connection already exists, if so update/overwrite
    connection = db.query(WhatsAppConnection).filter(
        WhatsAppConnection.workspace_id == workspace_id
    ).first()

    if connection:
        connection.business_account_id = safe_business_account_id
        connection.phone_number_id = safe_phone_number_id
        connection.phone_number = safe_phone_number
        connection.access_token = connection_in.access_token # keep raw token
        connection.verify_token = safe_verify_token
        connection.app_secret = safe_app_secret
        connection.webhook_verified = True # verification flag
    else:
        connection = WhatsAppConnection(
            workspace_id=workspace_id,
            business_account_id=safe_business_account_id,
            phone_number_id=safe_phone_number_id,
            phone_number=safe_phone_number,
            access_token=connection_in.access_token,
            verify_token=safe_verify_token,
            app_secret=safe_app_secret,
            webhook_verified=True
        )
        db.add(connection)

    db.commit()
    db.refresh(connection)
    
    print(f"[Activity Log]: Connected WhatsApp connection for workspace {workspace_id}")
    return connection

@router.get("/status", response_model=WhatsAppStatusResponse)
def get_whatsapp_status(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve live connection status.
    Enforces workspace membership check for all roles (OWNER, ADMIN, MEMBER, VIEWER).
    """
    membership = db.query(deps.WorkspaceMember).filter(
        deps.WorkspaceMember.workspace_id == workspace_id,
        deps.WorkspaceMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workspace"
        )

    connection = db.query(WhatsAppConnection).filter(
        WhatsAppConnection.workspace_id == workspace_id
    ).first()
    
    if not connection:
        return {
            "connected": False,
            "phone_number": None,
            "business_account": None,
            "verified": False,
            "last_sync": None
        }
        
    return {
        "connected": True,
        "phone_number": connection.phone_number,
        "business_account": connection.business_account_id,
        "verified": connection.webhook_verified,
        "last_sync": connection.updated_at
    }

@router.delete("/disconnect")
def disconnect_whatsapp(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Remove WhatsApp connection integration credentials.
    Enforces OWNER and ADMIN RBAC roles.
    """
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    connection = db.query(WhatsAppConnection).filter(
        WhatsAppConnection.workspace_id == workspace_id
    ).first()

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="WhatsApp is not connected to this workspace"
        )

    db.delete(connection)
    db.commit()
    
    print(f"[Activity Log]: Disconnected WhatsApp connection for workspace {workspace_id}")
    return {"message": "WhatsApp connection has been disconnected successfully"}

@router.get("/messages", response_model=List[MessageLogResponse])
def list_workspace_messages(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    limit: int = Query(50, le=100),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List all messages in a workspace with sender/recipient details for activity log views.
    Enforces workspace membership.
    """
    membership = db.query(deps.WorkspaceMember).filter(
        deps.WorkspaceMember.workspace_id == workspace_id,
        deps.WorkspaceMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workspace"
        )

    conn = db.query(WhatsAppConnection).filter(WhatsAppConnection.workspace_id == workspace_id).first()
    workspace_phone = conn.phone_number if conn else "WhatsApp Business"

    messages = db.query(Message).join(Conversation).filter(
        Conversation.workspace_id == workspace_id
    ).order_by(Message.timestamp.desc()).limit(limit).all()

    logs = []
    for msg in messages:
        # Fetch conversation customer details
        conv = msg.conversation
        if msg.direction == MessageDirection.INBOUND:
            sender = conv.customer_phone
            recipient = workspace_phone
        else:
            sender = workspace_phone
            recipient = conv.customer_phone

        logs.append({
            "id": msg.id,
            "direction": msg.direction.value.upper(),
            "senderPhone": sender,
            "recipientPhone": recipient,
            "messageText": msg.text,
            "status": msg.status.upper(),
            "createdAt": msg.timestamp
        })
    return logs

@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    search: Optional[str] = Query(None, description="Search by customer name or phone number"),
    unread_only: bool = Query(False, description="Filter for conversations with unread messages"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    List conversations matching filters.
    Enforces workspace membership.
    """
    membership = db.query(deps.WorkspaceMember).filter(
        deps.WorkspaceMember.workspace_id == workspace_id,
        deps.WorkspaceMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workspace"
        )

    query = db.query(Conversation).filter(Conversation.workspace_id == workspace_id)
    
    if search:
        search_escaped = html.escape(search.strip())
        query = query.filter(
            (Conversation.customer_name.ilike(f"%{search_escaped}%")) |
            (Conversation.customer_phone.contains(search_escaped))
        )
        
    if unread_only:
        query = query.filter(Conversation.unread_count > 0)
        
    conversations = query.order_by(Conversation.last_message_time.desc()).offset(offset).limit(limit).all()
    return conversations

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve message history for a conversation thread.
    Marks conversation unread count as 0 upon access.
    Enforces workspace membership.
    """
    membership = db.query(deps.WorkspaceMember).filter(
        deps.WorkspaceMember.workspace_id == workspace_id,
        deps.WorkspaceMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workspace"
        )

    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.workspace_id == workspace_id
    ).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # 1. Reset unread count to 0 when thread is opened
    if conv.unread_count > 0:
        conv.unread_count = 0
        db.add(conv)
        db.commit()

    # 2. Retrieve messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.timestamp.asc()).all()
    
    return messages

@router.post("/conversations/{conversation_id}/send", response_model=MessageResponse)
async def reply_message(
    conversation_id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    workspace_id: uuid.UUID = Query(...),
    reply_in: MessageSend,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Send an outbound message through Meta Cloud API and log it.
    Enforces OWNER, ADMIN, and MEMBER roles.
    """
    # Enforce RBAC rules (Viewer is read-only)
    checker = deps.RoleChecker(allowed_roles=[UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER])
    checker(workspace_id=str(workspace_id), db=db, current_user=current_user)

    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.workspace_id == workspace_id
    ).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Clean text to prevent cross-site scripting
    safe_text = html.escape(reply_in.text.strip())

    msg = ws_service.send_text_message(db, workspace_id, conv.customer_phone, safe_text)
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to dispatch message to Meta Cloud API"
        )

    # Broadcast outgoing message via WebSocket (fire-and-forget)
    try:
        updated_conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if updated_conv:
            import asyncio
            asyncio.create_task(
                broadcaster.broadcast_outgoing_message(
                    workspace_id=workspace_id,
                    conversation=updated_conv,
                    message=msg,
                )
            )
    except Exception as broadcast_err:
        import logging
        logging.getLogger(__name__).warning(f"WebSocket broadcast failed (non-critical): {broadcast_err}")

    return msg
