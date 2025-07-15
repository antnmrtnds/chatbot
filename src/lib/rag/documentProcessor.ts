import { Property } from './types';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';

/**
 * Extracts structured metadata from property content
 * @param content The raw property content
 * @returns Extracted metadata
 */
export function extractPropertyMetadata(content: string): Partial<Property> {
  const metadata: Partial<Property> = {};

  // Extract price (e.g., "Preço: €195.000" or "preço deste apartamento é €195.000")
  const priceMatch = content.match(/preço.*€\s*([\d\.,]+)/i);
  if (priceMatch) {
    metadata.price = parseInt(priceMatch[1].replace(/\./g, ''), 10);
  }

  // Extract typology (e.g., "apartamento T1")
  const typologyMatch = content.match(/apartamento\s+(T\d+)/i);
  if (typologyMatch) {
    metadata.typology = typologyMatch[1];
    metadata.bedrooms = parseInt(typologyMatch[1].substring(1), 10);
  }

  // Extract floor level (e.g., "rés-do-chão", "primeiro andar")
  const floorMatch = content.match(/(rés-do-chão|primeiro andar|segundo andar|terceiro andar)/i);
  if (floorMatch) {
    metadata.floor_level = floorMatch[1];
  }

  // Extract outdoor space and area (e.g., "terraço ... 100 m²", "varanda ... 12 m²")
  const outdoorSpaceMatch = content.match(/(terraço|varanda)/i);
  if (outdoorSpaceMatch) {
    metadata.outdoor_space = outdoorSpaceMatch[1];
    const outdoorAreaRegex = new RegExp(`(?:${outdoorSpaceMatch[1]}|espaço exterior).*?(\\d+)\\s*m²`, 'i');
    const outdoorAreaMatch = content.match(outdoorAreaRegex);
    if (outdoorAreaMatch) {
      metadata.outdoor_area_sqm = parseInt(outdoorAreaMatch[1], 10);
    }
  }

  // Extract position (e.g., "frontal", "traseiro")
  const positionMatch = content.match(/(frontal|traseiro)/i);
  if (positionMatch) {
    metadata.position = positionMatch[1];
  }

  // Extract parking (e.g., "lugar de garagem")
  if (/lugar de garagem/i.test(content)) {
    metadata.parking = true;
  }
  
  // Extract location (e.g., "Localizado em Santa Joana, Aveiro")
  const locationMatch = content.match(/Localizado em ([^,]+),/i);
  if (locationMatch) {
    metadata.location = locationMatch[1].trim();
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
  
  // Add chunk number to each document for deterministic IDs
  docs.forEach((doc, index) => {
    doc.metadata.chunk = index;
  });

  return docs;
}

/**
 * Processes a generic text document, splits it into chunks, and adds metadata.
 * @param content The text content of the document.
 * @param source The name of the source file (e.g., 'financing.txt').
 * @returns An array of LangChain documents.
 */
export async function processGenericDocument(content: string, source: string): Promise<Document[]> {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // Clean the content to remove markdown and excess whitespace
  const cleanedContent = content
    .replace(/#+\s/g, '') // Remove markdown headers (e.g., "### ")
    .replace(/[\*\_]/g, '') // Remove bold/italic markers
    .replace(/\|/g, ' ')   // Replace pipes with spaces
    .replace(/-\s/g, '')   // Remove list item markers
    .replace(/\s\s+/g, ' ') // Replace multiple spaces with a single space
    .trim();

  // Create the documents from the cleaned content.
  const docs = await textSplitter.createDocuments([cleanedContent]);

  // Add the necessary metadata to each chunk.
  docs.forEach((doc, index) => {
    doc.metadata = {
      ...doc.metadata,
      source: source,
      id: source, // Base ID for the document
    };
  });

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