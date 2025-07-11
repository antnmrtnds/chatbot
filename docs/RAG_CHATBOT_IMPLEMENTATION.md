# RAG Chatbot Implementation Guide

This document provides a comprehensive guide to the RAG (Retrieval-Augmented Generation) chatbot system implemented for the Viriato real estate platform.

## Overview

The RAG chatbot combines the power of Large Language Models (LLMs) with a vector database to provide accurate, context-aware responses about properties and real estate information. It uses semantic search to retrieve relevant documents and generates responses based on both the retrieved context and conversation history.

## Architecture

### Core Components

1. **RagChatbot Component** (`src/components/RagChatbot.tsx`)
   - React component with floating widget interface
   - Voice input support
   - Progressive lead capture
   - Context-aware responses

2. **RAG Service** (`src/lib/ragService.ts`)
   - Handles query processing and response generation
   - Manages vector embeddings and document retrieval
   - Intent analysis and entity extraction

3. **Page Context Manager** (`src/lib/pageContextManager.ts`)
   - Automatically detects page context
   - Tracks user behavior and preferences
   - Provides contextual information to the chatbot

4. **Document Indexer** (`src/lib/documentIndexer.ts`)
   - Indexes property and general information
   - Manages document chunks and embeddings
   - Provides utilities for content management

## Features

### 🧠 RAG-Powered Responses
- Uses OpenAI embeddings for semantic search
- Retrieves relevant documents from vector database
- Generates contextually accurate responses

### 🎯 Context Awareness
- Automatically detects page type and content
- Adapts responses based on current property or page
- Maintains conversation context across interactions

### 🎤 Voice Input
- Browser-based speech recognition
- Hands-free interaction capability
- Automatic transcription to text

### 🔗 Smart Navigation
- Detects navigation intents
- Suggests relevant pages and properties
- Triggers programmatic navigation

### 📋 Progressive Lead Capture
- Intelligent lead qualification
- GDPR-compliant data collection
- Contextual form presentation

### 📊 Analytics & Tracking
- User interaction tracking
- Lead scoring and qualification
- Performance metrics collection

## Database Schema

The system uses several database tables:

### `rag_document_chunks`
Stores indexed document chunks with embeddings:
```sql
- id: UUID (primary key)
- content: TEXT (document content)
- metadata: JSONB (source, type, property info)
- embedding: VECTOR(1536) (OpenAI embedding)
- created_at: TIMESTAMP
```

### `rag_conversations`
Tracks conversation sessions:
```sql
- id: UUID (primary key)
- visitor_id: TEXT
- session_id: TEXT
- page_context: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `rag_messages`
Stores individual messages:
```sql
- id: UUID (primary key)
- conversation_id: UUID (foreign key)
- role: TEXT ('user' or 'assistant')
- content: TEXT
- metadata: JSONB (intent, entities, sources)
- created_at: TIMESTAMP
```

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
# OpenAI API Key (required for embeddings and chat)
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Setup

Run the setup script to create tables and index documents:

```bash
npx tsx scripts/setup-rag.ts
```

This will:
- Create necessary database tables and functions
- Index property information from the developments table
- Index general company and FAQ information
- Verify the setup with a test query

### 3. Manual Database Setup (Alternative)

If the script doesn't work, manually execute:

1. **Create tables**: Run `supabase/schemas/rag_chatbot_schema.sql`
2. **Create functions**: Run `supabase/functions/match_documents.sql`
3. **Index documents**: Use the DocumentIndexer class

### 4. Integration

Add the chatbot to any page:

```tsx
import RagChatbot from '@/components/RagChatbot';
import { usePageContext } from '@/lib/pageContextManager';

export default function MyPage() {
  const { context } = usePageContext();

  return (
    <div>
      {/* Your page content */}
      
      <RagChatbot
        pageContext={context}
        visitorId="unique-visitor-id"
        sessionId="unique-session-id"
        onNavigate={(url) => router.push(url)}
        onLeadCapture={(data) => handleLeadCapture(data)}
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

## API Endpoints

### `/api/rag-chat` (POST)

Main chatbot endpoint that processes messages through the RAG system.

**Request Body:**
```json
{
  "message": "User message text",
  "context": {
    "pageType": "property",
    "propertyId": "A_0",
    "url": "/imoveis/evergreen-pure/A"
  },
  "visitorId": "unique-visitor-id",
  "sessionId": "unique-session-id",
  "conversationHistory": [...],
  "ragEnabled": true
}
```

**Response:**
```json
{
  "message": "AI response text",
  "sources": ["source1", "source2"],
  "confidence": 0.85,
  "intent": "property_inquiry",
  "entities": {...},
  "navigationCommand": {...},
  "highIntent": false
}
```

## Configuration Options

### Chatbot Configuration

```typescript
interface ChatbotConfig {
  leadCaptureThreshold: number;        // Messages before lead capture
  maxMessagesPerSession: number;       // Session message limit
  sessionTimeoutMinutes: number;       // Session timeout
  ragConfig: {
    enabled: boolean;                  // Enable RAG functionality
    confidenceThreshold: number;       // Minimum confidence for responses
    maxRetrievedDocs: number;         // Max documents to retrieve
    hybridSearch: boolean;            // Use hybrid search
  };
  gdprCompliant: boolean;             // GDPR compliance mode
  cookieConsent: boolean;             // Require cookie consent
  dataRetentionDays: number;          // Data retention period
}
```

### Feature Flags

```typescript
interface Features {
  voiceInput?: boolean;               // Enable voice input
  voiceOutput?: boolean;              // Enable voice output
  mediaRendering?: boolean;           // Enable media in responses
  navigationCommands?: boolean;       // Enable navigation suggestions
  progressiveLeadCapture?: boolean;   // Enable lead capture
  contextAwareness?: boolean;         // Enable context detection
  ragEnabled?: boolean;               // Enable RAG functionality
}
```

## Testing

### Demo Page

Visit `/rag-demo` to test the chatbot with different contexts:

1. **Context Simulation**: Test different page types
2. **Property Questions**: Ask about specific properties
3. **Lead Capture**: Trigger progressive lead capture
4. **Voice Input**: Test speech recognition

### Test Queries

Try these sample queries:

- "Que apartamentos têm disponíveis?"
- "Qual é o preço do apartamento A?"
- "Tem piscina no condomínio?"
- "Quando ficam prontos os apartamentos?"
- "Quero agendar uma visita"

## Monitoring & Analytics

### Performance Metrics

Monitor these key metrics:

- **Response Time**: Average time to generate responses
- **Confidence Scores**: Quality of RAG retrievals
- **Lead Conversion**: Lead capture success rate
- **User Engagement**: Messages per session, session duration

### Logging

The system logs:
- All user interactions
- RAG query performance
- Lead capture events
- Navigation commands
- Error conditions

## Troubleshooting

### Common Issues

1. **No Responses Generated**
   - Check OpenAI API key
   - Verify database connection
   - Ensure documents are indexed

2. **Poor Response Quality**
   - Review indexed documents
   - Adjust confidence thresholds
   - Check embedding quality

3. **Context Not Detected**
   - Verify page metadata
   - Check PageContextManager setup
   - Review URL patterns

4. **Lead Capture Not Triggering**
   - Check message thresholds
   - Verify intent detection
   - Review conversation flow

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG_RAG=true
```

This will log:
- RAG query details
- Document retrieval results
- Intent analysis results
- Context detection events

## Customization

### Adding New Document Types

1. **Create Content**: Prepare documents in the required format
2. **Update Indexer**: Modify `DocumentIndexer` to handle new types
3. **Re-index**: Run the indexing process
4. **Test**: Verify retrieval and responses

### Custom Intents

1. **Define Intent**: Add to intent analysis logic
2. **Update Responses**: Modify response generation
3. **Add Handlers**: Implement specific intent handlers
4. **Test**: Verify intent detection and responses

### Styling Customization

The chatbot supports theme customization:

```typescript
const customTheme = {
  primaryColor: '#your-brand-color',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  fontFamily: 'Your-Font-Family',
  borderRadius: '8px',
};

<RagChatbot theme={customTheme} />
```

## Performance Optimization

### Vector Search Optimization

1. **Index Tuning**: Optimize vector index parameters
2. **Chunk Size**: Adjust document chunk sizes
3. **Embedding Model**: Consider different embedding models
4. **Caching**: Implement response caching

### Response Generation

1. **Model Selection**: Choose appropriate GPT model
2. **Token Limits**: Optimize prompt lengths
3. **Temperature**: Adjust response creativity
4. **Streaming**: Implement streaming responses

## Security Considerations

### Data Privacy

- All conversations are encrypted
- GDPR compliance built-in
- Configurable data retention
- User consent management

### API Security

- Rate limiting implemented
- Input validation and sanitization
- Secure environment variable handling
- Error message sanitization

## Future Enhancements

### Planned Features

1. **Multi-language Support**: Portuguese and English
2. **Voice Output**: Text-to-speech responses
3. **Image Understanding**: Property image analysis
4. **Advanced Analytics**: Detailed conversation insights
5. **Integration APIs**: CRM and marketing tool integration

### Scalability Improvements

1. **Caching Layer**: Redis for response caching
2. **Load Balancing**: Multiple RAG service instances
3. **Database Optimization**: Query performance improvements
4. **CDN Integration**: Static asset optimization

## Support

For technical support or questions:

1. **Documentation**: Check this guide and code comments
2. **Demo Page**: Use `/rag-demo` for testing
3. **Logs**: Check browser console and server logs
4. **Debug Mode**: Enable detailed logging

## Conclusion

The RAG chatbot system provides a powerful, context-aware conversational interface for real estate inquiries. It combines modern AI capabilities with practical business requirements to deliver an engaging user experience while capturing valuable leads.

The system is designed to be maintainable, scalable, and customizable to meet evolving business needs.