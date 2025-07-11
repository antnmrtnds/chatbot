"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bath, Bed, Car, MapPin, Building2, ArrowRight, Filter } from "lucide-react";
import RagChatbot from '@/components/RagChatbot';
import { usePageContext } from '@/lib/pageContextManager';

interface FlatData {
  id: string;
  block: string;
  floor: string;
  typology: string;
  price: string;
  priceValue: number;
}

function EvergreenPureContent() {
  const searchParams = useSearchParams();
  const [filteredFlats, setFilteredFlats] = useState<FlatData[]>([]);
  const [activeFilters, setActiveFilters] = useState<{budget?: string, typology?: string}>({});

  // Sample flat data - in a real app, this would come from your database
  const flats: FlatData[] = [
    { id: "A01", block: "A", floor: "0", typology: "T2", price: "€ 280.000", priceValue: 280000 },
    { id: "A02", block: "A", floor: "1", typology: "T3", price: "€ 320.000", priceValue: 320000 },
    { id: "A03", block: "A", floor: "2", typology: "T2", price: "€ 290.000", priceValue: 290000 },
    { id: "A04", block: "A", floor: "3", typology: "T3", price: "€ 330.000", priceValue: 330000 },
    { id: "B01", block: "B", floor: "0", typology: "T1", price: "€ 220.000", priceValue: 220000 },
    { id: "B02", block: "B", floor: "1", typology: "T2", price: "€ 285.000", priceValue: 285000 },
    { id: "B03", block: "B", floor: "2", typology: "T3", price: "€ 325.000", priceValue: 325000 },
    { id: "B04", block: "B", floor: "3", typology: "T3", price: "€ 380.000", priceValue: 380000 },
    { id: "B05", block: "B", floor: "4", typology: "Duplex", price: "€ 390.000", priceValue: 390000 },
  ];

  useEffect(() => {
    const budget = searchParams.get('budget');
    const typology = searchParams.get('typology');
    
    setActiveFilters({ budget: budget || undefined, typology: typology || undefined });
    
    let filtered = [...flats];
    
    // Apply budget filter
    if (budget) {
      if (budget === 'under_300k') {
        filtered = filtered.filter(flat => flat.priceValue < 300000);
      } else if (budget === 'under_400k') {
        filtered = filtered.filter(flat => flat.priceValue < 400000);
      }
    }
    
    // Apply typology filter
    if (typology && typology !== 'all') {
      if (typology === 'Duplex') {
        filtered = filtered.filter(flat => flat.typology === 'Duplex');
      } else {
        filtered = filtered.filter(flat => flat.typology === typology);
      }
    }
    
    setFilteredFlats(filtered);
  }, [searchParams]);

  const clearFilters = () => {
    window.history.pushState({}, '', '/imoveis/evergreen-pure');
    setActiveFilters({});
    setFilteredFlats(flats);
  };

  const getFilterText = () => {
    const filters = [];
    if (activeFilters.budget) {
      if (activeFilters.budget === 'under_300k') {
        filters.push('Até 300.000€');
      } else if (activeFilters.budget === 'under_400k') {
        filters.push('Até 400.000€');
      }
    }
    if (activeFilters.typology && activeFilters.typology !== 'all') {
      filters.push(activeFilters.typology);
    }
    return filters.join(' • ');
  };

  const displayFlats = filteredFlats.length > 0 ? filteredFlats : flats;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">Início</Link>
            <span className="mx-2">/</span>
            <Link href="/imoveis" className="hover:text-primary">Imóveis</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Evergreen Pure</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            EVERGREEN PURE
          </h1>
          <p className="text-xl text-gray-600 mb-2 flex items-center justify-center gap-2">
            <MapPin size={20} /> Santa Joana, Aveiro
          </p>
          <p className="text-gray-700 max-w-3xl mx-auto">
            Descubra o seu futuro lar neste empreendimento moderno, atualmente em fase de construção. 
            Com acabamentos de alta qualidade e localização privilegiada em Santa Joana, Aveiro.
          </p>
        </div>

        {/* Active Filters */}
        {(activeFilters.budget || activeFilters.typology) && (
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <Filter size={16} className="text-blue-600" />
              <span className="text-blue-800 font-medium">
                Filtros ativos: {getFilterText()}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              Limpar Filtros
            </Button>
          </div>
        )}

        {/* Development Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <Building2 size={32} className="text-primary mx-auto mb-2" />
              <h3 className="font-semibold">2 Blocos</h3>
              <p className="text-sm text-gray-600">Bloco A e B</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Bed size={32} className="text-primary mx-auto mb-2" />
              <h3 className="font-semibold">16 Apartamentos</h3>
              <p className="text-sm text-gray-600">8 por bloco</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Bath size={32} className="text-primary mx-auto mb-2" />
              <h3 className="font-semibold">T1, T2, T3</h3>
              <p className="text-sm text-gray-600">Várias tipologias</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Car size={32} className="text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Garagem</h3>
              <p className="text-sm text-gray-600">Lugares incluídos</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Flats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Apartamentos Disponíveis
            {displayFlats.length !== flats.length && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({displayFlats.length} de {flats.length} apartamentos)
              </span>
            )}
          </h2>
          
          {displayFlats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Nenhum apartamento encontrado com os filtros selecionados.</p>
              <Button onClick={clearFilters} variant="outline">
                Ver Todos os Apartamentos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayFlats.map((flat) => (
                <Card key={flat.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Apartamento {flat.id}</CardTitle>
                        <CardDescription>
                          Bloco {flat.block} • Piso {flat.floor}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{flat.typology}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-primary">{flat.price}</p>
                    </div>
                    <Link href={`/imoveis/evergreen-pure/${flat.id}`}>
                      <Button className="w-full" variant="outline">
                        Ver Detalhes
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Interessado no Evergreen Pure?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Clique em qualquer apartamento acima para ver detalhes específicos e use o nosso 
            assistente virtual para fazer perguntas personalizadas sobre cada unidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Agendar Visita
            </Button>
            <Button size="lg" variant="outline">
              Contactar Consultor
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Telefone: (+351) 234 840 570
          </p>
        </div>
      </div>
      
      <RagChatbot
        pageContext={{
          url: '/imoveis/evergreen-pure',
          pageType: 'listing',
          semanticId: 'listing_evergreen_pure',
          title: 'Evergreen Pure - Apartamentos Disponíveis',
          propertyType: activeFilters.typology || undefined,
          priceRange: activeFilters.budget === 'under_300k' ? '200k-300k' :
                     activeFilters.budget === 'under_400k' ? '200k-400k' : undefined,
          features: ['garagem', 'elevador', 'em_construcao'],
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
        onLeadCapture={(leadData) => {
          console.log('Lead captured on Evergreen Pure listing:', leadData);
          // Send to your CRM or analytics
        }}
        onAnalyticsEvent={(event) => {
          console.log('Analytics event on listing page:', event);
          // Send to your analytics platform
        }}
        onNavigate={(url, navContext) => {
          console.log('Navigation requested:', url, navContext);
          window.location.href = url;
        }}
        position="bottom-right"
      />
    </div>
  );
}

export default function EvergreenPurePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando apartamentos...</p>
      </div>
    </div>}>
      <EvergreenPureContent />
    </Suspense>
  );
} 