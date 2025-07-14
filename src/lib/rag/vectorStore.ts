import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { VectorSearchResult, SearchFilters, Property } from './types';

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
 * Get the Pinecone index for property listings
 */
export async function getPineconeIndex() {
  const pinecone = await initPinecone();
  const indexName = process.env.PINECONE_INDEX_NAME || 'property-listings';
  
  return pinecone.Index(indexName);
}

/**
 * Create a LangChain vector store using Pinecone
 */
export async function createVectorStore() {
  const pineconeIndex = await getPineconeIndex();
  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
  });
  
  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });
}

/**
 * Index documents in Pinecone
 * @param documents Array of documents to index
 */
export async function indexDocuments(documents: Document[]): Promise<void> {
  const vectorStore = await createVectorStore();
  
  // Add documents to the vector store
  await vectorStore.addDocuments(documents);
  
  console.log(`Indexed ${documents.length} documents in Pinecone`);
}

/**
 * Search for similar documents in Pinecone
 * @param query The search query
 * @param filters Optional metadata filters
 * @param k Number of results to return
 * @returns Array of search results
 */
export async function similaritySearch(
  query: string,
  filters?: SearchFilters,
  k: number = 5
): Promise<VectorSearchResult[]> {
  const vectorStore = await createVectorStore();
  
  // Convert filters to Pinecone filter format
  const pineconeFilters: Record<string, any> = {};
  
  if (filters) {
    if (filters.minPrice || filters.maxPrice) {
      pineconeFilters.price = {};
      if (filters.minPrice) pineconeFilters.price.$gte = filters.minPrice;
      if (filters.maxPrice) pineconeFilters.price.$lte = filters.maxPrice;
    }
    
    if (filters.location) {
      pineconeFilters.location = filters.location;
    }
    
    if (filters.typology) {
      pineconeFilters.typology = filters.typology;
    }

    if (filters.bedrooms) {
      pineconeFilters.bedrooms = filters.bedrooms;
    }
    
    if (filters.outdoor_space && filters.outdoor_space.length > 0) {
      pineconeFilters.outdoor_space = { $in: filters.outdoor_space };
    }

    if (filters.parking !== undefined) {
      pineconeFilters.parking = filters.parking;
    }
  }
  
  // Perform the search
  const results = await vectorStore.similaritySearch(query, k, pineconeFilters);
  
  // Convert to our result format
  return results.map((doc: any) => ({
    id: doc.metadata.id || '',
    content: doc.metadata.pageContent,
    metadata: doc.metadata,
    score: 0, // Score not directly available from LangChain's similaritySearch
  }));
}

/**
 * Delete all documents for a property from the vector store
 * @param propertyId The ID of the property to delete
 */
export async function deletePropertyDocuments(propertyId: string): Promise<void> {
  const pineconeIndex = await getPineconeIndex();
  
  await pineconeIndex.deleteMany({
    filter: {
      id: propertyId,
    },
  });
  
  console.log(`Deleted documents for property ${propertyId} from Pinecone`);
}

/**
 * Update property documents in the vector store
 * @param property The updated property
 * @param documents The processed documents
 */
export async function updatePropertyDocuments(
  property: Property,
  documents: Document[]
): Promise<void> {
  // First delete existing documents
  await deletePropertyDocuments(property.id);
  
  // Then index the new documents
  await indexDocuments(documents);
  
  console.log(`Updated documents for property ${property.id} in Pinecone`);
}