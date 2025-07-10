// Lead Management Service for Lead Qualification and Agent Handoff
// Handles BANT scoring, lead qualification, and agent notifications

export interface LeadData {
  // Contact Information
  contact_collection: string; // "Name - email@domain.com"
  phone_collection: string;
  
  // BANT Qualification
  budget_qualification: string;
  authority: string;
  need: string;
  timeline_qualification: string;
  
  // Metadata
  sessionId: string;
  timestamp: string;
  source: 'chatbot' | 'form' | 'phone' | 'other';
}

export interface QualificationScore {
  budget: number;
  authority: number;
  need: number;
  timeline: number;
  total: number;
  grade: 'A' | 'B' | 'C' | 'D';
  priority: 'High' | 'Medium' | 'Low';
}

export interface ProcessedLead {
  id: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  qualification: QualificationScore;
  rawData: LeadData;
  assignedAgent?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  createdAt: string;
  nextFollowUp?: string;
}

export class LeadService {
  private readonly AGENT_EMAILS = [
    'joao.silva@viriato.pt',
    'maria.santos@viriato.pt',
    'pedro.costa@viriato.pt'
  ];

  /**
   * Process and score a qualified lead
   */
  public async processLead(leadData: LeadData): Promise<ProcessedLead> {
    const contactInfo = this.extractContactInfo(leadData);
    const qualification = this.calculateBANTScore(leadData);
    const leadId = this.generateLeadId();
    
    const processedLead: ProcessedLead = {
      id: leadId,
      contactInfo,
      qualification,
      rawData: leadData,
      assignedAgent: this.assignAgent(qualification),
      status: 'new',
      createdAt: new Date().toISOString(),
      nextFollowUp: this.calculateNextFollowUp(qualification)
    };

    // Store lead (in a real implementation, this would go to a database)
    await this.storeLead(processedLead);
    
    // Notify assigned agent
    await this.notifyAgent(processedLead);
    
    // Send confirmation email to lead
    await this.sendLeadConfirmation(processedLead);

    return processedLead;
  }

  /**
   * Extract contact information from lead data
   */
  private extractContactInfo(leadData: LeadData): { name: string; email: string; phone: string } {
    const contactString = leadData.contact_collection;
    const emailMatch = contactString.match(/([^\s]+@[^\s]+\.[^\s]+)/);
    const email = emailMatch ? emailMatch[1] : '';
    
    // Extract name (everything before the email)
    const name = contactString.replace(/\s*-\s*[^\s]+@[^\s]+\.[^\s]+.*/, '').trim();
    
    return {
      name: name || 'Nome não fornecido',
      email: email,
      phone: leadData.phone_collection
    };
  }

  /**
   * Calculate BANT qualification score
   */
  private calculateBANTScore(leadData: LeadData): QualificationScore {
    const budgetScore = this.scoreBudget(leadData.budget_qualification);
    const authorityScore = this.scoreAuthority(leadData.authority);
    const needScore = this.scoreNeed(leadData.need);
    const timelineScore = this.scoreTimeline(leadData.timeline_qualification);
    
    const total = budgetScore + authorityScore + needScore + timelineScore;
    const grade = this.calculateGrade(total);
    const priority = this.calculatePriority(grade, timelineScore);

    return {
      budget: budgetScore,
      authority: authorityScore,
      need: needScore,
      timeline: timelineScore,
      total,
      grade,
      priority
    };
  }

  /**
   * Score budget qualification (0-25 points)
   */
  private scoreBudget(budget: string): number {
    switch (budget) {
      case 'Acima de 400.000€': return 25;
      case '300.000€ - 400.000€': return 20;
      case '200.000€ - 300.000€': return 15;
      case 'Até 200.000€': return 10;
      default: return 5;
    }
  }

  /**
   * Score authority qualification (0-25 points)
   */
  private scoreAuthority(authority: string): number {
    switch (authority) {
      case 'Sou eu que decido': return 25;
      case 'Decido com o meu cônjuge/parceiro': return 20;
      case 'Há outras pessoas envolvidas': return 10;
      default: return 5;
    }
  }

  /**
   * Score need qualification (0-25 points)
   */
  private scoreNeed(need: string): number {
    switch (need) {
      case 'Habitação própria': return 25;
      case 'Segunda habitação': return 20;
      case 'Investimento para arrendar': return 15;
      case 'Outro': return 10;
      default: return 5;
    }
  }

  /**
   * Score timeline qualification (0-25 points)
   */
  private scoreTimeline(timeline: string): number {
    switch (timeline) {
      case 'Imediatamente': return 25;
      case 'Nos próximos 3 meses': return 20;
      case 'Até ao final do ano': return 15;
      case 'Sem pressa específica': return 5;
      default: return 5;
    }
  }

  /**
   * Calculate overall grade based on total score
   */
  private calculateGrade(total: number): 'A' | 'B' | 'C' | 'D' {
    if (total >= 80) return 'A';
    if (total >= 65) return 'B';
    if (total >= 50) return 'C';
    return 'D';
  }

  /**
   * Calculate priority based on grade and timeline
   */
  private calculatePriority(grade: 'A' | 'B' | 'C' | 'D', timelineScore: number): 'High' | 'Medium' | 'Low' {
    if (grade === 'A' || (grade === 'B' && timelineScore >= 20)) return 'High';
    if (grade === 'B' || grade === 'C') return 'Medium';
    return 'Low';
  }

  /**
   * Assign agent based on lead quality and availability
   */
  private assignAgent(qualification: QualificationScore): string {
    // In a real implementation, this would check agent availability and workload
    // For now, assign based on priority
    const agentIndex = qualification.priority === 'High' ? 0 : 
                     qualification.priority === 'Medium' ? 1 : 2;
    
    return this.AGENT_EMAILS[agentIndex % this.AGENT_EMAILS.length];
  }

  /**
   * Calculate next follow-up date based on qualification
   */
  private calculateNextFollowUp(qualification: QualificationScore): string {
    const now = new Date();
    let followUpDate = new Date(now);

    switch (qualification.priority) {
      case 'High':
        followUpDate.setHours(now.getHours() + 2); // 2 hours
        break;
      case 'Medium':
        followUpDate.setDate(now.getDate() + 1); // 1 day
        break;
      case 'Low':
        followUpDate.setDate(now.getDate() + 3); // 3 days
        break;
    }

    return followUpDate.toISOString();
  }

  /**
   * Generate unique lead ID
   */
  private generateLeadId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `LEAD-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Store lead in database (mock implementation)
   */
  private async storeLead(lead: ProcessedLead): Promise<void> {
    // In a real implementation, this would store in a database
    console.log('Storing lead:', {
      id: lead.id,
      name: lead.contactInfo.name,
      email: lead.contactInfo.email,
      grade: lead.qualification.grade,
      priority: lead.qualification.priority,
      assignedAgent: lead.assignedAgent
    });
  }

  /**
   * Notify assigned agent about new lead
   */
  private async notifyAgent(lead: ProcessedLead): Promise<void> {
    const emailContent = this.generateAgentNotificationEmail(lead);
    
    // In a real implementation, this would send an actual email
    console.log('Agent notification email:', {
      to: lead.assignedAgent,
      subject: `Novo Lead ${lead.qualification.priority} - ${lead.contactInfo.name}`,
      content: emailContent
    });
  }

  /**
   * Generate agent notification email content
   */
  private generateAgentNotificationEmail(lead: ProcessedLead): string {
    return `
Novo Lead Qualificado - Prioridade ${lead.qualification.priority}

INFORMAÇÕES DE CONTACTO:
Nome: ${lead.contactInfo.name}
Email: ${lead.contactInfo.email}
Telefone: ${lead.contactInfo.phone}

QUALIFICAÇÃO BANT:
Orçamento: ${lead.rawData.budget_qualification} (${lead.qualification.budget}/25)
Autoridade: ${lead.rawData.authority} (${lead.qualification.authority}/25)
Necessidade: ${lead.rawData.need} (${lead.qualification.need}/25)
Timeline: ${lead.rawData.timeline_qualification} (${lead.qualification.timeline}/25)

PONTUAÇÃO TOTAL: ${lead.qualification.total}/100 (Grau ${lead.qualification.grade})

PRÓXIMO FOLLOW-UP: ${new Date(lead.nextFollowUp!).toLocaleString('pt-PT')}

ID do Lead: ${lead.id}
Origem: Chatbot Viriato
Data: ${new Date(lead.createdAt).toLocaleString('pt-PT')}

Por favor, contacte este lead dentro do prazo estabelecido.
    `.trim();
  }

  /**
   * Send confirmation email to lead
   */
  private async sendLeadConfirmation(lead: ProcessedLead): Promise<void> {
    const emailContent = this.generateLeadConfirmationEmail(lead);
    
    // In a real implementation, this would send an actual email
    console.log('Lead confirmation email:', {
      to: lead.contactInfo.email,
      subject: 'Obrigado pelo seu interesse - Viriato Imobiliária',
      content: emailContent
    });
  }

  /**
   * Generate lead confirmation email content
   */
  private generateLeadConfirmationEmail(lead: ProcessedLead): string {
    const followUpTime = lead.qualification.priority === 'High' ? 'nas próximas 2 horas' :
                        lead.qualification.priority === 'Medium' ? 'nas próximas 24 horas' :
                        'nos próximos 3 dias';

    return `
Olá ${lead.contactInfo.name},

Obrigado pelo seu interesse no Evergreen Pure!

Recebemos as suas informações e um dos nossos especialistas entrará em contacto consigo ${followUpTime} para lhe oferecer um atendimento personalizado.

Enquanto aguarda, pode:
• Explorar mais detalhes do projeto em www.viriato.pt
• Agendar uma visita através do nosso chatbot
• Contactar-nos diretamente: vendas@viriato.pt

Estamos ansiosos por ajudá-lo a encontrar a sua nova casa!

Cumprimentos,
Equipa Viriato Imobiliária

---
Referência: ${lead.id}
    `.trim();
  }

  /**
   * Get lead statistics (for dashboard/reporting)
   */
  public getLeadStats(): {
    totalLeads: number;
    byGrade: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    // Mock implementation - in reality, this would query the database
    return {
      totalLeads: 0,
      byGrade: { A: 0, B: 0, C: 0, D: 0 },
      byPriority: { High: 0, Medium: 0, Low: 0 }
    };
  }
}

// Export singleton instance
export const leadService = new LeadService();