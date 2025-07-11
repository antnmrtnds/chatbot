import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AppTracker from "@/components/AppTracker";
import RagChatbot from "@/components/RagChatbot";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Viriato - Imobiliária em Aveiro",
  description: "Encontre o seu imóvel ideal em Aveiro com a Viriato. Apartamentos, moradias e escritórios para venda e arrendamento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Suspense fallback={null}>
          <AppTracker />
        </Suspense>
        <RagChatbot
          pageContext={{
            url: typeof window !== 'undefined' ? window.location.pathname : '/',
            pageType: 'general',
            semanticId: 'global_chatbot',
            title: 'Viriato - Assistente Virtual',
          }}
          visitorId={`visitor-${Date.now()}`}
          sessionId={`session-${Date.now()}`}
          features={{
            ragEnabled: true,
            contextAwareness: true,
            progressiveLeadCapture: true,
            voiceInput: true,
            navigationCommands: true,
          }}
          position="bottom-right"
        />
      </body>
    </html>
  );
}
