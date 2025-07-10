// Memory Service for Context Awareness and User Profile Management
// Handles session memory, long-term preferences, and conversation state

import { supabase } from './supabaseClient';

export interface ConversationContext {
  sessionId: string;
  messages: Array<{
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    intent?: string;
    entities?: Array<{type: string; value: string}>;
  }>;
  currentTopic?: string;
  lastUserIntent?: string;
  contextualReferences: Array<{
    type: 'property' | 'preference' | 'question';
    value: string;
    timestamp: Date;
  }>;
  multiStepFlow?: {
    flowType: string;
    currentStep: string;
    collectedData: Record<string, any>;
    nextStep?: string;
  };
}

export interface UserProfile {
  visitorId: string;
  preferences: {
    priceRange?: string;
    propertyType?: string;
    location?: string;
    bedrooms?: number;
    timeline?: string;
    financing?: string;
    familySize?: number;
  };
  searchHistory: Array<{
    query: string;
    timestamp: Date;
    results?: string[];
  }>;
  propertyInteractions: Array<{
    propertyId: string;
    interactionType: 'view' | 'inquiry' | 'favorite' | 'visit_request';
    timestamp: Date;
    details?: any;
  }>;
  conversationSummary: {
    totalInteractions: number;
    commonTopics: string[];
    lastInteractionDate: Date;
    leadScore: number;
    qualificationStatus: 'unqualified' | 'qualifying' | 'qualified' | 'hot';
  };
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    contactPreference?: 'email' | 'phone' | 'whatsapp';
  };
}

export class MemoryService {
  private sessionMemory: Map<string, ConversationContext> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();

  /**
   * Initialize or retrieve conversation context for a session
   */
  public async getConversationContext(sessionId: string, visitorId: string): Promise<ConversationContext> {
    // Check if we have session memory
    if (this.sessionMemory.has(sessionId)) {
      return this.sessionMemory.get(sessionId)!;
    }

    // Create new session context
    const context: ConversationContext = {
      sessionId,
      messages: [],
      contextualReferences: [],
    };

    // Load recent conversation history from database if available
    await this.loadRecentConversationHistory(context, visitorId);

    this.sessionMemory.set(sessionId, context);
    return context;
  }

  /**
   * Update conversation context with new message
   */
  public updateConversationContext(
    sessionId: string,
    message: {
      text: string;
      sender: 'user' | 'bot';
      intent?: string;
      entities?: Array<{type: string; value: string}>;
    }
  ): void {
    const context = this.sessionMemory.get(sessionId);
    if (!context) return;

    // Add message to context
    context.messages.push({
      ...message,
      timestamp: new Date(),
    });

    // Update current topic based on intent
    if (message.sender === 'user' && message.intent) {
      context.currentTopic = message.intent;
      context.lastUserIntent = message.intent;
    }

    // Extract and store contextual references
    if (message.entities) {
      message.entities.forEach(entity => {
        context.contextualReferences.push({
          type: this.mapEntityToReferenceType(entity.type),
          value: entity.value,
          timestamp: new Date(),
        });
      });
    }

    // Keep only last 20 messages to prevent memory bloat
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }

    // Keep only last 50 contextual references
    if (context.contextualReferences.length > 50) {
      context.contextualReferences = context.contextualReferences.slice(-50);
    }
  }

  /**
   * Get or create user profile
   */
  public async getUserProfile(visitorId: string): Promise<UserProfile> {
    // Check memory cache first
    if (this.userProfiles.has(visitorId)) {
      return this.userProfiles.get(visitorId)!;
    }

    // Load from database
    const profile = await this.loadUserProfileFromDatabase(visitorId);
    this.userProfiles.set(visitorId, profile);
    return profile;
  }

  /**
   * Update user preferences
   */
  public async updateUserPreferences(
    visitorId: string,
    preferences: Partial<UserProfile['preferences']>
  ): Promise<void> {
    const profile = await this.getUserProfile(visitorId);
    
    // Merge new preferences with existing ones
    profile.preferences = {
      ...profile.preferences,
      ...preferences,
    };

    // Update memory cache
    this.userProfiles.set(visitorId, profile);

    // Persist to database
    await this.saveUserProfileToDatabase(profile);
  }

  /**
   * Add property interaction to user profile
   */
  public async addPropertyInteraction(
    visitorId: string,
    interaction: {
      propertyId: string;
      interactionType: 'view' | 'inquiry' | 'favorite' | 'visit_request';
      details?: any;
    }
  ): Promise<void> {
    const profile = await this.getUserProfile(visitorId);
    
    profile.propertyInteractions.push({
      ...interaction,
      timestamp: new Date(),
    });

    // Keep only last 100 interactions
    if (profile.propertyInteractions.length > 100) {
      profile.propertyInteractions = profile.propertyInteractions.slice(-100);
    }

    // Update memory cache
    this.userProfiles.set(visitorId, profile);

    // Persist to database
    await this.saveUserProfileToDatabase(profile);
  }

  /**
   * Start or update multi-step flow
   */
  public updateMultiStepFlow(
    sessionId: string,
    flowType: string,
    currentStep: string,
    collectedData: Record<string, any>,
    nextStep?: string
  ): void {
    const context = this.sessionMemory.get(sessionId);
    if (!context) return;

    context.multiStepFlow = {
      flowType,
      currentStep,
      collectedData: {
        ...context.multiStepFlow?.collectedData,
        ...collectedData,
      },
      nextStep,
    };
  }

  /**
   * Get contextual suggestions based on conversation history
   */
  public getContextualSuggestions(sessionId: string, visitorId: string): string[] {
    const context = this.sessionMemory.get(sessionId);
    const profile = this.userProfiles.get(visitorId);
    
    if (!context) return [];

    const suggestions: string[] = [];

    // Based on recent contextual references
    const recentRefs = context.contextualReferences.slice(-5);
    
    // If user mentioned properties near park, suggest pool-related questions
    if (recentRefs.some(ref => ref.value.toLowerCase().includes('park'))) {
      suggestions.push('🏊 Tem piscina?');
      suggestions.push('🌳 Que outras comodidades tem na área?');
    }

    // If user showed interest in specific property type
    const propertyRefs = recentRefs.filter(ref => ref.type === 'property');
    if (propertyRefs.length > 0) {
      suggestions.push('📅 Agendar visita');
      suggestions.push('💰 Informações sobre preço');
      suggestions.push('🏠 Ver propriedades similares');
    }

    // Based on user profile preferences
    if (profile?.preferences.timeline === 'immediately') {
      suggestions.push('🚀 Propriedades disponíveis imediatamente');
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Generate contextual response based on conversation history
   */
  public generateContextualResponse(sessionId: string, userMessage: string): string | null {
    const context = this.sessionMemory.get(sessionId);
    if (!context) return null;

    const lowerMessage = userMessage.toLowerCase();

    // Handle follow-up questions based on context
    if (context.lastUserIntent === 'property_inquiry') {
      if (lowerMessage.includes('pool') || lowerMessage.includes('piscina')) {
        // Check if they previously asked about properties near park
        const parkRef = context.contextualReferences.find(ref => 
          ref.value.toLowerCase().includes('park') || ref.value.toLowerCase().includes('parque')
        );
        
        if (parkRef) {
          return "Sim, além da proximidade ao parque que mencionou, este empreendimento também tem piscina comunitária. É perfeito para famílias que valorizam espaços verdes e lazer!";
        }
      }
    }

    // Handle continuation of previous topics
    if (lowerMessage.includes('any') || lowerMessage.includes('algum')) {
      if (context.currentTopic === 'property_inquiry') {
        return "Com base no que discutimos anteriormente, posso sugerir algumas opções que se adequam ao que procura.";
      }
    }

    return null;
  }

  /**
   * Clear session memory (for privacy/cleanup)
   */
  public clearSessionMemory(sessionId: string): void {
    this.sessionMemory.delete(sessionId);
  }

  /**
   * Get conversation summary for analytics
   */
  public getConversationSummary(sessionId: string): {
    messageCount: number;
    topicsDiscussed: string[];
    userIntents: string[];
    duration: number;
  } | null {
    const context = this.sessionMemory.get(sessionId);
    if (!context) return null;

    const userMessages = context.messages.filter(m => m.sender === 'user');
    const topicsDiscussed = [...new Set(context.messages
      .filter(m => m.intent)
      .map(m => m.intent!)
    )];
    
    const duration = context.messages.length > 0 
      ? Date.now() - context.messages[0].timestamp.getTime()
      : 0;

    return {
      messageCount: context.messages.length,
      topicsDiscussed,
      userIntents: userMessages.map(m => m.intent).filter(Boolean) as string[],
      duration,
    };
  }

  // Private helper methods

  private async loadRecentConversationHistory(context: ConversationContext, visitorId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('leads_tracking')
        .select('chatbot_interactions')
        .eq('visitor_id', visitorId)
        .single();

      if (error || !data?.chatbot_interactions) return;

      const interactions = data.chatbot_interactions as any[];
      if (Array.isArray(interactions)) {
        // Load last 10 interactions to provide context
        const recentInteractions = interactions.slice(-10);
        context.messages = recentInteractions.map(interaction => ({
          text: interaction.message || interaction.text || '',
          sender: interaction.sender || 'user',
          timestamp: new Date(interaction.timestamp || Date.now()),
          intent: interaction.intent,
          entities: interaction.entities,
        }));
      }
    } catch (error) {
      console.warn('Error loading conversation history:', error);
    }
  }

  private async loadUserProfileFromDatabase(visitorId: string): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('leads_tracking')
        .select('*')
        .eq('visitor_id', visitorId)
        .single();

      if (error || !data) {
        return this.createDefaultUserProfile(visitorId);
      }

      return {
        visitorId,
        preferences: data.qualification_answers?.preferences || {},
        searchHistory: data.qualification_answers?.searchHistory || [],
        propertyInteractions: data.qualification_answers?.propertyInteractions || [],
        conversationSummary: {
          totalInteractions: data.qualification_answers?.totalInteractions || 0,
          commonTopics: data.qualification_answers?.commonTopics || [],
          lastInteractionDate: new Date(data.last_activity_at || Date.now()),
          leadScore: data.lead_score || 0,
          qualificationStatus: data.lead_status || 'unqualified',
        },
        personalInfo: {
          name: data.contact_name,
          email: data.contact_email,
          phone: data.contact_phone,
        },
      };
    } catch (error) {
      console.warn('Error loading user profile:', error);
      return this.createDefaultUserProfile(visitorId);
    }
  }

  private async saveUserProfileToDatabase(profile: UserProfile): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads_tracking')
        .upsert({
          visitor_id: profile.visitorId,
          qualification_answers: {
            preferences: profile.preferences,
            searchHistory: profile.searchHistory,
            propertyInteractions: profile.propertyInteractions,
            totalInteractions: profile.conversationSummary.totalInteractions,
            commonTopics: profile.conversationSummary.commonTopics,
          },
          lead_score: profile.conversationSummary.leadScore,
          lead_status: profile.conversationSummary.qualificationStatus,
          contact_name: profile.personalInfo?.name,
          contact_email: profile.personalInfo?.email,
          contact_phone: profile.personalInfo?.phone,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        }, {
          onConflict: 'visitor_id'
        });

      if (error) {
        console.error('Error saving user profile:', error);
      }
    } catch (error) {
      console.error('Error in saveUserProfileToDatabase:', error);
    }
  }

  private createDefaultUserProfile(visitorId: string): UserProfile {
    return {
      visitorId,
      preferences: {},
      searchHistory: [],
      propertyInteractions: [],
      conversationSummary: {
        totalInteractions: 0,
        commonTopics: [],
        lastInteractionDate: new Date(),
        leadScore: 0,
        qualificationStatus: 'unqualified',
      },
    };
  }

  private mapEntityToReferenceType(entityType: string): 'property' | 'preference' | 'question' {
    switch (entityType) {
      case 'apartment_id':
      case 'unit_type':
      case 'project_name':
        return 'property';
      case 'budget_range':
      case 'timeline':
      case 'location':
        return 'preference';
      default:
        return 'question';
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService();