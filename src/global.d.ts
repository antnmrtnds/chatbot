import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "viriato-chatbot": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
} 