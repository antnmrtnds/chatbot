import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

// Types
export interface RagQuery {
  message: string;
  context?: PageContext;
  conversationHistory?: Message[];
  visitorId?: string;
  sessionId?: string;
  ragEnabled?: boolean;
}

export interface RagResponse {
  message: string;
  sources?: string[];
  confidence?: number;
  intent?: string;
  entities?: Record<string, any>;
  navigationCommand?: NavigationCommand;
  highIntent?: boolean;
}

export interface PageContext {
  url: string;
  pageType: 'home' | 'property' | 'listing' | 'about' | 'contact' | 'blog' | 'general';
  semanticId: string;
  title?: string;
  description?: string;
  keywords?: string[];
  propertyId?: string;
  propertyType?: string;
  priceRange?: string;
  features?: string[];
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    ragSources?: string[];
    confidence?: number;
    intent?: string;
    entities?: Record<string, any>;
  };
}

export interface NavigationCommand {
  command: string;
  url: string;
  context?: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    section?: string;
    propertyId?: string;
    documentType: string;
  };
  embedding?: number[];
  similarity?: number;
}

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class RagService {
  private static instance: RagService;
  private embeddingModel = 'text-embedding-ada-002';
  private chatModel = 'gpt-4-turbo-preview';
  private maxTokens = 4000;
  private temperature = 0.7;

  private constructor() {}

  public static getInstance(): RagService {
    if (!RagService.instance) {
      RagService.instance = new RagService();
    }
    return RagService.instance;
  }

  /**
   * Main RAG query processing
   */
  public async processQuery(query: RagQuery): Promise<RagResponse> {
    try {
      // 1. Analyze user intent and extract entities
      const intentAnalysis = await this.analyzeIntent(query.message, query.context);
      
      // 2. Check if this is a property listing request first
      if (this.isPropertyListingRequest(intentAnalysis, query.message)) {
        const navigationCommand = this.buildEvergreenPureNavigation(intentAnalysis.entities);
        
        return {
          message: 'Perfeito! Vou mostrar-lhe as unidades disponíveis que correspondem às suas preferências.',
          sources: [],
          confidence: 0.9,
          intent: intentAnalysis.intent,
          entities: intentAnalysis.entities,
          navigationCommand,
          highIntent: true,
        };
      }
      
      // 3. Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query.message);
      
      // 4. Retrieve relevant documents
      const relevantDocs = await this.retrieveDocuments(
        queryEmbedding,
        query.context,
        intentAnalysis.intent
      );
      
      // 5. Generate response using RAG
      const response = await this.generateResponse(
        query.message,
        relevantDocs,
        query.context,
        query.conversationHistory,
        intentAnalysis
      );
      
      // 6. Check for navigation commands
      const navigationCommand = this.extractNavigationCommand(
        response,
        intentAnalysis,
        query.context
      );
      
      // 7. Determine if this is high-intent interaction
      const highIntent = this.isHighIntent(intentAnalysis, query.message);
      
      return {
        message: response,
        sources: relevantDocs.map(doc => doc.metadata.source),
        confidence: this.calculateConfidence(relevantDocs),
        intent: intentAnalysis.intent,
        entities: intentAnalysis.entities,
        navigationCommand,
        highIntent,
      };
      
    } catch (error) {
      console.error('RAG Service Error:', error);
      return {
        message: 'Desculpe, ocorreu um erro ao processar a sua pergunta. Por favor, tente novamente.',
        confidence: 0,
      };
    }
  }

  /**
   * Analyze user intent and extract entities
   */
  private async analyzeIntent(message: string, context?: PageContext) {
    const prompt = `
Analyze the following user message and extract:
1. Intent (property_search, property_info, pricing, scheduling, general_info, navigation, listing_request, apartment_specific_info)
2. Entities (property types, locations, price ranges, features, etc.)

Special attention to different types of queries:
- "unidades disponíveis", "apartamentos disponíveis", "ver apartamentos" = listing_request intent
- Questions about specific apartment details (dimensions, features, price of specific unit) = apartment_specific_info intent
- Extract property preferences like T2, T3, budget ranges (200k-300k, etc.)
- Extract specific apartment IDs like A01, B02, etc.

Context: ${context ? JSON.stringify(context) : 'None'}
User Message: "${message}"

Respond in JSON format:
{
  "intent": "intent_category",
  "entities": {
    "property_type": "...",
    "location": "...",
    "price_range": "...",
    "features": [...],
    "timeline": "...",
    "budget_min": "...",
    "budget_max": "...",
    "apartment_id": "...",
    "query_type": "dimensions|features|price|general_info"
  },
  "confidence": 0.0-1.0
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Intent analysis error:', error);
    }

    return {
      intent: 'general_info',
      entities: {},
      confidence: 0.5,
    };
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant documents using vector similarity
   */
  private async retrieveDocuments(
    queryEmbedding: number[],
    context?: PageContext,
    intent?: string
  ): Promise<DocumentChunk[]> {
    try {
      // For apartment-specific queries, prioritize apartment-specific documents
      let matchCount = 5;
      let matchThreshold = 0.7;
      
      if (context?.propertyId && intent === 'apartment_specific_info') {
        matchCount = 8; // Get more documents for apartment-specific queries
        matchThreshold = 0.6; // Lower threshold to get more relevant docs
      }

      // Execute similarity search using Supabase's vector similarity
      const { data: documents, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      if (error) {
        console.error('Document retrieval error:', error);
        return [];
      }

      let results = documents || [];

      // If we have apartment context, prioritize apartment-specific documents
      if (context?.propertyId) {
        results = results.sort((a: DocumentChunk, b: DocumentChunk) => {
          const aIsApartmentSpecific = a.metadata?.propertyId === context.propertyId;
          const bIsApartmentSpecific = b.metadata?.propertyId === context.propertyId;
          
          if (aIsApartmentSpecific && !bIsApartmentSpecific) return -1;
          if (!aIsApartmentSpecific && bIsApartmentSpecific) return 1;
          return 0;
        });
      }

      return results.slice(0, 5); // Return top 5 results
    } catch (error) {
      console.error('Document retrieval error:', error);
      return [];
    }
  }

  /**
   * Generate response using retrieved documents
   */
  private async generateResponse(
    userMessage: string,
    documents: DocumentChunk[],
    context?: PageContext,
    conversationHistory?: Message[],
    intentAnalysis?: any
  ): Promise<string> {
    // Build context from retrieved documents
    const documentContext = documents
      .map(doc => `Source: ${doc.metadata.source}\nContent: ${doc.content}`)
      .join('\n\n');

    // Build conversation history
    const historyContext = conversationHistory
      ?.slice(-4) // Last 4 messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n') || '';

    // Build page context
    const pageContext = context ? `
Current page: ${context.pageType}
URL: ${context.url}
${context.propertyId ? `Property ID: ${context.propertyId}` : ''}
${context.title ? `Page title: ${context.title}` : ''}
` : '';

    const systemPrompt = `
You are Viriato, an AI assistant for a Portuguese real estate company. You help visitors find properties, answer questions about real estate, and guide them through the property search process.

Guidelines:
- Always respond in Portuguese
- Be helpful, professional, and friendly
- Use the provided document context to answer questions accurately
- If you don't have specific information, say so and offer to help in other ways
- For property searches, ask clarifying questions about budget, location, and preferences
- Suggest viewing properties or scheduling appointments when appropriate
- Keep responses concise but informative

Current Context:
${pageContext}

Conversation History:
${historyContext}

Relevant Documents:
${documentContext}

User Intent: ${intentAnalysis?.intent || 'general_info'}
Extracted Entities: ${JSON.stringify(intentAnalysis?.entities || {})}
`;

    try {
      const response = await openai.chat.completions.create({
        model: this.chatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      return response.choices[0]?.message?.content || 'Desculpe, não consegui processar a sua pergunta.';
    } catch (error) {
      console.error('Response generation error:', error);
      throw error;
    }
  }

  /**
   * Extract navigation commands from response
   */
  private extractNavigationCommand(
    response: string,
    intentAnalysis: any,
    context?: PageContext
  ): NavigationCommand | undefined {
    // Check for explicit navigation intents
    if (intentAnalysis.intent === 'navigation') {
      // Extract navigation targets from entities
      const entities = intentAnalysis.entities;
      
      if (entities.page_type) {
        switch (entities.page_type) {
          case 'properties':
          case 'listings':
            return {
              command: 'navigate_to_listings',
              url: '/imoveis',
              context: { filters: entities },
            };
          case 'property':
            if (entities.property_id) {
              return {
                command: 'navigate_to_property',
                url: `/imoveis/${entities.property_id}`,
                context: { propertyId: entities.property_id },
              };
            }
            break;
          case 'contact':
            return {
              command: 'navigate_to_contact',
              url: '/contacto',
            };
        }
      }
    }

    // Check for property listing requests - redirect to Evergreen Pure with filters
    if (this.isPropertyListingRequest(intentAnalysis, response)) {
      return this.buildEvergreenPureNavigation(intentAnalysis.entities);
    }

    // Check for implicit navigation suggestions in response
    const navigationPatterns = [
      { pattern: /ver (esta|a) propriedade/i, url: context?.propertyId ? `/imoveis/${context.propertyId}` : '/imoveis' },
      { pattern: /ver mais propriedades/i, url: '/imoveis' },
      { pattern: /agendar (uma )?visita/i, url: '/contacto' },
      { pattern: /entrar em contacto/i, url: '/contacto' },
    ];

    for (const nav of navigationPatterns) {
      if (nav.pattern.test(response)) {
        return {
          command: 'suggested_navigation',
          url: nav.url,
          context: { suggestion: true },
        };
      }
    }

    return undefined;
  }

  /**
   * Check if this is a property listing request
   */
  private isPropertyListingRequest(intentAnalysis: any, userMessage: string): boolean {
    const listingKeywords = [
      'unidades disponíveis', 'apartamentos disponíveis', 'ver apartamentos',
      'mostrar apartamentos', 'listar apartamentos', 'propriedades disponíveis',
      'ver propriedades', 'mostrar propriedades', 'listar propriedades',
      'ver unidades', 'mostrar unidades', 'disponibilidade'
    ];

    const listingIntents = ['listing_request'];

    // Check if this is a specific apartment query (contains apartment ID like A01, B02, etc.)
    const specificApartmentPattern = /apartamento\s+[A-Z]\d+/i;
    const hasSpecificApartment = specificApartmentPattern.test(userMessage);
    
    // Check if asking about specific details (dimensions, features, etc.) rather than listing
    const specificDetailsKeywords = [
      'dimensões', 'dimensoes', 'tamanho', 'área', 'area', 'metros', 'quartos', 'casas de banho',
      'características', 'caracteristicas', 'detalhes', 'informações sobre', 'informacoes sobre',
      'preço do apartamento', 'preco do apartamento', 'quanto custa', 'valor do apartamento'
    ];
    
    const isSpecificDetailQuery = specificDetailsKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword.toLowerCase())
    );

    // If it's a specific apartment query or asking for specific details, it's NOT a listing request
    if (hasSpecificApartment || isSpecificDetailQuery) {
      return false;
    }

    return (
      listingIntents.includes(intentAnalysis.intent) ||
      listingKeywords.some(keyword =>
        userMessage.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  /**
   * Build navigation URL for Evergreen Pure with filters
   */
  private buildEvergreenPureNavigation(entities: any): NavigationCommand {
    const params = new URLSearchParams();
    
    // Apply budget filter
    if (entities.price_range) {
      const priceRange = entities.price_range.toLowerCase();
      if (priceRange.includes('300') && !priceRange.includes('400')) {
        params.set('budget', 'under_300k');
      } else if (priceRange.includes('400')) {
        params.set('budget', 'under_400k');
      }
    }
    
    // Apply typology filter
    if (entities.property_type) {
      const propertyType = entities.property_type.toUpperCase();
      if (['T1', 'T2', 'T3', 'DUPLEX'].includes(propertyType)) {
        params.set('typology', propertyType);
      }
    }

    const baseUrl = '/imoveis/evergreen-pure';
    const queryString = params.toString();
    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    return {
      command: 'navigate_to_evergreen_listings',
      url: finalUrl,
      context: {
        filters: entities,
        message: 'Redirecionando para as unidades disponíveis que correspondem às suas preferências...'
      },
    };
  }

  /**
   * Determine if this is a high-intent interaction
   */
  private isHighIntent(intentAnalysis: any, message: string): boolean {
    const highIntentKeywords = [
      'comprar', 'adquirir', 'investir', 'orçamento', 'financiamento',
      'visita', 'agendar', 'ver propriedade', 'contacto', 'telefone',
      'email', 'interessado', 'quando posso', 'disponível'
    ];

    const highIntentIntents = ['property_search', 'scheduling', 'pricing'];

    return (
      highIntentIntents.includes(intentAnalysis.intent) ||
      highIntentKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      ) ||
      intentAnalysis.confidence > 0.8
    );
  }

  /**
   * Calculate confidence score based on document relevance
   */
  private calculateConfidence(documents: DocumentChunk[]): number {
    if (documents.length === 0) return 0.3;

    const avgSimilarity = documents.reduce((sum, doc) => sum + (doc.similarity || 0), 0) / documents.length;
    return Math.min(avgSimilarity * 1.2, 1.0); // Boost confidence slightly
  }

  /**
   * Index new documents
   */
  public async indexDocument(
    content: string,
    metadata: {
      source: string;
      documentType: string;
      propertyId?: string;
      section?: string;
    }
  ): Promise<void> {
    try {
      // Split content into chunks
      const chunks = this.splitIntoChunks(content, 1000, 200);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding
        const embedding = await this.generateEmbedding(chunk);
        
        // Store in database
        await supabase.from('rag_document_chunks').insert({
          content: chunk,
          metadata: {
            ...metadata,
            chunk_index: i,
            total_chunks: chunks.length,
          },
          embedding,
        });
      }
    } catch (error) {
      console.error('Document indexing error:', error);
      throw error;
    }
  }

  /**
   * Split text into chunks with overlap
   */
  private splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk);
      
      if (end === text.length) break;
      start = end - overlap;
    }

    return chunks;
  }

  /**
   * Update document embeddings
   */
  public async updateEmbeddings(): Promise<void> {
    try {
      // Get documents without embeddings
      const { data: documents, error } = await supabase
        .from('rag_document_chunks')
        .select('*')
        .is('embedding', null);

      if (error) throw error;

      for (const doc of documents || []) {
        const embedding = await this.generateEmbedding(doc.content);
        
        await supabase
          .from('rag_document_chunks')
          .update({ embedding })
          .eq('id', doc.id);
      }
    } catch (error) {
      console.error('Embedding update error:', error);
      throw error;
    }
  }
}

export default RagService;