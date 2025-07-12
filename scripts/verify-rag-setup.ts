import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX_NAME'
];

async function verifyRagSetup() {
  console.log(chalk.blue('🔍 Verifying RAG setup...\n'));

  // Step 1: Check environment variables
  console.log(chalk.blue('Checking environment variables...'));
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.error(chalk.red('❌ Missing required environment variables:'));
    missingEnvVars.forEach(varName => console.error(chalk.red(`   - ${varName}`)));
    console.error(chalk.yellow('\nPlease add these to your .env file and try again.'));
    process.exit(1);
  }

  console.log(chalk.green('✅ All required environment variables are set'));

  // Step 2: Check OpenAI API key
  console.log(chalk.blue('\nVerifying OpenAI API key...'));
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const models = await openai.models.list();
    console.log(chalk.green('✅ OpenAI API key is valid'));
  } catch (error) {
    console.error(chalk.red('❌ OpenAI API key is invalid:'), error);
    console.error(chalk.yellow('\nPlease check your OPENAI_API_KEY in the .env file.'));
    process.exit(1);
  }

  // Step 3: Check Pinecone API key and index
  console.log(chalk.blue('\nVerifying Pinecone setup...'));
  const indexName = process.env.PINECONE_INDEX_NAME!;
  let totalRecordCount = 0;
  
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // List indexes to check if our index exists
    const indexes = await pinecone.listIndexes();
    const indexExists = indexes.indexes?.some((index: any) => index.name === indexName);

    if (!indexExists) {
      console.error(chalk.red(`❌ Pinecone index '${indexName}' does not exist`));
      console.error(chalk.yellow('\nPlease create the index manually in the Pinecone dashboard.'));
      console.error(chalk.yellow('See pinecone-index-config.md for detailed instructions.'));
      process.exit(1);
    }

    // Get index details to verify configuration
    const index = pinecone.Index(indexName);
    const indexStats = await index.describeIndexStats();
    
    console.log(chalk.green(`✅ Pinecone index '${indexName}' exists`));
    
    // Check if the index has any vectors (optional)
    totalRecordCount = indexStats.totalRecordCount || 0;
    if (totalRecordCount === 0) {
      console.log(chalk.yellow('⚠️ The index does not contain any vectors yet'));
      console.log(chalk.yellow('   Run "npm run index-documents" to index your property data'));
    } else {
      console.log(chalk.green(`✅ Index contains ${totalRecordCount} vectors`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Error verifying Pinecone setup:'), error);
    console.error(chalk.yellow('\nPlease check your PINECONE_API_KEY and PINECONE_INDEX_NAME in the .env file.'));
    process.exit(1);
  }

  // All checks passed
  console.log(chalk.green('\n🎉 RAG setup verification complete!'));
  console.log(chalk.green('All components are properly configured.'));
  
  // Check if we need to suggest indexing
  const needsIndexing = totalRecordCount === 0;
  if (needsIndexing) {
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.yellow('1. Run "npm run index-documents" to index your property data'));
    console.log(chalk.yellow('2. Start the development server with "npm run dev"'));
  } else {
    console.log(chalk.green('\nYour RAG system is ready to use!'));
    console.log(chalk.green('Start the development server with "npm run dev"'));
  }
}

// Run the verification
verifyRagSetup().catch(error => {
  console.error('Error in verification:', error);
  process.exit(1);
});