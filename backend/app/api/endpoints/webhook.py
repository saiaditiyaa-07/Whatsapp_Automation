from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session
import json
import logging
import asyncio

from app.api import deps
from app.services import whatsapp as ws_service
from app.models.whatsapp import WhatsAppConnection
from app.ws.broadcaster import broadcaster

logger = logging.getLogger(__name__)

router = APIRouter()

# Default fallbacks if no connection configuration exists yet in db
DEFAULT_VERIFY_TOKEN = "acme_production_secure_handshake_token"
DEFAULT_APP_SECRET = "super_secure_random_hex_key_default_development_value_12345"

@router.get("")
def verify_webhook(
    db: Session = Depends(deps.get_db),
    mode: str = Query(None, alias="hub.mode"),
    verify_token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge")
):
    """
    Handle the GET request verification handshake from Meta Graph API.
    Validates token and returns challenge string.
    """
    if mode == "subscribe" and verify_token:
        # 1. Search connections for matching verification token
        connection = db.query(WhatsAppConnection).filter(
            WhatsAppConnection.verify_token == verify_token
        ).first()

        # 2. Accept matching token or default fallback verify token
        if connection or verify_token == DEFAULT_VERIFY_TOKEN:
            logger.info("Meta Webhook verification succeeded.")
            # Challenge must be returned exactly as received
            return int(challenge) if challenge.isdigit() else challenge
            
    logger.warning("Meta Webhook verification handshake failed: Verify token mismatch.")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch"
    )

@router.post("")
async def receive_webhook(
    request: Request,
    db: Session = Depends(deps.get_db)
):
    """
    Receive WhatsApp webhook updates.
    Validates X-Hub-Signature-256 using dynamic workspace app secrets.
    """
    # 1. Read raw body bytes
    body_bytes = await request.body()
    signature_header = request.headers.get("x-hub-signature-256")
    
    # 2. Extract phone_number_id safely from raw body
    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        logger.error("[Activity Log]: Webhook Failure. Invalid JSON format.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON data"
        )

    # Walk path entry[0].changes[0].value.metadata.phone_number_id
    phone_number_id = None
    try:
        entries = payload.get("entry", [])
        if entries:
            changes = entries[0].get("changes", [])
            if changes:
                value = changes[0].get("value", {})
                phone_number_id = value.get("metadata", {}).get("phone_number_id")
    except Exception:
        pass

    # 3. Dynamic lookup of app secret based on phone_number_id
    app_secret = DEFAULT_APP_SECRET
    if phone_number_id:
        connection = db.query(WhatsAppConnection).filter(
            WhatsAppConnection.phone_number_id == phone_number_id
        ).first()
        if connection:
            app_secret = connection.app_secret

    # 4. Signature verification check
    is_valid = ws_service.verify_signature(body_bytes, signature_header, app_secret)
    if not is_valid:
        logger.warning(f"[Activity Log]: Signature Verification Failed. Header: {signature_header}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature validation failed"
        )

    # 5. Parse webhook payload for different message types
    parsed_data = ws_service.parse_webhook(payload)
    if not parsed_data:
        # Return 200 OK so Meta doesn't retry status/other unhandled payload types
        return {"status": "ignored"}
        
    if parsed_data.get("is_status_update"):
        msg = ws_service.save_incoming_message(db, parsed_data)
        if msg:
            connection = db.query(WhatsAppConnection).filter(
                WhatsAppConnection.phone_number_id == parsed_data.get("phone_number_id")
            ).first()
            if connection:
                await broadcaster.broadcast_message_status(
                    workspace_id=connection.workspace_id,
                    conversation_id=msg.conversation_id,
                    message_id=msg.id,
                    status=parsed_data["status"]
                )
        return {"status": "success"}

    # 6. Save message and update conversation in one database transaction
    msg = ws_service.save_incoming_message(db, parsed_data)
    if not msg:
        logger.error("[Activity Log]: Webhook Failure. Failed to persist message payload.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist incoming payload data"
        )

    logger.info(f"[Activity Log]: Incoming Message from {parsed_data['customer_phone']} logged successfully.")

    # Broadcast WebSocket event to all subscribed dashboard clients
    try:
        connection = db.query(WhatsAppConnection).filter(
            WhatsAppConnection.phone_number_id == parsed_data.get("phone_number_id")
        ).first()
        if connection:
            # Evaluate workflows for this message before finalizing
            from app.services.automation import automation_engine
            await asyncio.to_thread(automation_engine.evaluate_message_trigger, db, msg, connection.workspace_id)

            from app.models.whatsapp import Conversation
            # Refresh conversation state after potential workflow mutations (e.g. tag additions)
            conversation = db.query(Conversation).filter(
                Conversation.id == msg.conversation_id
            ).first()
            if conversation:
                import asyncio
                asyncio.create_task(
                    broadcaster.broadcast_incoming_message(
                        workspace_id=connection.workspace_id,
                        conversation=conversation,
                        message=msg,
                    )
                )
    except Exception as broadcast_err:
        logger.warning(f"WebSocket broadcast or automation trigger failed: {broadcast_err}")

    return {"status": "success"}
