# server.py

import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import openai
from dotenv import load_dotenv
load_dotenv()

# load environment variables (you can also use python-dotenv if you like)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

if not (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and OPENAI_KEY):
    raise RuntimeError("Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_KEY")

# configure clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
openai.api_key = OPENAI_KEY

# create FastAPI app
app = FastAPI()

# add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.options("/")
async def preflight():
    # CORS preflight handler
    return JSONResponse(content="OK")

@app.post("/")
async def update_embedding(req: Request):
    payload = await req.json()
    if "id" not in payload or "content" not in payload:
        raise HTTPException(status_code=400, detail="`id` and `content` are required in the JSON body")

    record_id = payload["id"]
    content = payload["content"]

    # call OpenAI Embeddings API
    try:
        res = openai.Embedding.create(
            input=content,
            model="text-embedding-3-small"
        )
        embedding = res["data"][0]["embedding"]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {e}")

    # update Supabase
    try:
        update_resp = (
            supabase
            .from_("developments")
            .update({"embedding": embedding})
            .eq("id", record_id)
            .execute()
        )
        if update_resp.error:
            raise Exception(update_resp.error.message)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Supabase error: {e}")

    return JSONResponse({"success": True})
