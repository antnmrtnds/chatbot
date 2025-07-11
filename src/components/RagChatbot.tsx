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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [messageCount, setMessageCount] = useState(0);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [currentContext, setCurrentContext] = useState<PageContext | null>(pageContext || null);

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
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Olá! Como posso ajudá-lo hoje?</p>
                {currentContext?.pageType === 'property' && (
                  <p className="text-sm mt-2">
                    Vejo que está a ver uma propriedade. Posso ajudar com informações específicas!
                  </p>
                )}
              </div>
            )}

            {messages.map((message) => (
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

          {/* Input */}
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
        </Card>
      )}

      {/* Lead Capture Modal */}
      <Dialog open={showLeadCapture} onOpenChange={setShowLeadCapture}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gostaria de receber mais informações?</DialogTitle>
          </DialogHeader>
          <LeadCaptureForm onSubmit={handleLeadCapture} onCancel={() => setShowLeadCapture(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Lead Capture Form Component
function LeadCaptureForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Partial<LeadCaptureData>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    propertyType: '',
    timeline: '',
    marketingConsent: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Telefone</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Orçamento</label>
        <select
          value={formData.budget}
          onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Selecione...</option>
          <option value="<200k">Até €200.000</option>
          <option value="200k-400k">€200.000 - €400.000</option>
          <option value="400k-600k">€400.000 - €600.000</option>
          <option value=">600k">Mais de €600.000</option>
        </select>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="marketing"
          checked={formData.marketingConsent}
          onChange={(e) => setFormData(prev => ({ ...prev, marketingConsent: e.target.checked }))}
        />
        <label htmlFor="marketing" className="text-sm">
          Aceito receber comunicações de marketing
        </label>
      </div>
      
      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">
          Enviar
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export default RagChatbot;