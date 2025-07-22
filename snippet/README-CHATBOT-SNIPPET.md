# 🤖 Chatbot Imobiliário - Snippet de Integração

Este projeto inclui um snippet JavaScript que permite integrar facilmente o chatbot imobiliário em qualquer website.

## 📋 Características

- ✅ **Integração simples** - Apenas uma linha de código
- ✅ **Design responsivo** - Funciona em desktop e mobile
- ✅ **Personalização completa** - Cores, posição, idioma
- ✅ **Integração com WhatsApp** - Botão direto para WhatsApp
- ✅ **Rastreamento de visitantes** - ID único por visitante
- ✅ **Interface moderna** - Design limpo e profissional
- ✅ **Suporte a múltiplos idiomas** - Português e Inglês

## 🚀 Instalação Rápida

### 1. Básico (Recomendado)

Adicione este código ao final do seu HTML, antes do fechamento da tag `</body>`:

```html
<script src="https://your-domain.com/chatbot-snippet.js"></script>
```

### 2. Com Personalização

```html
<script>
window.ViriatoChatbotConfig = {
    apiUrl: 'https://your-domain.com/api/chat',
    position: 'bottom-right',
    theme: 'light',
    primaryColor: '#0d9488',
    language: 'pt'
};
</script>
<script src="https://your-domain.com/chatbot-snippet.js"></script>
```

## ⚙️ Configurações

| Propriedade | Padrão | Descrição |
|-------------|--------|-----------|
| `apiUrl` | - | URL da API do chatbot (obrigatório) |
| `position` | `bottom-right` | Posição do widget: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `theme` | `light` | Tema: `light`, `dark` |
| `primaryColor` | `#0d9488` | Cor principal do chatbot |
| `language` | `pt` | Idioma: `pt` (Português), `en` (Inglês) |

## 📱 Exemplos de Uso

### Exemplo 1: Configuração Básica

```html
<!DOCTYPE html>
<html>
<head>
    <title>Meu Website</title>
</head>
<body>
    <h1>Bem-vindo ao meu website</h1>
    
    <!-- Chatbot -->
    <script src="https://your-domain.com/chatbot-snippet.js"></script>
</body>
</html>
```

### Exemplo 2: Configuração Personalizada

```html
<!DOCTYPE html>
<html>
<head>
    <title>Meu Website</title>
</head>
<body>
    <h1>Bem-vindo ao meu website</h1>
    
    <!-- Configuração do Chatbot -->
    <script>
        window.ViriatoChatbotConfig = {
            apiUrl: 'https://api.meusite.com/chat',
            position: 'bottom-left',
            theme: 'dark',
            primaryColor: '#3b82f6',
            language: 'pt'
        };
    </script>
    <script src="https://your-domain.com/chatbot-snippet.js"></script>
</body>
</html>
```

### Exemplo 3: WordPress

Adicione ao seu `footer.php`:

```php
<script>
window.ViriatoChatbotConfig = {
    apiUrl: '<?php echo get_option('chatbot_api_url'); ?>',
    position: 'bottom-right',
    primaryColor: '<?php echo get_option('chatbot_color', '#0d9488'); ?>'
};
</script>
<script src="https://your-domain.com/chatbot-snippet.js"></script>
```

### Exemplo 4: React/Next.js

```jsx
import { useEffect } from 'react';

function ChatbotWidget() {
    useEffect(() => {
        // Configuração
        window.ViriatoChatbotConfig = {
            apiUrl: process.env.NEXT_PUBLIC_CHATBOT_API_URL,
            position: 'bottom-right',
            primaryColor: '#0d9488'
        };
        
        // Carregar script
        const script = document.createElement('script');
        script.src = 'https://your-domain.com/chatbot-snippet.js';
        document.body.appendChild(script);
        
        return () => {
            // Cleanup se necessário
            const existingScript = document.querySelector('script[src*="chatbot-snippet.js"]');
            if (existingScript) {
                existingScript.remove();
            }
        };
    }, []);
    
    return null; // Widget é injetado via script
}
```

## 🔧 Configuração do Backend

Para que o snippet funcione, você precisa ter uma API endpoint que aceite requisições POST com:

```json
{
    "message": "Olá, gostaria de saber mais sobre imóveis",
    "visitorId": "v_abc123_xyz789"
}
```

E retorne:

```json
{
    "response": "Olá! Como posso ajudar a encontrar o seu próximo imóvel?"
}
```

### Exemplo de API (Node.js/Express)

```javascript
app.post('/api/chat', async (req, res) => {
    const { message, visitorId } = req.body;
    
    try {
        // Processar mensagem com seu sistema de IA
        const response = await processMessage(message, visitorId);
        
        res.json({ response });
    } catch (error) {
        res.status(500).json({ 
            response: 'Desculpe, ocorreu um erro. Tente novamente.' 
        });
    }
});
```

## 🎨 Personalização Avançada

### Cores Personalizadas

```javascript
window.ViriatoChatbotConfig = {
    primaryColor: '#3b82f6', // Azul
    // ou
    primaryColor: '#ef4444', // Vermelho
    // ou
    primaryColor: '#10b981', // Verde
};
```

### Posições Disponíveis

```javascript
// Canto inferior direito (padrão)
position: 'bottom-right'

// Canto inferior esquerdo
position: 'bottom-left'

// Canto superior direito
position: 'top-right'

// Canto superior esquerdo
position: 'top-left'
```

### Temas

```javascript
// Tema claro (padrão)
theme: 'light'

// Tema escuro
theme: 'dark'
```

## 📊 Rastreamento e Analytics

O snippet automaticamente:

- Gera um ID único para cada visitante
- Armazena o ID no localStorage
- Envia o ID com cada mensagem para rastreamento
- Permite análise de conversas por visitante

### Exemplo de Dados Rastreados

```javascript
// ID do visitante
visitorId: "v_abc123_xyz789"

// Timestamp da primeira visita
firstVisit: "2024-01-15T10:30:00Z"

// Número de mensagens
messageCount: 5
```

## 🔒 Segurança

- ✅ HTTPS obrigatório para produção
- ✅ Validação de origem (CORS)
- ✅ Rate limiting recomendado
- ✅ Sanitização de inputs
- ✅ Logs de segurança

### Configuração de CORS

```javascript
// No seu servidor
app.use(cors({
    origin: ['https://meusite.com', 'https://www.meusite.com'],
    credentials: true
}));
```

## 🐛 Troubleshooting

### Problema: Chatbot não aparece
**Solução:** Verifique se o script está sendo carregado corretamente e se não há erros no console.

### Problema: API não responde
**Solução:** Verifique se a URL da API está correta e se o endpoint está funcionando.

### Problema: Estilo não carrega
**Solução:** Verifique se não há conflitos de CSS com o site principal.

### Problema: Chatbot aparece em posição errada
**Solução:** Verifique a configuração de `position` e se não há CSS conflitante.

## 📞 Suporte

Para suporte técnico ou dúvidas:

- 📧 Email: suporte@viriato.com
- 📱 WhatsApp: +351 123 456 789
- 🌐 Website: https://viriato.com/suporte

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📈 Roadmap

- [ ] Suporte a múltiplos idiomas
- [ ] Integração com CRM
- [ ] Analytics avançados
- [ ] Templates de resposta
- [ ] Integração com calendário
- [ ] Suporte a arquivos e imagens 