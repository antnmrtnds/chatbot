# RAG Chatbot for Property Listings

This project implements a Retrieval-Augmented Generation (RAG) chatbot for property listings using LangChain, Pinecone, and OpenAI. The chatbot can process text documents for each property listing, extract key information, and answer user queries about specific properties or help users find properties matching their criteria.

## Features

- **Document Processing**: Extracts structured data from property listings
- **Vector Embedding**: Indexes property data in Pinecone for semantic search
- **Natural Language Understanding**: Handles queries about availability, pricing, and property details
- **Context Maintenance**: Keeps track of conversation history for relevant follow-up responses
- **Error Handling**: Gracefully handles missing information or errors

## Architecture

The system consists of the following components:

1. **Document Processor**: Processes property documents and extracts metadata
2. **Vector Store**: Manages vector embeddings in Pinecone for semantic search
3. **RAG Chain**: Implements the retrieval-augmented generation pipeline
4. **Chat Session Manager**: Maintains conversation context and history
5. **Property Service**: Handles CRUD operations for property data
6. **UI Components**: Provides a chat interface for users

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Supabase account
- Pinecone account
- OpenAI API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=property-listings
```

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up the Supabase database:

Ensure your Supabase database has the `developments` table with the schema defined in `supabase/schemas/developments.sql`.

3. Create a Pinecone index:

**Important for Free Tier Users**: The free tier of Pinecone has region limitations. You must manually create your index through the Pinecone dashboard:

1. Log in to your [Pinecone dashboard](https://app.pinecone.io/)
2. Click "Create Index"
3. Set the following configuration:
   - **Name**: property-listings (or match your PINECONE_INDEX_NAME value)
   - **Dimension**: 1536 (matches OpenAI's text-embedding-3-small model)
   - **Metric**: cosine
   - **Index Type**: Serverless
   - For free tier users, use the default region offered by Pinecone

For detailed instructions, see the `pinecone-index-config.md` file.

4. Run the setup script:

```bash
npm run setup-rag
```

5. Process and index property data:

```bash
npx tsx data/process_property_data.ts
```

5. Start the development server:

```bash
npm run dev
```

## Usage

### Processing Property Data

The system can process property data from CSV files or direct input. To process a CSV file:

1. Place your CSV file in the `data` directory
2. Update the file path in `data/process_property_data.ts` if needed
3. Run the script:

```bash
npx tsx data/process_property_data.ts
```

### Using the Chatbot

The chatbot is accessible at `/chat` in the application. Users can:

1. Ask questions about specific properties
2. Search for properties based on criteria
3. Compare different properties
4. Get information about neighborhoods and amenities

Example queries:

- "Show me T2 apartments in Aveiro under 300,000€"
- "Which properties have a balcony or terrace?"
- "Tell me about the Evergreen Pure project"
- "What's the price range for T3 apartments?"

## API Endpoints

### POST /api/chat

Process a chat message and return a response.

**Request Body:**

```json
{
  "message": "Show me T2 apartments in Aveiro",
  "chatHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hello! How can I help you find your ideal property today?"
    }
  ]
}
```

**Response:**

```json
{
  "response": "I found several T2 apartments in Aveiro...",
  "relevantProperties": [
    {
      "id": "1",
      "flat_id": "A01",
      "content": "...",
      "price": "250,000€",
      "location": "Aveiro",
      "bedrooms": 2,
      "bathrooms": 1,
      "squareFootage": 75,
      "amenities": ["balcony", "parking"]
    }
  ]
}
```

## Extending the System

### Adding New Property Types

To add support for new property types or metadata:

1. Update the `Property` interface in `src/lib/rag/types.ts`
2. Modify the metadata extraction in `src/lib/rag/documentProcessor.ts`
3. Update the filter extraction in `src/lib/rag/ragChain.ts`

### Customizing the RAG Pipeline

To customize the RAG pipeline:

1. Modify the system prompt in `src/lib/rag/ragChain.ts`
2. Adjust the retrieval parameters in the `similaritySearch` function
3. Update the chain configuration in `createRagChain`

## Troubleshooting

### Embedding Issues

If you encounter issues with embeddings:

1. Check your OpenAI API key
2. Verify the Pinecone index dimensions match the embedding model
3. Run the backfill script to regenerate embeddings:

```bash
npx tsx data/backfill_embeddings.py
```

### Query Issues

If the chatbot provides incorrect or irrelevant responses:

1. Check the extracted filters in the console logs
2. Verify the property data is properly indexed
3. Adjust the system prompt or retrieval parameters

## License

This project is licensed under the MIT License - see the LICENSE file for details.