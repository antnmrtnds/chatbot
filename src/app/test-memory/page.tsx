"use client";

import { useState, useEffect } from 'react';
import { memoryService } from '@/lib/memoryService';
import { sessionStateManager } from '@/lib/sessionStateManager';
import visitorTracker from '@/lib/visitorTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestMemoryPage() {
  const [sessionId] = useState(() => `test-session-${Date.now()}`);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [conversationContext, setConversationContext] = useState<any>(null);
  const [flowStatus, setFlowStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    loadMemoryData();
  }, []);

  const loadMemoryData = async () => {
    try {
      const profile = await memoryService.getUserProfile(visitorTracker.visitorId);
      const context = await memoryService.getConversationContext(sessionId, visitorTracker.visitorId);
      const status = await sessionStateManager.getFlowStatus(sessionId, visitorTracker.visitorId);
      
      setUserProfile(profile);
      setConversationContext(context);
      setFlowStatus(status);
    } catch (error) {
      console.error('Error loading memory data:', error);
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testSessionMemory = async () => {
    addTestResult('Testing session memory...');
    
    // Simulate conversation
    memoryService.updateConversationContext(sessionId, {
      text: 'I like properties near the park',
      sender: 'user',
      intent: 'property_inquiry',
      entities: [{ type: 'location', value: 'park' }]
    });

    memoryService.updateConversationContext(sessionId, {
      text: 'Great! I can show you properties near the park.',
      sender: 'bot'
    });

    // Test contextual response
    const contextualResponse = memoryService.generateContextualResponse(sessionId, 'Any with a pool?');
    
    if (contextualResponse) {
      addTestResult('✅ Contextual response generated: ' + contextualResponse.substring(0, 50) + '...');
    } else {
      addTestResult('❌ No contextual response generated');
    }

    await loadMemoryData();
  };

  const testLongTermMemory = async () => {
    addTestResult('Testing long-term memory...');
    
    // Update user preferences
    await memoryService.updateUserPreferences(visitorTracker.visitorId, {
      priceRange: 'under_300k',
      propertyType: 'T2',
      timeline: 'within_3_months'
    });

    // Add property interaction
    await memoryService.addPropertyInteraction(visitorTracker.visitorId, {
      propertyId: 'A01',
      interactionType: 'view',
      details: { source: 'test' }
    });

    addTestResult('✅ User preferences and interactions updated');
    await loadMemoryData();
  };

  const testMultiStepFlow = async () => {
    addTestResult('Testing multi-step flow...');
    
    // Start property search flow
    const flowResult = await sessionStateManager.startFlow(
      sessionId,
      visitorTracker.visitorId,
      'property_search'
    );

    if (flowResult) {
      addTestResult('✅ Property search flow started: ' + flowResult.message.substring(0, 50) + '...');
      
      // Simulate user response
      const stepResult = await sessionStateManager.processFlowInput(
        sessionId,
        visitorTracker.visitorId,
        'Até 300.000€'
      );

      if (stepResult) {
        addTestResult('✅ Flow step processed: ' + stepResult.message.substring(0, 50) + '...');
      }
    } else {
      addTestResult('❌ Failed to start flow');
    }

    await loadMemoryData();
  };

  const testInterruption = async () => {
    addTestResult('Testing flow interruption...');
    
    // First ensure we have an active flow
    await sessionStateManager.startFlow(sessionId, visitorTracker.visitorId, 'property_search');
    
    // Test interruption
    const interruptionResult = await sessionStateManager.handleInterruption(
      sessionId,
      visitorTracker.visitorId,
      'What is your phone number?'
    );

    if (interruptionResult.canResume) {
      addTestResult('✅ Interruption handled, can resume: ' + (interruptionResult.resumeMessage || 'No resume message'));
    } else {
      addTestResult('❌ Interruption not handled properly');
    }

    await loadMemoryData();
  };

  const getContextualSuggestions = () => {
    const suggestions = memoryService.getContextualSuggestions(sessionId, visitorTracker.visitorId);
    addTestResult('Contextual suggestions: ' + suggestions.join(', '));
  };

  const clearMemory = async () => {
    memoryService.clearSessionMemory(sessionId);
    await sessionStateManager.cancelFlow(sessionId);
    addTestResult('✅ Memory cleared');
    await loadMemoryData();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Memory & Context Awareness Test</h1>
        <p className="text-gray-600 mt-2">Test the chatbot's memory and context awareness features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>Run tests to verify memory functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={testSessionMemory} className="w-full">
              Test Session Memory
            </Button>
            <Button onClick={testLongTermMemory} className="w-full">
              Test Long-Term Memory
            </Button>
            <Button onClick={testMultiStepFlow} className="w-full">
              Test Multi-Step Flow
            </Button>
            <Button onClick={testInterruption} className="w-full">
              Test Flow Interruption
            </Button>
            <Button onClick={getContextualSuggestions} className="w-full">
              Get Contextual Suggestions
            </Button>
            <Button onClick={clearMemory} variant="destructive" className="w-full">
              Clear Memory
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Real-time test results and logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No tests run yet</p>
              ) : (
                testResults.map((result, idx) => (
                  <div key={idx} className="text-sm mb-2 font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory State Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {userProfile ? JSON.stringify(userProfile, null, 2) : 'Loading...'}
            </pre>
          </CardContent>
        </Card>

        {/* Conversation Context */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation Context</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {conversationContext ? JSON.stringify({
                sessionId: conversationContext.sessionId,
                currentTopic: conversationContext.currentTopic,
                lastUserIntent: conversationContext.lastUserIntent,
                messagesCount: conversationContext.messages.length,
                referencesCount: conversationContext.contextualReferences.length,
                multiStepFlow: conversationContext.multiStepFlow
              }, null, 2) : 'Loading...'}
            </pre>
          </CardContent>
        </Card>

        {/* Flow Status */}
        <Card>
          <CardHeader>
            <CardTitle>Flow Status</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {flowStatus ? JSON.stringify(flowStatus, null, 2) : 'Loading...'}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Session ID:</strong> {sessionId}
            </div>
            <div>
              <strong>Visitor ID:</strong> {visitorTracker.visitorId}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}