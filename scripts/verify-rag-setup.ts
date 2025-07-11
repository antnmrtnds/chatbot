import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('❌ Missing required environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  console.log('- OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

async function verifySetup() {
  console.log('🔍 Verifying RAG Chatbot Setup...\n');

  // Test 1: Check Supabase connection
  console.log('1. Testing Supabase connection...');
  try {
    // Use a more basic connection test that doesn't depend on specific tables
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.log('❌ Supabase connection failed:', error instanceof Error ? error.message : String(error));
    return;
  }

  // Test 2: Check if tables exist
  console.log('\n2. Checking database tables...');
  const tables = ['rag_document_chunks', 'rag_conversations', 'rag_messages', 'rag_lead_captures', 'rag_analytics_events'];
  let tablesExist = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) throw error;
      console.log(`✅ Table '${table}' exists and accessible`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      console.log(`❌ Table '${table}' issue:`, errorMsg);
      tablesExist = false;
      
      if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
        console.log(`💡 Table '${table}' needs to be created. Execute the schema SQL file.`);
      } else if (errorMsg.includes('permission')) {
        console.log(`💡 Permission issue with table '${table}'. Check RLS policies.`);
      }
    }
  }
  
  if (!tablesExist) {
    console.log('\n❌ Some tables are missing or inaccessible.');
    console.log('💡 Please execute the schema SQL file in your Supabase SQL Editor:');
    console.log('   Run: npm run setup-rag');
    console.log('   Copy and paste the schema SQL into Supabase SQL Editor');
    return; // Skip remaining tests if tables don't exist
  }

  // Test 3: Check pgvector extension
  console.log('\n3. Checking pgvector extension...');
  try {
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: Array(1536).fill(0),
      match_threshold: 0.1,
      match_count: 1
    });
    if (error) throw error;
    console.log('✅ pgvector extension and match_documents function working');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
    console.log('❌ pgvector or match_documents function issue:', errorMsg);
    
    if (errorMsg.includes('function public.match_documents') || errorMsg.includes('does not exist')) {
      console.log('💡 The match_documents function needs to be created. Execute the functions SQL file.');
    } else if (errorMsg.includes('vector')) {
      console.log('💡 The pgvector extension may not be enabled. Run: CREATE EXTENSION IF NOT EXISTS vector;');
    }
  }

  // Test 4: Check OpenAI connection
  console.log('\n4. Testing OpenAI connection...');
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'test'
    });
    console.log('✅ OpenAI API connection successful');
  } catch (error) {
    console.log('❌ OpenAI API connection failed:', error instanceof Error ? error.message : String(error));
  }

  // Test 5: Check document count
  console.log('\n5. Checking indexed documents...');
  try {
    const { count, error } = await supabase
      .from('rag_document_chunks')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    if (count === 0 || count === null) {
      console.log('⚠️  No documents indexed yet. Run: npm run index-documents');
    } else {
      console.log(`✅ Found ${count} indexed document chunks`);
      
      // Check embeddings
      const { count: embeddingCount, error: embeddingError } = await supabase
        .from('rag_document_chunks')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null);
      
      if (embeddingError) throw embeddingError;
      console.log(`✅ ${embeddingCount || 0} chunks have embeddings`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
    console.log('❌ Error checking documents:', errorMsg);
  }

  // Test 6: Test a simple RAG query
  console.log('\n6. Testing RAG query...');
  try {
    // Generate embedding for test query
    const testQuery = 'apartamentos disponíveis';
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testQuery
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search for similar documents
    const { data: matches, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: 3
    });
    
    if (error) throw error;
    
    if (matches && matches.length > 0) {
      console.log(`✅ RAG query successful - found ${matches.length} relevant documents`);
      console.log('Sample match:', {
        content: matches[0].content.substring(0, 100) + '...',
        similarity: matches[0].similarity
      });
    } else {
      console.log('⚠️  RAG query returned no results. This might be normal if no documents are indexed yet.');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error, null, 2);
    console.log('❌ RAG query test failed:', errorMsg);
    
    if (errorMsg.includes('match_documents')) {
      console.log('💡 The match_documents function is missing. Execute the functions SQL file.');
    } else if (errorMsg.includes('rag_document_chunks')) {
      console.log('💡 The rag_document_chunks table is missing. Execute the schema SQL file.');
    } else if (errorMsg.includes('OpenAI') || errorMsg.includes('API')) {
      console.log('💡 Check your OpenAI API key and credits.');
    }
  }

  console.log('\n🎉 Setup verification complete!');
  console.log('\nNext steps:');
  console.log('1. If any tests failed, follow the manual setup guide');
  console.log('2. Index documents using the document indexer');
  console.log('3. Test the chatbot at /rag-demo');
}

// Run verification
verifySetup().catch(console.error);