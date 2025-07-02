"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Add type definition for Userled on the window object
declare global {
  interface Window {
    Userled?: (action: string, pageName?: string) => void;
  }
}

export default function UserledPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // The combination of pathname and searchParams should cover all URL changes.
    // This ensures that even changes in query parameters trigger a page view.
    if (window.Userled) {
      window.Userled("page");
    }
  }, [pathname, searchParams]);

  return null; // This component does not render anything.
} 