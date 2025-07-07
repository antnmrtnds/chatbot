# backfill_embeddings.py

import os
from supabase import create_client, Client
import openai
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

load_dotenv()

# load environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

if not (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and OPENAI_KEY):
    raise RuntimeError("Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_KEY in your .env file")

# configure clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
client = openai.OpenAI(api_key=OPENAI_KEY)

def backfill_embeddings():
    """
    Fetches rows from the 'developments' table that are missing embeddings,
    generates embeddings for them, and updates the rows in Supabase.
    """
    try:
        # Fetch records that need embeddings. I am assuming the text content is in a 'content' column.
        # If your content is in another column, please let me know.
        # Also, I am fetching rows where 'embedding' is NULL.
        response = supabase.from_("developments").select("id, content").is_("embedding", "null").execute()
        
        if hasattr(response, 'data') and response.data:
            records_to_update = response.data
            logging.info(f"Found {len(records_to_update)} records to update.")

            for record in records_to_update:
                record_id = record["id"]
                content = record["content"]

                if not content or not isinstance(content, str) or content.strip() == "":
                    logging.warning(f"Skipping record {record_id} due to empty or invalid content.")
                    continue

                try:
                    # Call OpenAI Embeddings API
                    res = client.embeddings.create(
                        input=content,
                        model="text-embedding-3-small"
                    )
                    embedding = res.data[0].embedding
                    logging.info(f"Generated embedding for record {record_id}.")

                    # Update Supabase
                    update_resp = (
                        supabase
                        .from_("developments")
                        .update({"embedding": embedding})
                        .eq("id", record_id)
                        .execute()
                    )
                    
                    if hasattr(update_resp, 'error') and update_resp.error:
                        logging.error(f"Error updating record {record_id} in Supabase: {update_resp.error.message}")
                    else:
                        logging.info(f"Successfully updated record {record_id}.")

                except Exception as e:
                    logging.error(f"Error processing record {record_id}: {e}")
        
        else:
            logging.info("No records to update or error fetching data.")
            if hasattr(response, 'error') and response.error:
                 logging.error(f"Supabase fetch error: {response.error.message}")


    except Exception as e:
        logging.error(f"An error occurred during the backfill process: {e}")

if __name__ == "__main__":
    backfill_embeddings() 