import { Property } from './types';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';

/**
 * Extracts structured metadata from property content
 * @param content The raw property content
 * @returns Extracted metadata
 */
export function extractPropertyMetadata(content: string): Partial<Property> {
  const metadata: Partial<Property> = {};
  
  // Extract location
  const locationMatch = content.match(/location[:\s]+([^,\n]+)/i);
  if (locationMatch) metadata.location = locationMatch[1].trim();
  
  // Extract bedrooms
  const bedroomsMatch = content.match(/(\d+)\s*bedroom/i) || content.match(/T(\d+)/i);
  if (bedroomsMatch) metadata.bedrooms = parseInt(bedroomsMatch[1], 10);
  
  // Extract bathrooms
  const bathroomsMatch = content.match(/(\d+)\s*bathroom/i);
  if (bathroomsMatch) metadata.bathrooms = parseInt(bathroomsMatch[1], 10);
  
  // Extract square footage
  const squareFootageMatch = content.match(/(\d+)\s*m²/i) || content.match(/(\d+)\s*square\s*meters/i);
  if (squareFootageMatch) metadata.squareFootage = parseInt(squareFootageMatch[1], 10);
  
  // Extract amenities
  const amenitiesRegex = /amenities[:\s]+(.*?)(?:\.|$)/i;
  const amenitiesMatch = content.match(amenitiesRegex);
  if (amenitiesMatch) {
    metadata.amenities = amenitiesMatch[1]
      .split(/,|;/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  return metadata;
}

/**
 * Processes a property document and splits it into chunks for embedding
 * @param property The property to process
 * @returns An array of LangChain documents with metadata
 */
export async function processPropertyDocument(property: Property): Promise<Document[]> {
  // Create text splitter for chunking
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  // Extract metadata
  const extractedMetadata = extractPropertyMetadata(property.content);
  
  // Combine all metadata
  const metadata = {
    id: property.id,
    flat_id: property.flat_id,
    price: property.price,
    ...extractedMetadata,
  };
  
  // Split text into chunks
  const docs = await textSplitter.createDocuments(
    [property.content],
    [metadata]
  );
  
  return docs;
}

/**
 * Batch processes multiple property documents
 * @param properties Array of properties to process
 * @returns Array of processed documents
 */
export async function batchProcessProperties(properties: Property[]): Promise<Document[]> {
  const allDocs: Document[] = [];
  
  for (const property of properties) {
    const docs = await processPropertyDocument(property);
    allDocs.push(...docs);
  }
  
  return allDocs;
}