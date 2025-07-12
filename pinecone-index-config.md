# Pinecone Index Configuration

When creating your Pinecone index manually in the Pinecone dashboard, use the following settings:

## Basic Settings
- **Name**: property-listings
- **Dimension**: 1536 (matches OpenAI's text-embedding-3-small model)
- **Metric**: cosine (best for semantic similarity)

## Region Settings
For free tier users:
- Use the default region offered by Pinecone (typically `us-east1-gcp`)
- The free tier only supports specific regions, so avoid selecting custom regions

## Pod Type (if applicable)
- For free tier: Use the default pod type (typically `starter`)

## Additional Settings
- **Metadata Indexing**: Enable metadata filtering (allows filtering by property attributes)
- **Index Type**: Choose "Serverless" for the free tier

## After Creation
After creating the index, make sure to:
1. Update your `.env` file with the correct `PINECONE_INDEX_NAME`
2. Ensure your `PINECONE_API_KEY` is correctly set in the `.env` file
3. Run the indexing script with `npm run index-documents`

## Troubleshooting
If you encounter region-specific errors:
- Try creating the index through the Pinecone dashboard instead of the script
- Select only the regions available to free tier users
- If you need more regions or capabilities, consider upgrading your Pinecone plan