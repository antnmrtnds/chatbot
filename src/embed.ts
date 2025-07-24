import React from 'react';
import ReactDOM from 'react-dom/client';
import FloatingChatbot from './components/FloatingChatbot';
import './app/globals.css';

const embedChatbot = (elementId: string = 'viriato-chatbot-container') => {
  const embedElement = document.getElementById(elementId);
  if (embedElement) {
    const root = ReactDOM.createRoot(embedElement);
    root.render(
      React.createElement(React.StrictMode, null, 
        React.createElement(FloatingChatbot)
      )
    );
  } else {
    console.error(`Viriato Chatbot: Could not find element with id "${elementId}"`);
  }
};

// Expose the function to the global scope so it can be called from a script tag
(window as any).embedViriatoChatbot = embedChatbot; 