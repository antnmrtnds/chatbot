"use client";

import { useState } from 'react';
import { nluService } from '@/lib/nlu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestNLUPage() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<any>(null);

  const testExamples = [
    "Tell me about Evergreen Pure",
    "Fale-me sobre o projeto Evergreen Pure",
    "What are the payment plans?",
    "Quais são os planos de pagamento?",
    "I want to register interest",
    "Estou interessado no apartamento A1",
    "Qual é o preço do apartamento B2?",
    "Gostaria de agendar uma visita",
    "Tenho um orçamento de 300k",
    "Procuro um T2 até 350.000€",
    "Olá, bom dia!",
    "Quando posso comprar brevemente?"
  ];

  const handleAnalyze = () => {
    if (!input.trim()) return;
    
    const nluResult = nluService.analyze(input);
    const responseContext = nluService.generateResponse(nluResult);
    const leadData = nluService.extractLeadQualificationData(nluResult.entities);
    
    setResults({
      nluResult,
      responseContext,
      leadData
    });
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    const nluResult = nluService.analyze(example);
    const responseContext = nluService.generateResponse(nluResult);
    const leadData = nluService.extractLeadQualificationData(nluResult.entities);
    
    setResults({
      nluResult,
      responseContext,
      leadData
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">NLU Testing Interface</h1>
        <p className="text-gray-600">
          Test the Natural Language Understanding system for intent recognition and entity extraction.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Test Input</CardTitle>
            <CardDescription>
              Enter a message to analyze or click on one of the examples below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter your message here..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <Button onClick={handleAnalyze} disabled={!input.trim()}>
                Analyze
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Example Messages:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {testExamples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {results && (
          <div className="grid gap-4">
            {/* Intent & Confidence */}
            <Card>
              <CardHeader>
                <CardTitle>Intent Recognition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Detected Intent:</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {results.nluResult.intent.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Confidence:</span>
                    <span className="text-sm">
                      {(results.nluResult.intent.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${results.nluResult.intent.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Entities */}
            <Card>
              <CardHeader>
                <CardTitle>Extracted Entities</CardTitle>
              </CardHeader>
              <CardContent>
                {results.nluResult.entities.length > 0 ? (
                  <div className="space-y-2">
                    {results.nluResult.entities.map((entity: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium text-sm">{entity.type}:</span>
                          <span className="ml-2">{entity.value}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(entity.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No entities detected</p>
                )}
              </CardContent>
            </Card>

            {/* Response Context */}
            <Card>
              <CardHeader>
                <CardTitle>Response Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-sm">Response Type:</span>
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {results.responseContext.responseType}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">Suggested Actions:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {results.responseContext.suggestedActions.map((action: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  {Object.keys(results.responseContext.contextData).length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Context Data:</span>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(results.responseContext.contextData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lead Qualification Data */}
            {Object.keys(results.leadData).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lead Qualification Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(results.leadData).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="font-medium text-sm capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="text-sm">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}