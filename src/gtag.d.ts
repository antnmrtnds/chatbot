import "react";

export {};

declare global {
  interface Window {
    gtag?: (
      type: "config" | "event",
      trackingIdOrEventName: string,
      options?: Record<string, unknown>
    ) => void;
  }
  namespace JSX {
    interface IntrinsicElements {
      "viriato-chatbot": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}