# Pinecone Chat History Index Configuration

When creating your Pinecone index for chat history, use the following settings in the Pinecone dashboard:

## Basic Settings
- **Name**: chat-history
- **Dimension**: 1536 (matches OpenAI's text-embedding-3-small model)
- **Metric**: cosine (best for semantic similarity)

## Metadata Indexing
It is crucial that you configure the index to allow filtering by `visitorId`. When setting up metadata indexing, add `visitorId` as a field to be indexed. This is required for retrieving the chat history specific to each user.

## Environment Variables
After creating the index, make sure to add the following variable to your `.env.local` file:

PINECONE_CHAT_HISTORY_INDEX_NAME=chat-history

This ensures that the application uses the correct index for storing and retrieving chat history. 