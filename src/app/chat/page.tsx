"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PropertyChatbot from '@/components/PropertyChatbot';
import { Building2, Home, MapPin, Info } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to ensure component is only rendered on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-teal-600 text-2xl font-bold flex items-center">
              <Building2 className="h-6 w-6 mr-2" />
              <span>UPINVESTMENTS</span>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-teal-600 transition-colors">
                Home
              </Link>
              <Link href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
                Properties
              </Link>
              <Link href="/chat" className="text-teal-600 font-medium">
                Property Assistant
              </Link>
              <Link href="#" className="text-gray-600 hover:text-teal-600 transition-colors">
                About
              </Link>
            </nav>
            
            <Button
              variant="outline"
              className="border-teal-600 text-teal-600 hover:bg-teal-50"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-light text-gray-900 mb-2">
              Property Assistant
            </h1>
            <p className="text-gray-600">
              Ask questions about our properties and get personalized recommendations
            </p>
          </div>
          
          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Home className="h-4 w-4 mr-2 text-teal-600" />
                  Find Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600">
                Ask about properties by location, price range, or features
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-teal-600" />
                  Compare Options
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600">
                Compare different properties or ask about specific neighborhoods
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Info className="h-4 w-4 mr-2 text-teal-600" />
                  Get Details
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600">
                Learn about amenities, pricing, availability, and more
              </CardContent>
            </Card>
          </div>
          
          {/* Chatbot */}
          {isClient && <PropertyChatbot />}
          
          {/* Example questions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Example Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="justify-start text-left text-sm text-gray-600 h-auto py-2"
                onClick={() => {
                  // This would be handled by the chatbot component
                  console.log("Example question clicked");
                }}
              >
                What properties do you have in Aveiro?
              </Button>
              
              <Button
                variant="outline"
                className="justify-start text-left text-sm text-gray-600 h-auto py-2"
                onClick={() => {
                  console.log("Example question clicked");
                }}
              >
                Show me T2 apartments under 300,000€
              </Button>
              
              <Button
                variant="outline"
                className="justify-start text-left text-sm text-gray-600 h-auto py-2"
                onClick={() => {
                  console.log("Example question clicked");
                }}
              >
                Which properties have a balcony or terrace?
              </Button>
              
              <Button
                variant="outline"
                className="justify-start text-left text-sm text-gray-600 h-auto py-2"
                onClick={() => {
                  console.log("Example question clicked");
                }}
              >
                Tell me about the Evergreen Pure project
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <div className="text-xl font-bold mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                UPINVESTMENTS
              </div>
              <p className="text-gray-400 max-w-md">
                Premium real estate developments in Portugal's most desirable locations.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold mb-4 text-gray-300">Company</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white">About</Link></li>
                  <li><Link href="#" className="hover:text-white">Projects</Link></li>
                  <li><Link href="#" className="hover:text-white">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-4 text-gray-300">Properties</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white">Evergreen Pure</Link></li>
                  <li><Link href="#" className="hover:text-white">CORE Leça</Link></li>
                  <li><Link href="#" className="hover:text-white">All Developments</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-4 text-gray-300">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
                  <li><Link href="#" className="hover:text-white">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-gray-400">
            <p>© {new Date().getFullYear()} UPINVESTMENTS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}