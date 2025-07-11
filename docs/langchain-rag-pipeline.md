# LangChain RAG Pipeline Architecture

## Overview

This document outlines the LangChain-powered Retrieval-Augmented Generation (RAG) pipeline that will enhance the chatbot with semantic search capabilities across property documents, brochures, and contextual information.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Document Ingestion Layer                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PDF Loader    │  │   CSV Loader    │  │   JSON Loader   │ │
│  │  (Brochures)    │  │  (Listings)     │  │  (Metadata)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Image Loader   │  │   Web Scraper   │  │  Manual Input   │ │
│  │ (Floor Plans)   │  │  (Web Content)  │  │   (FAQs)        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Document Processing Layer                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Text          │  │   Metadata      │  │   Content       │ │
│  │  Splitters      │  │  Extractors     │  │  Cleaners       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Chunk         │  │   Property      │  │   Quality       │ │
│  │  Optimizers     │  │   Taggers       │  │  Validators     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Embedding Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   OpenAI        │  │   Batch         │  │   Embedding     │ │
│  │  Embeddings     │  │  Processor      │  │   Cache         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vector Store Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     Chroma      │  │   Similarity    │  │   Hybrid        │ │
│  │  Vector Store   │  │    Search       │  │   Search        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Metadata      │  │   Filtering     │  │   Ranking       │ │
│  │   Filtering     │  │   & Scoring     │  │   & Reranking   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Retrieval Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Context       │  │   Multi-Query   │  │   Ensemble      │ │
│  │  Retriever      │  │   Retriever     │  │   Retriever     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Parent        │  │   Self-Query    │  │   Compression   │ │
│  │  Retriever      │  │   Retriever     │  │   Retriever     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Generation Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Dynamic       │  │   Context       │  │   Response      │ │
│  │  Prompts        │  │  Integration    │  │  Generation     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Chain         │  │   Memory        │  │   Output        │ │
│  │ Orchestration   │  │  Management     │  │  Formatting     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Document Loaders

#### PDF Loader (Brochures & Floor Plans)
```typescript
// src/lib/rag/loaders/pdfLoader.ts
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document } from "langchain/document";

export class PropertyPDFLoader extends PDFLoader {
  async loadWithMetadata(filePath: string, metadata: PropertyMetadata): Promise<Document[]> {
    const docs = await this.load();
    return docs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        ...metadata,
        source: 'pdf',
        document_type: 'brochure'
      }
    }));
  }
}
```

#### CSV Loader (Property Listings)
```typescript
// src/lib/rag/loaders/csvLoader.ts
import { CSVLoader } from "langchain/document_loaders/fs/csv";

export class PropertyCSVLoader extends CSVLoader {
  constructor(filePath: string) {
    super(filePath, {
      column: "content", // Main content column
      separator: ",",
      columnMapping: {
        flat_id: "property_id",
        tipologia: "property_type",
        price: "price",
        content: "description"
      }
    });
  }
}
```

#### JSON Loader (Structured Data)
```typescript
// src/lib/rag/loaders/jsonLoader.ts
import { JSONLoader } from "langchain/document_loaders/fs/json";

export class PropertyJSONLoader extends JSONLoader {
  constructor(filePath: string) {
    super(filePath, [
      "/properties/*/description",
      "/properties/*/features",
      "/properties/*/specifications"
    ]);
  }
}
```

### 2. Text Splitters & Processing

#### Recursive Character Splitter
```typescript
// src/lib/rag/splitters/propertyTextSplitter.ts
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export class PropertyTextSplitter extends RecursiveCharacterTextSplitter {
  constructor() {
    super({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
      keepSeparator: true,
    });
  }

  async splitWithPropertyContext(docs: Document[]): Promise<Document[]> {
    const chunks = await this.splitDocuments(docs);
    
    return chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        chunk_id: generateChunkId(chunk),
        property_context: extractPropertyContext(chunk.pageContent),
        semantic_tags: generateSemanticTags(chunk.pageContent)
      }
    }));
  }
}
```

### 3. Embeddings & Vector Store

#### OpenAI Embeddings Configuration
```typescript
// src/lib/rag/embeddings/openaiEmbeddings.ts
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

export const propertyEmbeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-ada-002",
  batchSize: 512,
  stripNewLines: true,
});
```

#### Chroma Vector Store Setup
```typescript
// src/lib/rag/vectorstore/chromaStore.ts
import { Chroma } from "langchain/vectorstores/chroma";
import { Document } from "langchain/document";

export class PropertyVectorStore {
  private vectorStore: Chroma;
  
  constructor() {
    this.vectorStore = new Chroma(propertyEmbeddings, {
      collectionName: "viriato_properties",
      url: process.env.CHROMA_URL || "http://localhost:8000",
      collectionMetadata: {
        "hnsw:space": "cosine",
        "hnsw:construction_ef": 128,
        "hnsw:M": 16
      }
    });
  }

  async addDocuments(docs: Document[]): Promise<void> {
    // Add property-specific metadata
    const enrichedDocs = docs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        indexed_at: new Date().toISOString(),
        version: "1.0"
      }
    }));

    await this.vectorStore.addDocuments(enrichedDocs);
  }

  async similaritySearchWithMetadata(
    query: string,
    k: number = 4,
    filter?: Record<string, any>
  ): Promise<Document[]> {
    return await this.vectorStore.similaritySearch(query, k, filter);
  }
}
```

### 4. Retrievers

#### Context-Aware Retriever
```typescript
// src/lib/rag/retrievers/contextRetriever.ts
import { BaseRetriever } from "langchain/schema/retriever";
import { Document } from "langchain/document";

export class ContextAwareRetriever extends BaseRetriever {
  constructor(
    private vectorStore: PropertyVectorStore,
    private pageContext?: PageContext
  ) {
    super();
  }

  async getRelevantDocuments(query: string): Promise<Document[]> {
    // Build context-aware filter
    const filter = this.buildContextFilter();
    
    // Multi-stage retrieval
    const semanticResults = await this.vectorStore.similaritySearchWithMetadata(
      query, 6, filter
    );
    
    const keywordResults = await this.keywordSearch(query, filter);
    
    // Combine and rerank results
    return this.rerank([...semanticResults, ...keywordResults], query);
  }

  private buildContextFilter(): Record<string, any> {
    const filter: Record<string, any> = {};
    
    if (this.pageContext?.propertyId) {
      filter.property_id = this.pageContext.propertyId;
    }
    
    if (this.pageContext?.pageType === 'property') {
      filter.document_type = ['brochure', 'floor_plan', 'listing'];
    }
    
    return filter;
  }

  private async keywordSearch(query: string, filter: Record<string, any>): Promise<Document[]> {
    // Implement keyword-based search for exact matches
    const keywords = extractKeywords(query);
    // Implementation details...
    return [];
  }

  private rerank(documents: Document[], query: string): Document[] {
    // Implement reranking logic based on relevance scores
    return documents.slice(0, 4);
  }
}
```

### 5. Prompt Templates

#### Dynamic Property Prompt Template
```typescript
// src/lib/rag/prompts/propertyPrompts.ts
import { PromptTemplate } from "langchain/prompts";

export const PROPERTY_QA_TEMPLATE = `
Você é um assistente especializado em imóveis da Viriato, focado no empreendimento Evergreen Pure em Santa Joana, Aveiro.

CONTEXTO DA PÁGINA:
Página atual: {page_type}
Propriedade específica: {property_id}
Contexto semântico: {semantic_context}

INFORMAÇÕES RELEVANTES:
{context}

HISTÓRICO DA CONVERSA:
{chat_history}

PREFERÊNCIAS DO UTILIZADOR:
{user_preferences}

PERGUNTA DO UTILIZADOR: {question}

INSTRUÇÕES:
1. Use as informações relevantes para responder à pergunta
2. Se estiver numa página de propriedade específica, foque nessa propriedade
3. Considere as preferências do utilizador conhecidas
4. Mantenha continuidade com o histórico da conversa
5. Se não tiver informação suficiente, ofereça contactar um especialista
6. Responda sempre em português (PT-PT)
7. Seja conciso mas informativo

RESPOSTA:`;

export const propertyPrompt = new PromptTemplate({
  template: PROPERTY_QA_TEMPLATE,
  inputVariables: [
    "page_type",
    "property_id", 
    "semantic_context",
    "context",
    "chat_history",
    "user_preferences",
    "question"
  ],
});
```

#### Intent-Specific Templates
```typescript
// src/lib/rag/prompts/intentPrompts.ts

export const INTENT_TEMPLATES = {
  property_inquiry: `
Com base nas informações da propriedade:
{context}

Responda à pergunta sobre: {question}

Foque em: áreas, tipologia, preços, características específicas.
`,

  payment_plans: `
Informações sobre financiamento e pagamento:
{context}

Pergunta: {question}

Inclua: opções de pagamento, simulações, contacto com consultor financeiro.
`,

  project_info: `
Informações sobre o projeto Evergreen Pure:
{context}

Pergunta: {question}

Destaque: localização, comodidades, cronograma, características gerais.
`
};
```

### 6. Chain Orchestration

#### Conversational RAG Chain
```typescript
// src/lib/rag/chains/conversationalChain.ts
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferWindowMemory } from "langchain/memory";

export class PropertyConversationalChain {
  private chain: ConversationalRetrievalQAChain;
  private memory: BufferWindowMemory;

  constructor(
    private retriever: ContextAwareRetriever,
    private pageContext?: PageContext
  ) {
    this.memory = new BufferWindowMemory({
      memoryKey: "chat_history",
      inputKey: "question",
      outputKey: "answer",
      k: 6, // Keep last 6 exchanges
    });

    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4",
      temperature: 0.3,
      maxTokens: 500,
    });

    this.chain = ConversationalRetrievalQAChain.fromLLM(
      llm,
      this.retriever,
      {
        memory: this.memory,
        questionGeneratorTemplate: this.buildQuestionTemplate(),
        qaTemplate: this.buildQATemplate(),
        returnSourceDocuments: true,
        verbose: process.env.NODE_ENV === 'development',
      }
    );
  }

  async query(question: string, userPreferences?: any): Promise<{
    answer: string;
    sourceDocuments: Document[];
    confidence: number;
  }> {
    const result = await this.chain.call({
      question,
      page_context: this.pageContext,
      user_preferences: userPreferences || {},
    });

    return {
      answer: result.answer,
      sourceDocuments: result.sourceDocuments,
      confidence: this.calculateConfidence(result),
    };
  }

  private buildQuestionTemplate(): string {
    return `
Dado o seguinte histórico de conversa e uma pergunta de seguimento, 
reformule a pergunta de seguimento para ser uma pergunta independente.

Histórico da Conversa:
{chat_history}

Pergunta de Seguimento: {question}
Pergunta Independente:`;
  }

  private buildQATemplate(): string {
    return propertyPrompt.template;
  }

  private calculateConfidence(result: any): number {
    // Implement confidence calculation based on source documents relevance
    if (!result.sourceDocuments || result.sourceDocuments.length === 0) {
      return 0.3;
    }
    
    // Calculate based on document relevance scores
    const avgScore = result.sourceDocuments.reduce((sum: number, doc: any) => 
      sum + (doc.metadata?.score || 0.5), 0
    ) / result.sourceDocuments.length;
    
    return Math.min(avgScore * 1.2, 1.0);
  }
}
```

### 7. RAG Service Integration

#### Main RAG Service
```typescript
// src/lib/ragService.ts
import { PropertyVectorStore } from './rag/vectorstore/chromaStore';
import { ContextAwareRetriever } from './rag/retrievers/contextRetriever';
import { PropertyConversationalChain } from './rag/chains/conversationalChain';

export class RAGService {
  private vectorStore: PropertyVectorStore;
  private chains: Map<string, PropertyConversationalChain> = new Map();

  constructor() {
    this.vectorStore = new PropertyVectorStore();
  }

  async initializeDocuments(): Promise<void> {
    // Load and process all documents
    const documents = await this.loadAllDocuments();
    await this.vectorStore.addDocuments(documents);
  }

  async query(
    question: string,
    sessionId: string,
    pageContext?: PageContext,
    userPreferences?: any
  ): Promise<{
    answer: string;
    sources: string[];
    confidence: number;
    suggestions: string[];
  }> {
    // Get or create chain for session
    let chain = this.chains.get(sessionId);
    if (!chain) {
      const retriever = new ContextAwareRetriever(this.vectorStore, pageContext);
      chain = new PropertyConversationalChain(retriever, pageContext);
      this.chains.set(sessionId, chain);
    }

    const result = await chain.query(question, userPreferences);

    return {
      answer: result.answer,
      sources: result.sourceDocuments.map(doc => doc.metadata.source),
      confidence: result.confidence,
      suggestions: this.generateSuggestions(result.sourceDocuments, pageContext),
    };
  }

  private async loadAllDocuments(): Promise<Document[]> {
    // Implementation to load all documents from various sources
    const documents: Document[] = [];
    
    // Load PDFs, CSVs, JSONs, etc.
    // Implementation details...
    
    return documents;
  }

  private generateSuggestions(
    sourceDocuments: Document[],
    pageContext?: PageContext
  ): string[] {
    // Generate contextual suggestions based on retrieved documents
    const suggestions: string[] = [];
    
    // Implementation details...
    
    return suggestions.slice(0, 4);
  }

  clearSession(sessionId: string): void {
    this.chains.delete(sessionId);
  }
}

// Export singleton instance
export const ragService = new RAGService();
```

## Document Processing Pipeline

### 1. Ingestion Schedule
- **Real-time**: New property listings, price updates
- **Daily**: Brochure updates, FAQ changes
- **Weekly**: Full document reprocessing
- **On-demand**: Manual document uploads

### 2. Quality Assurance
- Content validation and cleaning
- Duplicate detection and removal
- Metadata consistency checks
- Embedding quality verification

### 3. Performance Optimization
- Batch processing for large documents
- Incremental updates for changed content
- Caching for frequently accessed documents
- Lazy loading for large embeddings

## Integration Points

### 1. API Endpoints
- `POST /api/rag/query` - Main query endpoint
- `POST /api/rag/documents` - Document management
- `GET /api/rag/health` - System health check
- `POST /api/rag/feedback` - Response feedback

### 2. Monitoring & Analytics
- Query performance metrics
- Retrieval accuracy tracking
- User satisfaction scores
- Document usage statistics

### 3. Maintenance Operations
- Document reindexing
- Vector store optimization
- Memory cleanup
- Performance tuning

This RAG pipeline provides a robust foundation for semantic search and contextual response generation, significantly enhancing the chatbot's ability to provide accurate, relevant information about properties and services.