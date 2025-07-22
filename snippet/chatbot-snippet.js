(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    apiUrl: 'https://chatbotsnippet-c8i61neza-antnmrtnds-projects.vercel.app/api/chat', // Replace with your actual API URL
    position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    theme: 'light', // 'light', 'dark'
    primaryColor: '#0d9488', // teal-600
    language: 'pt' // 'pt', 'en'
  };

  // CSS Styles
  const STYLES = `
    .viriato-chatbot-container {
      position: fixed;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .viriato-chatbot-container.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .viriato-chatbot-container.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .viriato-chatbot-container.top-right {
      top: 20px;
      right: 20px;
    }
    
    .viriato-chatbot-container.top-left {
      top: 20px;
      left: 20px;
    }
    
    .viriato-chatbot-widget {
      width: 400px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease-in-out;
    }
    
    .viriato-chatbot-widget.hidden {
      transform: translateX(calc(100% + 20px));
    }
    
    .viriato-chatbot-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${CONFIG.primaryColor};
      color: white;
      border-radius: 12px 12px 0 0;
    }
    
    .viriato-chatbot-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .viriato-chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .viriato-chatbot-message {
      display: flex;
      gap: 8px;
      max-width: 80%;
    }
    
    .viriato-chatbot-message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    
    .viriato-chatbot-message.assistant {
      align-self: flex-start;
    }
    
    .viriato-chatbot-message-content {
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .viriato-chatbot-message.user .viriato-chatbot-message-content {
      background: ${CONFIG.primaryColor};
      color: white;
      border-radius: 18px 18px 4px 18px;
    }
    
    .viriato-chatbot-message.assistant .viriato-chatbot-message-content {
      background: #f3f4f6;
      color: #374151;
      border-radius: 18px 18px 18px 4px;
    }
    
    .viriato-chatbot-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }
    
    .viriato-chatbot-avatar.user {
      background: ${CONFIG.primaryColor};
      color: white;
    }
    
    .viriato-chatbot-avatar.assistant {
      background: #e0f2fe;
      color: ${CONFIG.primaryColor};
    }
    
    .viriato-chatbot-input {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }
    
    .viriato-chatbot-input input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
    }
    
    .viriato-chatbot-input input:focus {
      border-color: ${CONFIG.primaryColor};
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
    }
    
    .viriato-chatbot-send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${CONFIG.primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }
    
    .viriato-chatbot-send-btn:hover {
      background: ${CONFIG.primaryColor}dd;
    }
    
    .viriato-chatbot-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .viriato-chatbot-new-conversation {
      display: flex;
      justify-content: center;
      padding: 8px 16px;
      border-top: 1px solid #e5e7eb;
    }
    
    .viriato-chatbot-new-conversation button {
      background: transparent;
      border: none;
      color: #9ca3af;
      font-size: 14px;
      cursor: pointer;
      transition: color 0.2s ease;
    }
    
    .viriato-chatbot-new-conversation button:hover {
      color: #6b7280;
    }
    
    .viriato-chatbot-toggle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${CONFIG.primaryColor};
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
    
    .viriato-chatbot-toggle:hover {
      transform: scale(1.05);
    }
    
    .viriato-chatbot-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 14px;
    }
    
    .viriato-chatbot-loading-dots {
      display: flex;
      gap: 4px;
    }
    
    .viriato-chatbot-loading-dots span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #9ca3af;
      animation: loading 1.4s infinite ease-in-out;
    }
    
    .viriato-chatbot-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
    .viriato-chatbot-loading-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes loading {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    
    .viriato-chatbot-whatsapp {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #25d366;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
      text-decoration: none;
    }
    
    .viriato-chatbot-whatsapp:hover {
      transform: scale(1.05);
    }
    
    .viriato-chatbot-whatsapp svg {
      width: 32px;
      height: 32px;
    }
  `;

  // Generate unique visitor ID
  function generateVisitorId() {
    return 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  // Get or create visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('viriato_visitor_id');
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem('viriato_visitor_id', visitorId);
    }
    return visitorId;
  }

  // Create chat session
  function createChatSession() {
    return {
      messages: [
        {
          role: 'assistant',
          content: 'Olá! Como posso ajudar a encontrar o seu próximo imóvel?'
        }
      ],
      sessionId: null,
      visitorId: getVisitorId()
    };
  }

  // Create and inject styles
  function injectStyles() {
    if (document.getElementById('viriato-chatbot-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'viriato-chatbot-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // Create chatbot HTML
  function createChatbotHTML() {
    return `
      <div class="viriato-chatbot-container ${CONFIG.position}">
        <div class="viriato-chatbot-widget hidden" id="viriato-chatbot-widget">
          <div class="viriato-chatbot-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21l18-18M9 21l6-6M3 9l6 6M3 3l18 18"/>
            </svg>
            <h3>Assistente Imobiliário</h3>
          </div>
          <div class="viriato-chatbot-messages" id="viriato-chatbot-messages">
            <div class="viriato-chatbot-message assistant">
              <div class="viriato-chatbot-avatar assistant">A</div>
              <div class="viriato-chatbot-message-content">
                Olá! Como posso ajudar a encontrar o seu próximo imóvel?
              </div>
            </div>
          </div>
          <div class="viriato-chatbot-input">
            <input type="text" id="viriato-chatbot-input" placeholder="Pergunte sobre os imóveis..." />
            <button class="viriato-chatbot-send-btn" id="viriato-chatbot-send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
          <div class="viriato-chatbot-new-conversation">
            <button onclick="ViriatoChatbot.newConversation()">Nova conversa</button>
          </div>
        </div>
        <div class="viriato-chatbot-toggle" id="viriato-chatbot-toggle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <a href="https://wa.me/14155238886?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20im%C3%B3veis." 
           target="_blank" rel="noopener noreferrer" class="viriato-chatbot-whatsapp">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.387 1.876 6.138l-1.162 4.253 4.409-1.159z"/>
          </svg>
        </a>
      </div>
    `;
  }

  // Add message to chat
  function addMessage(content, role = 'assistant') {
    const messagesContainer = document.getElementById('viriato-chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `viriato-chatbot-message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = `viriato-chatbot-avatar ${role}`;
    avatar.textContent = role === 'user' ? 'U' : 'A';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'viriato-chatbot-message-content';
    messageContent.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show loading indicator
  function showLoading() {
    const messagesContainer = document.getElementById('viriato-chatbot-messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'viriato-chatbot-message assistant';
    loadingDiv.id = 'viriato-chatbot-loading';
    
    loadingDiv.innerHTML = `
      <div class="viriato-chatbot-avatar assistant">A</div>
      <div class="viriato-chatbot-message-content">
        <div class="viriato-chatbot-loading">
          <span>Pensando...</span>
          <div class="viriato-chatbot-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide loading indicator
  function hideLoading() {
    const loadingDiv = document.getElementById('viriato-chatbot-loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  // Send message to API
  async function sendMessage(message) {
    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          visitorId: getVisitorId(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.response || 'Desculpe, não consegui processar a sua mensagem.';
    } catch (error) {
      console.error('Error sending message:', error);
      return 'Desculpe, ocorreu um erro. Tente novamente mais tarde.';
    }
  }

  // Handle send message
  async function handleSendMessage() {
    const input = document.getElementById('viriato-chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    input.value = '';
    
    // Show loading
    showLoading();
    
    // Send to API
    const response = await sendMessage(message);
    
    // Hide loading
    hideLoading();
    
    // Add assistant response
    addMessage(response, 'assistant');
  }

  // Handle new conversation
  function handleNewConversation() {
    // Clear messages except the initial assistant message
    const messagesContainer = document.getElementById('viriato-chatbot-messages');
    messagesContainer.innerHTML = `
      <div class="viriato-chatbot-message assistant">
        <div class="viriato-chatbot-avatar assistant">A</div>
        <div class="viriato-chatbot-message-content">
          Olá! Como posso ajudar a encontrar o seu próximo imóvel?
        </div>
      </div>
    `;
    
    // Clear input
    const input = document.getElementById('viriato-chatbot-input');
    if (input) input.value = '';
    
    console.log('New conversation started');
  }

  // Initialize chatbot
  function initChatbot() {
    // Inject styles
    injectStyles();
    
    // Create and inject HTML
    const chatbotHTML = createChatbotHTML();
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    
    // Add event listeners
    const toggle = document.getElementById('viriato-chatbot-toggle');
    const widget = document.getElementById('viriato-chatbot-widget');
    const input = document.getElementById('viriato-chatbot-input');
    const sendBtn = document.getElementById('viriato-chatbot-send');
    
    toggle.addEventListener('click', () => {
      widget.classList.toggle('hidden');
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });
    
    sendBtn.addEventListener('click', handleSendMessage);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }

  // Expose configuration for customization
  window.ViriatoChatbot = {
    config: CONFIG,
    init: initChatbot,
    newConversation: handleNewConversation
  };

})(); 