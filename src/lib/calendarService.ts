// Calendar Service for Visit Scheduling and Calendar Integration
// Generates .ics files and handles calendar invites

export interface VisitScheduleData {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitType: 'Visita presencial' | 'Visita virtual' | 'Ambas as opções me interessam';
  preferredDate: string;
  preferredTime: string;
  propertyId?: string;
  propertyAddress?: string;
}

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees: string[];
  organizer: string;
}

export class CalendarService {
  private readonly COMPANY_EMAIL = 'vendas@viriato.pt';
  private readonly COMPANY_NAME = 'Viriato - Imobiliária';

  /**
   * Generate a calendar invite (.ics file) for a property visit
   */
  public generateCalendarInvite(scheduleData: VisitScheduleData): string {
    const event = this.createCalendarEvent(scheduleData);
    return this.generateICSContent(event);
  }

  /**
   * Create a calendar event object from visit schedule data
   */
  private createCalendarEvent(scheduleData: VisitScheduleData): CalendarEvent {
    const { startDate, endDate } = this.parseDateTime(scheduleData.preferredDate, scheduleData.preferredTime);
    
    const title = scheduleData.visitType === 'Visita virtual' 
      ? `Visita Virtual - ${scheduleData.propertyId || 'Evergreen Pure'}`
      : `Visita Presencial - ${scheduleData.propertyId || 'Evergreen Pure'}`;

    const description = this.generateEventDescription(scheduleData);
    
    const location = scheduleData.visitType === 'Visita virtual'
      ? 'Online (link será enviado por email)'
      : scheduleData.propertyAddress || 'Evergreen Pure, Santa Joana, Aveiro';

    return {
      title,
      description,
      startDate,
      endDate,
      location,
      attendees: [scheduleData.visitorEmail],
      organizer: this.COMPANY_EMAIL
    };
  }

  /**
   * Generate ICS file content
   */
  private generateICSContent(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `visit-${Date.now()}@viriato.pt`;
    const timestamp = formatDate(new Date());

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Viriato//Property Visit//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location}`,
      `ORGANIZER;CN=${this.COMPANY_NAME}:mailto:${event.organizer}`,
      ...event.attendees.map(email => `ATTENDEE;CN=Visitante:mailto:${email}`),
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete: Visita em 15 minutos',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  /**
   * Parse date and time preferences into actual Date objects
   */
  private parseDateTime(datePreference: string, timePreference: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    let targetDate = new Date();

    // Parse date preference
    switch (datePreference.toLowerCase()) {
      case 'amanhã':
        targetDate.setDate(now.getDate() + 1);
        break;
      case 'esta semana':
        // Next weekday
        const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 1;
        targetDate.setDate(now.getDate() + Math.min(daysUntilFriday, 2));
        break;
      case 'próxima semana':
        const daysUntilNextWeek = 7 - now.getDay() + 1; // Next Monday
        targetDate.setDate(now.getDate() + daysUntilNextWeek);
        break;
      default:
        // Default to next business day
        targetDate.setDate(now.getDate() + 1);
    }

    // Parse time preference
    let startHour = 10; // Default 10 AM
    switch (timePreference.toLowerCase()) {
      case 'manhã (9h-12h)':
        startHour = 10;
        break;
      case 'tarde (14h-17h)':
        startHour = 15;
        break;
      case 'final do dia (17h-19h)':
        startHour = 17;
        break;
      default:
        startHour = 10;
    }

    // Set the time
    targetDate.setHours(startHour, 0, 0, 0);
    
    // Visit duration: 1 hour
    const endDate = new Date(targetDate);
    endDate.setHours(startHour + 1);

    return {
      startDate: targetDate,
      endDate: endDate
    };
  }

  /**
   * Generate event description
   */
  private generateEventDescription(scheduleData: VisitScheduleData): string {
    const lines = [
      `Visita agendada para ${scheduleData.visitorName}`,
      '',
      `Tipo de visita: ${scheduleData.visitType}`,
      `Contacto: ${scheduleData.visitorPhone}`,
      `Email: ${scheduleData.visitorEmail}`,
      ''
    ];

    if (scheduleData.propertyId) {
      lines.push(`Propriedade: ${scheduleData.propertyId}`);
    }

    if (scheduleData.visitType === 'Visita virtual') {
      lines.push('', 'Link da reunião será enviado por email separadamente.');
    } else {
      lines.push('', 'Local: Evergreen Pure, Santa Joana, Aveiro');
      lines.push('Coordenadas: 40.6443° N, 8.6455° W');
    }

    lines.push('', 'Para reagendar ou cancelar, contacte: vendas@viriato.pt');

    return lines.join('\n');
  }

  /**
   * Generate a downloadable calendar invite URL
   */
  public generateCalendarInviteUrl(scheduleData: VisitScheduleData): string {
    const icsContent = this.generateCalendarInvite(scheduleData);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    return URL.createObjectURL(blob);
  }

  /**
   * Generate Google Calendar URL for quick add
   */
  public generateGoogleCalendarUrl(scheduleData: VisitScheduleData): string {
    const event = this.createCalendarEvent(scheduleData);
    
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
      details: event.description,
      location: event.location || '',
      add: event.attendees.join(',')
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate Outlook Calendar URL
   */
  public generateOutlookCalendarUrl(scheduleData: VisitScheduleData): string {
    const event = this.createCalendarEvent(scheduleData);
    
    const params = new URLSearchParams({
      subject: event.title,
      startdt: event.startDate.toISOString(),
      enddt: event.endDate.toISOString(),
      body: event.description,
      location: event.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }
}

// Export singleton instance
export const calendarService = new CalendarService();