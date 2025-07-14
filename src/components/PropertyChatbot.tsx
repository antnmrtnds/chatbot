"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChatSession, ChatMessage, Property } from '@/lib/rag/types';
import { createChatSession, processUserMessage, getRelevantProperties } from '@/lib/rag/chatSessionManager';
import { Building2, Send, User, Bot, Home, MapPin, DollarSign, Bed, Bath, Square, Car, Trees, Wind, Sun } from 'lucide-react';
import { getVisitorId } from '@/lib/tracking';

export default function PropertyChatbot() {
  const [chatSession, setChatSession] = useState<ChatSession>(createChatSession());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get visitor ID on component mount
  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession.messages]);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !visitorId) return;
    
    setIsLoading(true);
    
    try {
      // Process the user message
      const updatedSession = await processUserMessage(chatSession, inputValue, visitorId);
      
      // Update chat session
      setChatSession(updatedSession);
      setInputValue('');
    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // Get relevant properties from context
  const relevantProperties = getRelevantProperties(chatSession);
  
  return (
    <div className="flex flex-col md:flex-row gap-4 h-[600px]">
      {/* Chat interface */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-600" />
            <span>Assistente Imobiliário</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {chatSession.messages
              .filter(msg => msg.role !== 'system')
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-teal-600 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                        : 'bg-gray-100 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                    } p-3`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 bg-teal-100">
                        <Bot className="h-4 w-4 text-teal-600" />
                      </Avatar>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-sm">{message.content}</p>
                    </div>
                    
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 bg-teal-800">
                        <User className="h-4 w-4 text-white" />
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <div className="flex w-full gap-2">
            <Input
              placeholder="Pergunte sobre os imóveis..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Property suggestions */}
      <div className="w-full md:w-80 flex flex-col">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Imóveis Relevantes</CardTitle>
          </CardHeader>
          
          <CardContent className="overflow-y-auto">
            {relevantProperties.length > 0 ? (
              <div className="space-y-4">
                {relevantProperties.map((property, index) => (
                  <PropertyCard key={index} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Pergunte sobre os imóveis para ver sugestões</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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