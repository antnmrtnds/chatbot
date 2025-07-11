'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Mic, MicOff, User, Bot } from 'lucide-react';

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

// Simplified interfaces
interface SimpleMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface SimpleApartmentChatbotProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function SimpleApartmentChatbot({
  position = 'bottom-right',
}: SimpleApartmentChatbotProps) {
  // State - only essential variables
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apartmentId, setApartmentId] = useState<string>('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if we're on an apartment page and extract apartment ID
  const checkApartmentPage = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const currentUrl = window.location.pathname;
    const flatPageRegex = /\/imoveis\/evergreen-pure\/([A-Z]\d+)$/;
    const match = currentUrl.match(flatPageRegex);
    
    if (match) {
      setApartmentId(match[1]);
      return true;
    }
    return false;
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
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
  }, []);

  // Initialize default message when opening
  const initializeChat = useCallback(() => {
    if (messages.length === 0) {
      const defaultMessage: SimpleMessage = {
        id: 'default-msg',
        content: 'O que gostaria de saber sobre este apartamento?',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages([defaultMessage]);
    }
  }, [messages.length]);

  // Handle opening chatbot
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    initializeChat();
  }, [initializeChat]);

  // Handle sending message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: SimpleMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call simplified apartment chat API
      const response = await fetch('/api/apartment-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content.trim(),
          apartmentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: SimpleMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: SimpleMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, apartmentId]);

  // Handle voice input
  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current || isListening) return;

    setIsListening(true);
    recognitionRef.current.start();
  }, [isListening]);

  // Handle suggestion button clicks
  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Don't render if not on apartment page
  if (!checkApartmentPage()) {
    return null;
  }

  return (
    <>
      {/* Floating Widget Button */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className={`fixed ${positionClasses[position]} z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white`}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <Card className={`fixed ${positionClasses[position]} z-50 w-96 h-[500px] shadow-2xl flex flex-col bg-white`}>
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Apartamento {apartmentId}</CardTitle>
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
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Bot className="h-6 w-6 text-blue-600 flex-shrink-0" />
                )}
                <div
                  className={`max-w-xs rounded-lg px-3 py-2 text-sm shadow-md ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <User className="h-6 w-6 text-gray-600 flex-shrink-0" />
                )}
              </div>
            ))}
            
            {/* Show suggestion buttons after initial message */}
            {messages.length === 1 && (
              <div className="space-y-2 mt-4">
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Area das divisoes",
                    "estado da obra",
                    "acabamentos"
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-left justify-start h-auto p-3 text-sm hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-pulse">●</div>
                <div className="animate-pulse animation-delay-200">●</div>
                <div className="animate-pulse animation-delay-400">●</div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceInput}
                disabled={isLoading}
                className={`${isListening ? 'bg-red-100 text-red-600' : ''}`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

export default SimpleApartmentChatbot;