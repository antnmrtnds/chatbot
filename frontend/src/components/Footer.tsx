import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, MapPin, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Fique a par das novidades</h3>
            <p className="mb-4">Subscreva a nossa newsletter</p>
            <div className="flex max-w-md mx-auto">
              <Input 
                placeholder="O seu email..." 
                className="bg-white text-gray-900"
              />
              <Button variant="secondary" className="ml-2">
                Subscrever
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contactos gerais</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone size={16} />
                <span>(+351) 234 840 570</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin size={16} className="mt-1" />
                <span>Rua Cristóvão Pinho Queimado Nº33 P3 E7, 3800-012 Aveiro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} />
                <span>info@viriato.pt</span>
              </div>
            </div>
          </div>

          {/* Properties */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Imóveis</h4>
            <ul className="space-y-2">
              <li><Link href="/pesquisa" className="hover:text-primary transition-colors">Pesquisa de Imóveis</Link></li>
              <li><Link href="/arrendamento" className="hover:text-primary transition-colors">Em arrendamento</Link></li>
              <li><Link href="/empreendimentos" className="hover:text-primary transition-colors">Empreendimentos</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2">
              <li><Link href="/sobre" className="hover:text-primary transition-colors">Sobre Nós</Link></li>
              <li><Link href="/responsabilidade-social" className="hover:text-primary transition-colors">Responsabilidade Social</Link></li>
              <li><Link href="/sustentabilidade" className="hover:text-primary transition-colors">Sustentabilidade</Link></li>
              <li><Link href="/recrutamento" className="hover:text-primary transition-colors">Recrutamento</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contactos</h4>
            <ul className="space-y-2">
              <li><Link href="/resolucao-litigios" className="hover:text-primary transition-colors">Resolução Alternativa de Litígios</Link></li>
              <li><Link href="/livro-reclamacoes" className="hover:text-primary transition-colors">Livro de Reclamações online</Link></li>
              <li><Link href="/termos" className="hover:text-primary transition-colors">Termos e condições</Link></li>
              <li><Link href="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Política de Cookies</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div>
              <p>&copy; 2024 Viriato. Todos os direitos reservados.</p>
            </div>
            <div className="mt-2 md:mt-0">
              <p>CRM e Sites Imobiliários por eGO Real Estate</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 