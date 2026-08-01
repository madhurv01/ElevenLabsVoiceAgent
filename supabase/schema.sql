-- =====================================================
-- AI Customer Support Voice Agent - Supabase Schema
-- =====================================================

-- Customers
create table if not exists customers (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text unique not null,
    phone text,
    account_status text default 'active', -- active, suspended, closed
    created_at timestamptz default now()
);

-- Orders
create table if not exists orders (
    id uuid primary key default gen_random_uuid(),
    order_number text unique not null,
    customer_id uuid references customers(id) on delete cascade,
    status text default 'processing', -- processing, shipped, delivered, cancelled
    total_amount numeric(10,2) not null,
    currency text default 'USD',
    tracking_number text,
    estimated_delivery date,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Support Tickets
create table if not exists support_tickets (
    id uuid primary key default gen_random_uuid(),
    ticket_number text unique not null,
    customer_id uuid references customers(id) on delete cascade,
    subject text not null,
    description text,
    status text default 'open', -- open, in_progress, resolved, closed
    priority text default 'normal', -- low, normal, high, urgent
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Payments
create table if not exists payments (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references orders(id) on delete cascade,
    customer_id uuid references customers(id) on delete cascade,
    amount numeric(10,2) not null,
    status text default 'pending', -- pending, completed, failed, refunded
    payment_method text,
    transaction_id text,
    created_at timestamptz default now()
);

-- Call logs (voice agent interaction history)
create table if not exists call_logs (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid references customers(id),
    conversation_id text,
    intent text,
    query_text text,
    response_text text,
    resolved boolean default false,
    created_at timestamptz default now()
);

-- Indexes for fast lookups (used heavily by the voice agent's real-time queries)
create index if not exists idx_orders_number on orders(order_number);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_tickets_number on support_tickets(ticket_number);
create index if not exists idx_tickets_customer on support_tickets(customer_id);
create index if not exists idx_customers_email on customers(email);
create index if not exists idx_payments_order on payments(order_id);

-- Row Level Security: lock tables down. All access happens through the
-- backend's service-role key via predefined functions/endpoints only —
-- the voice agent never talks to Postgres directly.
alter table customers enable row level security;
alter table orders enable row level security;
alter table support_tickets enable row level security;
alter table payments enable row level security;
alter table call_logs enable row level security;

-- No public policies are created on purpose. Only the service_role key
-- (used server-side by the FastAPI backend) can bypass RLS.

-- =====================================================
-- Seed data for quick testing
-- =====================================================
insert into customers (id, full_name, email, phone) values
('11111111-1111-1111-1111-111111111111', 'Madhur Sharma', 'madhur@example.com', '+91-9876543210'),
('22222222-2222-2222-2222-222222222222', 'Asha Verma', 'asha@example.com', '+91-9123456780')
on conflict do nothing;

insert into orders (order_number, customer_id, status, total_amount, tracking_number, estimated_delivery) values
('ORD-1001', '11111111-1111-1111-1111-111111111111', 'shipped', 149.99, 'TRK-88213', current_date + interval '3 days'),
('ORD-1002', '22222222-2222-2222-2222-222222222222', 'processing', 59.50, null, current_date + interval '6 days')
on conflict do nothing;

insert into support_tickets (ticket_number, customer_id, subject, description, status, priority) values
('TCK-5001', '11111111-1111-1111-1111-111111111111', 'Wrong item received', 'Received a different color than ordered', 'in_progress', 'high'),
('TCK-5002', '22222222-2222-2222-2222-222222222222', 'Refund not processed', 'Refund requested 5 days ago, not yet visible', 'open', 'normal')
on conflict do nothing;

insert into payments (order_id, customer_id, amount, status, payment_method, transaction_id)
select o.id, o.customer_id, o.total_amount, 'completed', 'card', 'TXN-' || substr(o.order_number, 5)
from orders o
on conflict do nothing;
