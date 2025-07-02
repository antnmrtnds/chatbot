"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import visitorTracker from '@/lib/visitorTracker';

export default function AppTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    // Track page view for custom visitor tracker
    console.log("Tracking custom page view for:", url);
    visitorTracker.trackPageView(url);

  }, [pathname, searchParams]);

  return null; // This component does not render anything.
} 