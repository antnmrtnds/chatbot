'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Types
export interface PageContext {
  url: string;
  pageType: 'home' | 'property' | 'listing' | 'about' | 'contact' | 'blog';
  semanticId: string;
  title?: string;
  description?: string;
  keywords?: string[];
  propertyId?: string;
  propertyType?: string;
  priceRange?: string;
  features?: string[];
  referrer?: string;
  utmParams?: Record<string, string>;
  previousPages?: string[];
  timeOnPage?: number;
}

export interface PageContextManagerConfig {
  trackingEnabled: boolean;
  maxHistoryLength: number;
  updateInterval: number; // milliseconds
  enableUtmTracking: boolean;
  enableReferrerTracking: boolean;
}

const defaultConfig: PageContextManagerConfig = {
  trackingEnabled: true,
  maxHistoryLength: 10,
  updateInterval: 5000, // 5 seconds
  enableUtmTracking: true,
  enableReferrerTracking: true,
};

export class PageContextManager {
  private static instance: PageContextManager;
  private config: PageContextManagerConfig;
  private currentContext: PageContext | null = null;
  private pageHistory: string[] = [];
  private pageStartTime: number = Date.now();
  private listeners: ((context: PageContext) => void)[] = [];

  private constructor(config: PageContextManagerConfig = defaultConfig) {
    this.config = config;
    
    if (typeof window !== 'undefined') {
      this.initializeTracking();
    }
  }

  public static getInstance(config?: PageContextManagerConfig): PageContextManager {
    if (!PageContextManager.instance) {
      PageContextManager.instance = new PageContextManager(config);
    }
    return PageContextManager.instance;
  }

  /**
   * Initialize page tracking
   */
  private initializeTracking(): void {
    if (!this.config.trackingEnabled) return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Track beforeunload for time on page
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Set up periodic context updates
    setInterval(() => {
      if (this.currentContext) {
        this.updateTimeOnPage();
        this.notifyListeners(this.currentContext);
      }
    }, this.config.updateInterval);
  }

  /**
   * Detect page context from URL and DOM
   */
  public detectPageContext(pathname: string, searchParams?: URLSearchParams): PageContext {
    const url = typeof window !== 'undefined' ? window.location.href : pathname;
    
    // Detect page type from pathname
    const pageType = this.detectPageType(pathname);
    
    // Generate semantic ID
    const semanticId = this.generateSemanticId(pathname, pageType);
    
    // Extract metadata from DOM
    const metadata = this.extractPageMetadata();
    
    // Extract property-specific context
    const propertyContext = this.extractPropertyContext(pathname, searchParams);
    
    // Extract UTM parameters
    const utmParams = this.config.enableUtmTracking ? this.extractUtmParams(searchParams) : undefined;
    
    // Get referrer
    const referrer = this.config.enableReferrerTracking ? document.referrer : undefined;
    
    const context: PageContext = {
      url,
      pageType,
      semanticId,
      ...metadata,
      ...propertyContext,
      referrer,
      utmParams,
      previousPages: [...this.pageHistory],
      timeOnPage: 0,
    };

    // Update internal state
    this.updatePageHistory(pathname);
    this.currentContext = context;
    this.pageStartTime = Date.now();
    
    return context;
  }

  /**
   * Detect page type from pathname
   */
  private detectPageType(pathname: string): PageContext['pageType'] {
    if (pathname === '/' || pathname === '') return 'home';
    if (pathname.startsWith('/imoveis/') && pathname.split('/').length > 2) return 'property';
    if (pathname.startsWith('/imoveis')) return 'listing';
    if (pathname.startsWith('/sobre') || pathname.startsWith('/about')) return 'about';
    if (pathname.startsWith('/contacto') || pathname.startsWith('/contact')) return 'contact';
    if (pathname.startsWith('/blog') || pathname.startsWith('/noticias')) return 'blog';
    
    return 'home';
  }

  /**
   * Generate semantic ID for the page
   */
  private generateSemanticId(pathname: string, pageType: PageContext['pageType']): string {
    const segments = pathname.split('/').filter(Boolean);
    
    switch (pageType) {
      case 'property':
        return `property_${segments[segments.length - 1]}`;
      case 'listing':
        return `listing_${segments.join('_')}`;
      case 'blog':
        return `blog_${segments[segments.length - 1]}`;
      default:
        return pageType;
    }
  }

  /**
   * Extract metadata from page DOM
   */
  private extractPageMetadata(): Partial<PageContext> {
    if (typeof window === 'undefined') return {};

    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const keywordsContent = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
    const keywords = keywordsContent ? keywordsContent.split(',').map(k => k.trim()) : undefined;

    return {
      title,
      description: description || undefined,
      keywords,
    };
  }

  /**
   * Extract property-specific context
   */
  private extractPropertyContext(pathname: string, searchParams?: URLSearchParams): Partial<PageContext> {
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments[0] === 'imoveis') {
      if (segments.length > 1) {
        // Property page
        const propertyId = segments[segments.length - 1];
        
        // Try to extract property info from DOM or data attributes
        const propertyData = this.extractPropertyDataFromDOM();
        
        return {
          propertyId,
          ...propertyData,
        };
      } else {
        // Listing page - extract filters from search params
        return this.extractListingFilters(searchParams);
      }
    }

    return {};
  }

  /**
   * Extract property data from DOM
   */
  private extractPropertyDataFromDOM(): Partial<PageContext> {
    if (typeof window === 'undefined') return {};

    // Look for structured data
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd.textContent || '');
        if (data['@type'] === 'RealEstate') {
          return {
            propertyType: data.propertyType,
            priceRange: data.offers?.price,
            features: data.amenityFeature?.map((f: any) => f.name),
          };
        }
      } catch (error) {
        console.warn('Failed to parse JSON-LD:', error);
      }
    }

    // Look for data attributes
    const propertyElement = document.querySelector('[data-property-type]');
    if (propertyElement) {
      return {
        propertyType: propertyElement.getAttribute('data-property-type') || undefined,
        priceRange: propertyElement.getAttribute('data-price-range') || undefined,
        features: propertyElement.getAttribute('data-features')?.split(',') || undefined,
      };
    }

    return {};
  }

  /**
   * Extract listing filters from search params
   */
  private extractListingFilters(searchParams?: URLSearchParams): Partial<PageContext> {
    if (!searchParams) return {};

    return {
      propertyType: searchParams.get('type') || undefined,
      priceRange: searchParams.get('price') || undefined,
      features: searchParams.get('features')?.split(',') || undefined,
    };
  }

  /**
   * Extract UTM parameters
   */
  private extractUtmParams(searchParams?: URLSearchParams): Record<string, string> | undefined {
    if (!searchParams) return undefined;

    const utmParams: Record<string, string> = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    for (const key of utmKeys) {
      const value = searchParams.get(key);
      if (value) {
        utmParams[key] = value;
      }
    }

    return Object.keys(utmParams).length > 0 ? utmParams : undefined;
  }

  /**
   * Update page history
   */
  private updatePageHistory(pathname: string): void {
    if (this.pageHistory[this.pageHistory.length - 1] !== pathname) {
      this.pageHistory.push(pathname);
      
      // Limit history length
      if (this.pageHistory.length > this.config.maxHistoryLength) {
        this.pageHistory = this.pageHistory.slice(-this.config.maxHistoryLength);
      }
    }
  }

  /**
   * Update time on page
   */
  private updateTimeOnPage(): void {
    if (this.currentContext) {
      this.currentContext.timeOnPage = Date.now() - this.pageStartTime;
    }
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden - pause time tracking
      this.updateTimeOnPage();
    } else {
      // Page is visible - resume time tracking
      this.pageStartTime = Date.now() - (this.currentContext?.timeOnPage || 0);
    }
  }

  /**
   * Handle before unload
   */
  private handleBeforeUnload(): void {
    this.updateTimeOnPage();
  }

  /**
   * Add context change listener
   */
  public addListener(callback: (context: PageContext) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(context: PageContext): void {
    this.listeners.forEach(callback => {
      try {
        callback(context);
      } catch (error) {
        console.error('Context listener error:', error);
      }
    });
  }

  /**
   * Get current context
   */
  public getCurrentContext(): PageContext | null {
    return this.currentContext;
  }

  /**
   * Update current context
   */
  public updateContext(updates: Partial<PageContext>): void {
    if (this.currentContext) {
      this.currentContext = { ...this.currentContext, ...updates };
      this.notifyListeners(this.currentContext);
    }
  }

  /**
   * Reset context
   */
  public reset(): void {
    this.currentContext = null;
    this.pageHistory = [];
    this.pageStartTime = Date.now();
  }
}

// React Hook for using page context
export function usePageContext(config?: PageContextManagerConfig) {
  const [context, setContext] = useState<PageContext | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const manager = PageContextManager.getInstance(config);

  const updateContext = useCallback((newContext: PageContext) => {
    setContext(newContext);
  }, []);

  useEffect(() => {
    // Detect initial context
    const detectedContext = manager.detectPageContext(pathname, searchParams);
    setContext(detectedContext);

    // Subscribe to context changes
    const unsubscribe = manager.addListener(updateContext);

    return unsubscribe;
  }, [pathname, searchParams, manager, updateContext]);

  const manualUpdateContext = useCallback((updates: Partial<PageContext>) => {
    manager.updateContext(updates);
  }, [manager]);

  return {
    context,
    updateContext: manualUpdateContext,
    detectContext: () => manager.detectPageContext(pathname, searchParams),
    manager,
  };
}

export default PageContextManager;