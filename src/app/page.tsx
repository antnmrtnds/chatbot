"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Home, Bed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function EvergreenPureLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop"
            alt="Modern Apartments"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-light mb-4">
            EVERGREEN PURE
          </h1>
          <div className="flex items-center justify-center gap-2 text-lg mb-8">
            <MapPin size={20} />
            <span>Santa Joana | Aveiro</span>
          </div>
          
          <Button
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4"
            asChild
          >
            <Link href="/imoveis/evergreen-pure">
              VER APARTAMENTOS
            </Link>
          </Button>
        </div>
      </section>

      {/* Simple Overview */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-light text-gray-900 mb-8">
            16 Apartamentos Modernos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <Building2 size={40} className="text-teal-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">2 Blocos</h3>
              <p className="text-gray-600">Arquitetura moderna</p>
            </div>
            
            <div className="text-center">
              <Home size={40} className="text-teal-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">16 Apartamentos</h3>
              <p className="text-gray-600">8 por bloco</p>
            </div>
            
            <div className="text-center">
              <Bed size={40} className="text-teal-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">T1, T2, T3</h3>
              <p className="text-gray-600">Tipologias variadas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-12">Galeria</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop"
                alt="Exterior"
                fill
                className="object-cover"
              />
            </div>
            
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop"
                alt="Living Room"
                fill
                className="object-cover"
              />
            </div>
            
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop"
                alt="Kitchen"
                fill
                className="object-cover"
              />
            </div>
            
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1571708681806-471de9a27bea?w=600&h=400&fit=crop"
                alt="Bedroom"
                fill
                className="object-cover"
              />
            </div>
            
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1507652955-f3dcef5a3be5?w=600&h=400&fit=crop"
                alt="Bathroom"
                fill
                className="object-cover"
              />
            </div>
            
            <div className="relative h-64 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop"
                alt="Balcony"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-teal-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-light mb-6">
            Descubra o Seu Futuro Lar
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Apartamentos modernos em Santa Joana, Aveiro
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-teal-900 hover:bg-gray-100 px-8 py-4"
              asChild
            >
              <Link href="/imoveis/evergreen-pure">
                VER APARTAMENTOS
              </Link>
            </Button>
            <Button
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-teal-900 px-8 py-4 bg-transparent"
            >
              AGENDAR VISITA
            </Button>
          </div>
        </div>
      </section>

      {/* Status Badge */}
      <div className="fixed top-4 right-4 z-50">
        <Badge className="bg-orange-500 text-white px-4 py-2">
          EM CONSTRUÇÃO
        </Badge>
      </div>
    </div>
  );
}
