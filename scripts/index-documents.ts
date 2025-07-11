#!/usr/bin/env tsx

/**
 * Document Indexing Script
 * 
 * This script indexes documents for the RAG system.
 * Run this after setting up the database schema manually.
 * 
 * Usage: npx tsx scripts/index-documents.ts
 */

import DocumentIndexer from '../src/lib/documentIndexer';

async function main() {
  console.log('📚 Starting Document Indexing...\n');

  try {
    const indexer = new DocumentIndexer();
    
    console.log('🗑️  Clearing existing index...');
    await indexer.clearIndex();
    console.log('✅ Existing index cleared');

    console.log('📄 Indexing general information...');
    await indexer.indexGeneralInformation();
    console.log('✅ General information indexed');

    console.log('🏠 Indexing property data...');
    await indexer.indexPropertyData();
    console.log('✅ Property data indexed');

    // Get and display stats
    const stats = await indexer.getIndexStats();
    console.log('\n📊 Indexing Statistics:');
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Document types: ${Object.keys(stats.documentTypes).join(', ')}`);
    console.log(`   Sources: ${stats.sources.length}`);

    console.log('\n🎉 Document indexing completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the chatbot at /rag-demo');
    console.log('2. Run verification: npm run verify-rag');

  } catch (error) {
    console.error('\n❌ Document indexing failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('\n💡 It looks like the database tables haven\'t been created yet.');
        console.error('Please run: npm run setup-rag');
        console.error('And follow the manual SQL setup instructions.');
      } else if (error.message.includes('OPENAI_API_KEY')) {
        console.error('\n💡 Please check your OpenAI API key in .env.local');
      } else if (error.message.includes('SUPABASE')) {
        console.error('\n💡 Please check your Supabase configuration in .env.local');
      }
    }
    
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

export default main;