import { supabase } from './supabaseClient';

class VisitorTracker {
  visitorId: string;
  sessionData: {
    startTime: number;
    pagesViewed: any[];
    interactions: any[];
    chatbotMessages: any[];
  };

  constructor() {
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionData = {
      startTime: Date.now(),
      pagesViewed: [],
      interactions: [],
      chatbotMessages: []
    };
    console.log("VisitorTracker initialized for:", this.visitorId);
  }

  getOrCreateVisitorId(): string {
    // This script runs only on the client, so we can safely use localStorage.
    if (typeof window === 'undefined') {
      return '00000000-0000-0000-0000-000000000000'; // Default UUID for SSR
    }
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  }

  extractFlatId(url: string): string | null {
    // This regex looks for a URL pattern like /imoveis/evergreen-pure/some-flat-id
    const match = url.match(/imoveis\/evergreen-pure\/([^/?]+)/);
    return match ? match[1] : null;
  }

  trackPageView(url: string = window.location.href) {
    if (typeof window === 'undefined') return;

    const flatId = this.extractFlatId(url);
    const pageData = {
      url: url,
      timestamp: Date.now(),
      flatId: flatId,
    };

    this.sessionData.pagesViewed.push(pageData);
    this.sendToSupabase('page_view', pageData);
  }

  async sendToSupabase(eventType: string, data: any) {
    if (eventType === 'page_view') {
      const { url, flatId } = data;
      const { error } = await supabase.rpc('track_page_view', {
        p_visitor_id: this.visitorId,
        p_page_url: url,
        p_flat_id: flatId,
      });

      if (error) {
        console.error('[VisitorTracker] Error sending page view to Supabase:', error);
      } else {
        console.log('[VisitorTracker] Successfully sent page view for', url);
      }
    } else {
      console.log(`[VisitorTracker] Unhandled Event: ${eventType}`, {
        visitorId: this.visitorId,
        ...data
      });
    }
  }
}

// A singleton instance is created and exported.
// This ensures that the same tracker instance is used throughout the app.
const visitorTracker = new VisitorTracker();
export default visitorTracker; 