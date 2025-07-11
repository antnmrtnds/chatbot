import { createClient } from '@supabase/supabase-js';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRagTables() {
  console.log('🚀 Creating RAG Visitor Tracking tables...');

  try {
    // Create rag_visitors table
    console.log('📝 Creating rag_visitors table...');
    const { error: visitorsError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS rag_visitors (
          id BIGSERIAL PRIMARY KEY,
          visitor_id UUID UNIQUE NOT NULL,
          session_id TEXT NOT NULL,
          name TEXT,
          email TEXT,
          phone TEXT,
          conversation_started BOOLEAN DEFAULT FALSE,
          messages_count INTEGER DEFAULT 0,
          lead_captured BOOLEAN DEFAULT FALSE,
          first_visit TIMESTAMPTZ DEFAULT NOW(),
          last_activity TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (visitorsError) {
      console.error('❌ Error creating rag_visitors table:', visitorsError);
    } else {
      console.log('✅ rag_visitors table created');
    }

    // Create rag_chat_events table
    console.log('📝 Creating rag_chat_events table...');
    const { error: eventsError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS rag_chat_events (
          id BIGSERIAL PRIMARY KEY,
          visitor_id UUID NOT NULL,
          session_id TEXT NOT NULL,
          event_type TEXT NOT NULL CHECK (event_type IN ('chat_opened', 'conversation_started', 'name_provided', 'message_sent', 'lead_captured')),
          event_data JSONB,
          page_url TEXT,
          page_context JSONB,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (eventsError) {
      console.error('❌ Error creating rag_chat_events table:', eventsError);
    } else {
      console.log('✅ rag_chat_events table created');
    }

    // Test insert to verify everything works
    console.log('🧪 Testing table functionality...');
    const testVisitorId = crypto.randomUUID();
    
    const { error: insertError } = await supabase
      .from('rag_visitors')
      .insert({
        visitor_id: testVisitorId,
        session_id: 'test-session',
        conversation_started: false,
        messages_count: 0,
        lead_captured: false,
      });

    if (insertError) {
      console.error('❌ Error testing insert:', insertError);
    } else {
      console.log('✅ Test insert successful');
      
      // Test event insert
      const { error: eventError } = await supabase
        .from('rag_chat_events')
        .insert({
          visitor_id: testVisitorId,
          session_id: 'test-session',
          event_type: 'chat_opened',
          page_url: '/test',
          timestamp: new Date().toISOString(),
        });

      if (eventError) {
        console.error('❌ Error testing event insert:', eventError);
      } else {
        console.log('✅ Test event insert successful');
      }
      
      // Clean up test data
      await supabase.from('rag_chat_events').delete().eq('visitor_id', testVisitorId);
      await supabase.from('rag_visitors').delete().eq('visitor_id', testVisitorId);
      console.log('🧹 Test data cleaned up');
    }

    console.log('🎉 RAG Visitor Tracking setup complete!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('- rag_visitors: stores visitor information');
    console.log('- rag_chat_events: stores chat events');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
createRagTables();