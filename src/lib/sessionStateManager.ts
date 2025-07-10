// Session State Manager for Multi-Step Flows and Interruption Handling
// Manages complex conversation flows like property search, lead qualification, etc.

import { memoryService } from './memoryService';

export interface FlowStep {
  id: string;
  type: 'question' | 'action' | 'confirmation' | 'completion';
  message: string;
  options?: string[];
  validation?: (input: string) => boolean | string;
  nextStep?: string | ((input: string) => string);
  onComplete?: (data: any) => Promise<void>;
}

export interface FlowDefinition {
  id: string;
  name: string;
  description: string;
  steps: { [stepId: string]: FlowStep };
  initialStep: string;
  canInterrupt: boolean;
  resumeMessage?: string;
}

// Define common multi-step flows
const FLOW_DEFINITIONS: { [flowId: string]: FlowDefinition } = {
  property_search: {
    id: 'property_search',
    name: 'Property Search',
    description: 'Help user find suitable properties based on their preferences',
    canInterrupt: true,
    resumeMessage: 'Vamos continuar a procurar a propriedade ideal para si.',
    initialStep: 'budget',
    steps: {
      budget: {
        id: 'budget',
        type: 'question',
        message: 'Para lhe mostrar as melhores opções, qual é o seu orçamento aproximado?',
        options: ['Até 300.000€', 'Entre 300.000€ - 400.000€', 'Acima de 400.000€', 'Prefiro não dizer'],
        validation: (input: string) => input.length > 0,
        nextStep: 'property_type'
      },
      property_type: {
        id: 'property_type',
        type: 'question',
        message: 'Que tipo de propriedade procura?',
        options: ['T1', 'T2', 'T3', 'T3 Duplex', 'Qualquer tipologia'],
        validation: (input: string) => input.length > 0,
        nextStep: 'timeline'
      },
      timeline: {
        id: 'timeline',
        type: 'question',
        message: 'Quando pretende fazer a compra?',
        options: ['Imediatamente', 'Nos próximos 3 meses', 'Nos próximos 6 meses', 'Só estou a ver opções'],
        validation: (input: string) => input.length > 0,
        nextStep: 'completion'
      },
      completion: {
        id: 'completion',
        type: 'completion',
        message: 'Perfeito! Com base nas suas preferências, vou mostrar-lhe as melhores opções disponíveis.',
        onComplete: async (data: any) => {
          // This will be handled by the calling component
          console.log('Property search completed with data:', data);
        }
      }
    }
  },
  
  lead_qualification: {
    id: 'lead_qualification',
    name: 'Lead Qualification',
    description: 'Qualify potential leads through BANT methodology with complete contact capture',
    canInterrupt: true,
    resumeMessage: 'Vamos continuar a recolher algumas informações para melhor o ajudar.',
    initialStep: 'contact_collection',
    steps: {
      contact_collection: {
        id: 'contact_collection',
        type: 'question',
        message: 'Para lhe oferecer o melhor atendimento, preciso do seu nome e email:',
        options: ['Exemplo: Maria Silva - maria@email.com'],
        validation: (input: string) => {
          const emailRegex = /\S+@\S+\.\S+/;
          return emailRegex.test(input) || 'Por favor, forneça nome e email válido (ex: Maria Silva - maria@email.com)';
        },
        nextStep: 'phone_collection'
      },
      phone_collection: {
        id: 'phone_collection',
        type: 'question',
        message: 'Qual é o seu número de telefone para contacto?',
        options: ['Exemplo: +351 912 345 678'],
        validation: (input: string) => {
          const phoneRegex = /[\d\s\+\-\(\)]{9,}/;
          return phoneRegex.test(input) || 'Por favor, forneça um número de telefone válido';
        },
        nextStep: 'budget_qualification'
      },
      budget_qualification: {
        id: 'budget_qualification',
        type: 'question',
        message: 'Para lhe dar as melhores recomendações, qual é o seu orçamento para este investimento?',
        options: ['Até 200.000€', '200.000€ - 300.000€', '300.000€ - 400.000€', 'Acima de 400.000€'],
        validation: (input: string) => input.length > 0,
        nextStep: 'authority'
      },
      authority: {
        id: 'authority',
        type: 'question',
        message: 'É o decisor principal desta compra ou há outras pessoas envolvidas na decisão?',
        options: ['Sou eu que decido', 'Decido com o meu cônjuge/parceiro', 'Há outras pessoas envolvidas'],
        validation: (input: string) => input.length > 0,
        nextStep: 'need'
      },
      need: {
        id: 'need',
        type: 'question',
        message: 'Esta propriedade é para habitação própria ou investimento?',
        options: ['Habitação própria', 'Investimento para arrendar', 'Segunda habitação', 'Outro'],
        validation: (input: string) => input.length > 0,
        nextStep: 'timeline_qualification'
      },
      timeline_qualification: {
        id: 'timeline_qualification',
        type: 'question',
        message: 'Qual é o seu prazo ideal para concretizar esta compra?',
        options: ['Imediatamente', 'Nos próximos 3 meses', 'Até ao final do ano', 'Sem pressa específica'],
        validation: (input: string) => input.length > 0,
        nextStep: 'qualification_scoring'
      },
      qualification_scoring: {
        id: 'qualification_scoring',
        type: 'action',
        message: 'A processar a sua qualificação...',
        nextStep: 'agent_handoff'
      },
      agent_handoff: {
        id: 'agent_handoff',
        type: 'completion',
        message: 'Excelente! Com base no seu perfil, vou conectá-lo com um dos nossos especialistas que entrará em contacto consigo nas próximas 24 horas. Também vai receber um email com informações personalizadas.',
        onComplete: async (data: any) => {
          console.log('Lead qualification completed with data:', data);
          // This will trigger lead scoring and agent notification
        }
      }
    }
  },

  visit_scheduling: {
    id: 'visit_scheduling',
    name: 'Visit Scheduling',
    description: 'Schedule property visits with calendar integration',
    canInterrupt: false,
    initialStep: 'visit_type',
    steps: {
      visit_type: {
        id: 'visit_type',
        type: 'question',
        message: 'Que tipo de visita prefere?',
        options: ['Visita presencial', 'Visita virtual', 'Ambas as opções me interessam'],
        validation: (input: string) => input.length > 0,
        nextStep: 'contact_info'
      },
      contact_info: {
        id: 'contact_info',
        type: 'question',
        message: 'Para agendar a visita, preciso do seu nome e email:',
        options: ['Exemplo: João Silva - joao@email.com'],
        validation: (input: string) => {
          const emailRegex = /\S+@\S+\.\S+/;
          return emailRegex.test(input) || 'Por favor, forneça nome e email válido (ex: João Silva - joao@email.com)';
        },
        nextStep: 'phone_number'
      },
      phone_number: {
        id: 'phone_number',
        type: 'question',
        message: 'Qual é o seu número de telefone?',
        options: ['Exemplo: +351 912 345 678'],
        validation: (input: string) => {
          const phoneRegex = /[\d\s\+\-\(\)]{9,}/;
          return phoneRegex.test(input) || 'Por favor, forneça um número de telefone válido';
        },
        nextStep: 'preferred_date'
      },
      preferred_date: {
        id: 'preferred_date',
        type: 'question',
        message: 'Quando prefere fazer a visita?',
        options: ['Amanhã', 'Esta semana', 'Próxima semana', 'Tenho flexibilidade'],
        validation: (input: string) => input.length > 0,
        nextStep: 'preferred_time'
      },
      preferred_time: {
        id: 'preferred_time',
        type: 'question',
        message: 'Que período do dia prefere?',
        options: ['Manhã (9h-12h)', 'Tarde (14h-17h)', 'Final do dia (17h-19h)', 'Qualquer horário'],
        validation: (input: string) => input.length > 0,
        nextStep: 'completion'
      },
      completion: {
        id: 'completion',
        type: 'completion',
        message: 'Excelente! A sua visita foi agendada. Vai receber um email de confirmação com os detalhes e um convite para adicionar ao seu calendário.',
        onComplete: async (data: any) => {
          console.log('Visit scheduling completed with data:', data);
          // This will trigger calendar invite generation
        }
      }
    }
  }
};

export class SessionStateManager {
  /**
   * Start a new multi-step flow
   */
  public async startFlow(
    sessionId: string,
    visitorId: string,
    flowId: string,
    context?: any
  ): Promise<{ message: string; options?: string[]; flowStep: string } | null> {
    const flowDef = FLOW_DEFINITIONS[flowId];
    if (!flowDef) {
      console.error(`Flow definition not found: ${flowId}`);
      return null;
    }

    const initialStep = flowDef.steps[flowDef.initialStep];
    if (!initialStep) {
      console.error(`Initial step not found for flow: ${flowId}`);
      return null;
    }

    // Initialize flow in memory service
    memoryService.updateMultiStepFlow(
      sessionId,
      flowId,
      flowDef.initialStep,
      { context: context || {} }
    );

    return {
      message: initialStep.message,
      options: initialStep.options,
      flowStep: initialStep.id
    };
  }

  /**
   * Process user input for current flow step
   */
  public async processFlowInput(
    sessionId: string,
    visitorId: string,
    userInput: string
  ): Promise<{
    message: string;
    options?: string[];
    flowStep?: string;
    completed?: boolean;
    data?: any;
  } | null> {
    const context = await memoryService.getConversationContext(sessionId, visitorId);
    const multiStepFlow = context.multiStepFlow;

    if (!multiStepFlow) {
      return null;
    }

    const flowDef = FLOW_DEFINITIONS[multiStepFlow.flowType];
    if (!flowDef) {
      return null;
    }

    const currentStep = flowDef.steps[multiStepFlow.currentStep];
    if (!currentStep) {
      return null;
    }

    // Validate input if validation function exists
    if (currentStep.validation) {
      const validationResult = currentStep.validation(userInput);
      if (validationResult !== true) {
        return {
          message: typeof validationResult === 'string' 
            ? validationResult 
            : 'Por favor, forneça uma resposta válida.',
          options: currentStep.options,
          flowStep: currentStep.id
        };
      }
    }

    // Store the user's response
    const updatedData = {
      ...multiStepFlow.collectedData,
      [currentStep.id]: userInput
    };

    // Determine next step
    let nextStepId: string | undefined;
    if (typeof currentStep.nextStep === 'function') {
      nextStepId = currentStep.nextStep(userInput);
    } else {
      nextStepId = currentStep.nextStep;
    }

    if (!nextStepId) {
      // Flow completed
      if (currentStep.onComplete) {
        await currentStep.onComplete(updatedData);
      }

      // Clear the flow from memory
      memoryService.updateMultiStepFlow(sessionId, '', '', {});

      return {
        message: currentStep.message,
        completed: true,
        data: updatedData
      };
    }

    const nextStep = flowDef.steps[nextStepId];
    if (!nextStep) {
      console.error(`Next step not found: ${nextStepId}`);
      return null;
    }

    // Update flow state
    memoryService.updateMultiStepFlow(
      sessionId,
      multiStepFlow.flowType,
      nextStepId,
      updatedData,
      nextStep.nextStep as string
    );

    // Handle completion step
    if (nextStep.type === 'completion') {
      if (nextStep.onComplete) {
        await nextStep.onComplete(updatedData);
      }

      // Clear the flow from memory
      memoryService.updateMultiStepFlow(sessionId, '', '', {});

      return {
        message: nextStep.message,
        completed: true,
        data: updatedData
      };
    }

    return {
      message: nextStep.message,
      options: nextStep.options,
      flowStep: nextStep.id
    };
  }

  /**
   * Handle flow interruption
   */
  public async handleInterruption(
    sessionId: string,
    visitorId: string,
    interruptingMessage: string
  ): Promise<{ canResume: boolean; resumeMessage?: string }> {
    const context = await memoryService.getConversationContext(sessionId, visitorId);
    const multiStepFlow = context.multiStepFlow;

    if (!multiStepFlow) {
      return { canResume: false };
    }

    const flowDef = FLOW_DEFINITIONS[multiStepFlow.flowType];
    if (!flowDef || !flowDef.canInterrupt) {
      return { canResume: false };
    }

    // Store interruption context
    const interruptionData = {
      ...multiStepFlow.collectedData,
      interruption: {
        message: interruptingMessage,
        timestamp: new Date().toISOString(),
        step: multiStepFlow.currentStep
      }
    };

    memoryService.updateMultiStepFlow(
      sessionId,
      multiStepFlow.flowType,
      multiStepFlow.currentStep,
      interruptionData
    );

    return {
      canResume: true,
      resumeMessage: flowDef.resumeMessage || 'Podemos continuar onde ficámos?'
    };
  }

  /**
   * Resume interrupted flow
   */
  public async resumeFlow(
    sessionId: string,
    visitorId: string
  ): Promise<{ message: string; options?: string[]; flowStep: string } | null> {
    const context = await memoryService.getConversationContext(sessionId, visitorId);
    const multiStepFlow = context.multiStepFlow;

    if (!multiStepFlow) {
      return null;
    }

    const flowDef = FLOW_DEFINITIONS[multiStepFlow.flowType];
    if (!flowDef) {
      return null;
    }

    const currentStep = flowDef.steps[multiStepFlow.currentStep];
    if (!currentStep) {
      return null;
    }

    return {
      message: currentStep.message,
      options: currentStep.options,
      flowStep: currentStep.id
    };
  }

  /**
   * Cancel current flow
   */
  public async cancelFlow(sessionId: string): Promise<void> {
    memoryService.updateMultiStepFlow(sessionId, '', '', {});
  }

  /**
   * Get current flow status
   */
  public async getFlowStatus(
    sessionId: string,
    visitorId: string
  ): Promise<{
    active: boolean;
    flowType?: string;
    currentStep?: string;
    progress?: number;
    canInterrupt?: boolean;
  }> {
    const context = await memoryService.getConversationContext(sessionId, visitorId);
    const multiStepFlow = context.multiStepFlow;

    if (!multiStepFlow || !multiStepFlow.flowType) {
      return { active: false };
    }

    const flowDef = FLOW_DEFINITIONS[multiStepFlow.flowType];
    if (!flowDef) {
      return { active: false };
    }

    // Calculate progress
    const totalSteps = Object.keys(flowDef.steps).length;
    const completedSteps = Object.keys(multiStepFlow.collectedData).length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    return {
      active: true,
      flowType: multiStepFlow.flowType,
      currentStep: multiStepFlow.currentStep,
      progress,
      canInterrupt: flowDef.canInterrupt
    };
  }

  /**
   * Get available flows
   */
  public getAvailableFlows(): Array<{ id: string; name: string; description: string }> {
    return Object.values(FLOW_DEFINITIONS).map(flow => ({
      id: flow.id,
      name: flow.name,
      description: flow.description
    }));
  }
}

// Export singleton instance
export const sessionStateManager = new SessionStateManager();