import RagService from './ragService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DocumentToIndex {
  content: string;
  metadata: {
    source: string;
    documentType: 'property_info' | 'general' | 'faq' | 'legal' | 'pricing';
    propertyId?: string;
    section?: string;
    title?: string;
    url?: string;
  };
}

export class DocumentIndexer {
  private ragService: RagService;

  constructor() {
    this.ragService = RagService.getInstance();
  }

  /**
   * Index property information from the developments table
   */
  async indexPropertyData(): Promise<void> {
    console.log('Starting property data indexing...');

    try {
      // Fetch all developments
      const { data: developments, error } = await supabase
        .from('developments')
        .select('*');

      if (error) {
        throw error;
      }

      if (!developments || developments.length === 0) {
        console.log('No developments found to index');
        return;
      }

      for (const development of developments) {
        const content = this.buildPropertyContent(development);
        
        await this.ragService.indexDocument(content, {
          source: `property_${development.flat_id}`,
          documentType: 'property_info',
          propertyId: development.flat_id,
          section: 'property_details',
        });

        console.log(`Indexed property: ${development.flat_id}`);
      }

      console.log(`Successfully indexed ${developments.length} properties`);
    } catch (error) {
      console.error('Error indexing property data:', error);
      throw error;
    }
  }

  /**
   * Index general company and project information
   */
  async indexGeneralInformation(): Promise<void> {
    console.log('Starting general information indexing...');

    const generalDocs: DocumentToIndex[] = [
      {
        content: `
Viriato é uma empresa imobiliária especializada em desenvolvimento de propriedades em Aveiro, Portugal.

Evergreen Pure Development:
- Localização: Santa Joana, Aveiro
- Composto por dois blocos com 8 apartamentos cada
- Oferece tipologias T1, T2, T3 e T3 duplex
- Áreas variam de 56m² a 117m²
- Design minimalista com acabamentos de alta qualidade
- Conclusão da construção prevista para final de 2025
- Todos os apartamentos estão atualmente em construção ("em planta")
- Proximidade a parques, escolas e transportes públicos
- Excelente conectividade com o centro de Aveiro
- Investimento ideal para habitação própria ou investimento
        `,
        metadata: {
          source: 'evergreen_pure_overview',
          documentType: 'general',
          section: 'project_overview',
          title: 'Evergreen Pure - Visão Geral do Projeto',
        },
      },
      {
        content: `
Tipologias Disponíveis no Evergreen Pure:

T1 (1 quarto):
- Área: aproximadamente 56m²
- Ideal para jovens profissionais ou investimento
- Layout otimizado com sala, cozinha, quarto e casa de banho
- Varanda privativa

T2 (2 quartos):
- Área: aproximadamente 70-85m²
- Perfeito para casais ou pequenas famílias
- Sala ampla, cozinha equipada, 2 quartos e 2 casas de banho
- Varanda com vista

T3 (3 quartos):
- Área: aproximadamente 95-105m²
- Ideal para famílias
- Sala espaçosa, cozinha moderna, 3 quartos e 2-3 casas de banho
- Varanda generosa

T3 Duplex:
- Área: aproximadamente 117m²
- Apartamento de dois pisos
- Piso inferior: sala, cozinha e casa de banho social
- Piso superior: 3 quartos e 2 casas de banho
- Terraço privativo
        `,
        metadata: {
          source: 'evergreen_pure_typologies',
          documentType: 'property_info',
          section: 'typologies',
          title: 'Tipologias Disponíveis',
        },
      },
      {
        content: `
Localização e Comodidades - Santa Joana, Aveiro:

Proximidade a Serviços:
- Escolas primárias e secundárias a 5 minutos
- Centro de saúde a 10 minutos
- Supermercados e farmácias na área
- Restaurantes e cafés locais

Transportes:
- Paragem de autocarro a 2 minutos a pé
- Estação de comboios de Aveiro a 15 minutos
- Acesso fácil à A1 e A25
- Estacionamento privativo disponível

Lazer e Recreação:
- Parque urbano nas proximidades
- Piscina comunitária no condomínio
- Ginásio e espaços verdes
- Ciclovia para o centro da cidade

Investimento:
- Zona em crescimento com valorização imobiliária
- Procura elevada para arrendamento
- Excelente conectividade com universidades
- Potencial de rentabilidade atrativo
        `,
        metadata: {
          source: 'location_amenities',
          documentType: 'general',
          section: 'location',
          title: 'Localização e Comodidades',
        },
      },
      {
        content: `
Processo de Compra e Financiamento:

Opções de Pagamento:
- Pagamento à vista com desconto especial
- Financiamento bancário até 90% do valor
- Planos de pagamento personalizados
- Apoio na obtenção de crédito habitação

Documentação Necessária:
- Documento de identificação
- Comprovativo de rendimentos
- Declaração de IRS
- Comprovativo de morada

Fases do Processo:
1. Reserva do apartamento (sinal)
2. Promessa de compra e venda
3. Acompanhamento da construção
4. Escritura final na conclusão da obra

Apoio Jurídico:
- Assessoria jurídica incluída
- Verificação de toda a documentação
- Acompanhamento em todas as fases
- Garantias de construção e acabamentos

Prazos:
- Reserva: imediata
- Promessa: 15 dias após reserva
- Conclusão: final de 2025
- Escritura: após conclusão da obra
        `,
        metadata: {
          source: 'purchase_process',
          documentType: 'general',
          section: 'purchase_financing',
          title: 'Processo de Compra e Financiamento',
        },
      },
      {
        content: `
Perguntas Frequentes (FAQ):

P: Quando ficam prontos os apartamentos?
R: A conclusão da construção está prevista para o final de 2025.

P: É possível visitar as obras?
R: Sim, organizamos visitas às obras mediante agendamento prévio.

P: Que garantias têm os apartamentos?
R: Todos os apartamentos têm garantia de construção de 5 anos e garantia de acabamentos de 2 anos.

P: Há estacionamento disponível?
R: Sim, cada apartamento tem direito a um lugar de estacionamento privativo.

P: É possível personalizar os acabamentos?
R: Dependendo da fase da obra, algumas personalizações podem ser possíveis. Consulte-nos para mais detalhes.

P: Qual o valor das despesas de condomínio?
R: As despesas estimadas são de aproximadamente 30-50€ mensais, dependendo da tipologia.

P: Há piscina no condomínio?
R: Sim, o condomínio terá piscina comunitária e espaços verdes.

P: É um bom investimento para arrendamento?
R: Sim, a localização e tipologias são muito procuradas para arrendamento, especialmente por estudantes e jovens profissionais.
        `,
        metadata: {
          source: 'faq',
          documentType: 'faq',
          section: 'frequently_asked_questions',
          title: 'Perguntas Frequentes',
        },
      },
    ];

    for (const doc of generalDocs) {
      await this.ragService.indexDocument(doc.content, doc.metadata);
      console.log(`Indexed: ${doc.metadata.title}`);
    }

    console.log(`Successfully indexed ${generalDocs.length} general documents`);
  }

  /**
   * Build comprehensive content for a property
   */
  private buildPropertyContent(development: any): string {
    const parts = [];

    // Basic information
    parts.push(`Apartamento ${development.flat_id}`);
    
    if (development.bloco) {
      parts.push(`Bloco: ${development.bloco}`);
    }
    
    if (development.piso) {
      parts.push(`Piso: ${development.piso}`);
    }
    
    if (development.tipologia) {
      parts.push(`Tipologia: ${development.tipologia}`);
    }

    // Price information
    if (development.price) {
      parts.push(`Preço: ${development.price}`);
    }

    // Main content
    if (development.content) {
      parts.push(`Descrição: ${development.content}`);
    }

    // Additional details
    if (development.texto_bruto) {
      parts.push(`Detalhes específicos: ${development.texto_bruto}`);
    }

    // Add context about the development
    parts.push(`
Este apartamento faz parte do empreendimento Evergreen Pure, localizado em Santa Joana, Aveiro.
O projeto oferece design moderno, acabamentos de qualidade e excelente localização.
Conclusão prevista para final de 2025.
Inclui estacionamento privativo e acesso a piscina comunitária.
    `);

    return parts.join('\n\n');
  }

  /**
   * Clear all indexed documents (for re-indexing)
   */
  async clearIndex(): Promise<void> {
    console.log('Clearing document index...');

    try {
      const { error } = await supabase
        .from('rag_document_chunks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw error;
      }

      console.log('Document index cleared successfully');
    } catch (error) {
      console.error('Error clearing index:', error);
      throw error;
    }
  }

  /**
   * Full re-index of all documents
   */
  async reindexAll(): Promise<void> {
    console.log('Starting full re-index...');

    try {
      await this.clearIndex();
      await this.indexGeneralInformation();
      await this.indexPropertyData();
      
      console.log('Full re-index completed successfully');
    } catch (error) {
      console.error('Error during full re-index:', error);
      throw error;
    }
  }

  /**
   * Get indexing statistics
   */
  async getIndexStats(): Promise<{
    totalChunks: number;
    documentTypes: Record<string, number>;
    sources: string[];
  }> {
    try {
      const { data: chunks, error } = await supabase
        .from('rag_document_chunks')
        .select('metadata');

      if (error) {
        throw error;
      }

      const stats = {
        totalChunks: chunks?.length || 0,
        documentTypes: {} as Record<string, number>,
        sources: [] as string[],
      };

      chunks?.forEach(chunk => {
        const metadata = chunk.metadata as any;
        const docType = metadata.documentType || 'unknown';
        const source = metadata.source || 'unknown';

        stats.documentTypes[docType] = (stats.documentTypes[docType] || 0) + 1;
        
        if (!stats.sources.includes(source)) {
          stats.sources.push(source);
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting index stats:', error);
      throw error;
    }
  }
}

export default DocumentIndexer;