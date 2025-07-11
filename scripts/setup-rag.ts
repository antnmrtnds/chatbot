#!/usr/bin/env tsx

/**
 * RAG System Setup Script
 * 
 * This script provides step-by-step instructions for setting up the RAG system.
 * It guides you through the manual setup process since automated SQL execution
 * is not available through Supabase's REST API.
 * 
 * Usage: npx tsx scripts/setup-rag.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const missing = [];
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!OPENAI_API_KEY) missing.push('OPENAI_API_KEY');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(env => console.error(`   - ${env}`));
    console.error('\nPlease add these to your .env.local file');
    return false;
  }

  console.log('✅ All environment variables are set');
  return true;
}

async function checkSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    
    // Simple connection test - try to access any table
    const { error } = await supabase.from('developments').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is OK
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

function displaySQLInstructions() {
  console.log('\n📋 MANUAL DATABASE SETUP REQUIRED');
  console.log('=====================================');
  console.log('');
  console.log('Since Supabase doesn\'t allow programmatic SQL execution through the REST API,');
  console.log('you need to manually execute the following SQL files in your Supabase SQL Editor:');
  console.log('');
  console.log('🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
  console.log('');
  console.log('📄 STEP 1: Execute the schema file');
  console.log('   File: supabase/schemas/rag_chatbot_schema.sql');
  console.log('   This creates all the necessary tables and indexes');
  console.log('');
  console.log('📄 STEP 2: Execute the functions file');
  console.log('   File: supabase/functions/match_documents.sql');
  console.log('   This creates the vector search function');
  console.log('');
  
  // Display the actual SQL content for easy copy-paste
  console.log('📋 SQL CONTENT TO EXECUTE:');
  console.log('==========================');
  console.log('');
  
  try {
    const schemaPath = path.join(process.cwd(), 'supabase', 'schemas', 'rag_chatbot_schema.sql');
    const functionsPath = path.join(process.cwd(), 'supabase', 'functions', 'match_documents.sql');
    
    if (fs.existsSync(schemaPath)) {
      console.log('🗂️  SCHEMA SQL (copy and paste this into Supabase SQL Editor):');
      console.log('─'.repeat(60));
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      console.log(schemaContent);
      console.log('─'.repeat(60));
      console.log('');
    }
    
    if (fs.existsSync(functionsPath)) {
      console.log('🔧 FUNCTIONS SQL (copy and paste this into Supabase SQL Editor):');
      console.log('─'.repeat(60));
      const functionsContent = fs.readFileSync(functionsPath, 'utf8');
      console.log(functionsContent);
      console.log('─'.repeat(60));
      console.log('');
    }
  } catch (error) {
    console.error('❌ Could not read SQL files:', error);
    console.log('Please manually locate and execute:');
    console.log('   - supabase/schemas/rag_chatbot_schema.sql');
    console.log('   - supabase/functions/match_documents.sql');
  }
}

function displayNextSteps() {
  console.log('🎯 NEXT STEPS AFTER SQL EXECUTION:');
  console.log('==================================');
  console.log('');
  console.log('1. ✅ Execute the SQL files above in Supabase SQL Editor');
  console.log('2. 🔍 Verify setup: npm run verify-rag');
  console.log('3. 📚 Index documents: npm run index-documents');
  console.log('4. 🧪 Test chatbot: Visit /rag-demo in your app');
  console.log('');
  console.log('📖 For detailed instructions, see:');
  console.log('   - docs/MANUAL_SETUP_GUIDE.md');
  console.log('   - README_RAG_SETUP.md');
  console.log('');
  console.log('🆘 If you encounter issues:');
  console.log('   - Check that pgvector extension is enabled: CREATE EXTENSION IF NOT EXISTS vector;');
  console.log('   - Verify all environment variables are set correctly');
  console.log('   - Run the verification script: npm run verify-rag');
}

async function main() {
  console.log('🚀 RAG SYSTEM SETUP GUIDE');
  console.log('=========================\n');

  // Check environment variables
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }
  console.log('');

  // Check Supabase connection
  const connectionOk = await checkSupabaseConnection();
  if (!connectionOk) {
    console.log('⚠️  Continuing with setup instructions despite connection issues...');
  }
  console.log('');

  // Display SQL setup instructions
  displaySQLInstructions();

  // Display next steps
  displayNextSteps();

  console.log('✨ Setup guide complete!');
  console.log('');
  console.log('Remember: This script provides instructions only.');
  console.log('You must manually execute the SQL in your Supabase dashboard.');
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

export default main;