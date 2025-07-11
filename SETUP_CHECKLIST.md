# RAG Chatbot Setup Checklist ✅

Follow these steps in order to set up your RAG chatbot system.

## Prerequisites ✅

- [ ] Node.js installed
- [ ] Supabase project created
- [ ] OpenAI API account with credits

## Step 1: Environment Setup ✅

- [ ] Create `.env.local` file in project root
- [ ] Add the following variables:
  ```bash
  OPENAI_API_KEY=your_openai_api_key_here
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

## Step 2: Install Dependencies ✅

```bash
npm install
```

## Step 3: Database Setup ✅

### 3.1 Get SQL Commands
```bash
npm run setup-rag
```
This will display the SQL you need to execute.

### 3.2 Execute SQL in Supabase
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the schema SQL from the setup script output
4. Execute it
5. Copy and paste the functions SQL from the setup script output  
6. Execute it

### 3.3 Enable pgvector (if not already enabled)
In Supabase SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Step 4: Verify Setup ✅

```bash
npm run verify-rag
```

This should show:
- ✅ Supabase connection successful
- ✅ All tables exist
- ✅ pgvector extension working
- ✅ OpenAI API connection successful

## Step 5: Index Documents ✅

```bash
npm run index-documents
```

This will:
- Clear any existing documents
- Index general information
- Index property data
- Show indexing statistics

## Step 6: Test the Chatbot ✅

```bash
npm run dev
```

Visit: `http://localhost:3000/rag-demo`

Test with queries like:
- "Que apartamentos têm disponíveis?"
- "Tell me about your properties"
- "What developments do you have?"

## Step 7: Integration ✅

Add the chatbot to your pages:

```tsx
import RagChatbot from '@/components/RagChatbot';
import { usePageContext } from '@/lib/pageContextManager';

export default function MyPage() {
  const { context } = usePageContext();

  return (
    <div>
      {/* Your content */}
      
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

## Troubleshooting 🔧

### Common Issues

**❌ "vector" type not found**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**❌ No documents found in search**
```bash
npm run index-documents
```

**❌ OpenAI API errors**
- Check API key in `.env.local`
- Verify you have credits
- Check rate limits

**❌ Supabase connection errors**
- Verify URL and service role key
- Check if project is paused
- Verify database connection limits

**❌ Tables don't exist**
- Re-run the SQL from `npm run setup-rag`
- Check Supabase SQL Editor for errors

### Debug Commands

```bash
# Check what's wrong
npm run verify-rag

# Re-setup if needed
npm run setup-rag

# Re-index documents
npm run index-documents
```

### Manual Verification

In Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'rag_%';

-- Check document count
SELECT COUNT(*) FROM rag_document_chunks;

-- Check embeddings
SELECT COUNT(*) FROM rag_document_chunks WHERE embedding IS NOT NULL;

-- Test vector search
SELECT match_documents(
  ARRAY[0.1, 0.2, 0.3]::vector(3), -- dummy embedding
  0.1, -- low threshold
  1    -- limit 1
);
```

## Success Indicators ✅

You'll know everything is working when:

- [ ] `npm run verify-rag` shows all green checkmarks
- [ ] `/rag-demo` page loads without errors
- [ ] Chatbot responds to test queries
- [ ] Database has indexed documents
- [ ] Vector search returns results

## Next Steps 🚀

- Customize the chatbot appearance and behavior
- Add more property data to index
- Monitor performance and user interactions
- Set up analytics and lead tracking
- Deploy to production

## Support 🆘

If you're still having issues:

1. Check the browser console for JavaScript errors
2. Check Supabase logs for database errors  
3. Verify all environment variables are correct
4. Try the manual setup guide: `docs/MANUAL_SETUP_GUIDE.md`

The RAG chatbot should now be fully functional! 🎉