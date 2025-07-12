# RAG System Setup Guide

This guide provides step-by-step instructions for setting up the Retrieval-Augmented Generation (RAG) system for property listings.

## Prerequisites

Before you begin, ensure you have:

1. Node.js (v18+) installed
2. An OpenAI API key
3. A Pinecone account (free tier is sufficient)
4. A Supabase account and project

## Step 1: Environment Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and add your API keys:
   ```
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Pinecone - Vector Database for RAG
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=property-listings
   ```

## Step 2: Create Pinecone Index Manually

**Important for Free Tier Users**: The free tier of Pinecone has region limitations. You must manually create your index through the Pinecone dashboard:

1. Log in to your [Pinecone dashboard](https://app.pinecone.io/)
2. Click "Create Index"
3. Set the following configuration:
   - **Name**: property-listings (or match your PINECONE_INDEX_NAME value)
   - **Dimension**: 1536 (matches OpenAI's text-embedding-3-small model)
   - **Metric**: cosine
   - **Index Type**: Serverless
   - For free tier users, use the default region offered by Pinecone (typically us-east1-gcp)

For detailed instructions, see the `pinecone-index-config.md` file.

## Step 3: Run the Setup Script

Run the setup script to verify your environment and Pinecone index:

```bash
npm run setup-rag
```

This script will:
- Check if all required environment variables are set
- Verify that your Pinecone index exists
- Create necessary database tables (if using Supabase)

## Step 4: Verify the Setup

Run the verification script to ensure everything is configured correctly:

```bash
npm run verify-rag
```

This script will:
- Verify your OpenAI API key
- Check your Pinecone index configuration
- Confirm that all components are properly set up

## Step 5: Index Your Property Data

Index your property data into the vector database:

```bash
npm run index-documents
```

This script will:
- Process property data from CSV files in the `data` directory (if any)
- Fetch properties from your Supabase database
- Create embeddings using OpenAI
- Store the embeddings in your Pinecone index

## Step 6: Start the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Your RAG-powered property chatbot should now be accessible at:
- http://localhost:3000/chat - Full page chatbot
- http://localhost:3000 - Landing page with floating chatbot

## Troubleshooting

### Pinecone Index Creation Issues

If you encounter errors when creating the Pinecone index:

1. **Region Errors**: Free tier users are limited to specific regions. Create the index manually through the dashboard and select the default region.
2. **Dimension Errors**: Ensure the dimension is set to 1536 to match the OpenAI embedding model.
3. **API Key Issues**: Verify your Pinecone API key is correct and has the necessary permissions.

### OpenAI API Issues

If you encounter errors with OpenAI:

1. **Rate Limits**: The indexing process might hit rate limits. The script includes delays between batches, but you might need to adjust them.
2. **API Key**: Ensure your OpenAI API key is valid and has sufficient credits.

### Empty Results

If the chatbot returns empty or irrelevant results:

1. **Check Vector Count**: Run `npm run verify-rag` to check if vectors are properly indexed.
2. **Re-index Data**: Try re-indexing your property data with `npm run index-documents`.
3. **Query Formulation**: Ensure your queries are relevant to the property data you've indexed.

## Next Steps

After setting up the RAG system, you can:

1. **Add More Properties**: Add more property data to your CSV files or Supabase database and re-index.
2. **Customize the UI**: Modify the chatbot UI components in `src/components/`.
3. **Tune the RAG Pipeline**: Adjust parameters in `src/lib/rag/ragChain.ts` to improve retrieval and generation.