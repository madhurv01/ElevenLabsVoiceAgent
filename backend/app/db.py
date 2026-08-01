import os
from functools import lru_cache
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")


@lru_cache
def get_supabase() -> Client:
    """
    Server-side Supabase client using the SERVICE ROLE key.
    This key bypasses RLS, which is why it must NEVER be exposed to the
    frontend or to the ElevenLabs agent config directly — it only lives
    here, in the backend process.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
