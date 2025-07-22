import { ChatMessage, ChatSession, Property } from './types';

/**
 * Create a new chat session
 * @returns A new chat session
 */
export function createChatSession(): ChatSession {
  return {
    messages: [
     // Start with empty messages array, let onboarding handle the initial message
    ],
    context: {
      relevantProperties: []
    },
    sessionId: null, // Add sessionId to the session
    onboardingState: 'not_started',
    currentQuestionIndex: 0,
    onboardingAnswers: {},
  };
}

/**
 * Add a user message to the chat session
 * @param session The chat session
 * @param message The user message
 * @returns Updated chat session
 */
export function addUserMessage(session: ChatSession, message: string): ChatSession {
  const updatedSession = { ...session };
  
  updatedSession.messages.push({
    role: 'user',
    content: message
  });
  
  if (updatedSession.context) {
    updatedSession.context.currentQuery = message;
  }
  
  return updatedSession;
}

/**
 * Add an assistant message to the chat session
 * @param session The chat session
 * @param message The assistant message
 * @returns Updated chat session
 */
export function addAssistantMessage(session: ChatSession, message: string): ChatSession {
  const updatedSession = { ...session };
  
  updatedSession.messages.push({
    role: 'assistant',
    content: message
  });
  
  return updatedSession;
}

/**
 * Process a user message and generate a response
 * @param session The chat session
 * @param message The user message
 * @param visitorId The unique ID of the visitor
 * @returns Updated chat session with assistant response
 */
export async function processUserMessage(
  session: ChatSession,
  message: string,
  visitorId: string
): Promise<ChatSession> {
  // Add user message to session
  let updatedSession = addUserMessage(session, message);

  try {
    // Send the user's message to the backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        visitorId,
        sessionId: session.sessionId, // Pass the current session ID
        onboardingAnswers: session.onboardingAnswers,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const { response: assistantResponse, relevantProperties, sessionId } = await response.json();
    
    // Add assistant response
    updatedSession = addAssistantMessage(updatedSession, assistantResponse);
    
    // Update the session with the ID from the backend
    updatedSession.sessionId = sessionId;

    // Update context with relevant properties
    if (updatedSession.context) {
      updatedSession.context.relevantProperties = relevantProperties || [];
    }
    
    return updatedSession;

  } catch (error) {
    console.error('Error processing user message:', error);
    
    // Add error response to the chat
    const errorMessage = 'Peço desculpa, mas encontrei um erro ao processar o seu pedido. Por favor, tente novamente.';
    updatedSession = addAssistantMessage(updatedSession, errorMessage);
    
    // Clear context on error
    if (updatedSession.context) {
      updatedSession.context.relevantProperties = [];
    }

    return updatedSession;
  }
}

/**
 * Get the most recent messages from a chat session
 * @param session The chat session
 * @param count Number of messages to retrieve
 * @returns Recent messages
 */
export function getRecentMessages(session: ChatSession, count: number = 10): ChatMessage[] {
  const messages = session.messages.filter(msg => msg.role !== 'system');
  return messages.slice(-count);
}

/**
 * Clear the chat session history
 * @param session The chat session
 * @returns New chat session
 */
export function clearChatSession(session: ChatSession): ChatSession {
  return createChatSession();
}

/**
 * Get relevant properties from the current context
 * @param session The chat session
 * @returns Array of relevant properties
 */
export function getRelevantProperties(session: ChatSession): Property[] {
  return session.context?.relevantProperties || [];
}

/**
 * Check if the chat session has context
 * @param session The chat session
 * @returns True if the session has context
 */
export function hasContext(session: ChatSession): boolean {
  return !!session.context && session.context.relevantProperties.length > 0;
}