"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Phone, MapPin, Mail, Search, Globe } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Evergreen", href: "/the-unique" },
    { name: "Projetos", href: "/projetos" },
    { name: "Em arrendamento", href: "/arrendamento" },
    { name: "Sobre Nós", href: "/sobre" },
    { name: "Pesquisa", href: "/pesquisa" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${isScrolled ? "bg-white shadow-md" : "bg-transparent"}`}>
      {/* Contact Info Bar */}
      <div className={`text-white transition-all duration-300 ${isScrolled ? "bg-primary text-primary-foreground" : "bg-black/30"}`}>
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone size={14} />
                <span>(+351) 234 840 570</span>
                <span className="text-xs opacity-80">(Chamada para Rede Fixa Nacional)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={14} />
                <span>vendas@upinvestments.pt</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MapPin size={14} />
                <span>Rua Cristóvão Pinho Queimado Nº33 P3 E7, 3800-012 Aveiro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe size={14} />
                <select className="bg-transparent text-sm">
                  <option value="pt" className="text-black">PT</option>
                  <option value="en" className="text-black">EN</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className={`text-2xl font-bold transition-colors duration-300 ${isScrolled ? "text-primary" : "text-white"}`}>
            UPINVESTMENTS
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`transition-colors duration-300 font-medium ${isScrolled ? "text-gray-700 hover:text-primary" : "text-white hover:text-gray-200"}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className={`hidden md:flex transition-all duration-300 ${isScrolled ? 'text-gray-700 border-gray-300 hover:bg-gray-100' : 'text-white border-white bg-transparent hover:bg-white/20'}`}>
              <Search size={16} className="mr-2" />
              Pesquisar
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className={`md:hidden transition-all duration-300 ${isScrolled ? 'text-gray-700 border-gray-300 hover:bg-gray-100' : 'text-white border-white bg-transparent hover:bg-white/20'}`}>
                  <Menu size={16} />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Navegue pelo nosso website
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 mt-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-700 hover:text-primary transition-colors font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4 border-t">
                    <Input placeholder="Pesquisar..." />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
} 