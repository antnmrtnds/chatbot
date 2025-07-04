"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import visitorTracker from '@/lib/visitorTracker';

export default function AppTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageStartTime = useRef<number>(0);
  const currentUrl = useRef<string>('');
  const isPageVisible = useRef<boolean>(true);
  const timeSpentOnPage = useRef<number>(0);

  // Track page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.hidden) {
        // Page became hidden - pause time tracking
        if (pageStartTime.current > 0) {
          timeSpentOnPage.current += now - pageStartTime.current;
        }
        isPageVisible.current = false;
      } else {
        // Page became visible - resume time tracking
        pageStartTime.current = now;
        isPageVisible.current = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track page beforeunload to capture final time
  useEffect(() => {
    const handleBeforeUnload = () => {
      const now = Date.now();
      if (pageStartTime.current > 0 && isPageVisible.current) {
        timeSpentOnPage.current += now - pageStartTime.current;
      }
      
      if (timeSpentOnPage.current > 0 && currentUrl.current) {
        // Send time tracking data (using sendBeacon for reliability)
        const timeInSeconds = Math.floor(timeSpentOnPage.current / 1000);
        if (timeInSeconds > 2) { // Only track if more than 2 seconds
          visitorTracker.trackTimeOnPage(currentUrl.current, timeInSeconds);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track scroll depth for engagement
  useEffect(() => {
    let maxScrollDepth = 0;
    let hasTracked25 = false;
    let hasTracked50 = false;
    let hasTracked75 = false;
    let hasTracked100 = false;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      const scrollDepth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Track milestone scroll depths
        if (scrollDepth >= 25 && !hasTracked25) {
          hasTracked25 = true;
          visitorTracker.trackInteraction('scroll_depth_25', { depth: scrollDepth });
        } else if (scrollDepth >= 50 && !hasTracked50) {
          hasTracked50 = true;
          visitorTracker.trackInteraction('scroll_depth_50', { depth: scrollDepth });
        } else if (scrollDepth >= 75 && !hasTracked75) {
          hasTracked75 = true;
          visitorTracker.trackInteraction('scroll_depth_75', { depth: scrollDepth });
        } else if (scrollDepth >= 100 && !hasTracked100) {
          hasTracked100 = true;
          visitorTracker.trackInteraction('scroll_depth_100', { depth: scrollDepth });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Track clicks on important elements
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Track phone number clicks
      if (target.matches('a[href^="tel:"]') || target.closest('a[href^="tel:"]')) {
        visitorTracker.trackInteraction('phone_click', {
          element: target.tagName,
          text: target.textContent?.trim(),
          url: currentUrl.current
        });
      }

      // Track email clicks
      if (target.matches('a[href^="mailto:"]') || target.closest('a[href^="mailto:"]')) {
        visitorTracker.trackInteraction('email_click', {
          element: target.tagName,
          text: target.textContent?.trim(),
          url: currentUrl.current
        });
      }

      // Track form interactions
      if (target.matches('form') || target.closest('form')) {
        visitorTracker.trackInteraction('form_interaction', {
          element: target.tagName,
          formId: target.closest('form')?.id,
          url: currentUrl.current
        });
      }

      // Track button clicks
      if (target.matches('button') || target.closest('button')) {
        const buttonText = target.textContent?.trim() || target.closest('button')?.textContent?.trim();
        visitorTracker.trackInteraction('button_click', {
          element: target.tagName,
          text: buttonText,
          url: currentUrl.current
        });
      }

      // Track external links
      const link = target.closest('a[href]') as HTMLAnchorElement;
      if (link && link.hostname !== window.location.hostname) {
        visitorTracker.trackInteraction('external_link_click', {
          url: link.href,
          text: link.textContent?.trim(),
          currentPage: currentUrl.current
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Main page tracking effect
  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    // Send time data for previous page before tracking new page
    if (currentUrl.current && timeSpentOnPage.current > 0) {
      const timeInSeconds = Math.floor(timeSpentOnPage.current / 1000);
      if (timeInSeconds > 2) {
        visitorTracker.trackTimeOnPage(currentUrl.current, timeInSeconds);
      }
    }

    // Reset time tracking for new page
    currentUrl.current = url;
    pageStartTime.current = Date.now();
    timeSpentOnPage.current = 0;
    isPageVisible.current = !document.hidden;

    // Track page view
    console.log("Tracking enhanced page view for:", url);
    visitorTracker.trackPageView(url);

    // Track page type for analytics
    let pageType = 'other';
    if (pathname === '/') {
      pageType = 'homepage';
    } else if (pathname.includes('/imoveis')) {
      pageType = pathname.includes('/evergreen-pure/') ? 'property_detail' : 'property_listing';
    } else if (pathname.includes('/sobre')) {
      pageType = 'about';
    } else if (pathname.includes('/contacto')) {
      pageType = 'contact';
    }

    visitorTracker.trackInteraction('page_type_view', {
      pageType,
      url,
      timestamp: Date.now()
    });

  }, [pathname, searchParams]);

  // Track session duration periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPageVisible.current && pageStartTime.current > 0) {
        const currentTime = Date.now();
        const sessionTimeSpent = currentTime - pageStartTime.current;
        
        // Track long sessions (every 5 minutes)
        if (sessionTimeSpent > 300000 && sessionTimeSpent % 300000 < 10000) {
          visitorTracker.trackInteraction('long_session', {
            sessionDuration: Math.floor(sessionTimeSpent / 1000),
            url: currentUrl.current
          });
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return null; // This component does not render anything.
} 