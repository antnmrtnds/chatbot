import { type NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message, flatId, purchaseTimeframe, visitorId } =
      await request.json();

    let lead_score = 0;

    console.log("New Lead Received:");
    console.log({ name, email, phone, message, flatId, purchaseTimeframe, visitorId });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: updatedLead, error: updateError } = await supabase
      .from("leads_tracking")
      .update({
        contact_name: name,
        contact_email: email,
        contact_phone: phone,
        qualification_answers: { message, purchaseTimeframe, flatId },
        gdpr_consent: true,
        gdpr_consent_date: new Date().toISOString(),
      })
      .eq("visitor_id", visitorId)
      .select("id")
      .single();

    if (updateError) {
      console.error("Error updating lead tracking data:", updateError);
      // Even if the update fails (e.g., no matching visitor_id), we should still save the lead.
      // This could happen if the user blocks trackers.
      const { error: insertError } = await supabase.from("leads").insert([
        { name, email, phone, message, flat_id: flatId, purchase_timeframe: purchaseTimeframe },
      ]);
      if (insertError) throw insertError; // If insert also fails, then it's a server error.
    } else {
      const leadId = updatedLead?.id;
      if (leadId) {
        // Log the high-value interaction
        const { error: interactionError } = await supabase
          .from("visitor_interactions")
          .insert({
            lead_id: leadId,
            visitor_id: visitorId,
            interaction_type: "lead_submission",
            points_awarded: 50,
            details: { name, email, flatId, purchaseTimeframe },
          });

        if (interactionError) {
          console.error("Error creating interaction for lead submission:", interactionError);
        } else {
          // Recalculate score
          const { data: score, error: scoreError } = await supabase.rpc('calculate_lead_score', { lead_uuid: leadId });
          if (scoreError) {
            console.error("Error calculating lead score after submission:", scoreError);
          } else {
            lead_score = score;
            console.log(`Lead ${leadId} scored ${lead_score}`);
          }
        }
      }
    }

    // After successfully saving to Supabase, send data to n8n webhook
    const n8nWebhookUrl = 'https://upinvestments.app.n8n.cloud/webhook/d44f0b0a-77be-4c71-8e01-1f79e9ee6063';
    try {
      const webhookResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, message, flatId, purchaseTimeframe, visitorId, lead_score }),
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

export async function PATCH(request: NextRequest) {
  try {
    const { visitorId, leadData, leadScore, flatId } = await request.json();

    console.log("Updating visitor lead data:");
    console.log({ visitorId, leadData, leadScore, flatId });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update the leads_tracking table with qualification data
    const { data: updatedLead, error: updateError } = await supabase
      .from("leads_tracking")
      .update({
        qualification_answers: {
          ...leadData,
          flat_id: flatId,
          last_updated: new Date().toISOString()
        },
        lead_score: leadScore,
        updated_at: new Date().toISOString()
      })
      .eq("visitor_id", visitorId)
      .select("id")
      .single();

    if (updateError) {
      console.error("Error updating visitor lead data:", updateError);
      return NextResponse.json(
        { error: "Failed to update visitor data." },
        { status: 500 }
      );
    }

    // Log the qualification interaction
    if (updatedLead?.id) {
      const { error: interactionError } = await supabase
        .from("visitor_interactions")
        .insert({
          lead_id: updatedLead.id,
          visitor_id: visitorId,
          interaction_type: "lead_qualification",
          points_awarded: 10,
          details: { leadData, leadScore, flatId },
        });

      if (interactionError) {
        console.error("Error creating qualification interaction:", interactionError);
      }
    }

    return NextResponse.json({ 
      message: "Visitor data updated successfully!",
      leadScore: leadScore
    });
  } catch (error) {
    console.error("Error updating visitor data:", error);
    return NextResponse.json(
      { error: "Failed to update visitor data." },
      { status: 500 }
    );
  }
} 