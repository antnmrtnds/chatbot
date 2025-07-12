"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Home, Bed, Search, Mail, User, Menu, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function EvergreenPureLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="text-white text-2xl font-bold">
              UPINVESTMENTS
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                PROJETOS
              </Link>
              <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                SOBRE NÓS
              </Link>
              <Link href="#" className="text-white hover:text-gray-300 transition-colors">
                ESG
              </Link>
            </nav>
            
            {/* Right side icons */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="hidden md:flex border-white text-white hover:bg-white/10 px-4 py-2"
              >
                <Search size={16} className="mr-2" />
                DISPONIBILIDADES
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Mail size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <User size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 md:hidden"
              >
                <Menu size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

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

      {/* Tipologias do projeto */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left side - Apartment types and info */}
            <div className="space-y-8">
              <h2 className="text-4xl font-light text-teal-600 mb-8">
                Tipologias do projeto
              </h2>
              
              {/* Apartment types */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-xl font-medium text-teal-600 underline">Studio</h3>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-xl font-medium text-gray-900">T1 Smart</h3>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-xl font-medium text-gray-900">T2</h3>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-xl font-medium text-gray-900">T2 Smart</h3>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-xl font-medium text-gray-900">T3</h3>
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  Os STUDIO do CORE Leça têm um layout prático e moderno, com espaço para uma cama de casal ou solteiro, uma sala de estar com janelas amplas para o exterior e uma kitchenette. Uma tipologia excelente para quem quer um apartamento pequeno, mas muito funcional.
                </p>
                
                <div className="space-y-3">
                  <p className="text-gray-900 font-medium">
                    <span className="font-semibold">Valor dos opcionais</span> não incluídos e a escolher posteriormente:
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Módulos cozinha extra</span>
                      <span>2.900 €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pack eletrodomésticos extra</span>
                      <span>2.800 €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Roupeiro(s) quarto(s)</span>
                      <span>2.200 €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aquecedores</span>
                      <span>300 €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Images */}
            <div className="relative">
              <div className="grid grid-cols-1 gap-4">
                <div className="relative h-80 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop"
                    alt="Modern Living Room"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-80 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop"
                    alt="Modern Kitchen"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              {/* Floating buttons */}
              <Button
                className="absolute top-4 right-4 bg-teal-600 hover:bg-teal-700 text-white rounded-full w-12 h-12 p-0"
              >
                <span className="text-lg">{">"}</span>
              </Button>
              
              <Button
                className="absolute bottom-4 right-4 bg-teal-600 hover:bg-teal-700 text-white rounded-full w-12 h-12 p-0"
              >
                <Phone size={20} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Disponibilidades */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-light text-teal-600">
              Disponibilidades
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-teal-600 text-teal-600"
              >
                <span className="text-xl">=</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-teal-600 text-teal-600"
              >
                <span className="text-xl">⚏</span>
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">4 morada(s) 50 de 58</p>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-teal-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">APT</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">PROJETO</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">PISO</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">TIPOLOGIA</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ÁREA BRUTA</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ÁREA EXTERIOR</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ESTADO</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ARRUMOS</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ORIENTAÇÃO</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">PREÇO</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">PLANTA</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ESTADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-teal-600">A01</td>
                    <td className="px-4 py-3 text-sm">CORE Leça</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">T3</td>
                    <td className="px-4 py-3 text-sm">94 m²</td>
                    <td className="px-4 py-3 text-sm">-</td>
                    <td className="px-4 py-3 text-sm">1</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">Norte/Sul/Nascente</td>
                    <td className="px-4 py-3 text-sm">310.000 €</td>
                    <td className="px-4 py-3 text-sm">📋</td>
                    <td className="px-4 py-3">
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                        RESERVAR
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-teal-600">B01</td>
                    <td className="px-4 py-3 text-sm">CORE Leça</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">T3</td>
                    <td className="px-4 py-3 text-sm">94 m²</td>
                    <td className="px-4 py-3 text-sm">-</td>
                    <td className="px-4 py-3 text-sm">1</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">Norte/Sul/Poente</td>
                    <td className="px-4 py-3 text-sm">310.000 €</td>
                    <td className="px-4 py-3 text-sm">📋</td>
                    <td className="px-4 py-3">
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                        RESERVAR
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-teal-600">A41</td>
                    <td className="px-4 py-3 text-sm">CORE Leça</td>
                    <td className="px-4 py-3 text-sm">4</td>
                    <td className="px-4 py-3 text-sm">T3</td>
                    <td className="px-4 py-3 text-sm">94 m²</td>
                    <td className="px-4 py-3 text-sm">4 m²</td>
                    <td className="px-4 py-3 text-sm">1</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">Norte/Sul/Poente</td>
                    <td className="px-4 py-3 text-sm">325.000 €</td>
                    <td className="px-4 py-3 text-sm">📋</td>
                    <td className="px-4 py-3">
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                        RESERVAR
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-teal-600">B51</td>
                    <td className="px-4 py-3 text-sm">CORE Leça</td>
                    <td className="px-4 py-3 text-sm">5</td>
                    <td className="px-4 py-3 text-sm">T1</td>
                    <td className="px-4 py-3 text-sm">51 m²</td>
                    <td className="px-4 py-3 text-sm">-</td>
                    <td className="px-4 py-3 text-sm">1</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">Norte/Sul/Poente</td>
                    <td className="px-4 py-3 text-sm">335.000 €</td>
                    <td className="px-4 py-3 text-sm">📋</td>
                    <td className="px-4 py-3">
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                        RESERVAR
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-teal-600">B02</td>
                    <td className="px-4 py-3 text-sm">CORE Leça</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">T2</td>
                    <td className="px-4 py-3 text-sm">69 m²</td>
                    <td className="px-4 py-3 text-sm">-</td>
                    <td className="px-4 py-3 text-sm">1</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">Sul</td>
                    <td className="px-4 py-3 text-sm">-</td>
                    <td className="px-4 py-3 text-sm">📋</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="border-gray-400 text-gray-500 text-xs">
                        RESERVADO
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-teal-600">B64</td>
                    <td className="px-4 py-3 text-sm">CORE Leça</td>
                    <td className="px-4 py-3 text-sm">6</td>
                    <td className="px-4 py-3 text-sm">T1 Smart</td>
                    <td className="px-4 py-3 text-sm">39 m²</td>
                    <td className="px-4 py-3 text-sm">3 m²</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">Norte</td>
                    <td className="px-4 py-3 text-sm">-</td>
                    <td className="px-4 py-3 text-sm">📋</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="border-gray-400 text-gray-500 text-xs">
                        RESERVADO
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-teal-600">A83</td>
                    <td className="px-4 py-3 text-sm">CORE Leça</td>
                    <td className="px-4 py-3 text-sm">8</td>
                    <td className="px-4 py-3 text-sm">Studio</td>
                    <td className="px-4 py-3 text-sm">31 m²</td>
                    <td className="px-4 py-3 text-sm">3 m²</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">0</td>
                    <td className="px-4 py-3 text-sm">Sul</td>
                    <td className="px-4 py-3 text-sm">-</td>
                    <td className="px-4 py-3 text-sm">📋</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" className="border-gray-400 text-gray-500 text-xs">
                        RESERVADO
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
