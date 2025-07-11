import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRagVisitorTracking() {
  console.log('🚀 Setting up RAG Visitor Tracking tables...');

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schemas', 'rag_visitor_tracking.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    const { error } = await supabase.rpc('exec_sql', { sql: schemaSql });

    if (error) {
      console.error('❌ Error creating tables:', error);
      
      // Try alternative approach - execute statements one by one
      console.log('🔄 Trying alternative approach...');
      
      // Split SQL into individual statements
      const statements = schemaSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            if (stmtError) {
              console.warn('⚠️ Warning executing statement:', stmtError.message);
            }
          } catch (err) {
            console.warn('⚠️ Warning with statement:', err);
          }
        }
      }
    }

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['rag_visitors', 'rag_chat_events']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }

    console.log('✅ Tables found:', tables?.map(t => t.table_name));

    // Test insert to verify permissions
    const testVisitorId = '00000000-0000-0000-0000-000000000001';
    const { error: insertError } = await supabase
      .from('rag_visitors')
      .upsert({
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
      
      // Clean up test data
      await supabase
        .from('rag_visitors')
        .delete()
        .eq('visitor_id', testVisitorId);
    }

    console.log('🎉 RAG Visitor Tracking setup complete!');
    console.log('');
    console.log('📊 You can now view visitor data in Supabase:');
    console.log('- rag_visitors table: stores visitor information');
    console.log('- rag_chat_events table: stores chat events');
    console.log('- rag_visitor_analytics view: analytics data');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupRagVisitorTracking();