'use client';

import React from 'react';
import RagChatbot from '@/components/RagChatbot';
import { usePageContext } from '@/lib/pageContextManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RagDemoPage() {
  const { context, updateContext } = usePageContext();

  // Simulate different page contexts for testing
  const simulatePropertyPage = () => {
    updateContext({
      pageType: 'property',
      propertyId: 'A_0',
      propertyType: 'T2',
      priceRange: '200k-300k',
      features: ['parking', 'pool', 'garden'],
    });
  };

  const simulateListingPage = () => {
    updateContext({
      pageType: 'listing',
      propertyType: 'T3',
      priceRange: '300k-400k',
    });
  };

  const simulateHomePage = () => {
    updateContext({
      pageType: 'home',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          RAG Chatbot Demo
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Context Information */}
          <Card>
            <CardHeader>
              <CardTitle>Current Page Context</CardTitle>
            </CardHeader>
            <CardContent>
              {context ? (
                <div className="space-y-2">
                  <p><strong>Page Type:</strong> {context.pageType}</p>
                  <p><strong>URL:</strong> {context.url}</p>
                  {context.propertyId && (
                    <p><strong>Property ID:</strong> {context.propertyId}</p>
                  )}
                  {context.propertyType && (
                    <p><strong>Property Type:</strong> {context.propertyType}</p>
                  )}
                  {context.priceRange && (
                    <p><strong>Price Range:</strong> {context.priceRange}</p>
                  )}
                  {context.features && context.features.length > 0 && (
                    <p><strong>Features:</strong> {context.features.join(', ')}</p>
                  )}
                  {context.timeOnPage && (
                    <p><strong>Time on Page:</strong> {Math.round(context.timeOnPage / 1000)}s</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No context detected</p>
              )}
            </CardContent>
          </Card>

          {/* Context Simulation */}
          <Card>
            <CardHeader>
              <CardTitle>Simulate Different Contexts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={simulateHomePage} variant="outline" className="w-full">
                Simulate Home Page
              </Button>
              <Button onClick={simulateListingPage} variant="outline" className="w-full">
                Simulate Listing Page
              </Button>
              <Button onClick={simulatePropertyPage} variant="outline" className="w-full">
                Simulate Property Page (A_0)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>RAG Chatbot Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🧠 RAG-Powered</h3>
                <p className="text-sm text-blue-700">
                  Uses vector search to find relevant property information and provide accurate answers.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">🎯 Context-Aware</h3>
                <p className="text-sm text-green-700">
                  Automatically detects page context and tailors responses based on current property or page type.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">🎤 Voice Input</h3>
                <p className="text-sm text-purple-700">
                  Supports voice input for hands-free interaction (browser dependent).
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">🔗 Smart Navigation</h3>
                <p className="text-sm text-orange-700">
                  Can suggest and trigger navigation to relevant pages based on user intent.
                </p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">📋 Lead Capture</h3>
                <p className="text-sm text-red-700">
                  Progressive lead capture based on conversation engagement and intent detection.
                </p>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">📊 Analytics</h3>
                <p className="text-sm text-indigo-700">
                  Tracks user interactions and provides insights for lead qualification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Try Different Contexts</h4>
                <p className="text-sm text-gray-600">
                  Use the buttons above to simulate different page contexts and see how the chatbot adapts its responses.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">2. Ask Property Questions</h4>
                <p className="text-sm text-gray-600">
                  Try asking: "Que apartamentos têm disponíveis?", "Qual é o preço do apartamento A?", "Tem piscina?"
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">3. Test Lead Capture</h4>
                <p className="text-sm text-gray-600">
                  Send several messages showing interest to trigger the progressive lead capture form.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">4. Voice Input</h4>
                <p className="text-sm text-gray-600">
                  Click the microphone button to test voice input (requires browser support).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RAG Chatbot Component */}
        <RagChatbot
          pageContext={context || undefined}
          visitorId="demo-visitor-123"
          sessionId="demo-session-456"
          onNavigate={(url, navContext) => {
            console.log('Navigation requested:', url, navContext);
            // In a real app, you would handle navigation here
            alert(`Navigation requested to: ${url}`);
          }}
          onLeadCapture={(leadData) => {
            console.log('Lead captured:', leadData);
            alert('Lead captured! Check console for details.');
          }}
          onContextUpdate={(newContext) => {
            console.log('Context updated:', newContext);
          }}
          onAnalyticsEvent={(event) => {
            console.log('Analytics event:', event);
          }}
          features={{
            voiceInput: true,
            voiceOutput: false,
            mediaRendering: true,
            navigationCommands: true,
            progressiveLeadCapture: true,
            contextAwareness: true,
            ragEnabled: true,
          }}
          position="bottom-right"
        />
      </div>
    </div>
  );
}