import { v4 as uuidv4 } from 'uuid';

const VISITOR_ID_KEY = 'visitor_id';

/**
 * Gets the visitor ID from localStorage, or creates a new one.
 * @returns {string} The visitor ID.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') {
    return 'server'; // Cannot get visitor ID on the server
  }

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

type TrackEventPayload = {
  eventName: string;
  details?: Record<string, any>;
};

/**
 * Tracks an event by sending it to the backend API.
 * @param {TrackEventPayload} payload - The event data.
 */
export async function trackEvent({ eventName, details }: TrackEventPayload) {
  const visitorId = getVisitorId();

  try {
    const response = await fetch('/apis/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId,
        eventName,
        details,
        path: window.location.pathname,
      }),
    });

    if (!response.ok) {
      console.error('Failed to track event:', await response.text());
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
} 