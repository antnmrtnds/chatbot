# Quick Fix for RAG Setup Issues 🔧

Based on your verification results, there's a contradiction in the database setup that needs to be resolved.

## Current Status ✅❌

- ✅ Supabase connection working
- ❌ Database tables show conflicting status (exist in step 2, but "don't exist" in steps 3 & 6)
- ❌ `match_documents` function missing or tables missing
- ✅ OpenAI API connection working
- ❌ No documents indexed yet

## Diagnosis First 🔍

Before fixing, let's understand what's actually in your database:

```bash
npm run diagnose-db
```

This will show you exactly what tables exist and what's missing.

## Fix Steps

### Step 1: Diagnose the Issue ⚡

```bash
npm run diagnose-db
```

This will tell you exactly what's missing.

### Step 2: Fix Based on Diagnosis 🔧

**If tables are missing:**
```bash
npm run setup-rag
```
Copy and execute the schema SQL in Supabase SQL Editor.

**If only the function is missing:**
```bash
npm run create-function
```
Copy and execute the function SQL in Supabase SQL Editor.

**If pgvector extension is missing:**
Execute in Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3: Index Documents 📚

Once everything is set up correctly:

```bash
npm run index-documents
```

### Step 4: Test Everything 🧪

```bash
npm run verify-rag
```

You should now see all green checkmarks!

### Step 5: Test the Chatbot 🤖

```bash
npm run dev
```

Visit: `http://localhost:3000/rag-demo`

## Alternative: Manual Function Creation

If the script doesn't work, manually paste this SQL in Supabase SQL Editor:

```sql
-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the match_documents function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  embedding vector(1536),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rag_document_chunks.id,
    rag_document_chunks.content,
    rag_document_chunks.metadata,
    rag_document_chunks.embedding,
    1 - (rag_document_chunks.embedding <=> query_embedding) AS similarity
  FROM rag_document_chunks
  WHERE 1 - (rag_document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY rag_document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO anon;
```

## Expected Final Result

After following these steps, `npm run verify-rag` should show:

```
✅ Supabase connection successful
✅ All tables exist
✅ pgvector extension and match_documents function working
✅ OpenAI API connection successful
✅ Found X indexed document chunks
✅ X chunks have embeddings
✅ RAG query successful
```

## If Still Having Issues

1. **Function still missing**: Make sure you executed the SQL in the correct Supabase project
2. **No documents indexed**: Run `npm run index-documents` again
3. **RAG query fails**: Check your OpenAI API key and credits
4. **Other errors**: Check the browser console and Supabase logs

You're very close! Just need to create that function and index the documents. 🚀