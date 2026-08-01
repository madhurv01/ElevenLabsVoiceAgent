from fastapi import HTTPException
from .db import get_supabase


def _find_customer_by_email(email: str):
    sb = get_supabase()
    res = sb.table("customers").select("*").eq("email", email).limit(1).execute()
    return res.data[0] if res.data else None


def get_order_status(order_number: str, email: str | None = None):
    sb = get_supabase()
    query = sb.table("orders").select("*, customers(full_name, email)").eq(
        "order_number", order_number
    )
    res = query.limit(1).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="No order found with that order number.")

    order = res.data[0]

    # Ownership check when an email is supplied (e.g. voice caller verification)
    if email and order.get("customers", {}).get("email", "").lower() != email.lower():
        raise HTTPException(
            status_code=403,
            detail="This order does not match the email provided. Please verify your details.",
        )

    return {
        "order_number": order["order_number"],
        "status": order["status"],
        "total_amount": order["total_amount"],
        "currency": order["currency"],
        "tracking_number": order.get("tracking_number"),
        "estimated_delivery": order.get("estimated_delivery"),
    }


def get_ticket_status(ticket_number: str, email: str | None = None):
    sb = get_supabase()
    res = (
        sb.table("support_tickets")
        .select("*, customers(full_name, email)")
        .eq("ticket_number", ticket_number)
        .limit(1)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="No support ticket found with that number.")

    ticket = res.data[0]

    if email and ticket.get("customers", {}).get("email", "").lower() != email.lower():
        raise HTTPException(
            status_code=403,
            detail="This ticket does not match the email provided. Please verify your details.",
        )

    return {
        "ticket_number": ticket["ticket_number"],
        "subject": ticket["subject"],
        "status": ticket["status"],
        "priority": ticket["priority"],
        "updated_at": ticket["updated_at"],
    }


def get_account_details(email: str):
    customer = _find_customer_by_email(email)
    if not customer:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    return {
        "full_name": customer["full_name"],
        "email": customer["email"],
        "account_status": customer["account_status"],
        "phone": customer.get("phone"),
    }


def verify_payment(order_number: str, email: str | None = None):
    sb = get_supabase()
    order_res = sb.table("orders").select("id, customers(email)").eq(
        "order_number", order_number
    ).limit(1).execute()

    if not order_res.data:
        raise HTTPException(status_code=404, detail="No order found with that order number.")

    order = order_res.data[0]

    if email and order.get("customers", {}).get("email", "").lower() != email.lower():
        raise HTTPException(status_code=403, detail="Email does not match this order.")

    pay_res = (
        sb.table("payments")
        .select("*")
        .eq("order_id", order["id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not pay_res.data:
        return {"status": "no_payment_found"}

    payment = pay_res.data[0]
    return {
        "amount": payment["amount"],
        "status": payment["status"],
        "payment_method": payment.get("payment_method"),
        "transaction_id": payment.get("transaction_id"),
    }


def create_ticket(email: str, subject: str, description: str, priority: str = "normal"):
    customer = _find_customer_by_email(email)
    if not customer:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    sb = get_supabase()
    ticket_number = f"TCK-{__import__('random').randint(10000, 99999)}"

    res = (
        sb.table("support_tickets")
        .insert(
            {
                "ticket_number": ticket_number,
                "customer_id": customer["id"],
                "subject": subject,
                "description": description,
                "priority": priority,
                "status": "open",
            }
        )
        .execute()
    )
    return res.data[0]


def log_call(
    conversation_id: str | None,
    customer_email: str | None,
    intent: str | None,
    query_text: str | None,
    response_text: str | None,
    resolved: bool = False,
):
    sb = get_supabase()
    customer = _find_customer_by_email(customer_email) if customer_email else None

    sb.table("call_logs").insert(
        {
            "conversation_id": conversation_id,
            "customer_id": customer["id"] if customer else None,
            "intent": intent,
            "query_text": query_text,
            "response_text": response_text,
            "resolved": resolved,
        }
    ).execute()

    return {"logged": True}


def get_recent_calls(limit: int = 20):
    sb = get_supabase()
    res = (
        sb.table("call_logs")
        .select("*, customers(full_name, email)")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data
