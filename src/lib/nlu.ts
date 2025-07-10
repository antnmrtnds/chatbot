// Natural Language Understanding Service
// Handles intent recognition and entity extraction for the chatbot

export interface Intent {
  name: string;
  confidence: number;
  entities: Entity[];
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
  start?: number;
  end?: number;
}

export interface NLUResult {
  intent: Intent;
  entities: Entity[];
  originalText: string;
}

// Intent patterns and keywords
const INTENT_PATTERNS = {
  project_info: {
    keywords: [
      'tell me about', 'fale-me sobre', 'informação sobre', 'detalhes sobre',
      'evergreen pure', 'evergreen', 'projeto', 'empreendimento',
      'desenvolvimento', 'what is', 'o que é'
    ],
    patterns: [
      /tell me about (.+)/i,
      /fale[-\s]me sobre (.+)/i,
      /informação sobre (.+)/i,
      /detalhes sobre (.+)/i,
      /o que é (.+)/i,
      /what is (.+)/i
    ]
  },
  payment_plans: {
    keywords: [
      'payment plans', 'planos de pagamento', 'financiamento', 'financing',
      'preço', 'price', 'custo', 'cost', 'valor', 'value',
      'como pagar', 'how to pay', 'opções de pagamento', 'payment options',
      'prestações', 'installments', 'crédito', 'credit', 'empréstimo', 'loan'
    ],
    patterns: [
      /what are the payment plans/i,
      /quais são os planos de pagamento/i,
      /opções de financiamento/i,
      /financing options/i,
      /como posso pagar/i,
      /how can i pay/i
    ]
  },
  register_interest: {
    keywords: [
      'register interest', 'registar interesse', 'interessado', 'interested',
      'quero comprar', 'want to buy', 'gostaria de', 'would like',
      'contacto', 'contact', 'agendar', 'schedule', 'visita', 'visit',
      'mais informações', 'more information', 'lead form', 'formulário'
    ],
    patterns: [
      /i want to register interest/i,
      /quero registar interesse/i,
      /estou interessado/i,
      /i am interested/i,
      /gostaria de mais informações/i,
      /would like more information/i,
      /quero agendar/i,
      /want to schedule/i
    ]
  },
  apartment_inquiry: {
    keywords: [
      'apartamento', 'apartment', 'flat', 'unit', 'imóvel', 'property',
      'disponível', 'available', 'tipologia', 'typology', 'área', 'area',
      'quartos', 'bedrooms', 'rooms', 'T1', 'T2', 'T3', 'duplex'
    ],
    patterns: [
      /apartamento ([A-H]\d*)/i,
      /apartment ([A-H]\d*)/i,
      /flat ([A-H]\d*)/i,
      /tipologia (T\d+)/i,
      /typology (T\d+)/i
    ]
  },
  greeting: {
    keywords: [
      'olá', 'hello', 'hi', 'oi', 'bom dia', 'good morning',
      'boa tarde', 'good afternoon', 'boa noite', 'good evening'
    ],
    patterns: [
      /^(olá|hello|hi|oi)/i,
      /^(bom dia|good morning)/i,
      /^(boa tarde|good afternoon)/i
    ]
  }
};

// Entity extraction patterns
const ENTITY_PATTERNS = {
  project_name: {
    patterns: [
      /evergreen\s*pure/i,
      /evergreen/i
    ],
    type: 'project_name'
  },
  apartment_id: {
    patterns: [
      /apartamento\s*([A-H]\d*)/i,
      /apartment\s*([A-H]\d*)/i,
      /flat\s*([A-H]\d*)/i,
      /([A-H]\d+)/i
    ],
    type: 'apartment_id'
  },
  unit_type: {
    patterns: [
      /(T[0-4])/i,
      /(duplex)/i,
      /(\d+\s*bedroom)/i,
      /(\d+\s*quarto)/i,
      /(penthouse)/i
    ],
    type: 'unit_type'
  },
  budget_range: {
    patterns: [
      /(\d+k?)\s*[-–]\s*(\d+k?)/i,
      /(até|up to|under|abaixo de)\s*(\d+(?:\.\d+)?[km]?)/i,
      /(acima de|above|over)\s*(\d+(?:\.\d+)?[km]?)/i,
      /(\d+(?:\.\d+)?)\s*(mil|thousand|k|million|milhão|m)/i,
      /€\s*(\d+(?:\.\d+)?[km]?)/i,
      /(\d+(?:\.\d+)?[km]?)\s*€/i
    ],
    type: 'budget_range'
  },
  location: {
    patterns: [
      /(santa joana)/i,
      /(aveiro)/i,
      /(portugal)/i
    ],
    type: 'location'
  },
  timeline: {
    patterns: [
      /(imediatamente|immediately|agora|now)/i,
      /(brevemente|soon|em breve)/i,
      /(este ano|this year)/i,
      /(próximo ano|next year)/i,
      /(\d+)\s*(meses|months)/i,
      /(\d+)\s*(anos|years)/i
    ],
    type: 'timeline'
  }
};

export class NLUService {
  /**
   * Analyze user input and extract intent and entities
   */
  public analyze(text: string): NLUResult {
    const normalizedText = text.toLowerCase().trim();
    
    // Extract entities first
    const entities = this.extractEntities(text);
    
    // Determine intent
    const intent = this.classifyIntent(normalizedText, entities);
    
    return {
      intent,
      entities,
      originalText: text
    };
  }

  /**
   * Extract entities from text using pattern matching
   */
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    Object.entries(ENTITY_PATTERNS).forEach(([entityType, config]) => {
      config.patterns.forEach(pattern => {
        const matches = text.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
        
        for (const match of matches) {
          if (match.index !== undefined) {
            const value = match[1] || match[0];
            entities.push({
              type: config.type,
              value: value.trim(),
              confidence: 0.8,
              start: match.index,
              end: match.index + match[0].length
            });
          }
        }
      });
    });
    
    return entities;
  }

  /**
   * Classify the intent based on keywords and patterns
   */
  private classifyIntent(text: string, entities: Entity[]): Intent {
    let bestIntent = { name: 'general_inquiry', confidence: 0.3 };
    
    Object.entries(INTENT_PATTERNS).forEach(([intentName, config]) => {
      let confidence = 0;
      
      // Check keyword matches
      const keywordMatches = config.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      ).length;
      
      if (keywordMatches > 0) {
        confidence += (keywordMatches / config.keywords.length) * 0.6;
      }
      
      // Check pattern matches
      const patternMatches = config.patterns.filter(pattern => 
        pattern.test(text)
      ).length;
      
      if (patternMatches > 0) {
        confidence += (patternMatches / config.patterns.length) * 0.4;
      }
      
      // Boost confidence based on relevant entities
      if (intentName === 'project_info' && entities.some(e => e.type === 'project_name')) {
        confidence += 0.2;
      }
      
      if (intentName === 'apartment_inquiry' && entities.some(e => e.type === 'apartment_id' || e.type === 'unit_type')) {
        confidence += 0.2;
      }
      
      if (intentName === 'payment_plans' && entities.some(e => e.type === 'budget_range')) {
        confidence += 0.2;
      }
      
      if (confidence > bestIntent.confidence) {
        bestIntent = { name: intentName, confidence };
      }
    });
    
    return {
      name: bestIntent.name,
      confidence: bestIntent.confidence,
      entities: entities.filter(e => this.isRelevantEntity(e.type, bestIntent.name))
    };
  }

  /**
   * Check if an entity type is relevant for a given intent
   */
  private isRelevantEntity(entityType: string, intentName: string): boolean {
    const relevantEntities: { [key: string]: string[] } = {
      project_info: ['project_name', 'location'],
      payment_plans: ['budget_range', 'project_name'],
      register_interest: ['project_name', 'apartment_id', 'unit_type', 'timeline'],
      apartment_inquiry: ['apartment_id', 'unit_type', 'budget_range', 'location'],
      general_inquiry: ['project_name', 'apartment_id', 'unit_type', 'budget_range', 'location', 'timeline']
    };
    
    return relevantEntities[intentName]?.includes(entityType) || false;
  }

  /**
   * Generate a structured response based on intent and entities
   */
  public generateResponse(nluResult: NLUResult): {
    responseType: string;
    suggestedActions: string[];
    contextData: any;
  } {
    const { intent, entities } = nluResult;
    
    switch (intent.name) {
      case 'project_info':
        return {
          responseType: 'project_information',
          suggestedActions: ['show_apartments', 'schedule_visit', 'get_pricing'],
          contextData: {
            projectName: entities.find(e => e.type === 'project_name')?.value || 'Evergreen Pure',
            requestedInfo: 'general'
          }
        };
        
      case 'payment_plans':
        return {
          responseType: 'financing_information',
          suggestedActions: ['show_payment_options', 'calculate_mortgage', 'contact_advisor'],
          contextData: {
            budgetRange: entities.find(e => e.type === 'budget_range')?.value,
            financingNeeds: true
          }
        };
        
      case 'register_interest':
        return {
          responseType: 'lead_capture',
          suggestedActions: ['collect_contact_info', 'schedule_callback', 'send_brochure'],
          contextData: {
            interestLevel: 'high',
            apartmentId: entities.find(e => e.type === 'apartment_id')?.value,
            unitType: entities.find(e => e.type === 'unit_type')?.value
          }
        };
        
      case 'apartment_inquiry':
        return {
          responseType: 'apartment_details',
          suggestedActions: ['show_apartment_details', 'compare_units', 'schedule_visit'],
          contextData: {
            apartmentId: entities.find(e => e.type === 'apartment_id')?.value,
            unitType: entities.find(e => e.type === 'unit_type')?.value,
            budgetRange: entities.find(e => e.type === 'budget_range')?.value
          }
        };
        
      case 'greeting':
        return {
          responseType: 'greeting_response',
          suggestedActions: ['show_welcome_options', 'ask_preferences'],
          contextData: {
            isNewConversation: true
          }
        };
        
      default:
        return {
          responseType: 'general_assistance',
          suggestedActions: ['clarify_request', 'show_options'],
          contextData: {
            fallback: true,
            entities: entities
          }
        };
    }
  }

  /**
   * Extract specific information for lead qualification
   */
  public extractLeadQualificationData(entities: Entity[]): {
    budget_range?: string;
    unit_type?: string;
    timeline?: string;
    project_interest?: string;
  } {
    const budgetEntity = entities.find(e => e.type === 'budget_range');
    const unitTypeEntity = entities.find(e => e.type === 'unit_type');
    const timelineEntity = entities.find(e => e.type === 'timeline');
    const projectEntity = entities.find(e => e.type === 'project_name');
    
    return {
      budget_range: budgetEntity ? this.normalizeBudgetRange(budgetEntity.value) : undefined,
      unit_type: unitTypeEntity ? unitTypeEntity.value.toUpperCase() : undefined,
      timeline: timelineEntity ? this.normalizeTimeline(timelineEntity.value) : undefined,
      project_interest: projectEntity ? projectEntity.value : undefined
    };
  }

  /**
   * Normalize budget range to standard format
   */
  private normalizeBudgetRange(budget: string): string {
    const normalized = budget.toLowerCase();
    
    if (normalized.includes('200') || normalized.includes('300')) {
      return 'under_300k';
    }
    if (normalized.includes('300') || normalized.includes('400')) {
      return '300k_400k';
    }
    if (normalized.includes('400') || normalized.includes('500')) {
      return 'over_400k';
    }
    
    // Extract numeric values
    const numMatch = normalized.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      if (normalized.includes('k') || normalized.includes('mil')) {
        if (num < 300) return 'under_300k';
        if (num <= 400) return '300k_400k';
        return 'over_400k';
      }
    }
    
    return 'no_budget';
  }

  /**
   * Normalize timeline to standard format
   */
  private normalizeTimeline(timeline: string): string {
    const normalized = timeline.toLowerCase();
    
    if (normalized.includes('imediatamente') || normalized.includes('immediately') || normalized.includes('agora')) {
      return 'immediately';
    }
    if (normalized.includes('brevemente') || normalized.includes('soon') || normalized.includes('breve')) {
      return 'within_3_months';
    }
    if (normalized.includes('este ano') || normalized.includes('this year')) {
      return 'within_year';
    }
    if (normalized.includes('próximo') || normalized.includes('next')) {
      return 'within_year';
    }
    
    return 'just_looking';
  }
}

// Export singleton instance
export const nluService = new NLUService();