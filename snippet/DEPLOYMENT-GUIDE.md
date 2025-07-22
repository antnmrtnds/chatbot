# 🚀 Deployment Guide - Viriato Chatbot Snippet

This guide will walk you through deploying your chatbot snippet to Vercel and making it production-ready.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/) installed
- [Vercel CLI](https://vercel.com/cli) (will be installed automatically)
- Your environment variables ready

## 🎯 Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)
```bash
cd snippet
git init
git add .
git commit -m "Initial commit: Viriato Chatbot Snippet"
```

### 1.2 Push to GitHub
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/your-username/viriato-chatbot-snippet.git
git branch -M main
git push -u origin main
```

## 🔧 Step 2: Set Up Environment Variables

### 2.1 Create Environment Variables File
Your `.env` file should contain all the necessary variables. Make sure these are ready:

```env
# OpenAI Configuration
OPENAI_API_KEY=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

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nflssyblldwruktqftvl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbHNzeWJsbGR3cnVrdHFmdHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Nzc1MTYsImV4cCI6MjA2NjM1MzUxNn0.b9404ZJ47ZR0CtP61Dng5EzK-lxlsFOI1pJhH6rBNc8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbHNzeWJsbGR3cnVrdHFmdHZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc3NzUxNiwiZXhwIjoyMDY2MzUzNTE2fQ.orWxoOITIKp9a9BLjHikhgMIB17Ps2zcqH2hPtjvxeg

# Pinecone Configuration
PINECONE_API_KEY=pcsk_6VGC66_TsHc2eAUe9ThZRbdW3qMThkJPRCFfdccxdE7VDZG5ujgupzhxWgJ7ercgzuFr7i
PINECONE_INDEX_NAME=property-listings
PINECONE_CHAT_HISTORY_INDEX_NAME=chat-history

# Other Services
ELEVENLABS_API_KEY=sk_2d49b7f16dbf538e0582e0ddb96d85a790dd2f7a9cae3731
REDIS_URL=redis://chatbot:@Gght567ft@redis-13621.crce204.eu-west-2-3.ec2.redns.redis-cloud.com:13621
LANGFLOW_API_KEY=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
TWILIO_ACCOUNT_API_KEY=bQsO5wxaYNP8LCVqjd5Yx5TRw4pHwfRP
TWILIO_ACCOUNT_SID=ACec309662d0f2787fb80bcf4f76f2d65a
TWILIO_AUTH_TOKEN=e6c8b82acd3191c369a8004311e47a47
```

## 🚀 Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 3.2 Deploy
```bash
# Make sure you're in the snippet directory
cd snippet

# Deploy to Vercel
vercel --prod
```

### 3.3 Follow the Prompts
When prompted:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your account
- **Link to existing project?** → `N`
- **What's your project's name?** → `viriato-chatbot-snippet`
- **In which directory is your code located?** → `./` (current directory)
- **Want to override the settings?** → `N`

## ⚙️ Step 4: Configure Environment Variables

### 4.1 Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `viriato-chatbot-snippet` project
3. Go to **Settings** → **Environment Variables**

### 4.2 Add Environment Variables
Add each variable from your `.env` file:

| Name | Value | Environment |
|------|-------|-------------|
| `OPENAI_API_KEY` | `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` | Production |
| `PINECONE_API_KEY` | `pcsk_6VGC66_TsHc2eAUe9ThZRbdW3qMThkJPRCFfdccxdE7VDZG5ujgupzhxWgJ7ercgzuFr7i` | Production |
| `PINECONE_INDEX_NAME` | `property-listings` | Production |
| `PINECONE_CHAT_HISTORY_INDEX_NAME` | `chat-history` | Production |
| `SUPABASE_URL` | `https://nflssyblldwruktqftvl.supabase.co` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbHNzeWJsbGR3cnVrdHFmdHZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc3NzUxNiwiZXhwIjoyMDY2MzUzNTE2fQ.orWxoOITIKp9a9BLjHikhgMIB17Ps2zcqH2hPtjvxeg` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nflssyblldwruktqftvl.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbHNzeWJsbGR3cnVrdHFmdHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Nzc1MTYsImV4cCI6MjA2NjM1MzUxNn0.b9404ZJ47ZR0CtP61Dng5EzK-lxlsFOI1pJhH6rBNc8` | Production |
| `ELEVENLABS_API_KEY` | `sk_2d49b7f16dbf538e0582e0ddb96d85a790dd2f7a9cae3731` | Production |
| `REDIS_URL` | `redis://chatbot:@Gght567ft@redis-13621.crce204.eu-west-2-3.ec2.redns.redis-cloud.com:13621` | Production |
| `LANGFLOW_API_KEY` | `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` | Production |
| `TWILIO_ACCOUNT_API_KEY` | `bQsO5wxaYNP8LCVqjd5Yx5TRw4pHwfRP` | Production |
| `TWILIO_ACCOUNT_SID` | `ACec309662d0f2787fb80bcf4f76f2d65a` | Production |
| `TWILIO_AUTH_TOKEN` | `e6c8b82acd3191c369a8004311e47a47` | Production |

### 4.3 Redeploy
After adding environment variables, redeploy:
```bash
vercel --prod
```

## 🧪 Step 5: Test Your Deployment

### 5.1 Test the Landing Page
Visit your deployed URL (e.g., `https://viriato-chatbot-snippet.vercel.app`) to see the landing page.

### 5.2 Test the API
```bash
curl -X POST https://your-app-name.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, gostaria de saber mais sobre imóveis",
    "visitorId": "test_visitor_123"
  }'
```

### 5.3 Test the Snippet
Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Chatbot</title>
</head>
<body>
    <h1>Test Page</h1>
    <p>The chatbot should appear in the bottom-right corner.</p>
    
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
</body>
</html>
```

## 📝 Step 6: Update Your Snippet Configuration

### 6.1 Get Your Production URL
Your deployment URL will be something like:
- `https://viriato-chatbot-snippet.vercel.app`

### 6.2 Update Snippet Files
Update these files with your production URL:

1. **`public/chatbot-snippet.js`** - Line 6:
   ```javascript
   apiUrl: 'https://your-app-name.vercel.app/api/chat',
   ```

2. **`src/app/page.tsx`** - Update the example code:
   ```javascript
   apiUrl: 'https://your-app-name.vercel.app/api/chat',
   ```

3. **`README-CHATBOT-SNIPPET.md`** - Update all URLs

### 6.3 Redeploy After Updates
```bash
git add .
git commit -m "Update production URLs"
git push
vercel --prod
```

## 🔗 Step 7: Use the Snippet

### 7.1 Basic Integration
```html
<script src="https://your-app-name.vercel.app/chatbot-snippet.js"></script>
```

### 7.2 Advanced Configuration
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

## 🔒 Step 8: Security & Monitoring

### 8.1 Enable Monitoring
- Set up Vercel Analytics
- Monitor function logs
- Set up error tracking

### 8.2 Security Checklist
- ✅ HTTPS enabled
- ✅ CORS configured
- ✅ Environment variables secured
- ✅ Input validation
- ✅ Rate limiting (recommended)

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Check Vercel dashboard
   - Redeploy after adding variables
   - Verify variable names match exactly

2. **API Not Responding**
   - Check Vercel function logs
   - Test API endpoint directly
   - Verify environment variables

3. **Snippet Not Loading**
   - Check browser console for errors
   - Verify CORS settings
   - Test with different browsers

4. **Build Errors**
   - Check Vercel build logs
   - Verify all dependencies are installed
   - Check for TypeScript errors

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Test API endpoints directly
3. Verify environment variables
4. Contact support if needed

## ✅ Success Checklist

- [ ] Repository pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Environment variables configured
- [ ] API endpoint tested
- [ ] Snippet tested on test page
- [ ] Production URLs updated
- [ ] Security measures in place
- [ ] Monitoring enabled

Your chatbot snippet is now ready for production! 🎉 