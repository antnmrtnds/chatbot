import { supabase } from './supabaseClient';

interface DeviceFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  cookieEnabled: boolean;
  doNotTrack?: string;
  canvas?: string;
  webgl?: string;
}

interface VisitorSession {
  sessionId: string;
  startTime: number;
  pagesViewed: Array<{
    url: string;
    timestamp: number;
    flatId?: string;
    timeOnPage?: number;
  }>;
  interactions: any[];
  chatbotMessages: any[];
  referrer?: string;
  utmParams?: Record<string, string>;
}

class VisitorTracker {
  visitorId: string;
  fingerprintId: string;
  sessionData: VisitorSession;
  private fingerprintHash: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.visitorId = '';
    this.fingerprintId = '';
    this.sessionData = {
      sessionId: '',
      startTime: Date.now(),
      pagesViewed: [],
      interactions: [],
      chatbotMessages: [],
    };
    this.initialize();
  }

  private async initialize() {
    if (typeof window === 'undefined') {
      this.visitorId = '00000000-0000-0000-0000-000000000000';
      this.fingerprintId = 'ssr-fingerprint';
      this.sessionData.sessionId = 'ssr-session';
      return;
    }

    try {
      // Generate device fingerprint
      const fingerprint = await this.generateDeviceFingerprint();
      this.fingerprintHash = await this.hashFingerprint(fingerprint);
      this.fingerprintId = this.fingerprintHash;

      // Get or create visitor ID using multiple methods
      this.visitorId = await this.getOrCreateVisitorId();
      
      // Initialize session
      this.sessionData.sessionId = this.generateSessionId();
      this.sessionData.referrer = document.referrer;
      this.sessionData.utmParams = this.extractUtmParams();

      // Store fingerprint and visitor mapping
      await this.storeVisitorFingerprint();
      
      this.isInitialized = true;
      console.log("VisitorTracker initialized:", {
        visitorId: this.visitorId,
        fingerprintId: this.fingerprintId,
        sessionId: this.sessionData.sessionId
      });
    } catch (error) {
      console.error('Error initializing VisitorTracker:', error);
      // Fallback to basic UUID
      this.visitorId = this.generateFallbackId();
      this.fingerprintId = 'fallback-fingerprint';
      this.sessionData.sessionId = 'fallback-session';
      this.isInitialized = true;
    }
  }

  private async generateDeviceFingerprint(): Promise<DeviceFingerprint> {
    const canvas = await this.getCanvasFingerprint();
    const webgl = await this.getWebGLFingerprint();
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth: screen.colorDepth,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || undefined,
      canvas,
      webgl
    };
  }

  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      
      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Viriato Tracking', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device Fingerprint', 4, 35);
      
      return canvas.toDataURL();
    } catch (error) {
      console.warn('Canvas fingerprinting failed:', error);
      return '';
    }
  }

  private async getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';
      
      const webglContext = gl as WebGLRenderingContext;
      const renderer = webglContext.getParameter(webglContext.RENDERER);
      const vendor = webglContext.getParameter(webglContext.VENDOR);
      return `${vendor}~${renderer}`;
    } catch (error) {
      console.warn('WebGL fingerprinting failed:', error);
      return '';
    }
  }

  private async hashFingerprint(fingerprint: DeviceFingerprint): Promise<string> {
    const fingerprintString = JSON.stringify(fingerprint);
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async getOrCreateVisitorId(): Promise<string> {
    // Method 1: Check localStorage
    let visitorId = localStorage.getItem('visitor_id');
    
    // Method 2: Check sessionStorage as backup
    if (!visitorId) {
      visitorId = sessionStorage.getItem('visitor_id_backup');
    }
    
    // Method 3: Check IndexedDB for persistent storage
    if (!visitorId) {
      visitorId = await this.getFromIndexedDB('visitor_id');
    }
    
    // Method 4: Check if we have this fingerprint in our database
    if (!visitorId) {
      visitorId = await this.getVisitorIdByFingerprint();
    }
    
    // Method 5: Generate new visitor ID
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      console.log('Generated new visitor ID:', visitorId);
    }
    
    // Store in all available storage methods
    await this.storeVisitorId(visitorId);
    
    return visitorId;
  }

  private async storeVisitorId(visitorId: string): Promise<void> {
    try {
      // Store in localStorage (primary)
      localStorage.setItem('visitor_id', visitorId);
      
      // Store in sessionStorage (backup)
      sessionStorage.setItem('visitor_id_backup', visitorId);
      
      // Store in IndexedDB (persistent backup)
      await this.storeInIndexedDB('visitor_id', visitorId);
      
      // Store in cookie with long expiration (1 year)
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      document.cookie = `visitor_id=${visitorId}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`;
      
    } catch (error) {
      console.warn('Error storing visitor ID:', error);
    }
  }

  private async getFromIndexedDB(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('ViriatoTracker', 1);
        
        request.onerror = () => resolve(null);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('visitor_data')) {
            db.createObjectStore('visitor_data', { keyPath: 'key' });
          }
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['visitor_data'], 'readonly');
          const store = transaction.objectStore('visitor_data');
          const getRequest = store.get(key);
          
          getRequest.onsuccess = () => {
            resolve(getRequest.result?.value || null);
          };
          
          getRequest.onerror = () => resolve(null);
        };
      } catch (error) {
        console.warn('IndexedDB access failed:', error);
        resolve(null);
      }
    });
  }

  private async storeInIndexedDB(key: string, value: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('ViriatoTracker', 1);
        
        request.onerror = () => resolve();
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('visitor_data')) {
            db.createObjectStore('visitor_data', { keyPath: 'key' });
          }
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['visitor_data'], 'readwrite');
          const store = transaction.objectStore('visitor_data');
          
          store.put({ key, value, timestamp: Date.now() });
          resolve();
        };
      } catch (error) {
        console.warn('IndexedDB storage failed:', error);
        resolve();
      }
    });
  }

  private async getVisitorIdByFingerprint(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('leads_tracking')
        .select('visitor_id')
        .eq('fingerprint_id', this.fingerprintHash)
        .single();
      
      if (error || !data) return null;
      
      console.log('Found existing visitor by fingerprint:', data.visitor_id);
      return data.visitor_id;
    } catch (error) {
      console.warn('Error checking fingerprint in database:', error);
      return null;
    }
  }

  private async storeVisitorFingerprint(): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads_tracking')
        .upsert({
          visitor_id: this.visitorId,
          fingerprint_id: this.fingerprintHash,
          last_activity_at: new Date().toISOString(),
        }, {
          onConflict: 'visitor_id'
        });
      
      if (error) {
        console.warn('Error storing visitor fingerprint:', error);
      }
    } catch (error) {
      console.warn('Error in storeVisitorFingerprint:', error);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFallbackId(): string {
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractUtmParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const urlParams = new URLSearchParams(window.location.search);
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = urlParams.get(param);
      if (value) params[param] = value;
    });
    
    return params;
  }

  extractFlatId(url: string): string | null {
    const match = url.match(/imoveis\/evergreen-pure\/([^/?]+)/);
    return match ? match[1] : null;
  }

  async trackPageView(url: string = window.location.href) {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    const flatId = this.extractFlatId(url);
    const pageData = {
      url: url,
      timestamp: Date.now(),
      flatId: flatId || undefined,
    };

    this.sessionData.pagesViewed.push(pageData);
    await this.sendToSupabase('page_view', pageData);
  }

  async trackInteraction(interactionType: string, details: any = {}) {
    if (!this.isInitialized) return;

    const interactionData = {
      type: interactionType,
      details,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
    };

    this.sessionData.interactions.push(interactionData);
    await this.sendToSupabase('interaction', interactionData);
  }

  async trackTimeOnPage(url: string, timeSpent: number) {
    const pageIndex = this.sessionData.pagesViewed.findIndex(page => page.url === url);
    if (pageIndex !== -1) {
      this.sessionData.pagesViewed[pageIndex].timeOnPage = timeSpent;
      await this.sendToSupabase('time_on_page', { url, timeSpent });
    }
  }

  async sendToSupabase(eventType: string, data: any) {
    if (!this.isInitialized) return;

    try {
      if (eventType === 'page_view') {
        const { url, flatId } = data;
        const { error } = await supabase.rpc('track_page_view', {
          p_visitor_id: this.visitorId,
          p_page_url: url,
          p_flat_id: flatId,
          p_fingerprint_id: this.fingerprintHash,
          p_session_id: this.sessionData.sessionId,
          p_referrer: this.sessionData.referrer,
          p_utm_params: this.sessionData.utmParams,
        });

        if (error) {
          console.error('[VisitorTracker] Error sending page view to Supabase:', error);
        } else {
          console.log('[VisitorTracker] Successfully sent page view for', url);
        }
      } else if (eventType === 'interaction') {
        const { type, details } = data;
        const { error } = await supabase.rpc('track_interaction', {
          p_visitor_id: this.visitorId,
          p_interaction_type: type,
          p_details: details,
          p_session_id: this.sessionData.sessionId,
        });

        if (error) {
          console.error('[VisitorTracker] Error sending interaction to Supabase:', error);
        }
      } else if (eventType === 'time_on_page') {
        const { url, timeSpent } = data;
        const { error } = await supabase.rpc('track_time_on_page', {
          p_visitor_id: this.visitorId,
          p_page_url: url,
          p_time_spent: timeSpent,
        });

        if (error) {
          console.error('[VisitorTracker] Error sending time on page to Supabase:', error);
        }
      }
    } catch (error) {
      console.error('[VisitorTracker] Error in sendToSupabase:', error);
    }
  }

  // Method to manually link visitor with email (when they provide contact info)
  async linkVisitorWithEmail(email: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads_tracking')
        .update({
          contact_email: email,
          updated_at: new Date().toISOString(),
        })
        .eq('visitor_id', this.visitorId);

      if (error) {
        console.error('Error linking visitor with email:', error);
      } else {
        console.log('Successfully linked visitor with email:', email);
      }
    } catch (error) {
      console.error('Error in linkVisitorWithEmail:', error);
    }
  }

  // Get visitor data for analytics
  getVisitorData() {
    return {
      visitorId: this.visitorId,
      fingerprintId: this.fingerprintId,
      sessionData: this.sessionData,
      isInitialized: this.isInitialized,
    };
  }
}

// Create singleton instance
const visitorTracker = new VisitorTracker();
export default visitorTracker; 