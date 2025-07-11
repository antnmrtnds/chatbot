import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatMessage, Property, SearchFilters, VectorSearchResult } from './types';
import { similaritySearch } from './vectorStore';

// Helper function to format documents as string
function formatDocumentsAsString(docs: VectorSearchResult[]): string {
  return docs.map(doc => doc.content).join('\n\n');
}

// System prompt template
const SYSTEM_TEMPLATE = `És um assistente imobiliário especializado nos apartamentos do empreendimento Evergreen Pure.
A tua principal função é ajudar os utilizadores a encontrar o apartamento ideal com base nos seus critérios e responder a perguntas sobre as propriedades disponíveis.

Usa os seguintes excertos de contexto para responder à pergunta do utilizador.
Se não souberes a resposta, diz apenas que não tens essa informação. Não inventes respostas.
Mantém as tuas respostas concisas e focadas na informação dos imóveis.

Contexto:
{context}

Histórico da Conversa:
{chatHistory}

Pergunta do Utilizador: {question}`;

/**
 * Format chat history for the prompt
 * @param messages Array of chat messages
 * @returns Formatted chat history string
 */
function formatChatHistory(messages: ChatMessage[]): string {
  return messages
    .map(message => `${message.role}: ${message.content}`)
    .join('\n');
}

/**
 * Create a RAG chain for property listings
 * @returns A runnable sequence that can be invoked with a query and chat history
 */
export function createRagChain() {
  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.2,
  });

  // Create the prompt template
  const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

  // Create the RAG chain
  const ragChain = RunnableSequence.from([
    {
      context: async (input: { question: string; chatHistory: ChatMessage[]; filters?: SearchFilters }) => {
        // Retrieve relevant documents based on the question
        const docs = await similaritySearch(input.question, input.filters, 5);
        return formatDocumentsAsString(docs);
      },
      question: (input: { question: string }) => input.question,
      chatHistory: (input: { chatHistory: ChatMessage[] }) => formatChatHistory(input.chatHistory),
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  return ragChain;
}

/**
 * Process a user query using the RAG chain
 * @param query The user's query
 * @param chatHistory Previous chat messages
 * @param filters Optional search filters
 * @returns The assistant's response
 */
export async function processQuery(
  query: string,
  chatHistory: ChatMessage[],
  filters?: SearchFilters
): Promise<string> {
  const chain = createRagChain();
  
  try {
    const response = await chain.invoke({
      question: query,
      chatHistory,
      filters,
    });
    
    return response;
  } catch (error) {
    console.error('Error processing query:', error);
    return 'Peço desculpa, mas encontrei um erro ao processar a sua questão. Por favor, tente novamente.';
  }
}

/**
 * Extract search filters from a user query
 * @param query The user's query
 * @returns Extracted search filters
 */
export function extractFiltersFromQuery(query: string): SearchFilters {
  const filters: SearchFilters = {};
  const lowerQuery = query.toLowerCase();

  const parsePrice = (priceStr: string): number => {
    const hasK = /k/i.test(priceStr);
    const cleanedStr = priceStr
      .replace(/\./g, '') // Remove thousand separators
      .replace(/,/, '.')   // Replace decimal comma with a dot
      .replace(/k/i, '');  // Remove k
    const price = parseFloat(cleanedStr);
    return hasK ? price * 1000 : price;
  }

  // Extract price range (e.g., "entre 100k e 200k", "abaixo de 250000", "acima de 150.000")
  const priceRangeMatch = lowerQuery.match(/entre\s*([\d\.,]+k?)\s*e\s*([\d\.,]+k?)/);
  if (priceRangeMatch) {
    filters.minPrice = parsePrice(priceRangeMatch[1]);
    filters.maxPrice = parsePrice(priceRangeMatch[2]);
  } else {
    const maxPriceMatch = lowerQuery.match(/(?:abaixo de|menos de|até)\s*([\d\.,]+k?)/);
    if (maxPriceMatch) {
      filters.maxPrice = parsePrice(maxPriceMatch[1]);
    }
    const minPriceMatch = lowerQuery.match(/(?:acima de|mais de)\s*([\d\.,]+k?)/);
    if (minPriceMatch) {
      filters.minPrice = parsePrice(minPriceMatch[1]);
    }
  }

  // Extract location
  const locationMatch = lowerQuery.match(/em\s+([a-zA-Z\s,çã]+?)(?:,|\s+com|$)/);
  if (locationMatch) {
    filters.location = locationMatch[1].trim();
  }

  // Extract typology (T1, T2, etc.) or number of bedrooms
  const typologyMatch = query.match(/T(\d+)/i) || lowerQuery.match(/(\d+)\s+quarto/);
  if (typologyMatch) {
    filters.typology = `T${typologyMatch[1]}`;
    filters.bedrooms = parseInt(typologyMatch[1], 10);
  }

  // Extract outdoor space
  const outdoorKeywords = ['terraço', 'varanda', 'jardim'];
  const foundOutdoorSpaces = outdoorKeywords.filter(keyword => lowerQuery.includes(keyword));
  if (foundOutdoorSpaces.length > 0) {
    filters.outdoor_space = foundOutdoorSpaces;
  }
  
  // Extract parking
  if (lowerQuery.includes('garagem') || lowerQuery.includes('estacionamento')) {
    filters.parking = true;
  }

  return filters;
}