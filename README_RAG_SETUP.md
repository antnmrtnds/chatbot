# RAG Chatbot Setup - Quick Start Guide

This guide will help you set up the RAG (Retrieval-Augmented Generation) chatbot system for your real estate platform.

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file with:

```bash
# OpenAI API Key (required for embeddings and chat)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (required for vector database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup

**Option A: Automated Setup (Recommended)**
```bash
npm run setup-rag
```

**Option B: Manual Setup**
Follow the detailed instructions in [`docs/MANUAL_SETUP_GUIDE.md`](docs/MANUAL_SETUP_GUIDE.md)

### 4. Verify Setup

```bash
npm run verify-rag
```

### 5. Index Documents

```bash
npm run index-documents
```

### 6. Test the Chatbot

Start your development server and visit `/rag-demo`:

```bash
npm run dev
```

Navigate to: `http://localhost:3000/rag-demo`

## 🎯 What You Get

### Core Features
- **Semantic Search**: Vector-based document retrieval using OpenAI embeddings
- **Context Awareness**: Chatbot adapts responses based on current page
- **Progressive Lead Capture**: Smart lead qualification during conversations
- **Voice Input**: Hands-free interaction using Web Speech API
- **Multi-language Support**: Portuguese and English support
- **Real-time Analytics**: Track user interactions and engagement

### Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase with pgvector extension
- **AI**: OpenAI GPT-4 + text-embedding-ada-002
- **Vector Search**: PostgreSQL with pgvector

## 📁 Key Files

### Components
- [`src/components/RagChatbot.tsx`](src/components/RagChatbot.tsx) - Main chatbot component
- [`src/app/rag-demo/page.tsx`](src/app/rag-demo/page.tsx) - Demo page for testing

### Services
- [`src/lib/ragService.ts`](src/lib/ragService.ts) - Core RAG functionality
- [`src/lib/documentIndexer.ts`](src/lib/documentIndexer.ts) - Document indexing utilities
- [`src/lib/pageContextManager.ts`](src/lib/pageContextManager.ts) - Page context detection

### API Routes
- [`src/app/api/rag-chat/route.ts`](src/app/api/rag-chat/route.ts) - RAG chat endpoint

### Database
- [`supabase/schemas/rag_chatbot_schema.sql`](supabase/schemas/rag_chatbot_schema.sql) - Database schema
- [`supabase/functions/match_documents.sql`](supabase/functions/match_documents.sql) - Vector search function

### Scripts
- [`scripts/setup-rag.ts`](scripts/setup-rag.ts) - Automated setup script
- [`scripts/verify-rag-setup.ts`](scripts/verify-rag-setup.ts) - Setup verification

## 🔧 Usage

### Basic Integration

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

### Advanced Configuration

```tsx
<RagChatbot
  pageContext={context}
  visitorId="visitor-123"
  sessionId="session-456"
  features={{
    ragEnabled: true,
    contextAwareness: true,
    progressiveLeadCapture: true,
    voiceInput: true,
  }}
  theme={{
    primaryColor: '#007bff',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderRadius: '12px',
  }}
  config={{
    maxMessages: 50,
    confidenceThreshold: 0.7,
    maxDocuments: 5,
    leadCaptureThreshold: 3,
  }}
  onLeadCapture={(leadData) => {
    console.log('Lead captured:', leadData);
    // Send to your CRM
  }}
  onAnalyticsEvent={(event) => {
    console.log('Analytics event:', event);
    // Send to your analytics platform
  }}
/>
```

## 🔍 Troubleshooting

### Common Issues

1. **"vector" type not found**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **No documents found in search**
   ```bash
   npm run index-documents
   ```

3. **OpenAI API errors**
   - Check API key and credits
   - Verify rate limits

4. **Supabase connection errors**
   - Verify URL and service role key
   - Check database connection limits

### Debug Commands

```bash
# Check setup status
npm run verify-rag

# Re-index documents
npm run index-documents

# Check database tables
# (Run in Supabase SQL Editor)
SELECT COUNT(*) FROM rag_document_chunks;
```

## 📊 Monitoring

### Database Queries

```sql
-- Check indexed documents
SELECT COUNT(*) as total_chunks,
       COUNT(embedding) as chunks_with_embeddings
FROM rag_document_chunks;

-- Recent conversations
SELECT COUNT(*) as conversations_today
FROM rag_conversations 
WHERE created_at >= CURRENT_DATE;

-- Lead captures
SELECT COUNT(*) as leads_captured
FROM rag_lead_captures
WHERE created_at >= CURRENT_DATE;
```

### Performance Metrics

- **Response Time**: Target < 2 seconds
- **Relevance Score**: Target > 0.7 similarity
- **Lead Conversion**: Track capture rate
- **User Engagement**: Messages per session

## 🚀 Production Deployment

### Environment Variables
Set the same environment variables in your production environment.

### Database Optimization
```sql
-- Optimize vector search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rag_document_chunks_embedding_hnsw 
ON rag_document_chunks USING hnsw (embedding vector_cosine_ops);
```

### Scaling Considerations
- **Caching**: Implement Redis for frequent queries
- **Rate Limiting**: Add API rate limiting
- **Monitoring**: Set up error tracking and performance monitoring
- **Backup**: Regular database backups

## 📚 Documentation

- [`docs/RAG_CHATBOT_IMPLEMENTATION.md`](docs/RAG_CHATBOT_IMPLEMENTATION.md) - Detailed implementation guide
- [`docs/MANUAL_SETUP_GUIDE.md`](docs/MANUAL_SETUP_GUIDE.md) - Manual setup instructions

## 🆘 Support

If you encounter issues:

1. Run the verification script: `npm run verify-rag`
2. Check the browser console for errors
3. Review Supabase logs for database issues
4. Verify all environment variables are set

## 🎉 Success!

Once setup is complete, you'll have a fully functional RAG chatbot that can:

- Answer questions about your properties using semantic search
- Capture leads intelligently based on user engagement
- Adapt responses based on the current page context
- Provide voice interaction capabilities
- Track detailed analytics for optimization

The chatbot is now ready to enhance your real estate platform's user experience!