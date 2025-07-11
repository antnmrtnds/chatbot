# RAG-Powered Chatbot Widget Architecture

## Executive Summary

This document outlines the architecture for a new React-based chatbot widget that will replace the existing implementation with advanced RAG (Retrieval-Augmented Generation) capabilities powered by LangChain, enhanced Supabase backend, and comprehensive visitor tracking.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   New Chatbot   │  │  Page Context   │  │  Navigation     │ │
│  │    Widget       │  │    Manager      │  │    Manager      │ │
│  │  (React/TS)     │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Media Renderer │  │  Lead Capture   │  │  Session State  │ │
│  │  (Images/PDFs)  │  │    Manager      │  │    Manager      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   RAG Chat      │  │  Context API    │  │   Lead API      │ │
│  │     API         │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Navigation     │  │   Media API     │  │  Analytics      │ │
│  │     API         │  │                 │  │     API         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RAG Processing Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   LangChain     │  │   Vector Store  │  │   Document      │ │
│  │  Orchestrator   │  │   (Chroma)      │  │   Loaders       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Embeddings    │  │   Retrievers    │  │   Prompt        │ │
│  │   (OpenAI)      │  │                 │  │  Templates      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Visitor        │  │  Page Context   │  │  Lead Capture   │ │
│  │  Profiles       │  │   Registry      │  │   Records       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Session        │  │  Document       │  │  Analytics      │ │
│  │   State         │  │   Metadata      │  │    Events       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Supabase Edge Functions                       │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │ │
│  │  │   Event     │ │  Context    │ │    Lead Processing  │  │ │
│  │  │  Logging    │ │  Updates    │ │                     │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. New Chatbot Widget (React/TypeScript)

**Location**: `src/components/RagChatbot.tsx`

**Key Features**:
- Floating widget with modern UI
- Page context awareness
- Progressive lead capture
- Media rendering (images, PDFs, pricing tables)
- Voice input/output capabilities
- Real-time navigation commands

**API Surface**:
```typescript
interface RagChatbotProps {
  // Page context
  currentPage?: PageContext;
  
  // Visitor identification
  visitorId?: string;
  
  // Configuration
  config?: {
    enableVoice?: boolean;
    enableNavigation?: boolean;
    leadCaptureThreshold?: number;
    gdprCompliant?: boolean;
  };
  
  // Event handlers
  onNavigate?: (url: string) => void;
  onLeadCapture?: (leadData: LeadData) => void;
  onContextUpdate?: (context: PageContext) => void;
}

interface PageContext {
  url: string;
  pageType: 'home' | 'property' | 'listing' | 'about' | 'contact';
  semanticId: string;
  metadata: {
    propertyId?: string;
    propertyType?: string;
    priceRange?: string;
    features?: string[];
  };
}
```

### 2. Page Context Manager

**Location**: `src/lib/pageContextManager.ts`

**Responsibilities**:
- Detect current page and extract semantic information
- Maintain page registry with metadata
- Provide context to RAG system
- Track page transitions

### 3. RAG Processing Pipeline

**Location**: `src/lib/ragService.ts`

**Components**:
- Document loaders for brochures, floor plans, listings
- Vector embeddings using OpenAI
- Chroma vector store for semantic search
- LangChain orchestration for query processing
- Dynamic prompt templates

### 4. Enhanced Database Schema

**New Tables**:
- `visitor_profiles` - Extended visitor information
- `page_context_registry` - Site page metadata
- `conversation_sessions` - Chat session management
- `document_embeddings` - RAG document vectors
- `lead_capture_events` - Progressive lead tracking

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Set up new database schema
2. Implement basic RAG service with LangChain
3. Create new chatbot widget shell
4. Implement page context detection

### Phase 2: RAG Integration (Week 3-4)
1. Document processing and embedding pipeline
2. Vector store setup and management
3. Query processing and retrieval
4. Response generation with context

### Phase 3: Advanced Features (Week 5-6)
1. Progressive lead capture logic
2. Navigation command processing
3. Media rendering capabilities
4. Voice input/output integration

### Phase 4: Deployment & Migration (Week 7-8)
1. A/B testing setup
2. Performance optimization
3. Migration from old chatbot
4. Monitoring and analytics

## Technical Specifications

### Frontend Stack
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom hooks
- **UI Components**: Radix UI primitives

### Backend Stack
- **Database**: Supabase PostgreSQL
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Vector Store**: Chroma (self-hosted or cloud)
- **Embeddings**: OpenAI text-embedding-ada-002
- **LLM**: OpenAI GPT-4

### RAG Pipeline
- **Document Loaders**: LangChain PDF, CSV, JSON loaders
- **Text Splitters**: Recursive character splitter
- **Retrievers**: Similarity search with MMR
- **Chains**: ConversationalRetrievalChain
- **Memory**: ConversationBufferWindowMemory

## Security & Compliance

### GDPR Compliance
- Explicit consent before PII capture
- Data retention policies
- Right to deletion
- Data portability

### Security Measures
- Row Level Security (RLS) on all tables
- API rate limiting
- Input sanitization
- Secure session management

## Performance Targets

- **First Paint**: < 100ms
- **Chat Response**: < 2s
- **Vector Search**: < 500ms
- **Page Context Detection**: < 50ms
- **Lead Capture**: < 1s

## Monitoring & Analytics

### Key Metrics
- Conversation completion rate
- Lead conversion rate
- Response accuracy
- User satisfaction scores
- Page context accuracy

### Observability
- Structured logging with correlation IDs
- Performance monitoring
- Error tracking
- Usage analytics

## Migration Strategy

### Parallel Deployment
1. Deploy new widget alongside existing chatbot
2. A/B test with percentage of traffic
3. Monitor performance and user feedback
4. Gradual migration based on success metrics

### Rollback Plan
- Feature flags for instant rollback
- Database migration rollback scripts
- Monitoring alerts for critical issues
- Automated failover to old chatbot

## Next Steps

1. **Review and Approval**: Stakeholder review of architecture
2. **Resource Allocation**: Assign development team
3. **Environment Setup**: Development and staging environments
4. **Sprint Planning**: Break down into development sprints
5. **Prototype Development**: Build minimal viable version

---

*This architecture document serves as the foundation for the new RAG-powered chatbot implementation. It should be reviewed and updated as requirements evolve during development.*