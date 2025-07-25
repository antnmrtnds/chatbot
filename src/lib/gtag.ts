export const GA_TRACKING_ID = 'G-2QFEQS8FQF';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: URL) => {
  window.gtag?.('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
type GTagEvent = {
  action: string;
  category: string;
  label:string;
  value: number;
};

export const event = ({ action, category, label, value }: GTagEvent) => {
  window.gtag?.('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}; 