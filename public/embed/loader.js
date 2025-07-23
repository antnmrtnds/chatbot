(function() {
  const SCRIPT_HOST = new URL(document.currentScript.src).origin;
  const MANIFEST_URL = `https://chatbot-azure-eight-78.vercel.app/embed/manifest.json`;

  function initChatbot(config) {
    if (window.embedViriatoChatbot) {
      window.embedViriatoChatbot(config);
    } else {
      console.error("Viriato Chatbot: embed function not found.");
    }
  }

  fetch(MANIFEST_URL)
    .then(response => response.json())
    .then(manifest => {
      const mainScript = manifest['main.js'];
      if (!mainScript) {
        console.error("Viriato Chatbot: Could not find main script in manifest.");
        return;
      }

      const script = document.createElement('script');
      script.src = mainScript;
      script.async = true;
      script.onload = function() {
        initChatbot(); 
      };
      document.head.appendChild(script);
    })
    .catch(error => {
      console.error("Viriato Chatbot: Failed to load manifest.", error);
    });
})(); 