import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bath, Bed, Car, MapPin, Building2, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function EvergreenPurePage() {
  // Sample flat data - in a real app, this would come from your database
  const flats = [
    { id: "A_0", block: "A", floor: "0", typology: "T2", price: "€ 280.000" },
    { id: "A_1", block: "A", floor: "1", typology: "T3", price: "€ 320.000" },
    { id: "A_2", block: "A", floor: "2", typology: "T2", price: "€ 290.000" },
    { id: "A_3", block: "A", floor: "3", typology: "T3", price: "€ 330.000" },
    { id: "B_0", block: "B", floor: "0", typology: "T1", price: "€ 220.000" },
    { id: "B_1", block: "B", floor: "1", typology: "T2", price: "€ 285.000" },
    { id: "B_2", block: "B", floor: "2", typology: "T3", price: "€ 325.000" },
    { id: "B_3", block: "B", floor: "3", typology: "T3 Duplex", price: "€ 380.000" },
  ];

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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Apartamentos Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {flats.map((flat) => (
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
    </div>
  );
} 