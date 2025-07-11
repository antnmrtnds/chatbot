'use client';

import { Suspense } from 'react';
import HeroSection from "@/components/HeroSection";
import FeaturedProperties from "@/components/FeaturedProperties";
import CtaSection from "@/components/CtaSection";
import RagChatbot from '@/components/RagChatbot';
import { usePageContext } from '@/lib/pageContextManager';

function HomeContent() {
  const { context } = usePageContext();

  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturedProperties />
      <CtaSection />
      <RagChatbot
        pageContext={context}
        visitorId={`visitor-${Date.now()}`}
        sessionId={`session-${Date.now()}`}
        features={{
          ragEnabled: true,
          contextAwareness: true,
          progressiveLeadCapture: true,
          voiceInput: true,
          navigationCommands: true,
        }}
        onLeadCapture={(leadData) => {
          console.log('Lead captured on home page:', leadData);
          // Send to your CRM or analytics
        }}
        onAnalyticsEvent={(event) => {
          console.log('Analytics event on home page:', event);
          // Send to your analytics platform
        }}
        onNavigate={(url, navContext) => {
          console.log('Navigation requested:', url, navContext);
          window.location.href = url;
        }}
        position="bottom-right"
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="flex-1">
        <HeroSection />
        <FeaturedProperties />
        <CtaSection />
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
