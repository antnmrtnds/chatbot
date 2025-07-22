# 🤖 Viriato Chatbot Snippet

Standalone chatbot snippet for easy website integration.

## 🚀 Quick Start

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or deploy to production
vercel --prod
```

### 2. Set Environment Variables

In your Vercel dashboard, add these environment variables:

```env
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=property-listings
PINECONE_CHAT_HISTORY_INDEX_NAME=chat-history
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ELEVENLABS_API_KEY=your_elevenlabs_key
REDIS_URL=your_redis_url
LANGFLOW_API_KEY=your_langflow_key
TWILIO_ACCOUNT_API_KEY=your_twilio_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 3. Use the Snippet

Add this to any website:

```html
<script>
window.ViriatoChatbotConfig = {
    apiUrl: 'https://your-app-name.vercel.app/api/chat',
    position: 'bottom-right',
    theme: 'light',
    primaryColor: '#0d9488',
    language: 'pt'
};
</script>
<script src="https://your-app-name.vercel.app/chatbot-snippet.js"></script>
```

## 📁 Project Structure

```
snippet/
├── public/
│   └── chatbot-snippet.js    # Main snippet file
├── src/
│   └── app/
│       ├── api/
│       │   └── chat/
│       │       └── route.ts  # API endpoint
│       ├── layout.tsx        # Root layout
│       └── page.tsx          # Landing page
├── .env                      # Environment variables
├── next.config.mjs          # Next.js config
├── package.json             # Dependencies
├── vercel.json             # Vercel config
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `PINECONE_API_KEY` | Pinecone API key | Yes |
| `PINECONE_INDEX_NAME` | Pinecone index name | Yes |
| `SUPABASE_URL` | Supabase URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

### Snippet Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `apiUrl` | - | API endpoint URL (required) |
| `position` | `bottom-right` | Widget position |
| `theme` | `light` | Light or dark theme |
| `primaryColor` | `#0d9488` | Primary color |
| `language` | `pt` | Language (pt/en) |

## 🚀 Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/viriato-chatbot-snippet.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. **Update Snippet URL**
   - Replace `your-app-name.vercel.app` with your actual Vercel URL
   - Test the snippet on your website

## 🔒 Security

- ✅ HTTPS enabled by default
- ✅ CORS headers configured
- ✅ Input validation
- ✅ Rate limiting (recommended)
- ✅ Environment variables secured

## 📊 Monitoring

The snippet automatically:
- Generates unique visitor IDs
- Tracks message interactions
- Provides error logging
- Supports analytics integration

## 🐛 Troubleshooting

### Common Issues

1. **Snippet not loading**
   - Check if the URL is correct
   - Verify CORS settings
   - Check browser console for errors

2. **API not responding**
   - Verify environment variables
   - Check Vercel function logs
   - Test API endpoint directly

3. **Styling issues**
   - Check for CSS conflicts
   - Verify z-index values
   - Test on different browsers

## 📞 Support

For technical support:
- 📧 Email: suporte@viriato.com
- 📱 WhatsApp: +351 123 456 789
- 🌐 Website: https://viriato.com

## 📄 License

MIT License - see LICENSE file for details. 