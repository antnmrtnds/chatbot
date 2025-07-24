
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Role Key must be provided in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function populateSupabase() {
  // Add this line to refresh the schema cache
  await supabase.rpc('reload_schema_cache');
  
  const blocks = ['bloco1', 'bloco2'];
  const baseDir = path.join(process.cwd(), 'public', 'civilria');

  for (const block of blocks) {
    const blockDir = path.join(baseDir, block);
    if (!fs.existsSync(blockDir)) {
      console.warn(`Directory not found: ${blockDir}`);
      continue;
    }

    const files = fs.readdirSync(blockDir).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(blockDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      const { metadata, descricao_geral, regras_especificas, descricao_por_divisao } = data;

      const content = {
        descricao_geral,
        regras_especificas,
        descricao_por_divisao,
        typology: metadata.typology,
        ...metadata 
      };
      
      const { data: existing, error: selectError } = await supabase
        .from('developments')
        .select('id')
        .eq('flat_id', metadata.flat_id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116: 'No rows found'
        console.error(`Error checking for existing flat ${metadata.flat_id}:`, selectError);
        continue;
      }

      if (existing) {
        console.log(`Flat ${metadata.flat_id} already exists. Skipping.`);
        continue;
      }

      const { error: insertError } = await supabase.from('developments').insert({
        flat_id: metadata.flat_id,
        content: JSON.stringify(content),
        price: metadata.total_area_sqm, // Using total_area_sqm as a placeholder for price
      });

      if (insertError) {
        console.error(`Error inserting data for ${metadata.flat_id}:`, insertError);
      } else {
        console.log(`Successfully inserted data for ${metadata.flat_id}`);
      }
    }
  }
}

populateSupabase().catch(console.error); 