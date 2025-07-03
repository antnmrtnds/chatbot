import HeroSection from "@/components/HeroSection";
import FeaturedProperties from "@/components/FeaturedProperties";
import CtaSection from "@/components/CtaSection";

export default function Home() {
  return (
    <main className="flex-1">
      <HeroSection />
      <FeaturedProperties />
      <CtaSection />
    </main>
  );
}
