import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'viriato-chatbot': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'api-key'?: string }, HTMLElement>;
    }
  }
} 