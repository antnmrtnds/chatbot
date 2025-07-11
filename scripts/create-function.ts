#!/usr/bin/env tsx

/**
 * Create match_documents Function Script
 * 
 * This script displays the SQL needed to create the match_documents function.
 * Use this if the verification shows the function is missing.
 * 
 * Usage: npx tsx scripts/create-function.ts
 */

import * as fs from 'fs';
import * as path from 'path';

function main() {
  console.log('🔧 CREATE MATCH_DOCUMENTS FUNCTION');
  console.log('===================================\n');

  console.log('Copy and paste the following SQL into your Supabase SQL Editor:\n');
  console.log('─'.repeat(60));

  try {
    const functionsPath = path.join(process.cwd(), 'supabase', 'functions', 'match_documents.sql');
    
    if (fs.existsSync(functionsPath)) {
      const functionsContent = fs.readFileSync(functionsPath, 'utf8');
      console.log(functionsContent);
    } else {
      // Fallback SQL if file doesn't exist
      console.log(`-- Function to match documents using vector similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  embedding vector(1536),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rag_document_chunks.id,
    rag_document_chunks.content,
    rag_document_chunks.metadata,
    rag_document_chunks.embedding,
    1 - (rag_document_chunks.embedding <=> query_embedding) AS similarity
  FROM rag_document_chunks
  WHERE 1 - (rag_document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY rag_document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO anon;`);
    }
  } catch (error) {
    console.error('❌ Error reading function file:', error);
  }

  console.log('─'.repeat(60));
  console.log('\n📋 Steps:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Paste the SQL above');
  console.log('4. Click "Run"');
  console.log('5. Run: npm run verify-rag');
  console.log('\n✨ This will create the vector search function needed for RAG queries.');
}

// Handle script execution
if (require.main === module) {
  main();
}

export default main;