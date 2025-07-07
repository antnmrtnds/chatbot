"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Loader2, Mic, StopCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import visitorTracker from "@/lib/visitorTracker";

type Message = {
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
};

type LeadQualificationData = {
  budget_range?: string;
  timeline?: string;
  family_size?: number;
  financing_needs?: string;
  lead_score?: number;
  contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

interface ChatbotProps {
  flatId?: string;
}

function LeadCollectionModal({
  isOpen,
  onClose,
  flatId,
}: {
  isOpen: boolean;
  onClose: () => void;
  flatId?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [purchaseTimeframe, setPurchaseTimeframe] = useState("Brevemente");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          flatId,
          purchaseTimeframe,
          visitorId: visitorTracker.visitorId,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit lead");

      // Link the visitor with their email for future tracking
      await visitorTracker.linkVisitorWithEmail(email);

      setSubmitStatus("success");
      setTimeout(() => {
        onClose();
        // Reset form after a delay
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        setPurchaseTimeframe("Brevemente");
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleLeadSubmit}>
          <DialogHeader>
            <DialogTitle>Pedido de Contacto</DialogTitle>
            <DialogDescription>
              Não encontrou a resposta que procurava? Deixe os seus dados e um
              especialista entrará em contacto consigo brevemente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="name"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="phone"
              placeholder="Telefone / WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div>
              <label
                htmlFor="purchase-timeframe"
                className="text-sm font-medium"
              >
                Quando pensa comprar/investir?
              </label>
              <select
                id="purchase-timeframe"
                value={purchaseTimeframe}
                onChange={(e) => setPurchaseTimeframe(e.target.value)}
                className="mt-2 file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              >
                <option value="Brevemente">Brevemente</option>
                <option value="Até ao final do ano">
                  Até ao final do ano
                </option>
                <option value="Durante os próximos dois anos">
                  Durante os próximos dois anos
                </option>
                <option value="Só preciso de informação por agora">
                  Só preciso de informação por agora
                </option>
              </select>
            </div>
            <Textarea
              id="message"
              placeholder="A sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <a
              href="/20250212_Viriato_Apresentacao Interativa_PT.pdf"
              target="_blank"
              download
            >
              <Button type="button" variant="outline">
                Descarregar Brochura
              </Button>
            </a>
            {submitStatus === "success" ? (
              <p className="text-green-600">
                Obrigado! Entraremos em contacto em breve.
              </p>
            ) : submitStatus === "error" ? (
              <p className="text-red-600">Erro ao enviar. Tente novamente.</p>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "A Enviar..." : "Pedir Contacto"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Chatbot({ flatId: propFlatId }: ChatbotProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract flatId from URL if not provided as prop
  const getFlatIdFromPath = () => {
    if (propFlatId) return propFlatId;
    const match = pathname.match(/\/imoveis\/evergreen-pure\/([^\/]+)/);
    return match ? match[1] : undefined;
  };
  
  const flatId = getFlatIdFromPath();
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadData, setLeadData] = useState<LeadQualificationData>({});
  const [qualificationStep, setQualificationStep] = useState<string | null>(null);
  const [apartmentQualification, setApartmentQualification] = useState<{
    budget?: string;
    typology?: string;
    step?: 'budget' | 'typology' | 'complete';
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

  useEffect(() => {
    if (!isSheetOpen) {
      // Stop microphone and audio stream when panel closes
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      setIsRecording(false);
    }
  }, [isSheetOpen, isRecording, audioStream]);

  useEffect(() => {
    // Scroll to the bottom of the messages container
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Display welcome message when the component mounts
    setMessages([
      {
        text: "Olá! Sou o seu assistente virtual. Como posso ajudá-lo a encontrar a sua casa de sonho?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Calculate lead score based on collected data
  const calculateLeadScore = (data: LeadQualificationData): number => {
    let score = 0;
    
    // Budget scoring (40% of total score)
    if (data.budget_range) {
      const budgetScores: { [key: string]: number } = {
        'under_200k': 20,
        '200k_300k': 35,
        '300k_400k': 40,
        'over_400k': 40,
        'no_budget': 10
      };
      score += budgetScores[data.budget_range] || 0;
    }
    
    // Timeline scoring (30% of total score)
    if (data.timeline) {
      const timelineScores: { [key: string]: number } = {
        'immediately': 30,
        'within_3_months': 25,
        'within_6_months': 20,
        'within_year': 15,
        'just_looking': 5
      };
      score += timelineScores[data.timeline] || 0;
    }
    
    // Family size scoring (10% of total score)
    if (data.family_size) {
      score += data.family_size > 2 ? 10 : 5;
    }
    
    // Financing needs scoring (20% of total score)
    if (data.financing_needs) {
      const financingScores: { [key: string]: number } = {
        'cash_buyer': 20,
        'pre_approved': 15,
        'need_mortgage': 10,
        'need_help': 5
      };
      score += financingScores[data.financing_needs] || 0;
    }
    
    return Math.min(score, 100);
  };

  // Store visitor data in Supabase
  const updateVisitorData = async (data: LeadQualificationData) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: visitorTracker.visitorId,
          leadData: data,
          leadScore: calculateLeadScore(data),
          flatId: flatId
        })
      });
      
      if (!response.ok) {
        console.error('Failed to update visitor data');
      }
    } catch (error) {
      console.error('Error updating visitor data:', error);
    }
  };

  // Handle qualification questions
  const handleQualificationResponse = (response: string, step: string) => {
    const updatedData = { ...leadData };
    
    switch (step) {
      case 'budget':
        updatedData.budget_range = response;
        break;
      case 'timeline':
        updatedData.timeline = response;
        break;
      case 'family_size':
        updatedData.family_size = parseInt(response) || 1;
        break;
      case 'financing':
        updatedData.financing_needs = response;
        break;
    }
    
    setLeadData(updatedData);
    updateVisitorData(updatedData);
    setQualificationStep(null);
  };

  // Generate navigation response based on query
  const generateNavigationResponse = (query: string): { text: string; url?: string } | null => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('apartamento') || lowerQuery.includes('disponível')) {
      return {
        text: "A redirecioná-lo para a nossa página de apartamentos... Por favor, aguarde.",
        url: "/imoveis/evergreen-pure"
      };
    }
    
    if (lowerQuery.includes('contacto') || lowerQuery.includes('telefone')) {
      return {
        text: "Pode contactar-nos através do telefone (+351) 234 840 570 ou email info@viriato.pt. Também pode preencher o formulário de contacto para que entremos em contacto consigo.",
      };
    }
    
    if (lowerQuery.includes('sobre') || lowerQuery.includes('empresa')) {
      return {
        text: "A redirecioná-lo para a nossa página 'Sobre Nós'...",
        url: "/sobre"
      };
    }
    
    return null;
  };

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "pt-PT";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSubmit(null, transcript); // Pass transcript directly
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      audioStream?.getTracks().forEach(track => track.stop());
      setAudioStream(null);
      setIsRecording(false);
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setAudioStream(stream);
          setIsRecording(true);
          recognitionRef.current?.start();
        })
        .catch(err => {
          console.error("Error getting user media", err);
        });
    }
  };

  const playAudio = async (text: string) => {
    setIsPlaying(true);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert text to speech');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setAudioPlayer(audio);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error(error);
      setIsPlaying(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | null,
    voiceInput?: string
  ) => {
    if (e) e.preventDefault();
    const messageText = voiceInput || input;
    if (!messageText.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { text: messageText, sender: "user", timestamp: new Date() },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Check if this is a qualification response
      if (qualificationStep) {
        handleQualificationResponse(messageText, qualificationStep);
      }

      // Check for navigation queries first
      const navigationResponse = generateNavigationResponse(messageText);
      if (navigationResponse) {
        setMessages((prev) => [
          ...prev,
          {
            text: navigationResponse.text,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        if (navigationResponse.url) {
          setTimeout(() => {
            router.push(navigationResponse.url as string);
            setIsSheetOpen(false); // Close the sheet on redirect
          }, 1500); // Wait 1.5 seconds before redirecting
        }
        
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ text: m.text, sender: m.sender })),
          flatId: flatId,
          visitorId: visitorTracker.visitorId,
          leadData: leadData,
          leadScore: calculateLeadScore(leadData)
        }),
      });

      const botResponse = await response.json();
      let botMessageText = botResponse.response;

      // Check if bot wants to qualify lead
      if (botResponse.qualification_step) {
        setQualificationStep(botResponse.qualification_step);
      }

      if (botMessageText.includes("[LEAD_FORM]")) {
        setIsLeadModalOpen(true);
      } else {
        await playAudio(botMessageText);
      }

      setMessages((prev) => [
        ...prev,
        {
          text: botMessageText.replace("[LEAD_FORM]", " "),
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Desculpe, ocorreu um erro de comunicação. Por favor, tente novamente mais tarde.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessages((prev) => [
      ...prev,
      { text: suggestion, sender: "user", timestamp: new Date() },
    ]);
    setInput("");
    
    // Special handling for "Ver apartamentos disponíveis"
    if (suggestion.includes('Ver apartamentos disponíveis')) {
      setApartmentQualification({ step: 'budget' });
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            text: "Perfeito! Para lhe mostrar os apartamentos mais adequados, preciso de saber algumas preferências.\n\nQual é o seu orçamento aproximado?",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }, 500);
      return;
    }
    
    setIsLoading(true);
    handleSubmit(null, suggestion);
  };

  const handleBudgetSelection = (budget: string) => {
    const updatedQualification = { ...apartmentQualification, budget, step: 'typology' as const };
    setApartmentQualification(updatedQualification);
    
    setMessages((prev) => [
      ...prev,
      { text: budget, sender: "user", timestamp: new Date() },
      {
        text: "Excelente! Agora, que tipologia procura?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  };

  const handleTypologySelection = async (typology: string) => {
    const updatedQualification = { 
      ...apartmentQualification, 
      typology, 
      step: 'complete' as const 
    };
    setApartmentQualification(updatedQualification);
    
    setMessages((prev) => [
      ...prev,
      { text: typology, sender: "user", timestamp: new Date() },
      {
        text: "Perfeito! A guardar as suas preferências e a redirecioná-lo para os apartamentos que correspondem aos seus critérios...",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);

    // Update visitor profile with preferences
    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: visitorTracker.visitorId,
          leadData: {
            ...leadData,
            apartment_preferences: {
              budget: updatedQualification.budget,
              typology: updatedQualification.typology,
              search_date: new Date().toISOString()
            }
          },
          leadScore: calculateLeadScore({
            ...leadData,
            budget_range: updatedQualification.budget === '< 300k' ? 'under_300k' : '300k_400k'
          }),
          flatId: flatId
        })
      });
    } catch (error) {
      console.error('Error updating visitor preferences:', error);
    }

    // Redirect to filtered listings after 2 seconds
    setTimeout(() => {
      const budgetParam = updatedQualification.budget === '< 300k' ? 'under_300k' : 'under_400k';
      const typologyParam = updatedQualification.typology;
      router.push(`/imoveis/evergreen-pure?budget=${budgetParam}&typology=${typologyParam}`);
      setIsSheetOpen(false);
      setApartmentQualification({});
    }, 2000);
  };

  return (
    <>
      <Dialog open={isWelcomeModalOpen} onOpenChange={setIsWelcomeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bem-vindo!</DialogTitle>
            <DialogDescription>
              Olá! Sou o seu assistente virtual. Como posso ajudá-lo a encontrar a sua casa de sonho?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsWelcomeModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-4 right-4 z-50 h-16 w-16 rounded-full shadow-lg"
          >
            <MessageCircle size={32} />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Assistente Virtual</SheetTitle>
            <SheetDescription>
              Pergunte-me qualquer coisa sobre este imóvel.
            </SheetDescription>
          </SheetHeader>
          <div className="flex justify-center my-2">
          </div>
          <div className="flex-grow overflow-y-auto pt-2 pb-4 px-4 space-y-2">
            {messages.filter(m => m.sender === 'user').length === 0 && !apartmentQualification.step && (
              <div className="mb-6">
                <div className="bg-muted text-gray-900 rounded-lg p-4 mb-4 shadow">
                  <p className="text-base whitespace-pre-line">
                    Olá! Descobriu o projeto perfeito? 🏡
                    {"\n\n"}
                    Sou especialista nos nossos novos condomínios em Aveiro e posso ajudá-lo com tudo - desde características dos apartamentos até opções de financiamento.
                    {"\n\n"}
                    Como posso ajudar hoje?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="px-3 py-2 rounded bg-primary text-white text-sm hover:bg-primary/80 transition" onClick={() => handleSuggestionClick('🏠 Ver apartamentos disponíveis')}>
                    🏠 Ver apartamentos disponíveis
                  </button>
                  <button type="button" className="px-3 py-2 rounded bg-primary text-white text-sm hover:bg-primary/80 transition" onClick={() => handleSuggestionClick('📅 Agendar visita virtual/presencial')}>
                    📅 Agendar visita virtual/presencial
                  </button>
                  <button type="button" className="px-3 py-2 rounded bg-primary text-white text-sm hover:bg-primary/80 transition" onClick={() => handleSuggestionClick('💰 Opções de financiamento')}>
                    💰 Opções de financiamento
                  </button>
                  <button type="button" className="px-3 py-2 rounded bg-primary text-white text-sm hover:bg-primary/80 transition" onClick={() => handleSuggestionClick('📍 Localização e comodidades')}>
                    📍 Localização e comodidades
                  </button>
                </div>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  msg.sender === "user" ? "justify-end" : ""
                }`}
              >
                {msg.sender === "bot" && (
                  <Avatar>
                    <AvatarImage src="/viriato-logo.svg" />
                    <AvatarFallback>V</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  <p className="text-xs text-right mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {msg.sender === "user" && (
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src="/viriato-logo.svg" />
                  <AvatarFallback>V</AvatarFallback>
                </Avatar>
                <div className="max-w-xs rounded-lg px-4 py-2 bg-muted">
                  <Loader2 className="animate-spin" />
                </div>
              </div>
            )}

            {/* Budget Selection */}
            {apartmentQualification.step === 'budget' && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button" 
                    className="px-4 py-3 rounded bg-primary text-white text-sm hover:bg-primary/80 transition"
                    onClick={() => handleBudgetSelection('< 300k')}
                  >
                    💰 Até 300.000€
                  </button>
                  <button 
                    type="button" 
                    className="px-4 py-3 rounded bg-primary text-white text-sm hover:bg-primary/80 transition"
                    onClick={() => handleBudgetSelection('< 400k')}
                  >
                    💰 Até 400.000€
                  </button>
                </div>
              </div>
            )}
            
            {/* Typology Selection */}
            {apartmentQualification.step === 'typology' && (
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {['T0', 'T1', 'T2', 'T3', 'T4', 'Duplex'].map((typology) => (
                    <button 
                      key={typology}
                      type="button" 
                      className="px-3 py-2 rounded bg-primary text-white text-sm hover:bg-primary/80 transition"
                      onClick={() => handleTypologySelection(typology)}
                    >
                      🏠 {typology}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          <SheetFooter>
            {!apartmentQualification.step && (
              <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva a sua mensagem..."
                  className="flex-grow"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                >
                  {isRecording ? <StopCircle /> : <Mic />}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Enviar"}
                </Button>
              </form>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <LeadCollectionModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        flatId={flatId}
      />
      <style jsx global>{`
        @keyframes chatbot-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 #11182744; }
          50% { transform: scale(1.08); box-shadow: 0 0 16px 8px #11182788; }
        }
        .animate-chatbot-pulse {
          animation: chatbot-pulse 4s cubic-bezier(0.4,0,0.2,1) infinite;
          animation-delay: 1s;
        }
        .chatbot-float-btn {
          transition: box-shadow 150ms cubic-bezier(0.4,0,0.2,1), transform 150ms cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 24px 0 #111827;
        }
        .chatbot-float-btn:hover, .chatbot-float-btn-hover {
          box-shadow: 0 0 24px 6px rgba(0, 123, 255, 0.25), 0 2px 8px rgba(0,0,0,0.10);
          transform: scale(1.05);
        }
      `}</style>
    </>
  );
} 