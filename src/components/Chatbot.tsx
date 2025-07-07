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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  const [qualificationStep, setQualificationStep] = useState("start");
  const [leadData, setLeadData] = useState<LeadQualificationData>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // This ref will be attached to the input field
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field when the sheet opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // A small delay can help
    }
  }, [isOpen]);

  // Scroll to the bottom of the messages container when a new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      // Wait for visitorId to be set
      if (!visitorTracker.visitorId) {
        // This is a simple way to wait, in a real app you might want a more robust solution
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const flatId = propFlatId || getFlatIdFromPath();
      if (flatId) {
        setMessages([
          {
            text: `Olá! Bem-vindo ao stand de vendas virtual do empreendimento Evergreen Pure. Como posso ajudar a encontrar a sua casa de sonho?`,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        await visitorTracker.trackInteraction("chatbot_impression", { flatId });
      } else {
        setMessages([
          {
            text: `Olá! Bem-vindo ao stand de vendas virtual da Viriato. Como posso ajudar?`,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        await visitorTracker.trackInteraction("chatbot_impression", {
          page: window.location.pathname,
        });
      }
    };
    initializeChat();
  }, [propFlatId]);

  const getFlatIdFromPath = () => {
    const match = pathname.match(/\/imoveis\/evergreen-pure\/(t\d+(\+\d)?)/);
    return match ? match[1] : undefined;
  };

  const calculateLeadScore = (data: LeadQualificationData): number => {
    let score = 0;
    if (data.budget_range) score += 20;
    if (data.timeline) {
      if (data.timeline === "Brevemente") score += 30;
      if (data.timeline === "Até ao final do ano") score += 20;
      if (data.timeline === "Durante os próximos dois anos") score += 10;
    }
    if (data.family_size) {
      if (data.family_size >= 2) score += 15;
    }
    if (data.financing_needs) {
      if (data.financing_needs === "Sim") score += 10;
      if (data.financing_needs === "Não") score += 5;
    }
    if (data.contact_info?.email || data.contact_info?.phone) score += 25;
    return Math.min(score, 100);
  };

  const updateVisitorData = async (data: LeadQualificationData) => {
    const score = calculateLeadScore(data);
    setLeadData(prevData => ({ ...prevData, ...data, lead_score: score }));

    try {
      await visitorTracker.trackInteraction("lead_qualification_update", {
        ...data,
        lead_score: score,
      });
    } catch (error) {
      console.error("Error updating visitor data:", error);
    }
  };

  const handleQualificationResponse = (response: string, step: string) => {
    let nextStep = "";
    let qualificationData: LeadQualificationData = {};

    switch (step) {
      case "start":
        if (response === "Sim") {
          nextStep = "ask_budget";
          setMessages(prev => [
            ...prev,
            { text: response, sender: "user", timestamp: new Date() },
            {
              text: "Qual é o seu orçamento?",
              sender: "bot",
              timestamp: new Date(),
            },
          ]);
        } else {
          setQualificationStep("done");
        }
        break;
      // ... other cases
    }

    if (Object.keys(qualificationData).length > 0) {
      updateVisitorData(qualificationData);
    }
    if (nextStep) {
      setQualificationStep(nextStep);
    }
  };

  const generateNavigationResponse = (query: string): { text: string; url?: string } | null => {
    const lowerQuery = query.toLowerCase();
    
    // Simple keyword matching for navigation
    if (lowerQuery.includes('imóveis') || lowerQuery.includes('propriedades')) {
      return { text: "Claro, a ver as nossas propriedades disponíveis...", url: '/imoveis/evergreen-pure' };
    }
    if (lowerQuery.includes('preços') || lowerQuery.includes('tabela')) {
        return { text: "A tabela de preços encontra-se no nosso website. Pode também descarregar a brochura para mais detalhes.", url: '/imoveis/evergreen-pure' };
    }
    if (lowerQuery.includes('brochura') || lowerQuery.includes('download')) {
        return { text: "Pode descarregar a brochura directamente aqui.", url: '/20250212_Viriato_Apresentacao Interativa_PT.pdf' };
    }
    if (lowerQuery.includes('mapa') || lowerQuery.includes('localização')) {
        return { text: "O nosso stand de vendas fica em Aveiro. A abrir o mapa...", url: 'https://maps.app.goo.gl/K2qC3X4Y5Z6A7B8C9' };
    }
    return null;
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      // Stop recording logic
      audioStream?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    } else {
      // Start recording logic
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          setAudioStream(stream);
          setIsRecording(true);
          // Add transcription logic here
        })
        .catch(err => console.error("Error accessing microphone:", err));
    }
  };

  const playAudio = async (text: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("Failed to convert text to speech");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | null,
    voiceInput?: string
  ) => {
    e?.preventDefault();
    const messageText = voiceInput || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await visitorTracker.trackInteraction("chatbot_message_sent", {
      message: messageText,
    });

    // Handle navigation first
    const navResponse = generateNavigationResponse(messageText);
    if (navResponse) {
        setMessages(prev => [...prev, { text: navResponse.text, sender: 'bot', timestamp: new Date() }]);
        if (navResponse.url) {
            if (navResponse.url.startsWith('http')) {
                window.open(navResponse.url, '_blank');
            } else {
                router.push(navResponse.url);
            }
        }
        setIsLoading(false);
        return;
    }


    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          flatId: propFlatId || getFlatIdFromPath(),
          visitorId: visitorTracker.visitorId,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const botMessage: Message = {
        text: data.response,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      await playAudio(data.response);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        text: "Desculpe, ocorreu um erro. Por favor, tente novamente mais tarde.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Directly call handleSubmit, creating a synthetic event if needed
    // or refactor handleSubmit to not strictly require the event.
    // For simplicity, we'll just set the input. The user can then click send.
    // A more advanced implementation could trigger the submission directly.
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
    handleSubmit(fakeEvent, suggestion);
};


  const handleBudgetSelection = (budget: string) => {
    const userMessage: Message = { text: budget, sender: "user", timestamp: new Date() };
    const botMessage: Message = { text: "Excelente. E para quando planeia a compra?", sender: "bot", timestamp: new Date() };
    setMessages(prev => [...prev, userMessage, botMessage]);
    updateVisitorData({ budget_range: budget });
    setQualificationStep("ask_timeline");
  };

  const handleTypologySelection = async (typology: string) => {
    const userMessage: Message = {
      text: `Estou interessado em ${typology}`,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          flatId: propFlatId || getFlatIdFromPath(),
          visitorId: visitorTracker.visitorId,
          context: {
            typology,
          }
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const botMessage: Message = {
        text: data.response,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        text: "Desculpe, ocorreu um erro ao processar a sua seleção.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LeadCollectionModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        flatId={propFlatId || getFlatIdFromPath()}
      />
      <Dialog open={isWelcomeOpen} onOpenChange={setIsWelcomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bem-vindo ao nosso stand de vendas virtual!</DialogTitle>
            <DialogDescription>
              Use o chatbot no canto inferior direito para tirar dúvidas, ou, se preferir, um especialista pode entrar em contacto consigo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsWelcomeOpen(false)}>Começar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="fixed bottom-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="rounded-full h-16 w-16 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform duration-300 hover:scale-110"
            >
              <MessageCircle size={32} />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
            <SheetHeader>
              <SheetTitle>Assistente Virtual</SheetTitle>
              <SheetDescription>
                Faça uma pergunta ou descreva o que procura.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "bot" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/viriato-logo.svg" alt="Viriato" />
                      <AvatarFallback>V</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-right mt-1 opacity-75">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center justify-start gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/viriato-logo.svg" alt="Viriato" />
                    <AvatarFallback>V</AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="p-2 border-t">
              <p className="text-sm font-medium mb-2">Sugestões:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSuggestionClick("Quais as tipologias disponíveis?")}>T2 ou T3?</Button>
                <Button variant="outline" size="sm" onClick={() => handleSuggestionClick("Gostaria de ver a tabela de preços")}>Preços</Button>
                <Button variant="outline" size="sm" onClick={() => handleSuggestionClick("Quero descarregar a brochura")}>Brochura</Button>
                <Button variant="outline" size="sm" onClick={() => setIsLeadModalOpen(true)}>Pedir Contacto</Button>
              </div>
            </div>

            <SheetFooter>
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 w-full"
              >
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva a sua mensagem..."
                  className="flex-grow"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    "Enviar"
                  )}
                </Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={handleVoiceInput}
                >
                  {isRecording ? <StopCircle /> : <Mic />}
                </Button>
              </form>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
} 