"use client";

import { useState, useEffect, useRef } from "react";
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
import SiriWaveform from './SiriWaveform';

type Message = {
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
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

export default function Chatbot({ flatId }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: flatId
        ? `Olá! Sou o assistente virtual para o apartamento ${flatId}. Como posso ajudar?`
        : "Olá! Sou o assistente virtual da Viriato. Como posso ajudar?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ text: m.text, sender: m.sender })),
          flatId: flatId,
          visitorId: visitorTracker.visitorId,
        }),
      });

      const botResponse = await response.json();
      const botMessageText = botResponse.response;

      if (botMessageText.includes("[LEAD_FORM]")) {
        setIsLeadModalOpen(true);
      } else {
        await playAudio(botMessageText);
      }

      setMessages((prev) => [
        ...prev,
        {
          text: botMessageText.replace(
            "[LEAD_FORM]",
            " "
          ),
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

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-4 right-4 z-50 h-16 w-16 rounded-full shadow-lg">
            <MessageCircle size={32} />
          </Button>
        </SheetTrigger>
        <SheetContent
          className="flex flex-col"
          side="right"
          style={{ width: "400px" }}
        >
          <SheetHeader>
            <SheetTitle>Assistente Virtual</SheetTitle>
            <SheetDescription>
              Pergunte-me qualquer coisa sobre este imóvel.
            </SheetDescription>
          </SheetHeader>
          <div className="flex justify-center my-2">
            <SiriWaveform audioStream={audioStream} isPlaying={isRecording || isPlaying} />
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
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
                  <p className="text-sm">{msg.text}</p>
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
            <div ref={messagesEndRef} />
          </div>
          <SheetFooter>
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
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <LeadCollectionModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        flatId={flatId}
      />
    </>
  );
} 