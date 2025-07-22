export default function Home() {
  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      lineHeight: 1.6
    }}>
      <h1 style={{ color: '#0d9488', textAlign: 'center', marginBottom: '30px' }}>
        🤖 Viriato Chatbot Snippet
      </h1>
      
      <div style={{ 
        background: '#f0f9ff', 
        borderLeft: '4px solid #0d9488',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '0 8px 8px 0'
      }}>
        <h3 style={{ color: '#0d9488', marginTop: 0 }}>✨ Snippet Ativo</h3>
        <p>Este é o servidor de produção para o chatbot snippet. O widget está funcionando no canto inferior direito desta página.</p>
      </div>

      <div style={{ 
        background: '#f0f9ff', 
        borderLeft: '4px solid #0d9488',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '0 8px 8px 0'
      }}>
        <h3 style={{ color: '#0d9488', marginTop: 0 }}>📋 Como Usar</h3>
        <p>Para integrar o chatbot no seu website, adicione este código:</p>
        <pre style={{ 
          background: '#f3f4f6', 
          padding: '15px', 
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '14px'
        }}>
{`<script>
window.ViriatoChatbotConfig = {
    apiUrl: 'https://chatbotsnippet-c8i61neza-antnmrtnds-projects.vercel.app/api/chat',
    position: 'bottom-right',
    theme: 'light',
    primaryColor: '#0d9488',
    language: 'pt'
};
</script>
<script src="https://chatbotsnippet-c8i61neza-antnmrtnds-projects.vercel.app/chatbot-snippet.js"></script>`}
        </pre>
      </div>

      <div style={{ 
        background: '#f0f9ff', 
        borderLeft: '4px solid #0d9488',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '0 8px 8px 0'
      }}>
        <h3 style={{ color: '#0d9488', marginTop: 0 }}>🔧 Configurações</h3>
        <ul>
          <li><strong>apiUrl:</strong> URL da API do chatbot</li>
          <li><strong>position:</strong> bottom-right, bottom-left, top-right, top-left</li>
          <li><strong>theme:</strong> light, dark</li>
          <li><strong>primaryColor:</strong> Cor principal do widget</li>
          <li><strong>language:</strong> pt, en</li>
        </ul>
      </div>

      <div style={{ 
        background: '#f0f9ff', 
        borderLeft: '4px solid #0d9488',
        padding: '20px',
        borderRadius: '0 8px 8px 0'
      }}>
        <h3 style={{ color: '#0d9488', marginTop: 0 }}>📞 Suporte</h3>
        <p>Para suporte técnico ou dúvidas sobre a integração, entre em contacto:</p>
        <ul>
          <li>📧 Email: suporte@viriato.com</li>
          <li>📱 WhatsApp: +351 123 456 789</li>
          <li>🌐 Website: https://viriato.com</li>
        </ul>
      </div>
    </div>
  );
} 