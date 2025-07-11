#!/usr/bin/env tsx

/**
 * Create Database Tables Script
 * 
 * This script displays the SQL needed to create the RAG database tables.
 * 
 * Usage: npx tsx scripts/create-tables.ts
 */

import * as fs from 'fs';
import * as path from 'path';

function main() {
  console.log('📋 CREATE RAG DATABASE TABLES');
  console.log('==============================\n');

  console.log('Your diagnosis shows that the tables are missing but the function exists.');
  console.log('You need to create the database tables first.\n');

  console.log('Copy and paste the following SQL into your Supabase SQL Editor:\n');
  console.log('─'.repeat(80));

  try {
    const schemaPath = path.join(process.cwd(), 'supabase', 'schemas', 'rag_chatbot_schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      console.log(schemaContent);
    } else {
      // Fallback SQL if file doesn't exist
      console.log(`-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- RAG Document Chunks Table
CREATE TABLE IF NOT EXISTS rag_document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Conversations Table
CREATE TABLE IF NOT EXISTS rag_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Messages Table
CREATE TABLE IF NOT EXISTS rag_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES rag_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Lead Captures Table
CREATE TABLE IF NOT EXISTS rag_lead_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES rag_conversations(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  lead_data JSONB NOT NULL,
  capture_reason TEXT NOT NULL,
  page_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG Analytics Events Table
CREATE TABLE IF NOT EXISTS rag_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  event_category TEXT NOT NULL,
  event_action TEXT NOT NULL,
  event_label TEXT,
  event_value INTEGER,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rag_document_chunks_embedding ON rag_document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_rag_conversations_visitor_id ON rag_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rag_conversations_session_id ON rag_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_messages_conversation_id ON rag_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rag_messages_created_at ON rag_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_lead_captures_visitor_id ON rag_lead_captures(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rag_analytics_events_visitor_id ON rag_analytics_events(visitor_id);

-- Enable Row Level Security
ALTER TABLE rag_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_lead_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, customize as needed)
CREATE POLICY "Allow all operations on rag_document_chunks" ON rag_document_chunks FOR ALL USING (true);
CREATE POLICY "Allow all operations on rag_conversations" ON rag_conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations on rag_messages" ON rag_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on rag_lead_captures" ON rag_lead_captures FOR ALL USING (true);
CREATE POLICY "Allow all operations on rag_analytics_events" ON rag_analytics_events FOR ALL USING (true);`);
    }
  } catch (error) {
    console.error('❌ Error reading schema file:', error);
  }

  console.log('─'.repeat(80));
  console.log('\n📋 Steps:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Paste the SQL above');
  console.log('4. Click "Run"');
  console.log('5. Run: npm run diagnose-db (should show tables exist)');
  console.log('6. Run: npm run verify-rag (should be all green)');
  console.log('7. Run: npm run index-documents');
  console.log('\n✨ This will create all the database tables needed for the RAG system.');
  console.log('The match_documents function you already created will then work correctly!');
}

// Handle script execution
if (require.main === module) {
  main();
}

export default main;