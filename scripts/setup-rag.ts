import { createClient } from '@supabase/supabase-js';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
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

async function setupRagSystem() {
  console.log('🚀 Setting up RAG system...\n');

  // Step 1: Check Supabase connection
  console.log('🔍 Checking Supabase connection...');
  try {
    const { data, error } = await supabase.from('developments').select('count');
    if (error) throw error;
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    console.log('\nPlease check your Supabase credentials and try again.');
    process.exit(1);
  }

  // Step 2: Check Pinecone connection
  console.log('\n🔍 Checking Pinecone connection...');
  try {
    const indexList = await pinecone.listIndexes();
    console.log('✅ Pinecone connection successful');
    
    // Check if the index exists
    const indexName = process.env.PINECONE_INDEX_NAME!;
    const indexExists = indexList.indexes?.some(index => index.name === indexName) || false;
    
    if (!indexExists) {
      console.log(`\n⚠️ Pinecone index '${indexName}' does not exist.`);
      console.log('\n📝 Please create the index manually in the Pinecone dashboard with these settings:');
      console.log('   - Name: property-listings');
      console.log('   - Dimension: 1536');
      console.log('   - Metric: cosine');
      console.log('   - Index Type: Serverless');
      console.log('\n   Free tier users: Use the default region offered by Pinecone (typically us-east1-gcp)');
      console.log('\n   For detailed instructions, see the pinecone-index-config.md file');
      
      console.log('\n⚠️ After creating the index, run this setup script again to continue.');
      process.exit(0);
    } else {
      console.log(`✅ Pinecone index '${indexName}' exists`);
    }
  } catch (error) {
    console.error('❌ Pinecone connection failed:', error);
    console.log('\nPlease check your Pinecone API key and try again.');
    process.exit(1);
  }

  // Step 3: Create necessary directories
  console.log('\n🔍 Setting up project directories...');
  const directories = [
    'data',
    'src/lib/rag',
    'src/components',
    'src/app/apis/chat',
    'src/app/page.tsx',
    'src/app/chat/page.tsx'
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`✅ Directory exists: ${dir}`);
    }
  }

  console.log('\n🎉 RAG system setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run "npm run index-documents" to process and index your property data');
  console.log('2. Start the development server with "npm run dev"');
  console.log('3. Visit http://localhost:3000 to see the chatbot in action');
}

// Run the setup
setupRagSystem().catch(error => {
  console.error('Error during setup:', error);
  process.exit(1);
});