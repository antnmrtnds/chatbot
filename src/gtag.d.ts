export {};

declare global {
  interface Window {
    gtag?: (
      type: 'config' | 'event',
      trackingIdOrEventName: string,
      options?: Record<string, unknown>
    ) => void;
  }
} 