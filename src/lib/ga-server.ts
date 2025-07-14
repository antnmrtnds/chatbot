const GA_MEASUREMENT_ID = 'GTM-N78NLD6X'; // Replace with your Measurement ID
const GA_API_SECRET = 'ed76a918dc186c51e2192515e574d4c43700db34'; // Replace with your API Secret

type GAEvent = {
  name: string;
  params?: Record<string, string | number>;
};

export const sendGAEvent = async (event: GAEvent, userId?: string) => {
  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: userId || 'anonymous',
          events: [event],
        }),
      }
    );

    if (!response.ok) {
      console.error('GA event not sent:', await response.text());
    }
  } catch (error) {
    console.error('Error sending GA event:', error);
  }
}; 