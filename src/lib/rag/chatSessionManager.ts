import { ChatMessage, ChatSession, Property, SearchFilters } from './types';
import { processQuery, extractFiltersFromQuery } from './ragChain';
import { similaritySearch } from './vectorStore';

/**
 * Create a new chat session
 * @returns A new chat session
 */
export function createChatSession(): ChatSession {
  return {
    messages: [
      {
        role: 'system',
        content: 'I am a real estate assistant that can help you find properties and answer questions about listings.'
      }
    ],
    context: {
      relevantProperties: []
    }
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
 * @returns Updated chat session with assistant response
 */
export async function processUserMessage(
  session: ChatSession,
  message: string
): Promise<ChatSession> {
  // Add user message to session
  let updatedSession = addUserMessage(session, message);
  
  try {
    // Extract filters from the query
    const filters = extractFiltersFromQuery(message);
    
    // Get relevant properties for context
    const searchResults = await similaritySearch(message, filters, 5);
    const relevantProperties = searchResults.map(result => ({
      id: result.id,
      content: result.content,
      flat_id: result.metadata.flat_id || '',
      price: result.metadata.price || '',
      location: result.metadata.location,
      bedrooms: result.metadata.bedrooms,
      bathrooms: result.metadata.bathrooms,
      squareFootage: result.metadata.squareFootage,
      amenities: result.metadata.amenities
    }));
    
    // Update context
    if (updatedSession.context) {
      updatedSession.context.relevantProperties = relevantProperties;
    }
    
    // Process the query
    const response = await processQuery(
      message,
      updatedSession.messages.filter(msg => msg.role !== 'system'),
      filters
    );
    
    // Add assistant response
    updatedSession = addAssistantMessage(updatedSession, response);
    
    return updatedSession;
  } catch (error) {
    console.error('Error processing user message:', error);
    
    // Add error response
    const errorMessage = 'I apologize, but I encountered an error while processing your request. Please try again.';
    updatedSession = addAssistantMessage(updatedSession, errorMessage);
    
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