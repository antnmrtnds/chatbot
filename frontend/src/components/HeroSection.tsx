import Link from "next/link";
import { Button } from "./ui/button";
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section
      className="w-full py-12 md:py-24 lg:py-32 xl:py-48 text-white relative overflow-hidden"
      style={{
        backgroundImage: "url('/photos/UP_Evergreen_Pure_price_list_v3[1].jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Encontre a sua casa de sonho
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
              Ajudamo-lo a encontrar o imóvel perfeito. Explore as nossas listagens e agende uma visita hoje.
            </p>
          </div>
          <div className="space-x-4">
            <Link
              href="/imoveis"
              className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-primary shadow transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              prefetch={false}
            >
              Ver Imóveis
            </Link>
            <Link
              href="/#contact"
              className="inline-flex h-10 items-center justify-center rounded-md border border-white bg-transparent px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              prefetch={false}
            >
              Contactar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 