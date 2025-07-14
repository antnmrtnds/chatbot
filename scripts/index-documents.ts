import { createClient } from '@supabase/supabase-js';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX_NAME'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease add these to your .env file and try again.');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Property interface
interface Property {
  id: string;
  flat_id: string;
  content: string;
  price?: number;
  typology?: string;
  bedrooms?: number;
  floor_level?: string;
  outdoor_space?: string;
  outdoor_area_sqm?: number;
  position?: string;
  parking?: boolean;
  location?: string;
}

/**
 * Extracts structured metadata from property content
 * @param content The raw property content
 * @returns Extracted metadata
 */
function extractPropertyMetadata(content: string): Partial<Property> {
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
async function processPropertyDocument(property: Property): Promise<Document[]> {
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
    ...extractedMetadata,
  };
  
  // Split text into chunks
  const docs = await textSplitter.createDocuments(
    [property.content],
    [metadata]
  );
  
  // Add chunk number to metadata for creating a deterministic ID later
  docs.forEach((doc, index) => {
    doc.metadata.chunk = index;
  });
  
  return docs;
}

/**
 * Process a CSV file containing property data
 * @param filePath Path to the CSV file
 * @returns Promise that resolves when processing is complete
 */
async function processCSVFile(filePath: string): Promise<Property[]> {
  const properties: Property[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row: Record<string, any>) => {
        // Construct property content from CSV fields
        const content = constructPropertyContent(row);
        
        // Create property object
        const property: Property = {
          id: row.id || `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          flat_id: row.flat_id || row.id || `flat-${Date.now()}`,
          content,
          price: row.price || '',
        };
        
        properties.push(property);
      })
      .on('end', () => {
        console.log(`✅ Processed ${properties.length} properties from ${filePath}`);
        resolve(properties);
      })
      .on('error', (error: Error) => {
        reject(error);
      });
  });
}

/**
 * Construct property content from CSV row
 * @param row CSV row data
 * @returns Formatted property content
 */
function constructPropertyContent(row: Record<string, any>): string {
  // Combine all relevant fields into a structured text
  const sections = [];
  
  // Basic information
  const basicInfo = [];
  if (row.title) basicInfo.push(`Title: ${row.title}`);
  if (row.flat_id) basicInfo.push(`Flat ID: ${row.flat_id}`);
  if (row.project) basicInfo.push(`Project: ${row.project}`);
  if (row.location) basicInfo.push(`Location: ${row.location}`);
  if (row.price) basicInfo.push(`Price: ${row.price}`);
  
  if (basicInfo.length > 0) {
    sections.push('# Basic Information\n' + basicInfo.join('\n'));
  }
  
  // Property details
  const propertyDetails = [];
  if (row.type) propertyDetails.push(`Type: ${row.type}`);
  if (row.bedrooms) propertyDetails.push(`Bedrooms: ${row.bedrooms}`);
  if (row.bathrooms) propertyDetails.push(`Bathrooms: ${row.bathrooms}`);
  if (row.area) propertyDetails.push(`Area: ${row.area}`);
  if (row.floor) propertyDetails.push(`Floor: ${row.floor}`);
  if (row.orientation) propertyDetails.push(`Orientation: ${row.orientation}`);
  
  if (propertyDetails.length > 0) {
    sections.push('# Property Details\n' + propertyDetails.join('\n'));
  }
  
  // Features and amenities
  const amenities = [];
  if (row.amenities) amenities.push(`Amenities: ${row.amenities}`);
  if (row.features) amenities.push(`Features: ${row.features}`);
  if (row.storage) amenities.push(`Storage: ${row.storage}`);
  if (row.parking) amenities.push(`Parking: ${row.parking}`);
  
  if (amenities.length > 0) {
    sections.push('# Features and Amenities\n' + amenities.join('\n'));
  }
  
  // Description
  if (row.description) {
    sections.push('# Description\n' + row.description);
  }
  
  // Additional information
  const additionalInfo = [];
  if (row.status) additionalInfo.push(`Status: ${row.status}`);
  if (row.availability) additionalInfo.push(`Availability: ${row.availability}`);
  if (row.completion_date) additionalInfo.push(`Completion Date: ${row.completion_date}`);
  
  if (additionalInfo.length > 0) {
    sections.push('# Additional Information\n' + additionalInfo.join('\n'));
  }
  
  return sections.join('\n\n');
}

/**
 * Fetch all properties from Supabase
 * @returns Array of properties
 */
async function getAllProperties(): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('developments')
      .select('id, content, flat_id, price')
      .order('id', { ascending: true });
    
    if (error) {
      throw new Error(`Error fetching properties: ${error.message}`);
    }
    
    return data as Property[];
  } catch (error) {
    console.error('Error in getAllProperties:', error);
    return [];
  }
}

/**
 * Index documents in Pinecone
 * @param documents Array of documents to index
 */
async function indexDocuments(documents: Document[]): Promise<void> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  
  // Process documents in batches to avoid rate limits
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < documents.length; i += batchSize) {
    batches.push(documents.slice(i, i + batchSize));
  }
  
  console.log(`Processing ${batches.length} batches of documents...`);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length}...`);
    
    // Create embeddings for each document
    for (const doc of batch) {
      try {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: doc.pageContent,
        });
        
        const embedding = embeddingResponse.data[0].embedding;

        // Pinecone doesn't allow nested objects in metadata. We remove the `loc` object
        // that LangChain adds. We also don't need the original `id` or `chunk` fields in the metadata.
        const { loc, id, chunk, ...metadata } = doc.metadata;

        // Store the original pageContent in metadata to retrieve it later during similarity search
        metadata.pageContent = doc.pageContent;

        // Create a deterministic ID for each chunk to prevent duplicates on re-runs.
        const vectorId = `${doc.metadata.flat_id}-chunk-${doc.metadata.chunk}`;
        
        // Insert into Pinecone
        await pineconeIndex.upsert([{
          id: vectorId,
          values: embedding,
          metadata: metadata
        }]);
        
      } catch (error: any) {
        console.error(`❌ Error indexing chunk for ${doc.metadata.flat_id} (chunk ${doc.metadata.chunk}):`, error.message);
      }
    }
    
    // Wait a bit between batches to avoid rate limits
    if (i < batches.length - 1) {
      console.log('Waiting before processing next batch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`✅ Indexed ${documents.length} documents in Pinecone`);
}

async function main() {
  console.log('🚀 Starting document indexing process for local property files...\n');

  try {
    // Step 1: Read properties from .txt files
    const propertyDir = path.join(process.cwd(), 'property');
    console.log(`🔍 Reading property files from ${propertyDir}...`);
    
    const files = fs.readdirSync(propertyDir).filter(file => file.endsWith('.txt'));
    if (files.length === 0) {
        console.error('❌ No .txt files found in property/ directory. Please add your files and try again.');
        process.exit(1);
    }
    console.log(`✅ Found ${files.length} property files.`);

    const properties: Property[] = files.map(file => {
        const filePath = path.join(propertyDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const flatId = path.basename(file, '.txt');
        return {
            id: flatId,
            flat_id: flatId,
            content: content,
        };
    });

    // Step 2: Process all properties into document chunks
    console.log('\n🔍 Processing properties into document chunks...');
    let processedCount = 0;
    const allDocs: Document[] = [];
    
    for (const property of properties) {
      try {
        const docs = await processPropertyDocument(property);
        allDocs.push(...docs);
        processedCount++;
        console.log(`(✓) Processed property ${property.id}`);
      } catch (error) {
        console.error(`❌ Error processing property ${property.id}:`, error);
      }
    }
    console.log(`✅ Finished processing ${processedCount}/${properties.length} properties.`);

    // Step 3: Index all document chunks in Pinecone
    if (allDocs.length > 0) {
        console.log(`\n🌲 Indexing ${allDocs.length} document chunks in Pinecone...`);
        await indexDocuments(allDocs);
    }
    
    console.log('\n🎉 Document indexing complete!');
    
  } catch (error) {
    console.error('❌ Error during document indexing:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Error in main function:', error);
  process.exit(1);
});