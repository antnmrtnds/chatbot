# Viriato - Sistema de RAG Chatbot Imobiliário

Um sistema avançado de chatbot para imobiliário que utiliza Retrieval-Augmented Generation (RAG) para responder a perguntas sobre propriedades.

## Funcionalidades

- 🏠 **Interface Imobiliária Moderna**: Design baseado no website de referência civilria.pt
- 🤖 **Chatbot Inteligente**: Sistema RAG com OpenAI GPT-4 e embeddings
- 🔍 **Busca Vetorial**: Integração com Supabase para pesquisa semântica
- 📱 **Design Responsivo**: Interface otimizada para todos os dispositivos
- 🎨 **Componentes shadcn/ui**: Interface moderna e acessível

## Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes
- **IA**: OpenAI GPT-4, text-embedding-3-small
- **Base de Dados**: Supabase (PostgreSQL com pgvector)

## Instalação

### 1. Clone o repositório
\`\`\`bash
git clone <repository-url>
cd Viriato/frontend
\`\`\`

### 2. Instale as dependências
\`\`\`bash
npm install
\`\`\`

### 3. Configure as variáveis de ambiente
Copie o arquivo \`.env.example\` para \`.env.local\`:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edite \`.env.local\` com as suas chaves:
\`\`\`env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Configure a Base de Dados Supabase

#### Crie a tabela de embeddings:
\`\`\`sql
-- Ativar a extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela para armazenar embeddings dos imóveis
CREATE TABLE developments (
  id SERIAL PRIMARY KEY,
  flat_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para pesquisa vetorial
CREATE INDEX ON developments USING ivfflat (embedding vector_cosine_ops);
\`\`\`

#### Crie a função de pesquisa:
\`\`\`sql
CREATE OR REPLACE FUNCTION match_developments(
  query_embedding vector(1536),
  match_threshold float,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id int,
  flat_id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    developments.id,
    developments.flat_id,
    developments.content,
    developments.metadata,
    1 - (developments.embedding <=> query_embedding) AS similarity
  FROM developments
  WHERE 1 - (developments.embedding <=> query_embedding) > match_threshold
  ORDER BY developments.embedding <=> query_embedding
  LIMIT match_count;
$$;
\`\`\`

### 5. Popular a base de dados (Opcional)
Use o script em \`/data/embeddings.py\` para gerar embeddings dos seus imóveis:

\`\`\`python
# Instalar dependências Python
pip install openai supabase python-dotenv

# Executar o script
python data/embeddings.py
\`\`\`

### 6. Executar a aplicação
\`\`\`bash
npm run dev
\`\`\`

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

## Estrutura do Projeto

\`\`\`
frontend/
├── src/
│   ├── app/
│   │   ├── api/chat/          # API do chatbot RAG
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página do imóvel
│   ├── components/
│   │   ├── Header.tsx         # Cabeçalho com navegação
│   │   ├── Footer.tsx         # Rodapé
│   │   ├── Chatbot.tsx        # Widget do chatbot
│   │   └── ui/                # Componentes shadcn/ui
│   └── lib/
│       └── utils.ts           # Utilitários
├── public/                    # Recursos estáticos
├── .env.example              # Exemplo de variáveis de ambiente
└── README.md                 # Este ficheiro
\`\`\`

## Sistema RAG

O sistema RAG (Retrieval-Augmented Generation) funciona da seguinte forma:

1. **Embeddings**: O conteúdo dos imóveis é convertido em embeddings usando OpenAI
2. **Armazenamento**: Os embeddings são armazenados no Supabase com pgvector
3. **Pesquisa**: Quando o utilizador faz uma pergunta, é gerado um embedding da pergunta
4. **Retrieval**: O sistema procura conteúdo similar na base de dados
5. **Generation**: O contexto encontrado é enviado para o GPT-4 gerar uma resposta

### Prompt utilizado:
\`\`\`
Responde à seguinte pergunta usando apenas a informação abaixo sobre o apartamento:
---
{context}
---
Pergunta: {pergunta do utilizador}

Se não tiveres informação suficiente para responder à pergunta, diz "Não tenho informação específica sobre isso. Pode contactar-nos pelo telefone (+351) 234 840 570 para mais detalhes."
\`\`\`

## Personalização

### Adicionar novos imóveis
1. Adicione o conteúdo à base de dados Supabase
2. Gere embeddings usando o script Python
3. Atualize o \`flatId\` no componente Chatbot

### Modificar o design
- Edite os componentes em \`src/components/\`
- Personalize os estilos Tailwind
- Adicione novos componentes shadcn/ui conforme necessário

## Deployment

### Vercel (Recomendado)
1. Faça deploy no Vercel
2. Configure as variáveis de ambiente
3. O domínio será automaticamente configurado

### Outros provedores
Certifique-se de:
- Configurar as variáveis de ambiente
- Utilizar Node.js 18+
- Configurar o build: \`npm run build\`

## Suporte

Para questões ou suporte:
- Email: info@viriato.pt
- Telefone: (+351) 234 840 570
- Endereço: Rua Cristóvão Pinho Queimado Nº33 P3 E7, 3800-012 Aveiro

## Licença

Este projeto é proprietário da Viriato.
