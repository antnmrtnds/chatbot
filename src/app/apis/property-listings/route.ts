
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import PDFParser from "pdf2json";

console.log("Loading /api/property-listings/route.ts");
console.log("OPENAI_API_KEY loaded:", !!process.env.OPENAI_API_KEY);
console.log("PINECONE_API_KEY loaded:", !!process.env.PINECONE_API_KEY);

let openai: OpenAI;
let pinecone: Pinecone;
let initializationError: string | null = null;

try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
} catch (e: any) {
  initializationError = e.message;
  console.error("Error during client initialization:", e);
}

export async function POST(req: NextRequest) {
  if (initializationError) {
    console.error("Returning 500 due to initialization error:", initializationError);
    return NextResponse.json({
      success: false,
      error: "Server configuration error.",
      details: initializationError,
    }, { status: 500 });
  }

  const data = await req.formData();
  const files: File[] = data.getAll("files") as unknown as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ success: false, error: "No files provided." });
  }

  try {
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const tempDir = path.join(process.cwd(), "tmp");
      await mkdir(tempDir, { recursive: true });
      const filePath = path.join(tempDir, file.name);

      await writeFile(filePath, buffer);
      console.log(`File uploaded to ${filePath}`);

      let fileContent = "";
      if (file.type === "application/pdf") {
        const pdfParser = new PDFParser();
        
        const pdfPromise = new Promise<string>((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
            resolve(pdfParser.getRawTextContent());
          });
        });
        
        pdfParser.parseBuffer(buffer);
        fileContent = await pdfPromise;
      } else {
        fileContent = await readFile(filePath, "utf-8");
      }

      const systemPrompt = `You are an expert real estate data analyst. Your task is to extract detailed information from a property listing document and format it into a structured JSON object.

The output MUST be a single JSON object. Do not include any text or markdown formatting before or after the JSON.

{
  "descricao_geral": "A comprehensive, engaging summary of the property.",
  "regras_especificas": "A summary of any specific rules, such as completion dates, condominium rules, etc.",
  "descricao_por_divisao": "A detailed description of each division of the house. This should be a single string.",
  "metadata": {
    "tipo_propriedade": "string",
    "quartos": "integer",
    "casas_de_banho": "integer",
    "area_m2": "integer",
    "tem_piscina": "boolean",
    "permite_animais": "boolean",
    "tem_garagem": "boolean",
    "ano_conclusao": "integer"
  }
}

INSTRUCTIONS:
- Analyze the provided text to find the values for each key.
- For boolean fields, infer the value. If a feature is mentioned, set it to true. If not, set it to false.
- For numeric fields, provide only the number (e.g., 94, not "94 m2").
- If a specific piece of information cannot be found, set its value to null.
- Combine all details about room descriptions into the single "descricao_por_divisao" field.`;
      
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Extract the information from the following property listing:\n\n${fileContent}`,
          },
        ],
        model: "gpt-4-turbo",
        response_format: { type: "json_object" },
      });

      const extractedData = chatCompletion.choices[0].message.content;

      if (extractedData) {
        const propertyDir = path.join(process.cwd(), "property");
        await mkdir(propertyDir, { recursive: true });
        const jsonFileName = `${path.parse(file.name).name}.json`;
        const jsonFilePath = path.join(propertyDir, jsonFileName);
        await writeFile(jsonFilePath, extractedData);
        console.log(`Extracted data saved to ${jsonFilePath}`);

        const jsonData = JSON.parse(extractedData);
        
        const pineconeMetadata = jsonData.metadata;

        const textToEmbed = [
          `Descrição Geral: ${jsonData.descricao_geral}`,
          `Regras Específicas: ${jsonData.regras_especificas}`,
          `Descrição por Divisão: ${jsonData.descricao_por_divisao}`,
        ].filter(Boolean).join("\n\n");

        const pineconeIndex = pinecone.index("property-listings");

        const embedding = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: textToEmbed,
        });

        const vector = embedding.data[0].embedding;
        const id = path.parse(file.name).name;

        await pineconeIndex.upsert([
          {
            id,
            values: vector,
            metadata: pineconeMetadata,
          },
        ]);
        console.log(`Data for ${id} inserted into Pinecone.`);

        const stats = await pineconeIndex.describeIndexStats();
        console.log("Pinecone index stats:", stats);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing files:", error);
    return NextResponse.json({
      success: false,
      error: "Error processing files.",
    });
  }
} 