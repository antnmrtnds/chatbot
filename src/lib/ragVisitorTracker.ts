'use client';

import { supabase } from './supabaseClient';

export interface RagVisitorData {
  visitorId: string;
  sessionId: string;
  name?: string;
  email?: string;
  phone?: string;
  conversationStarted: boolean;
  messagesCount: number;
  leadCaptured: boolean;
  firstVisit: Date;
  lastActivity: Date;
}

export interface RagChatEvent {
  eventType: 'chat_opened' | 'conversation_started' | 'name_provided' | 'message_sent' | 'lead_captured';
  data?: any;
  timestamp: Date;
  pageUrl: string;
  pageContext?: any;
}

class RagVisitorTracker {
  private visitorData: RagVisitorData | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (typeof window === 'undefined') {
      // SSR fallback
      this.visitorData = {
        visitorId: '00000000-0000-0000-0000-000000000000',
        sessionId: 'ssr-session',
        conversationStarted: false,
        messagesCount: 0,
        leadCaptured: false,
        firstVisit: new Date(),
        lastActivity: new Date(),
      };
      this.isInitialized = true;
      return;
    }

    try {
      // Get or create visitor ID
      let visitorId = localStorage.getItem('rag_visitor_id');
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('rag_visitor_id', visitorId);
      }

      // Create session ID
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Initialize visitor data
      this.visitorData = {
        visitorId,
        sessionId,
        conversationStarted: false,
        messagesCount: 0,
        leadCaptured: false,
        firstVisit: new Date(),
        lastActivity: new Date(),
      };

      this.isInitialized = true;
      console.log('[RagVisitorTracker] Initialized:', { visitorId, sessionId });

      // Store initial visitor data in Supabase
      await this.storeVisitorData();
    } catch (error) {
      console.error('[RagVisitorTracker] Error initializing:', error);
      // Fallback initialization
      this.visitorData = {
        visitorId: crypto.randomUUID(),
        sessionId: 'fallback-session',
        conversationStarted: false,
        messagesCount: 0,
        leadCaptured: false,
        firstVisit: new Date(),
        lastActivity: new Date(),
      };
      this.isInitialized = true;
    }
  }

  private async storeVisitorData() {
    if (!this.visitorData || typeof window === 'undefined') return;

    try {
      const { error } = await supabase
        .from('rag_visitors')
        .upsert({
          visitor_id: this.visitorData.visitorId,
          session_id: this.visitorData.sessionId,
          name: this.visitorData.name,
          email: this.visitorData.email,
          phone: this.visitorData.phone,
          conversation_started: this.visitorData.conversationStarted,
          messages_count: this.visitorData.messagesCount,
          lead_captured: this.visitorData.leadCaptured,
          first_visit: this.visitorData.firstVisit.toISOString(),
          last_activity: this.visitorData.lastActivity.toISOString(),
        }, {
          onConflict: 'visitor_id'
        });

      if (error) {
        console.warn('[RagVisitorTracker] Error storing visitor data:', error);
      }
    } catch (error) {
      console.warn('[RagVisitorTracker] Error in storeVisitorData:', error);
    }
  }

  async trackEvent(event: RagChatEvent) {
    if (!this.isInitialized || !this.visitorData || typeof window === 'undefined') return;

    try {
      // Update visitor data based on event
      this.visitorData.lastActivity = new Date();

      switch (event.eventType) {
        case 'conversation_started':
          this.visitorData.conversationStarted = true;
          break;
        case 'name_provided':
          this.visitorData.name = event.data?.name;
          break;
        case 'message_sent':
          this.visitorData.messagesCount++;
          break;
        case 'lead_captured':
          this.visitorData.leadCaptured = true;
          this.visitorData.email = event.data?.email;
          this.visitorData.phone = event.data?.phone;
          if (event.data?.name) {
            this.visitorData.name = event.data.name;
          }
          break;
      }

      // Store event in Supabase
      const { error } = await supabase
        .from('rag_chat_events')
        .insert({
          visitor_id: this.visitorData.visitorId,
          session_id: this.visitorData.sessionId,
          event_type: event.eventType,
          event_data: event.data,
          page_url: event.pageUrl,
          page_context: event.pageContext,
          timestamp: event.timestamp.toISOString(),
        });

      if (error) {
        console.warn('[RagVisitorTracker] Error storing event:', error);
      } else {
        console.log('[RagVisitorTracker] Event tracked:', event.eventType);
      }

      // Update visitor data
      await this.storeVisitorData();
    } catch (error) {
      console.error('[RagVisitorTracker] Error tracking event:', error);
    }
  }

  // Convenience methods for common events
  async trackChatOpened(pageUrl: string, pageContext?: any) {
    await this.trackEvent({
      eventType: 'chat_opened',
      timestamp: new Date(),
      pageUrl,
      pageContext,
    });
  }

  async trackConversationStarted(pageUrl: string, pageContext?: any) {
    await this.trackEvent({
      eventType: 'conversation_started',
      timestamp: new Date(),
      pageUrl,
      pageContext,
    });
  }

  async trackNameProvided(name: string, pageUrl: string, pageContext?: any) {
    await this.trackEvent({
      eventType: 'name_provided',
      data: { name },
      timestamp: new Date(),
      pageUrl,
      pageContext,
    });
  }

  async trackMessageSent(message: string, pageUrl: string, pageContext?: any) {
    await this.trackEvent({
      eventType: 'message_sent',
      data: { message, messageLength: message.length },
      timestamp: new Date(),
      pageUrl,
      pageContext,
    });
  }

  async trackLeadCaptured(leadData: any, pageUrl: string, pageContext?: any) {
    await this.trackEvent({
      eventType: 'lead_captured',
      data: leadData,
      timestamp: new Date(),
      pageUrl,
      pageContext,
    });
  }

  // Get current visitor data
  getVisitorData(): RagVisitorData | null {
    return this.visitorData;
  }

  // Get visitor ID for use in other components
  getVisitorId(): string | null {
    return this.visitorData?.visitorId || null;
  }

  // Get session ID for use in other components
  getSessionId(): string | null {
    return this.visitorData?.sessionId || null;
  }

  // Check if initialized
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create singleton instance
const ragVisitorTracker = new RagVisitorTracker();
export default ragVisitorTracker;