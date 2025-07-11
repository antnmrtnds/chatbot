#!/usr/bin/env tsx

/**
 * Database Diagnostic Script
 * 
 * This script helps diagnose database setup issues by checking
 * what actually exists in your Supabase database.
 * 
 * Usage: npx tsx scripts/diagnose-db.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabase() {
  console.log('🔍 Database Diagnostic Report');
  console.log('============================\n');

  // Test 1: Basic connection
  console.log('1. Testing basic connection...');
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Basic Supabase connection working');
  } catch (error) {
    console.log('❌ Basic connection failed:', error);
    return;
  }

  // Test 2: Try to list all tables in public schema
  console.log('\n2. Checking what tables exist in public schema...');
  try {
    // This is a direct SQL query to check what tables actually exist
    const { data, error } = await supabase
      .rpc('sql', { 
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });
    
    if (error) {
      console.log('⚠️  Cannot query information_schema directly. Trying individual table checks...');
      
      // Fallback: try each table individually
      const tables = ['rag_document_chunks', 'rag_conversations', 'rag_messages', 'rag_lead_captures', 'rag_analytics_events'];
      
      for (const table of tables) {
        try {
          const { error: tableError } = await supabase.from(table).select('*').limit(0);
          if (tableError) {
            console.log(`❌ Table '${table}': ${tableError.message}`);
          } else {
            console.log(`✅ Table '${table}': exists and accessible`);
          }
        } catch (err) {
          console.log(`❌ Table '${table}': ${err}`);
        }
      }
    } else {
      console.log('📋 Tables found in public schema:');
      if (data && data.length > 0) {
        data.forEach((row: any) => {
          const isRagTable = row.table_name.startsWith('rag_');
          console.log(`   ${isRagTable ? '✅' : '📄'} ${row.table_name}`);
        });
      } else {
        console.log('   No tables found in public schema');
      }
    }
  } catch (error) {
    console.log('❌ Error checking tables:', error);
  }

  // Test 3: Check for pgvector extension
  console.log('\n3. Checking pgvector extension...');
  try {
    const { data, error } = await supabase
      .rpc('sql', { 
        query: `SELECT * FROM pg_extension WHERE extname = 'vector';`
      });
    
    if (error) {
      console.log('⚠️  Cannot check extensions directly');
    } else if (data && data.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('❌ pgvector extension is NOT installed');
      console.log('💡 Run: CREATE EXTENSION IF NOT EXISTS vector;');
    }
  } catch (error) {
    console.log('⚠️  Cannot check pgvector extension:', error);
  }

  // Test 4: Check for match_documents function
  console.log('\n4. Checking match_documents function...');
  try {
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: Array(1536).fill(0),
      match_threshold: 0.1,
      match_count: 1
    });
    
    if (error) {
      console.log('❌ match_documents function issue:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('💡 Function needs to be created. Run: npm run create-function');
      }
    } else {
      console.log('✅ match_documents function exists and working');
    }
  } catch (error) {
    console.log('❌ match_documents function error:', error);
  }

  console.log('\n📊 DIAGNOSIS SUMMARY');
  console.log('===================');
  console.log('Based on the results above:');
  console.log('');
  console.log('If you see "relation does not exist" errors:');
  console.log('  → Run: npm run setup-rag');
  console.log('  → Copy and execute the schema SQL in Supabase SQL Editor');
  console.log('');
  console.log('If pgvector extension is missing:');
  console.log('  → Execute: CREATE EXTENSION IF NOT EXISTS vector;');
  console.log('');
  console.log('If match_documents function is missing:');
  console.log('  → Run: npm run create-function');
  console.log('  → Copy and execute the function SQL in Supabase SQL Editor');
  console.log('');
  console.log('After fixing issues, run: npm run verify-rag');
}

// Handle script execution
if (require.main === module) {
  diagnoseDatabase().catch(console.error);
}

export default diagnoseDatabase;