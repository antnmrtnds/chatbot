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

function formatOnboardingAnswers(answers: Record<string, any>): string {
  if (Object.keys(answers).length === 0) return "Nenhuma preferência foi recolhida ainda.";
  return Object.entries(answers)
    .map(([question, answer]) => `- ${question}: ${answer}`)
    .join('\n');
}

function generateSearchQueryFromAnswers(answers: Record<string, any>): string {
  let queryParts = ["Encontrar um apartamento com as seguintes características:"];
  
  const questionToField: Record<string, string> = {
    "Que tipo de apartamento procura?": "Tipologia",
    "Qual é o orçamento disponível para o investimento?": "Orçamento",
    "O apartamento é para habitação própria, investimento ou outra finalidade?": "Finalidade",
    "Em que fase da construção prefere adquirir?": "Fase de construção",
    "Há características/sugestões essenciais? (ex: varanda, garagem, vista, etc.)": "Características essenciais",
    "Pretende saber mais sobre condições de financiamento ou campanhas em vigor?": "Interesse em financiamento"
  };

  for (const [question, answer] of Object.entries(answers)) {
    if (questionToField[question] && answer && answer.toLowerCase() !== 'pular' && answer.toLowerCase() !== 'não') {
      queryParts.push(`${questionToField[question]}: ${answer}`);
    }
  }
  
  return queryParts.join(', ');
}

// System prompt template
const SYSTEM_TEMPLATE = `És um assistente imobiliário especializado para o empreendimento Evergreen Pure.
A tua função principal é ajudar os utilizadores a encontrar o apartamento ideal com base nos seus critérios e responder a perguntas sobre as propriedades disponíveis, bem como sobre opções de pagamento e financiamento.

**Contexto da Conversa:**
Preferências do Utilizador (recolhidas durante o onboarding):
{onboardingAnswers}

Histórico da Conversa:
{chatHistory}

**Instruções Principais:**
1.  **Usa as Preferências do Utilizador**: Analisa as preferências do utilizador acima. Usa o seu orçamento, tipologia desejada e outras características para personalizar as tuas sugestões e argumentos.
2.  **Usa o Contexto Fornecido**: Utiliza SEMPRE a informação da secção "Contexto dos Documentos" abaixo para responder às perguntas. Este contexto contém informações detalhadas e atualizadas sobre os apartamentos e as opções de financiamento.
3.  **Destaca Benefícios**: Ao interagir, realça proativamente os benefícios de comprar um imóvel em planta ou em construção, como potencial de valorização, opções de personalização e facilidades de pagamento.
4.  **Responde a Perguntas de Financiamento**: Quando te perguntarem sobre pagamentos, financiamento, impostos ou prazos, usa a informação de contexto para dar respostas claras e detalhadas.
5.  **Oferece o Próximo Passo**: No final das interações ou quando apropriado, oferece sempre a possibilidade de agendar uma visita ao stand de vendas ou uma reunião com um consultor para dar seguimento ao interesse.
6.  **Apresenta a Informação de Forma Clara**: Ao descrever unidades, extrai e apresenta todos os detalhes relevantes do contexto.
7.  **Sê Honesto Sobre Limitações**: Se o contexto não contiver a informação necessária, informa claramente que não tens essa informação. Não inventes detalhes.
8.  **Garante Transparência**: Assegura ao utilizador que os seus dados de contacto serão usados exclusivamente para apresentar propostas adequadas para os empreendimentos da nossa promotora.


**Contexto dos Documentos:**
{context}

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
      context: async (input: { question: string; chatHistory: ChatMessage[]; onboardingAnswers: Record<string, any>; filters?: SearchFilters }) => {
        console.log('RAG Chain Context Input - Question:', input.question);
        console.log('RAG Chain Context Input - Filters:', input.filters);
        // Retrieve relevant documents based on the question
        const docs = await similaritySearch(input.question, input.filters, 5);
        console.log('RAG Chain Context - Retrieved Docs:', docs);
        const formattedContext = formatDocumentsAsString(docs);
        console.log('RAG Chain Context - Formatted Context for LLM:', formattedContext);
        return formattedContext;
      },
      question: (input: { question: string }) => input.question,
      chatHistory: (input: { chatHistory: ChatMessage[] }) => formatChatHistory(input.chatHistory),
      onboardingAnswers: (input: { onboardingAnswers: Record<string, any> }) => formatOnboardingAnswers(input.onboardingAnswers),
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
 * @param onboardingAnswers User's onboarding answers
 * @param filters Optional search filters
 * @returns The assistant's response
 */
export async function processQuery(
  query: string,
  chatHistory: ChatMessage[],
  onboardingAnswers: Record<string, any>,
  filters?: SearchFilters
): Promise<string> {
  const chain = createRagChain();
  
  try {
    let finalQuery = query;
    // If the user has just completed onboarding, generate a query from their answers
    if (query === "Encontre imóveis com base nas minhas respostas." && Object.keys(onboardingAnswers).length > 0) {
      finalQuery = generateSearchQueryFromAnswers(onboardingAnswers);
      console.log("Generated search query from onboarding answers:", finalQuery);
    }

    const response = await chain.invoke({
      question: finalQuery,
      chatHistory: chatHistory,
      onboardingAnswers: onboardingAnswers,
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