'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import visitorTracker from '@/lib/visitorTracker';

// Web Speech API types
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Mic, MicOff, User, Bot, Navigation, RefreshCw } from 'lucide-react';

// Types
export interface RagChatbotProps {
  config?: ChatbotConfig;
  pageContext?: PageContext;
  visitorId?: string;
  sessionId?: string;
  onNavigate?: (url: string, context?: NavigationContext) => void;
  onLeadCapture?: (leadData: LeadCaptureData) => void;
  onContextUpdate?: (context: PageContext) => void;
  onAnalyticsEvent?: (event: AnalyticsEvent) => void;
  theme?: ChatbotTheme;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  features?: {
    voiceInput?: boolean;
    voiceOutput?: boolean;
    mediaRendering?: boolean;
    navigationCommands?: boolean;
    progressiveLeadCapture?: boolean;
    contextAwareness?: boolean;
    ragEnabled?: boolean;
  };
}

export interface ChatbotConfig {
  leadCaptureThreshold: number;
  maxMessagesPerSession: number;
  sessionTimeoutMinutes: number;
  ragConfig: {
    enabled: boolean;
    confidenceThreshold: number;
    maxRetrievedDocs: number;
    hybridSearch: boolean;
  };
  gdprCompliant: boolean;
  cookieConsent: boolean;
  dataRetentionDays: number;
  debounceMs: number;
  maxConcurrentRequests: number;
  cacheResponses: boolean;
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
  referrer?: string;
  utmParams?: Record<string, string>;
  previousPages?: string[];
  timeOnPage?: number;
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

export interface LeadCaptureData {
  name?: string;
  email?: string;
  phone?: string;
  budget?: string;
  propertyType?: string;
  timeline?: string;
  captureReason: 'threshold' | 'explicit' | 'high_intent' | 'navigation';
  conversationContext: string[];
  pageContext: PageContext;
  gdprConsent: boolean;
  marketingConsent: boolean;
  consentTimestamp: string;
}

export interface NavigationContext {
  command: string;
  targetPage: string;
  reason: 'user_request' | 'suggestion' | 'flow_completion';
  context?: Record<string, any>;
}

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
}

export interface ChatbotTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: string;
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  animationDuration: string;
  easing: string;
}

// Default configuration
const defaultConfig: ChatbotConfig = {
  leadCaptureThreshold: 4,
  maxMessagesPerSession: 50,
  sessionTimeoutMinutes: 30,
  ragConfig: {
    enabled: true,
    confidenceThreshold: 0.7,
    maxRetrievedDocs: 5,
    hybridSearch: true,
  },
  gdprCompliant: true,
  cookieConsent: true,
  dataRetentionDays: 365,
  debounceMs: 300,
  maxConcurrentRequests: 3,
  cacheResponses: true,
};

const defaultTheme: ChatbotTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: 'Inter, sans-serif',
  fontSize: {
    small: '0.875rem',
    medium: '1rem',
    large: '1.125rem',
  },
  borderRadius: '0.5rem',
  spacing: {
    small: '0.5rem',
    medium: '1rem',
    large: '1.5rem',
  },
  animationDuration: '0.2s',
  easing: 'ease-in-out',
};

export function RagChatbot({
  config = defaultConfig,
  pageContext,
  visitorId,
  sessionId,
  onNavigate,
  onLeadCapture,
  onContextUpdate,
  onAnalyticsEvent,
  theme = defaultTheme,
  position = 'bottom-right',
  features = {
    voiceInput: true,
    voiceOutput: false,
    mediaRendering: true,
    navigationCommands: true,
    progressiveLeadCapture: true,
    contextAwareness: true,
    ragEnabled: true,
  },
}: RagChatbotProps) {
  // Debug: Component mounting
  console.log('[RagChatbot] Component mounting/re-rendering');
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    propertyType: '',
    timeline: '',
    marketingConsent: false,
  });
  const [messageCount, setMessageCount] = useState(0);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [currentContext, setCurrentContext] = useState<PageContext | null>(pageContext || null);
  
  // New visitor onboarding states
  const [showWelcome, setShowWelcome] = useState(true);
  const [showNameInput, setShowNameInput] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [nameInputValue, setNameInputValue] = useState('');

  // State for preferences collection
  const [isCollectingPreferences, setIsCollectingPreferences] = useState(false);
  const [preferencesData, setPreferencesData] = useState({
    bedrooms: '',
    budget: '',
  });

  // State for auto-open functionality
  const [autoOpenTimer, setAutoOpenTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [autoOpenMessage, setAutoOpenMessage] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Effects
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load persisted chat state on component mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Load persisted chat state
      const savedState = localStorage.getItem('rag_chat_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Check if the saved state is recent (within session timeout)
        const lastActivity = new Date(parsedState.lastActivity);
        const now = new Date();
        const sessionTimeoutMs = config.sessionTimeoutMinutes * 60 * 1000;
        
        if (now.getTime() - lastActivity.getTime() < sessionTimeoutMs) {
          // Restore state with proper date conversion
          const restoredMessages = (parsedState.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          // Only restore if we have meaningful state to restore
          if (parsedState.visitorName || restoredMessages.length > 0) {
            setMessages(restoredMessages);
            setVisitorName(parsedState.visitorName || '');
            setMessageCount(parsedState.messageCount || 0);
            setLeadCaptured(parsedState.leadCaptured || false);
            setShowWelcome(parsedState.showWelcome !== undefined ? parsedState.showWelcome : true);
            setShowNameInput(parsedState.showNameInput !== undefined ? parsedState.showNameInput : false);
            setHasAutoOpened(parsedState.hasAutoOpened || false);
            
            console.log('[RagChatbot] Restored chat state from localStorage:', {
              visitorName: parsedState.visitorName,
              messagesCount: restoredMessages.length,
              showWelcome: parsedState.showWelcome,
              showNameInput: parsedState.showNameInput
            });
          } else {
            console.log('[RagChatbot] No meaningful state to restore, using defaults');
          }
        } else {
          // Clear expired state
          localStorage.removeItem('rag_chat_state');
          console.log('[RagChatbot] Cleared expired chat state');
        }
      } else {
        console.log('[RagChatbot] No saved chat state found');
      }
    } catch (error) {
      console.error('[RagChatbot] Error loading persisted state:', error);
      localStorage.removeItem('rag_chat_state');
    }
  }, [config.sessionTimeoutMinutes]);

  // Save chat state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const chatState = {
      messages,
      visitorName,
      messageCount,
      leadCaptured,
      showWelcome,
      showNameInput,
      hasAutoOpened,
      lastActivity: new Date().toISOString(),
    };

    try {
      localStorage.setItem('rag_chat_state', JSON.stringify(chatState));
    } catch (error) {
      console.error('[RagChatbot] Error saving chat state:', error);
    }
  }, [messages, visitorName, messageCount, leadCaptured, showWelcome, showNameInput, hasAutoOpened]);

  useEffect(() => {
    if (pageContext) {
      setCurrentContext(pageContext);
      onContextUpdate?.(pageContext);
    }
  }, [pageContext, onContextUpdate]);

  useEffect(() => {
    // Initialize speech recognition if supported
    if (features.voiceInput && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-PT';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [features.voiceInput]);

  // Auto-open timer for flat pages
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're on a flat page
    const currentUrl = window.location.pathname;
    const flatPageRegex = /\/imoveis\/evergreen-pure\/([A-Z]\d+)$/;
    const match = currentUrl.match(flatPageRegex);
    
    console.log('[RagChatbot] Auto-open check:', {
      currentUrl,
      match: match ? match[1] : null,
      isOpen,
      hasAutoOpened,
      currentContext: currentContext?.pageType,
      windowLocation: window.location.href,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Update context with apartment information if on apartment page
    if (match) {
      const flatId = match[1];
      const apartmentContext: PageContext = {
        url: currentUrl,
        pageType: 'property',
        semanticId: `apartment-${flatId}`,
        propertyId: flatId,
        propertyType: 'apartment',
        title: `Apartamento ${flatId} - Evergreen Pure`,
        description: `Informações sobre o apartamento ${flatId}`,
        keywords: ['apartamento', flatId, 'evergreen', 'pure'],
        features: [],
        timeOnPage: 0,
      };
      
      if (!currentContext || currentContext.propertyId !== flatId) {
        setCurrentContext(apartmentContext);
        onContextUpdate?.(apartmentContext);
        console.log('[RagChatbot] Updated context for apartment:', flatId);
      }
    }
    
    // For testing purposes, always allow auto-open on flat pages (ignore hasAutoOpened)
    if (match && !isOpen) {
      const flatId = match[1];
      const TIMER_DELAY = 3000; // 3 seconds for testing
      
      console.log('[RagChatbot] Auto-open timer set for flat:', flatId, 'delay:', TIMER_DELAY);
      
      // Set 3-second timer for testing
      const timer = setTimeout(() => {
        console.log('[RagChatbot] Auto-opening chatbot for flat:', flatId);
        setAutoOpenMessage(`Em que posso ajudá-lo em relação ao apartamento ${flatId}?`);
        setIsOpen(true);
        setHasAutoOpened(true);
        
        // Track auto-open event
        visitorTracker.trackChatOpened(
          window.location.href,
          currentContext
        );
        
        onAnalyticsEvent?.({
          category: 'chatbot',
          action: 'auto_opened',
          label: 'flat_page_timer',
          properties: {
            flatId,
            timeOnPage: TIMER_DELAY / 1000,
            trigger: 'auto_open_flat_page'
          }
        });
      }, TIMER_DELAY);
      
      setAutoOpenTimer(timer);
    } else {
      console.log('[RagChatbot] Auto-open skipped because:', {
        noMatch: !match,
        chatIsOpen: isOpen,
        alreadyAutoOpened: hasAutoOpened
      });
    }
    
    // Cleanup timer on unmount or dependency change
    return () => {
      if (autoOpenTimer) {
        clearTimeout(autoOpenTimer);
        setAutoOpenTimer(null);
      }
    };
  }, [isOpen, hasAutoOpened, currentContext, onAnalyticsEvent, onContextUpdate]);

  // Handle auto-open message display
  useEffect(() => {
    if (autoOpenMessage && isOpen && !showWelcome && !showNameInput) {
      const autoMessage: Message = {
        id: `auto-${Date.now()}`,
        content: autoOpenMessage,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, autoMessage]);
      setAutoOpenMessage(null); // Clear after adding
    }
  }, [autoOpenMessage, isOpen, showWelcome, showNameInput]);

  // URL change detection to reset auto-open state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleUrlChange = () => {
      // Reset auto-open state on URL change
      setHasAutoOpened(false);
      setAutoOpenMessage(null);
      if (autoOpenTimer) {
        clearTimeout(autoOpenTimer);
        setAutoOpenTimer(null);
      }
    };
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [autoOpenTimer]);

  // Handlers
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setMessageCount(prev => prev + 1);

    // Track message sent with new RAG visitor tracker
    visitorTracker.trackMessageSent(
      content.trim(),
      typeof window !== 'undefined' ? window.location.href : '/',
      currentContext
    );

    // Track analytics
    onAnalyticsEvent?.({
      category: 'chatbot',
      action: 'message_sent',
      label: 'user_message',
      properties: {
        messageLength: content.length,
        messageCount: messageCount + 1,
        pageContext: currentContext,
      },
    });

    try {
      // Call RAG service
      const response = await fetch('/api/rag-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context: currentContext,
          visitorId: visitorTracker.getVisitorId() || visitorId,
          sessionId: visitorTracker.getSessionId() || sessionId,
          conversationHistory: messages.slice(-5), // Last 5 messages for context
          ragEnabled: features.ragEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          ragSources: data.sources,
          confidence: data.confidence,
          intent: data.intent,
          entities: data.entities,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check for navigation commands
      if (features.navigationCommands && data.navigationCommand) {
        // If it's a listing request, collect preferences first
        if (data.navigationCommand.command === 'navigate_to_evergreen_listings') {
          const preferencesMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: 'Claro, diga-me rapidamente as suas preferências de tipologia e orçamento:',
            role: 'assistant',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, preferencesMessage]);
          setIsCollectingPreferences(true);
        } else {
          // Handle other navigation commands normally
          onNavigate?.(data.navigationCommand.url, {
            command: data.navigationCommand.command,
            targetPage: data.navigationCommand.url,
            reason: 'user_request',
            context: data.navigationCommand.context,
          });
        }
      }

      // Lead capture functionality disabled

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    messageCount,
    currentContext,
    visitorId,
    sessionId,
    messages,
    features,
    config.leadCaptureThreshold,
    leadCaptured,
    onAnalyticsEvent,
    onNavigate,
  ]);

  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    setIsListening(true);
    recognitionRef.current.start();
  }, [isListening]);

  const handleLeadCapture = useCallback((leadData: Partial<LeadCaptureData>) => {
    const fullLeadData: LeadCaptureData = {
      ...leadData,
      captureReason: 'threshold',
      conversationContext: messages.map(m => m.content),
      pageContext: currentContext!,
      gdprConsent: true,
      marketingConsent: leadData.marketingConsent || false,
      consentTimestamp: new Date().toISOString(),
    };

    // Track lead captured with new RAG visitor tracker
    visitorTracker.trackLeadCaptured(
      fullLeadData,
      typeof window !== 'undefined' ? window.location.href : '/',
      currentContext
    );

    onLeadCapture?.(fullLeadData);
    setLeadCaptured(true);
    setShowLeadCapture(false);
    setLeadFormData({
      name: '',
      email: '',
      phone: '',
      budget: '',
      propertyType: '',
      timeline: '',
      marketingConsent: false,
    });

    // Add confirmation message
    const confirmationMessage: Message = {
      id: Date.now().toString(),
      content: `Obrigado ${leadData.name}! Recebemos as suas informações e entraremos em contacto em breve. Como posso continuar a ajudá-lo?`,
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmationMessage]);

    // Track analytics
    onAnalyticsEvent?.({
      category: 'chatbot',
      action: 'lead_captured',
      label: fullLeadData.captureReason,
      properties: {
        messageCount,
        pageContext: currentContext,
      },
    });
  }, [messages, currentContext, messageCount, onLeadCapture, onAnalyticsEvent]);

  const handleLeadFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleLeadCapture(leadFormData);
  }, [leadFormData, handleLeadCapture]);

  // New visitor onboarding handlers
  const handleStartConversation = useCallback(() => {
    setShowWelcome(false);
    setShowNameInput(true);
    
    // Track with new RAG visitor tracker
    visitorTracker.trackConversationStarted(
      typeof window !== 'undefined' ? window.location.href : '/',
      currentContext
    );
    
    // Track analytics
    onAnalyticsEvent?.({
      category: 'chatbot',
      action: 'start_conversation',
      label: 'welcome_flow',
    });
  }, [onAnalyticsEvent, currentContext]);

  const handleNameSubmit = useCallback(() => {
    if (!nameInputValue.trim()) return;
    
    setVisitorName(nameInputValue.trim());
    setShowNameInput(false);
    setNameInputValue('');
    
    // Track name provided with new RAG visitor tracker
    visitorTracker.trackNameProvided(
      nameInputValue.trim(),
      typeof window !== 'undefined' ? window.location.href : '/',
      currentContext
    );
    
    // Add welcome message with name
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: `Olá ${nameInputValue.trim()}! 👋 Bem-vindo à Viriato. Como posso ajudá-lo hoje?`,
      role: 'assistant',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    
    // Track analytics
    onAnalyticsEvent?.({
      category: 'chatbot',
      action: 'name_provided',
      label: 'onboarding_complete',
      properties: {
        hasName: true,
      },
    });
  }, [nameInputValue, onAnalyticsEvent, currentContext]);

  const handleStartNewChat = useCallback(() => {
    // Clear all chat state
    setMessages([]);
    setVisitorName('');
    setMessageCount(0);
    setLeadCaptured(false);
    setShowWelcome(true);
    setShowNameInput(false);
    setNameInputValue('');
    setShowLeadCapture(false);
    setIsCollectingPreferences(false);
    setPreferencesData({ bedrooms: '', budget: '' });
    setInputValue('');
    
    // Reset auto-open state
    setHasAutoOpened(false);
    setAutoOpenMessage(null);
    if (autoOpenTimer) {
      clearTimeout(autoOpenTimer);
      setAutoOpenTimer(null);
    }
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rag_chat_state');
    }
    
    // Track new chat started
    visitorTracker.trackConversationStarted(
      typeof window !== 'undefined' ? window.location.href : '/',
      currentContext
    );
    
    // Track analytics
    onAnalyticsEvent?.({
      category: 'chatbot',
      action: 'new_chat_started',
      label: 'reset_conversation',
    });
  }, [onAnalyticsEvent, currentContext, autoOpenTimer]);

  const handleManualOpen = useCallback(() => {
    if (autoOpenTimer) {
      clearTimeout(autoOpenTimer);
      setAutoOpenTimer(null);
    }
    setIsOpen(true);
    setHasAutoOpened(true); // Prevent auto-open after manual open
    
    // Track manual chat opened
    visitorTracker.trackChatOpened(
      typeof window !== 'undefined' ? window.location.href : '/',
      currentContext
    );
  }, [autoOpenTimer, currentContext]);

  const handleManualClose = useCallback(() => {
    setIsOpen(false);
    // Reset auto-open state when manually closed
    setHasAutoOpened(false);
  }, []);

  const handlePreferencesSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { bedrooms, budget } = preferencesData;
    if (!bedrooms || !budget) return;

    // Helper function to convert budget selection to database key
    const getBudgetRangeKey = (budget: string): string => {
      switch (budget) {
        case '200000':
          return 'under_200k';
        case '300000':
          return '200k_300k';
        case '400000':
          return '300k_400k';
        case '500000':
          return 'over_400k';
        case 'flexible':
          return 'flexible_budget';
        case 'need_advice':
          return 'need_advice';
        default:
          return 'no_budget';
      }
    };

    const baseUrl = '/imoveis/evergreen-pure';
    const params = new URLSearchParams();
    
    // Add budget filter
    const budgetParam = getBudgetRangeKey(budget);
    params.append('budget', budgetParam);
    
    // Add typology filter
    params.append('typology', bedrooms);

    const redirectUrl = `${baseUrl}?${params.toString()}`;

    // Create confirmation message based on budget type
    let budgetText = '';
    switch (budget) {
      case '200000':
        budgetText = 'até €200.000';
        break;
      case '300000':
        budgetText = 'entre €200.000 - €300.000';
        break;
      case '400000':
        budgetText = 'entre €300.000 - €400.000';
        break;
      case '500000':
        budgetText = 'acima de €400.000';
        break;
      case 'flexible':
        budgetText = 'com orçamento flexível';
        break;
      case 'need_advice':
        budgetText = 'para aconselhamento sobre orçamento';
        break;
      default:
        budgetText = 'dentro do seu orçamento';
    }

    const confirmationMessage: Message = {
      id: Date.now().toString(),
      content: `Perfeito! A guardar as suas preferências e a redirecioná-lo para apartamentos ${bedrooms} ${budgetText}...`,
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmationMessage]);

    // Track preferences collected as a message sent event
    visitorTracker.trackMessageSent(
      `Preferences collected: ${bedrooms} apartment with budget ${budgetText}`,
      typeof window !== 'undefined' ? window.location.href : '/',
      currentContext
    );

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    }, 2000);

    setIsCollectingPreferences(false);
    setPreferencesData({ bedrooms: '', budget: '' });
  }, [preferencesData, currentContext]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (suggestion === "Unidades disponíveis") {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: suggestion,
        role: 'user',
        timestamp: new Date(),
      };
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Perfeito! Para lhe mostrar os apartamentos mais adequados, preciso de saber algumas preferências.\n\nQual é o seu orçamento aproximado?',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage, botMessage]);
      setIsCollectingPreferences(true);
    } else {
      handleSendMessage(suggestion);
    }
  }, [handleSendMessage]);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <>
      {/* Floating Widget Button */}
      {!isOpen && (
        <Button
          onClick={handleManualOpen}
          className={`fixed ${positionClasses[position]} z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200`}
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.backgroundColor,
          }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <Card
          className={`fixed ${positionClasses[position]} z-50 w-96 h-[500px] shadow-2xl flex flex-col`}
          style={{
            backgroundColor: theme.backgroundColor,
            color: theme.textColor,
            fontFamily: theme.fontFamily,
          }}
        >
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" style={{ color: theme.primaryColor }} />
              <CardTitle className="text-lg">Assistente Viriato</CardTitle>
              {features.contextAwareness && currentContext && (
                <Badge variant="secondary" className="text-xs">
                  {currentContext.pageType}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {!showWelcome && !showNameInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartNewChat}
                  className="h-8 w-8 p-0"
                  title="Nova conversa"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome Screen */}
            {showWelcome && (
              <div className="text-center mt-8">
                <Bot className="h-12 w-12 mx-auto mb-4" style={{ color: theme.primaryColor }} />
                <h3 className="text-lg font-semibold mb-2">Assistente Viriato</h3>
                <p className="text-gray-600 mb-6">We typically reply in a few minutes</p>
                <Button
                  onClick={handleStartConversation}
                  className="w-full flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Iniciar Conversa
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Name Input Screen */}
            {showNameInput && (
              <div className="mt-8">
                <Bot className="h-8 w-8 mx-auto mb-4" style={{ color: theme.primaryColor }} />
                <h3 className="text-lg font-semibold mb-4 text-center">Como posso chamá-lo?</h3>
                <div className="space-y-4">
                  <Input
                    value={nameInputValue}
                    onChange={(e) => setNameInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNameSubmit();
                      }
                    }}
                    placeholder="* Nome"
                    className="w-full"
                  />
                  <Button
                    onClick={handleNameSubmit}
                    disabled={!nameInputValue.trim()}
                    className="w-full flex items-center justify-center gap-2"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Send className="h-4 w-4" />
                    Iniciar Conversa
                  </Button>
                </div>
              </div>
            )}


            {/* Chat Messages */}
            {!showWelcome && !showNameInput && (
              <>
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Bot
                        className="h-6 w-6 rounded-full flex-shrink-0"
                        style={{ color: theme.primaryColor }}
                      />
                    )}
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2 text-sm shadow-md ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      style={{
                        backgroundColor:
                          message.role === 'user'
                            ? theme.primaryColor
                            : theme.backgroundColor,
                        color:
                          message.role === 'user'
                            ? theme.backgroundColor
                            : theme.textColor,
                      }}
                    >
                      <p>{message.content}</p>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {message.role === 'user' && (
                      <User className="h-6 w-6 rounded-full flex-shrink-0" />
                    )}
                  </div>
                ))}
                
                {/* Show suggestions after welcome message */}
                {messages.length === 1 && (
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "Mais sobre Evergreen Pure",
                        "Visita Virtual",
                        "Falar com agente humano",
                        "Unidades disponíveis"
                      ].map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-left justify-start h-auto p-3 text-sm"
                          disabled={isLoading}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}

            {isCollectingPreferences && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <form onSubmit={handlePreferencesSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                      Orçamento aproximado
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={`p-2 text-sm rounded border ${
                          preferencesData.budget === '200000'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setPreferencesData(prev => ({ ...prev, budget: '200000' }))}
                      >
                        💰 100k - 200k€
                      </button>
                      <button
                        type="button"
                        className={`p-2 text-sm rounded border ${
                          preferencesData.budget === '300000'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setPreferencesData(prev => ({ ...prev, budget: '300000' }))}
                      >
                        💰 200k - 300k€
                      </button>
                      <button
                        type="button"
                        className={`p-2 text-sm rounded border ${
                          preferencesData.budget === '400000'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setPreferencesData(prev => ({ ...prev, budget: '400000' }))}
                      >
                        💰 300k - 400k€
                      </button>
                      <button
                        type="button"
                        className={`p-2 text-sm rounded border ${
                          preferencesData.budget === '500000'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setPreferencesData(prev => ({ ...prev, budget: '500000' }))}
                      >
                        💰 Acima de 400k€
                      </button>
                      <button
                        type="button"
                        className={`p-2 text-sm rounded border ${
                          preferencesData.budget === 'flexible'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setPreferencesData(prev => ({ ...prev, budget: 'flexible' }))}
                      >
                        🤔 Orçamento flexível
                      </button>
                      <button
                        type="button"
                        className={`p-2 text-sm rounded border ${
                          preferencesData.budget === 'need_advice'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setPreferencesData(prev => ({ ...prev, budget: 'need_advice' }))}
                      >
                        💡 Preciso de ajuda
                      </button>
                    </div>
                  </div>
                  {preferencesData.budget && (
                    <div>
                      <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-2">
                        Que tipologia procura?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['T0', 'T1', 'T2', 'T3', 'T4', 'Duplex'].map((typology) => (
                          <button
                            key={typology}
                            type="button"
                            className={`p-2 text-sm rounded border ${
                              preferencesData.bedrooms === typology
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setPreferencesData(prev => ({ ...prev, bedrooms: typology }))}
                          >
                            🏠 {typology}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCollectingPreferences(false);
                        setPreferencesData({ bedrooms: '', budget: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      style={{ backgroundColor: theme.primaryColor }}
                      disabled={!preferencesData.budget || !preferencesData.bedrooms}
                    >
                      Ver Unidades
                    </Button>
                  </div>
                </form>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          {!showWelcome && !showNameInput && (
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputValue);
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  disabled={isLoading}
                  className="flex-1"
                />
                
                {features.voiceInput && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVoiceInput}
                    disabled={isLoading}
                    className={isListening ? 'bg-red-100' : ''}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isLoading || !inputValue.trim()}
                  size="sm"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

    </>
  );
}


export default RagChatbot;