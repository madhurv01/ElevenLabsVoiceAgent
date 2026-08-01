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


VALID_PRIORITIES = {"low", "normal", "high", "urgent"}


def cancel_order(order_number: str, email: str):
    sb = get_supabase()
    res = (
        sb.table("orders")
        .select("id, status, customers(email)")
        .eq("order_number", order_number)
        .limit(1)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="No order found with that order number.")

    order = res.data[0]

    if order.get("customers", {}).get("email", "").lower() != email.lower():
        raise HTTPException(
            status_code=403,
            detail="This order does not match the email provided. Please verify your details.",
        )

    if order["status"] != "processing":
        raise HTTPException(
            status_code=409,
            detail=f"This order can't be cancelled because it is already '{order['status']}'.",
        )

    sb.table("orders").update({"status": "cancelled"}).eq("id", order["id"]).execute()
    return {"order_number": order_number, "status": "cancelled"}


def update_ticket(ticket_number: str, email: str, priority: str | None = None, close: bool = False):
    sb = get_supabase()
    res = (
        sb.table("support_tickets")
        .select("id, status, customers(email)")
        .eq("ticket_number", ticket_number)
        .limit(1)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="No support ticket found with that number.")

    ticket = res.data[0]

    if ticket.get("customers", {}).get("email", "").lower() != email.lower():
        raise HTTPException(
            status_code=403,
            detail="This ticket does not match the email provided. Please verify your details.",
        )

    updates = {}
    if priority is not None:
        if priority not in VALID_PRIORITIES:
            raise HTTPException(
                status_code=400,
                detail=f"Priority must be one of: {', '.join(sorted(VALID_PRIORITIES))}.",
            )
        updates["priority"] = priority

    if close:
        updates["status"] = "closed"

    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update.")

    sb.table("support_tickets").update(updates).eq("id", ticket["id"]).execute()
    return {"ticket_number": ticket_number, **updates}


def update_phone(email: str, phone: str):
    customer = _find_customer_by_email(email)
    if not customer:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    sb = get_supabase()
    sb.table("customers").update({"phone": phone}).eq("id", customer["id"]).execute()
    return {"email": email, "phone": phone}


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

    existing = None
    if conversation_id:
        existing_res = (
            sb.table("call_logs")
            .select("id")
            .eq("conversation_id", conversation_id)
            .limit(1)
            .execute()
        )
        existing = existing_res.data[0] if existing_res.data else None

    row = {
        "conversation_id": conversation_id,
        "customer_id": customer["id"] if customer else None,
        "intent": intent,
        "query_text": query_text,
        "response_text": response_text,
        "resolved": resolved,
    }
    # Drop None values so a partial update (e.g. from the post-call webhook)
    # doesn't blank out fields already set by the earlier log_call tool call.
    row = {k: v for k, v in row.items() if v is not None}

    if existing:
        sb.table("call_logs").update(row).eq("id", existing["id"]).execute()
    else:
        sb.table("call_logs").insert(row).execute()

    return {"logged": True}


def _month_key(iso_ts: str) -> str:
    return (iso_ts or "")[:7]  # "YYYY-MM"


def _count_by(rows: list, field: str) -> list:
    counts = {}
    for r in rows:
        key = r.get(field) or "unknown"
        counts[key] = counts.get(key, 0) + 1
    return [{"label": k, "count": v} for k, v in sorted(counts.items())]


def get_order_analytics(email: str):
    customer = _find_customer_by_email(email)
    if not customer:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    sb = get_supabase()
    res = sb.table("orders").select("*").eq("customer_id", customer["id"]).execute()
    orders = res.data or []

    total_orders = len(orders)
    total_spent = round(sum(o["total_amount"] for o in orders), 2)
    avg_order_value = round(total_spent / total_orders, 2) if total_orders else 0

    spend_by_month = {}
    for o in orders:
        m = _month_key(o.get("created_at"))
        spend_by_month[m] = round(spend_by_month.get(m, 0) + o["total_amount"], 2)
    spend_over_time = [{"month": k, "amount": v} for k, v in sorted(spend_by_month.items())]

    return {
        "table": "orders",
        "total_orders": total_orders,
        "total_spent": total_spent,
        "avg_order_value": avg_order_value,
        "status_breakdown": _count_by(orders, "status"),
        "spend_over_time": spend_over_time,
    }


def get_payment_analytics(email: str):
    customer = _find_customer_by_email(email)
    if not customer:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    sb = get_supabase()
    res = sb.table("payments").select("*").eq("customer_id", customer["id"]).execute()
    payments = res.data or []

    total_payments = len(payments)
    total_paid = round(sum(p["amount"] for p in payments if p["status"] == "completed"), 2)

    paid_by_month = {}
    for p in payments:
        if p["status"] != "completed":
            continue
        m = _month_key(p.get("created_at"))
        paid_by_month[m] = round(paid_by_month.get(m, 0) + p["amount"], 2)
    amount_over_time = [{"month": k, "amount": v} for k, v in sorted(paid_by_month.items())]

    return {
        "table": "payments",
        "total_payments": total_payments,
        "total_paid": total_paid,
        "status_breakdown": _count_by(payments, "status"),
        "method_breakdown": _count_by(payments, "payment_method"),
        "amount_over_time": amount_over_time,
    }


def get_ticket_analytics(email: str):
    customer = _find_customer_by_email(email)
    if not customer:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    sb = get_supabase()
    res = sb.table("support_tickets").select("*").eq("customer_id", customer["id"]).execute()
    tickets = res.data or []

    total_tickets = len(tickets)
    open_count = sum(1 for t in tickets if t["status"] in ("open", "in_progress"))
    resolved_count = sum(1 for t in tickets if t["status"] in ("resolved", "closed"))

    tickets_by_month = {}
    for t in tickets:
        m = _month_key(t.get("created_at"))
        tickets_by_month[m] = tickets_by_month.get(m, 0) + 1
    tickets_over_time = [{"month": k, "count": v} for k, v in sorted(tickets_by_month.items())]

    return {
        "table": "support_tickets",
        "total_tickets": total_tickets,
        "open_count": open_count,
        "resolved_count": resolved_count,
        "status_breakdown": _count_by(tickets, "status"),
        "priority_breakdown": _count_by(tickets, "priority"),
        "tickets_over_time": tickets_over_time,
    }


def get_account_analytics(email: str):
    customer = _find_customer_by_email(email)
    if not customer:
        raise HTTPException(status_code=404, detail="No account found with that email.")

    sb = get_supabase()
    orders = sb.table("orders").select("total_amount").eq("customer_id", customer["id"]).execute().data or []
    tickets = sb.table("support_tickets").select("status").eq("customer_id", customer["id"]).execute().data or []
    payments = sb.table("payments").select("amount, status").eq("customer_id", customer["id"]).execute().data or []

    return {
        "table": "customers",
        "full_name": customer["full_name"],
        "email": customer["email"],
        "account_status": customer["account_status"],
        "member_since": customer.get("created_at"),
        "total_orders": len(orders),
        "total_spent": round(sum(o["total_amount"] for o in orders), 2),
        "total_tickets": len(tickets),
        "open_tickets": sum(1 for t in tickets if t["status"] in ("open", "in_progress")),
        "total_payments": len(payments),
        "total_paid": round(sum(p["amount"] for p in payments if p["status"] == "completed"), 2),
    }


ANALYTICS_HANDLERS = {
    "orders": get_order_analytics,
    "payments": get_payment_analytics,
    "support_tickets": get_ticket_analytics,
    "customers": get_account_analytics,
}


def get_analytics(table: str, email: str):
    handler = ANALYTICS_HANDLERS.get(table)
    if not handler:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown table '{table}'. Must be one of: {', '.join(ANALYTICS_HANDLERS)}.",
        )
    return handler(email)


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
