'use client';

import { Suspense } from 'react';
import HeroSection from "@/components/HeroSection";
import FeaturedProperties from "@/components/FeaturedProperties";
import CtaSection from "@/components/CtaSection";

function HomeContent() {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturedProperties />
      <CtaSection />
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
