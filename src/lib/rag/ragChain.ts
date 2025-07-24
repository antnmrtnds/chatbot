import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatMessage, Property, SearchFilters, VectorSearchResult } from './types';
import { similaritySearch } from './vectorStore';
import { getAvailablePropertiesSummary } from './propertyService';

// Helper function to format documents as string
function formatDocumentsAsString(docs: VectorSearchResult[]): string {
  return docs.map(doc => {
    // If content is available, use it. Otherwise, format metadata.
    if (doc.content) {
      return doc.content;
    }
    
    // Format metadata into a readable string if it exists
    if (doc.metadata) {
      return Object.entries(doc.metadata)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');
    }
    
    return ''; // Return empty string if no content or metadata
  }).join('\n\n');
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

/**
 * Create context-aware retrieval queries based on conversation history
 * @param query The current user query
 * @param chatHistory The conversation history
 * @returns Enhanced search queries for better retrieval
 */
function createContextAwareQueries(query: string, chatHistory: ChatMessage[]): string[] {
  const queries = [query]; // Always include the original query
  
  // If there's conversation history, create additional context-rich queries
  if (chatHistory.length > 0) {
    // Get recent conversation context (last 4 messages)
    const recentMessages = chatHistory.slice(-4);
    const conversationContext = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    // Create a context-enriched query that includes conversation flow
    const contextEnrichedQuery = `Baseado na conversa: "${query}"\n\nContexto da conversa:\n${conversationContext}`;
    queries.push(contextEnrichedQuery);
    
    // If the query seems to be asking for more details, create specific search queries
    const queryLower = query.toLowerCase();
    const detailRequestIndicators = [
      'mais', 'detalhe', 'informação', 'específico', 'completo', 
      'more', 'detail', 'information', 'specific', 'complete'
    ];
    
    if (detailRequestIndicators.some(indicator => queryLower.includes(indicator))) {
      // Add queries for different aspects of detailed information
      queries.push(
        'condições de pagamento e financiamento detalhadas',
        'características técnicas e acabamentos específicos',
        'localização vantagens proximidades transportes',
        'investimento valorização potencial mercado imobiliário'
      );
    }
  }
  
  return queries;
}

// Enhanced System prompt template with conversation awareness
const SYSTEM_TEMPLATE = `És um assistente imobiliário especializado para o empreendimentos da UpInvestments, particularmente o Evergreen Pure em Aveiro.

CONTEXTO DA CONVERSA:
Preferências do Utilizador (onboarding):
{onboardingAnswers}

Histórico da Conversa:
{chatHistory}

INSTRUÇÕES PRINCIPAIS:

1. **NATURAL CONVERSATION UNDERSTANDING**: 
   - Analisa naturalmente o fluxo da conversa sem depender de padrões rígidos
   - Quando o utilizador se refere a "este apartamento", "essa unidade", ou usa referências contextuais, compreende automaticamente do contexto da conversa
   - Detecta naturalmente quando o utilizador quer mais informações sobre algo já mencionado

2. **PROGRESSIVE INFORMATION DISCLOSURE**:
   - Se já forneceste informações básicas sobre um apartamento, NUNCA repitas exatamente a mesma informação
   - Para pedidos de mais detalhes, fornece informações progressivamente mais específicas:
     • Primeira vez: informações básicas (preço, área, tipologia)
     • Segunda vez: detalhes técnicos, acabamentos, divisões específicas
     • Terceira vez: contexto de investimento, financiamento, localização
     • Seguintes: vantagens únicas, comparações, próximos passos

3. **CONVERSATION CONTEXT AWARENESS**:
   - Usa o histórico da conversa para compreender referências implícitas
   - Mantém coerência com informações já partilhadas
   - Constrói sobre conversas anteriores em vez de recomeçar

4. **SEMANTIC UNDERSTANDING**:
   - Compreende a intenção por trás das perguntas, não apenas palavras-chave
   - Identifica quando o utilizador quer detalhes específicos vs. informações gerais
   - Adapta o nível de detalhe baseado no interesse demonstrado

5. **DYNAMIC RESPONSE ADAPTATION**:
   - Responde de forma diferente baseada no estágio da conversa
   - Inicial: apresentação geral e despertar interesse
   - Interesse demonstrado: detalhes técnicos e específicos
   - Consideração avançada: financiamento, visitas, próximos passos

6. **CONTEXT-RICH RETRIEVAL UTILIZATION**:
   - Usa informações do "Contexto dos Documentos" para fornecer respostas precisas e detalhadas
   - Combina informações de múltiplas fontes para respostas completas
   - Prioriza informações relevantes ao estado atual da conversa

7. **SCHEDULING**:
   - When the user expresses intent to schedule a viewing or a meeting, identify this intent.
   - Trigger the scheduling flow by using a special response format: '[SCHEDULE_MEETING]'.
   - If the user's intent is to schedule a viewing for a specific property, find the property's ID (e.g., from 'ID do Apartamento') in the 'CONTEXT DOS DOCUMENTOS' and include it in the response, like this: '[SCHEDULE_MEETING:bloco1_a]'. Crucially, **never** use the literal string 'property_id'.
   - If the user wants a general consultation, use: '[SCHEDULE_MEETING:general_consultation]'.
   - Do not attempt to schedule the meeting yourself. Simply use the special response format to trigger the scheduling UI.
   - If you cannot find an answer to the user's question or if the search results from the context are empty, state that you couldn't find a direct match for their preferences. Then, present the available property summary by mentioning the available typologies and price ranges. Ask if they would like to explore these options. Do not trigger the scheduling flow in this case.

**FORMATTING GUIDELINES:**
- Use **negrito** para informações-chave (preços, áreas, nomes)
- Use bullet points (•) para listas de características
- Organize informações em secções claras
- Inclui sempre uma call-to-action apropriada ao contexto

**CONTEXT DOS DOCUMENTOS:**
{context}

**PERGUNTA DO UTILIZADOR:** {question}

Responde de forma natural e contextualmente apropriada, demonstrando compreensão do fluxo da conversa.`;

/**
 * Format chat history for the prompt with better context structure
 * @param messages Array of chat messages
 * @returns Formatted chat history string
 */
function formatChatHistory(messages: ChatMessage[]): string {
  if (messages.length === 0) return "Conversa iniciada agora.";
  
  // Format with clear conversation flow
  return messages
    .slice(-8) // Keep last 8 messages for context without overwhelming
    .map((message, index) => {
      const role = message.role === 'user' ? 'Utilizador' : 'Assistente';
      return `${role}: ${message.content}`;
    })
    .join('\n\n');
}

/**
 * Create a RAG chain for property listings
 * @returns A runnable sequence that can be invoked with a query and chat history
 */
export function createRagChain() {
  // Initialize the language model with optimal settings for conversation
  const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.3, // Slightly higher for more natural conversation
    maxTokens: 1000, // Reasonable response length
  });

  // Create the prompt template
  const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

  // Create the RAG chain with conversation-aware retrieval
  const ragChain = RunnableSequence.from([
    {
      context: async (input: { question: string; chatHistory: ChatMessage[]; onboardingAnswers: Record<string, any>; filters?: SearchFilters }) => {
        console.log('RAG Chain - Processing query with conversation context');
        console.log('Question:', input.question);
        console.log('Chat history length:', input.chatHistory.length);
        
        // Create context-aware queries for better retrieval
        const searchQueries = createContextAwareQueries(input.question, input.chatHistory);
        console.log('Generated search queries:', searchQueries);
        
        // Perform semantic search with multiple queries for comprehensive retrieval
        const allDocs: VectorSearchResult[] = [];
        
        for (const searchQuery of searchQueries) {
          const docs = await similaritySearch(searchQuery, input.filters, 3);
          // Add unique documents to avoid duplicates
          docs.forEach(doc => {
            if (!allDocs.find(existingDoc => existingDoc.id === doc.id)) {
              allDocs.push(doc);
            }
          });
        }
        
        // Limit total documents to avoid context window issues
        const finalDocs = allDocs.slice(0, 8);
        console.log(`Retrieved ${finalDocs.length} unique documents for context`);
        
        if (finalDocs.length === 0) {
          console.log('No relevant documents found. Getting available properties summary.');
          const summary = await getAvailablePropertiesSummary();
          return `Não foram encontrados resultados para a sua pesquisa. ${summary || 'Não há propriedades disponíveis no momento.'}`;
        }
        
        const formattedContext = formatDocumentsAsString(finalDocs);
        return formattedContext;
      },
      question: (input: { question:string }) => input.question,
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
    
    // Handle onboarding completion
    if (query === "Encontre imóveis com base nas minhas respostas." && Object.keys(onboardingAnswers).length > 0) {
      finalQuery = generateSearchQueryFromAnswers(onboardingAnswers);
      console.log("Generated search query from onboarding answers:", finalQuery);
    }

    console.log('Processing query with modern RAG approach:', finalQuery);
    
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