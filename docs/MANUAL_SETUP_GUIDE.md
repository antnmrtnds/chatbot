# Manual RAG Chatbot Setup Guide

This guide provides step-by-step instructions for manually setting up the RAG chatbot system.

## Prerequisites

1. **Environment Variables**: Ensure you have the following in your `.env.local`:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Supabase Project**: Active Supabase project with pgvector extension enabled

## Step 1: Enable pgvector Extension

In your Supabase SQL Editor, run:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

## Step 2: Create Database Schema

Copy and execute the contents of `supabase/schemas/rag_chatbot_schema.sql` in your Supabase SQL Editor:

```sql
-- RAG Document Chunks Table
CREATE TABLE IF NOT EXISTS rag_document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Conversations Table
CREATE TABLE IF NOT EXISTS rag_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Messages Table
CREATE TABLE IF NOT EXISTS rag_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES rag_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Lead Captures Table
CREATE TABLE IF NOT EXISTS rag_lead_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES rag_conversations(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  lead_data JSONB NOT NULL,
  capture_reason TEXT NOT NULL,
  page_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Analytics Events Table
CREATE TABLE IF NOT EXISTS rag_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  event_category TEXT NOT NULL,
  event_action TEXT NOT NULL,
  event_label TEXT,
  event_value INTEGER,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rag_document_chunks_embedding ON rag_document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_rag_conversations_visitor_id ON rag_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rag_conversations_session_id ON rag_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_messages_conversation_id ON rag_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rag_messages_created_at ON rag_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_lead_captures_visitor_id ON rag_lead_captures(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rag_analytics_events_visitor_id ON rag_analytics_events(visitor_id);

-- Enable Row Level Security
ALTER TABLE rag_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_lead_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, customize as needed)
CREATE POLICY "Allow all operations on rag_document_chunks" ON rag_document_chunks FOR ALL USING (true);
CREATE POLICY "Allow all operations on rag_conversations" ON rag_conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations on rag_messages" ON rag_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on rag_lead_captures" ON rag_lead_captures FOR ALL USING (true);
CREATE POLICY "Allow all operations on rag_analytics_events" ON rag_analytics_events FOR ALL USING (true);
```

## Step 3: Create Vector Search Function

Copy and execute the contents of `supabase/functions/match_documents.sql`:

```sql
-- Function to match documents using vector similarity
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO anon;
```

## Step 4: Index Initial Documents

Run the following Node.js script to index your documents:

```bash
# Create a simple indexing script
node -e "
const { DocumentIndexer } = require('./src/lib/documentIndexer');
const indexer = new DocumentIndexer();

async function indexDocuments() {
  try {
    console.log('Starting document indexing...');
    await indexer.indexGeneralInformation();
    await indexer.indexPropertyData();
    console.log('Document indexing completed!');
    
    const stats = await indexer.getIndexStats();
    console.log('Stats:', stats);
  } catch (error) {
    console.error('Indexing failed:', error);
  }
}

indexDocuments();
"
```

Or use the TypeScript version:

```bash
npx tsx -e "
import DocumentIndexer from './src/lib/documentIndexer.js';

const indexer = new DocumentIndexer();

async function run() {
  await indexer.indexGeneralInformation();
  await indexer.indexPropertyData();
  console.log('Indexing complete!');
}

run().catch(console.error);
"
```

## Step 5: Test the Setup

1. **Visit the demo page**: Navigate to `/rag-demo` in your application
2. **Test basic queries**: Try asking "Que apartamentos têm disponíveis?"
3. **Check the database**: Verify that documents were indexed in the `rag_document_chunks` table

## Step 6: Integration

Add the chatbot to your pages:

```tsx
import RagChatbot from '@/components/RagChatbot';
import { usePageContext } from '@/lib/pageContextManager';

export default function MyPage() {
  const { context } = usePageContext();

  return (
    <div>
      {/* Your existing content */}
      
      <RagChatbot
        pageContext={context}
        visitorId="unique-visitor-id"
        sessionId="unique-session-id"
        features={{
          ragEnabled: true,
          contextAwareness: true,
          progressiveLeadCapture: true,
          voiceInput: true,
        }}
      />
    </div>
  );
}
```

## Verification Checklist

- [ ] pgvector extension enabled
- [ ] All RAG tables created (5 tables)
- [ ] `match_documents` function created
- [ ] Documents indexed (check `rag_document_chunks` table)
- [ ] Environment variables set
- [ ] Demo page accessible at `/rag-demo`
- [ ] Chatbot responds to test queries

## Troubleshooting

### Common Issues

1. **"vector" type not found**
   - Solution: Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`

2. **No documents found in search**
   - Check if documents were indexed: `SELECT COUNT(*) FROM rag_document_chunks;`
   - Verify embeddings exist: `SELECT COUNT(*) FROM rag_document_chunks WHERE embedding IS NOT NULL;`

3. **OpenAI API errors**
   - Verify API key is correct and has sufficient credits
   - Check rate limits and quotas

4. **Supabase connection errors**
   - Verify URL and service role key
   - Check database connection limits

### Manual Document Indexing

If automatic indexing fails, you can manually insert test documents:

```sql
-- Insert a test document
INSERT INTO rag_document_chunks (content, metadata) VALUES (
  'Evergreen Pure é um empreendimento localizado em Santa Joana, Aveiro, com apartamentos T1, T2, T3 e T3 duplex.',
  '{"source": "test_document", "documentType": "general", "title": "Test Document"}'
);
```

### Checking Embeddings

To verify embeddings are being generated:

```sql
-- Check if embeddings exist
SELECT 
  COUNT(*) as total_chunks,
  COUNT(embedding) as chunks_with_embeddings
FROM rag_document_chunks;
```

## Next Steps

1. **Customize Content**: Add more specific property information
2. **Tune Parameters**: Adjust confidence thresholds and search parameters
3. **Monitor Performance**: Track response times and user satisfaction
4. **Scale**: Consider caching and performance optimizations

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify all environment variables are set correctly
4. Test with simple queries first before complex ones

The RAG chatbot should now be fully functional and ready for use!