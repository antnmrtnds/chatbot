// Types for the RAG chatbot implementation

export interface Property {
  id: string;
  flat_id: string;
  content: string;
  price?: number;
  location?: string;
  typology?: string;
  bedrooms?: number;
  floor_level?: string;
  outdoor_space?: string;
  outdoor_area_sqm?: number;
  position?: string;
  parking?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatSession {
  messages: ChatMessage[];
  sessionId: string | null; // Add sessionId
  context?: {
    relevantProperties: Property[];
    currentQuery?: string;
  };
  onboardingState: 'not_started' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  onboardingAnswers: Record<string, any>;
}

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  typology?: string;
  bedrooms?: number;
  outdoor_space?: string[];
  parking?: boolean;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}