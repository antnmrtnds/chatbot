import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { ChatMessage } from './types';

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

/**
 * Initialize the Pinecone client
 */
export async function initPinecone(): Promise<Pinecone> {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }
    
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  
  return pineconeClient;
}

/**
 * Get the Pinecone index for chat history
 */
export async function getChatHistoryIndex() {
  const pinecone = await initPinecone();
  const indexName = process.env.PINECONE_CHAT_HISTORY_INDEX_NAME || 'chat-history';
  
  return pinecone.Index(indexName);
}

/**
 * Create a LangChain vector store for chat history
 */
export async function createChatHistoryVectorStore() {
  const pineconeIndex = await getChatHistoryIndex();
  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
  });
  
  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });
}

/**
 * Add a chat message to the Pinecone index
 * @param message The chat message
 * @param visitorId The visitor's ID
 * @param sessionId The session's ID
 */
export async function addMessageToHistory(
  message: ChatMessage,
  visitorId: string,
  sessionId: string
): Promise<void> {
  const vectorStore = await createChatHistoryVectorStore();
  
  const doc = new Document({
    pageContent: message.content,
    metadata: {
      role: message.role,
      visitorId,
      sessionId,
      timestamp: new Date().toISOString(),
    },
  });
  
  await vectorStore.addDocuments([doc]);
}

/**
 * Retrieve relevant chat history from Pinecone
 * @param query The user's current query
 * @param visitorId The visitor's ID
 * @param k The number of messages to retrieve
 * @returns Array of relevant chat messages
 */
export async function getRelevantChatHistory(
  query: string,
  visitorId: string,
  k: number = 5
): Promise<ChatMessage[]> {
  const vectorStore = await createChatHistoryVectorStore();
  
  const results = await vectorStore.similaritySearch(query, k, {
    visitorId,
  });
  
  return results.map(doc => ({
    role: doc.metadata.role,
    content: doc.pageContent,
  }));
} 