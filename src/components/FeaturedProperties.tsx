import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

const featuredProperties = [
    {
      id: "A01",
      title: "Evergreen Pure - Apartamento A01",
      location: "Santa Joana, Aveiro",
      price: "320.000€",
      bedrooms: 3,
      bathrooms: 2,
      area: "145 m²",
      image: "/photos/exterior.jpg",
      status: "Em Planta",
    },
    {
        id: "A02",
        title: "Evergreen Pure - Apartamento A02",
        location: "Santa Joana, Aveiro",
        price: "320.000€",
        bedrooms: 3,
        bathrooms: 2,
        area: "145 m²",
        image: "/photos/UPINVEST EVERGREEN SANTA JOANA_Bloco_01_T2_CAM_Sala_01.jpg",
        status: "Em Planta",
      },
      {
        id: "A03",
        title: "Evergreen Pure - Apartamento A03",
        location: "Santa Joana, Aveiro",
        price: "320.000€",
        bedrooms: 3,
        bathrooms: 2,
        area: "145 m²",
        image: "/photos/UPINVEST EVERGREEN SANTA JOANA_Bloco_01_T2_CAM_Suite_01.jpg",
        status: "Em Planta",
      },
  ];
  

export default function FeaturedProperties() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800" id="properties">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Imóveis em Destaque</h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Conheça os nossos melhores imóveis.
            </p>
          </div>
        </div>
        <div className="mx-auto grid grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:gap-8">
          {featuredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden rounded-lg border-0 shadow-lg">
              <Link href={`/imoveis/evergreen-pure/${property.id}`} className="block" prefetch={false}>
                <Image
                  src={property.image}
                  width={400}
                  height={300}
                  alt={property.title}
                  className="h-60 w-full object-cover"
                />
              </Link>
              <CardContent className="bg-white p-4">
                <p className="border-b pb-1 mb-2 text-xs text-gray-500">
                  {property.title.split(' - ')[0]}
                </p>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-bold">{property.title.split(' - ')[1]}</h3>
                  <span className="text-lg font-semibold text-[#111827]">{property.price}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{property.location}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {property.bedrooms} Q | {property.bathrooms} WC | {property.area}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 