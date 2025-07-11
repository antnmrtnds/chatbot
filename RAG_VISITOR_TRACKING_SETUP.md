# RAG Visitor Tracking Setup Guide

## Overview

A new, simplified visitor tracking system has been created specifically for the RAG chatbot. This replaces the complex old visitor tracking system with a cleaner, more focused approach.

## What's New

### ✅ New RAG Visitor Tracker
- **File**: `src/lib/ragVisitorTracker.ts`
- **Purpose**: Simple, focused tracking for RAG chatbot interactions
- **Features**:
  - Visitor identification with UUID
  - Session tracking
  - Chat event tracking (opened, conversation started, name provided, messages sent, lead captured)
  - Graceful error handling
  - Local storage for visitor persistence

### ✅ Integrated with RagChatbot
- **File**: `src/components/RagChatbot.tsx`
- **Integration**: All major chatbot events are now tracked:
  - Chat opened
  - Conversation started
  - Name provided
  - Messages sent
  - Lead captured

## Database Setup Required

The tracking system is working but needs database tables to store data. You need to manually create these tables in Supabase:

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor

### Step 2: Create Tables
Copy and paste this SQL into the SQL Editor:

```sql
-- RAG Visitors Table
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

-- RAG Chat Events Table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rag_visitors_visitor_id ON rag_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rag_visitors_email ON rag_visitors(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rag_chat_events_visitor_id ON rag_chat_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_rag_chat_events_event_type ON rag_chat_events(event_type);

-- Enable Row Level Security
ALTER TABLE rag_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chat_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public access to rag_visitors" ON rag_visitors FOR ALL USING (true);
CREATE POLICY "Allow public access to rag_chat_events" ON rag_chat_events FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON rag_visitors TO anon, authenticated;
GRANT ALL ON rag_chat_events TO anon, authenticated;
GRANT USAGE ON SEQUENCE rag_visitors_id_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE rag_chat_events_id_seq TO anon, authenticated;
```

### Step 3: Run the SQL
Click "Run" to execute the SQL and create the tables.

## Current Status

### ✅ Working
- RAG visitor tracker initialization
- Event tracking (with graceful error handling)
- Visitor ID generation and persistence
- Integration with RagChatbot component
- Console logging for debugging

### ⏳ Pending
- Database tables creation (manual step required)
- Data persistence to Supabase (will work once tables are created)

## Testing

The system is already working and can be tested:

1. Open the website
2. Check browser console for `[RagVisitorTracker] Initialized:` message
3. Click the chatbot button
4. Look for tracking events in console:
   - `[RagVisitorTracker] Error storing event:` (expected until tables are created)
   - `[RagVisitorTracker] Error storing visitor data:` (expected until tables are created)

## Benefits of New System

1. **Simpler**: Focused only on RAG chatbot interactions
2. **Cleaner**: No complex fingerprinting or multiple storage methods
3. **Integrated**: Built specifically for the RagChatbot component
4. **Reliable**: Graceful error handling and fallbacks
5. **Focused**: Tracks only relevant chatbot events

## Migration Notes

- The old VisitorTracker (`src/lib/visitorTracker.ts`) is still running but can be removed once the new system is fully operational
- The new system uses different table names (`rag_visitors`, `rag_chat_events`) to avoid conflicts
- Visitor IDs are stored in `localStorage` as `rag_visitor_id` (different from old system)

## Next Steps

1. Create the database tables using the SQL above
2. Test the full tracking functionality
3. Remove the old VisitorTracker system
4. Add analytics dashboard for the new tracking data