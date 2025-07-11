-- Function to match documents using vector similarity
-- This function will be used by the RAG service to find relevant document chunks

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  embedding vector(1536),
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rag_document_chunks.id,
    rag_document_chunks.content,
    rag_document_chunks.metadata,
    rag_document_chunks.embedding,
    1 - (rag_document_chunks.embedding <=> query_embedding) AS similarity
  FROM rag_document_chunks
  WHERE 1 - (rag_document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY rag_document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO anon;