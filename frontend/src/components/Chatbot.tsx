"use client";

import { useState } from "react";
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
import { MessageCircle, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
          flatId: flatId,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.action === "collect_lead") {
        setIsLeadModalOpen(true);
      } else if (data.response) {
        const botMessage: Message = {
          text: data.response,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error fetching chat response:", error);
      const errorMessage: Message = {
        text: "Desculpe, ocorreu um erro. Por favor, tente novamente.",
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
        flatId={flatId}
      />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-5 right-5 rounded-full w-16 h-16 shadow-lg"
          >
            <MessageCircle size={32} />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Assistente Virtual</SheetTitle>
            <SheetDescription>
              Faça perguntas sobre os nossos imóveis.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${
                    msg.sender === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.sender === "bot" && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/viriato-logo.svg" alt="Viriato" />
                      <AvatarFallback>V</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs text-right mt-1 opacity-50">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/viriato-logo.svg" alt="Viriato" />
                    <AvatarFallback>V</AvatarFallback>
                  </Avatar>
                  <div className="max-w-xs p-3 rounded-lg bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva a sua pergunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isLoading || input.trim() === ""}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
          <SheetFooter className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Para questões urgentes: (+351) 234 840 570
            </p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
} 