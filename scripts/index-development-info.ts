import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { processGenericDocument } from '../src/lib/rag/documentProcessor';
import { Pinecone } from '@pinecone-database/pinecone';

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'PINECONE_API_KEY', 'PINECONE_INDEX_NAME'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease add these to your .env file and try again.');
  process.exit(1);
}

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

interface DevelopmentInfo {
  empreendimento: {
    nome: string;
    taglines: string[];
    descricao: string[];
  };
  localizacao: {
    proximidade_centro_minutos: number;
    acessos: {
      rodovias: string[];
      ferroviarios: string;
      aereos: string;
    };
  };
  tipologias: {
    blocos: number;
    apartamentos_por_bloco: number;
    tipos_apartamento: Array<{
      tipologia: string;
      area_min_m2?: number;
      area_max_m2?: number;
    }>;
    acabamentos: string;
    iluminacao_natural: boolean;
  };
  cidade: {
    nome: string;
    apelido: string;
    caracteristicas: string[];
    gastronomia: string[];
    natureza: string[];
    transportes: {
      rodovias: string[];
      proximas_cidades: string[];
    };
    eventos: string[];
    qualidade_de_vida: {
      seguranca: boolean;
      oferta_educativa: boolean;
      atividades_ao_ar_livre: boolean;
    };
  };
  distrito: {
    nome: string;
    regiao: string;
    historico: string[];
    economia: string[];
    atracoes_turisticas: string[];
  };
  praias: {
    principais: Array<{
      nome: string;
      destaque: string;
    }>;
    atividades: string[];
  };
  agueda: {
    descricao: string;
    festivais: string[];
    naturaleza: string[];
    economia: string[];
    qualidade_de_vida: boolean;
  };
  desenvolvedor: {
    nome: string;
    grupo: string;
    experiencia_anos: number;
    principios: string[];
    parceiros: string[];
    missao: string;
  };
}

interface PineconeFormatData {
  metadata: {
    source: string;
    type: string;
    development: string;
    location: string;
    developer: string;
  };
  descricao_geral: string;
  regras_especificas: string;
  descricao_por_divisao: string;
}

async function convertDevelopmentInfoToPineconeFormat(developmentInfo: DevelopmentInfo): Promise<PineconeFormatData> {
  const prompt = `
Você é um especialista em marketing imobiliário português. Converta as seguintes informações sobre um empreendimento imobiliário para um formato adequado para um chatbot de vendas imobiliárias.

INFORMAÇÕES DO EMPREENDIMENTO:
${JSON.stringify(developmentInfo, null, 2)}

INSTRUÇÕES:
1. Crie uma descrição geral completa e atrativa do empreendimento (300-400 palavras)
2. Liste informações importantes sobre localização, tipologias disponíveis, acabamentos, e características únicas
3. Inclua informações sobre Aveiro, as praias próximas, atrações turísticas e qualidade de vida
4. Mencione o desenvolvedor e sua experiência

FORMATO DE RESPOSTA (JSON):
{
  "metadata": {
    "source": "evergreen_pure_info.json",
    "type": "development_info",
    "development": "Evergreen Pure",
    "location": "Aveiro",
    "developer": "UpInvestments"
  },
  "descricao_geral": "Descrição completa e comercial do empreendimento aqui...",
  "regras_especificas": "Informações sobre tipologias, acabamentos, localização e características específicas aqui...",
  "descricao_por_divisao": "Informações sobre Aveiro, praias, atrações, transportes e qualidade de vida na região aqui..."
}

Responda APENAS com o JSON válido, sem texto adicional.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em marketing imobiliário português. Responda sempre em português e apenas com JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response to ensure it's valid JSON
    const cleanedContent = content.trim().replace(/```json\n?|\n?```/g, '');
    
    try {
      return JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', cleanedContent);
      throw new Error('Invalid JSON response from OpenAI');
    }

  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    throw error;
  }
}

async function indexDevelopmentInfo(convertedData: PineconeFormatData): Promise<void> {
  const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);
  
  // Combine all content for embedding
  const textToEmbed = [
    convertedData.descricao_geral,
    convertedData.regras_especificas,
    convertedData.descricao_por_divisao
  ].filter(Boolean).join('\n\n');

  try {
    // Create embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: textToEmbed,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Clean metadata: remove null values and convert to strings
    const cleanedMetadata: any = {};
    for (const [key, value] of Object.entries(convertedData.metadata)) {
      if (value !== null && value !== undefined) {
        cleanedMetadata[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    }

    // Store the content in metadata for retrieval
    cleanedMetadata.pageContent = textToEmbed;

    // Create unique ID for the development info
    const vectorId = 'evergreen_pure_development_info';

    // Insert into Pinecone
    await pineconeIndex.upsert([{
      id: vectorId,
      values: embedding,
      metadata: cleanedMetadata
    }]);

    console.log(`✅ Successfully indexed development info in Pinecone with ID: ${vectorId}`);

  } catch (error) {
    console.error('❌ Error indexing development info:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Evergreen Pure development info indexing process...');

    // Read the development info file
    const infoFilePath = path.join(process.cwd(), 'Evergreen', 'Pure', 'info.json');
    
    if (!fs.existsSync(infoFilePath)) {
      console.error(`❌ File not found: ${infoFilePath}`);
      process.exit(1);
    }

    console.log('📖 Reading development info file...');
    const developmentInfo: DevelopmentInfo = JSON.parse(fs.readFileSync(infoFilePath, 'utf-8'));

    // Convert to Pinecone format using OpenAI
    console.log('🤖 Converting to Pinecone format using OpenAI...');
    const convertedData = await convertDevelopmentInfoToPineconeFormat(developmentInfo);

    // Save converted data for reference
    const outputDir = path.join(process.cwd(), 'public', 'civilria');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'evergreen_pure_info.json');
    fs.writeFileSync(outputPath, JSON.stringify(convertedData, null, 2));
    console.log(`💾 Saved converted data to: ${outputPath}`);

    // Index in Pinecone
    console.log('📊 Indexing in Pinecone...');
    await indexDevelopmentInfo(convertedData);

    console.log('✅ Development info indexed successfully!');
    console.log('💡 The chatbot can now answer questions about the Evergreen Pure development');

  } catch (error) {
    console.error('❌ An error occurred during the indexing process:', error);
    process.exit(1);
  }
}

// Run the script
main(); 