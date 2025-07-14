"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChatSession, ChatMessage, Property } from '@/lib/rag/types';
import { createChatSession, processUserMessage, getRelevantProperties } from '@/lib/rag/chatSessionManager';
import { 
  Building2, Send, User, Bot, Home, MapPin, DollarSign, Bed, Bath, Square, X, MessageCircle, ChevronDown, ChevronUp, Car, Wind, Sun, Mic, Volume2, VolumeX, Phone 
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import * as gtag from '@/lib/gtag';
import { getVisitorId, trackEvent } from '@/lib/tracking'; // Import trackEvent
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';

export default function FloatingChatbot() {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null); // Start with null
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [visitorId, setVisitorId] = useState<string>('');
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleTranscript = (transcript: string) => {
    if (transcript) {
      handleSendMessage(transcript);
    }
  };

  const { isListening, isAvailable, toggleListening } = useSpeechRecognition({
    onTranscript: handleTranscript,
  });

  const playAudio = async (text: string) => {
    if (!isTtsEnabled || !text) return;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      } else {
        console.error('TTS API request failed');
      }
    } catch (error) {
      console.error('Error playing TTS audio:', error);
    }
  };

  // Get visitor ID and fetch chat history on component mount
  useEffect(() => {
    const initializeChat = async () => {
      // Only initialize if there is no active session
      if (chatSession) {
        return;
      }
      setIsLoading(true);
      const id = getVisitorId();
      setVisitorId(id);

      try {
        const response = await fetch(`/api/chat/history?visitorId=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            // History found, load it
            setChatSession({
              messages: data.messages,
              sessionId: data.sessionId,
              context: { relevantProperties: [] },
            });
          } else {
            // No history, create a new session
            setChatSession(createChatSession());
          }
        } else {
          // API error, create a new session as a fallback
          console.error('Failed to fetch chat history');
          setChatSession(createChatSession());
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        setChatSession(createChatSession());
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [chatSession]); // Add chatSession to dependency array

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession?.messages]);
  
  // Handle sending a message
  const handleSendMessage = async (message: string = inputValue) => {
    if (!message.trim() || isLoading || !visitorId || !chatSession) return;
    
    trackEvent({
      eventName: 'chatbot_message_sent',
      details: { message_content: message }
    });

    gtag.event({
      action: 'send_message',
      category: 'chatbot',
      label: message,
      value: 1,
    });
    
    setIsLoading(true);
    
    console.log('FloatingChatbot: Sending message:', message);
    try {
      // Process the user message, now passing the visitorId
      const updatedSession = await processUserMessage(chatSession, message, visitorId);
      
      // Update chat session
      setChatSession(updatedSession);
      
      // Play TTS for the latest assistant message
      const lastMessage = updatedSession.messages[updatedSession.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        playAudio(lastMessage.content);
      }

      setInputValue('');
      setShowSuggestions(false);
      console.log('FloatingChatbot: Message sent and session updated.');
    } catch (error) {
      console.error('FloatingChatbot: Error processing message:', error);
    } finally {
      setIsLoading(false);
      console.log('FloatingChatbot: Loading state reset.');
    }
  };
  
  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // Get relevant properties from context
  const relevantProperties = chatSession ? getRelevantProperties(chatSession) : [];
  
  // Example questions
  const exampleQuestions = [
    "Que apartamentos T2 existem?",
    "Mostra-me apartamentos com terraço",
    "Quais os apartamentos abaixo de 200.000€?",
    "Fala-me sobre o projeto Evergreen Pure"
  ];
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {/* Floating button */}
      {!isOpen && (
        <div className="flex flex-col items-end space-y-2">
            <Button
              onClick={() => {
                setIsOpen(true);
                trackEvent({ eventName: 'chatbot_opened' });
                gtag.event({
                  action: 'open_chatbot',
                  category: 'chatbot',
                  label: 'Floating Chatbot Opened',
                  value: 1,
                });
              }}
              className="h-14 w-14 rounded-full bg-teal-600 hover:bg-teal-700 shadow-lg"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
            <a 
              href="https://wa.me/14155238886"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent({ eventName: 'whatsapp_icon_clicked' })}
            >
              <div className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
            </a>
        </div>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <Card className="w-[350px] md:w-[400px] h-[500px] shadow-xl flex flex-col">
          <CardHeader className="border-b py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building2 className="h-4 w-4 text-teal-600 mr-2" />
              Assistente Imobiliário
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              >
                {isTtsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setIsOpen(false);
                  trackEvent({ 
                    eventName: 'chatbot_closed',
                    details: { messages_exchanged: chatSession?.messages.length ?? 0 }
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {!isLoading && chatSession && chatSession.messages.length <= 1 && (
                <div className="text-center py-4">
                  <Avatar className="h-12 w-12 mx-auto mb-2 bg-teal-100">
                    <Bot className="h-6 w-6 text-teal-600" />
                  </Avatar>
                  <p className="text-sm font-medium mb-1">Assistente Imobiliário</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Pergunte-me sobre os nossos imóveis, preços ou disponibilidade
                  </p>
                </div>
              )}
              
              {!isLoading && chatSession?.messages
                .filter(msg => msg.role !== 'system')
                .map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-3 max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-teal-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                          : 'bg-gray-100 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                      } p-3`}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-6 w-6 bg-teal-100">
                          <Bot className="h-3 w-3 text-teal-600" />
                        </Avatar>
                      )}
                      
                      <div className="space-y-1">
                        <p className="text-xs">{message.content}</p>
                      </div>
                      
                      {message.role === 'user' && (
                        <Avatar className="h-6 w-6 bg-teal-800">
                          <User className="h-3 w-3 text-white" />
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
              
              {/* Example questions */}
              {!isLoading && chatSession && chatSession.messages.length <= 1 && showSuggestions && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs text-gray-500 text-center">Experimente perguntar:</p>
                  {exampleQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left text-xs h-auto py-2 px-3"
                      onClick={() => handleSendMessage(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              )}
              
              {isLoading && (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">O assistente está a escrever...</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          
          <CardFooter className="border-t p-3">
            <div className="flex w-full gap-2">
              <Input
                placeholder="Escreva a sua mensagem..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1 text-sm h-9"
              />
              {isAvailable && (
                <Button
                  onClick={toggleListening}
                  size="icon"
                  variant={isListening ? 'destructive' : 'outline'}
                  className="h-9 w-9 p-0"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 h-9 w-9 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
          <audio ref={audioRef} className="hidden" />
          
          {/* Property suggestions */}
          {relevantProperties.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mx-3 mb-3 text-xs flex items-center justify-center gap-1 border-teal-200 text-teal-700 bg-teal-50"
                >
                  <Home className="h-3 w-3" />
                  <span>{relevantProperties.length} Imóveis Relevantes</span>
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[400px] px-4 py-6">
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-medium">Imóveis Relevantes</h3>
                  <p className="text-sm text-gray-500">
                    Propriedades que correspondem aos seus critérios
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[300px] pr-2">
                  {relevantProperties.map((property, index) => (
                    <PropertyCard key={index} property={property} />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </Card>
      )}
    </div>
  );
}

// Property card component
function PropertyCard({ property }: { property: Property }) {
  const formatPrice = (price?: number) => {
    if (!price) return 'Preço sob consulta';
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-32 bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <Home className="h-12 w-12 text-gray-300" />
        </div>
        
        {property.flat_id && (
          <Badge className="absolute top-2 left-2 bg-teal-600">
             {property.flat_id.replace(/_/g, ' ').replace('flat ', 'Flat ')}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="space-y-2">
          {property.location && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{property.location}</span>
            </div>
          )}
          
          <div className="flex items-center font-bold text-lg">
            <span>{formatPrice(property.price)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
            {property.typology && (
              <div className="flex items-center">
                <Bed className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
                <span>{property.typology}</span>
              </div>
            )}
            {property.floor_level && (
              <div className="flex items-center">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
                <span className="capitalize">{property.floor_level}</span>
              </div>
            )}
            {property.outdoor_space && (
              <div className="flex items-center">
                <Sun className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
                <span className="capitalize">{property.outdoor_space} ({property.outdoor_area_sqm}m²)</span>
              </div>
            )}
            {property.position && (
              <div className="flex items-center">
                <Wind className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
                <span className="capitalize">{property.position}</span>
              </div>
            )}
             {property.parking && (
              <div className="flex items-center">
                <Car className="h-3.5 w-3.5 mr-1.5 text-teal-600" />
                <span>Garagem</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}