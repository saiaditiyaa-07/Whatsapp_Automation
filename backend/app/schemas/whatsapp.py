import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
from app.models.whatsapp import MessageDirection

class WhatsAppConnectionCreate(BaseModel):
    business_account_id: str
    phone_number_id: str
    phone_number: str
    access_token: str
    verify_token: str
    app_secret: str

class WhatsAppConnectionResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    business_account_id: str
    phone_number_id: str
    phone_number: str
    webhook_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WhatsAppStatusResponse(BaseModel):
    connected: bool
    phone_number: Optional[str] = None
    business_account: Optional[str] = None
    verified: bool
    last_sync: Optional[datetime] = None

class MessageSend(BaseModel):
    text: str

class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    meta_message_id: Optional[str] = None
    direction: MessageDirection
    message_type: str
    text: str
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

class MessageLogResponse(BaseModel):
    id: uuid.UUID
    direction: str
    senderPhone: str
    recipientPhone: str
    messageText: str
    status: str
    createdAt: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_phone: str
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    is_archived: bool
    unread_count: int
    created_at: datetime
    messages: Optional[List[MessageResponse]] = None

    class Config:
        from_attributes = True
