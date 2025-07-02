import { type NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message, flatId, purchaseTimeframe } =
      await request.json();

    console.log("New Lead Received:");
    console.log({ name, email, phone, message, flatId, purchaseTimeframe });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("leads")
      .insert([
        { name, email, phone, message, flat_id: flatId, purchase_timeframe: purchaseTimeframe },
      ]);
    if (error) {
      throw error;
    }

    // After successfully saving to Supabase, send data to n8n webhook
    const n8nWebhookUrl = 'https://upinvestments.app.n8n.cloud/webhook/d44f0b0a-77be-4c71-8e01-1f79e9ee6063';
    try {
      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, message, flatId, purchaseTimeframe }),
      });

      if (!webhookResponse.ok) {
        // Log an error if the webhook fails, but don't block the user's success message
        const errorBody = await webhookResponse.text();
        console.error(`n8n webhook call failed with status: ${webhookResponse.status}`);
        console.error(`n8n error response: ${errorBody}`);
      } else {
        console.log('Lead successfully sent to n8n webhook.');
      }
    } catch (webhookError) {
      console.error('Error calling n8n webhook:', webhookError);
    }

    return NextResponse.json({ message: "Lead received successfully!" });
  } catch (error) {
    console.error("Error saving lead:", error);
    return NextResponse.json(
      { error: "Failed to save lead." },
      { status: 500 }
    );
  }
} 