from pydantic import BaseModel, EmailStr
from typing import Optional


class OrderStatusRequest(BaseModel):
    order_number: str
    email: Optional[EmailStr] = None  # used to verify ownership


class TicketStatusRequest(BaseModel):
    ticket_number: str
    email: Optional[EmailStr] = None


class AccountLookupRequest(BaseModel):
    email: EmailStr


class PaymentVerificationRequest(BaseModel):
    order_number: str
    email: Optional[EmailStr] = None


class CreateTicketRequest(BaseModel):
    email: EmailStr
    subject: str
    description: str
    priority: Optional[str] = "normal"


class CallLogRequest(BaseModel):
    conversation_id: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    intent: Optional[str] = None
    query_text: Optional[str] = None
    response_text: Optional[str] = None
    resolved: Optional[bool] = False


class ElevenLabsToolCall(BaseModel):
    """
    Generic shape for ElevenLabs 'server tool' webhook calls.
    ElevenLabs sends the tool name + parameters; we route internally.
    """
    tool_name: str
    parameters: dict
