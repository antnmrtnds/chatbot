import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Check required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing required environment variable: OPENAI_API_KEY');
  console.error('Please add this to your .env file and try again.');
  process.exit(1);
}

interface FlatData {
  piso: string;
  tipologia: string;
  fracao: string;
  area_bruta_m2: number;
  area_privativa_m2: number;
  terracos_m2: number | null;
  descricao: {
    divisoes: Array<{ nome: string; area_m2: number }>;
    luz_natural: string;
    detalhes_extra: string[];
  };
}

interface PineconeFormatData {
  metadata: {
    flat_id: string;
    typology: string;
    floor: string;
    total_area_sqm: number;
    private_area_sqm: number;
    terrace_area_sqm: number | null;
    location: string;
    development: string;
    block: string;
    fraction: string;
  };
  descricao_geral: string;
  regras_especificas: string;
  descricao_por_divisao: string;
}

// Load project context information
function loadProjectContext(): string {
  try {
    const pureInfoPath = path.join(process.cwd(), 'Evergreen', 'Pure', 'info.json');
    const pureInfo = JSON.parse(fs.readFileSync(pureInfoPath, 'utf-8'));
    
    return `
CONTEXTO DO EMPREENDIMENTO:
- Nome: ${pureInfo.empreendimento.nome}
- Localização: ${pureInfo.cidade.nome} (${pureInfo.cidade.apelido})
- Desenvolvedor: ${pureInfo.desenvolvedor.nome} (${pureInfo.desenvolvedor.grupo})
- Características: ${pureInfo.empreendimento.descricao.join(', ')}
- Proximidade ao centro: ${pureInfo.localizacao.proximidade_centro_minutos} minutos
- Acabamentos: ${pureInfo.tipologias.acabamentos}
- Acessos: ${pureInfo.localizacao.acessos.rodovias.join(', ')}
`;
  } catch (error) {
    console.warn('⚠️ Could not load project context from Pure/info.json');
    return 'Empreendimento Evergreen Pure localizado em Aveiro.';
  }
}

async function convertFlatToPineconeFormat(
  flatData: FlatData, 
  blockNumber: string, 
  projectContext: string
): Promise<PineconeFormatData> {
  
  const prompt = `
Você é um especialista em marketing imobiliário português. Converta os seguintes dados de um apartamento para um formato adequado para um chatbot de vendas imobiliárias.

${projectContext}

DADOS DO APARTAMENTO:
${JSON.stringify(flatData, null, 2)}

INSTRUÇÕES:
1. Crie uma descrição geral atrativa e comercial do apartamento (150-200 palavras)
2. Liste regras específicas e informações importantes para potenciais compradores
3. Descreva cada divisão detalhadamente com as suas áreas

FORMATO DE RESPOSTA (JSON):
{
  "metadata": {
    "flat_id": "bloco${blockNumber}_${flatData.fracao.toLowerCase()}",
    "typology": "${flatData.tipologia}",
    "floor": "${flatData.piso}",
    "total_area_sqm": ${flatData.area_bruta_m2},
    "private_area_sqm": ${flatData.area_privativa_m2},
    "terrace_area_sqm": ${flatData.terracos_m2},
    "location": "Aveiro",
    "development": "Evergreen Pure",
    "block": "Bloco ${blockNumber}",
    "fraction": "${flatData.fracao}"
  },
  "descricao_geral": "Descrição comercial atrativa aqui...",
  "regras_especificas": "Informações importantes e regras aqui...",
  "descricao_por_divisao": "Descrição detalhada de cada divisão aqui..."
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

async function processFlatsDirectory(blockPath: string, blockNumber: string, projectContext: string) {
  const files = fs.readdirSync(blockPath).filter(file => file.endsWith('.json'));
  
  console.log(`📁 Processing Block ${blockNumber} with ${files.length} flats...`);
  
  for (const file of files) {
    const filePath = path.join(blockPath, file);
    const flatLetter = path.parse(file).name.split('_')[1]; // Extract letter from "1_a.json"
    
    try {
      console.log(`🏠 Processing Block ${blockNumber} - Flat ${flatLetter.toUpperCase()}...`);
      
      // Read original flat data
      const flatData: FlatData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Convert to Pinecone format using OpenAI
      const convertedData = await convertFlatToPineconeFormat(flatData, blockNumber, projectContext);
      
      // Create block-specific output directory
      const blockOutputDir = path.join(process.cwd(), 'public', 'civilria', `bloco${blockNumber}`);
      if (!fs.existsSync(blockOutputDir)) {
        fs.mkdirSync(blockOutputDir, { recursive: true });
      }
      
      // Save converted file with block-specific naming
      const outputFileName = `bloco${blockNumber}_${flatLetter}.json`;
      const outputPath = path.join(blockOutputDir, outputFileName);
      
      fs.writeFileSync(outputPath, JSON.stringify(convertedData, null, 2));
      console.log(`✅ Saved converted flat to: ${outputPath}`);
      
      // Small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error processing Block ${blockNumber} - Flat ${flatLetter}:`, error);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting flat conversion process...');
    
    // Load project context
    const projectContext = loadProjectContext();
    
    // Process both blocks
    const evergreenPath = path.join(process.cwd(), 'Evergreen', 'flats');
    
    // Process Block 1
    const block1Path = path.join(evergreenPath, 'bloco1');
    if (fs.existsSync(block1Path)) {
      await processFlatsDirectory(block1Path, '1', projectContext);
    }
    
    // Process Block 2
    const block2Path = path.join(evergreenPath, 'bloco2');
    if (fs.existsSync(block2Path)) {
      await processFlatsDirectory(block2Path, '2', projectContext);
    }
    
    console.log('✅ All flats converted successfully!');
    console.log('📂 Converted files saved to:');
    console.log('   - public/civilria/bloco1/ (Block 1 flats)');
    console.log('   - public/civilria/bloco2/ (Block 2 flats)');
    console.log('💡 You can now run "npm run index-documents" to index them in Pinecone');
    
  } catch (error) {
    console.error('❌ An error occurred during the conversion process:', error);
    process.exit(1);
  }
}

// Run the script
main(); 