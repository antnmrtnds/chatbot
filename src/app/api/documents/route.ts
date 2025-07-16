import { Pinecone, FetchResponse } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Initialize clients (ensure environment variables are set)
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get Pinecone index
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);

// Helper to process and chunk a generic document
async function processGenericDocument(
  content: string,
  fileName: string
): Promise<Document[]> {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.createDocuments(
    [content],
    [{ source: fileName, type: 'generic' }]
  );

  docs.forEach((doc, index) => {
    doc.metadata.chunk = index;
  });

  return docs;
}

// POST handler for adding documents
export async function POST(request: Request) {
  try {
    const { content, fileName } = await request.json();

    if (!content || !fileName) {
      return new Response(JSON.stringify({ error: 'Content and fileName are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const docs = await processGenericDocument(content, fileName);

    for (const doc of docs) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: doc.pageContent,
      });
      const embedding = embeddingResponse.data[0].embedding;

      const { loc, chunk, ...metadata } = doc.metadata;
      metadata.pageContent = doc.pageContent;

      const vectorId = `${fileName}-${doc.metadata.chunk}`;

      await pineconeIndex.upsert([{
        id: vectorId,
        values: embedding,
        metadata: metadata
      }]);
    }

    return new Response(JSON.stringify({ message: `Successfully indexed ${docs.length} chunks for ${fileName}.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error adding document:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to add document.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE handler for deleting documents
export async function DELETE(request: Request) {
  try {
    const { fileNames } = await request.json(); // fileNames should be an array of base file names without chunks

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return new Response(JSON.stringify({ error: 'An array of fileNames is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deletePromises = fileNames.map(async (fileName: string) => {
      // For each fileName, create a filter to match either by 'source' (for generic docs/new property docs)
      // or by 'flat_id' (for old property docs that might not have a source)
      const filters: any[] = [
        { source: fileName },
      ];

      // If the filename looks like a flat_id (e.g., "flat_a.txt"), also try to match the flat_id part
      if (fileName.endsWith('.txt')) {
        const flatIdFromFileName = fileName.replace('.txt', '');
        filters.push({ flat_id: flatIdFromFileName });
      }
      
      // Pinecone allows deleting by filtering on metadata using the .delete() method.
      // We use $or to match if either the source or flat_id matches.
      await (pineconeIndex as any).deleteMany({ "$or": filters });
    });

    await Promise.all(deletePromises);

    return new Response(JSON.stringify({ message: `Successfully deleted documents for ${fileNames.join(', ')}.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to delete document.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET handler for listing documents
export async function GET() {
  try {
    const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!); // Re-initialize to ensure it's fresh
    const allIds: string[] = [];

    let paginationToken: string | undefined = undefined;

    do {
      const listResult = await pineconeIndex.listPaginated({
        limit: 100, // Fetch up to 100 records per page
        paginationToken: paginationToken,
      });

      if (listResult.vectors) {
        for (const vector of listResult.vectors) {
          if (vector.id) {
            allIds.push(vector.id);
          }
        }
      }
      paginationToken = listResult.pagination?.next;
    } while (paginationToken);

    const allRecordsWithMetadata: Array<{ id: string; source?: string; flat_id?: string; }> = [];

    // Fetch metadata for batches of IDs
    const batchSize = 100;
    for (let i = 0; i < allIds.length; i += batchSize) {
      const batchIds = allIds.slice(i, i + batchSize);
      const fetchResult: any = await pineconeIndex.fetch(batchIds);
      console.log("Fetch Result:", fetchResult);
      
      for (const id of batchIds) {
        const vector = fetchResult.vectors![id];
        if (vector && vector.metadata) {
          allRecordsWithMetadata.push({
            id: vector.id,
            source: vector.metadata.source as string || undefined,
            flat_id: vector.metadata.flat_id as string || undefined,
          });
        }
      }
    }

    return new Response(JSON.stringify({ documents: allRecordsWithMetadata }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error listing documents:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to list documents.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 