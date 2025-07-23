const apiKey = process.env.CALENDLY_API_KEY as string;
const userUri = process.env.CALENDLY_USER_URI as string;

if (!apiKey) {
  throw new Error('CALENDLY_API_KEY is not defined in the environment variables');
}

if (!userUri) {
  throw new Error('CALENDLY_USER_URI is not defined in the environment variables');
}

const calendlyApi = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`https://api.calendly.com${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Calendly API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
  }

  return response.json();
};

export interface CalendlyEvent {
  uri: string;
  name: string;
  scheduling_url: string;
  owner: {
    type: string;
    uri: string;
  };
}

export async function getEventTypes(): Promise<CalendlyEvent[]> {
  try {
    const response = await calendlyApi(`/event_types?user=${userUri}`);
    return response.collection || [];
  } catch (error) {
    console.error('Error fetching Calendly event types:', error);
    throw new Error('Failed to fetch Calendly event types');
  }
}

export async function getEventType(eventName: string): Promise<CalendlyEvent | null> {
  const eventTypes = await getEventTypes();
  const event = eventTypes.find(et => et.name.toLowerCase() === eventName.toLowerCase());
  return event || null;
} 