"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ChatSession, ChatMessage } from '@/lib/rag/types';
import { createChatSession, processUserMessage } from '@/lib/rag/chatSessionManager';
import { 
  Building2, Send, User, Bot, X, MessageCircle, Mic, Volume2, VolumeX, Phone 
} from 'lucide-react';
import * as gtag from '@/lib/gtag';
import { getVisitorId, trackEvent } from '@/lib/tracking';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';

export default function FloatingChatbot() {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    const initializeChat = async () => {
      if (chatSession) {
        return;
      }
      setIsLoading(true);
      const id = getVisitorId();
      setVisitorId(id);

      try {
        const response = await fetch(`/api/chat?visitorId=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setChatSession({
              messages: data.messages,
              sessionId: data.sessionId,
              context: { relevantProperties: [] },
            });
          } else {
            setChatSession(createChatSession());
          }
        } else {
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
  }, [chatSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession?.messages]);
  
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
    
    try {
      const updatedSession = await processUserMessage(chatSession, message, visitorId);
      
      setChatSession(updatedSession);
      
      const lastMessage = updatedSession.messages[updatedSession.messages.length - 1];
      if (lastMessage.role === 'assistant') {
        playAudio(lastMessage.content);
      }

      setInputValue('');
    } catch (error) {
      console.error('FloatingChatbot: Error processing message:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
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
              href="https://wa.me/14155238886?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20im%C3%B3veis."
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
      
      {isOpen && (
        <Card className="w-[350px] md:w-[400px] h-[500px] flex flex-col bg-slate-900/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
          <CardHeader className="border-b border-white/20 py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium flex items-center text-white">
              <Building2 className="h-4 w-4 text-white mr-2" />
              Assistente Imobiliário
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-300 hover:text-white"
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              >
                {isTtsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-300 hover:text-white"
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
          
          <CardContent className="flex-1 overflow-y-auto p-4 relative [mask-image:linear-gradient(to_bottom,transparent,black_2rem)]">
            <div className="space-y-4">
              {chatSession ? (
                chatSession.messages.map((message, index) => (
                  <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 bg-white/20 flex-shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                      </Avatar>
                    )}
                    <div className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-teal-500/80 text-white'
                        : 'bg-white/10 text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 bg-white/20 flex-shrink-0">
                        <User className="h-5 w-5 text-white" />
                      </Avatar>
                    )}
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-white/20 animate-pulse"></div>
                      <div className="h-4 w-1/2 rounded bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1 space-y-2 items-end">
                      <div className="h-4 w-3/4 rounded bg-white/20 animate-pulse ml-auto"></div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              )}

              {isLoading && chatSession && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 bg-white/20 flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </Avatar>
                  <div className="rounded-lg px-3 py-2 bg-white/10">
                    <div className="flex items-center space-x-1">
                      <span className="h-2 w-2 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-white/70 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          
          {chatSession && (
            <CardFooter className="border-t border-white/20 p-4">
              <div className="w-full flex items-center space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva a sua mensagem..."
                  className="flex-1 bg-black/20 border-white/20 placeholder:text-gray-300 text-white rounded-lg"
                  disabled={isLoading}
                />
                {isAvailable && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`h-9 w-9 bg-black/20 border-white/20 text-white hover:bg-black/40 hover:text-white ${isListening ? 'bg-red-500/50' : ''}`}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={() => handleSendMessage()} disabled={isLoading} size="icon" className="h-9 w-9 bg-black/20 border-white/20 text-white hover:bg-black/40">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      )}
      <audio ref={audioRef} />
    </div>
  );
}