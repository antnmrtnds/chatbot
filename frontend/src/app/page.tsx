import Chatbot from "@/components/Chatbot";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bath, Bed, Car, MapPin, Building2, Heart, Share2, Calendar, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">Início</Link>
            <span className="mx-2">/</span>
            <Link href="/imoveis" className="hover:text-primary">Imóveis</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Detalhes do Imóvel</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Property Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                EVERGREEN PURE
              </h1>
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <MapPin size={16} /> Santa Joana, Aveiro
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Heart size={16} className="mr-2" />
                Favoritos
              </Button>
              <Button variant="outline" size="sm">
                <Share2 size={16} className="mr-2" />
                Partilhar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="relative h-96 w-full">
                  <Image
                    src="/photos/exterior.jpg"
                    alt="THE UNIQUE - Apartamento T3"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-lg"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-white text-gray-900">
                      Em Planta
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-4">
                  {[
                    "/photos/UPINVEST EVERGREEN SANTA JOANA_Bloco_01_T2_CAM_Corredor__VERT_01.jpg",
                    "/photos/UPINVEST EVERGREEN SANTA JOANA_Bloco_01_T2_CAM_Exterior_02_HORI_001.jpg",
                    "/photos/UPINVESTMENTS_Evergreen_SantaJoana_T2_EXT_EdificioCamera 04_001.jpg",
                    "/photos/UPINVESTMENTS_Evergreen_SantaJoana_T2_EXT_EdificioCamera 03_001.jpg",
                  ].map((src, i) => (
                    <div key={i} className="relative h-20 bg-gray-200 rounded cursor-pointer hover:opacity-80">
                      <Image
                        src={src}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Sobre o imóvel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-6">
                    Descubra o seu futuro lar neste magnífico apartamento T3,
                    atualmente em fase de construção, localizado na privilegiada
                    zona de Santa Joana, em Aveiro. Com um design moderno e
                    acabamentos de alta qualidade, este imóvel promete o máximo de
                    conforto e sofisticação. A data prevista para a conclusão da
                    obra é no final de 2025.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">Características Principais</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Bed size={32} className="text-primary mx-auto mb-2" />
                      <span className="font-semibold">3 Quartos</span>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Bath size={32} className="text-primary mx-auto mb-2" />
                      <span className="font-semibold">2 Casas de Banho</span>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Car size={32} className="text-primary mx-auto mb-2" />
                      <span className="font-semibold">2 Lugares Garagem</span>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Building2 size={32} className="text-primary mx-auto mb-2" />
                      <span className="font-semibold">145 m²</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-4">Localização</h3>
                  <p className="text-gray-700 mb-4">
                    Situado numa das zonas mais procuradas de Aveiro, o THE UNIQUE beneficia de uma localização privilegiada 
                    com fácil acesso a transportes, comércio e serviços. A proximidade à Universidade de Aveiro e ao centro 
                    da cidade torna este imóvel uma excelente escolha tanto para habitação própria como para investimento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price and Contact */}
            <Card className="sticky top-4 mb-8">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-3xl font-bold text-primary">
                    € 350.000
                  </CardTitle>
                  <Badge variant="outline">Ref: 20925086</Badge>
                </div>
                <CardDescription>
                  Preço por m²: € 2.414
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button size="lg" className="w-full">
                  <Calendar size={16} className="mr-2" />
                  Agendar Visita
                </Button>
                <Button size="lg" variant="outline" className="w-full">
                  <Info size={16} className="mr-2" />
                  Pedir mais informações
                </Button>
                <div className="text-sm text-gray-600 text-center pt-4 border-t">
                  <p>Interessado neste imóvel?</p>
                  <p className="font-semibold">Contacte-nos:</p>
                  <p>(+351) 234 840 570</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipologia:</span>
                    <span className="font-semibold">T3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-semibold">Em Construção</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Área Útil:</span>
                    <span className="font-semibold">145 m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Andar:</span>
                    <span className="font-semibold">3º</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Elevador:</span>
                    <span className="font-semibold">Sim</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conclusão:</span>
                    <span className="font-semibold">Final 2025</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Chatbot />
    </div>
  );
}
