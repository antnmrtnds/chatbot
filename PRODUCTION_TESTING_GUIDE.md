# RAG Chatbot Production Testing Guide 🚀

This guide covers how to test and deploy your RAG chatbot in production.

## Pre-Production Checklist ✅

Before deploying to production, ensure:

- [ ] All RAG tables created in production database
- [ ] `match_documents` function deployed to production
- [ ] Environment variables set in production
- [ ] Documents indexed in production database
- [ ] Local testing completed successfully

## Production Environment Setup 🔧

### 1. Environment Variables

Ensure these are set in your production environment (Vercel, Netlify, etc.):

```bash
OPENAI_API_KEY=your_production_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### 2. Database Setup in Production

Run the same setup process in your production Supabase:

1. **Create RAG Tables**:
   ```bash
   npm run create-rag-tables
   ```
   Execute the SQL in your production Supabase SQL Editor

2. **Create Function**:
   ```bash
   npm run create-function
   ```
   Execute the function SQL in production

3. **Index Documents**:
   ```bash
   # Set production environment variables first
   npm run index-documents
   ```

## Testing Methods 🧪

### Method 1: Direct URL Testing

Once deployed, test the chatbot directly:

1. **Visit your production demo page**:
   ```
   https://your-domain.com/rag-demo
   ```

2. **Test queries**:
   - "Que apartamentos têm disponíveis?"
   - "Tell me about Evergreen Pure"
   - "What properties do you have?"

### Method 2: Integration Testing

Add the chatbot to your production pages:

```tsx
// In your production pages
import RagChatbot from '@/components/RagChatbot';
import { usePageContext } from '@/lib/pageContextManager';

export default function ProductionPage() {
  const { context } = usePageContext();

  return (
    <div>
      {/* Your existing content */}
      
      <RagChatbot
        pageContext={context}
        visitorId={`visitor-${Date.now()}`}
        sessionId={`session-${Date.now()}`}
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
        }}
        onLeadCapture={(leadData) => {
          // Send to your CRM or analytics
          console.log('Production lead captured:', leadData);
        }}
        onAnalyticsEvent={(event) => {
          // Send to your analytics platform
          console.log('Production analytics:', event);
        }}
      />
    </div>
  );
}
```

### Method 3: API Testing

Test the RAG API endpoint directly:

```bash
# Test the production API
curl -X POST https://your-domain.com/api/rag-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Que apartamentos têm disponíveis?",
    "ragEnabled": true,
    "pageContext": {
      "url": "/",
      "title": "Home"
    }
  }'
```

## Production Monitoring 📊

### 1. Database Monitoring

Monitor your production database:

```sql
-- Check document count
SELECT COUNT(*) as total_documents FROM rag_document_chunks;

-- Check recent conversations
SELECT COUNT(*) as conversations_today 
FROM rag_conversations 
WHERE created_at >= CURRENT_DATE;

-- Check lead captures
SELECT COUNT(*) as leads_today 
FROM rag_lead_captures 
WHERE created_at >= CURRENT_DATE;

-- Check system performance
SELECT 
  COUNT(*) as total_queries,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time
FROM rag_conversations 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

### 2. Error Monitoring

Set up error tracking in your production environment:

```tsx
// Add to your RagChatbot component
<RagChatbot
  // ... other props
  onError={(error) => {
    // Send to error tracking service (Sentry, LogRocket, etc.)
    console.error('RAG Chatbot Error:', error);
    
    // Optional: Send to your monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });
    }
  }}
/>
```

### 3. Performance Monitoring

Track key metrics:

- **Response Time**: How fast the chatbot responds
- **Success Rate**: Percentage of successful queries
- **User Engagement**: Messages per session
- **Lead Conversion**: Lead capture rate

## Production Deployment Steps 🚀

### For Vercel:

1. **Deploy your app**:
   ```bash
   vercel --prod
   ```

2. **Set environment variables**:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Test the deployment**:
   ```bash
   # Visit your production URL
   https://your-app.vercel.app/rag-demo
   ```

### For Netlify:

1. **Build and deploy**:
   ```bash
   npm run build
   # Deploy via Netlify CLI or dashboard
   ```

2. **Set environment variables** in Netlify dashboard

3. **Test the deployment**

## Production Testing Checklist ✅

- [ ] Production environment variables set
- [ ] Database tables created in production
- [ ] Function deployed to production
- [ ] Documents indexed in production
- [ ] Demo page accessible: `/rag-demo`
- [ ] Chatbot responds to test queries
- [ ] Lead capture working
- [ ] Analytics events firing
- [ ] Error handling working
- [ ] Performance acceptable (< 3s response time)

## Troubleshooting Production Issues 🔧

### Common Production Issues:

1. **Environment Variables Missing**:
   ```bash
   # Check if variables are set
   console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');
   ```

2. **Database Connection Issues**:
   - Verify Supabase URL and key
   - Check if production database has the tables
   - Verify RLS policies allow access

3. **OpenAI API Issues**:
   - Check API key validity
   - Verify billing and rate limits
   - Monitor usage quotas

4. **Performance Issues**:
   - Monitor response times
   - Check database query performance
   - Consider caching frequently accessed data

## Production Optimization 🚀

### 1. Caching Strategy

```tsx
// Add caching for frequent queries
const cachedResponses = new Map();

// In your RAG service
if (cachedResponses.has(queryHash)) {
  return cachedResponses.get(queryHash);
}
```

### 2. Rate Limiting

```tsx
// Add rate limiting to prevent abuse
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
```

### 3. Analytics Integration

```tsx
// Integrate with Google Analytics, Mixpanel, etc.
gtag('event', 'rag_query', {
  event_category: 'chatbot',
  event_label: query,
  value: responseTime,
});
```

## Success Metrics 📈

Track these KPIs in production:

- **User Engagement**: Average messages per session
- **Response Quality**: User satisfaction ratings
- **Lead Generation**: Conversion rate from chat to lead
- **Performance**: Average response time
- **Reliability**: Uptime and error rates

Your RAG chatbot is now ready for production! 🎉