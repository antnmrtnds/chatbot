'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

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
import { MessageCircle, X, Send, Mic, MicOff, User, Bot, Navigation } from 'lucide-react';

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
  pageType: 'home' | 'property' | 'listing' | 'about' | 'contact' | 'blog';
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
          visitorId,
          sessionId,
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
        onNavigate?.(data.navigationCommand.url, {
          command: data.navigationCommand.command,
          targetPage: data.navigationCommand.url,
          reason: 'user_request',
          context: data.navigationCommand.context,
        });
      }

      // Check for lead capture trigger
      if (
        features.progressiveLeadCapture &&
        !leadCaptured &&
        (messageCount + 1 >= config.leadCaptureThreshold || data.highIntent)
      ) {
        setShowLeadCapture(true);
      }

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
    
    // Track analytics
    onAnalyticsEvent?.({
      category: 'chatbot',
      action: 'start_conversation',
      label: 'welcome_flow',
    });
  }, [onAnalyticsEvent]);

  const handleNameSubmit = useCallback(() => {
    if (!nameInputValue.trim()) return;
    
    setVisitorName(nameInputValue.trim());
    setShowNameInput(false);
    setNameInputValue('');
    
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
  }, [nameInputValue, onAnalyticsEvent]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
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
          onClick={() => setIsOpen(true)}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
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

            {/* Lead Capture Form - Inline */}
            {showLeadCapture && !showWelcome && !showNameInput && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  <Bot className="h-5 w-5 mr-2" style={{ color: theme.primaryColor }} />
                  <h3 className="font-semibold text-blue-900">Gostaria de receber mais informações?</h3>
                </div>
                <form onSubmit={handleLeadFormSubmit} className="space-y-3">
                  <div>
                    <Input
                      value={leadFormData.name}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome *"
                      required
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="email"
                      value={leadFormData.email}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email *"
                      required
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <Input
                      value={leadFormData.phone}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Telefone"
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <select
                      value={leadFormData.budget}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="">Orçamento (opcional)</option>
                      <option value="<200k">Até €200.000</option>
                      <option value="200k-400k">€200.000 - €400.000</option>
                      <option value="400k-600k">€400.000 - €600.000</option>
                      <option value=">600k">Mais de €600.000</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="marketing-inline"
                      checked={leadFormData.marketingConsent}
                      onChange={(e) => setLeadFormData(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                      className="text-sm"
                    />
                    <label htmlFor="marketing-inline" className="text-xs text-gray-600">
                      Aceito receber comunicações de marketing
                    </label>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button
                      type="submit"
                      className="flex-1 text-sm py-2"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      Enviar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowLeadCapture(false)}
                      className="text-sm py-2"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Chat Messages */}
            {!showWelcome && !showNameInput && (
              <>
                {/* Show suggestions after welcome message */}
                {messages.length === 1 && !showLeadCapture && (
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
              </>
            )}

            {!showWelcome && !showNameInput && messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                  style={
                    message.role === 'user'
                      ? { backgroundColor: theme.primaryColor }
                      : {}
                  }
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      {message.metadata?.ragSources && (
                        <div className="mt-2 text-xs opacity-75">
                          <p>Fontes: {message.metadata.ragSources.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input - Only show after onboarding */}
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