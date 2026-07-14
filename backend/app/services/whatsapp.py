import hmac
import hashlib
import requests
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import uuid
from fastapi import HTTPException

from app.models.whatsapp import WhatsAppConnection, Conversation, Message, MessageDirection

logger = logging.getLogger(__name__)

def verify_signature(payload: bytes, signature_header: str, app_secret: str) -> bool:
    """
    Verify the signature sent by Meta webhook using HMAC SHA256.
    """
    if not signature_header or not signature_header.startswith("sha256="):
        logger.warning("Invalid or missing X-Hub-Signature-256 format")
        return False
    try:
        expected_sig = signature_header.split("sha256=")[-1].strip()
        computed_sig = hmac.new(
            app_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_sig, computed_sig)
    except Exception as e:
        logger.error(f"Error during webhook signature validation: {str(e)}")
        return False

def parse_webhook(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Parse incoming Meta webhook payload to extract critical message fields.
    Supports: Text, Image, Document, Audio, Video, Location, Reaction.
    Ignores unsupported types safely.
    """
    try:
        entries = payload.get("entry", [])
        if not entries:
            return None
        
        changes = entries[0].get("changes", [])
        if not changes:
            return None
            
        value = changes[0].get("value", {})
        if "statuses" in value:
            status_info = value["statuses"][0]
            status_type = status_info.get("status")
            wamid = status_info.get("id")
            recipient_id = status_info.get("recipient_id")
            timestamp = int(status_info.get("timestamp", datetime.utcnow().timestamp()))
            return {
                "phone_number_id": phone_number_id,
                "is_status_update": True,
                "whatsapp_message_id": wamid,
                "status": status_type,
                "recipient_phone": recipient_id,
                "timestamp": timestamp
            }

        if "messages" not in value:
            return None
            
        message = value["messages"][0]
        contact = value.get("contacts", [{}])[0]
        message_type = message.get("type", "text")
        
        customer_phone = message.get("from")
        customer_name = contact.get("profile", {}).get("name", f"Customer {customer_phone[-4:]}" if customer_phone else "Unknown Contact")
        whatsapp_message_id = message.get("id")
        timestamp_raw = message.get("timestamp")
        timestamp = int(timestamp_raw) if timestamp_raw else int(datetime.utcnow().timestamp())
        phone_number_id = value.get("metadata", {}).get("phone_number_id")

        message_text = ""

        if message_type == "text":
            message_text = message.get("text", {}).get("body", "")
        elif message_type == "image":
            image_info = message.get("image", {})
            media_id = image_info.get("id", "unknown_id")
            caption = image_info.get("caption")
            message_text = f"[Image] ID: {media_id}"
            if caption:
                message_text += f" - {caption}"
        elif message_type == "document":
            doc_info = message.get("document", {})
            media_id = doc_info.get("id", "unknown_id")
            filename = doc_info.get("filename")
            caption = doc_info.get("caption")
            message_text = f"[Document] ID: {media_id}"
            if filename:
                message_text += f" ({filename})"
            if caption:
                message_text += f" - {caption}"
        elif message_type == "audio":
            audio_info = message.get("audio", {})
            media_id = audio_info.get("id", "unknown_id")
            message_text = f"[Audio] ID: {media_id}"
        elif message_type == "video":
            video_info = message.get("video", {})
            media_id = video_info.get("id", "unknown_id")
            caption = video_info.get("caption")
            message_text = f"[Video] ID: {media_id}"
            if caption:
                message_text += f" - {caption}"
        elif message_type == "location":
            loc_info = message.get("location", {})
            lat = loc_info.get("latitude")
            lng = loc_info.get("longitude")
            name = loc_info.get("name")
            address = loc_info.get("address")
            message_text = f"[Location] Lat: {lat}, Lng: {lng}"
            if name:
                message_text += f" ({name})"
            if address:
                message_text += f" - {address}"
        elif message_type == "reaction":
            react_info = message.get("reaction", {})
            emoji = react_info.get("emoji", "")
            target_id = react_info.get("message_id", "unknown_target")
            message_text = f"[Reaction] {emoji} on message {target_id}"
        else:
            logger.info(f"Ignored unsupported message type: {message_type}")
            message_text = f"[Unsupported Message Type: {message_type}]"

        return {
            "phone_number_id": phone_number_id,
            "customer_phone": customer_phone,
            "customer_name": customer_name,
            "message_text": message_text,
            "message_type": message_type,
            "whatsapp_message_id": whatsapp_message_id,
            "timestamp": timestamp
        }
    except Exception as e:
        logger.error(f"Failed to parse Meta webhook payload: {str(e)}")
        return None

def save_incoming_message(db: Session, parsed_data: Dict[str, Any]) -> Optional[Message]:
    """
    Save parsed incoming message to the DB.
    Ensures all steps happen inside one database transaction.
    """
    try:
        phone_number_id = parsed_data["phone_number_id"]
        
        # 1. Lookup active workspace connection using phone_number_id
        connection = db.query(WhatsAppConnection).filter(
            WhatsAppConnection.phone_number_id == phone_number_id
        ).first()
        
        if not connection:
            logger.error(f"No connection configuration found for phone_number_id: {phone_number_id}")
            return None

        if parsed_data.get("is_status_update"):
            msg_obj = db.query(Message).filter(
                Message.meta_message_id == parsed_data["whatsapp_message_id"]
            ).first()
            if msg_obj:
                msg_obj.status = parsed_data["status"]
                db.add(msg_obj)
                db.commit()
                db.refresh(msg_obj)
                return msg_obj
            return None
            
        workspace_id = connection.workspace_id
        customer_phone = parsed_data["customer_phone"]
        customer_name = parsed_data["customer_name"]
        
        # 2. Check for duplicates (Meta webhooks sometimes retry delivery)
        existing_msg = db.query(Message).filter(
            Message.meta_message_id == parsed_data["whatsapp_message_id"]
        ).first()
        if existing_msg:
            logger.info(f"Skipping duplicate message: {parsed_data['whatsapp_message_id']}")
            return existing_msg

        timestamp_dt = datetime.utcfromtimestamp(parsed_data["timestamp"])

        # 3. Find or create conversation, update meta fields, increment unread count
        conversation = db.query(Conversation).filter(
            Conversation.workspace_id == workspace_id,
            Conversation.customer_phone == customer_phone
        ).first()
        
        if not conversation:
            conversation = Conversation(
                workspace_id=workspace_id,
                customer_phone=customer_phone,
                customer_name=customer_name,
                last_message=parsed_data["message_text"],
                last_message_time=timestamp_dt,
                unread_count=1
            )
            db.add(conversation)
            db.flush() # populate conversation.id
        else:
            conversation.last_message = parsed_data["message_text"]
            conversation.last_message_time = timestamp_dt
            conversation.unread_count += 1
            if customer_name and conversation.customer_name != customer_name:
                conversation.customer_name = customer_name
            db.add(conversation)
            db.flush()

        # 4. Insert message
        msg_obj = Message(
            conversation_id=conversation.id,
            direction=MessageDirection.INBOUND,
            message_type=parsed_data["message_type"],
            text=parsed_data["message_text"],
            meta_message_id=parsed_data["whatsapp_message_id"],
            status="delivered",
            timestamp=timestamp_dt
        )
        db.add(msg_obj)
        db.commit()
        db.refresh(msg_obj)
        
        logger.info(f"Logged inbound message {msg_obj.id} successfully")
        return msg_obj
    except Exception as e:
        logger.error(f"Error saving incoming message: {str(e)}")
        db.rollback()
        return None

def send_text_message(
    db: Session,
    workspace_id: uuid.UUID,
    recipient_phone: str,
    text: str
) -> Optional[Message]:
    """
    Call Meta Graph API to dispatch an outbound message, then log to DB.
    Handles Token expirations, invalid phone formats, and network failures.
    """
    # 1. Fetch connection details
    connection = db.query(WhatsAppConnection).filter(
        WhatsAppConnection.workspace_id == workspace_id
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=404,
            detail=f"No WhatsApp connection integration configured for workspace {workspace_id}"
        )
        
    # 2. Call Meta Graph REST endpoint
    url = f"https://graph.facebook.com/v19.0/{connection.phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {connection.access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient_phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": text
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
    except requests.RequestException as e:
        logger.error(f"Network error calling Meta API: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to reach Meta Cloud API due to network connectivity failure: {str(e)}"
        )
        
    res_data = response.json()
    
    if response.status_code != 200:
        logger.error(f"Meta Graph API error response: {res_data}")
        error_info = res_data.get("error", {})
        err_msg = error_info.get("message", "Unknown Meta API error")
        err_code = error_info.get("code")
        
        # Raise detailed exception based on error codes
        if err_code == 190:
            raise HTTPException(
                status_code=400,
                detail=f"Meta authorization token has expired or is invalid. Please reconnect. Detail: {err_msg}"
            )
        elif err_code == 100 or "param" in err_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Recipient phone number is invalid or formatted incorrectly. Detail: {err_msg}"
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Meta API Request Failed (Code {err_code}): {err_msg}"
            )
            
    meta_msg_id = res_data.get("messages", [{}])[0].get("id")
    timestamp_now = datetime.utcnow()
    
    try:
        # 3. Find or create conversation, update metadata fields
        conversation = db.query(Conversation).filter(
            Conversation.workspace_id == workspace_id,
            Conversation.customer_phone == recipient_phone
        ).first()
        
        if not conversation:
            conversation = Conversation(
                workspace_id=workspace_id,
                customer_phone=recipient_phone,
                customer_name=f"Customer {recipient_phone[-4:]}",
                last_message=text,
                last_message_time=timestamp_now,
                unread_count=0
            )
            db.add(conversation)
            db.flush()
        else:
            conversation.last_message = text
            conversation.last_message_time = timestamp_now
            db.add(conversation)
            db.flush()
            
        # 4. Save outbound record
        msg_obj = Message(
            conversation_id=conversation.id,
            direction=MessageDirection.OUTBOUND,
            message_type="text",
            text=text,
            meta_message_id=meta_msg_id,
            status="sent",
            timestamp=timestamp_now
        )
        db.add(msg_obj)
        db.commit()
        db.refresh(msg_obj)
        
        logger.info(f"Logged outbound message {msg_obj.id} sent successfully")
        return msg_obj
    except Exception as e:
        logger.error(f"Error logging outbound message: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Message was dispatched by Meta but could not be logged to database."
        )
