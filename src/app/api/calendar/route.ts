import { NextRequest, NextResponse } from 'next/server';
import { calendarService, VisitScheduleData } from '@/lib/calendarService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleData, action } = body;

    if (!scheduleData) {
      return NextResponse.json(
        { error: 'Schedule data is required' },
        { status: 400 }
      );
    }

    const visitData: VisitScheduleData = {
      visitorName: scheduleData.visitorName,
      visitorEmail: scheduleData.visitorEmail,
      visitorPhone: scheduleData.visitorPhone,
      visitType: scheduleData.visitType,
      preferredDate: scheduleData.preferredDate,
      preferredTime: scheduleData.preferredTime,
      propertyId: scheduleData.propertyId || 'Evergreen Pure',
      propertyAddress: scheduleData.propertyAddress || 'Santa Joana, Aveiro'
    };

    switch (action) {
      case 'generate_ics':
        const icsContent = calendarService.generateCalendarInvite(visitData);
        
        return new NextResponse(icsContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="visita-evergreen-pure.ics"'
          }
        });

      case 'google_calendar':
        const googleUrl = calendarService.generateGoogleCalendarUrl(visitData);
        return NextResponse.json({ url: googleUrl });

      case 'outlook_calendar':
        const outlookUrl = calendarService.generateOutlookCalendarUrl(visitData);
        return NextResponse.json({ url: outlookUrl });

      case 'send_invite':
        // Generate calendar invite and send confirmation email
        const ics = calendarService.generateCalendarInvite(visitData);
        
        // In a real implementation, this would send an email with the ICS attachment
        console.log('Sending calendar invite email:', {
          to: visitData.visitorEmail,
          subject: `Confirmação de Visita - ${visitData.propertyId}`,
          attachments: [{
            filename: 'visita.ics',
            content: ics,
            contentType: 'text/calendar'
          }]
        });

        return NextResponse.json({
          success: true,
          message: 'Calendar invite sent successfully',
          googleUrl: calendarService.generateGoogleCalendarUrl(visitData),
          outlookUrl: calendarService.generateOutlookCalendarUrl(visitData)
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate_ics, google_calendar, outlook_calendar, or send_invite' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'health') {
    return NextResponse.json({
      status: 'healthy',
      service: 'calendar',
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json(
    { error: 'Invalid GET request. Use ?action=health for health check' },
    { status: 400 }
  );
}