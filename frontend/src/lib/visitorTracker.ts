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
      return 'server_side_visitor';
    }
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

  sendToSupabase(eventType: string, data: any) {
    // TODO: You will need to import your Supabase client here and implement
    // the logic to send this data to your database.
    console.log(`[VisitorTracker] Event: ${eventType}`, {
      visitorId: this.visitorId,
      session_start_time: this.sessionData.startTime,
      ...data
    });
  }
}

// A singleton instance is created and exported.
// This ensures that the same tracker instance is used throughout the app.
const visitorTracker = new VisitorTracker();
export default visitorTracker; 