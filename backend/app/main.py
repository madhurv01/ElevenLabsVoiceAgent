import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from . import services
from .models import (
    OrderStatusRequest,
    TicketStatusRequest,
    AccountLookupRequest,
    PaymentVerificationRequest,
    CreateTicketRequest,
    CallLogRequest,
    CancelOrderRequest,
    UpdateTicketRequest,
    UpdatePhoneRequest,
    ElevenLabsToolCall,
)

load_dotenv()

app = FastAPI(title="AI Voice Support Agent API", version="1.0.0")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok", "service": "ai-voice-support-backend"}


# =====================================================
# Direct REST endpoints (usable by the frontend dashboard
# or by ElevenLabs "webhook" tools pointed at a specific path)
# =====================================================

@app.post("/api/order-status")
def order_status(payload: OrderStatusRequest):
    return services.get_order_status(payload.order_number, payload.email)


@app.post("/api/ticket-status")
def ticket_status(payload: TicketStatusRequest):
    return services.get_ticket_status(payload.ticket_number, payload.email)


@app.post("/api/account-details")
def account_details(payload: AccountLookupRequest):
    return services.get_account_details(payload.email)


@app.post("/api/verify-payment")
def verify_payment(payload: PaymentVerificationRequest):
    return services.verify_payment(payload.order_number, payload.email)


@app.post("/api/create-ticket")
def create_ticket(payload: CreateTicketRequest):
    return services.create_ticket(
        payload.email, payload.subject, payload.description, payload.priority
    )


@app.post("/api/log-call")
def log_call(payload: CallLogRequest):
    return services.log_call(
        payload.conversation_id,
        payload.customer_email,
        payload.intent,
        payload.query_text,
        payload.response_text,
        payload.resolved,
    )


@app.post("/api/cancel-order")
def cancel_order(payload: CancelOrderRequest):
    return services.cancel_order(payload.order_number, payload.email)


@app.post("/api/update-ticket")
def update_ticket(payload: UpdateTicketRequest):
    return services.update_ticket(
        payload.ticket_number, payload.email, payload.priority, payload.close
    )


@app.post("/api/update-phone")
def update_phone(payload: UpdatePhoneRequest):
    return services.update_phone(payload.email, payload.phone)


@app.get("/api/recent-calls")
def recent_calls(limit: int = 20):
    return services.get_recent_calls(limit)


# =====================================================
# ElevenLabs "Post-call webhook" receiver. Configure this under
# Agent -> Settings -> Webhooks -> Post-call transcription, so every
# conversation is logged automatically regardless of whether the agent
# remembered to call the `log_call` tool mid-conversation.
# =====================================================

@app.post("/api/elevenlabs/post-call-webhook")
async def elevenlabs_post_call_webhook(request: Request):
    payload = await request.json()
    data = payload.get("data", payload)  # ElevenLabs wraps the payload in "data"

    conversation_id = data.get("conversation_id")
    if not conversation_id:
        raise HTTPException(status_code=400, detail="Missing conversation_id in webhook payload.")

    analysis = data.get("analysis") or {}
    summary = analysis.get("transcript_summary")
    call_successful = analysis.get("call_successful")  # "success" | "failure" | "unknown"

    dynamic_vars = (
        data.get("conversation_initiation_client_data", {}).get("dynamic_variables", {})
    )
    customer_email = dynamic_vars.get("customer_email") or dynamic_vars.get("email")

    services.log_call(
        conversation_id=conversation_id,
        customer_email=customer_email,
        intent=None,
        query_text=None,
        response_text=summary,
        resolved=(call_successful == "success"),
    )
    return {"received": True}


# =====================================================
# Single generic webhook endpoint for ElevenLabs
# "Server Tools" (recommended integration path).
# Configure ONE tool in ElevenLabs pointing here, and pass
# `tool_name` + `parameters` in the request body/schema.
# =====================================================

@app.post("/api/elevenlabs/tool")
def elevenlabs_tool_router(payload: ElevenLabsToolCall):
    name = payload.tool_name
    params = payload.parameters or {}

    try:
        if name == "get_order_status":
            return services.get_order_status(
                params.get("order_number"), params.get("email")
            )
        elif name == "get_ticket_status":
            return services.get_ticket_status(
                params.get("ticket_number"), params.get("email")
            )
        elif name == "get_account_details":
            return services.get_account_details(params.get("email"))
        elif name == "verify_payment":
            return services.verify_payment(
                params.get("order_number"), params.get("email")
            )
        elif name == "create_ticket":
            return services.create_ticket(
                params.get("email"),
                params.get("subject"),
                params.get("description"),
                params.get("priority", "normal"),
            )
        elif name == "cancel_order":
            return services.cancel_order(
                params.get("order_number"), params.get("email")
            )
        elif name == "update_ticket":
            return services.update_ticket(
                params.get("ticket_number"),
                params.get("email"),
                params.get("priority"),
                params.get("close", False),
            )
        elif name == "update_phone":
            return services.update_phone(
                params.get("email"), params.get("phone")
            )
        elif name == "log_call":
            return services.log_call(
                params.get("conversation_id"),
                params.get("customer_email"),
                params.get("intent"),
                params.get("query_text"),
                params.get("response_text"),
                params.get("resolved", False),
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown tool_name: {name}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
